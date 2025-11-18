// Impor dari model
import {
    findAllProvinces,
    findProvinceById,
    createProvince,
    updateProvince,
    deleteProvince
} from '../models/provinceModels.js';

// GET /api/v1/provinces
export const getProvinces = async (req, res) => {
    try {
        // 1. Panggil Model
        const provinces = await findAllProvinces();
        // 2. Kirim Respon
        res.json(provinces);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data provinsi', details: error.message });
    }
};

// GET /api/v1/provinces/:id
export const getProvinceById = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Panggil Model
        const province = await findProvinceById(id);

        // 2. Logic di Controller
        if (!province) {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }

        // 3. Kirim Respon
        res.json(province);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil detail provinsi', details: error.message });
    }
};

// --- CRUD BARU MULAI DARI SINI ---

// POST /api/v1/provinces
export const createNewProvince = async (req, res) => {
    const { name, description, backsoundUrl, iconicInfoJson } = req.body;

    // Validasi simpel
    if (!name || !description) {
        return res.status(400).json({ error: 'Nama dan deskripsi provinsi tidak boleh kosong' });
    }

    try {
        const newProvince = await createProvince({
            name,
            description,
            backsoundUrl,
            iconicInfoJson
        });
        res.status(201).json({ message: 'Provinsi baru berhasil dibuat', data: newProvince });
    } catch (error) {
        // Kalo nama provinsinya udah ada
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
    const data = req.body; // Ambil data baru dari body

    try {
        const updatedProvince = await updateProvince(id, data);
        res.status(200).json({ message: 'Provinsi berhasil di-update', data: updatedProvince });
    } catch (error) {
        // Kalo provinsinya gak ketemu
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }
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
        // Kalo provinsinya gak ketemu
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }
        console.error('Error delete province:', error);
        res.status(500).json({ error: 'Gagal menghapus provinsi', details: error.message });
    }
};