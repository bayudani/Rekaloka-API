import {
    findAllProvinces,
    findProvinceById,
    createProvince,
    updateProvince,
    deleteProvince
} from '../models/provinceModels.js';
import { uploadToCloudinary } from '../services/uploader.service.js';

// GET /api/v1/provinces
export const getProvinces = async (req, res) => {
    try {
        const provinces = await findAllProvinces();
        res.json(provinces);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data provinsi', details: error.message });
    }
};

// GET /api/v1/provinces/:id
export const getProvinceById = async (req, res) => {
    const { id } = req.params;
    try {
        const province = await findProvinceById(id);

        if (!province) {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }

        res.json(province);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil detail provinsi', details: error.message });
    }
};

// POST /api/v1/provinces
export const createNewProvince = async (req, res) => {
    const {
        name, description, backsoundUrl, iconicInfoJson,
        logoBase64, backgroundBase64
    } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Nama dan deskripsi provinsi tidak boleh kosong' });
    }

    try {
        // --- FIX OTOMATIS JSON ---
        const iconicInfoString = typeof iconicInfoJson === 'object'
            ? JSON.stringify(iconicInfoJson)
            : iconicInfoJson;

        // Upload Logo
        let logoUrl = null;
        if (logoBase64) {
            logoUrl = await uploadToCloudinary(logoBase64, 'rekaloka_provinces/logos');
        }

        // Upload Background
        let backgroundUrl = null;
        if (backgroundBase64) {
            backgroundUrl = await uploadToCloudinary(backgroundBase64, 'rekaloka_provinces/backgrounds');
        }

        const newProvince = await createProvince({
            name,
            description,
            backsoundUrl,
            iconicInfoJson: iconicInfoString,
            logoUrl,
            backgroundUrl
        });

        res.status(201).json({ message: 'Provinsi baru berhasil dibuat', data: newProvince });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Nama provinsi sudah ada' });
        }
        console.error('Error create province:', error);
        res.status(500).json({ error: 'Gagal membuat provinsi', details: error.message });
    }
};

// PUT /api/v1/provinces/:id
export const updateProvinceById = async (req, res) => {
    const { id } = req.params;
    const { logoBase64, backgroundBase64, iconicInfoJson, ...otherData } = req.body;

    try {
        // 1. Ambil data lama dulu buat keperluan merging
        const existingProvince = await findProvinceById(id);
        if (!existingProvince) {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }

        const updateData = { ...otherData };

        // --- LOGIC MERGE SMART JSON ---
        if (iconicInfoJson) {
            // Parse data lama (kalau ada)
            let oldInfo = {};
            try {
                if (existingProvince.iconicInfoJson) {
                    oldInfo = typeof existingProvince.iconicInfo === 'object'
                        ? existingProvince.iconicInfo // Udah di-parse di model
                        : JSON.parse(existingProvince.iconicInfoJson);
                }
            } catch (e) {
                console.log("Gagal parse info lama, reset ke kosong");
                oldInfo = {};
            }

            // Data baru (pastikan jadi object)
            const newInfo = typeof iconicInfoaJson === 'string'
                ? JSON.parse(iconicInfoJson)
                : iconicInfoJson;

            // GABUNGIN (Merge)! Data baru menimpa key yang sama, tapi key lain tetep aman
            const mergedInfo = { ...oldInfo, ...newInfo };

            updateData.iconicInfoJson = JSON.stringify(mergedInfo);
        }

        // Cek kalo user mau ganti logo
        if (logoBase64) {
            updateData.logoUrl = await uploadToCloudinary(logoBase64, 'rekaloka_provinces/logos');
        }

        // Cek kalo user mau ganti background
        if (backgroundBase64) {
            updateData.backgroundUrl = await uploadToCloudinary(backgroundBase64, 'rekaloka_provinces/backgrounds');
        }

        const updatedProvince = await updateProvince(id, updateData);
        res.status(200).json({ message: 'Provinsi berhasil di-update', data: updatedProvince });
    } catch (error) {
        console.error('Error update province:', error);
        res.status(500).json({ error: 'Gagal meng-update provinsi', details: error.message });
    }
};

// DELETE /api/v1/provinces/:id
export const deleteProvinceById = async (req, res) => {
    const { id } = req.params;

    try {
        await deleteProvince(id);
        res.status(200).json({ message: 'Provinsi berhasil dihapus' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }
        console.error('Error delete province:', error);
        res.status(500).json({ error: 'Gagal menghapus provinsi', details: error.message });
    }
};