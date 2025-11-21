import fetch from 'node-fetch';
import { callNanoBanana } from './nanobanana.core.js';


export const getImageFromAI = async (prompt) => {
  try {
    console.log(`🤖 AI Service: Generating Image for "${prompt.substring(0, 15)}..."`);

    return await callNanoBanana({
      prompt: prompt,
      numImages: 1,
      type: "TEXTTOIAMGE",
      image_size: "1:1",
      callBackUrl: "https://rekaloka.id/dummy-callback"
    });

  } catch (error) {
    console.error("⚠️ Nano Banana Error:", error.message);
    console.log("🔄 Switching to Backup (Pollinations)...");

    // Fallback ke Pollinations (Gratis & Unlimited) biar user tetep dapet gambar
    return await getImageFromPollinations(prompt);
  }
};

// --- FITUR 2: IMAGE TO IMAGE (Edit / Restorasi) ---
export const editImageWithAI = async (prompt, inputImageUrl) => {
  try {
    console.log(` AI Service: Editing Image...`);

    return await callNanoBanana({
      prompt: prompt,
      numImages: 1,
      type: "IMAGETOIAMGE",
      image_size: "1:1",
      imageUrls: [inputImageUrl], // Wajib array URL
      callBackUrl: "https://rekaloka.id/dummy-callback"
    });

  } catch (error) {
    console.error("❌ Error Edit Image:", error.message);
    throw error;
  }
};


const getImageFromPollinations = async (prompt) => {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Pollinations Error');

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    throw new Error('Semua AI Gagal (Nano Banana & Backup). Coba lagi nanti.');
  }
};


export const validateImageWithGemini = async (base64Image, hotspotName) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY ga ada, skip validasi AI (Auto Valid).");
    return true;
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `Look at this image. Does this image show "${hotspotName}" or something related to it? Answer JSON: { "isValid": true } or { "isValid": false }.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }],
    generationConfig: { response_mime_type: "application/json" }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) return false;
    return JSON.parse(textResult).isValid;
  } catch (error) {
    console.error("Error Gemini Vision:", error);
    return true;
  }
};