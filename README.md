# Dosiq AI — Family Medical Vault & Clinical Intelligence Co-Pilot

A secure family medical vault and clinical AI co-pilot. Permanently stores and organizes family health records, decodes handwritten doctor prescriptions, alerts on adverse drug-drug interactions, visualizes lab vitals, and tracks medication adherence via a two-way WhatsApp care loop.

---

## 🌟 Core Pillars

1. **The Secure Family Medical Vault:** Centralized, encrypted cloud health locker with single-caregiver multi-profile dossiers (`Self`, `Dad`, `Mom`, `Children`) for rapid retrieval during doctor visits.
2. **Clinical AI Vision:** Decodes handwritten doctor prescriptions and lab reports into structured dosages, meal instructions, and active regimens with a two-step caregiver verification card.
3. **Zero-App WhatsApp Care Loop:** Solves elderly tech friction by dispatching automated, timed dosage check-ins via WhatsApp. Dependent replies (*"YES"* or *"NO"*) instantly synchronize live adherence checkmarks to the caregiver's web dashboard.
4. **Drug-Drug Conflict Shield:** Proactive safety engine that cross-references newly uploaded prescriptions against existing active regimens, flagging adverse drug interactions in plain English.
5. **Dynamic Lab Vitals Trend Visualizer:** Extracts diagnostic biomarkers (HbA1c, Blood Glucose, Blood Pressure, Cholesterol) from lab reports into interactive historical trend lines with clinical status alerts.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Radix UI
- **Design System:** Dark clinical slate (`#0F172A`) with emerald green (`#10B981`) and cyan/teal accents
- **Backend & Storage:** Supabase PostgreSQL, Encrypted Storage Buckets, and Row-Level Security (RLS)
- **AI & Integrations:** Google Multimodal Vision APIs, Twilio WhatsApp API / In-App WhatsApp Live Simulator
