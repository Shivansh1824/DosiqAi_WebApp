/**
 * referenceRanges.js
 * Clinical Reference Range Parsing & Standard Laboratory Benchmarks
 * 
 * Supports:
 * - Parsing PDF-extracted ranges: "30.0 - 100.0", "< 200", "> 50", "0.2 - 1.2", etc.
 * - Standard web laboratory reference fallbacks (Mayo Clinic / Quest / LabCorp benchmarks)
 * - Computing graphical scale boundaries, percentage positions, zones, and offsets.
 */

import { normalizeBiomarkerName } from './biomarkerUtils.js';

// ─── Standard Clinical Reference Database (Web Standard Benchmarks) ───────────
const CLINICAL_REFERENCE_BENCHMARKS = {
  // Vitamins & Minerals
  'Vitamin D (25-OH)': {
    min: 30.0,
    max: 100.0,
    unit: 'ng/mL',
    optimalText: '30.0 - 100.0',
    description: 'Essential for bone density, immune function & neuromuscular health.',
  },
  'Vitamin B12': {
    min: 211,
    max: 911,
    unit: 'pg/mL',
    optimalText: '211 - 911',
    description: 'Vital for nerve function, DNA synthesis & red blood cell formation.',
  },
  'Serum Calcium': {
    min: 8.8,
    max: 10.2,
    unit: 'mg/dL',
    optimalText: '8.8 - 10.2',
    description: 'Crucial for bone mineralization, muscle contraction & nerve signaling.',
  },
  'Serum Phosphorus': {
    min: 2.5,
    max: 4.5,
    unit: 'mg/dL',
    optimalText: '2.5 - 4.5',
    description: 'Collaborates with calcium for skeletal integrity & cellular energy (ATP).',
  },
  'Serum Iron': {
    min: 60,
    max: 170,
    unit: 'µg/dL',
    optimalText: '60 - 170',
    description: 'Core component of hemoglobin for oxygen transport throughout the body.',
  },
  'Serum Potassium': {
    min: 3.5,
    max: 5.1,
    unit: 'mmol/L',
    optimalText: '3.5 - 5.1',
    description: 'Principal intracellular electrolyte governing cardiac rhythm & fluid balance.',
  },
  'Serum Sodium': {
    min: 136,
    max: 145,
    unit: 'mmol/L',
    optimalText: '136 - 145',
    description: 'Major extracellular electrolyte regulating osmotic pressure & blood volume.',
  },
  'Serum Chloride': {
    min: 96,
    max: 106,
    unit: 'mmol/L',
    optimalText: '96 - 106',
    description: 'Maintains proper acid-base balance and extracellular fluid neutrality.',
  },

  // Liver Function (LFT)
  'Total Bilirubin': {
    min: 0.2,
    max: 1.2,
    unit: 'mg/dL',
    optimalText: '0.2 - 1.2',
    description: 'Product of red blood cell breakdown; reflects hepatic clearance capacity.',
  },
  'Direct Bilirubin': {
    min: 0.0,
    max: 0.3,
    unit: 'mg/dL',
    optimalText: '0.0 - 0.3',
    description: 'Conjugated bilirubin cleared via bile ducts; elevated in biliary obstruction.',
  },
  'Indirect Bilirubin': {
    min: 0.2,
    max: 0.8,
    unit: 'mg/dL',
    optimalText: '0.2 - 0.8',
    description: 'Unconjugated bilirubin prior to hepatic metabolic processing.',
  },
  'SGPT / ALT': {
    min: 7,
    max: 55,
    unit: 'U/L',
    optimalText: '7 - 55',
    description: 'Specific hepatic enzyme; sensitive indicator of hepatocellular inflammation.',
  },
  'SGOT / AST': {
    min: 8,
    max: 48,
    unit: 'U/L',
    optimalText: '8 - 48',
    description: 'Enzyme found in liver, heart, and skeletal muscle tissue.',
  },
  'Alkaline Phosphatase (ALP)': {
    min: 44,
    max: 147,
    unit: 'U/L',
    optimalText: '44 - 147',
    description: 'Enzyme related to biliary tract patency and active bone metabolism.',
  },
  'Gamma GT (GGT)': {
    min: 9,
    max: 48,
    unit: 'U/L',
    optimalText: '9 - 48',
    description: 'Sensitive biliary enzyme marker for bile duct and hepatobiliary status.',
  },
  'Total Protein': {
    min: 6.4,
    max: 8.3,
    unit: 'g/dL',
    optimalText: '6.4 - 8.3',
    description: 'Total serum albumin and globulin fractions reflecting nutritional status.',
  },
  'Serum Albumin': {
    min: 3.5,
    max: 5.2,
    unit: 'g/dL',
    optimalText: '3.5 - 5.2',
    description: 'Major circulating protein maintaining oncotic pressure and drug binding.',
  },
  'Serum Globulin': {
    min: 2.0,
    max: 3.5,
    unit: 'g/dL',
    optimalText: '2.0 - 3.5',
    description: 'Immune antibodies and transport proteins synthesized by immune cells.',
  },
  'A/G Ratio': {
    min: 1.2,
    max: 2.2,
    unit: '',
    optimalText: '1.2 - 2.2',
    description: 'Ratio of albumin to globulin indicative of chronic systemic conditions.',
  },

  // Kidney Function (KFT)
  'Serum Creatinine': {
    min: 0.7,
    max: 1.3,
    unit: 'mg/dL',
    optimalText: '0.7 - 1.3',
    description: 'Muscle metabolism waste product; benchmark index for renal filtration.',
  },
  'Serum Uric Acid': {
    min: 3.5,
    max: 7.2,
    unit: 'mg/dL',
    optimalText: '3.5 - 7.2',
    description: 'Purine breakdown byproduct; high levels associated with gout and renal stress.',
  },
  'Blood Urea': {
    min: 15,
    max: 45,
    unit: 'mg/dL',
    optimalText: '15 - 45',
    description: 'Nitrogenous waste product cleared primarily by functioning glomeruli.',
  },
  'Blood Urea Nitrogen (BUN)': {
    min: 7,
    max: 20,
    unit: 'mg/dL',
    optimalText: '7 - 20',
    description: 'Measures nitrogen portion of urea; key marker for renal perfusion.',
  },

  // Glucose & Metabolism
  'Fasting Blood Glucose': {
    min: 70,
    max: 99,
    unit: 'mg/dL',
    optimalText: '70 - 99',
    description: 'Basal plasma glucose after an 8-12 hour overnight fasting window.',
  },
  'PP Blood Glucose': {
    min: 70,
    max: 140,
    unit: 'mg/dL',
    optimalText: '< 140',
    description: 'Postprandial glycemic response measured 2 hours following a meal.',
  },
  'HbA1c (Glycated Hb)': {
    min: 4.0,
    max: 5.6,
    unit: '%',
    optimalText: '4.0 - 5.6',
    description: 'Weighted 3-month retrospective average of circulating blood glucose.',
  },

  // Lipid Profile
  'Total Cholesterol': {
    min: 125,
    max: 200,
    unit: 'mg/dL',
    optimalText: '< 200',
    description: 'Comprehensive measure of circulating sterols and lipoprotein particles.',
  },
  'Triglycerides': {
    min: 50,
    max: 150,
    unit: 'mg/dL',
    optimalText: '< 150',
    description: 'Primary circulating storage fat; responsive to dietary carbohydrates.',
  },
  'HDL Cholesterol (Good)': {
    min: 40,
    max: 70,
    unit: 'mg/dL',
    optimalText: '> 40',
    description: 'Reverse cholesterol transport lipoprotein that shields vascular walls.',
  },
  'LDL Cholesterol (Bad)': {
    min: 50,
    max: 100,
    unit: 'mg/dL',
    optimalText: '< 100',
    description: 'Atherogenic lipoprotein depositing lipid plaques in arterial linings.',
  },
  'VLDL Cholesterol': {
    min: 5,
    max: 30,
    unit: 'mg/dL',
    optimalText: '5 - 30',
    description: 'Very-low-density particle synthesized by the liver carrying triglycerides.',
  },

  // CBC
  'Hemoglobin (Hb)': {
    min: 13.0,
    max: 17.5,
    unit: 'g/dL',
    optimalText: '13.0 - 17.5',
    description: 'Iron-containing oxygen-transport metalloprotein in erythrocytes.',
  },
  'Total Leucocyte Count (TLC)': {
    min: 4000,
    max: 11000,
    unit: '/µL',
    optimalText: '4,000 - 11,000',
    description: 'White blood cells orchestrating host cellular defense and immunity.',
  },
  'Platelet Count': {
    min: 150000,
    max: 450000,
    unit: '/µL',
    optimalText: '150,000 - 450,000',
    description: 'Cell fragments essential for primary hemostasis and clot initiation.',
  },
  'RBC Count': {
    min: 4.5,
    max: 5.9,
    unit: 'mil/µL',
    optimalText: '4.5 - 5.9',
    description: 'Total erythrocyte concentration providing systemic oxygenation capacity.',
  },
  'PCV / Hematocrit': {
    min: 40,
    max: 50,
    unit: '%',
    optimalText: '40 - 50',
    description: 'Volume percentage of whole blood composed of packed red cells.',
  },
  'ESR': {
    min: 0,
    max: 20,
    unit: 'mm/hr',
    optimalText: '0 - 20',
    description: 'Erythrocyte sedimentation rate reflecting systemic acute-phase inflammation.',
  },

  // Thyroid
  'TSH (Thyroid Stimulating)': {
    min: 0.4,
    max: 4.2,
    unit: 'µIU/mL',
    optimalText: '0.4 - 4.2',
    description: 'Pituitary hormone driving thyroid follicular synthesis of T3 and T4.',
  },
  'Total T3': {
    min: 0.8,
    max: 2.0,
    unit: 'ng/mL',
    optimalText: '0.8 - 2.0',
    description: 'Active metabolic thyroid hormone regulating cellular thermogenesis.',
  },
  'Total T4': {
    min: 5.1,
    max: 14.1,
    unit: 'µg/dL',
    optimalText: '5.1 - 14.1',
    description: 'Primary prohormone reservoir released by the follicular thyroid gland.',
  },
};

