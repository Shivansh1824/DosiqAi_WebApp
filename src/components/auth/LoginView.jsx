import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Pill,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  Clock,
  Lock
} from 'lucide-react';
import { AuthCard } from './AuthCard';
import { DosiqLogo } from '../common/DosiqLogo';

/* ── Interactive Showcase Widget ── */
const PROFILES = {
  dad: {
    label: 'Dad',
    age: 64,
    doctor: 'Dr. R. Mehta, MD (Cardiology)',
    rx: 'Rx #9842 · Verified',
    meds: [
      {
        name: 'Tab Telma-40',
        tag: 'Blood Pressure',
        tagColor: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
        schedule: 'Twice daily (8 AM & 8 PM) · After meals',
        pill: 'bg-emerald-500',
        status: 'Dose confirmed',
      },
      {
        name: 'Cap Pan-D',
        tag: 'Gastric',
        tagColor: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
        schedule: 'Once daily (7:30 AM) · Before breakfast',
        pill: 'bg-teal-500',
        status: 'Next: Tomorrow',
      },
    ],
  },
  mom: {
    label: 'Mom',
    age: 61,
    doctor: 'Dr. S. Patel, MD (Endocrinology)',
    rx: 'Rx #1173 · Verified',
    meds: [
      {
        name: 'Tab Metformin 500',
        tag: 'Diabetes',
        tagColor: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
        schedule: 'Twice daily (7 AM & 9 PM) · With meals',
        pill: 'bg-sky-500',
        status: 'Dose confirmed',
      },
      {
        name: 'Tab Eltroxin 50',
        tag: 'Thyroid',
        tagColor: 'bg-violet-400/20 text-violet-200 border-violet-400/30',
        schedule: 'Once daily (6 AM) · Empty stomach',
        pill: 'bg-violet-500',
        status: 'Next: Tomorrow',
      },
    ],
  },
  you: {
    label: 'You',
    age: null,
    doctor: 'Dr. A. Sharma, MBBS (General)',
    rx: 'Rx #5501 · Verified',
    meds: [
      {
        name: 'Tab Azithromycin 500',
        tag: 'Antibiotic',
        tagColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
        schedule: 'Once daily (8 AM) · After meals · 5 days',
        pill: 'bg-amber-500',
        status: 'Dose confirmed',
      },
      {
        name: 'Tab Cetrizine 10',
        tag: 'Allergy',
        tagColor: 'bg-rose-400/20 text-rose-200 border-rose-400/30',
        schedule: 'Once daily (10 PM) · Before sleep',
        pill: 'bg-rose-500',
        status: 'Next: Tonight',
      },
    ],
  },
};

const MedShowcase = () => {
  const [active, setActive] = useState('dad');
  const p = PROFILES[active];

  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/30 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Family Vault</span>
        </div>
        {/* Profile tabs */}
        <div className="flex items-center gap-1">
          {Object.entries(PROFILES).map(([key, prof]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                active === key
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                  : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
              }`}
            >
              {prof.label}{prof.age ? ` (${prof.age})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Source line */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-mono">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span>{p.doctor}</span>
          </div>
          <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-medium">
            {p.rx}
          </span>
        </div>

        {/* Medication rows */}
        <div className="space-y-2">
          {p.meds.map((med) => (
            <div
              key={med.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.12] transition-colors duration-150"
            >
              <div className={`w-7 h-7 rounded-lg ${med.pill} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <Pill className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[12px] text-white">{med.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${med.tagColor} font-semibold`}>
                    {med.tag}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5 truncate">{med.schedule}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{med.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer metrics */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.08] text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>0 Drug Conflicts</span>
          </div>
          <div className="flex items-center gap-3 text-white/40 font-medium">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Decoded in 1.1s</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ── */

export const LoginView = () => {
  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex lg:w-[55%] xl:w-[57%] relative flex-col overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 20% -10%, #0d9488 0%, #065f46 35%, #064e3b 70%, #022c22 100%)',
        }}
      >
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Atmospheric glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-teal-300/8 rounded-full blur-[150px] pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 px-10 pt-8 flex items-center justify-between shrink-0">
          <DosiqLogo size="default" showBadge={false} variant="light" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            AI · Operational
          </div>
        </div>

        {/* Main content: headline + showcase — fills remaining height evenly */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 py-8 gap-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Family Health Intelligence
          </div>

          {/* Option 1 Headline */}
          <div>
            <h1
              className="font-extrabold tracking-tight text-white leading-[1.15] max-w-lg"
              style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.6rem)', textWrap: 'balance' }}
            >
              Every prescription, decoded.
            </h1>
            <h2
              className="font-extrabold tracking-tight leading-[1.18] mt-1 max-w-lg"
              style={{
                fontSize: 'clamp(1.75rem, 2.5vw, 2.6rem)',
                textWrap: 'balance',
                backgroundImage: 'linear-gradient(90deg, #6ee7b7 0%, #67e8f9 60%, #a5f3fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Care for your family with total confidence.
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mt-4 max-w-lg" style={{ textWrap: 'pretty' }}>
              Snap a photo of any handwritten prescription or lab report. dosiq AI translates doctor
              shorthand into plain daily schedules, screens for drug conflicts, and organizes your
              family's records in one private vault.
            </p>
          </div>

          {/* Interactive showcase */}
          <MedShowcase />

          {/* Three mini trust pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {[
              { icon: <Activity className="w-3 h-3" />, label: 'Handwritten Rx OCR' },
              { icon: <ShieldCheck className="w-3 h-3" />, label: 'Drug Conflict Screening' },
              { icon: <Lock className="w-3 h-3" />, label: 'Private encrypted vault' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[11px] font-medium"
              >
                <span className="text-emerald-300">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-10 pb-7 flex items-center justify-between text-[11px] text-white/35 font-medium shrink-0 border-t border-white/[0.07] pt-4">
          <span>© 2026 dosiq AI · All rights reserved</span>
          <div className="flex items-center gap-3">
            <span>Private by Design</span>
            <span>·</span>
            <span>Multimodal Health OCR</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-slate-50/80 relative">
        {/* Dot grid for right panel — adds texture, removes clinical whiteness */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Mobile header */}
        <header className="lg:hidden relative z-10 w-full border-b border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <DosiqLogo size="default" showBadge={false} />
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 border border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-full shadow-sm transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back
          </button>
        </header>

        {/* Desktop back button */}
        <div className="hidden lg:flex relative z-10 justify-end px-8 pt-6 shrink-0">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/80 border border-slate-300 hover:border-emerald-300 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all duration-150 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:-translate-x-0.5 transition-all duration-150" />
            Back to main page
          </button>
        </div>

        {/* Auth card */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-md">
            <AuthCard />
          </div>
        </main>

        <footer className="relative z-10 py-4 text-center text-[11px] text-slate-400 shrink-0">
          Protected by 256-bit SSL encryption
        </footer>
      </div>

    </div>
  );
};
