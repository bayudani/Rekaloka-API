import { PrismaClient } from '@prisma/client';
import { calculateDistance } from '../helpers/geo.js';
import { validateImageWithGemini } from '../services/aiService.js';
import { uploadToCloudinary } from '../services/uploader.service.js';
import { checkAndAwardBadges } from '../services/badge.service.js';
import { calculateLevel } from '../helpers/leveling.js'; // <-- Import Helper Leveling

const prisma = new PrismaClient();

// POST /api/v1/game/check-in
// Endpoint utama buat main game (Check-in Lokasi)
export const checkInLocation = async (req, res) => {
    const { hotspotId, userLat, userLong, imageBase64 } = req.body;
    const { userId } = req.user;

    if (!hotspotId || !userLat || !userLong || !imageBase64) {
        return res.status(400).json({ error: 'Data tidak lengkap (butuh hotspotId, GPS, dan Foto)' });
    }

    try {
        // 1. Ambil Data Hotspot dari DB
        const hotspot = await prisma.culturalHotspot.findUnique({
            where: { id: hotspotId }
        });

        if (!hotspot) return res.status(404).json({ error: 'Lokasi budaya tidak ditemukan' });

        // 2. CEK JARAK (Geofencing 100m)
        // Pastikan user beneran ada di lokasi, bukan spoofing GPS dari rumah
        const MAX_DISTANCE_METERS = 100;
        const distance = calculateDistance(userLat, userLong, hotspot.latitude, hotspot.longitude);

        if (distance > MAX_DISTANCE_METERS) {
            return res.status(400).json({
                error: 'Kejauhan, bro!',
                message: `Lo berjarak ${Math.round(distance)}m dari lokasi. Mendekat lagi sampe < ${MAX_DISTANCE_METERS}m.`
            });
        }

        // 3. CEK DUPLIKASI CHECK-IN
        // User cuma boleh check-in valid sekali per tempat (biar gak farming EXP di satu tempat)
        const existingCheckIn = await prisma.gameCheckin.findFirst({
            where: { userId, hotspotId, isValidated: true }
        });

        if (existingCheckIn) {
            return res.status(400).json({ error: 'Lo udah pernah check-in di sini, bro. Cari tempat lain!' });
        }

        // 4. VALIDASI AI (Gemini Vision)
        // Bersihin string base64 dulu sebelum dikirim ke AI
        const cleanBase64ForAI = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        // Tanya Gemini: "Ini beneran foto [Nama Tempat] gak?"
        const isImageValid = await validateImageWithGemini(cleanBase64ForAI, hotspot.name);

        if (!isImageValid) {
            return res.status(400).json({
                error: 'AI gagal mengenali tempat ini.',
                message: 'Foto lo gak jelas atau gak sesuai sama lokasi. Coba foto ulang yang jelas!'
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
                    imageUrl: cloudUrl, // Simpan URL Cloudinary
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


        // --- TRIGGER BADGE SYSTEM (Ditaruh SETELAH transaction selesai) ---
        // Cek apakah user berhak dapet badge baru setelah check-in ini
        let newBadgeNotif = null;
        try {
            const earnedBadges = await checkAndAwardBadges(userId);
            if (earnedBadges && earnedBadges.length > 0) {
                newBadgeNotif = `Lo dapet badge baru: ${earnedBadges.map(b => b.name).join(', ')}!`;
            }
        } catch (badgeError) {
            console.error("Gagal cek badge (tapi check-in aman):", badgeError);
            // Gak perlu throw error biar user tetep dapet respon sukses check-in
        }

        // Kirim Respon Sukses ke Frontend
        res.status(200).json({
            message: 'Check-in Berhasil!',
            reward: `+${EXP_REWARD} EXP`,
            validation: 'Lokasi & Foto Valid',
            imageUrl: cloudUrl,
            newBadge: newBadgeNotif // Info badge baru (kalau ada)
        });

    } catch (error) {
        console.error('Error Game Check-in:', error);
        res.status(500).json({ error: 'Gagal melakukan check-in', details: error.message });
    }
};