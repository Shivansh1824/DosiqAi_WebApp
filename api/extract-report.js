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

// ═══════════════════════════════════════════════════════════════════════════════
// A++ GRADE: Lab Report Extraction Prompt (Bulletproof v11.0 — Dosiq AI Edition)
// Adapted from dosiqAi prompt_report.md + enhanced with severity, clinical_narrative
// ═══════════════════════════════════════════════════════════════════════════════

const REPORT_EXTRACTION_PROMPT = `You are an elite, board-certified clinical laboratory pathologist and AI diagnostics engine specialized in decoding Indian and international lab reports with 100% precision.

Your task is to analyze the provided medical laboratory diagnostic report (blood test, lipid panel, CBC, metabolic panel, urine test, thyroid, pathology) and extract ALL biomarkers, values, and reference ranges into strict, structured JSON.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: DOCUMENT CLASSIFICATION
═══════════════════════════════════════════════════════════════════════════════

Carefully examine the document and classify it:

LAB REPORT (medical_report) Indicators:
- Tabular data with columns: Test Name, Result, Unit, Reference Range, Method
- Numeric test values with units (e.g., "14.0 g/dL", "218 mg/dL")
- Abnormal flags or markers (HIGH/LOW/NORMAL, asterisks *)
- Multiple test parameters listed with actual values
- Lab name, accreditation, NABL logo
- Test collection / report dates
- Categories: Haematology, Biochemistry, Urine Analysis, Lipid Profile, Thyroid

INVALID Indicators:
- Blurry / unreadable text that prevents value extraction
- Non-medical content (receipts, prescriptions, plain text)
- Incomplete / torn document with less than 2 readable test parameters

═══════════════════════════════════════════════════════════════════════════════
STEP 2: BIOMARKER EXTRACTION — BULLETPROOF v11.0
═══════════════════════════════════════════════════════════════════════════════

### RULE 1 — COMPLETE EXTRACTION:
- Extract EVERY test parameter from the report without skipping any
- Capture: test_name, value (raw), numeric_value (parsed float), unit, reference_range, method
- Preserve exact values and ranges exactly as written
- Group tests by their clinical panel categories

### RULE 2 — SEVERITY CLASSIFICATION per metric:
For each test, assign a "severity" level:
- "normal"      → value is within reference range
- "borderline"  → value is 1-20% outside reference range
- "high"        → value is >20% above upper bound (or clinically significant high)
- "low"         → value is >20% below lower bound (or clinically significant low)
- "critical"    → value is dangerously far outside range (requires urgent attention)

### RULE 3 — ABNORMALITY DETECTION (⚠️ ULTRA-STRICT — 100% ACCURACY REQUIRED):

PRE-PROCESSING: For EVERY test, identify the range type then apply the rule:

TYPE 1: SIMPLE NUMERIC RANGE (e.g., "40-60", "136-145", "3.5-7.2")
- Parse: lower_bound and upper_bound
- Rule: IF value < lower_bound OR value > upper_bound THEN is_abnormal = true
- NO tolerance — even 0.1 unit difference counts
- Examples:
  * Sodium: 135 vs "136-145" → 135 < 136 → is_abnormal = true ✓
  * HDL: 32 vs "40-60" → 32 < 40 → is_abnormal = true ✓
  * Uric Acid: 10.3 vs "3.5-7.2" → 10.3 > 7.2 → is_abnormal = true ✓

TYPE 2: INEQUALITY RANGE (e.g., "<=10", "<100", "<200", ">5")
- "<X" means value >= X is abnormal
- "<=X" means value > X is abnormal
- ">X" means value <= X is abnormal
- Examples:
  * ESR: 13 vs "<=10" → 13 > 10 → is_abnormal = true ✓
  * Cholesterol: 218 vs "<200" → 218 >= 200 → is_abnormal = true ✓

TYPE 3: MULTI-CATEGORY RANGE (e.g., "Desirable <100, High 160-189")
- ONLY these keywords indicate NORMAL: "Desirable", "Normal", "Optimal", "Acceptable"
- ANY other category is ABNORMAL: "High", "Low", "Borderline", "Elevated", "Decreased", "Very High", "Very Low"
- Examples:
  * LDL: 166 falls in "High: 160-189" → is_abnormal = true ✓

TYPE 4: EXPLICIT MARKERS (report shows HIGH/LOW/CRITICAL/H/L/asterisk *)
- is_abnormal = true ✓

TYPE 5: TEXT/QUALITATIVE VALUES (e.g., "NEGATIVE", "POSITIVE")
- Compare actual value with reference value. If mismatch → is_abnormal = true
- Example: Urine Protein "POSITIVE" vs reference "Negative" → is_abnormal = true ✓

⚠️ CRITICAL: DO NOT SKIP THE LAST TEST IN EACH CATEGORY — many calculated tests (LDL, eGFR) appear last!

### RULE 4 — COUNTING ALGORITHM (MANDATORY — MATHEMATICAL, NOT INTERPRETIVE):
Step 1: Initialize counter = 0
Step 2: Loop ALL categories → ALL tests in each category
  → If test.is_abnormal == true → counter = counter + 1
Step 3: Set total_abnormalities = counter
Step 4: Verify you looped through EVERY category including the last test in each

### RULE 5 — PATIENT & LAB METADATA:
- Patient name: Remove ALL salutations (Mr., Mrs., Ms., Master, Baby, Smt., Shri, Dr.)
- Dates: Assume DD/MM/YYYY input → output YYYY-MM-DD (ISO 8601)
- lab_name: Full lab name as printed (e.g., "Dr Lal PathLabs", "Metropolis Healthcare", "SRL Diagnostics", "Thyrocare")
- report_date: The date the report was generated
- visit_date (common_data): The sample collection date

### RULE 6 — FILE NAMING:
Format: [Patient Name] - [Primary Panel] Report - [D Mon YYYY]
Examples:
- "Shivansh Rana - Lipid Profile Report - 21 Sep 2026"
- "Priya Mehta - Complete Blood Count Report - 15 Aug 2026"
- "Ramesh Kumar - Comprehensive Metabolic Panel Report - 1 Jan 2026"

### RULE 7 — SUMMARY (MANDATORY — STRUCTURED LAB REPORT FORMAT):

STEP 7.0: PRE-SUMMARY PREPARATION:
Create list: abnormal_tests = []
For each category → each test: if is_abnormal == true → add to abnormal_tests list
Verify: length(abnormal_tests) == total_abnormalities (if mismatch → RECOUNT!)

STEP 7.1: OPENING (NO count mentioned):
"[Patient Name]'s lab report from [Lab Name] on [Date] evaluated [panels tested]."

STEP 7.2: BODY — DETAIL ALL ABNORMAL TESTS (MANDATORY — EVERY ONE):
For each test in abnormal_tests:
"[Test Name] is [elevated/high/low] at [value] [unit] (reference: [range])."

STEP 7.3: NORMAL TESTS (one sentence):
"[Key normal parameters] are within normal limits."

STEP 7.4: CLOSING (EXACT count — MANDATORY):
"Total [X] abnormalities detected across all parameters tested."
[X] MUST exactly equal total_abnormalities

STEP 7.9: POST-SUMMARY VALIDATION:
Count of tests mentioned in body == total_abnormalities (if not → regenerate summary!)

### RULE 8 — CLINICAL NARRATIVE (NEW):
Write a separate 3-5 sentence "clinical_narrative" in plain English for the patient/caregiver:
- Sentence 1: Overall health picture ("Your overall metabolic profile shows...")
- Sentence 2: Most important concern ("The most concerning finding is...")
- Sentence 3: What is going well ("On the positive side, your...")
- Sentence 4: What to watch / follow up ("You should discuss with your doctor...")
This narrative is patient-friendly — no medical jargon. It goes in report_data.clinical_narrative.

### RULE 9 — REASONING TRACE (NEW):
Before the JSON, mentally trace your extraction logic (100-200 words) and embed it in the "reasoning" field.
Describe: which panels were detected, how many tests extracted, key abnormal findings, confidence level, scan quality.

═══════════════════════════════════════════════════════════════════════════════
SECTION B: OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a strict, valid JSON object. NO markdown code blocks (no \`\`\`json). Raw JSON ONLY.
Empty arrays [] if no data, never null for arrays. Boolean fields must never be null.

{
  "reasoning": "After analyzing this lab report from [lab name], I identified [N] clinical panels containing [M] individual tests. Key findings include: [summary]. Scan clarity is [clear/blurry]. Confidence: [X]%. Abnormality count verified at [N] using explicit counting algorithm.",
  "document_type": "medical_report",
  "file_name": "[Patient Name] - [Primary Panel] Report - [D Mon YYYY]",
  "analysis_metadata": {
    "confidence_score": 0.95,
    "scan_clarity": "clear | blurry | unreadable"
  },
  "error_response": {
    "is_error": false,
    "user_message": null,
    "technical_reason": null
  },
  "patient_info": {
    "name": "String (no salutations) or null",
    "age": "String or null",
    "gender": "String or null"
  },
  "common_data": {
    "visit_date": "YYYY-MM-DD or null",
    "summary": "Full structured summary per RULE 7 above"
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
    "clinical_narrative": "3-5 sentence patient-friendly narrative per RULE 8",
    "grouped_metrics": [
      {
        "category_name": "Lipid Profile",
        "metrics": [
          {
            "test_name": "Total Cholesterol",
            "value": "218",
            "numeric_value": 218.0,
            "unit": "mg/dL",
            "reference_range": "< 200",
            "is_abnormal": true,
            "severity": "borderline",
            "method": null
          }
        ]
      }
    ]
  }
}

═══════════════════════════════════════════════════════════════════════════════
FINAL VALIDATION CHECKLIST (Before outputting JSON)
═══════════════════════════════════════════════════════════════════════════════

- [ ] document_type correctly classified as "medical_report" or "invalid"
- [ ] All salutations removed from patient name
- [ ] Dates converted to YYYY-MM-DD
- [ ] EVERY test extracted including last in each category ⚠️
- [ ] Ultra-strict abnormality detection applied (Types 1-5) ⚠️
- [ ] Explicit counting algorithm used — total_abnormalities is a mathematical count ⚠️
- [ ] severity field set for every metric ⚠️
- [ ] numeric_value (float) set for every metric that has a numeric result ⚠️
- [ ] clinical_narrative written in plain patient-friendly language ⚠️
- [ ] reasoning field populated (100-200 words) ⚠️
- [ ] Summary opening has NO count; closing has EXACT count ⚠️
- [ ] All abnormal tests detailed in summary body ⚠️
- [ ] No markdown code blocks — raw JSON only
- [ ] Empty arrays [], never null for arrays`;

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
    const { cloud_file_key, file_base64, mime_type } = req.body;

    let base64Data = file_base64;
    let mimeType = mime_type;
    const storagePath = cloud_file_key ? cloud_file_key.replace(/^medical-vault\//, '') : `upload_${Date.now()}.pdf`;

    if (!base64Data && cloud_file_key) {
      // 1. Download file securely from Supabase
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('medical-vault')
        .download(storagePath);

      if (downloadError || !fileData) {
        console.error('Supabase Download Error:', downloadError);
        return res.status(500).json({ error: 'Failed to download secure document from vault.' });
      }

      mimeType = storagePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                 storagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                 'image/jpeg';

      const buffer = await fileData.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
    } else if (base64Data) {
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        if (!mimeType) {
          const match = parts[0].match(/data:(.*?);base64/);
          if (match) mimeType = match[1];
        }
        base64Data = parts[1];
      }
      if (!mimeType) mimeType = 'application/pdf';

      // Persist to Supabase storage with service role
      try {
        const buf = Buffer.from(base64Data, 'base64');
        await supabase.storage.from('medical-vault').upload(storagePath, buf, {
          contentType: mimeType,
          upsert: true,
        });
      } catch (uploadErr) {
        console.warn('Storage upload error (handled):', uploadErr.message);
      }
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'Missing cloud_file_key or file_base64' });
    }

    // 3. Multi-model & multi-key fallback cascade — same as extract-prescription.js
    const candidateKeys = [
      process.env.GEMINI_API_KEY_REPORT,
      process.env.GEMINI_API_KEY_COMMON,
      process.env.GEMINI_API_KEY_PRESCRIPTION,
    ].filter(Boolean);

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ];

    let response;
    let lastErr;

    keyLoop:
    for (const apiKey of candidateKeys) {
      const aiClient = new GoogleGenAI({ apiKey });
      for (const modelName of candidateModels) {
        try {
          response = await aiClient.models.generateContent({
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
              temperature: 0.1, // Precision biomarker extraction — low temperature mandatory
            }
          });
          if (response?.text) break keyLoop;
        } catch (err) {
          lastErr = err;
          const isRetryable = err.status === 503 || err.status === 429 || err.message?.includes('high demand') || err.message?.includes('quota');
          if (isRetryable) {
            console.warn(`[Gemini Extract Report] ${modelName} hit limit (${err.status || 429}). Trying next candidate...`);
            continue;
          }
          throw err;
        }
      }
    }

    if (!response) {
      throw lastErr || new Error('All Gemini model candidates failed');
    }

    const resultText = response.text;

    // Safety parse — strip markdown fences just in case
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
