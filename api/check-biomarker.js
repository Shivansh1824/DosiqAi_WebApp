import ws from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLINICAL_REVIEW_PROMPT = `You are an elite, board-certified clinical laboratory pathologist and medical terminology ontologist.
Your task is to review a list of "unmapped_tests" extracted from laboratory diagnostic reports and reconcile them against an existing "master_biomarkers" catalog.

═══════════════════════════════════════════════════════════════════════════════
DECISION PROTOCOL FOR EACH UNMAPPED TEST
═══════════════════════════════════════════════════════════════════════════════

For each item in "unmapped_tests", you must evaluate and assign ONE of three strict actions:

───────────────────────────────────────────────────────────────────────────────
ACTION 1: "DISCARD_JUNK"
───────────────────────────────────────────────────────────────────────────────
Trigger when the item is NOT a genuine physiological or biochemical biomarker.
Common examples of junk to discard:
- Legal clauses, hospital terms, dispute/jurisdiction disclaimers (e.g. "Subject to Delhi jurisdiction", "Results relate to specimen tested").
- Specimen collection remarks or physical condition (e.g. "Sample hemolysed", "Lipemic serum", "Clotted blood", "Received in EDTA tube").
- Testing methodology footers with no specific patient test (e.g. "Method: ECLIA", "Accredited by NABL", "Calculated parameter").
- Administrative metadata, doctor names, technician signatures, page numbers, or dates.
- Blank or meaningless strings.

───────────────────────────────────────────────────────────────────────────────
ACTION 2: "MAP_TO_EXISTING"
───────────────────────────────────────────────────────────────────────────────
Trigger when the test is a genuine medical test that ACTUALLY REPRESENTS ONE OF THE EXISTING BIOMARKERS in the master catalog under an alternative abbreviation, spelling, or chemical name.
Examples:
- "25-OH Cholecalciferol" or "Vit D-3" -> Maps to existing "25-Hydroxy Vitamin D" (VIT_D).
- "S. Cholesterol" or "Total Chol" -> Maps to existing "Total Cholesterol" (CHOL).
- "Fasting Blood Sugar" -> Maps to existing "Fasting Blood Glucose" (FBS).
- "Glycosylated Hb" or "A1c" -> Maps to existing "Glycosylated Hemoglobin (HbA1c)" (HBA1C).
- "SGPT" or "ALT (Serum)" -> Maps to existing "Alanine Aminotransferase (SGPT/ALT)" (ALT).

CRITICAL MEDICAL GUARDRAIL (DO NOT CONFUSE DISTINCT TESTS):
- "Direct Bilirubin" vs "Total Bilirubin" vs "Indirect Bilirubin" are SEPARATE tests. Do not map one to another!
- "Vitamin D (25-OH)" vs "Vitamin D (1,25-Dihydroxy)" are SEPARATE tests.
- "Hemoglobin" vs "Glycated Hemoglobin (HbA1c)" are SEPARATE tests.
- "Total Calcium" vs "Ionized Calcium" are SEPARATE tests.

If mapping, you must provide:
- target_biomarker_id: The exact biomarker_id from the provided master catalog.
- matched_standard_name: The standard_name of the matched master biomarker.
- new_alias_to_add: The clean, lowercase synonym to permanently store in the alias table.

───────────────────────────────────────────────────────────────────────────────
ACTION 3: "CREATE_NEW_BIOMARKER"
───────────────────────────────────────────────────────────────────────────────
Trigger when the test is a GENUINE, VALID clinical diagnostic laboratory biomarker that DOES NOT exist anywhere in the current master catalog (e.g. "Serum Ferritin", "Lipase", "Amylase", "PSA", "Homocysteine", "D-Dimer", "Troponin I").

You must construct a complete, professional clinical profile matching the exact database schema:
- standard_name: Formal clinical laboratory test name (e.g. "Ferritin, Serum").
- display_name: Clean, patient-friendly name (e.g. "Serum Ferritin").
- short_name: 2 to 8 character clean uppercase acronym (e.g. "FERRITIN", "LIPASE", "AMYLASE").
- unit: Standard physical measurement unit (e.g. "ng/mL", "U/L", "pg/mL", "mg/L").
- min_value: Standard biological reference interval lower bound (number or null).
- max_value: Standard biological reference interval upper bound (number or null).
- description: Clear 1-2 sentence plain-English explanation of what this test measures and why it matters.
- category: Diagnostic panel ("Lipid Profile", "Haematology", "Liver Function", "Kidney Function", "Diabetes & Glycemic Profile", "Vitamins & Minerals", "Electrolytes", "Iron Studies", "Thyroid Profile", "Cardiac Markers", "Pancreatic Enzymes", or "Specialized Tests").
- specimen_type: Primary biological specimen ("Serum", "Plasma", "Whole Blood EDTA", "Urine", etc.).
- interpretation_normal: Clear sentence explaining what normal values indicate.
- interpretation_low: Clinical meaning of values below reference range.
- interpretation_high: Clinical meaning of values above reference range.
- interpretation_borderline: Clinical guidance for borderline results.
- interpretation_critical: Urgent clinical thresholds or life-threatening considerations.
- interpretation_abnormal: General abnormal deviation summary.
- aliases: Array of 3 to 6 common aliases and abbreviations for this biomarker (all lowercase).

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a strict, valid JSON object matching this exact schema (no markdown, no backticks):
{
  "decisions": [
    {
      "original_test_name": "String",
      "action": "DISCARD_JUNK" | "MAP_TO_EXISTING" | "CREATE_NEW_BIOMARKER",
      "discard_reason": "String or null",
      "mapping": {
        "target_biomarker_id": "UUID string or null",
        "matched_standard_name": "String or null",
        "new_alias_to_add": "String or null"
      },
      "new_biomarker": {
        "standard_name": "String or null",
        "display_name": "String or null",
        "short_name": "String or null",
        "unit": "String or null",
        "min_value": 0.0,
        "max_value": 100.0,
        "description": "String or null",
        "category": "String or null",
        "specimen_type": "String or null",
        "interpretation_normal": "String or null",
        "interpretation_low": "String or null",
        "interpretation_high": "String or null",
        "interpretation_borderline": "String or null",
        "interpretation_critical": "String or null",
        "interpretation_abnormal": "String or null",
        "aliases": ["string", "string"]
      }
    }
  ]
}`;

