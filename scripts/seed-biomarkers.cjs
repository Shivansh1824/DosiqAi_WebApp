const fs = require('fs');

// Read .env
const envFile = fs.readFileSync('.env', 'utf-8');
const url = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const BIOMARKERS = [
  // 1. Haematology & CBC
  {
    standard_name: 'Hemoglobin',
    display_name: 'Hemoglobin',
    short_name: 'HGB',
    unit: 'g/dL',
    min_value: 13.0,
    max_value: 17.0,
    description: 'Iron-rich protein in red blood cells that carries oxygen from your lungs to the rest of your body.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Hemoglobin levels are within healthy physiological limits.',
    interpretation_low: 'Indicates anemia, potential blood loss, nutritional iron/folate deficiency, or bone marrow suppression.',
    interpretation_high: 'Indicates polycythemia, chronic hypoxia (smoking, COPD), high altitude adaptation, or dehydration.',
    interpretation_borderline: 'Borderline hemoglobin level; check red cell indices and iron panel.',
    interpretation_critical: 'Critical hemoglobin (<7.0 g/dL or >20.0 g/dL) requiring urgent medical intervention.',
    interpretation_abnormal: 'Hemoglobin deviates from the standard reference interval.',
    aliases: ['hemoglobin', 'hb', 'hgb', 'total hemoglobin', 'cyanide-free sls-hemoglobin']
  },
  {
    standard_name: 'Red Blood Cell Count',
    display_name: 'RBC Count',
    short_name: 'RBC',
    unit: 'mili/cu.mm',
    min_value: 4.5,
    max_value: 5.5,
    description: 'Total number of circulating red blood cells carrying oxygen throughout the body.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'RBC count is optimal for adequate tissue oxygenation.',
    interpretation_low: 'Associated with anemia, bone marrow disease, hemorrhage, or hemolysis.',
    interpretation_high: 'Associated with erythrocytosis, congenital heart disease, severe dehydration, or pulmonary fibrosis.',
    interpretation_borderline: 'Slight deviation in RBC count; clinical correlation recommended.',
    interpretation_critical: 'Critical RBC level compromising oxygen delivery.',
    interpretation_abnormal: 'Abnormal red cell population.',
    aliases: ['rbc', 'red blood cell count', 'total rbc', 'erythrocyte count']
  },
  {
    standard_name: 'Packed Cell Volume',
    display_name: 'PCV / Hematocrit',
    short_name: 'PCV',
    unit: '%',
    min_value: 40.0,
    max_value: 54.0,
    description: 'Percentage of total blood volume made up of red blood cells.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Hematocrit ratio is well-balanced.',
    interpretation_low: 'Suggests anemia or hemodilution (fluid overload).',
    interpretation_high: 'Suggests hemoconcentration (dehydration) or polycythemia.',
    interpretation_borderline: 'Borderline hematocrit percentage.',
    interpretation_critical: 'Critical hematocrit (<20% or >60%) with risk of cardiac failure or hyperviscosity.',
    interpretation_abnormal: 'Abnormal ratio of cells to plasma.',
    aliases: ['pcv', 'packed cell volume', 'hematocrit', 'hct']
  },
  {
    standard_name: 'Mean Corpuscular Volume',
    display_name: 'MCV',
    short_name: 'MCV',
    unit: 'fL',
    min_value: 83.0,
    max_value: 101.0,
    description: 'Average size of red blood cells, crucial for classifying types of anemia.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Normocytic red blood cells.',
    interpretation_low: 'Microcytic red cells; frequently seen in iron deficiency anemia and thalassemia.',
    interpretation_high: 'Macrocytic red cells; commonly seen in Vitamin B12 or folate deficiency, liver disease, or alcohol excess.',
    interpretation_borderline: 'Borderline red cell volume.',
    interpretation_critical: 'Severe microcytosis or macrocytosis.',
    interpretation_abnormal: 'Abnormal red cell size distribution.',
    aliases: ['mcv', 'mean corpuscular volume']
  },
  {
    standard_name: 'Mean Corpuscular Hemoglobin',
    display_name: 'MCH',
    short_name: 'MCH',
    unit: 'pg',
    min_value: 27.0,
    max_value: 32.0,
    description: 'Average amount of hemoglobin inside a single red blood cell.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Normal hemoglobin content per cell.',
    interpretation_low: 'Hypochromic cells; typical of iron deficiency.',
    interpretation_high: 'Hyperchromic cells; typical of macrocytic anemias.',
    interpretation_borderline: 'Borderline cellular hemoglobin.',
    interpretation_critical: 'Markedly abnormal MCH.',
    interpretation_abnormal: 'Abnormal hemoglobin per cell.',
    aliases: ['mch', 'mean corpuscular hemoglobin']
  },
  {
    standard_name: 'Mean Corpuscular Hemoglobin Concentration',
    display_name: 'MCHC',
    short_name: 'MCHC',
    unit: 'g/dL',
    min_value: 32.0,
    max_value: 35.0,
    description: 'Average concentration of hemoglobin in a given volume of packed red blood cells.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Normal hemoglobin concentration in red cells.',
    interpretation_low: 'Hypochromia; red blood cells are paler than normal.',
    interpretation_high: 'Hereditary spherocytosis or severe red cell agglutination.',
    interpretation_borderline: 'Borderline MCHC.',
    interpretation_critical: 'Severe concentration abnormality.',
    interpretation_abnormal: 'MCHC is outside expected range.',
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration']
  },
  {
    standard_name: 'Total Leucocyte Count',
    display_name: 'WBC Count',
    short_name: 'WBC',
    unit: '10^3/µI',
    min_value: 4.0,
    max_value: 10.0,
    description: 'Total number of white blood cells protecting the body against infection and disease.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'White blood cell count is within normal immune limits.',
    interpretation_low: 'Leukopenia; risk of viral infection, drug toxicity, or bone marrow suppression.',
    interpretation_high: 'Leukocytosis; indicates bacterial infection, systemic inflammation, physical stress, or leukemia.',
    interpretation_borderline: 'Borderline immune reaction.',
    interpretation_critical: 'Critical WBC (<2.0 or >30.0 10^3/uL) requiring urgent clinical triage.',
    interpretation_abnormal: 'Immune cell count is abnormal.',
    aliases: ['total leucocyte count', 'wbc', 'tlc', 'white blood cell count', 'leukocyte count']
  },
  {
    standard_name: 'Platelet Count',
    display_name: 'Platelet Count',
    short_name: 'PLT',
    unit: '10^3/µI',
    min_value: 150.0,
    max_value: 410.0,
    description: 'Cell fragments in the blood that are essential for normal blood clotting and wound healing.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Platelet count is adequate for normal hemostasis.',
    interpretation_low: 'Thrombocytopenia; heightened risk of bruising and spontaneous bleeding (e.g. dengue, ITP).',
    interpretation_high: 'Thrombocytosis; may indicate reactive thrombocytosis, iron deficiency, or myeloproliferative disorder.',
    interpretation_borderline: 'Borderline platelet count.',
    interpretation_critical: 'Critical platelets (<50 or >1000 10^3/uL) with acute hemorrhage or thrombosis risk.',
    interpretation_abnormal: 'Platelet count is outside physiological range.',
    aliases: ['platelet count', 'platelets', 'plt', 'total platelets']
  },
  {
    standard_name: 'Erythrocyte Sedimentation Rate',
    display_name: 'ESR',
    short_name: 'ESR',
    unit: 'mm/hour',
    min_value: 0.0,
    max_value: 10.0,
    description: 'General marker of systemic inflammation and immune activity.',
    category: 'Haematology',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'No active acute-phase systemic inflammation detected.',
    interpretation_low: 'Low ESR is typically a normal physiological finding with no clinical concern.',
    interpretation_high: 'Elevated ESR reflects inflammation, autoimmune disease (RA, SLE), infection, or tissue necrosis.',
    interpretation_borderline: 'Mild, nonspecific inflammatory elevation.',
    interpretation_critical: 'Significantly elevated ESR (>60 mm/hr) suggestive of temporal arteritis, severe infection, or malignancy.',
    interpretation_abnormal: 'Elevated inflammatory response.',
    aliases: ['erythrocyte sedimentation rate', 'esr', 'westergren esr', 'sedimentation rate']
  },

  // 2. Lipid Profile
  {
    standard_name: 'Total Cholesterol',
    display_name: 'Total Cholesterol',
    short_name: 'CHOL',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 200.0,
    description: 'Overall measure of all cholesterol types circulating in the bloodstream.',
    category: 'Lipid Profile',
    specimen_type: 'Serum',
    interpretation_normal: 'Desirable cholesterol level supporting long-term cardiovascular health.',
    interpretation_low: 'Hypocholesterolemia; may relate to severe malnutrition, liver dysfunction, or hyperthyroidism.',
    interpretation_high: 'Hypercholesterolemia; increases risk of atherosclerosis and coronary heart disease.',
    interpretation_borderline: 'Borderline high (200-239 mg/dL); lifestyle and dietary adjustments recommended.',
    interpretation_critical: 'Very high cholesterol (>=240 mg/dL) posing acute vascular risk.',
    interpretation_abnormal: 'Lipid metabolism is dysregulated.',
    aliases: ['cholesterol', 'total cholesterol', 'serum cholesterol', 's. cholesterol', 'chol']
  },
  {
    standard_name: 'High-Density Lipoprotein Cholesterol',
    display_name: 'HDL Cholesterol',
    short_name: 'HDL',
    unit: 'mg/dL',
    min_value: 40.0,
    max_value: 60.0,
    description: 'Known as "good cholesterol", it scavenges excess arterial cholesterol and carries it back to the liver.',
    category: 'Lipid Profile',
    specimen_type: 'Serum',
    interpretation_normal: 'Optimal HDL level offering cardiovascular protection.',
    interpretation_low: 'Low HDL (<40 mg/dL in men, <50 mg/dL in women) increases cardiovascular risk.',
    interpretation_high: 'High HDL (>60 mg/dL) provides protective cardioprotective effect.',
    interpretation_borderline: 'Borderline HDL.',
    interpretation_critical: 'Severely depressed HDL (<25 mg/dL).',
    interpretation_abnormal: 'Cardioprotective lipid is abnormal.',
    aliases: ['hdl', 'hdl cholesterol', 'good cholesterol', 'high density lipoprotein', 'serum hdl']
  },
  {
    standard_name: 'Low-Density Lipoprotein Cholesterol',
    display_name: 'LDL Cholesterol',
    short_name: 'LDL',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 100.0,
    description: 'Known as "bad cholesterol", excessive LDL deposits arterial plaque, narrowing blood vessels.',
    category: 'Lipid Profile',
    specimen_type: 'Serum',
    interpretation_normal: 'Desirable LDL level with low atherosclerotic risk.',
    interpretation_low: 'Low LDL is usually favorable or seen in malabsorption.',
    interpretation_high: 'Elevated LDL (>=160 mg/dL) accelerates arterial plaque buildup.',
    interpretation_borderline: 'Borderline high LDL (130-159 mg/dL); consider dietary intervention.',
    interpretation_critical: 'Very high LDL (>=190 mg/dL) indicating familial hypercholesterolemia or urgent statin therapy requirement.',
    interpretation_abnormal: 'Atherogenic lipoprotein is elevated.',
    aliases: ['ldl', 'ldl cholesterol', 'bad cholesterol', 'low density lipoprotein', 'serum ldl']
  },
  {
    standard_name: 'Triglycerides',
    display_name: 'Triglycerides',
    short_name: 'TRIG',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 150.0,
    description: 'Most common type of fat in the body, storing unused calories from meals.',
    category: 'Lipid Profile',
    specimen_type: 'Serum',
    interpretation_normal: 'Normal fasting triglyceride levels.',
    interpretation_low: 'Low triglycerides; rarely of clinical significance.',
    interpretation_high: 'Hypertriglyceridemia; linked to metabolic syndrome, fatty liver, and increased heart disease risk.',
    interpretation_borderline: 'Borderline high triglycerides (150-199 mg/dL).',
    interpretation_critical: 'Severe hypertriglyceridemia (>500 mg/dL) with acute pancreatitis risk.',
    interpretation_abnormal: 'Triglyceride levels deviate from normal.',
    aliases: ['triglycerides', 'triglyceride', 'tg', 'serum triglycerides', 'trig']
  },
  {
    standard_name: 'Very Low-Density Lipoprotein Cholesterol',
    display_name: 'VLDL Cholesterol',
    short_name: 'VLDL',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 30.0,
    description: 'Particle produced by the liver to deliver triglycerides to peripheral tissues.',
    category: 'Lipid Profile',
    specimen_type: 'Serum',
    interpretation_normal: 'Normal VLDL level.',
    interpretation_low: 'Low VLDL is generally benign.',
    interpretation_high: 'Elevated VLDL indicates excess circulating triglyceride-rich particles.',
    interpretation_borderline: 'Borderline VLDL concentration.',
    interpretation_critical: 'Markedly high VLDL.',
    interpretation_abnormal: 'Elevated VLDL circulating concentration.',
    aliases: ['vldl', 'vldl cholesterol', 'very low density lipoprotein']
  },

  // 3. Diabetes & Glycemic Profile
  {
    standard_name: 'Fasting Blood Glucose',
    display_name: 'Fasting Blood Sugar',
    short_name: 'FBS',
    unit: 'mg/dL',
    min_value: 70.0,
    max_value: 100.0,
    description: 'Measures blood glucose concentration after an overnight fast (minimum 8-10 hours).',
    category: 'Diabetes & Glycemic Profile',
    specimen_type: 'Plasma/Serum',
    interpretation_normal: 'Fasting blood glucose is within normal glycemic limits.',
    interpretation_low: 'Hypoglycemia (<70 mg/dL); risk of dizziness, tremor, or insulin excess.',
    interpretation_high: 'Impaired fasting glucose / Diabetes (>=126 mg/dL on two separate occasions).',
    interpretation_borderline: 'Impaired fasting glucose / Pre-diabetes (100-125 mg/dL).',
    interpretation_critical: 'Severe hypoglycemia (<50 mg/dL) or hyperosmolar hyperglycemia (>300 mg/dL).',
    interpretation_abnormal: 'Blood sugar regulation is outside physiological targets.',
    aliases: ['blood sugar fasting', 'fasting blood sugar', 'fasting glucose', 'fbs', 'glucose fasting']
  },
  {
    standard_name: 'Glycosylated Hemoglobin (HbA1c)',
    display_name: 'HbA1c',
    short_name: 'HBA1C',
    unit: '%',
    min_value: 4.0,
    max_value: 5.6,
    description: 'Reflects your average blood glucose levels over the preceding 2 to 3 months.',
    category: 'Diabetes & Glycemic Profile',
    specimen_type: 'Whole Blood EDTA',
    interpretation_normal: 'Optimal glycemic control; non-diabetic range.',
    interpretation_low: 'Low HbA1c; may indicate frequent hypoglycemia or shortened red cell lifespan (hemolysis).',
    interpretation_high: 'Elevated HbA1c (>=6.5%) confirms diabetes mellitus.',
    interpretation_borderline: 'Prediabetes (5.7% - 6.4%); high risk of progression to type 2 diabetes.',
    interpretation_critical: 'Very poorly controlled diabetes (>10.0%) with high long-term microvascular risk.',
    interpretation_abnormal: 'Long-term glycemic regulation is abnormal.',
    aliases: ['glycosylated hemoglobin (hba1c)', 'hba1c', 'glycated hemoglobin', 'a1c', 'hemoglobin a1c', 'glycosylated hemoglobin']
  },
  {
    standard_name: 'Average Blood Glucose',
    display_name: 'Average Blood Glucose',
    short_name: 'ABG',
    unit: 'mg/dL',
    min_value: 90.0,
    max_value: 120.0,
    description: 'Estimated average blood glucose (eAG) calculated directly from HbA1c.',
    category: 'Diabetes & Glycemic Profile',
    specimen_type: 'Calculated',
    interpretation_normal: 'Estimated 3-month average glucose is in excellent control.',
    interpretation_low: 'Low estimated 3-month average glucose.',
    interpretation_high: 'Elevated 3-month average glucose requiring medication review.',
    interpretation_borderline: 'Average glucose is borderline elevated.',
    interpretation_critical: 'Action suggested or panic glucose level.',
    interpretation_abnormal: 'Calculated average glucose deviates from normal.',
    aliases: ['average blood glucose', 'eag', 'estimated average glucose']
  },

  // 4. Vitamins & Minerals
  {
    standard_name: '25-Hydroxy Vitamin D',
    display_name: 'Vitamin D (25-OH)',
    short_name: 'VIT_D',
    unit: 'ng/mL',
    min_value: 30.0,
    max_value: 100.0,
    description: 'Primary body storage form of Vitamin D, essential for calcium absorption, bone strength, and immunity.',
    category: 'Vitamins & Minerals',
    specimen_type: 'Serum',
    interpretation_normal: 'Sufficient Vitamin D levels supporting bone density and metabolic wellness.',
    interpretation_low: 'Vitamin D deficiency (<20 ng/mL) or insufficiency (20-30 ng/mL) linked to bone loss and fatigue.',
    interpretation_high: 'Hypervitaminosis D (>100 ng/mL); risk of hypercalcemia and kidney calcification.',
    interpretation_borderline: 'Insufficient Vitamin D (20-30 ng/mL); supplementation recommended.',
    interpretation_critical: 'Severe deficiency (<10 ng/mL) or vitamin D toxicity (>150 ng/mL).',
    interpretation_abnormal: 'Vitamin D level is abnormal.',
    aliases: ['vitamin d (25 hydroxy)', 'vitamin d (25-hydroxy)', 'vitamin d', 'vit d', 'vit d3', 'vitamin d3', '25-hydroxy vitamin d', '25-oh cholecalciferol', 'cholecalciferol']
  },
  {
    standard_name: 'Vitamin B12',
    display_name: 'Vitamin B12',
    short_name: 'VIT_B12',
    unit: 'pg/mL',
    min_value: 211.0,
    max_value: 911.0,
    description: 'Essential nutrient required for red blood cell production, neurological function, and DNA synthesis.',
    category: 'Vitamins & Minerals',
    specimen_type: 'Serum',
    interpretation_normal: 'Vitamin B12 stores are adequate.',
    interpretation_low: 'B12 deficiency (<211 pg/mL); causes megaloblastic anemia, peripheral neuropathy, and cognitive fog.',
    interpretation_high: 'Elevated B12; seen with excessive supplementation, liver disease, or myeloproliferative disorders.',
    interpretation_borderline: 'Borderline B12 level; evaluate methylmalonic acid or homocysteine.',
    interpretation_critical: 'Severe deficiency (<150 pg/mL) with irreversible nerve impairment risk.',
    interpretation_abnormal: 'B12 levels are out of normal physiological range.',
    aliases: ['b12', 'vitamin b12', 'vit b12', 'cyanocobalamin', 'serum b12']
  },

  // 5. Kidney Function Test (KFT / RFT)
  {
    standard_name: 'Serum Creatinine',
    display_name: 'Creatinine',
    short_name: 'CREAT',
    unit: 'mg/dL',
    min_value: 0.70,
    max_value: 1.30,
    description: 'Waste byproduct of normal muscle breakdown, cleared exclusively by healthy kidneys.',
    category: 'Kidney Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Kidney filtration efficiency is normal.',
    interpretation_low: 'Low creatinine; usually relates to low muscle mass, strict vegetarianism, or severe liver disease.',
    interpretation_high: 'Elevated creatinine indicates acute or chronic renal impairment and reduced filtration.',
    interpretation_borderline: 'Mildly elevated creatinine; hydration check and repeat test advised.',
    interpretation_critical: 'Critical renal impairment (>3.0 mg/dL) requiring emergency nephrology consult.',
    interpretation_abnormal: 'Kidney filtration index is abnormal.',
    aliases: ['creatinine', 'serum creatinine', 's. creatinine', 'creat']
  },
  {
    standard_name: 'Blood Urea Nitrogen',
    display_name: 'BUN',
    short_name: 'BUN',
    unit: 'mg/dL',
    min_value: 7.0,
    max_value: 20.0,
    description: 'Amount of nitrogen in your blood that comes from the waste product urea.',
    category: 'Kidney Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Protein metabolism and renal excretion are balanced.',
    interpretation_low: 'Low BUN; may indicate malnutrition, severe liver disease, or overhydration.',
    interpretation_high: 'Elevated BUN; seen in dehydration, high-protein diet, gastrointestinal bleed, or renal disease.',
    interpretation_borderline: 'Borderline elevated BUN.',
    interpretation_critical: 'Uremic levels (>50 mg/dL) indicating severe renal dysfunction.',
    interpretation_abnormal: 'Nitrogenous waste excretion is abnormal.',
    aliases: ['blood urea nitrogen', 'blood urea nitrogen (bun)', 'bun']
  },
  {
    standard_name: 'Blood Urea',
    display_name: 'Blood Urea',
    short_name: 'UREA',
    unit: 'mg/dL',
    min_value: 13.0,
    max_value: 43.0,
    description: 'Main nitrogen-containing waste product excreted by the kidneys.',
    category: 'Kidney Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Blood urea is within standard physiological limits.',
    interpretation_low: 'Low urea; usually of minimal clinical significance or seen with low protein intake.',
    interpretation_high: 'Elevated urea indicates impaired renal excretion or excessive protein catabolism.',
    interpretation_borderline: 'Borderline urea level.',
    interpretation_critical: 'Markedly high urea requiring renal evaluation.',
    interpretation_abnormal: 'Urea level is abnormal.',
    aliases: ['urea', 'blood urea', 'serum urea']
  },
  {
    standard_name: 'Serum Uric Acid',
    display_name: 'Uric Acid',
    short_name: 'URIC',
    unit: 'mg/dL',
    min_value: 3.5,
    max_value: 7.2,
    description: 'Waste product from the breakdown of purines found in certain foods and body cells.',
    category: 'Kidney Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Normal purine metabolism with low risk of urate crystallization.',
    interpretation_low: 'Hypouricemia; uncommon, occasionally seen in Wilson disease or Fanconi syndrome.',
    interpretation_high: 'Hyperuricemia (>7.2 mg/dL); high risk of gouty arthritis and kidney stone formation.',
    interpretation_borderline: 'Borderline uric acid; monitor purine-rich diet.',
    interpretation_critical: 'Severely elevated uric acid (>10.0 mg/dL) requiring hypouricemic therapy.',
    interpretation_abnormal: 'Uric acid concentration deviates from reference range.',
    aliases: ['uric acid', 'serum uric acid', 's. uric acid']
  },

  // 6. Liver Function Test (LFT)
  {
    standard_name: 'Bilirubin, Total',
    display_name: 'Total Bilirubin',
    short_name: 'TBIL',
    unit: 'mg/dL',
    min_value: 0.3,
    max_value: 1.2,
    description: 'Yellow pigment produced during the normal breakdown of red blood cells.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Bilirubin clearance and biliary excretion are normal.',
    interpretation_low: 'Low bilirubin has no known adverse clinical significance.',
    interpretation_high: 'Hyperbilirubinemia; causes clinical jaundice, biliary obstruction, hepatitis, or hemolysis.',
    interpretation_borderline: 'Mild unconjugated elevation (e.g. Gilbert syndrome).',
    interpretation_critical: 'Severe jaundice (>3.0 mg/dL) requiring acute hepatobiliary evaluation.',
    interpretation_abnormal: 'Bile pigment accumulation.',
    aliases: ['bilirubin total', 'total bilirubin', 'bilirubin (total)', 's. bilirubin']
  },
  {
    standard_name: 'Bilirubin, Direct (Conjugated)',
    display_name: 'Direct Bilirubin',
    short_name: 'DBIL',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 0.30,
    description: 'Water-soluble bilirubin processed and conjugated by the liver.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Direct bilirubin is excreted normally into bile.',
    interpretation_low: 'Normal physiological state.',
    interpretation_high: 'Cholestasis, biliary tract obstruction (gallstones/stricture), or hepatitis.',
    interpretation_borderline: 'Borderline direct fraction.',
    interpretation_critical: 'Marked conjugated hyperbilirubinemia.',
    interpretation_abnormal: 'Direct bilirubin clearance impaired.',
    aliases: ['bilirubin direct', 'direct bilirubin', 'bilirubin direct - conjucated', 'conjugated bilirubin', 'bilirubin (direct)']
  },
  {
    standard_name: 'Bilirubin, Indirect (Unconjugated)',
    display_name: 'Indirect Bilirubin',
    short_name: 'IBIL',
    unit: 'mg/dL',
    min_value: 0.0,
    max_value: 1.0,
    description: 'Fat-soluble bilirubin bound to albumin prior to hepatic processing.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Indirect bilirubin clearance is normal.',
    interpretation_low: 'Normal finding.',
    interpretation_high: 'Excessive hemolysis (RBC destruction) or impaired hepatic uptake (Gilbert syndrome).',
    interpretation_borderline: 'Mild elevation.',
    interpretation_critical: 'Severe indirect elevation.',
    interpretation_abnormal: 'Unconjugated bilirubin elevated.',
    aliases: ['bilirubin indirect', 'indirect bilirubin', 'bilirubin indirect - unconjugated', 'unconjugated bilirubin', 'bilirubin (indirect)']
  },
  {
    standard_name: 'Aspartate Aminotransferase (SGOT/AST)',
    display_name: 'SGOT / AST',
    short_name: 'AST',
    unit: 'IU/L',
    min_value: 0.0,
    max_value: 35.0,
    description: 'Enzyme found in liver, heart, and skeletal muscle; leaks into blood during cell injury.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'No active hepatocellular or muscular necrosis.',
    interpretation_low: 'Normal physiological level.',
    interpretation_high: 'Elevated AST reflects liver inflammation, myocardial injury, or strenuous muscle trauma.',
    interpretation_borderline: 'Mild transaminitis (35-50 IU/L); recheck in 2 weeks.',
    interpretation_critical: 'Acute transaminitis (>500 IU/L) suggestive of toxic, ischemic, or viral hepatitis.',
    interpretation_abnormal: 'Enzyme leakage indicates cellular stress.',
    aliases: ['sgot', 'ast', 'sgot / ast', 'sgot (ast)', 'aspartate aminotransferase']
  },
  {
    standard_name: 'Alanine Aminotransferase (SGPT/ALT)',
    display_name: 'SGPT / ALT',
    short_name: 'ALT',
    unit: 'IU/L',
    min_value: 10.0,
    max_value: 49.0,
    description: 'Liver-specific enzyme that serves as the premier biological indicator of liver health.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Liver cellular integrity is intact.',
    interpretation_low: 'Normal physiological level.',
    interpretation_high: 'Hepatic injury from fatty liver disease (NAFLD), medication toxicity, alcohol, or viral hepatitis.',
    interpretation_borderline: 'Mild liver stress (50-80 IU/L); lifestyle evaluation recommended.',
    interpretation_critical: 'Severe acute hepatic necrosis (>500 IU/L).',
    interpretation_abnormal: 'Elevated hepatic transaminase.',
    aliases: ['sgpt', 'alt', 'sgpt / alt', 'sgpt (alt)', 'alanine aminotransferase']
  },
  {
    standard_name: 'Gamma-Glutamyl Transferase',
    display_name: 'Gamma GT',
    short_name: 'GGT',
    unit: 'IU/L',
    min_value: 0.0,
    max_value: 72.0,
    description: 'Enzyme highly sensitive to bile duct obstruction and alcohol consumption.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Biliary tree is functioning without obstruction.',
    interpretation_low: 'Normal physiological finding.',
    interpretation_high: 'Indicates cholestasis, biliary inflammation, heavy alcohol consumption, or medication toxicity.',
    interpretation_borderline: 'Mild biliary enzyme elevation.',
    interpretation_critical: 'Significant biliary duct pathology.',
    interpretation_abnormal: 'GGT indicates biliary stress.',
    aliases: ['gamma gt', 'ggt', 'gamma glutamyl transferase']
  },
  {
    standard_name: 'Alkaline Phosphatase',
    display_name: 'ALP',
    short_name: 'ALP',
    unit: 'U/L',
    min_value: 45.0,
    max_value: 129.0,
    description: 'Enzyme related to the bile ducts in the liver and active bone formation.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Normal hepatobiliary and bone turnover activity.',
    interpretation_low: 'Hypophosphatasia or malnutrition (rare).',
    interpretation_high: 'Biliary obstruction, gallstones, liver disease, or active bone conditions (Paget disease).',
    interpretation_borderline: 'Borderline elevated ALP.',
    interpretation_critical: 'Markedly high ALP (>300 U/L) requiring abdominal ultrasound.',
    interpretation_abnormal: 'Alkaline phosphatase activity is abnormal.',
    aliases: ['alkaline phosphatase', 'alp', 'alkaline phosphatase (alp)']
  },
  {
    standard_name: 'Total Protein, Serum',
    display_name: 'Total Protein',
    short_name: 'PROT',
    unit: 'gm/dL',
    min_value: 5.7,
    max_value: 8.2,
    description: 'Total amount of protein in the blood, primarily albumin and globulins.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Total circulating protein levels are healthy.',
    interpretation_low: 'Hypoproteinemia; seen in malnutrition, liver cirrhosis, or nephrotic syndrome.',
    interpretation_high: 'Hyperproteinemia; indicates dehydration, chronic infection, or multiple myeloma.',
    interpretation_borderline: 'Borderline protein concentration.',
    interpretation_critical: 'Severe protein deficit (<4.5 gm/dL).',
    interpretation_abnormal: 'Circulating protein concentration is abnormal.',
    aliases: ['protein total serum', 'total protein', 'serum total protein', 'serum protein']
  },
  {
    standard_name: 'Albumin, Serum',
    display_name: 'Albumin',
    short_name: 'ALB',
    unit: 'gm/dL',
    min_value: 3.2,
    max_value: 4.8,
    description: 'Major blood protein made by the liver that keeps fluid from leaking out of blood vessels.',
    category: 'Liver Function',
    specimen_type: 'Serum',
    interpretation_normal: 'Liver synthetic function and vascular oncotic pressure are normal.',
    interpretation_low: 'Hypoalbuminemia; seen in severe liver disease, malnutrition, or kidney protein loss (edema risk).',
    interpretation_high: 'Hyperalbuminemia; almost exclusively caused by dehydration.',
    interpretation_borderline: 'Borderline albumin concentration.',
    interpretation_critical: 'Severe hypoalbuminemia (<2.0 gm/dL) with high ascites and peripheral edema risk.',
    interpretation_abnormal: 'Albumin synthesis or loss is abnormal.',
    aliases: ['albumin serum', 'albumin', 'serum albumin']
  },

  // 7. Electrolytes
  {
    standard_name: 'Sodium, Serum',
    display_name: 'Sodium',
    short_name: 'NA',
    unit: 'mmol/L',
    min_value: 136.0,
    max_value: 145.0,
    description: 'Essential electrolyte regulating extracellular fluid volume, blood pressure, and nerve function.',
    category: 'Electrolytes',
    specimen_type: 'Serum',
    interpretation_normal: 'Fluid balance and electrolyte osmotic pressure are normal.',
    interpretation_low: 'Hyponatremia (<136 mmol/L); caused by diuretics, heart failure, syndrome of inappropriate ADH (confusion risk).',
    interpretation_high: 'Hypernatremia (>145 mmol/L); caused by severe water loss, diabetes insipidus, or excessive salt intake.',
    interpretation_borderline: 'Borderline sodium concentration.',
    interpretation_critical: 'Critical sodium (<120 or >160 mmol/L) with severe seizure or coma risk.',
    interpretation_abnormal: 'Electrolyte balance is disrupted.',
    aliases: ['sodium', 'na', 'serum sodium']
  },
  {
    standard_name: 'Potassium, Serum',
    display_name: 'Potassium',
    short_name: 'K',
    unit: 'mmol/L',
    min_value: 3.5,
    max_value: 5.1,
    description: 'Critical electrolyte regulating heart rhythm, electrical conduction, and muscle contractions.',
    category: 'Electrolytes',
    specimen_type: 'Serum',
    interpretation_normal: 'Cardiac electrical stability is optimal.',
    interpretation_low: 'Hypokalemia (<3.5 mmol/L); risk of cardiac arrhythmias, muscle weakness, and cramps.',
    interpretation_high: 'Hyperkalemia (>5.1 mmol/L); dangerous risk of fatal cardiac arrest, seen in renal failure.',
    interpretation_borderline: 'Borderline potassium concentration.',
    interpretation_critical: 'Critical potassium (<2.8 or >6.2 mmol/L) requiring emergency ECG and treatment.',
    interpretation_abnormal: 'Potassium is outside safe limits.',
    aliases: ['potassium', 'k', 'serum potassium']
  },
  {
    standard_name: 'Chloride, Serum',
    display_name: 'Chloride',
    short_name: 'CL',
    unit: 'mmol/L',
    min_value: 98.0,
    max_value: 107.0,
    description: 'Key anion maintaining proper blood volume, blood pressure, and acid-base balance.',
    category: 'Electrolytes',
    specimen_type: 'Serum',
    interpretation_normal: 'Acid-base and anion-cation balance are normal.',
    interpretation_low: 'Hypochloremia; seen in prolonged vomiting, respiratory acidosis, or diuretic therapy.',
    interpretation_high: 'Hyperchloremia; seen in dehydration, kidney disease, or hyperchloremic metabolic acidosis.',
    interpretation_borderline: 'Borderline chloride concentration.',
    interpretation_critical: 'Severe acid-base disturbance.',
    interpretation_abnormal: 'Chloride level is abnormal.',
    aliases: ['chloride', 'cl', 'serum chloride']
  }
];

