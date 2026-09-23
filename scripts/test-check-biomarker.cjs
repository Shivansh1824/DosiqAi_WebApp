const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const apiKeyCommon = envFile.match(/GEMINI_API_KEY_COMMON=(.*)/)[1].trim();
const apiKeyReport = envFile.match(/GEMINI_API_KEY_REPORT=(.*)/)[1].trim();

const url = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

async function testReviewer() {
  console.log('🧪 Testing Biomarker Reviewer Prompt and Classification...');

  // 1. Fetch some sample master biomarkers
  const resM = await fetch(url + '/rest/v1/biomarkers_mastertable?select=biomarker_id,standard_name,display_name,unit,category&limit=5', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const existingBiomarkers = await resM.json();

  const testCases = [
    {
      test_name: "25-OH Cholecalciferol",
      value: "18.5",
      unit: "ng/mL",
      reference_range: "30 - 100"
    },
    {
      test_name: "Serum Ferritin",
      value: "145",
      unit: "ng/mL",
      reference_range: "30 - 400"
    },
    {
      test_name: "All disputes subject to Delhi jurisdiction only. Specimen processed at central lab.",
      value: "",
      unit: "",
      reference_range: ""
    }
  ];

  const CLINICAL_REVIEW_PROMPT = `You are an elite, board-certified clinical laboratory pathologist and medical terminology ontologist.
Your task is to review a list of "unmapped_tests" extracted from laboratory diagnostic reports and reconcile them against an existing "master_biomarkers" catalog.

For each item in "unmapped_tests", assign ONE of three strict actions:
1. "DISCARD_JUNK": For legal clauses, terms, hospital notices, disclaimers, specimen condition notes, method footnotes.
2. "MAP_TO_EXISTING": If the test is an alternative name or abbreviation of one of the existing biomarkers. Return target_biomarker_id, matched_standard_name, and new_alias_to_add.
3. "CREATE_NEW_BIOMARKER": If it is a genuine new clinical biomarker not in the list. Provide standard_name, display_name, short_name, unit, min_value, max_value, description, category, specimen_type, interpretation_normal, interpretation_low, interpretation_high, interpretation_borderline, interpretation_critical, interpretation_abnormal, and aliases (array).

Return ONLY raw JSON with:
{
  "decisions": [
    {
      "original_test_name": "String",
      "action": "DISCARD_JUNK" | "MAP_TO_EXISTING" | "CREATE_NEW_BIOMARKER",
      "discard_reason": "String or null",
      "mapping": { "target_biomarker_id": "UUID or null", "matched_standard_name": "String or null", "new_alias_to_add": "String or null" },
      "new_biomarker": { ... }
    }
  ]
}

EXISTING MASTER BIOMARKERS CATALOG:
${JSON.stringify(existingBiomarkers, null, 2)}

UNMAPPED TESTS TO REVIEW:
${JSON.stringify(testCases, null, 2)}
`;

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
  let success = false;

  for (const model of models) {
    try {
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyCommon}`;
      const resp = await fetch(gUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: CLINICAL_REVIEW_PROMPT }] }],
          generationConfig: { response_mime_type: 'application/json', temperature: 0.1 }
        })
      });

      if (!resp.ok) {
        console.warn(`Model ${model} returned ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);

      console.log('✅ AI Reviewer Response received:');
      console.log(JSON.stringify(parsed, null, 2));
      success = true;
      break;
    } catch (e) {
      console.warn(`Error with ${model}:`, e.message);
    }
  }

  if (!success) {
    console.error('All test model attempts failed.');
  }
}

testReviewer();
