import { PrismaClient } from '@prisma/client';
import { calculateDistance } from '../helpers/geo.js';
import { validateImageWithGemini } from '../services/aiService.js';
import { uploadToCloudinary } from '../services/uploader.service.js';
import { checkAndAwardBadges } from '../services/badge.service.js';
import { calculateLevel } from '../helpers/leveling.js'; 

const prisma = new PrismaClient();

// POST /api/game/check-in
// Endpoint utama buat main game (Check-in Lokasi)
export const checkInLocation = async (req, res) => {
    const { hotspotId, userLat, userLong, imageBase64 } = req.body;
    const { userId } = req.user;

    if (!hotspotId || !userLat || !userLong || !imageBase64) {
        return res.status(400).json({
            status: false,
            message: 'Data tidak lengkap (butuh hotspotId, GPS, dan Foto)' 
        });
    }

    try {
        // 1. Ambil Data Hotspot dari DB
        const hotspot = await prisma.culturalHotspot.findUnique({
            where: { id: hotspotId }
        });

        if (!hotspot) return res.status(404).json({ error: 'Lokasi budaya tidak ditemukan' });

        // 2. CEK JARAK (Geofencing 100m)
        // Pastikan user beneran ada di lokasi, bukan spoofing GPS dari rumah
        const MAX_DISTANCE_METERS = 200;
        const distance = calculateDistance(userLat, userLong, hotspot.latitude, hotspot.longitude);

        if (distance > MAX_DISTANCE_METERS) {
            return res.status(400).json({
                success: false,
                error: 'Kejauhan!',
                message: `Kamu berjarak ${Math.round(distance)}m dari lokasi. Mendekat lagi sampe < ${MAX_DISTANCE_METERS}m.`
            });
        }

        // 3. CEK DUPLIKASI CHECK-IN
        // User cuma boleh check-in valid sekali per tempat
        const existingCheckIn = await prisma.gameCheckin.findFirst({
            where: { userId, hotspotId, isValidated: true }
        });

        if (existingCheckIn) {
            return res.status(400).json({ error: 'Kamu sudah pernah check-in di sini. Cari tempat lain!' });
        }

        // 4. VALIDASI AI (Gemini Vision)
        // Bersihin string base64 dulu sebelum dikirim ke AI
        const cleanBase64ForAI = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        // Tanya Gemini: "Ini beneran foto [Nama Tempat]?"
        const isImageValid = await validateImageWithGemini(cleanBase64ForAI, hotspot.name);

        if (!isImageValid) {
            return res.status(400).json({
                success: false,
                error: 'AI gagal mengenali tempat ini.',
                message: 'Foto Kamu gak jelas atau gak sesuai sama lokasi. Coba foto ulang yang jelas!'
            });
        }

        // 5. SUKSES! Upload Bukti ke Cloudinary
        // Kita upload cuma kalau udah lolos validasi AI, biar hemat storage
        const cloudUrl = await uploadToCloudinary(imageBase64, 'rekaloka_proofs');

        const EXP_REWARD = 100; // Reward EXP standar per check-in

        // --- TRANSAKSI DATABASE (Atomic Operation) ---
        // Simpan Check-in DAN Update User EXP/Level secara bersamaan
        await prisma.$transaction(async (tx) => {
            // A. Buat record check-in
            await tx.gameCheckin.create({
                data: {
                    userId,
                    hotspotId,
                    imageUrl: cloudUrl,
                    isValidated: true
                }
            });

            // B. Ambil data user terkini
            const currentUser = await tx.user.findUnique({ where: { id: userId } });

            // C. Hitung EXP Baru
            const newExp = currentUser.exp + EXP_REWARD;

            // D. Hitung Level Baru (Pake rumus Eksponensial/Akar Kuadrat)
            const newLevel = calculateLevel(newExp);

            // E. Update User di DB
            await tx.user.update({
                where: { id: userId },
                data: { exp: newExp, level: newLevel }
            });
        });
        // --- END TRANSACTION ---


        // --- TRIGGER BADGE SYSTEM ---
        // Cek apakah user berhak dapet badge baru setelah check-in ini
        let newBadgeNotif = null;
        try {
            const earnedBadges = await checkAndAwardBadges(userId);
            if (earnedBadges && earnedBadges.length > 0) {
                newBadgeNotif = `Kamu dapet badge baru: ${earnedBadges.map(b => b.name).join(', ')}!`;
            }
        } catch (badgeError) {
            console.error("Gagal cek badge (tapi check-in aman):", badgeError);
            // Gak perlu throw error biar user tetep dapet respon sukses check-in
        }

        // Kirim Respon Sukses ke Frontend
        res.status(200).json({
            status: true,
            message: 'Check-in Berhasil!',
            reward: `+${EXP_REWARD} EXP`,
            validation: 'Lokasi & Foto Valid',
            imageUrl: cloudUrl,
            newBadge: newBadgeNotif // Info badge baru (kalau ada)
        });

    } catch (error) {
        console.error('Error Game Check-in:', error);
        res.status(500).json({ 
            status:false,
            message: 'Gagal melakukan check-in', details: error.message });
    }
};