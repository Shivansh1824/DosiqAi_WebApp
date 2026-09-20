import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Supabase Client with Service Role (Bypasses RLS to read the vault)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gemini SDK with the Common API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_COMMON });

export default async function handler(req, res) {
  // CORS configuration
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cloud_file_key } = req.body;

    if (!cloud_file_key) {
      return res.status(400).json({ error: 'Missing cloud_file_key' });
    }

    // 1. Download file securely from Supabase
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('medical-vault')
      .download(cloud_file_key);

    if (downloadError || !fileData) {
      console.error("Supabase Download Error:", downloadError);
      return res.status(500).json({ error: 'Failed to download secure document from vault.' });
    }

    // Determine mimeType
    const mimeType = cloud_file_key.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                     cloud_file_key.toLowerCase().endsWith('.png') ? 'image/png' :
                     'image/jpeg';

    // 2. Convert file Blob to Base64
    const buffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    // 3. A+ Grade Prompt Engineering for Strict PRESCRIPTION Classification
    const SYSTEM_PROMPT = `You are an elite, highly secure medical document classification AI working for a production healthcare platform. 
Your ONLY objective is to critically examine the provided document (which may contain multiple pages or images) and verify if it is a VALID PRESCRIPTION.

WHAT CONSTITUTES A VALID PRESCRIPTION:
- A doctor's handwritten or printed prescription pad.
- A hospital discharge summary containing a medication regimen.
- A clinical receipt or bill that explicitly lists medications prescribed.
- A medicine regimen sheet.

STRICT VERIFICATION RULES:
- Evaluate the document meticulously page-by-page.
- If a page is entirely unrelated to medical care (e.g., a photo of a dog, a car, a landscape, a random selfie, a driver's license), you MUST mark it as "invalid" and provide a brief reason.
- If a page is a "Blood Test" or "Laboratory Diagnostic Report" (e.g., CBC, lipid profile, metabolic panel with reference ranges), mark it as "invalid_category" and explain that it is a lab report, not a prescription.
- If a page is slightly blurry but still clearly a prescription, mark it as "valid".

OUTPUT FORMAT:
You must return a strict, clean JSON object with this exact schema (no markdown formatting, no backticks, just raw JSON):
{
  "isValidOverall": boolean, // true ONLY if EVERY single page is a valid prescription. false otherwise.
  "pages": [
    {
      "pageIndex": number, // 0-indexed page number
      "status": "valid" | "invalid" | "invalid_category",
      "reason": "Brief, user-friendly explanation (e.g., 'This page looks like a random photo.' or 'This is a lab report, not a prescription.' or 'Valid prescription found.')"
    }
  ]
}`;

    // 4. Call Gemini 2.0 Flash for instant multimodal classification
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for high precision classification
      }
    });

    const resultText = response.text;
    
    // Safety parse just in case
    let parsedResult;
    try {
        parsedResult = JSON.parse(resultText);
    } catch (e) {
        const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleaned);
    }

    return res.status(200).json({ success: true, analysis: parsedResult });

  } catch (error) {
    console.error('Check Prescription API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
