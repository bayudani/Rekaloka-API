import { getImageFromAI, editImageWithAI } from '../services/aiService.js';
import { uploadToCloudinary } from '../services/uploader.service.js';
import { generate3DModel } from '../services/meshy.service.js';

// POST /api/v1/ai/generate-image (Text to Image)
export const generateImage = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
    }

    try {
        // Panggil Service Text-to-Image (Nano Banana / Pollinations)
        // Hasilnya udah berupa string Base64 murni
        const base64Image = await getImageFromAI(prompt);

        res.json({
            message: 'Gambar 2D berhasil dibuat',
            imageUrl: `data:image/png;base64,${base64Image}`
        });

    } catch (error) {
        console.error('Error Generate Image:', error);
        // Kirim error message yang jelas ke frontend biar tau kenapa gagal
        res.status(500).json({ error: error.message || 'Gagal generate gambar' });
    }
};

// POST /api/v1/ai/edit-image (Image to Image / Restorasi)
export const editImage = async (req, res) => {
    const { prompt, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
        return res.status(400).json({ error: 'Prompt dan imageBase64 wajib diisi' });
    }


    try {
        // 1. Upload foto input user (yg mau diedit/restorasi) ke Cloudinary dulu
        //  Nano Banana mode 'IMAGETOIAMGE' butuh input berupa URL publik, bukan base64.
        console.log("Mengupload gambar input ke Cloudinary...");
        const inputImageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_ai_input');

        if (!inputImageUrl) {
            return res.status(500).json({ error: 'Gagal upload gambar input ke server storage' });
        }

        // 2. Panggil Service AI buat Edit
        // Kita kirim URL gambar yg udah diupload tadi
        const resultBase64 = await editImageWithAI(prompt, inputImageUrl);

        res.json({
            message: 'Restorasi/Edit gambar berhasil!',
            originalUrl: inputImageUrl, //  balikin URL foto asli buat perbandingan before/after
            resultImageUrl: `data:image/png;base64,${resultBase64}` // Foto hasil editan (Base64)
        });

    } catch (error) {
        console.error('Error Edit Image:', error);
        res.status(500).json({ error: error.message || 'Gagal mengedit gambar' });
    }
};

// POST /api/v1/ai/generate-3d (Text to 3D - Meshy AI)
export const generate3D = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
    }

    try {
        // Panggil Service Meshy
        const modelUrl = await generate3DModel(prompt);

        res.json({
            message: 'Model 3D berhasil dibuat!',
            modelUrl: modelUrl, // URL .glb yang bisa diload di Flutter
            previewType: 'glb'
        });

    } catch (error) {
        console.error("🔥 Error Generate 3D:", error.message);

        // Cek apakah errornya karena kuota habis/payment
        if (error.message.includes("NoMorePendingTasks") || error.message.includes("upgrade your plan")) {
            return res.status(402).json({ // 402 Payment Required (cocok buat ngasih tau frontend)
                success: false,
                message: "Kuota AI 3D habis atau limit tercapai. Silakan upgrade plan atau gunakan mock data.",
                error: "QUOTA_EXCEEDED"
            });
        }

        // Error server lain
        return res.status(500).json({
            success: false,
            message: "Gagal generate 3D model.",
            error: error.message
        });
    }
};