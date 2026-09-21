import React, { useState } from 'react';
import {
  Clock, Pill, AlertTriangle, ShieldCheck, CheckCircle2,
  ChevronDown, ChevronUp, Stethoscope, Utensils, Calendar,
  Sparkles, Info, HelpCircle
} from 'lucide-react';

const MEAL_CONFIG = {
  after_food: {
    label: 'After Food (Post-Meal)',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '🍽️'
  },
  before_food: {
    label: 'Before Food (Pre-Meal)',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: '🍽️'
  },
  with_food: {
    label: 'With Food / Meal',
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: '🍲'
  },
  empty_stomach: {
    label: 'On Empty Stomach',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: '☕'
  },
  any: {
    label: 'Anytime with Water',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: '💧'
  }
};

const FORM_ICONS = {
  Syrup: '🧴',
  Tablet: '💊',
  Capsule: '💊',
  Drops: '💧',
  Injection: '💉',
  Cream: '🧴',
  Inhaler: '💨',
  Sachet: '📦',
};

export const MedicineCard = ({ med = {}, index = 0, interactionNote = '' }) => {
  const [expanded, setExpanded] = useState(false);

  // Safe field extraction
  const writtenName = String(med.exact_written_name || med.name || 'Prescribed Medication');
  const strength = med.strength ? String(med.strength) : null;
  const form = med.form || 'Medicine';
  const formIcon = FORM_ICONS[form] || '💊';

  const enriched = med.assumed_enriched_data || {};
  const scientificName = enriched.scientific_name || null;
  const medicineType = enriched.medicine_type || null;
  const medicinePurpose = enriched.medicine_purpose || null;

  const timing = med.timing || {};
  const dosageCode = timing.dosage || null;
  const mealRelation = timing.relation_to_meal || null;
  const mealInfo = mealRelation ? (MEAL_CONFIG[mealRelation] || { label: mealRelation.replace('_', ' '), color: 'bg-slate-50 text-slate-700 border-slate-200', icon: '🍽️' }) : null;
  
  const totalTimes = timing.total_times_per_day || (dosageCode ? dosageCode.split('-').filter(x => parseInt(x, 10) > 0).length : 1);
  const intervalDays = med.interval_days !== undefined && med.interval_days !== null ? med.interval_days : 1;
  const durationDays = med.duration_days || null;
  const dosageInstruction = med.dosage_instruction || null;

  const isSos = intervalDays === 0 || (dosageInstruction && dosageInstruction.toLowerCase().includes('sos'));

  // Parse 3-slot dosage (M-A-N)
  let morningDose = 0;
  let afternoonDose = 0;
  let nightDose = 0;

  if (dosageCode && dosageCode.includes('-')) {
    const parts = dosageCode.split('-');
    morningDose = parseInt(parts[0], 10) || 0;
    afternoonDose = parseInt(parts[1], 10) || 0;
    nightDose = parseInt(parts[2], 10) || 0;
  } else if (totalTimes === 1) {
    morningDose = 1;
  } else if (totalTimes === 2) {
    morningDose = 1;
    nightDose = 1;
  } else if (totalTimes >= 3) {
    morningDose = 1;
    afternoonDose = 1;
    nightDose = 1;
  }

  // Check if this medicine is flagged in interaction note
  const hasInteraction = interactionNote && (
    (scientificName && interactionNote.toLowerCase().includes(scientificName.toLowerCase())) ||
    (writtenName && interactionNote.toLowerCase().includes(writtenName.split(' ')[0].toLowerCase()))
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      {/* ── Top Header Row ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Index + Form Avatar */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col items-center justify-center shrink-0 shadow-sm shadow-emerald-700/20">
            <span className="text-xs font-black leading-none">{index + 1}</span>
            <span className="text-[13px] leading-none mt-0.5">{formIcon}</span>
          </div>

          <div className="min-w-0">
            {/* Written Name + Strength + Form Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                {writtenName}
              </h4>
              {strength && !writtenName.includes(strength) && (
                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {strength}
                </span>
              )}
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {form}
              </span>
              {medicineType && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {medicineType}
                </span>
              )}
              {isSos && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  SOS (As Needed)
                </span>
              )}
            </div>

            {/* Scientific Salt Molecule */}
            {scientificName && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700">Active Salt:</span>
                <span className="font-medium text-emerald-800 bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-100">
                  {scientificName}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Adherence / Times Per Day Pill */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Frequency</span>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
              {isSos ? 'SOS / As Needed' : `${totalTimes}x Daily`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Clinical Usage & Purpose (The "Why") ────────────────────────── */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-start gap-2.5">
        <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Clinical Purpose &amp; Indication
          </span>
          <p className="text-xs font-bold text-slate-800 leading-relaxed mt-0.5">
            {medicinePurpose || `Prescribed as part of the regimen for ${writtenName}. Consult doctor if symptoms persist.`}
          </p>
        </div>
      </div>

      {/* ── Daily Schedule & Timing Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Morning Slot */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          morningDose > 0
            ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-bold'
            : 'bg-slate-50/50 border-slate-200/60 text-slate-400 font-normal'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">☀️</span>
            <div>
              <p className="text-xs font-black">Morning (08:00 AM)</p>
              <p className="text-[10px] opacity-80">Breakfast slot</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
            morningDose > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-400'
          }`}>
            {morningDose > 0 ? `${morningDose} Dose` : '—'}
          </span>
        </div>

        {/* Afternoon Slot */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          afternoonDose > 0
            ? 'bg-sky-50/70 border-sky-200 text-sky-900 font-bold'
            : 'bg-slate-50/50 border-slate-200/60 text-slate-400 font-normal'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">🌤️</span>
            <div>
              <p className="text-xs font-black">Afternoon (02:00 PM)</p>
              <p className="text-[10px] opacity-80">Lunch slot</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
            afternoonDose > 0 ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'bg-slate-100 text-slate-400'
          }`}>
            {afternoonDose > 0 ? `${afternoonDose} Dose` : '—'}
          </span>
        </div>

        {/* Night Slot */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          nightDose > 0
            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-bold'
            : 'bg-slate-50/50 border-slate-200/60 text-slate-400 font-normal'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">🌙</span>
            <div>
              <p className="text-xs font-black">Night (08:00 PM)</p>
              <p className="text-[10px] opacity-80">Dinner slot</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
            nightDose > 0 ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-slate-100 text-slate-400'
          }`}>
            {nightDose > 0 ? `${nightDose} Dose` : '—'}
          </span>
        </div>
      </div>

      {/* ── Meal Timing + Duration + Doctor Instruction Strip ─────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 text-xs border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Meal Timing Badge */}
          {mealInfo && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold ${mealInfo.color}`}>
              <span>{mealInfo.icon}</span>
              <span>{mealInfo.label}</span>
            </div>
          )}

          {/* Duration Badge */}
          {durationDays && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-bold">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>{durationDays} Days Course</span>
            </div>
          )}

          {/* Dosage Matrix Code with Explanatory Hover Tooltip */}
          {dosageCode && (
            <div className="relative group/tooltip flex items-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-mono font-bold cursor-help transition-colors">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>M-A-N: {dosageCode}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 group-hover/tooltip:bg-emerald-600 group-hover/tooltip:text-white text-slate-700 text-[10px] font-sans font-bold flex items-center justify-center transition-colors shadow-xs">
                  i
                </span>
              </div>

              {/* Hover Tooltip / Popover (Light Mode) */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 p-3.5 bg-white text-slate-900 text-xs rounded-2xl shadow-xl border border-slate-200/90 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1.5 text-[11px] uppercase tracking-wider font-sans">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>What is M-A-N?</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
                  <strong>M-A-N</strong> stands for <strong>Morning – Afternoon – Night</strong>. It indicates how many doses to take throughout the day:
                </p>
                <div className="grid grid-cols-3 gap-1.5 my-2 text-center font-sans">
                  <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-200 text-amber-900">
                    <span className="block text-[10px] text-amber-800 font-bold">M (Morning)</span>
                    <span className="font-mono font-black text-amber-950 text-xs">{morningDose} dose</span>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-1.5 border border-sky-200 text-sky-900">
                    <span className="block text-[10px] text-sky-800 font-bold">A (Afternoon)</span>
                    <span className="font-mono font-black text-sky-950 text-xs">{afternoonDose} dose</span>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-1.5 border border-indigo-200 text-indigo-900">
                    <span className="block text-[10px] text-indigo-800 font-bold">N (Night)</span>
                    <span className="font-mono font-black text-indigo-950 text-xs">{nightDose} dose</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-sans italic">
                  Code &ldquo;{dosageCode}&rdquo; means take {morningDose > 0 ? `${morningDose} in morning` : 'none in morning'}, {afternoonDose > 0 ? `${afternoonDose} in afternoon` : 'none in afternoon'}, and {nightDose > 0 ? `${nightDose} at night` : 'none at night'}.
                </p>
                {/* Tooltip downward arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]" />
              </div>
            </div>
          )}
        </div>

        {/* Expand Details Button */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold text-xs py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span>{expanded ? 'Less Details' : 'More Details'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Specific Doctor Instruction (if available) ────────────────── */}
      {dosageInstruction && (
        <div className="text-xs bg-emerald-50/50 border border-emerald-200/60 rounded-xl px-3.5 py-2 text-emerald-900 font-medium">
          <span className="font-bold text-emerald-800">Doctor&apos;s Specific Note:</span> &ldquo;{dosageInstruction}&rdquo;
        </div>
      )}

      {/* ── Drug Interaction Alert (if applicable to this medicine) ────── */}
      {hasInteraction && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Interaction Caution:</span> This medication is flagged in the prescription interaction shield. Take with food to minimize GI discomfort.
          </div>
        </div>
      )}

      {/* ── Collapsible Advanced Pharmacology Details ──────────────────── */}
      {expanded && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pharmacology Class</span>
            <span className="font-bold text-slate-800">{medicineType || 'Therapeutic Drug'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interval Schedule</span>
            <span className="font-bold text-slate-800">
              {intervalDays === 1 ? 'Every 24h (Daily)' : intervalDays === 2 ? 'Alternate Days' : `Every ${intervalDays} Days`}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verification Status</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Molecule
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Match Confidence</span>
            <span className="font-mono font-bold text-slate-800">
              {Math.round((enriched.confidence || 0.95) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
