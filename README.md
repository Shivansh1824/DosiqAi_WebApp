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

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, Radix UI
- **Design System:** Dark clinical slate (`#0F172A`), emerald accents (`#10B981`), teal highlights, glassmorphism
- **Backend & Database:** Supabase PostgreSQL with Row-Level Security (RLS) and encrypted Storage
- **AI / Multimodal:** Google APIs (Vision & clinical text normalization)
- **Messaging Integration:** Telegram Bot API (Live Demo / Evaluation) & WhatsApp Cloud API (Production Roadmap)

---

## 🧪 Testing the Telegram Care Loop

To test the interactive bot before launching the web app:

1. Create a bot on Telegram via `@BotFather` and retrieve your `TELEGRAM_BOT_TOKEN`.
2. Get your personal numerical Telegram ID from `@userinfobot`.
3. Configure your `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```
4. Run the standalone test script:
   ```bash
   node test-telegram-bot.js
   ```
5. Check your Telegram app: tap the interactive `[ ✅ Took Dose ]` button to verify two-way adherence confirmation!
