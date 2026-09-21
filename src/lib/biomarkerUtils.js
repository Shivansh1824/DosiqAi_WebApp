/**
 * biomarkerUtils.js
 * Clinical biomarker normalization, canonical alias mapping,
 * and trend aggregation across multiple pathology lab reports.
 */

// Strict clinical alias definitions
// Each canonical biomarker specifies exact match phrases and negative exclusions
// to prevent cross-contamination (e.g. Total Cholesterol never catches HDL or ratios).
const CANONICAL_ALIASES = [
  // ── Vitamin D ──
  {
    canonical: 'Vitamin D (25-OH)',
    match: ['vitamin d (25-oh)', 'vitamin d (25-hydroxy)', 'vitamin d 25-hydroxy', '25-hydroxy vitamin d', '25-oh vitamin d', 'vitamin d total', '25-hydroxycholecalciferol', 'vitamin d (25 hydroxycholecalciferol)', 'vitamin d3', 'vitamin d'],
    exclude: []
  },
  // ── Vitamin B12 ──
  {
    canonical: 'Vitamin B12',
    match: ['vitamin b12', 'vitamin b-12', 'vit b12', 'serum vitamin b12', 'cyanocobalamin'],
    exclude: []
  },
  // ── Blood Glucose ──
  {
    canonical: 'Fasting Blood Glucose',
    match: ['fasting glucose', 'glucose - fasting', 'glucose fasting', 'fasting blood sugar', 'fbs', 'blood glucose (fasting)', 'plasma glucose - fasting'],
    exclude: ['post', 'pp', 'ppbs', 'random']
  },
  {
    canonical: 'PP Blood Glucose',
    match: ['post prandial glucose', 'ppbs', 'postprandial blood sugar', 'glucose - pp', 'glucose post prandial', 'post prandial blood sugar'],
    exclude: ['fasting']
  },
  {
    canonical: 'HbA1c (Glycated Hb)',
    match: ['hba1c', 'glycosylated hemoglobin', 'glycated hemoglobin', 'glycated hb', 'estimated average glucose (eag)'],
    exclude: []
  },
  // ── Lipid Profile (Each is strictly independent) ──
  {
    canonical: 'Total Cholesterol',
    match: ['total cholesterol', 'serum cholesterol', 'cholesterol - total', 'cholesterol total', 'cholesterol, total', 'cholesterol (total)'],
    exclude: ['hdl', 'ldl', 'vldl', 'ratio', 'non-hdl', 'non hdl']
  },
  {
    canonical: 'Triglycerides',
    match: ['triglyceride', 'triglycerides', 'serum triglycerides', 'serum triglyceride'],
    exclude: []
  },
  {
    canonical: 'HDL Cholesterol (Good)',
    match: ['hdl cholesterol', 'hdl - cholesterol', 'cholesterol - hdl', 'serum hdl', 'hdl-cholesterol', 'high density lipoprotein'],
    exclude: ['ratio', 'non-hdl']
  },
  {
    canonical: 'LDL Cholesterol (Bad)',
    match: ['ldl cholesterol', 'ldl - cholesterol', 'cholesterol - ldl', 'serum ldl', 'ldl-cholesterol', 'low density lipoprotein'],
    exclude: ['ratio', 'vldl', 'hdl']
  },
  {
    canonical: 'VLDL Cholesterol',
    match: ['vldl cholesterol', 'vldl - cholesterol', 'cholesterol - vldl', 'serum vldl', 'vldl-cholesterol', 'very low density lipoprotein'],
    exclude: []
  },
  {
    canonical: 'Non-HDL Cholesterol',
    match: ['non-hdl cholesterol', 'non-hdl', 'non hdl cholesterol', 'cholesterol - non hdl'],
    exclude: []
  },
  {
    canonical: 'Cholesterol / HDL Ratio',
    match: ['cholesterol/hdl ratio', 'tc/hdl ratio', 'chol/hdl', 'total cholesterol / hdl', 'cholesterol:hdl ratio'],
    exclude: []
  },
  // ── Liver Function (LFT) ──
  {
    canonical: 'SGPT / ALT',
    match: ['sgpt', 'alanine aminotransferase', 'alt (sgpt)', 'sgpt/alt', 'sgpt (alt)', 'alanine transaminase'],
    exclude: ['sgot', 'ast']
  },
  {
    canonical: 'SGOT / AST',
    match: ['sgot', 'aspartate aminotransferase', 'ast (sgot)', 'sgot/ast', 'sgot (ast)', 'aspartate transaminase'],
    exclude: ['sgpt', 'alt']
  },
  {
    canonical: 'Total Bilirubin',
    match: ['bilirubin total', 'total bilirubin', 'serum bilirubin', 'bilirubin, total', 'bilirubin - total', 'bilirubin (total)'],
    exclude: ['direct', 'indirect', 'conjugated']
  },
  {
    canonical: 'Direct Bilirubin',
    match: ['bilirubin direct', 'direct bilirubin', 'bilirubin - direct', 'conjugated bilirubin', 'bilirubin direct - conjugated'],
    exclude: ['indirect', 'total']
  },
  {
    canonical: 'Indirect Bilirubin',
    match: ['bilirubin indirect', 'indirect bilirubin', 'bilirubin - indirect', 'unconjugated bilirubin'],
    exclude: ['direct', 'total']
  },
  {
    canonical: 'Alkaline Phosphatase (ALP)',
    match: ['alkaline phosphatase', 'alp', 'serum alkaline phosphatase', 'alkaline phosphatase (alp)'],
    exclude: []
  },
  {
    canonical: 'Gamma GT (GGT)',
    match: ['gamma gt', 'ggt', 'gamma glutamyl transferase', 'ggtp'],
    exclude: []
  },
  // ── Kidney Function (KFT) ──
  {
    canonical: 'Serum Creatinine',
    match: ['serum creatinine', 'creatinine - serum', 'creatinine', 's.creatinine', 'blood creatinine'],
    exclude: ['ratio', 'clearance', 'bun/creatinine', 'urea/creatinine', 'urine']
  },
  {
    canonical: 'Serum Uric Acid',
    match: ['uric acid', 'serum uric acid', 's.uric acid', 'urate', 'uric acid - serum'],
    exclude: ['urine']
  },
  {
    canonical: 'Blood Urea',
    match: ['blood urea', 'urea - serum', 'serum urea', 'urea'],
    exclude: ['nitrogen', 'bun', 'ratio', 'creatinine', 'urine', 'clearance']
  },
  {
    canonical: 'Blood Urea Nitrogen (BUN)',
    match: ['bun', 'blood urea nitrogen', 'urea nitrogen', 'serum bun'],
    exclude: ['ratio', 'creatinine']
  },
  {
    canonical: 'BUN / Creatinine Ratio',
    match: ['bun / creatinine ratio', 'bun/creatinine ratio', 'bun:creatinine ratio', 'urea / creatinine ratio', 'urea/creatinine ratio'],
    exclude: []
  },
  {
    canonical: 'eGFR',
    match: ['egfr', 'glomerular filtration rate', 'estimated gfr'],
    exclude: []
  },
  // ── Proteins ──
  {
    canonical: 'Total Protein',
    match: ['total protein', 'protein total', 'protein - total', 'serum protein', 'protein total serum'],
    exclude: ['albumin', 'globulin', 'ratio']
  },
  {
    canonical: 'Serum Albumin',
    match: ['serum albumin', 'albumin - serum', 'albumin', 'albumin serum'],
    exclude: ['globulin', 'ratio', 'microalbumin', 'urine']
  },
  {
    canonical: 'Serum Globulin',
    match: ['serum globulin', 'globulin - serum', 'globulin', 'globulin serum'],
    exclude: ['albumin', 'ratio']
  },
  {
    canonical: 'A/G Ratio',
    match: ['a/g ratio', 'albumin globulin ratio', 'ag ratio', 'a : g ratio', 'albumin/globulin ratio'],
    exclude: []
  },
  // ── Complete Blood Count (CBC) ──
  {
    canonical: 'Hemoglobin (Hb)',
    match: ['hemoglobin', 'haemoglobin', 'hb', 'hb - whole blood', 'hemoglobin (hb)'],
    exclude: ['hba1c', 'mch', 'mchc']
  },
  {
    canonical: 'Total Leucocyte Count (TLC)',
    match: ['total leucocyte count', 'total leukocyte count', 'wbc', 'wbc count', 'tlc', 'total wbc count'],
    exclude: []
  },
  {
    canonical: 'Platelet Count',
    match: ['platelet count', 'platelets', 'plt', 'total platelets'],
    exclude: []
  },
  {
    canonical: 'RBC Count',
    match: ['rbc count', 'red blood cell count', 'total rbc', 'rbc'],
    exclude: ['indices', 'rdw']
  },
  {
    canonical: 'PCV / Hematocrit',
    match: ['packed cell volume', 'pcv', 'hematocrit', 'haematocrit', 'pcv / hematocrit'],
    exclude: []
  },
  {
    canonical: 'MCV',
    match: ['mcv', 'mean corpuscular volume'],
    exclude: []
  },
  {
    canonical: 'MCH',
    match: ['mch', 'mean corpuscular hemoglobin', 'mean corpuscular haemoglobin'],
    exclude: ['mchc']
  },
  {
    canonical: 'MCHC',
    match: ['mchc', 'mean corpuscular hemoglobin conc', 'mean corpuscular haemoglobin conc'],
    exclude: []
  },
  {
    canonical: 'RDW-CV',
    match: ['rdw-cv', 'rdw cv', 'red cell distribution width - cv'],
    exclude: ['sd']
  },
  {
    canonical: 'RDW-SD',
    match: ['rdw-sd', 'rdw sd', 'red cell distribution width - sd'],
    exclude: ['cv']
  },
  {
    canonical: 'ESR',
    match: ['esr', 'erythrocyte sedimentation rate'],
    exclude: []
  },
  // ── Thyroid ──
  {
    canonical: 'TSH (Thyroid Stimulating)',
    match: ['tsh', 'thyroid stimulating hormone', 'ultrasensitive tsh', 'tsh - ultrasensitive'],
    exclude: []
  },
  {
    canonical: 'Total T3',
    match: ['total t3', 'triiodothyronine', 't3 (total)', 't3 - total'],
    exclude: ['free']
  },
  {
    canonical: 'Total T4',
    match: ['total t4', 'thyroxine', 't4 (total)', 't4 - total'],
    exclude: ['free']
  },
  // ── Minerals & Electrolytes ──
  {
    canonical: 'Serum Calcium',
    match: ['calcium', 'calcium (ca) serum', 'serum calcium', 'ca++', 'total calcium'],
    exclude: ['corrected', 'ionized', 'urine']
  },
  {
    canonical: 'Serum Phosphorus',
    match: ['phosphorus', 'serum phosphorus', 'phosphate', 'serum phosphate'],
    exclude: []
  },
  {
    canonical: 'Serum Iron',
    match: ['iron serum', 'serum iron', 'iron'],
    exclude: ['tibc', 'uibc', 'binding']
  },
  {
    canonical: 'Serum Potassium',
    match: ['potassium', 'serum potassium', 'k+', 'potassium - serum'],
    exclude: ['urine']
  },
  {
    canonical: 'Serum Sodium',
    match: ['sodium', 'serum sodium', 'na+', 'sodium - serum'],
    exclude: ['urine']
  },
  {
    canonical: 'Serum Chloride',
    match: ['chloride', 'serum chloride', 'cl-', 'chloride - serum'],
    exclude: ['urine']
  },
];