export default async function handler(req, res) {
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
    const { unmapped_items, auto_persist = true } = req.body;

    if (!unmapped_items || !Array.isArray(unmapped_items) || unmapped_items.length === 0) {
      return res.status(400).json({ error: 'unmapped_items array is required and must not be empty.' });
    }

    // 1. Fetch active master biomarkers and aliases from database
    let existingBiomarkers = req.body.existing_biomarkers;
    if (!existingBiomarkers || !Array.isArray(existingBiomarkers)) {
      const { data: masters, error: mError } = await supabase
        .from('biomarkers_mastertable')
        .select(`
          biomarker_id,
          standard_name,
          display_name,
          unit,
          category,
          biomarkers_aliases ( alias_name )
        `);

      if (mError) {
        console.error('Error fetching master biomarkers:', mError);
      }

      existingBiomarkers = (masters || []).map((m) => ({
        biomarker_id: m.biomarker_id,
        standard_name: m.standard_name,
        display_name: m.display_name,
        unit: m.unit,
        category: m.category,
        aliases: (m.biomarkers_aliases || []).map((a) => a.alias_name),
      }));
    }

    // 2. Prepare AI Review Payload
    const promptInput = `
EXISTING MASTER BIOMARKERS CATALOG:
${JSON.stringify(existingBiomarkers, null, 2)}

UNMAPPED TESTS TO REVIEW:
${JSON.stringify(unmapped_items, null, 2)}

Analyze each unmapped test and return your strict clinical decisions JSON.
`;

    const fullPrompt = `${CLINICAL_REVIEW_PROMPT}\n\n${promptInput}`;

    // 3. User requested priority models:
    // 1. Gemini 3.8 Flash, 2. Gemini 3.7 Flash, 3. Gemini 3.5 Flash, 4. Gemini 3.5 Flash Lite
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ];

    // Priority API Key: GEMINI_API_KEY_COMMON, with fallback
    const candidateKeys = [
      process.env.GEMINI_API_KEY_COMMON,
      process.env.GEMINI_API_KEY_REPORT,
      process.env.GEMINI_API_KEY_PRESCRIPTION,
    ].filter(Boolean);

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
                parts: [{ text: fullPrompt }],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          if (response?.text) break keyLoop;
        } catch (err) {
          lastErr = err;
          console.warn(`[Gemini Check Biomarker] ${modelName} failed (${err.status || err.message}). Trying next candidate...`);
          continue;
        }
      }
    }

    if (!response) {
      throw lastErr || new Error('All Gemini model candidates failed for biomarker check');
    }

    const resultText = response.text;
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch {
      const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    const decisions = parsedResult?.decisions || [];
    const persistedResults = [];

    // 4. If auto_persist is enabled, perform database inserts
    if (auto_persist && Array.isArray(decisions)) {
      for (const item of decisions) {
        if (item.action === 'MAP_TO_EXISTING') {
          const targetId = item.mapping?.target_biomarker_id;
          const newAlias = item.mapping?.new_alias_to_add?.trim()?.toLowerCase();

          if (targetId && newAlias) {
            const { data: existingAlias } = await supabase
              .from('biomarkers_aliases')
              .select('id')
              .eq('biomarker_id', targetId)
              .eq('alias_name', newAlias)
              .maybeSingle();

            if (!existingAlias) {
              await supabase.from('biomarkers_aliases').insert({
                biomarker_id: targetId,
                alias_name: newAlias,
              });
            }
          }

          persistedResults.push({
            original_test_name: item.original_test_name,
            action: 'MAP_TO_EXISTING',
            biomarker_id: targetId,
            matched_standard_name: item.mapping?.matched_standard_name,
            new_alias_added: newAlias,
          });
        } else if (item.action === 'CREATE_NEW_BIOMARKER' && item.new_biomarker) {
          const nb = item.new_biomarker;

          const { data: insertedMaster, error: insertError } = await supabase
            .from('biomarkers_mastertable')
            .insert({
              standard_name: nb.standard_name || item.original_test_name,
              display_name: nb.display_name || nb.standard_name || item.original_test_name,
              short_name: nb.short_name || 'BIOMARKER',
              unit: nb.unit || null,
              min_value: typeof nb.min_value === 'number' ? nb.min_value : null,
              max_value: typeof nb.max_value === 'number' ? nb.max_value : null,
              description: nb.description || null,
              category: nb.category || 'Specialized Tests',
              specimen_type: nb.specimen_type || 'Serum',
              interpretation_normal: nb.interpretation_normal || null,
              interpretation_low: nb.interpretation_low || null,
              interpretation_high: nb.interpretation_high || null,
              interpretation_borderline: nb.interpretation_borderline || null,
              interpretation_critical: nb.interpretation_critical || null,
              interpretation_abnormal: nb.interpretation_abnormal || null,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to auto-insert new master biomarker:', insertError);
            persistedResults.push({
              original_test_name: item.original_test_name,
              action: 'ERROR',
              error: insertError.message,
            });
            continue;
          }

          const newBiomarkerId = insertedMaster.biomarker_id;

          const rawAliases = Array.isArray(nb.aliases) ? nb.aliases : [];
          rawAliases.push(item.original_test_name);
          if (nb.standard_name) rawAliases.push(nb.standard_name);
          if (nb.display_name) rawAliases.push(nb.display_name);

          const uniqueAliases = Array.from(
            new Set(rawAliases.map((a) => a.trim().toLowerCase()).filter(Boolean))
          );

          if (uniqueAliases.length > 0) {
            const aliasRows = uniqueAliases.map((alias) => ({
              biomarker_id: newBiomarkerId,
              alias_name: alias,
            }));
            await supabase.from('biomarkers_aliases').insert(aliasRows);
          }

          persistedResults.push({
            original_test_name: item.original_test_name,
            action: 'CREATED_NEW_BIOMARKER',
            biomarker_id: newBiomarkerId,
            standard_name: insertedMaster.standard_name,
            display_name: insertedMaster.display_name,
            short_name: insertedMaster.short_name,
            category: insertedMaster.category,
            unit: insertedMaster.unit,
            min_value: insertedMaster.min_value,
            max_value: insertedMaster.max_value,
            aliases_added: uniqueAliases,
          });
        } else {
          persistedResults.push({
            original_test_name: item.original_test_name,
            action: 'DISCARD_JUNK',
            reason: item.discard_reason || 'Identified as non-clinical hospital disclaimer or noise.',
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      decisions: auto_persist ? persistedResults : decisions,
      auto_persisted: auto_persist,
    });
  } catch (error) {
    console.error('Check Biomarker API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
