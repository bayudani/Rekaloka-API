import {
  createHotspot,
  findAllHotspots,
  findHotspotById,
  findHotspotsByProvinceId,
  updateHotspot,
  deleteHotspot
} from '../models/hotspotModels.js';
import { uploadToCloudinary } from '../services/uploader.service.js';
import redis from '../services/redis.service.js';

// --- HELPERS KEY REDIS ---
const KEY_ALL_HOTSPOTS = 'all_hotspots';
const keyHotspotDetail = (id) => `hotspot:${id}`;
const keyHotspotsByProvince = (provinceId) => `hotspots:province:${provinceId}`;

// POST /api/v1/hotspots
export const createNewHotspot = async (req, res) => {
  const { 
    name, description, latitude, longitude, type, provinceId, 
    imageBase64 
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

    // --- HAPUS CACHE (INVALIDATION) ---
    // 1. List semua hotspot basi -> hapus
    await redis.del(KEY_ALL_HOTSPOTS);
    // 2. List hotspot di provinsi ini juga berubah -> hapus
    await redis.del(keyHotspotsByProvince(provinceId));

    res.status(201).json({ message: 'Hotspot baru berhasil dibuat', data: newHotspot });
  } catch (error) {
    console.error('Error create hotspot:', error);
    res.status(500).json({ error: 'Gagal membuat hotspot', details: error.message });
  }
};

// GET /api/v1/hotspots
export const getAllHotspots = async (req, res) => {
  try {
    // 1. CEK CACHE
    const cachedData = await redis.get(KEY_ALL_HOTSPOTS);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2. AMBIL DB
    const hotspots = await findAllHotspots();

    // 3. SIMPEN REDIS (TTL 1 jam)
    await redis.set(KEY_ALL_HOTSPOTS, JSON.stringify(hotspots), 'EX', 3600);

    res.status(200).json(hotspots);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
  }
};

// GET /api/v1/hotspots/by-province/:provinceId
export const getHotspotsByProvince = async (req, res) => {
  const { provinceId } = req.params;
  const cacheKey = keyHotspotsByProvince(provinceId);

  try {
    // 1. CEK CACHE PER PROVINSI
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2. AMBIL DB
    const hotspots = await findHotspotsByProvinceId(provinceId);

    // 3. SIMPEN REDIS (TTL 1 jam)
    await redis.set(cacheKey, JSON.stringify(hotspots), 'EX', 3600);

    res.status(200).json(hotspots);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
  }
};

// GET /api/v1/hotspots/:id
export const getHotspotById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = keyHotspotDetail(id);

  try {
    // 1. CEK CACHE DETAIL
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2. AMBIL DB
    const hotspot = await findHotspotById(id);
    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
    }

    // 3. SIMPEN REDIS (TTL 1 jam)
    await redis.set(cacheKey, JSON.stringify(hotspot), 'EX', 3600);

    res.status(200).json(hotspot);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
  }
};

// PUT /api/v1/hotspots/:id
export const updateHotspotById = async (req, res) => {
  const { id } = req.params;
  const { imageBase64, ...otherData } = req.body; 

  try {
    // Ambil data lama dulu buat tau dia ada di provinceId mana
    const existingHotspot = await findHotspotById(id);
    if (!existingHotspot) {
      return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
    }

    const updateData = { ...otherData };

    // Cek kalo user mau ganti foto
    if (imageBase64) {
      updateData.imageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_hotspots');
    }

    const updatedHotspot = await updateHotspot(id, updateData);

    // --- HAPUS CACHE (INVALIDATION) ---
    // 1. Hapus list utama
    await redis.del(KEY_ALL_HOTSPOTS);
    // 2. Hapus detail item ini
    await redis.del(keyHotspotDetail(id));
    // 3. Hapus list provinsi tempat hotspot ini berada
    if (existingHotspot.provinceId) {
      await redis.del(keyHotspotsByProvince(existingHotspot.provinceId));
    }

    res.status(200).json({ message: 'Hotspot berhasil di-update', data: updatedHotspot });
  } catch (error) {
    console.error('Error update hotspot:', error);
    res.status(500).json({ error: 'Gagal meng-update hotspot', details: error.message });
  }
};

// DELETE /api/v1/hotspots/:id
export const deleteHotspotById = async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil data dulu buat tau provinceId-nya sebelum dihapus
    const existingHotspot = await findHotspotById(id);
    
    await deleteHotspot(id);

    // --- HAPUS CACHE (INVALIDATION) ---
    await redis.del(KEY_ALL_HOTSPOTS);
    await redis.del(keyHotspotDetail(id));
    if (existingHotspot && existingHotspot.provinceId) {
      await redis.del(keyHotspotsByProvince(existingHotspot.provinceId));
    }

    res.status(200).json({ message: 'Hotspot berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Hotspot tidak ditemukan' });
    }
    res.status(500).json({ error: 'Gagal menghapus hotspot', details: error.message });
  }
};