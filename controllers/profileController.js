import { PrismaClient } from '@prisma/client';
import { getUserProfile, getUserExpAndLevel } from '../models/UserModels.js';
const prisma = new PrismaClient();



// get profile
export const getProfile = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await getUserProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error get profile:', error);
        res.status(500).json({ error: 'Gagal mendapatkan profile' });
    }
};

// get exp and level
export const getExpAndLevel = async (req, res) => {
    const userId = req.user.userId;
    try {
        const userStats = await getUserExpAndLevel(userId);
        if (!userStats) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.status(200).json(userStats);
    } catch (error) {
        console.error('Error get exp and level:', error);
        res.status(500).json({ error: 'Gagal mendapatkan exp and level' });
    }
};
// GET /api//profile/history
// Mengambil riwayat check-in user yang sedang login
export const getCheckInHistory = async (req, res) => {
    const { userId } = req.user; // Ambil dari token

    try {
        const history = await prisma.gameCheckin.findMany({
            where: {
                userId: userId,
                isValidated: true // Cuma ambil yang sukses aja
            },
            include: {
                hotspot: { // Join ke tabel hotspot biar dapet namanya
                    select: {
                        name: true,
                        type: true,
                        provinceId: true,
                        imageUrl: true // Bisa tampilin foto lokasi aslinya juga kalo mau
                    }
                }
            },
            orderBy: {
                timestamp: 'desc' // Urutin dari yang paling baru
            }
        });

        res.status(200).json({
            message: 'History check-in berhasil diambil',
            data: history
        });

    } catch (error) {
        console.error('Error get history:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat check-in', details: error.message });
    }
};