# Dosiq AI — Secure Family Medical Document Vault & Clinical Intelligence Co-Pilot

> **Team:** VoxNexa  
> **Category:** Healthcare & MedTech | Open Innovation

---

## 🌟 Executive Overview

**Dosiq AI** is an intelligent digital health vault and clinical adherence co-pilot designed for families and caregivers. Instead of relying on manual typing or generic alarms that are routinely ignored, Dosiq AI combines:

1. **Secure Document Locker:** Encrypted cloud storage for family medical records (Prescriptions, Lab Reports, Scans, Discharge Summaries) organized by family member dossiers (`Self`, `Dad`, `Mom`, `Children`).
2. **Clinical AI Vision Pipeline:** Google multimodal APIs to decode handwritten doctor scripts, translate medical abbreviations (`1-0-1`, `BD`, `TDS`, `AC/PC`), and highlight drug-drug conflicts.
3. **Two-Way Care Loop (Zero-App Adherence):** An automated adherence check-in system that reaches dependents directly on messaging apps without requiring them to install or navigate a new mobile application.

---

## 💬 The Care Loop: Telegram & WhatsApp Architecture

In real-world elderly care, patients frequently forget doses and ignore mobile push notifications, but actively check their messaging apps.

### Multi-Channel Strategy:
- **Telegram Bot (`@DosiqCareBot`) — Live Hackathon & Jury Demonstrations:**
  - **Zero Friction:** Anyone (judges, evaluators, teammates) can test the bot in 5 seconds by scanning a QR code or tapping a link, with no sandbox codes, phone number exchanges, or 72-hour session timeouts.
  - **Interactive Inline Buttons:** Dispatches timed medication check-ins with one-tap interactive buttons (`[ ✅ Took Dose ]` / `[ ❌ Skipped ]`).
- **WhatsApp Cloud API — Production Roadmap:**
  - Designed for production rollout to elderly family members in regions where WhatsApp is universal.
- **In-App Interactive Simulator:**
  - An interactive live preview drawer embedded directly in the web dashboard for instant end-to-end evaluation.

---

## 🛡️ Key Feature Pillars

1. **The Family Health Vault:** Centralized, permanent, categorized document storage with single caregiver management and multi-profile isolation.
2. **Clinical AI Extraction:** High-accuracy extraction of medications, dosages, timing, food instructions, and doctor notes from photos or PDFs.
3. **Drug-Drug Conflict Shield:** Automated screening against active regimens to detect contraindications or duplicate therapies.
4. **Lab Vitals Visualizer:** Trend tracking for key biomarkers (Fasting Glucose, HbA1c, Blood Pressure, Lipid profile) with clinical threshold indicators.
5. **Real-Time Adherence Sync:** Instant dashboard updates with visual green checkmarks when medications are confirmed via bot check-in.

---

## 🛠️ Technology Stack & Architectural Decisions

We deliberately selected a high-velocity, reliable stack designed to prevent build friction and eliminate runtime hydration bugs:

| Layer | Selected Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | **React 18 + Vite (TypeScript)** | Chosen over Next.js to eliminate hydration mismatch errors with interactive charts/canvases, avoid `"use client"` overhead, and provide instant sub-second Hot Module Replacement (HMR). |
| **Styling & Design** | **Tailwind CSS + Radix UI** | Dark Clinical Slate (`#0F172A`) & Emerald (`#10B981`) glassmorphic theme. Radix provides unstyled, accessible modals, drawers, and tabs without bulky UI bloat. |
| **Icons & Visuals** | **Lucide React** | Clean, lightweight, clinical iconography. |
| **Data Visualization** | **Recharts** | Renders dynamic biometric trend curves (Fasting Glucose, HbA1c, Blood Pressure, Cholesterol) with color-coded safety threshold bands. |
| **Backend & Database** | **Supabase (PostgreSQL + Storage)** | Relational data model with Row-Level Security (RLS) for multi-profile isolation, real-time sync, and encrypted storage buckets for medical documents. |
| **Clinical Intelligence** | **Google Gemini 2.5 Flash** | Multimodal clinical vision model for high-accuracy handwritten Rx decoding, shorthand translation (`1-0-1`, `BD`, `PC`), and conflict detection. |
| **Care Loop (Demo)** | **Telegram Bot API (`@dosiq_care_bot`)** | Zero-friction live evaluation with interactive inline buttons (`[ ✅ Took Dose ]` / `[ ❌ Skipped ]`) and zero sandbox limits. |
| **Care Loop (Roadmap)**| **WhatsApp Cloud API** | Target channel for regional elderly patient production rollout. |
| **Testing Sandbox** | **In-App Interactive Simulator** | On-dashboard live preview drawer for instant judge evaluation without needing external devices. |

---

## 💬 The Care Loop Status

- **Bot Identity:** `@dosiq_care_bot` (*Dosiq Ai- Health Assistant*)
- **Verification Status:** **Tested & Operational.** Two-way handshake, interactive medication reminder dispatch, and real-time button callback confirmation have been validated in isolation.
- **Application Integration:** Awaiting connection to the Supabase data model, scheduled reminder engine, and caregiver web dashboard.

