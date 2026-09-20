import React, { useState } from 'react';
import {
  FlaskConical, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, AlertTriangle
} from 'lucide-react';

const BiomarkerRow = ({ metric }) => {
  const isAbnormal = !!metric.is_abnormal;
  const Icon = isAbnormal
    ? (parseFloat(metric.value) > 0 ? TrendingUp : TrendingDown)
    : Minus;

  return (
    <div
      className={`flex items-center justify-between py-3 px-3.5 rounded-xl transition-colors ${
        isAbnormal
          ? 'bg-red-50/80 border border-red-200/80'
          : 'bg-white border border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-slate-900 truncate">{metric.test_name}</p>
          {isAbnormal && (
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700">
              Abnormal
            </span>
          )}
        </div>
        {metric.method && (
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{metric.method}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className={`text-sm font-black tabular-nums ${isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
            {metric.value}
            {metric.unit && <span className="text-[11px] font-semibold text-slate-500 ml-1">{metric.unit}</span>}
          </p>
          {metric.reference_range && (
            <p className="text-[10px] text-slate-400 font-medium">Ref: {metric.reference_range}</p>
          )}
        </div>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isAbnormal ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export const BiomarkerPanel = ({ panel }) => {
  const [expanded, setExpanded] = useState(true);
  const abnormalCount = panel.metrics?.filter(m => m.is_abnormal).length || 0;

  return (
    <div className="gsap-panel-card bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-sm font-black text-slate-900">{panel.category_name}</span>
            <span className="text-xs text-slate-400 ml-2 font-medium">({panel.metrics?.length || 0} tests)</span>
          </div>

          {abnormalCount > 0 && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {abnormalCount} Abnormal
            </span>
          )}
        </div>

        <div className="text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 flex flex-col gap-2">
          {panel.metrics?.map((m, i) => (
            <BiomarkerRow key={i} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
};
