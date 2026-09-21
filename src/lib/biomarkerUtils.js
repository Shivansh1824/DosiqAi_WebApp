/**
 * biomarkerUtils.js
 * Clinical biomarker normalization, canonical alias mapping,
 * and trend aggregation across multiple pathology lab reports.
 */

const CANONICAL_ALIASES = [
  // ── Vitamin D ──
  {
    canonical: 'Vitamin D (25-OH)',
    match: ['vitamin d', '25-hydroxy', '25-oh', 'cholecalciferol', 'vit d', 'calciferol']
  },
  // ── Vitamin B12 ──
  {
    canonical: 'Vitamin B12',
    match: ['vitamin b12', 'vitamin b-12', 'vit b12', 'cyanocobalamin', 'cobalamin']
  },
  // ── Blood Glucose ──
  {
    canonical: 'Fasting Blood Glucose',
    match: ['fasting glucose', 'glucose - fasting', 'glucose fasting', 'fasting blood sugar', 'fbs', 'blood glucose (fasting)']
  },
  {
    canonical: 'PP Blood Glucose',
    match: ['post prandial', 'ppbs', 'postprandial', 'glucose - pp', 'glucose post']
  },
  {
    canonical: 'HbA1c (Glycated Hb)',
    match: ['hba1c', 'glycosylated hemoglobin', 'glycated hemoglobin', 'glycated hb', 'estimated average glucose']
  },
  // ── Lipid Profile ──
  {
    canonical: 'Total Cholesterol',
    match: ['total cholesterol', 'serum cholesterol', 'cholesterol - total', 'cholesterol total', 'cholesterol, total']
  },
  {
    canonical: 'Triglycerides',
    match: ['triglyceride', 'triglycerides', 'serum triglycerides', 'tg']
  },
  {
    canonical: 'HDL Cholesterol (Good)',
    match: ['hdl cholesterol', 'hdl - cholesterol', 'cholesterol - hdl', 'serum hdl']
  },
  {
    canonical: 'LDL Cholesterol (Bad)',
    match: ['ldl cholesterol', 'ldl - cholesterol', 'cholesterol - ldl', 'serum ldl']
  },
  {
    canonical: 'VLDL Cholesterol',
    match: ['vldl cholesterol', 'vldl - cholesterol', 'cholesterol - vldl', 'serum vldl']
  },
  {
    canonical: 'Non-HDL Cholesterol',
    match: ['non-hdl', 'non hdl']
  },
  {
    canonical: 'Total / HDL Ratio',
    match: ['cholesterol/hdl ratio', 'tc/hdl ratio', 'chol/hdl', 'total cholesterol / hdl']
  },
  // ── Liver Function (LFT) ──
  {
    canonical: 'SGPT / ALT',
    match: ['sgpt', 'alanine aminotransferase', 'alt (sgpt)', 'sgpt/alt']
  },
  {
    canonical: 'SGOT / AST',
    match: ['sgot', 'aspartate aminotransferase', 'ast (sgot)', 'sgot/ast']
  },
  {
    canonical: 'Total Bilirubin',
    match: ['bilirubin total', 'total bilirubin', 'serum bilirubin', 'bilirubin, total', 'bilirubin - total']
  },
  {
    canonical: 'Direct Bilirubin',
    match: ['bilirubin direct', 'direct bilirubin', 'bilirubin - direct', 'conjugated bilirubin']
  },
  {
    canonical: 'Indirect Bilirubin',
    match: ['bilirubin indirect', 'indirect bilirubin', 'bilirubin - indirect', 'unconjugated bilirubin']
  },
  {
    canonical: 'Alkaline Phosphatase (ALP)',
    match: ['alkaline phosphatase', 'alp', 'serum alkaline phosphatase']
  },
  {
    canonical: 'Gamma GT (GGT)',
    match: ['gamma gt', 'ggt', 'gamma glutamyl transferase', 'ggtp']
  },
  // ── Kidney Function (KFT) ──
  {
    canonical: 'Serum Creatinine',
    match: ['serum creatinine', 'creatinine - serum', 'creatinine', 's.creatinine']
  },
  {
    canonical: 'Serum Uric Acid',
    match: ['uric acid', 'serum uric acid', 's.uric acid', 'urate']
  },
  {
    canonical: 'Blood Urea',
    match: ['blood urea', 'urea - serum', 'serum urea', 'urea']
  },
  {
    canonical: 'Blood Urea Nitrogen (BUN)',
    match: ['bun', 'blood urea nitrogen', 'urea nitrogen']
  },
  {
    canonical: 'eGFR',
    match: ['egfr', 'glomerular filtration rate']
  },
  // ── Proteins ──
  {
    canonical: 'Total Protein',
    match: ['total protein', 'protein total', 'protein - total', 'serum protein']
  },
  {
    canonical: 'Serum Albumin',
    match: ['serum albumin', 'albumin - serum', 'albumin']
  },
  {
    canonical: 'Serum Globulin',
    match: ['serum globulin', 'globulin - serum', 'globulin']
  },
  {
    canonical: 'A/G Ratio',
    match: ['a/g ratio', 'albumin globulin ratio', 'ag ratio', 'a : g ratio']
  },
  // ── Complete Blood Count (CBC) ──
  {
    canonical: 'Hemoglobin (Hb)',
    match: ['hemoglobin', 'haemoglobin', 'hb', 'hb - whole blood']
  },
  {
    canonical: 'Total Leucocyte Count (TLC)',
    match: ['total leucocyte count', 'total leukocyte count', 'wbc', 'wbc count', 'tlc']
  },
  {
    canonical: 'Platelet Count',
    match: ['platelet count', 'platelets', 'plt']
  },
  {
    canonical: 'RBC Count',
    match: ['rbc count', 'red blood cell', 'total rbc']
  },
  {
    canonical: 'PCV / Hematocrit',
    match: ['packed cell volume', 'pcv', 'hematocrit', 'haematocrit']
  },
  {
    canonical: 'MCV',
    match: ['mcv', 'mean corpuscular volume']
  },
  {
    canonical: 'MCH',
    match: ['mch', 'mean corpuscular hemoglobin', 'mean corpuscular haemoglobin']
  },
  {
    canonical: 'MCHC',
    match: ['mchc', 'mean corpuscular hemoglobin conc']
  },
  {
    canonical: 'RDW',
    match: ['rdw', 'red cell distribution width']
  },
  {
    canonical: 'ESR',
    match: ['esr', 'erythrocyte sedimentation rate']
  },
  // ── Thyroid ──
  {
    canonical: 'TSH (Thyroid Stimulating)',
    match: ['tsh', 'thyroid stimulating hormone', 'ultrasensitive tsh']
  },
  {
    canonical: 'Total T3',
    match: ['total t3', 'triiodothyronine', 't3']
  },
  {
    canonical: 'Total T4',
    match: ['total t4', 'thyroxine', 't4']
  },
  // ── Minerals & Electrolytes ──
  {
    canonical: 'Serum Calcium',
    match: ['calcium', 'calcium (ca) serum', 'serum calcium', 'ca++']
  },
  {
    canonical: 'Serum Phosphorus',
    match: ['phosphorus', 'serum phosphorus', 'phosphate']
  },
  {
    canonical: 'Serum Iron',
    match: ['iron serum', 'serum iron', 'iron']
  },
  {
    canonical: 'Serum Potassium',
    match: ['potassium', 'serum potassium', 'k+']
  },
  {
    canonical: 'Serum Sodium',
    match: ['sodium', 'serum sodium', 'na+']
  },
  {
    canonical: 'Serum Chloride',
    match: ['chloride', 'serum chloride', 'cl-']
  },
];

/**
 * Normalizes an arbitrary lab test string into a clean, canonical biomarker name.
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

  // Find exact alias match
  for (const item of CANONICAL_ALIASES) {
    for (const pattern of item.match) {
      if (lower === pattern || lower.startsWith(`${pattern} `) || lower.endsWith(` ${pattern}`) || lower.includes(`(${pattern})`)) {
        return item.canonical;
      }
    }
  }

  // Fallback substring scan for high-confidence tokens
  for (const item of CANONICAL_ALIASES) {
    if (item.match.some(m => lower.includes(m))) {
      return item.canonical;
    }
  }

  // Default: Title-cased cleaned name
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

  // Try standard parsing
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

  // String fallback if custom format like "18-Aug-2019"
  const str = String(rawDate).trim();
  return { isoDate: str, displayDate: str };
};
