import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
// Pastikan .env lo udah diisi ya!
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload gambar Base64 ke Cloudinary
 * @param {string} base64String - String gambar base64
 * @param {string} folderName - Nama folder di Cloudinary (biar rapi)
 * @returns {Promise<string>} URL aman (https) dari gambar yang diupload
 */
export const uploadToCloudinary = async (base64String, folderName = 'rekaloka_checkins') => {
    try {
        // Cloudinary pinter, dia bisa baca format "data:image/..." langsung
        // Kita set 'resource_type: auto' biar aman
        const result = await cloudinary.uploader.upload(base64String, {
            folder: folderName,
            resource_type: 'auto',
        });

        return result.secure_url; // Kita cuma butuh link https-nya
    } catch (error) {
        console.error('Gagal upload ke Cloudinary:', error);
        throw new Error('Gagal mengupload gambar bukti.');
    }
};