// Impor dari service
import { getImageFromAI } from '../services/aiService.js';

// POST /api/v1/ai/generate-image
export const generateImage = async (req, res) => {
    const { prompt } = req.body;
    // const { userId } = req.user; // <-- Nanti ambil dari JWT middleware, BUKAN body

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
    }

    try {
        // 1. Panggil Service
        const base64Image = await getImageFromAI(prompt);

        // 2. Kirim respon
        res.json({
            message: 'Gambar 2D berhasil dibuat',
            imageUrl: `data:image/png;base64,${base64Image}`
        });

    } catch (error) {
        console.error('Error di AI Controller:', error);
        res.status(500).json({ error: error.message || 'Gagal menghubungi AI API' });
    }
};