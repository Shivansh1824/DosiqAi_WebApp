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

// Initialize Gemini SDK with dedicated Report API Key (fallback to Common)
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY_REPORT || process.env.GEMINI_API_KEY_COMMON 
});

const REPORT_EXTRACTION_PROMPT = `You are an elite, board-certified clinical laboratory pathologist and medical document AI.
Your task is to analyze the provided medical laboratory diagnostic report (blood test, lipid panel, CBC, metabolic panel, urine test, pathology report) and extract all biological biomarkers, values, and reference ranges into strict, structured JSON.

═══════════════════════════════════════════════════════════════════════════════
SECTION A: EXTRACTION & ABNORMALITY DETECTION RULES
═══════════════════════════════════════════════════════════════════════════════

1. PATIENT & LAB METADATA:
   - Extract patient name (remove any salutations like Mr., Mrs., Master, Smt., Shri).
   - Extract age and gender.
   - Extract lab_name (e.g. "Wellness Pathcare Labs", "Metropolis Healthcare", "Dr Lal PathLabs", "SRL Diagnostics").
   - Extract report_date and visit_date in YYYY-MM-DD format (if ambiguous assume DD/MM/YYYY).

2. BIOMARKER METRICS EXTRACTION (GROUPED BY PANEL):
   Organize all extracted tests into logical clinical categories:
   - "Lipid Profile" (Total Cholesterol, Triglycerides, HDL, LDL, VLDL)
   - "Complete Blood Count / Haematology" (Hemoglobin, RBC, WBC, Platelets, MCV, MCH, ESR)
   - "Liver Function Test" (SGOT/AST, SGPT/ALT, Bilirubin, Alkaline Phosphatase, Total Protein)
   - "Kidney / Renal Function" (Serum Creatinine, Blood Urea Nitrogen, Uric Acid, eGFR)
   - "Thyroid Profile" (TSH, Total T3, Total T4, Free T3, Free T4)
   - "Diabetes / Glycemic Profile" (Fasting Blood Sugar, Post-Prandial Blood Sugar, HbA1c, Average Blood Glucose)
   - "Vitamins & Minerals" (Vitamin D 25-OH, Vitamin B12, Calcium, Ferritin, Iron)
   - "Urinalysis" (Urine Routine & Microscopic parameters)

3. FOR EACH INDIVIDUAL TEST METRIC:
   - test_name: Standardized medical test name.
   - value: The measured test result (numeric or text, e.g. 34.5, 140, "Negative").
   - unit: Measurement unit (e.g. "mg/dL", "ng/mL", "g/dL", "%", "uIU/mL", "mm/hr", "cells/cumm").
   - reference_range: The biological reference interval printed on the report (e.g. "30 - 100", "< 200", "70 - 100", "0.7 - 1.2").
   - is_abnormal: Boolean (true if value falls outside biological reference range, false if normal).
   - method: Testing methodology if listed (e.g. "ECLIA", "HPLC", "Hexokinase", "Calculated") or null.

4. ABNORMALITY COUNT & SUMMARY:
   - total_abnormalities: Exact count of all metrics where is_abnormal = true.
   - summary: A clear, patient-friendly clinical summary (2-4 sentences):
     - Sentence 1: "[Patient Name]'s lab report from [Lab Name] on [Date] evaluated [Panels Tested]."
     - Sentence 2: Detail all abnormal parameters with their values and reference ranges (e.g. "Vitamin D is deficient at 12 ng/mL (reference: 30-100). Total Cholesterol is elevated at 220 mg/dL (reference: <200).").
     - Sentence 3: State normal parameters and total count of abnormalities (e.g. "Liver and kidney parameters are within normal limits. Total [X] abnormalities detected across all parameters tested.").

═══════════════════════════════════════════════════════════════════════════════
SECTION B: OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a strict, valid JSON object matching this exact structure:
- Output raw JSON ONLY. No markdown code blocks (no \`\`\`json).
- Empty arrays [] if no data, never null for arrays.
- Boolean fields must never be null.

{
  "document_type": "medical_report",
  "file_name": "[Patient Name] - [Primary Test Category] Report - [D Mon YYYY]",
  "analysis_metadata": {
    "confidence_score": 0.95,
    "scan_clarity": "clear" | "blurry" | "unreadable"
  },
  "error_response": {
    "is_error": false,
    "user_message": null,
    "technical_reason": null
  },
  "patient_info": {
    "name": "String or null",
    "age": "String or null",
    "gender": "String or null"
  },
  "common_data": {
    "visit_date": "YYYY-MM-DD or null",
    "summary": "String (Patient-friendly clinical summary)"
  },
  "prescription_data": {
    "doctor_name": null,
    "hospital_name": null,
    "medical_issue_diagnosis": null,
    "recommended_tests": [],
    "medicines": []
  },
  "report_data": {
    "lab_name": "String or null",
    "report_date": "YYYY-MM-DD or null",
    "total_abnormalities": 0,
    "grouped_metrics": [
      {
        "category_name": "Lipid Profile",
        "metrics": [
          {
            "test_name": "Total Cholesterol",
            "value": "218",
            "unit": "mg/dL",
            "reference_range": "< 200",
            "is_abnormal": true,
            "method": null
          }
        ]
      }
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
                { text: REPORT_EXTRACTION_PROMPT },
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
            temperature: 0.1, // Precision biomarker extraction
          }
        });
        break;
      } catch (err) {
        lastErr = err;
        const isRetryable = err.status === 503 || err.status === 429 || err.message?.includes('high demand');
        if (isRetryable) {
          console.warn(`[Gemini Extract Report] ${modelName} hit high demand (${err.status || 503}). Falling back...`);
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
    console.error('Extract Report API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
