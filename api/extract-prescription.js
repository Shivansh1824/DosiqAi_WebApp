import ws from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Supabase Client with Service Role (Bypasses RLS to read vault)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gemini SDK with dedicated Prescription API Key (fallback to Common)
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY_PRESCRIPTION || process.env.GEMINI_API_KEY_COMMON 
});

const PRESCRIPTION_EXTRACTION_PROMPT = `You are an elite, board-certified medical document AI specialized in clinical prescription decoding and clinical pharmacology.
Your task is to analyze the provided prescription document (handwritten or printed doctor notes, clinic receipts, hospital discharge summaries) and extract all medical information into strict, structured JSON.

═══════════════════════════════════════════════════════════════════════════════
SECTION A: EXTRACTION RULES
═══════════════════════════════════════════════════════════════════════════════

1. PATIENT INFORMATION:
   - Extract patient name, age, and gender.
   - Remove any salutations (Mr., Mrs., Master, Baby, Smt., Shri).

2. DOCTOR & CLINIC INFORMATION:
   - Extract doctor name (always prefix with "Dr " or "Dr. ").
   - Extract clinic/hospital name.
   - Extract visit_date in YYYY-MM-DD format (if ambiguous assume DD/MM/YYYY, 2-digit year like 25 -> 2025).

3. DIAGNOSIS:
   - Extract the primary diagnosis or clinical indication.
   - diagnosis_source: "explicit" if written on paper, or "inferred" based on prescribed drugs.

4. MEDICINES EXTRACTION (SIX-LAYER SYSTEM):
   For every medicine prescribed:
   - exact_written_name: Exact text as written by the doctor (e.g., "Tab Zyloric 200mg", "Rosovas 20", "Augmentin 625").
   - strength: e.g., "200mg", "40mg", "500mg", "10mg" or null if not specified.
   - form: One of "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Cream" | "Inhaler" | "Sachet" | null.
   - dosage_instruction: Specific instruction text (e.g. "After Dinner daily", "SOS for Pain", "Twice daily with warm water").
   - interval_days: Number (1 = daily, 2 = alternate day, 7 = weekly, 15 = once in 15 days, 0 = as needed / SOS).
   - duration_days: Number of total treatment days (e.g. 5, 7, 30, 60) or null if chronic/ongoing.
   - timing:
     - dosage: Standard 3-slot medical format "M-A-N" (e.g., "1-0-1", "1-0-0", "0-0-1", "1-1-1", "0-1-0", "0-0-2"). If frequency is not 3 times a day or SOS, output null.
     - relation_to_meal: One of "before_food" | "after_food" | "with_food" | "empty_stomach" | "any" | null.
     - total_times_per_day: Integer (e.g. 1, 2, 3, 4) or null for SOS.
   - assumed_enriched_data:
     - is_identified: true if the active pharmaceutical molecule is identified, false if unreadable.
     - confidence: Number between 0.0 and 1.0.
     - scientific_name: Generic / salt name (e.g. "Allopurinol", "Rosuvastatin", "Amoxicillin + Clavulanic Acid").
     - medicine_type: Category (e.g. "Antigout", "Statin", "Antibiotic", "Analgesic", "Antihistamine", "Antihypertensive").
     - medicine_purpose: Clinical purpose (e.g. "Uric Acid Control", "Cholesterol Control", "Bacterial Infection Relief", "Pain Relief").

5. DRUG-DRUG INTERACTIONS:
   - Screen all prescribed medications against known clinical interaction pairs.
   - potential_interactions_flag: true if any significant interaction is detected, false otherwise.
   - interaction_note: Brief 1-sentence warning (e.g. "Telmisartan + Ibuprofen: May increase risk of renal impairment. Use Paracetamol for pain.").

6. RECOMMENDED TESTS:
   - Extract any advised diagnostic tests: [{"test_name": "String", "reason": "String or null"}].

7. FOLLOW-UP:
   - follow_up_date: YYYY-MM-DD or null.
   - follow_up_days: Number or null.

8. OTHER INFORMATION:
   - Capture lifestyle, dietary advice, allergies, and vitals (e.g. BP, Pulse, Weight):
     [{"category": "Diet"|"Lifestyle"|"Vitals"|"Allergy"|"Notes", "value": "String"}].

═══════════════════════════════════════════════════════════════════════════════
SECTION B: OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a strict, valid JSON object matching this exact structure:
- "reasoning" MUST be the first field (100-200 words explaining clinical decoding logic).
- Output raw JSON ONLY. No markdown code blocks (no \`\`\`json).
- Empty arrays [] if no data, never null for arrays.

{
  "reasoning": "After analyzing the document, I identified the patient as ...",
  "document_type": "prescription",
  "file_name": "[Patient Name] - [Diagnosis] Prescription - [D Mon YYYY]",
  "analysis_metadata": {
    "confidence_score": 0.95,
    "scan_clarity": "clear" | "blurry" | "unreadable",
    "handwriting_detected": true
  },
  "error_response": {
    "is_error": false,
    "technical_reason": null
  },
  "patient_info": {
    "name": "String or null",
    "age": "String or null",
    "gender": "String or null"
  },
  "common_data": {
    "visit_date": "YYYY-MM-DD or null",
    "summary": "2-3 sentences, max 50 words summarizing diagnosis, key medicines, and advised tests."
  },
  "prescription_data": {
    "doctor_name": "String or null",
    "hospital_name": "String or null",
    "medical_issue_diagnosis": "String or null",
    "diagnosis_source": "explicit" | "inferred",
    "follow_up": {
      "follow_up_date": "YYYY-MM-DD or null",
      "follow_up_days": null
    },
    "recommended_tests": [
      { "test_name": "String", "reason": "String or null" }
    ],
    "medicines": [
      {
        "exact_written_name": "String",
        "strength": "String or null",
        "form": "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Cream" | "Inhaler" | "Sachet" | null,
        "dosage_instruction": "String or null",
        "interval_days": 1,
        "duration_days": 30,
        "timing": {
          "dosage": "1-0-1",
          "relation_to_meal": "after_food",
          "total_times_per_day": 2
        },
        "assumed_enriched_data": {
          "is_identified": true,
          "confidence": 1.0,
          "scientific_name": "String or null",
          "medicine_type": "String or null",
          "medicine_purpose": "String or null"
        }
      }
    ],
    "drug_interactions": {
      "potential_interactions_flag": false,
      "interaction_note": null
    },
    "other_information": [
      { "category": "Notes", "value": "String" }
    ]
  }
}`;

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

    // Normalize storage path (strip bucket prefix if present)
    const storagePath = cloud_file_key.replace(/^medical-vault\//, '');

    // 1. Download file securely from Supabase
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('medical-vault')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Supabase Download Error:', downloadError);
      return res.status(500).json({ error: 'Failed to download secure document from vault.' });
    }

    // Determine mimeType
    const mimeType = storagePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                     storagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                     'image/jpeg';

    // 2. Convert file Blob to Base64
    const buffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    // 3. Call Gemini 3.8 Flash with automatic fallback to Gemini 3.6 Flash on high demand
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash'];
    let response;
    let lastErr;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: PRESCRIPTION_EXTRACTION_PROMPT },
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
            temperature: 0.1, // Precision clinical extraction
          }
        });
        break;
      } catch (err) {
        lastErr = err;
        const isRetryable = err.status === 503 || err.status === 429 || err.message?.includes('high demand');
        if (isRetryable) {
          console.warn(`[Gemini Extract Rx] ${modelName} hit high demand (${err.status || 503}). Falling back...`);
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastErr || new Error('All Gemini model candidates failed');
    }

    const resultText = response.text;
    
    // Safety parse just in case
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    return res.status(200).json({ success: true, extraction: parsedResult });

  } catch (error) {
    console.error('Extract Prescription API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
