import React, { useState } from 'react';
import { FlaskConical, ChevronRight } from 'lucide-react';
import { BiomarkerRangeGauge } from './BiomarkerRangeGauge';
import { parseBiomarkerRange } from '../../../lib/referenceRanges';

// ─── Severity configuration ──────────────────────────────────────────────────

const SEVERITY = {
  normal:     { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Normal'     },
  borderline: { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',    label: 'Borderline'  },
  high:       { bg: 'bg-rose-50',     border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',     label: 'High'        },
  low:        { bg: 'bg-sky-50',      border: 'border-sky-200',     text: 'text-sky-700',     dot: 'bg-sky-500',      label: 'Low'         },
  critical:   { bg: 'bg-red-100',     border: 'border-red-400',     text: 'text-red-800',     dot: 'bg-red-600',      label: 'Critical'    },
};

const getSeverityConfig = (metric) => {
  if (metric.severity && SEVERITY[metric.severity]) return SEVERITY[metric.severity];
  const model = parseBiomarkerRange(metric);
  if (model.zone === 'borderline') return SEVERITY.borderline;
  return metric.is_abnormal ? SEVERITY.high : SEVERITY.normal;
};

// ─── Single Metric Row ───────────────────────────────────────────────────────

export const MetricRow = ({ metric }) => {
  const model = parseBiomarkerRange(metric);
  const sev = getSeverityConfig(metric);
  const numVal = metric.numeric_value ?? parseFloat(metric.value);
  const displayVal = isNaN(numVal) ? metric.value : numVal;

  return (
    <div className={`gsap-metric-row flex flex-col gap-2 p-3.5 rounded-xl border ${sev.bg} ${sev.border} transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">{metric.test_name}</p>
            {metric.method && (
              <p className="text-[10px] text-slate-400 font-medium">{metric.method}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Value */}
          <div className="text-right">
            <p className={`text-sm font-black tabular-nums ${sev.text}`}>
              {displayVal} <span className="text-[10px] font-bold text-slate-400">{metric.unit}</span>
            </p>
          </div>

          {/* Reference Range */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 font-medium">Reference</p>
            <p className="text-[11px] text-slate-600 font-bold whitespace-nowrap">{metric.reference_range || '—'}</p>
          </div>

          {/* Severity Badge */}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${sev.bg} ${sev.border} ${sev.text} shrink-0`}>
            {sev.label}
          </span>
        </div>
      </div>

      {/* Graphical Range Spectrum Bar */}
      {model.hasValidRange && (
        <div className="pt-1.5 border-t border-slate-200/50">
          <BiomarkerRangeGauge metric={metric} mode="compact" animate={false} />
        </div>
      )}
    </div>
  );
};

// ─── Panel Accordion Card ────────────────────────────────────────────────────

export const BiomarkerPanelCard = ({ panel }) => {
  const [expanded, setExpanded] = useState(true);
  const abnormalCount = panel.metrics.filter(m => m.is_abnormal).length;

  return (
    <div className="gsap-panel-card bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">{panel.category_name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{panel.metrics.length} parameters tested</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
              {abnormalCount} Abnormal
            </span>
          )}
          {abnormalCount === 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              All Normal
            </span>
          )}
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 flex flex-col gap-2">
          {panel.metrics.map((metric, idx) => (
            <MetricRow key={idx} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
};
