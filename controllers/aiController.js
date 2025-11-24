import { getImageFromAI, editImageWithAI } from '../services/aiService.js';
import { uploadToCloudinary } from '../services/uploader.service.js';
// import { generate3DModel } from '../services/meshy.service.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

const COLAB_API_URL = "https://23cb2a7d30e9.ngrok-free.app/"; 

// POST /api/ai/generate-image (Text to Image)
export const generateImage = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt tidak boleh kosong' });
    }

    try {
        // Panggil Service Text-to-Image (Nano Banana / Pollinations)
        // Hasilnya udah berupa string Base64 murni
        const base64Image = await getImageFromAI(prompt);

        res.json({
            message: 'Gambar 2D berhasil dibuat',
            imageUrl: `data:image/png;base64,${base64Image}`
        });

    } catch (error) {
        console.error('Error Generate Image:', error);
        
        res.status(500).json({ error: error.message || 'Gagal generate gambar' });
    }
};

// POST /api/v1/ai/edit-image (Image to Image / Restorasi)
export const editImage = async (req, res) => {
    const { prompt, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
        return res.status(400).json({ message: 'Prompt dan imageBase64 wajib diisi' });
    }


    try {
        // 1. Upload foto input user (yg mau diedit/restorasi) ke Cloudinary dulu
        //  Nano Banana mode 'IMAGETOIAMGE' butuh input berupa URL publik, bukan base64.
        console.log("Mengupload gambar input ke Cloudinary...");
        const inputImageUrl = await uploadToCloudinary(imageBase64, 'rekaloka_ai_input');

        if (!inputImageUrl) {
            return res.status(500).json({ error: 'Gagal upload gambar input ke server storage' });
        }

        // 2. Panggil Service AI buat Edit
        // kirim URL gambar yg udah diupload tadi
        const resultBase64 = await editImageWithAI(prompt, inputImageUrl);

        res.json({
            message: 'Restorasi/Edit gambar berhasil!',
            originalUrl: inputImageUrl, //  balikin URL foto asli buat perbandingan before/after
            resultImageUrl: `data:image/png;base64,${resultBase64}` // Foto hasil editan (Base64)
        });

    } catch (error) {
        console.error('Error Edit Image:', error);
        res.status(500).json({ error: error.message || 'Gagal mengedit gambar' });
    }
};

// POST /api/v1/ai/generate-3d (Text to 3D - Meshy AI)
export const generate3DWithShapE = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt wajib diisi" });

    try {
        console.log(`📡 Sending prompt to Shap-E: ${prompt}`);
        
        // 1. Tembak Server Colab
        const response = await axios.post(`${SHAPE_API_URL}/generate-3d`, {
            prompt: prompt
        }, { timeout: 120000 }); // Timeout 2 menit

        const { base64_model } = response.data;

        if (!base64_model) {
            throw new Error("Colab tidak mengembalikan data base64.");
        }

        // --- FITUR BARU: AUTO SAVE KE LAPTOP ---
        
        // 2. Decode Base64 jadi "Buffer" (Data Mentah)
        const buffer = Buffer.from(base64_model, 'base64');
        
        // 3. Bikin nama file unik pake timestamp
        const fileName = `hasil_3d_${Date.now()}.obj`;
        
        // 4. Tentukan lokasi simpan (di root folder project lo)
        const filePath = path.join(process.cwd(), fileName);
        
        // 5. Tulis file ke disk
        fs.writeFileSync(filePath, buffer);
        
        console.log(`✅ SUKSES! File 3D udah disimpen di: ${filePath}`);

        // ----------------------------------------

        res.status(200).json({
            success: true,
            message: "3D Model Generated & Saved Locally!",
            file_location: filePath, // Kasih tau user filenya ada di mana
            note: "Cek folder project lo, file .obj udah jadi!"
        });

    } catch (error) {
        console.error("🔥 Error Shap-E:", error.message);
        res.status(500).json({ 
            error: "Gagal generate 3D.",
            details: error.message 
        });
    }
};

