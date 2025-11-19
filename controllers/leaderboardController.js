import { getTopUsers } from '../models/userModels.js';
import redis from "../services/redis.service.js";


const KEY_LEADERBOARD = 'leaderboard_data';

export const getLeaderboard = async (req, res) => {
    try {
        // Ambil data dari Redis Cache
        const cachedData = await redis.get(KEY_LEADERBOARD);
        if (cachedData) {
            console.log("Menggunakan data dari Redis Cache");
            return res.json(JSON.parse(cachedData));
        }
        // Default ambil 10 besar
        const limit = parseInt(req.query.limit) || 10;

        // Panggil Model
        const topUsers = await getTopUsers(limit);

        // Tambahin ranking number (1, 2, 3...) 
        const leaderboardWithRank = topUsers.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        // Simpan ke Redis Cache selama 10 menit
        await redis.set(KEY_LEADERBOARD, JSON.stringify(leaderboardWithRank), 'EX', 600);
        res.status(200).json({
            message: 'Leaderboard berhasil diambil',
            data: leaderboardWithRank
        });

    } catch (error) {
        console.error('Error get leaderboard:', error);
        res.status(500).json({ error: 'Gagal mengambil data leaderboard' });
    }
};