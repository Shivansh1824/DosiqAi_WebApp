import React from 'react';
import { ClinicalExtractionShowcase } from './ClinicalExtractionShowcase';
import { AuthCard } from './AuthCard';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export const LoginView = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Ambient background glow points */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Application Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold font-display shadow-md shadow-emerald-500/20">
              <HeartPulse className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">
              Dosiq<span className="text-emerald-400">AI</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium border-l border-slate-700 pl-2.5 ml-1">
              Clinical Co-Pilot & Health Locker
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px] font-medium">Telegram Care Loop Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Panel: Clinical AI Showcase (7 columns on desktop) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <ClinicalExtractionShowcase />
          </div>

          {/* Right Panel: Role-Pilot Inspired Auth Card (5 columns on desktop) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <AuthCard />
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
        <span>Team VoxNexa · Dosiq AI Hackathon Prototype · Built with React 18, Vite & Supabase</span>
      </footer>

    </div>
  );
};