export const generate3DFromImage = async (req, res) => {
    try {
        // 1. Ambil input dari Body
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: "Wajib kirim 'imageBase64' bro!" });
        }

        console.log(`📸 OTW ngirim gambar ke TripoSR (Colab)...`);

        // 2. Tembak Server Colab
        // Endpoint sesuai script Python tadi: /generate-3d-image
        const response = await axios.post(
            `${COLAB_API_URL}/generate-3d-image`, 
            {
                image: imageBase64 // Key harus 'image' biar Python ngerti
            }, 
            { 
                timeout: 300000 // 5 Menit (Biar gak RTO kalau server lagi lemot)
            }
        );

        // 3. Bongkar Response dari Python
        // Struktur dari Python: { success: true, data: { base64: "...", format: "obj" } }
        const result = response.data;

        // Cek kalau Python bilang gagal
        if (!result.success || !result.data || !result.data.base64) {
            throw new Error(result.error || "Colab gagal proses gambar, return kosong.");
        }

        const modelBase64 = result.data.base64;

        // 4. Simpan File .OBJ ke Laptop Lo (Local Save)
        // Kita ubah base64 jadi buffer lagi buat ditulis ke file
        const buffer = Buffer.from(modelBase64, 'base64');
        
        // Kasih nama file unik pake timestamp biar gak ketimpa
        const fileName = `hasil_tripo_${Date.now()}.obj`;
        const filePath = path.join(process.cwd(), fileName);

        fs.writeFileSync(filePath, buffer);
        
        console.log(`✅ MANTAP! File 3D udah jadi & disimpen di: ${filePath}`);

        // 5. Kirim Response Balik ke Frontend (React/Postman)
        return res.status(200).json({
            success: true,
            message: "3D Model Berhasil Dibuat!",
            data: {
                file_name: fileName,
                local_path: filePath, // Kasih tau user lokasinya di mana
                model_base64: modelBase64, // Kirim base64 juga kalo mau langsung dirender di Three.js
                file_type: "obj"
            }
        });

    } catch (error) {
        console.error("🔥 Error Generate 3D:", error.message);

        // Kalo errornya dari Axios (misal Colab mati / 500 Internal Server Error)
        if (error.response) {
            console.error("❌ Detail Error dari Colab:", error.response.data);
            return res.status(502).json({
                error: "Server AI (Colab) nolak request.",
                details: error.response.data
            });
        }

        // Kalo error codingan JS atau Timeout
        return res.status(500).json({ 
            error: "Gagal memproses request.",
            details: error.message 
        });
    }
};


export const generateTripo3D = async (req, res) => {
    const { prompt } = req.body;
    const tripoApiKey = process.env.TRIPO_API_KEY;

    if (!prompt) return res.status(400).json({ error: "Prompt wajib diisi bro!" });
    if (!tripoApiKey) return res.status(500).json({ error: "API Key Tripo belum diset di .env" });

    try {
        console.log(`🚀 TripoAI: Mulai generate task untuk "${prompt}"...`);

        // 1. Trigger Task ke Tripo
        const triggerResponse = await axios.post(
            'https://api.tripo3d.ai/v2/openapi/task',
            {
                type: 'text_to_model',
                prompt: prompt
            },
            {
                headers: { 
                    'Authorization': `Bearer ${tripoApiKey}`,
                    'Content-Type': 'application/json' 
                }
            }
        );

        const taskId = triggerResponse.data.data.task_id;
        console.log(`⏳ Task ID dapet: ${taskId}. Sekarang mode nunggu (Polling)...`);

        // 2. Polling Loop (Cek status tiap 2 detik sampai 'success')
        let status = 'queued';
        let modelUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // Max nunggu sktr 2-3 menit (60 x 2s)

        while (status !== 'success' && status !== 'failed' && status !== 'cancelled') {
            if (attempts >= maxAttempts) throw new Error("Kelamaan nunggu bro, Tripo timeout.");
            
            await new Promise(resolve => setTimeout(resolve, 2500)); // Delay 2.5 detik
            
            const checkResponse = await axios.get(
                `https://api.tripo3d.ai/v2/openapi/task/${taskId}`,
                { headers: { 'Authorization': `Bearer ${tripoApiKey}` } }
            );

            status = checkResponse.data.data.status;
            console.log(`🔍 Status Tripo (${attempts + 1}): ${status}`);
            
            if (status === 'success') {
                // Default output Tripo biasanya .glb
                modelUrl = checkResponse.data.data.output.model;
            }
            attempts++;
        }

        if (!modelUrl) throw new Error("Tripo gagal generate atau status failed.");

        console.log(`📥 Model jadi! OTW download dari: ${modelUrl}`);

        // 3. Download File GLB dari URL Tripo
        const fileResponse = await axios({
            url: modelUrl,
            method: 'GET',
            responseType: 'arraybuffer' // Penting biar data biner gak rusak
        });

        // 4. Simpan ke Local (Laptop)
        const fileName = `tripo_${Date.now()}.glb`; // Tripo outputnya .glb
        const filePath = path.join(process.cwd(), fileName);

        fs.writeFileSync(filePath, fileResponse.data);

        console.log(`✅ CAKEP! File Tripo udah disimpen di: ${filePath}`);

        // 5. Kirim Response
        res.json({
            success: true,
            message: "Tripo 3D Generated Successfully!",
            data: {
                file_name: fileName,
                local_path: filePath,
                remote_url: modelUrl, // Link asli dari tripo (expired dlm 24 jam biasanya)
                file_type: "glb"
            }
        });

    } catch (error) {
        console.error("🔥 Error TripoAI:", error.message);
        res.status(500).json({
            error: "Gagal generate via Tripo.",
            details: error.response ? error.response.data : error.message
        });
    }
};