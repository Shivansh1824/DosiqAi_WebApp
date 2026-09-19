import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Send, 
  CheckCircle2, 
  Activity, 
  Lock, 
  Cpu, 
  Pill 
} from 'lucide-react';

export const ClinicalExtractionShowcase = () => {
  return (
    <div className="relative flex flex-col justify-center px-6 py-10 lg:px-12 xl:px-16 max-w-2xl mx-auto lg:max-w-none">
      {/* Ambient background glow */}
      <div className="bg-ambient-blob w-72 h-72 bg-emerald-500 top-12 left-0"></div>
      <div className="bg-ambient-blob w-80 h-80 bg-cyan-500 bottom-10 right-10"></div>

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Team VoxNexa · MedTech & Healthcare Innovation</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold font-display tracking-tight text-white mt-5 leading-[1.15]">
        Decipher medical handwriting. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          Protect family health with AI.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
        A centralized digital health vault that permanently organizes family medical records, converts illegible doctor shorthand into verified schedules, and dispatches automated check-ins via Telegram and WhatsApp.
      </p>

      {/* Live Glassmorphic Clinical Extraction Widget */}
      <div className="relative mt-8 rounded-2xl glass-panel p-5 border border-slate-700/60 shadow-2xl overflow-hidden group">
        {/* Subtle top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {/* Widget Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
              Live Clinical Extraction Engine
            </span>
          </div>
          <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
            Gemini Multimodal Vision
          </span>
        </div>

        {/* Simulated Document Scanning Window */}
        <div className="mt-4 relative bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 overflow-hidden">
          {/* Animated Scanning Laser Beam */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-scan-laser pointer-events-none"></div>

          {/* Rx Header Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Dr. R. Mehta, MD (Cardiology)</span>
            </div>
            <span className="text-slate-500 text-[11px]">Patient: Dad (Age 64)</span>
          </div>

          {/* Illegible Shorthand Representation */}
          <div className="py-2.5 font-mono text-xs text-slate-400 italic tracking-wide">
            "Rx: <span className="text-slate-200 font-semibold underline decoration-emerald-500/60">Tab Telma-40</span> 1-0-1 PC x 30d // <span className="text-slate-200 font-semibold underline decoration-cyan-500/60">Cap Pan-D</span> 1-0-0 AC x 15d"
          </div>

          {/* Decoded Structured Entity Card */}
          <div className="mt-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white">Tab Telma-40</span>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-900/50 px-1.5 py-0.5 rounded">
                    Telmisartan 40mg
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Dosage: <strong className="text-emerald-300">Twice Daily (Morning & Night)</strong> · After Meals (PC)
                </p>
              </div>
            </div>

            {/* Safety Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/90 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium whitespace-nowrap self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>0 Conflict Flag</span>
            </div>
          </div>
        </div>

        {/* Telegram Care Loop Simulation Footer */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
              <Send className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-300 text-[11px]">
              Care Loop: <strong className="text-cyan-400">Telegram Bot Active</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1-Tap Family Dose Confirmation</span>
          </div>
        </div>
      </div>

      {/* 3 Pillar Trust Metric Badges */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1 items-start">
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 mt-1">Vision AI</span>
          <span className="text-[11px] text-slate-400">Handwritten Rx OCR</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1 items-start">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 mt-1">Drug Shield</span>
          <span className="text-[11px] text-slate-400">Cross-conflict check</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1 items-start">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 mt-1">Lab Vitals</span>
          <span className="text-[11px] text-slate-400">Blood trends & HbA1c</span>
        </div>
      </div>
    </div>
  );
};
