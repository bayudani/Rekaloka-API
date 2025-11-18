import { uploadToCloudinary } from '../services/uploader.service.js';

// POST /api/v1/upload
export const uploadImage = async (req, res) => {
    const { imageIcon, folder } = req.body;

    if (!imageIcon) {
        return res.status(400).json({ error: 'Image Base64 is required' });
    }

    try {
        // Default folder kalau gak diisi: 'rekaloka_general'
        const targetFolder = folder || 'rekaloka_general';

        const secureUrl = await uploadToCloudinary(imageIcon, targetFolder);

        res.json({
            message: 'Upload berhasil',
            url: secureUrl // Ini yang diambil Frontend
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Gagal upload gambar', details: error.message });
    }
};