import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET /api/v1/badges (Badge Saya)
export const getMyBadges = async (req, res) => {
    const { userId } = req.user; // Dari Token

    try {
        const badges = await prisma.badge.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' } // Yang baru dapet di atas
        });
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data badge' });
    }
};

// GET /api/v1/badges/:userId (Liat Badge Orang Lain - Optional)
export const getUserBadges = async (req, res) => {
    const { userId } = req.params;

    try {
        const badges = await prisma.badge.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data badge user lain' });
    }
};