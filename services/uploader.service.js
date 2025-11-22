import { v2 as cloudinary } from 'cloudinary';


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

export const uploadAudioToCloudinary = async (fileString, folder) => {
    try {
        // 1. VALIDASI: Cek kosong gak
        if (!fileString || typeof fileString !== 'string') {
            throw new Error("String audio kosong atau format salah");
        }

        // 2. SANITIZE: Hapus spasi, tab, atau enter yang nyelip di string base64
        // Ini PENTING banget buat ngehindarin 'Could not decode base64'
        let finalString = fileString.trim().replace(/\s/g, '');

        // 3. AUTO-FIX PREFIX
        // Cloudinary butuh 'data:audio/mpeg;base64,...' buat MP3
        // Kalau prefix gak ada, kita tambahin manual.
        if (!finalString.startsWith('data:')) {
            finalString = `data:audio/mpeg;base64,${finalString}`;
        }

        // console.log("Uploading Audio Header:", finalString.substring(0, 50) + "..."); // Debugging

        const result = await cloudinary.uploader.upload(finalString, {
            folder: folder,
            resource_type: 'video', 
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary Audio Upload Error:', error);
        throw new Error(`Gagal upload audio: ${error.message}`);
    }
};