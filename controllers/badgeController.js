import { PrismaClient } from '@prisma/client';
import { BADGE_MASTER_LIST } from '../helpers/badgeConstants.js';

const prisma = new PrismaClient();


const mapBadgesWithStatus = (earnedBadges) => {
    // Ambil list nama badge yang udah dimiliki user
    const earnedBadgeNames = earnedBadges.map(b => b.name);

    // loop Master List (Katalog), terus cek satu-satu statusnya
    return BADGE_MASTER_LIST.map(masterBadge => {
        const isUnlocked = earnedBadgeNames.includes(masterBadge.name);
        
        // Kalau unlocked, ambil data detailnya (misal kapan dapetnya)
        const userBadgeData = earnedBadges.find(b => b.name === masterBadge.name);

        return {
            ...masterBadge, // Data statis (ikon, deskripsi, nama)
            isUnlocked: isUnlocked, // Status Kunci (TRUE/FALSE)
            obtainedAt: userBadgeData ? userBadgeData.createdAt : null // Tanggal dapet
        };
    });
};

// GET /api/v1/badges (Badge Saya - Mode Lengkap)
export const getMyBadges = async (req, res) => {
    const { userId } = req.user; // Dari Token

    try {
        // 1. Ambil badge yang SUDAH didapat dari DB
        const earnedBadges = await prisma.badge.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Gabungin sama Master List biar frontend tau mana yang locked
        const badgesStatus = mapBadgesWithStatus(earnedBadges);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil status badge",
            data: badgesStatus
        });

    } catch (error) {
        console.error("Error getMyBadges:", error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data badge' 
        });
    }
};

// GET /api/v1/badges/:userId (Liat Badge Orang Lain - Mode Lengkap)
export const getUserBadges = async (req, res) => {
    const { userId } = req.params;

    try {
        const earnedBadges = await prisma.badge.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });

        const badgesStatus = mapBadgesWithStatus(earnedBadges);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil badge user lain",
            data: badgesStatus
        });

    } catch (error) {
        console.error("Error getUserBadges:", error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal mengambil data badge user lain' 
        });
    }
};