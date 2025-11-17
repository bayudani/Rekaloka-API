import fetch from 'node-fetch';

/**
 * Memanggil API Imagen untuk generate gambar
 * @param {string} prompt - Prompt teks dari user
 * @returns {string} Base64 string dari gambar
 */
export const getImageFromAI = async (prompt) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('API Key belum di-setting di server');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    const payload = {
        instances: [{ "prompt": prompt }],
        parameters: { "sampleCount": 1 }
    };

    const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`API call failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorBody}`);
    }

    const result = await apiResponse.json();

    if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
        return result.predictions[0].bytesBase64Encoded;
    } else {
        throw new Error('Gagal memproses gambar dari API');
    }
};