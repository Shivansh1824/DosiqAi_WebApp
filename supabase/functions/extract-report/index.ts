import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateClinicalAI } from '../_shared/gemini.ts';

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cloud_file_key, file_base64, mime_type } = await req.json();
    if (!cloud_file_key && !file_base64) {
      return new Response(JSON.stringify({ error: 'Missing cloud_file_key or file_base64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const storagePath = cloud_file_key ? cloud_file_key.replace(/^medical-vault\//, '') : `upload_${Date.now()}.pdf`;
    let base64Data = file_base64;
    let resolvedMime = mime_type;

    if (!base64Data && cloud_file_key) {
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('medical-vault')
        .download(storagePath);

      if (downloadError || !fileData) {
        console.error('Supabase Download Error:', downloadError);
        return new Response(JSON.stringify({ error: 'Failed to download secure document from vault.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      resolvedMime = storagePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                     storagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                     'image/jpeg';

      const arrayBuffer = await fileData.arrayBuffer();
      base64Data = encodeBase64(arrayBuffer);
    } else if (base64Data) {
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        if (!resolvedMime) {
          const match = parts[0].match(/data:(.*?);base64/);
          if (match) resolvedMime = match[1];
        }
        base64Data = parts[1];
      }
      if (!resolvedMime) resolvedMime = 'application/pdf';
    }

    const candidateKeys = [
      Deno.env.get('GEMINI_API_KEY_REPORT'),
      Deno.env.get('GEMINI_API_KEY_COMMON'),
      Deno.env.get('GEMINI_API_KEY_PRESCRIPTION'),
    ].filter(Boolean) as string[];

    const extraction = await generateClinicalAI({
      prompt: REPORT_EXTRACTION_PROMPT,
      base64Data,
      mimeType: resolvedMime,
      candidateKeys,
    });

    return new Response(JSON.stringify({ success: true, extraction }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Extract Report Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
