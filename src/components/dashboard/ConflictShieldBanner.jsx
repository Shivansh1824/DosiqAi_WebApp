import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

// ─── Severity styling ─────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  severe: {
    banner:      'border-red-200 bg-red-50',
    icon:        'text-red-600',
    badge:       'bg-red-100 text-red-700 border-red-200',
    label:       '🔴 Severe — Contraindicated',
    Icon:        AlertCircle,
  },
  moderate: {
    banner:      'border-amber-200 bg-amber-50',
    icon:        'text-amber-600',
    badge:       'bg-amber-100 text-amber-700 border-amber-200',
    label:       '🟡 Moderate — Use with Caution',
    Icon:        AlertTriangle,
  },
};

// ─── Single Conflict Card ─────────────────────────────────────────────────────

const ConflictCard = ({ conflict, onDismiss }) => {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const style = SEVERITY_STYLES[conflict.severity] || SEVERITY_STYLES.moderate;
  const { Icon } = style;

  if (dismissed) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex flex-col gap-2.5 transition-all duration-300 ${style.banner}`}
      style={{ animation: 'conflictSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 shrink-0 ${style.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {style.label}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              {conflict.drug1} <span className="text-slate-400 font-normal">+</span> {conflict.drug2}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="p-1 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => { setDismissed(true); onDismiss?.(conflict.id); }}
            className="p-1 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Dismiss conflict alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-1.5 text-xs text-slate-600 pl-6.5">
          <p className="leading-relaxed">{conflict.description}</p>
          <div className="flex items-start gap-1.5 mt-1 bg-white/60 rounded-xl px-3 py-2 border border-white/80">
            <ShieldCheck className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${style.icon}`} />
            <p className="font-semibold text-slate-700">{conflict.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Conflict Shield Banner ───────────────────────────────────────────────────

export const ConflictShieldBanner = ({ conflicts = [] }) => {
  if (!conflicts.length) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs font-semibold text-emerald-700">
          Drug Conflict Shield — <span className="font-bold">0 conflicts detected</span> in active regimen
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes conflictSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div id="conflict-shield" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Drug Conflict Shield — {conflicts.length} Alert{conflicts.length > 1 ? 's' : ''} Detected
          </h3>
        </div>
        {conflicts.map(c => (
          <ConflictCard key={c.id} conflict={c} />
        ))}
      </div>
    </>
  );
};
