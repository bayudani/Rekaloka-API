import {
  createHotspot,
  findAllHotspots,
  findHotspotById,
  findHotspotsByProvinceId,
  updateHotspot,
  deleteHotspot
} from '../models/hotspotModels.js';
import { findProvinceById } from '../models/provinceModels.js';

import { uploadToCloudinary } from '../services/uploader.service.js';
import redis from '../services/redis.service.js';
import { calculateDistance } from '../helpers/geo.js';

// --- HELPERS KEY REDIS ---
const KEY_ALL_HOTSPOTS = 'all_hotspots';
const keyHotspotDetail = (id) => `hotspot:${id}`;
const keyHotspotsByProvince = (provinceId) => `hotspots:province:${provinceId}`;

// GET /api/hotspots/nearby
export const getNearbyHotspots = async (req, res) => {
  const { lat, long, radius } = req.query;

  if (!lat || !long) {
    return res.status(400).json({ error: 'Wajib kirim parameter lat dan long' });
  }

  try {
    const userLat = parseFloat(lat);
    const userLong = parseFloat(long);
    const searchRadius = radius ? parseFloat(radius) * 1000 : 10000; // Default 10 KM

    // Cek validitas float
    if (isNaN(userLat) || isNaN(userLong)) {
      return res.status(400).json({ error: 'Format lat/long salah. Jangan pakai tanda kurung {}' });
    }

    let hotspotsData = [];

    const cachedData = await redis.get(KEY_ALL_HOTSPOTS);
    if (cachedData) {
      hotspotsData = JSON.parse(cachedData);
    } else {
      hotspotsData = await findAllHotspots();
      await redis.set(KEY_ALL_HOTSPOTS, JSON.stringify(hotspotsData), 'EX', 3600);
    }

    const nearbyHotspots = hotspotsData
      .map(spot => {
        if (!spot.latitude || !spot.longitude) return null;
        const dist = calculateDistance(userLat, userLong, spot.latitude, spot.longitude);
        return { ...spot, distance: Math.round(dist) };
      })
      .filter(spot => spot !== null && spot.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      message: `Ditemukan ${nearbyHotspots.length} lokasi di sekitar kamu`,
      radius_km: searchRadius / 1000,
      data: nearbyHotspots
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mencari lokasi sekitar',
      error: error.message,
    });
  }
};

// GET /api/hotspots/by-province/:provinceId
export const getHotspotsByProvince = async (req, res) => {
  const { provinceId } = req.params;
  const cacheKey = keyHotspotsByProvince(provinceId);

  try {
    // 1. Cek Cache Dulu (Kalo ada langsung return)
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2.  Validasi: Cek apakah Provinsinya beneran ada di DB?
    const provinceExists = await findProvinceById(provinceId);
    if (!provinceExists) {
      // Kalo ID Provinsinya gak ketemu, langsung return 404
      return res.status(404).json({ 
        status: false,
        message: 'Provinsi tidak ditemukan. ID Provinsi salah.' 
      });
    }

    // 3. Ambil Hotspot dari DB (Kalo provinsi valid)
    const hotspots = await findHotspotsByProvinceId(provinceId);

    // Simpen Redis
    await redis.set(cacheKey, JSON.stringify(hotspots), 'EX', 3600);

    res.status(200).json(hotspots);
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: 'Gagal mengambil data hotspot', 
      details: error.message 
    });
  }
};

// POST /api/hotspots
export const createNewHotspot = async (req, res) => {
  const {
    name, description, latitude, longitude, type, provinceId,
    imageBase64
  } = req.body;

  if (!name || !latitude || !longitude || !type || !provinceId) {
    return res.status(400).json({ message: 'Data (name, lat, long, type, provinceId) tidak boleh kosong' });
  }

  try {
    // Validasi ID Provinsi pas create juga penting
    const provinceExists = await findProvinceById(provinceId);
    if (!provinceExists) {
      return res.status(404).json({ message: 'ID Provinsi tidak valid/tidak ditemukan' });
    }

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
      imageUrl
    });

    await redis.del(KEY_ALL_HOTSPOTS);
    await redis.del(keyHotspotsByProvince(provinceId));

    res.status(201).json({ message: 'Hotspot baru berhasil dibuat', data: newHotspot });
  } catch (error) {
    console.error('Error create hotspot:', error);
    res.status(500).json({ message: 'Gagal membuat hotspot', details: error.message });
  }
};

// GET /api/hotspots (Ambil Semua)
export const getAllHotspots = async (req, res) => {
  try {
    const cachedData = await redis.get(KEY_ALL_HOTSPOTS);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const hotspots = await findAllHotspots();
    await redis.set(KEY_ALL_HOTSPOTS, JSON.stringify(hotspots), 'EX', 3600);

    res.status(200).json(hotspots);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data hotspot', details: error.message });
  }
};

// GET /api/hotspots/:id
export const getHotspotById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = keyHotspotDetail(id);

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const hotspot = await findHotspotById(id);
    if (!hotspot) {
      return res.status(404).json({ message: 'Hotspot tidak ditemukan' });
    }

    await redis.set(cacheKey, JSON.stringify(hotspot), 'EX', 3600);
    res.status(200).json(hotspot);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data hotspot', details: error.message });
  }
};

// PUT /api/hotspots/:id
export const updateHotspotById = async (req, res) => {
  const { id } = req.params;
  const { imageBase64, ...otherData } = req.body;

  try {
    const existingHotspot = await findHotspotById(id);
    if (!existingHotspot) {
      return res.status(404).json({ message: 'Hotspot tidak ditemukan' });
    }

    const updateData = { ...otherData };
    if (imageBase64) {
      updateData.imageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_hotspots');
    }

    const updatedHotspot = await updateHotspot(id, updateData);

    await redis.del(KEY_ALL_HOTSPOTS);
    await redis.del(keyHotspotDetail(id));
    if (existingHotspot.provinceId) {
      await redis.del(keyHotspotsByProvince(existingHotspot.provinceId));
    }

    res.status(200).json({ message: 'Hotspot berhasil di-update', data: updatedHotspot });
  } catch (error) {
    console.error('Error update hotspot:', error);
    res.status(500).json({ error: 'Gagal meng-update hotspot', details: error.message });
  }
};

// DELETE /api/hotspots/:id
export const deleteHotspotById = async (req, res) => {
  const { id } = req.params;
  try {
    const existingHotspot = await findHotspotById(id);

    await deleteHotspot(id);

    await redis.del(KEY_ALL_HOTSPOTS);
    await redis.del(keyHotspotDetail(id));
    if (existingHotspot && existingHotspot.provinceId) {
      await redis.del(keyHotspotsByProvince(existingHotspot.provinceId));
    }

    res.status(200).json({ message: 'Hotspot berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Hotspot tidak ditemukan' });
    }
    res.status(500).json({ error: 'Gagal menghapus hotspot', details: error.message });
  }
};