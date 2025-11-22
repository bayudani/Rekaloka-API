import fetch from 'node-fetch';

// --- KONFIGURASI GLOBAL NANO BANANA ---
const API_KEY = process.env.NANOBANANA_API_KEY;
const BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core function untuk memanggil API Nano Banana.
 * Menangani Request -> Task ID -> Polling Status -> Result URL -> Base64.
 * * @param {Object} payload - Body JSON sesuai dokumentasi (prompt, type, dll)
 * @returns {Promise<string>} String gambar dalam format Base64
 */
export const callNanoBanana = async (payload) => {
  if (!API_KEY) throw new Error("NANOBANANA_API_KEY belum diset di .env!");

  try {
    // 1. Hit Endpoint Generate
    console.log(`🍌 [Core] Sending Request... Type: ${payload.type}`);

    const generateResponse = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const generateResult = await generateResponse.json();

    // Validasi Error dari API
    if (!generateResponse.ok || (generateResult.code && generateResult.code !== 200)) {
      console.error("❌ Nano Banana Error Body:", JSON.stringify(payload));
      console.error("❌ Response Error:", JSON.stringify(generateResult));
      throw new Error(`Nano Banana Refused: ${generateResult.msg || 'Unknown error'}`);
    }

    // Ambil Task ID
    const taskId = generateResult.data?.taskId || generateResult.taskId;
    if (!taskId) throw new Error("Gagal dapet Task ID dari Nano Banana.");

    console.log(`🍌 [Core] Task ID: ${taskId}. Polling status...`);

    // 2. Polling Status (Looping nunggu hasil)
    const maxWaitTime = 90000; // Timeout 90 detik
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await fetch(`${BASE_URL}/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      const statusResult = await statusResponse.json();
      const statusData = statusResult.data || {};
      const successFlag = statusData.successFlag;

      // --- SUKSES ---
      if (successFlag === 1) {
        console.log('🍌 [Core] Success! Downloading image...');

        // Ambil URL gambar (Handle berbagai kemungkinan path response)
        const imageUrl = statusData.resultImageUrl || statusData.url || statusData.response?.resultImageUrl;

        if (!imageUrl) {
          throw new Error(`URL Gambar kosong padahal status sukses. Data: ${JSON.stringify(statusData)}`);
        }

        // Download & Convert ke Base64
        const imageBuffer = await fetch(imageUrl).then(res => res.buffer());
        return imageBuffer.toString('base64');
      }
      // --- GAGAL ---
      else if (successFlag === 2 || successFlag === 3) {
        throw new Error(`Generation Failed: ${statusData.errorMessage || 'Unknown Status Error'}`);
      }

      // Tunggu 3 detik sebelum cek lagi
      await delay(3000);
    }

    throw new Error('Nano Banana Timeout: Kelamaan nunggu, server sibuk.');

  } catch (error) {
    // Re-throw error biar ditangkep sama Service di atasnya
    throw error;
  }
};