import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/location/detect?lat=-7.123&long=110.123
 * Fungsi: Menebak user lagi di Provinsi mana berdasarkan GPS
 */
export const detectUserProvince = async (req, res) => {
    const { lat, long } = req.query;

    // 1. Validasi Input
    if (!lat || !long) {
        return res.status(400).json({ error: "Wajib kirim parameter 'lat' dan 'long' bro!" });
    }

    try {
        // 2. Tembak API OpenStreetMap (Nominatim)
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=5&addressdetails=1`;

        // Timeout 5 detik aja, kelamaan user kabur
        const apiResponse = await axios.get(nominatimUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Rekaloka-App/1.0 (santara.rekaloka@gmail.com)',
                'Accept-Language': 'id-ID'
            }
        });

        // 3. Ambil Nama Provinsi dari Response API
        const address = apiResponse.data.address;

        if (!address || !address.state) {
            return res.status(404).json({
                found: false,
                message: "Lokasi tidak ditemukan.",
                detected: null
            });
        }

        let detectedState = address.state;

        // 4. Logic 'Fuzzy Match' Sederhana
        const cleanName = detectedState
            .replace(/Provinsi/i, '')
            .replace(/Daerah Istimewa/i, '')
            .replace(/DKI/i, '')
            .trim();

        // 5. Cari di Database (Rekaloka DB)
        const matchedProvince = await prisma.province.findFirst({
            where: {
                name: {
                    contains: cleanName
                }
            },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                _count: { select: { hotspots: true } }
            }
        });

        if (!matchedProvince) {
            return res.status(200).json({
                found: false,
                message: `User terdeteksi di '${detectedState}', tapi provinsi ini belum ada di database Rekaloka.`,
                detected_raw: detectedState
            });
        }

        // 6. Sukses!
        return res.status(200).json({
            found: true,
            message: `User berada di ${matchedProvince.name}`,
            detected_raw: detectedState,
            data: matchedProvince
        });

    } catch (error) {
        console.error("🔥 Error Reverse Geocoding:", error.message);

        // --- SAFETY NET BUAT LOMBA ---
        // Kalau error koneksi (ENOTFOUND) atau Timeout, kita Pura-pura Sukses (Mocking)
        if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.log("⚠️ Internet Mati/API Down. Switch ke MODE DEMO (Mock Data).");

            //  cari aja provinsi default di DB (Misal: ID 1 atau yang pertama ketemu)
            const fallbackProvince = await prisma.province.findFirst({
                include: { _count: { select: { hotspots: true } } }
            });

            if (fallbackProvince) {
                return res.status(200).json({
                    found: true,
                    is_offline_mode: true, // Kasih tanda kalo ini mode offline
                    message: `(OFFLINE MODE) User diasumsikan berada di ${fallbackProvince.name}`,
                    detected_raw: "Signal Lost - Fallback",
                    data: fallbackProvince
                });
            }
        }

        return res.status(500).json({
            error: "Gagal mendeteksi lokasi (Server Error).",
            details: error.message
        });
    }
};