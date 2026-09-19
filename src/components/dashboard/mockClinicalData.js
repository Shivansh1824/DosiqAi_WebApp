// ─── Mock Clinical Data ───────────────────────────────────────────────────────
// Static seed data for dashboard frontend structure phase.
// Mirrors the Supabase schema but lives in memory for offline/judge demos.

export const PROFILES = [
  {
    id: 'self',
    name: 'Shivansh Rana',
    relationship: 'Self',
    initials: 'SR',
    emoji: '🧑‍💻',
    age: 24,
    gender: 'male',
    morning_dose_time: '08:00',
    afternoon_dose_time: '14:00',
    night_dose_time: '20:00',
    telegram_linked: true,
    care_loop_enabled: true,
  },
  {
    id: 'dad',
    name: 'Rajesh Rana',
    relationship: 'Father',
    initials: 'RR',
    emoji: '👨',
    age: 58,
    gender: 'male',
    morning_dose_time: '08:00',
    afternoon_dose_time: '14:00',
    night_dose_time: '20:00',
    telegram_linked: true,
    care_loop_enabled: true,
  },
  {
    id: 'mom',
    name: 'Sunita Rana',
    relationship: 'Mother',
    initials: 'SR',
    emoji: '👩',
    age: 54,
    gender: 'female',
    morning_dose_time: '07:00',
    afternoon_dose_time: '13:00',
    night_dose_time: '21:00',
    telegram_linked: false,
    care_loop_enabled: false,
  },
];

export const MEDICATIONS = {
  self: [
    {
      id: 'm1', slot: 'morning', time: '08:00',
      name: 'Azithromycin 500mg', brand: 'Azithral-500',
      category: 'Antibiotic', categoryColor: 'amber',
      food: 'After Food', duration: '5 days',
      status: 'taken', confirmedAt: '08:06 AM', channel: 'telegram',
    },
    {
      id: 'm2', slot: 'night', time: '22:00',
      name: 'Cetirizine 10mg', brand: 'Cetrizine-10',
      category: 'Antihistamine', categoryColor: 'rose',
      food: 'Before Sleep', duration: 'Ongoing',
      status: 'pending', confirmedAt: null, channel: null,
    },
  ],
  dad: [
    {
      id: 'd1', slot: 'morning', time: '08:00',
      name: 'Telmisartan 40mg', brand: 'Telma-40',
      category: 'Blood Pressure', categoryColor: 'emerald',
      food: 'After Food', duration: 'Ongoing',
      status: 'taken', confirmedAt: '08:02 AM', channel: 'telegram',
    },
    {
      id: 'd2', slot: 'morning', time: '07:30',
      name: 'Pantoprazole+Domperidone', brand: 'Pan-D',
      category: 'Gastric', categoryColor: 'teal',
      food: 'Before Food', duration: 'Ongoing',
      status: 'taken', confirmedAt: '07:34 AM', channel: 'telegram',
    },
    {
      id: 'd3', slot: 'night', time: '20:00',
      name: 'Telmisartan 40mg', brand: 'Telma-40',
      category: 'Blood Pressure', categoryColor: 'emerald',
      food: 'After Food', duration: 'Ongoing',
      status: 'pending', confirmedAt: null, channel: null,
    },
  ],
  mom: [
    {
      id: 'mm1', slot: 'morning', time: '07:00',
      name: 'Metformin 500mg', brand: 'Glycomet-500',
      category: 'Diabetes', categoryColor: 'sky',
      food: 'With Food', duration: 'Ongoing',
      status: 'skipped', confirmedAt: null, channel: null,
    },
    {
      id: 'mm2', slot: 'morning', time: '06:00',
      name: 'Levothyroxine 50mcg', brand: 'Eltroxin-50',
      category: 'Thyroid', categoryColor: 'violet',
      food: 'Empty Stomach', duration: 'Ongoing',
      status: 'taken', confirmedAt: '06:12 AM', channel: 'telegram',
    },
    {
      id: 'mm3', slot: 'night', time: '21:00',
      name: 'Metformin 500mg', brand: 'Glycomet-500',
      category: 'Diabetes', categoryColor: 'sky',
      food: 'With Food', duration: 'Ongoing',
      status: 'pending', confirmedAt: null, channel: null,
    },
  ],
};

