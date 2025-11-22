import {
    findAllProvinces,
    findProvinceById,
    createProvince,
    updateProvince,
    deleteProvince
} from '../models/provinceModels.js';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../services/uploader.service.js';
import redis from '../services/redis.service.js';
import { calculateDistance } from '../helpers/geo.js';

// --- HELPERS KEY REDIS ---
const KEY_ALL_PROVINCES = 'all_provinces';
const keyProvinceDetail = (id) => `province:${id}`;

// GET /api/provinces
// Support LBS: ?lat=-6.1&long=106.8
export const getProvinces = async (req, res) => {
    const { lat, long } = req.query; // Ambil param dari URL buat fitur LBS

    try {
        let provincesData = [];

        const cacheData = await redis.get(KEY_ALL_PROVINCES);

        if (cacheData) {
            // console.log('🚀 Hit from Redis Cache'); 
            provincesData = JSON.parse(cacheData);
        } else {
            // console.log('🐢 Miss Redis, Fetching DB...');
            provincesData = await findAllProvinces();

            await redis.set(KEY_ALL_PROVINCES, JSON.stringify(provincesData), 'EX', 3600);
        }

        // 2. LOGIKA LBS (Sorting Jarak)
        // Kalo user ngirim lat & long,  urutin datanya sebelum dikirim
        if (lat && long) {
            const userLat = parseFloat(lat);
            const userLong = parseFloat(long);

            const sortedProvinces = provincesData.map(prov => {
                // Kalo provinsi belum punya koordinat di DB, anggep jauh (taruh paling bawah)
                if (!prov.latitude || !prov.longitude) {
                    return { ...prov, distance: 999999999 };
                }

                // Hitung jarak pake rumus Haversine (helpers/geo.js)
                const dist = calculateDistance(userLat, userLong, prov.latitude, prov.longitude);
                return { ...prov, distance: Math.round(dist) }; // Tambahin field 'distance' (meter)
            }).sort((a, b) => a.distance - b.distance); // Urutin Ascending (Terdekat ke Terjauh)

            return res.json(sortedProvinces);
        }

        // 3. Kalo gak ada query LBS, balikin data default
        res.json(provincesData);

    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data provinsi', details: error.message });
    }
};

// GET /api/provinces/:id
export const getProvinceById = async (req, res) => {
    const { id } = req.params;
    const cacheKey = keyProvinceDetail(id);

    try {
        // Cek Cache Detail
        const cacheData = await redis.get(cacheKey);
        if (cacheData) {
            return res.json(JSON.parse(cacheData));
        }

        // Ambil DB
        const province = await findProvinceById(id);

        if (!province) {
            return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
        }

        // Simpen Cache Detail
        await redis.set(cacheKey, JSON.stringify(province), 'EX', 3600);
        res.json(province);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil detail provinsi', details: error.message });
    }
};

// POST /api//provinces
export const createNewProvince = async (req, res) => {
    const {
        name, 
        description,
        backsoundBase64,
        iconicInfoJson,
        logoBase64,
        backgroundBase64,
        latitude,
        longitude
    } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: 'Nama dan deskripsi provinsi tidak boleh kosong' });
    }

    try {
        const iconicInfoString = typeof iconicInfoJson === 'object'
            ? JSON.stringify(iconicInfoJson)
            : iconicInfoJson;

        // Upload Logo ke Cloudinary
        let logoUrl = null;
        if (logoBase64) {
            logoUrl = await uploadToCloudinary(logoBase64, 'rekaloka_provinces/logos');
        }

        // Upload Background ke Cloudinary
        let backgroundUrl = null;
        if (backgroundBase64) {
            backgroundUrl = await uploadToCloudinary(backgroundBase64, 'rekaloka_provinces/backgrounds');
        }

        // audio
        let finalBacksoundUrl = null;
        if (backsoundBase64) {
            finalBacksoundUrl = await uploadAudioToCloudinary(backsoundBase64, 'rekaloka_provinces/audio');
        }

        const newProvince = await createProvince({
            name,
            description,
            backsoundUrl: finalBacksoundUrl,
            iconicInfoJson: iconicInfoString,
            logoUrl,
            backgroundUrl,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null
        });

        await redis.del(KEY_ALL_PROVINCES);

        res.status(201).json({ message: 'Provinsi baru berhasil dibuat', data: newProvince });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Nama provinsi sudah ada' });
        }
        console.error('Error create province:', error);
        res.status(500).json({ message: 'Gagal membuat provinsi', details: error.message });
    }
};

// PUT /api/provinces/:id
export const updateProvinceById = async (req, res) => {
    const { id } = req.params;
    const { logoBase64, backgroundBase64, iconicInfoJson, latitude, longitude, ...otherData } = req.body;

    try {
        // 1. Ambil data lama dulu buat keperluan merging & validasi ID
        const existingProvince = await findProvinceById(id);
        if (!existingProvince) {
            return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
        }

        const updateData = { ...otherData };

        // Update Lat/Long kalau dikirim
        if (latitude) updateData.latitude = parseFloat(latitude);
        if (longitude) updateData.longitude = parseFloat(longitude);

        // --- LOGIC MERGE SMART JSON ---
        // Ini fitur paling penting biar data printilan gak ilang ketiban
        if (iconicInfoJson) {
            let oldInfo = {};
            try {
                if (existingProvince.iconicInfoJson) {
                    oldInfo = typeof existingProvince.iconicInfo === 'object'
                        ? existingProvince.iconicInfo
                        : JSON.parse(existingProvince.iconicInfoJson);
                }
            } catch (e) {
                console.log("Gagal parse info lama, reset ke kosong");
                oldInfo = {};
            }

            const newInfo = typeof iconicInfoJson === 'string'
                ? JSON.parse(iconicInfoJson)
                : iconicInfoJson;

            // Merge: Data baru menimpa key yang sama, tapi key lain tetep aman
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

        // Cek kalo user mau ganti backsound
        if (req.body.backsoundBase64) {
            updateData.backsoundUrl = await uploadAudioToCloudinary(req.body.backsoundBase64, 'rekaloka_provinces/audio');
        }

        const updatedProvince = await updateProvince(id, updateData);

        await redis.del(KEY_ALL_PROVINCES);
        // hapus cache detail biar gak kadaluarsa
        await redis.del(keyProvinceDetail(id));

        res.status(200).json({ message: 'Provinsi berhasil di-update', data: updatedProvince });
    } catch (error) {
        console.error('Error update province:', error);
        res.status(500).json({ error: 'Gagal meng-update provinsi', details: error.message });
    }
};

// DELETE /api/provinces/:id
export const deleteProvinceById = async (req, res) => {
    const { id } = req.params;

    try {
        await deleteProvince(id);

        await redis.del(KEY_ALL_PROVINCES);
        await redis.del(keyProvinceDetail(id));

        res.status(200).json({ message: 'Provinsi berhasil dihapus' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Provinsi tidak ditemukan' });
        }
        console.error('Error delete province:', error);
        res.status(500).json({ error: 'Gagal menghapus provinsi', details: error.message });
    }
};