/**
 * Normalizes an arbitrary lab test string into a clean, canonical biomarker name.
 * Uses strict phrase boundary matching with exclusion filters to prevent cross-contamination.
 * 
 * @param {string} testName 
 * @returns {string} Normalized canonical title
 */
export const normalizeBiomarkerName = (testName) => {
  if (!testName) return '';
  const clean = String(testName).trim();
  const lower = clean.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim();

  // 1. Strict match with exclusions
  for (const item of CANONICAL_ALIASES) {
    // If test name contains an excluded word, skip this canonical group
    if (item.exclude && item.exclude.some(ex => lower.includes(ex))) {
      continue;
    }

    for (const pattern of item.match) {
      if (
        lower === pattern ||
        lower.startsWith(`${pattern} `) ||
        lower.endsWith(` ${pattern}`) ||
        lower.includes(`(${pattern})`) ||
        lower.includes(`- ${pattern}`) ||
        lower.includes(`${pattern} -`)
      ) {
        return item.canonical;
      }
    }
  }

  // 2. Default: Clean up original name (preserves clinical uniqueness without merging unrelated tests)
  return clean
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Resolves the genuine clinical collection/visit date from a document.
 * Prioritizes AI extracted lab report dates over file upload timestamp.
 * 
 * @param {Object} doc 
 * @returns {{ isoDate: string, displayDate: string }}
 */
export const resolveClinicalReportDate = (doc) => {
  const ai = doc?.ai_analysis_result;
  const rawDate = ai?.report_data?.report_date ||
                  ai?.report_data?.collection_date ||
                  ai?.common_data?.visit_date ||
                  doc?.visit_date ||
                  doc?.date ||
                  doc?.created_at;

  if (!rawDate) {
    return { isoDate: '2026-09-20', displayDate: 'Recent' };
  }

  // Standard date parsing
  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().split('T')[0];
    const display = parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    return { isoDate: iso, displayDate: display };
  }

  // Custom string fallback e.g. "18-Aug-2019"
  const str = String(rawDate).trim();
  return { isoDate: str, displayDate: str };
};
