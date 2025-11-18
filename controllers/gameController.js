import { PrismaClient } from "@prisma/client";
import { calculateDistance } from "../helpers/geo.js";
import { validateImageWithGemini } from "../services/aiService.js";
import { uploadToCloudinary } from "../services/uploader.service.js";
import { checkAndAwardBadges } from "../services/badge.service.js";

const prisma = new PrismaClient();

// POST /api/v1/game/check-in
export const checkInLocation = async (req, res) => {
    const { hotspotId, userLat, userLong, imageBase64 } = req.body;
    const { userId } = req.user;

    if (!hotspotId || !userLat || !userLong || !imageBase64) {
        return res
            .status(400)
            .json({ error: "Data tidak lengkap (butuh hotspotId, GPS, dan Foto)" });
    }

    try {
        // 1. Ambil Data Hotspot dari DB
        const hotspot = await prisma.culturalHotspot.findUnique({
            where: { id: hotspotId },
        });

        if (!hotspot) {
            return res.status(404).json({ error: "Lokasi budaya tidak ditemukan" });
        }

        // 2. CEK JARAK (Geofencing)
        const MAX_DISTANCE_METERS = 100;
        const distance = calculateDistance(
            userLat,
            userLong,
            hotspot.latitude,
            hotspot.longitude
        );

        if (distance > MAX_DISTANCE_METERS) {
            return res.status(400).json({
                error: "Jarak terlalu Jauh!",
                message: `berjarak ${Math.round(
                    distance
                )}m dari lokasi. Mendekat lagi sampe < ${MAX_DISTANCE_METERS}m.`,
            });
        }

        // 3. CEK DUPLIKASI
        const existingCheckIn = await prisma.gameCheckin.findFirst({
            where: {
                userId: userId,
                hotspotId: hotspotId,
                isValidated: true,
            },
        });

        if (existingCheckIn) {
            return res
                .status(400)
                .json({
                    error: "udah pernah check-in di sini. Cari tempat lain!",
                });
        }

        // 4. VALIDASI AI (Gemini Vision)
        // Gemini butuh base64 murni (tanpa prefix)
        const cleanBase64ForAI = imageBase64.replace(
            /^data:image\/\w+;base64,/,
            ""
        );

        // Cek dulu valid apa tidak
        const isImageValid = await validateImageWithGemini(
            cleanBase64ForAI,
            hotspot.name
        );

        if (!isImageValid) {
            return res.status(400).json({
                error: "AI gagal mengenali tempat ini.",
                message:
                    "Foto gak jelas atau gak sesuai sama lokasi. Coba foto ulang yang jelas!",
            });
        }

        // 5. SUKSES! Upload Bukti ke Cloudinary
        // Cloudinary nerima base64 lengkap (pake prefix data:image gak masalah)
        const cloudUrl = await uploadToCloudinary(imageBase64, "rekaloka_proofs");

        const EXP_REWARD = 100;

        await prisma.$transaction(async (tx) => {
            // Buat record check-in dengan URL Cloudinary
            await tx.gameCheckin.create({
                data: {
                    userId,
                    hotspotId,
                    imageUrl: cloudUrl, // <-- Link HTTPS Cloudinary
                    isValidated: true,
                },
            });

            const currentUser = await tx.user.findUnique({ where: { id: userId } });
            const newExp = currentUser.exp + EXP_REWARD;
            const newLevel = Math.floor(newExp / 1000) + 1;

            await tx.user.update({
                where: { id: userId },
                data: {
                    exp: newExp,
                    level: newLevel,
                },
            });
        });

        const earnedBadges = await checkAndAwardBadges(userId);

        // Cek ada badge baru gak buat notif
        const newBadgeNotif =
            earnedBadges.length > 0
                ? `Lo dapet badge baru: ${earnedBadges.map((b) => b.name).join(", ")}!`
                : null;
        res.status(200).json({
            message: "Check-in Berhasil! GGWP!",
            reward: `+${EXP_REWARD} EXP`,
            validation: "Lokasi & Foto Valid",
            imageUrl: cloudUrl, // Balikin URL biar FE bisa nampilin
            newBadge: newBadgeNotif,
        });
    } catch (error) {
        console.error("Error Game Check-in:", error);
        res
            .status(500)
            .json({ error: "Gagal melakukan check-in", details: error.message });
    }
};
