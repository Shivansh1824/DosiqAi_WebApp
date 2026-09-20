import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, CheckCircle2,
  Clock, Pill, AlertCircle, Info, ShieldAlert
} from 'lucide-react';

const MEAL_LABELS = {
  before_food: 'Before Meals',
  after_food: 'After Meals',
  with_food: 'With Meals',
  empty_stomach: 'Empty Stomach',
  any: 'Anytime',
};

const TIMING_COLORS = {
  '1-0-0': { label: 'Morning Only', slots: ['Morning'] },
  '0-0-1': { label: 'Night Only', slots: ['Night'] },
  '1-0-1': { label: 'Morning & Night', slots: ['Morning', 'Night'] },
  '0-1-0': { label: 'Afternoon Only', slots: ['Afternoon'] },
  '1-1-1': { label: 'Three Times Daily', slots: ['Morning', 'Afternoon', 'Night'] },
  '2-0-2': { label: 'Morning & Night (2x)', slots: ['Morning (2)', 'Night (2)'] },
  '1-1-0': { label: 'Morning & Afternoon', slots: ['Morning', 'Afternoon'] },
};

const ConfidenceBadge = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 90
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : pct >= 75
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% confidence
    </span>
  );
};

export const MedicineCard = ({ med, index }) => {
  const [expanded, setExpanded] = useState(false);
  const timingCode = med.timing?.dosage || '1-0-0';
  const timingInfo = TIMING_COLORS[timingCode] || { label: timingCode, slots: [] };

  const mealText = MEAL_LABELS[med.timing?.relation_to_meal] || med.timing?.relation_to_meal || 'As directed';

  return (
    <div className="gsap-med-card bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Primary Card View */}
      <div
        className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Number Badge */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0 text-white font-black text-sm shadow-sm shadow-emerald-700/20">
          {index + 1}
        </div>

        {/* Medicine Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  {med.exact_written_name}
                </h4>
                {med.form && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {med.form}
                  </span>
                )}
              </div>

              {med.assumed_enriched_data?.scientific_name && (
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {med.assumed_enriched_data.scientific_name}
                </p>
              )}
            </div>

            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick Schedule Pills */}
          <div className="flex items-center gap-2.5 mt-3 flex-wrap">
            {/* Timing Code Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-black text-emerald-900 font-mono tracking-wider">{timingCode}</span>
              <span className="text-[11px] text-emerald-700 font-medium">({timingInfo.label})</span>
            </div>

            {/* Meal relation */}
            <div className="text-xs font-semibold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              {mealText}
            </div>

            {/* Duration */}
            {med.duration_days && (
              <div className="text-xs font-bold text-teal-800 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200">
                {med.duration_days} Days Course
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Clinical Breakdown */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col gap-3.5 text-xs">
          {/* Explicit Instruction */}
          {med.dosage_instruction && (
            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dosage Instruction</p>
              <p className="font-semibold text-slate-800">{med.dosage_instruction}</p>
            </div>
          )}

          {/* Enriched Pharmacology Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Medicine Type</p>
              <p className="font-bold text-slate-800">{med.assumed_enriched_data?.medicine_type || 'Prescription Drug'}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Clinical Purpose</p>
              <p className="font-bold text-slate-800">{med.assumed_enriched_data?.medicine_purpose || 'Therapeutic'}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Frequency</p>
              <p className="font-bold text-slate-800">
                {med.interval_days === 1 ? 'Every Day (Daily)' : med.interval_days === 2 ? 'Alternate Days' : `Every ${med.interval_days || 1} Days`}
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Daily Frequency</p>
              <p className="font-bold text-slate-800">{med.timing?.total_times_per_day || 1}x daily</p>
            </div>
          </div>

          {/* Confidence & Verification Status */}
          <div className="flex items-center justify-between pt-1">
            {med.assumed_enriched_data && (
              <ConfidenceBadge value={med.assumed_enriched_data.confidence} />
            )}

            {med.assumed_enriched_data?.is_identified && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified in Indian Drug Index</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