// ─── Extract Numeric Tokens from String ────────────────────────────────────────
const parseNum = (val) => {
  if (val === null || val === undefined) return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const match = cleaned.match(/[-+]?[0-9]*\.?[0-9]+/);
  return match ? parseFloat(match[0]) : NaN;
};

/**
 * Parses raw reference range string or resolves clinical benchmark fallback.
 * 
 * @param {Object} metric - Lab metric object { test_name, value, unit, reference_range, is_abnormal }
 * @returns {Object} Comprehensive parsed range & graphical plotting model
 */
export const parseBiomarkerRange = (metric) => {
  const rawTestName = metric?.test_name || '';
  const canonicalName = normalizeBiomarkerName(rawTestName) || rawTestName;
  const benchmark = CLINICAL_REFERENCE_BENCHMARKS[canonicalName] || null;

  const patientVal = metric?.numeric_value !== undefined && metric?.numeric_value !== null
    ? Number(metric.numeric_value)
    : parseNum(metric?.value);

  const rawRange = metric?.reference_range ? String(metric.reference_range).trim() : '';

  let min = null;
  let max = null;
  let rangeType = 'unknown'; // 'two_sided' | 'max_only' | 'min_only' | 'text' | 'benchmark'
  let isStandardFallback = false;

  // 1. Try parsing raw reference_range string
  if (rawRange) {
    // Pattern A: "30.0 - 100.0" or "30 - 100" or "30.0 to 100.0" or "0.2 – 1.2"
    const rangeMatch = rawRange.match(/^([0-9.,]+)\s*(?:-|–|—|to)\s*([0-9.,]+)$/i);
    if (rangeMatch) {
      const p1 = parseNum(rangeMatch[1]);
      const p2 = parseNum(rangeMatch[2]);
      if (!isNaN(p1) && !isNaN(p2)) {
        min = Math.min(p1, p2);
        max = Math.max(p1, p2);
        rangeType = 'two_sided';
      }
    }

    // Pattern B: "< 200" or "<= 200" or "Less than 200"
    if (!rangeType || rangeType === 'unknown') {
      const maxOnlyMatch = rawRange.match(/^(?:<|<=|less\s+than|up\s+to)\s*([0-9.,]+)$/i);
      if (maxOnlyMatch) {
        max = parseNum(maxOnlyMatch[1]);
        min = benchmark?.min !== undefined ? benchmark.min : 0;
        rangeType = 'max_only';
      }
    }

    // Pattern C: "> 40" or ">= 40" or "Greater than 40"
    if (!rangeType || rangeType === 'unknown') {
      const minOnlyMatch = rawRange.match(/^(?:>|>=|greater\s+than|more\s+than)\s*([0-9.,]+)$/i);
      if (minOnlyMatch) {
        min = parseNum(minOnlyMatch[1]);
        max = benchmark?.max !== undefined ? benchmark.max : (min * 2.5);
        rangeType = 'min_only';
      }
    }

    // Pattern D: Complex multi-tier string e.g. "< 20: Deficient, 20-30: Insufficient, 30-100: Sufficiency"
    if (!rangeType || rangeType === 'unknown') {
      const sufficiencyMatch = rawRange.match(/([0-9.,]+)\s*-\s*([0-9.,]+)(?:\s*:\s*(?:normal|sufficient|sufficiency|optimal))/i);
      if (sufficiencyMatch) {
        min = parseNum(sufficiencyMatch[1]);
        max = parseNum(sufficiencyMatch[2]);
        rangeType = 'two_sided';
      }
    }
  }

  // 2. If PDF range was missing or unparseable, use standard clinical benchmark
  if ((min === null || max === null) && benchmark) {
    min = benchmark.min;
    max = benchmark.max;
    rangeType = 'benchmark';
    isStandardFallback = true;
  }

  // If still completely unparseable
  if (min === null || max === null || isNaN(min) || isNaN(max)) {
    return {
      hasValidRange: false,
      rawRange,
      canonicalName,
      patientVal: isNaN(patientVal) ? metric?.value : patientVal,
      unit: metric?.unit || '',
      isAbnormal: !!metric?.is_abnormal,
      description: benchmark?.description || '',
    };
  }

  // 3. Compute Zone & Severity
  let zone = 'normal';
  let deltaFromThreshold = 0;
  let deltaLabel = 'Within Target';

  if (!isNaN(patientVal)) {
    if (patientVal < min) {
      zone = 'low';
      deltaFromThreshold = patientVal - min; // negative number
      const formattedDiff = Math.abs(deltaFromThreshold).toFixed(1);
      deltaLabel = `${formattedDiff} ${metric?.unit || ''} below min normal`;
    } else if (patientVal > max) {
      zone = 'high';
      deltaFromThreshold = patientVal - max; // positive number
      const formattedDiff = Math.abs(deltaFromThreshold).toFixed(1);
      deltaLabel = `${formattedDiff} ${metric?.unit || ''} above max normal`;
    } else {
      zone = 'normal';
      deltaLabel = 'Optimal / Within Range';
    }
  }

  // 4. Graphical Scale Boundaries (scaleMin to scaleMax)
  // Ensure the scale has enough runway below min and above max so the needle
  // never clips the edge even if patientVal is low (e.g. 14.3 when min is 30) or high.
  const span = max - min || 1;
  const paddingLower = span * 0.35;
  const paddingUpper = span * 0.35;

  let scaleMin = Math.max(0, min - paddingLower);
  if (min < 0) scaleMin = min - paddingLower;

  let scaleMax = max + paddingUpper;

  if (!isNaN(patientVal)) {
    if (patientVal < scaleMin) scaleMin = Math.max(0, patientVal - span * 0.2);
    if (patientVal > scaleMax) scaleMax = patientVal + span * 0.2;
  }

  // Ensure scaleMin is strictly less than scaleMax
  if (scaleMax <= scaleMin) scaleMax = scaleMin + 10;
  const totalScaleSpan = scaleMax - scaleMin;

  // 5. Zone Percentages along the graphical bar
  const normalLeftPct = Math.max(0, Math.min(100, ((min - scaleMin) / totalScaleSpan) * 100));
  const normalRightPct = Math.max(0, Math.min(100, ((max - scaleMin) / totalScaleSpan) * 100));
  const normalWidthPct = Math.max(5, normalRightPct - normalLeftPct);

  // 6. Patient Pin Position Percentage
  let pinPct = 50;
  if (!isNaN(patientVal)) {
    const rawPct = ((patientVal - scaleMin) / totalScaleSpan) * 100;
    pinPct = Math.max(2, Math.min(98, rawPct));
  }

  return {
    hasValidRange: true,
    canonicalName,
    rawRange,
    min,
    max,
    rangeType,
    isStandardFallback,
    patientVal,
    unit: metric?.unit || benchmark?.unit || '',
    isAbnormal: metric?.is_abnormal || zone !== 'normal',
    zone, // 'low' | 'normal' | 'high'
    deltaFromThreshold,
    deltaLabel,
    scaleMin,
    scaleMax,
    normalLeftPct,
    normalWidthPct,
    pinPct,
    optimalText: rawRange || benchmark?.optimalText || `${min} - ${max}`,
    description: benchmark?.description || '',
    method: metric?.method || null,
  };
};
