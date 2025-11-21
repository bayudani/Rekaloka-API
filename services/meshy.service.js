import fetch from 'node-fetch';

const API_KEY = process.env.MESHY_API_KEY;
const BASE_URL = 'https://api.meshy.ai/v2/text-to-3d';

// Helper delay biar ga spam request
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate 3D Model dari Teks (Mode Preview biar cepet)
 * @param {string} prompt - Deskripsi objek 3D
 * @returns {Promise<string>} URL model 3D (.glb) yang siap pake
 */
export const generate3DModel = async (prompt) => {
    if (!API_KEY) throw new Error("MESHY_API_KEY belum diset di .env!");

    try {
        console.log(`🧊 Meshy AI: Requesting 3D for "${prompt.substring(0, 20)}..."`);

        // 1. POST Request buat mulai generate (Preview Mode)
        const createResponse = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: "preview", // Pake preview biar cepet (15-30 detik)
                prompt: prompt,
                art_style: "realistic",
                negative_prompt: "low quality, low resolution, low poly, ugly"
            })
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
            throw new Error(`Meshy Create Failed: ${createResult.message || JSON.stringify(createResult)}`);
        }

        const taskId = createResult.result; // Dapet Task ID
        console.log(`🧊 Task ID: ${taskId}. Polling status...`);

        // 2. Polling Status (Nungguin sampe kelar)
        // Kita kasih waktu maksimal 3 menit (180 detik)
        const maxWaitTime = 180000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const statusResponse = await fetch(`${BASE_URL}/${taskId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });

            const statusResult = await statusResponse.json();
            const status = statusResult.status; // PENDING, IN_PROGRESS, SUCCEEDED, FAILED

            if (status === 'SUCCEEDED') {
                console.log('🧊 Generation completed!');
                // Ambil URL file .glb (Format standar web/mobile)
                return statusResult.model_urls.glb;
            }
            else if (status === 'FAILED') {
                throw new Error(`Generation Failed: ${statusResult.message || 'Unknown Error'}`);
            }

            // Tunggu 3 detik sebelum cek lagi
            await delay(3000);
        }

        throw new Error('Meshy Timeout: Kelamaan nunggu bro, coba lagi nanti.');

    } catch (error) {
        console.error("Error Meshy AI:", error.message);
        throw error;
    }
};