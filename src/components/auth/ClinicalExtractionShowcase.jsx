import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Send, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Pill,
  Sparkles,
  Lock
} from 'lucide-react';

export const ClinicalExtractionShowcase = () => {
  return (
    <div className="relative flex flex-col justify-center px-6 py-8 lg:px-10 xl:px-14 max-w-2xl mx-auto lg:max-w-none">
      
      {/* Refined Ambient Glow for Light Theme */}
      <div className="bg-ambient-blob w-72 h-72 bg-emerald-400/20 top-4 left-0"></div>
      <div className="bg-ambient-blob w-80 h-80 bg-cyan-400/15 bottom-6 right-8"></div>

      {/* Institutional Category Badge */}
      <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/90 border border-emerald-200 shadow-sm text-emerald-800 text-xs font-semibold tracking-wide">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Clinical Intelligence · Family Health Vault</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold font-display tracking-tight text-slate-900 mt-5 leading-[1.18]">
        Decipher medical handwriting. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
          Protect family health with AI.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed max-w-xl font-normal">
        A permanent, HIPAA-aligned cloud vault for family prescriptions, scans, and blood reports. Multimodal AI automatically normalizes clinical shorthand into verified schedules and shields against adverse drug conflicts.
      </p>

      {/* Live Glassmorphic Clinical Extraction Widget */}
      <div className="relative mt-8 rounded-2xl glass-card p-5 border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Top subtle emerald border accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        {/* Widget Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
              Live Clinical Extraction Engine
            </span>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
            Multimodal Clinical AI
          </span>
        </div>

        {/* Simulated Prescription Document Card */}
        <div className="mt-4 relative bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 overflow-hidden">
          {/* Animated Scanning Laser Beam */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_10px_#10B981] animate-scan-laser pointer-events-none"></div>

          {/* Rx Document Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2.5 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-medium">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dr. R. Mehta, MD (Cardiology)</span>
            </div>
            <span className="text-[11px] font-medium bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
              Dossier: Dad (Age 64)
            </span>
          </div>

          {/* Illegible Shorthand Note */}
          <div className="py-2.5 font-mono text-xs text-slate-600 italic tracking-wide">
            "Rx: <span className="text-slate-900 font-semibold underline decoration-emerald-500 decoration-2">Tab Telma-40</span> 1-0-1 PC x 30d &nbsp;//&nbsp; <span className="text-slate-900 font-semibold underline decoration-teal-500 decoration-2">Cap Pan-D</span> 1-0-0 AC x 15d"
          </div>

          {/* Decoded Structured Entity Card */}
          <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Tab Telma-40</span>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                    Telmisartan 40mg
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  Dosage: <strong className="text-emerald-800 font-semibold">Twice Daily (Morning 8 AM & Night 8 PM)</strong> · After Meals
                </p>
              </div>
            </div>

            {/* Safety Verification Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs text-emerald-800 font-semibold whitespace-nowrap shadow-sm self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>0 Adverse Conflicts</span>
            </div>
          </div>
        </div>

        {/* Two-Way Care Loop Status Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-700 text-[11px] font-medium">
              Care Loop: <strong className="text-teal-700 font-semibold">Automated Check-in Bot</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Tap Dose Confirmation Ready</span>
          </div>
        </div>
      </div>

      {/* 3 Pillar Trust Metric Badges */}
      <div className="grid grid-cols-3 gap-3.5 mt-6">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1 items-start">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-1">Clinical AI</span>
          <span className="text-[11px] text-slate-500 leading-tight">Handwritten Rx OCR</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1 items-start">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-1">Drug Shield</span>
          <span className="text-[11px] text-slate-500 leading-tight">Interaction screening</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-1 items-start">
          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-1">Lab Vitals</span>
          <span className="text-[11px] text-slate-500 leading-tight">HbA1c & lipid trends</span>
        </div>
      </div>

    </div>
  );
};
