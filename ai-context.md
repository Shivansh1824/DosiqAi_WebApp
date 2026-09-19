# Dosiq AI Web App — Project Context & Master Specification

**Team Name:** VoxNexa  
**Target Events:** 
1. *Global Innovation Hackathon 2026* (Bharat Academix | Healthcare & MedTech Track)
2. *Hack Devengers 2.0* (Devengers & Lovable | 24-Hour Open Innovation Sprint)

---

## 1. Executive Summary & Core Identity

**Dosiq AI Web App** is a **Secure Family Medical Document Vault & Clinical Intelligence Co-Pilot**. 

Unlike generic reminder apps that require tedious manual typing, Dosiq AI is a centralized digital health locker that permanently stores, categorizes, and protects family medical histories (prescriptions, lab tests, scans, and discharge summaries). On top of this secure storage, Google APIs automatically decode handwritten doctor prescriptions, normalize complex dosage shorthand, cross-check for adverse drug-drug interactions, and connect to a two-way WhatsApp care loop for elderly family members.

---

## 2. Lineage & Reference to Original Codebase

This project originates from the core vision of the `dosiqAi` repository, but **selectively extracts only specific high-value components** while consciously discarding legacy mobile overhead:

### What We Are Adopting:
- **Clinical AI Extraction Logic**: The prompt-engineering principles and extraction models for converting doctor handwriting and clinical codes (`1-0-1`, `BD`, `TDS`, `AC/PC`) into structured data.
- **Family Health Data Model**: The architectural structure for `family_members`, `documents`, `medications`, and `health_vitals` with Row-Level Security (RLS).
- **Clinical Safety Concept**: The drug-drug interaction screening concept to prevent accidental duplicate or conflicting medications.

### What We Are Leaving Behind:
- **Mobile Native Complexity**: Removed Expo SDK, React Native, Xcode CocoaPods, and native iOS Live Activities/Dynamic Island widgets.
- **Client Push Alarms**: Removed browser/mobile alarm audio gimmicks in favor of a clean, structured active regimen and direct WhatsApp communication.
- **Multi-Account Switching**: Replaced the broken shared-session login with a clean **Single Caregiver Account + Multiple Family Dossiers** architecture.

---

## 3. Core Feature Pillars

### Pillar 1: The Secure Family Medical Vault (The Locker)
- **Centralized Health Storage**: Permanent, encrypted cloud storage for all family medical files (Prescriptions, Blood Tests, Scans, Discharge Summaries).
- **Multi-Profile Dossiers**: Single caregiver account with dedicated dossiers for `Self`, `Dad`, `Mom`, and `Children`.
- **Categorization & Quick Retrieval**: Files are tagged by family member, document type, doctor/clinic, and date for instant access during doctor visits or emergencies.

### Pillar 2: Clinical Extraction Powered by Google APIs
- **Handwritten Rx Decoding**: Multimodal Google APIs extract drug names, strengths, dosages, meal instructions, and treatment duration from uploaded photos or PDFs.
- **Two-Step Caregiver Review**: The AI extracts data and presents an editable preview card (allowing the user to verify or tweak medicines) before saving it to the active regimen and vault.
- **Pre-loaded Demo Samples**: Instant "Try Sample Prescription" and "Try Sample Lab Report" buttons so hackathon judges can experience the full AI pipeline in 5 seconds without uploading personal documents.

### Pillar 3: The Two-Way WhatsApp Care Loop (Zero-App Adherence)
- **Schedule Dispatch**: The caregiver creates the schedule on the web dashboard and enters the parent's WhatsApp number. A clean, formatted medication routine is dispatched to their chat.
- **Timed Check-in Bot**: At scheduled dose times (e.g., 10:00 AM), an automated WhatsApp message is sent to the parent:
  > *"⏰ Medicine Check-in for Uncle: Did you take Tab Telma-40 (Before Food)?"*
- **Two-Way Confirmation**: The parent simply replies **"YES"** or **"NO"** on WhatsApp.
- **Real-Time Dashboard Sync**: 
  - The web dashboard instantly updates the medicine card with a green checkmark: `[✓ Confirmed via WhatsApp at 10:02 AM]`.
  - When the caregiver opens the dashboard, a top notification banner alerts them: *"Dad confirmed his morning medication at 10:02 AM."*
- **Hackathon Implementation**: Powered by Twilio WhatsApp Sandbox / Meta Cloud API, supplemented by an in-app interactive WhatsApp live preview simulator for instant judge testing.

### Pillar 4: Drug-Drug Conflict Shield (Safety Engine)
- Cross-checks newly uploaded prescriptions against the patient's existing active medications.
- Displays an in-line **yellow/red alert box** explaining potential adverse reactions in plain English and recommending physician consultation.

### Pillar 5: Dynamic Lab Vitals Trend Visualizer
- Automatically extracts vital indicators from blood test reports (Fasting Glucose, HbA1c, Blood Pressure, Cholesterol).
- Renders interactive historical line charts (via Recharts) with color-coded status badges (Green = Normal, Amber = Borderline, Red = High/Critical).

### Pillar 6: Family Profiles Architecture
- Starts in an initial empty state with the logged-in user (`Self`).
- Features a prominent **"+ Add Family Member"** action to create dedicated profiles for dependents.
- Profile switcher filters the document vault, active medication regimen, and health vitals dynamically.

---

## 4. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (icons), Recharts (interactive data visualization), Radix UI.
- **Design Aesthetic**: Dark clinical slate (`#0F172A`) background, emerald green (`#10B981`) highlights, and cyan/teal accents. Modern glassmorphism, responsive cards, zero text walls.
- **AI & Multimodal Vision**: Google APIs (vision extraction, clinical text normalization).
- **Backend & Database**: Supabase PostgreSQL, Encrypted Storage Buckets, and Row-Level Security (RLS) policies.
- **Messaging Layer**: Twilio WhatsApp API / In-App WhatsApp Live Simulator.
- **Deployment**: Zero-install web deployment on Vercel / Netlify for instant jury evaluation.

---

## 5. Development Guidelines & Constraints

1. **File Size Limit**: Keep all source code files under 600 lines. Split distinct UI components, helper utilities, and mock data into single-responsibility modules.
2. **Clean Code & Simplicity**: No speculative bloat or unused abstractions. Implement exactly what solves the problem cleanly.
3. **Judge-Friendly Demo Readiness**: Ensure the web app functions end-to-end with pre-seeded sample data so judges can evaluate the entire user journey without external blockers.

---

*Document finalized for Team VoxNexa — September 2026.*
