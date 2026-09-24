import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateClinicalAI } from '../_shared/gemini.ts';

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

9. CLINICAL NARRATIVE (PATIENT & CAREGIVER ADVICE):
   Write a separate 2-4 sentence "clinical_narrative" in plain English for the patient/caregiver ("For You & Your Family"):
   - Reassuringly explain why these medications were prescribed in everyday terms.
   - Give practical care guidance for the patient and caregiver (e.g. meal timings, completing the course, hydration).
   - End with clear advice on when to follow up or contact the doctor if symptoms do not improve.
   This narrative is patient-friendly — no medical jargon. It goes in prescription_data.clinical_narrative.

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
    "clinical_narrative": "2-4 sentence patient-friendly narrative per RULE 9",
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { cloud_file_key } = body;
    let base64Data = body.file_base64;
    let mimeType = body.mime_type;

    if (!base64Data && cloud_file_key) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const storagePath = cloud_file_key.replace(/^medical-vault\//, '');
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

      mimeType = storagePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                 storagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                 'image/jpeg';

      const arrayBuffer = await fileData.arrayBuffer();
      base64Data = encodeBase64(arrayBuffer);
    } else if (base64Data) {
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        if (!mimeType) {
          const match = parts[0].match(/data:(.*?);base64/);
          if (match) mimeType = match[1];
        }
        base64Data = parts[1];
      }
      if (!mimeType) mimeType = 'image/jpeg';
    }

    if (!base64Data) {
      return new Response(JSON.stringify({ error: 'Missing cloud_file_key or file_base64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const candidateKeys = [
      Deno.env.get('GEMINI_API_KEY_PRESCRIPTION'),
      Deno.env.get('GEMINI_API_KEY_COMMON'),
      Deno.env.get('GEMINI_API_KEY_REPORT'),
    ].filter(Boolean) as string[];

    const extraction = await generateClinicalAI({
      prompt: PRESCRIPTION_EXTRACTION_PROMPT,
      base64Data,
      mimeType,
      candidateKeys,
    });

    return new Response(JSON.stringify({ success: true, extraction }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Extract Prescription Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
