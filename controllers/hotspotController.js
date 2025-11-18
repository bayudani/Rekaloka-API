import {
    createHotspot,
    findAllHotspots,
    findHotspotById,
    findHotspotsByProvinceId,
    updateHotspot,
    deleteHotspot
} from '../models/hotspotModels.js';
import { uploadToCloudinary } from '../services/uploader.service.js'; // Import uploader

// POST /api/v1/hotspots
export const createNewHotspot = async (req, res) => {
    const {
        name, description, latitude, longitude, type, provinceId,
        imageBase64 // <-- Terima Base64 foto lokasi
    } = req.body;

    if (!name || !latitude || !longitude || !type || !provinceId) {
        return res.status(400).json({ error: 'Data (name, lat, long, type, provinceId) tidak boleh kosong' });
    }

    try {
        // Upload Foto Hotspot (jika ada)
        let imageUrl = null;
        if (imageBase64) {
            imageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_hotspots');
        }

        const newHotspot = await createHotspot({
            name,
            description,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            type,
            provinceId,
            imageUrl // Simpan URL Cloudinary
        });
        res.status(201).json({ message: 'Hotspot baru berhasil dibuat', data: newHotspot });
    } catch (error) {
        console.error('Error create hotspot:', error);
        res.status(500).json({ error: 'Gagal membuat hotspot', details: error.message });
    }
};

// GET /api/v1/hotspots
export const getAllHotspots = async (req, res) => {
    try {
        const hotspots = await findAllHotspots();
        res.status(200).json(hotspots);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
    }
};

// GET /api/v1/hotspots/by-province/:provinceId
export const getHotspotsByProvince = async (req, res) => {
    const { provinceId } = req.params;
    try {
        const hotspots = await findHotspotsByProvinceId(provinceId);
        res.status(200).json(hotspots);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
    }
};

// GET /api/v1/hotspots/:id
export const getHotspotById = async (req, res) => {
    const { id } = req.params;
    try {
        const hotspot = await findHotspotById(id);
        if (!hotspot) {
            return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
        }
        res.status(200).json(hotspot);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
    }
};

// PUT /api/v1/hotspots/:id
export const updateHotspotById = async (req, res) => {
    const { id } = req.params;
    const { imageBase64, ...otherData } = req.body; // Pisahin base64

    try {
        const updateData = { ...otherData };

        // Cek kalo user mau ganti foto
        if (imageBase64) {
            updateData.imageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_hotspots');
        }

        const updatedHotspot = await updateHotspot(id, updateData);
        res.status(200).json({ message: 'Hotspot berhasil di-update', data: updatedHotspot });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
        }
        res.status(500).json({ error: 'Gagal meng-update hotspot', details: error.message });
    }
};

// DELETE /api/v1/hotspots/:id
export const deleteHotspotById = async (req, res) => {
    const { id } = req.params;
    try {
        await deleteHotspot(id);
        res.status(200).json({ message: 'Hotspot berhasil dihapus' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
        }
        res.status(500).json({ error: 'Gagal menghapus hotspot', details: error.message });
    }
};