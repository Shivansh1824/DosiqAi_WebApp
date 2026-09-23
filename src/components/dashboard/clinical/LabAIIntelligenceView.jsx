import React from 'react';
import { Eye, FlaskConical, Brain, Code2 } from 'lucide-react';

/**
 * LabAIIntelligenceView
 * 
 * Clinical AI reasoning trace, extraction confidence metrics,
 * and JSON developer audit trigger.
 */
export const LabAIIntelligenceView = ({
  confidencePct,
  meta,
  reportData,
  common,
  reasoning,
  extraction,
  panels = [],
  totalTests = 0,
  totalAbnormal = 0,
  onInspectJson,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Confidence & Lab identification cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="gsap-ai-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Analysis Confidence</span>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                confidencePct >= 90
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-lg font-black text-emerald-700">{confidencePct}%</span>
        </div>

        <div className="gsap-ai-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <Eye className="w-5 h-5 text-sky-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scan Clarity</p>
            <p className="text-sm font-black text-slate-900 capitalize">{meta?.scan_clarity || 'Clear'}</p>
          </div>
        </div>

        <div className="gsap-ai-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 transition-all hover:shadow-md">
          <FlaskConical className="w-5 h-5 text-violet-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lab Identified</p>
            <p className="text-sm font-black text-slate-900">{reportData?.lab_name || 'Lab'}</p>
          </div>
        </div>
      </div>

      {/* Clinical reasoning trace */}
      <div className="gsap-ai-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Dosiq AI Clinical Reasoning Trace
          </h3>
        </div>
        {common?.summary && (
          <p className="text-sm font-bold text-slate-800 leading-relaxed">{common.summary}</p>
        )}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-mono">
          {reasoning || `Extraction Engine: Dosiq AI Lab Pathology Intelligence
Document Type: ${extraction?.document_type || 'medical_report'}
Image Clarity: ${meta?.scan_clarity || 'Clear'}
Confidence: ${confidencePct}%
Panels Extracted: ${panels.length}
Total Tests: ${totalTests}
Abnormalities Found: ${totalAbnormal}`}
        </div>
      </div>

      {/* Developer audit CTA */}
      <div className="gsap-ai-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h4 className="text-sm font-black text-slate-900">Developer & Clinical JSON Audit</h4>
          <p className="text-xs text-slate-500 mt-0.5">View the full structured payload extracted by the AI pipeline.</p>
        </div>
        <button
          type="button"
          onClick={onInspectJson}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          Inspect JSON Payload
        </button>
      </div>
    </div>
  );
};
