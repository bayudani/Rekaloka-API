import { getTopUsers } from '../models/userModels.js';

export const getLeaderboard = async (req, res) => {
    try {
        // Default ambil 10 besar
        const limit = parseInt(req.query.limit) || 10;

        // Panggil Model
        const topUsers = await getTopUsers(limit);

        // Tambahin ranking number (1, 2, 3...) 
        const leaderboardWithRank = topUsers.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        res.status(200).json({
            message: 'Leaderboard berhasil diambil',
            data: leaderboardWithRank
        });

    } catch (error) {
        console.error('Error get leaderboard:', error);
        res.status(500).json({ error: 'Gagal mengambil data leaderboard' });
    }
};