export const DOCUMENTS = {
  self: [
    {
      id: 'doc1', type: 'Prescription', doctor: 'Dr. A. Sharma, MBBS',
      clinic: 'Apollo Clinic, Noida', date: '2026-09-10',
      diagnosis: 'Upper Respiratory Infection', verified: true,
      badge: 'Rx Decoded', ai_status: 'completed',
    },
  ],
  dad: [
    {
      id: 'doc2', type: 'Prescription', doctor: 'Dr. R. Mehta, MD (Cardiology)',
      clinic: 'Fortis Heart Institute', date: '2026-09-01',
      diagnosis: 'Essential Hypertension, Stage 1', verified: true,
      badge: 'Rx Decoded', ai_status: 'completed',
    },
    {
      id: 'doc3', type: 'Blood Test', doctor: 'SRL Diagnostics',
      clinic: 'SRL Lab, Sector 18', date: '2026-08-15',
      diagnosis: 'Lipid Panel + CBC', verified: true,
      badge: 'Lab Analyzed', ai_status: 'completed',
    },
    {
      id: 'doc4', type: 'Discharge Summary', doctor: 'Dr. V. Kapoor',
      clinic: 'Max Hospital, Delhi', date: '2026-07-20',
      diagnosis: 'Acute Bronchitis — 3-Day Admission', verified: true,
      badge: 'Archived', ai_status: 'completed',
    },
  ],
  mom: [
    {
      id: 'doc5', type: 'Prescription', doctor: 'Dr. S. Patel, MD (Endocrinology)',
      clinic: 'Manipal Hospital', date: '2026-09-05',
      diagnosis: 'Type 2 DM + Hypothyroidism', verified: true,
      badge: 'Rx Decoded', ai_status: 'completed',
    },
    {
      id: 'doc6', type: 'Blood Test', doctor: 'Metropolis Labs',
      clinic: 'Metropolis, Sector 62', date: '2026-08-28',
      diagnosis: 'HbA1c + Thyroid Profile (TSH, T3, T4)', verified: true,
      badge: 'Lab Analyzed', ai_status: 'completed',
    },
  ],
};

export const BIOMARKERS = {
  dad: {
    bloodSugar: [
      { month: 'Mar', fasting: 118, postprandial: 155 },
      { month: 'Apr', fasting: 112, postprandial: 148 },
      { month: 'May', fasting: 108, postprandial: 142 },
      { month: 'Jun', fasting: 115, postprandial: 158 },
      { month: 'Jul', fasting: 106, postprandial: 139 },
      { month: 'Aug', fasting: 103, postprandial: 134 },
    ],
    hba1c: [
      { month: 'Mar', value: 6.8 },
      { month: 'Apr', value: 6.6 },
      { month: 'May', value: 6.5 },
      { month: 'Jun', value: 6.7 },
      { month: 'Jul', value: 6.4 },
      { month: 'Aug', value: 6.2 },
    ],
    bp: [
      { month: 'Mar', systolic: 148, diastolic: 92 },
      { month: 'Apr', systolic: 142, diastolic: 88 },
      { month: 'May', systolic: 138, diastolic: 85 },
      { month: 'Jun', systolic: 135, diastolic: 84 },
      { month: 'Jul', systolic: 132, diastolic: 82 },
      { month: 'Aug', systolic: 128, diastolic: 80 },
    ],
  },
  mom: {
    bloodSugar: [
      { month: 'Mar', fasting: 185, postprandial: 240 },
      { month: 'Apr', fasting: 172, postprandial: 225 },
      { month: 'May', fasting: 165, postprandial: 210 },
      { month: 'Jun', fasting: 158, postprandial: 198 },
      { month: 'Jul', fasting: 148, postprandial: 187 },
      { month: 'Aug', fasting: 142, postprandial: 178 },
    ],
    hba1c: [
      { month: 'Mar', value: 8.2 },
      { month: 'Apr', value: 7.9 },
      { month: 'May', value: 7.6 },
      { month: 'Jun', value: 7.4 },
      { month: 'Jul', value: 7.2 },
      { month: 'Aug', value: 7.0 },
    ],
    bp: [
      { month: 'Mar', systolic: 126, diastolic: 80 },
      { month: 'Apr', systolic: 124, diastolic: 79 },
      { month: 'May', systolic: 122, diastolic: 78 },
      { month: 'Jun', systolic: 120, diastolic: 77 },
      { month: 'Jul', systolic: 118, diastolic: 76 },
      { month: 'Aug', systolic: 116, diastolic: 75 },
    ],
  },
  self: { bloodSugar: [], hba1c: [], bp: [] },
};

export const DRUG_CONFLICTS = {
  dad: [
    {
      id: 'cf1',
      severity: 'moderate',
      drug1: 'Telmisartan (ARB)',
      drug2: 'Ibuprofen (NSAID)',
      description: 'NSAIDs may reduce the antihypertensive effect of ARBs and increase risk of acute kidney injury.',
      recommendation: 'Avoid NSAIDs. Use Paracetamol for pain relief instead.',
    },
  ],
  mom: [],
  self: [],
};

export const CARE_LOOP_EVENTS = [
  {
    id: 'ev1', profile: 'dad',
    medication: 'Tab Telma-40', slot: 'morning',
    status: 'confirmed', response_at: '08:02 AM',
    message: 'Dad confirmed his morning dose at 08:02 AM ✓',
  },
  {
    id: 'ev2', profile: 'dad',
    medication: 'Cap Pan-D', slot: 'morning',
    status: 'confirmed', response_at: '07:34 AM',
    message: 'Dad confirmed Pan-D at 07:34 AM ✓',
  },
];
