import { PrismaClient } from '@prisma/client';
import { getUserProfile, getUserExpAndLevel, getUserPasswordHash, updateUserProfile } from '../models/userModels.js';
import bcrypt from 'bcrypt';
import { calculateLevelProgress } from '../helpers/leveling.js'; 

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
// Update Info Dasar (Saat ini baru Username)
export const updateProfile = async (req, res) => {
    const { userId } = req.user;
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username tidak boleh kosong' });
    }

    try {
        // Cek username unik
        //  cek apakah ada user LAIN (bukan diri sendiri) yang pake username ini
        const existingUser = await prisma.user.findFirst({
            where: {
                username: username,
                NOT: { id: userId }
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username sudah dipakai orang lain, cari yang lebih unik!' });
        }

        const updatedUser = await updateUserProfile(userId, { username });

        res.json({
            message: 'Profil berhasil diperbarui',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Gagal update profil', details: error.message });
    }
};


// Ganti Password dengan Validasi Password Lama (Wajib aman!)
export const changePassword = async (req, res) => {
    const { userId } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    try {
        // 1. Ambil hash password lama dari DB (karena di getUserProfile biasanya di-hidden)
        const currentPasswordHash = await getUserPasswordHash(userId);

        if (!currentPasswordHash) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        // 2. Bandingkan password lama yg dikirim user vs hash di DB
        const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Password lama salah!' });
        }

        // 3. Hash password baru
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 4. Update di DB
        await updateUserProfile(userId, { password: newPasswordHash });

        res.json({ message: 'Password berhasil diubah! Silakan login ulang.' });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ error: 'Gagal mengubah password', details: error.message });
    }
};

// get exp and level
export const getExpAndLevel = async (req, res) => {
    const { userId } = req.user;
    try {
        const userData = await getUserExpAndLevel(userId);
        
        if (!userData) return res.status(404).json({ error: 'User not found' });

        // Pake Helper buat hitung detail progress (Current, Next, Percent)
        const progressStats = calculateLevelProgress(userData.exp);

        res.json({
            message: "Data Level & EXP berhasil diambil",
            data: progressStats
        });
    } catch (error) {
        console.error("Error fetch level:", error);
        res.status(500).json({ error: 'Error fetching exp/level' });
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