async function seed() {
  console.log(`🚀 Starting seed for ${BIOMARKERS.length} predefined master biomarkers...`);

  let masterCount = 0;
  let aliasCount = 0;

  for (const b of BIOMARKERS) {
    const { aliases, ...masterData } = b;

    // Insert master record
    const resM = await fetch(url + '/rest/v1/biomarkers_mastertable', {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(masterData)
    });

    if (!resM.ok) {
      const err = await resM.text();
      console.error(`❌ Failed to insert master ${b.standard_name}:`, err);
      continue;
    }

    const inserted = await resM.json();
    const biomarkerId = inserted[0]?.biomarker_id;
    masterCount++;

    // Prepare aliases
    const aliasRows = aliases.map(alias => ({
      biomarker_id: biomarkerId,
      alias_name: alias.trim().toLowerCase()
    }));

    // Also include standard_name and display_name as aliases
    aliasRows.push({
      biomarker_id: biomarkerId,
      alias_name: b.standard_name.trim().toLowerCase()
    });
    aliasRows.push({
      biomarker_id: biomarkerId,
      alias_name: b.display_name.trim().toLowerCase()
    });

    // Deduplicate
    const uniqueMap = new Map();
    for (const r of aliasRows) {
      uniqueMap.set(r.alias_name, r);
    }
    const finalAliases = Array.from(uniqueMap.values());

    const resA = await fetch(url + '/rest/v1/biomarkers_aliases', {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalAliases)
    });

    if (!resA.ok) {
      const errA = await resA.text();
      console.error(`⚠️ Failed to insert aliases for ${b.standard_name}:`, errA);
    } else {
      aliasCount += finalAliases.length;
    }

    console.log(`✅ [${masterCount}/${BIOMARKERS.length}] ${b.display_name} seeded with ${finalAliases.length} aliases.`);
  }

  console.log(`\n🎉 Seed finished successfully!`);
  console.log(`Total Master Biomarkers: ${masterCount}`);
  console.log(`Total Biomarker Aliases: ${aliasCount}`);
}

seed().catch(err => {
  console.error('Fatal error seeding biomarkers:', err);
  process.exit(1);
});
