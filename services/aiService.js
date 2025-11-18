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


/**
 * Menganalisa gambar menggunakan Gemini Vision
 * @param {string} base64Image - String gambar base64 (tanpa prefix data:image...)
 * @param {string} hotspotName - Nama tempat yang harus divalidasi
 * @returns {boolean} True jika gambar valid/sesuai
 */
export const validateImageWithGemini = async (base64Image, hotspotName) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    // Kita pake Gemini 1.5 Flash karena support Multimodal (Gambar + Teks)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    // Prompt yang strict biar AI gak halu
    const prompt = `Look at this image. Does this image show "${hotspotName}" or something related to it (like a sign, statue, building, or artifact)? 
  Answer strictly with JSON: { "isValid": true } or { "isValid": false }. 
  If the image is blurry, black, or irrelevant, return false.`;

    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg", // Asumsi FE ngirim JPEG/PNG
                            data: base64Image
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            response_mime_type: "application/json" // Maksa balikan JSON
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Parsing hasil dari Gemini
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResult) return false;

        const jsonResult = JSON.parse(textResult);
        return jsonResult.isValid;

    } catch (error) {
        console.error("Error Gemini Vision:", error);
        return false; // Kalo error, anggap gak valid biar aman
    }
};