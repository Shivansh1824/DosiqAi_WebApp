import React, { useState } from 'react';
import {
  Globe, Activity, FileText, ShieldCheck, Send, Users,
  UploadCloud, ChevronRight, CheckCircle2, BellRing,
  TrendingUp, Pill, Clock, Plus, ExternalLink,
} from 'lucide-react';
import { UploadDocumentModal } from './UploadDocumentModal';

// ─── Static seed data ─────────────────────────────────────────────────────────

const FAMILY_TELEGRAM = [
  { name: 'Shivansh', initials: 'SR', linked: true,  gradient: 'from-emerald-400 to-teal-500' },
  { name: 'Rajesh',   initials: 'RR', linked: true,  gradient: 'from-sky-400 to-cyan-500' },
  { name: 'Sunita',   initials: 'SR', linked: false, gradient: 'from-violet-400 to-fuchsia-500' },
];

const ACTIVITY_FEED = [
  { id: 1, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', message: 'Dad confirmed Telma-40 (Morning)', sub: 'via Telegram Care Loop', time: '08:02 AM' },
  { id: 2, icon: UploadCloud,  color: 'text-sky-500',     bg: 'bg-sky-50 border-sky-100',         message: 'Blood Report uploaded for Mom', sub: 'SRL Diagnostics · HbA1c Panel', time: '5h ago' },
  { id: 3, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', message: 'Dad confirmed Pan-D (Morning)', sub: 'via Telegram Care Loop', time: '07:34 AM' },
  { id: 4, icon: BellRing,     color: 'text-amber-500',   bg: 'bg-amber-50 border-amber-100',     message: 'Mom\'s Metformin was skipped', sub: 'Morning dose · 07:00 AM', time: 'Yesterday' },
];

const UPCOMING_DOSES = [
  { id: 1, person: 'Dad',  initials: 'RR', gradient: 'from-sky-400 to-cyan-500',     med: 'Telma-40 (Telmisartan)',  time: '8:00 PM', food: 'After Dinner' },
  { id: 2, person: 'Mom',  initials: 'SR', gradient: 'from-violet-400 to-fuchsia-500', med: 'Metformin 500mg',        time: '9:00 PM', food: 'With Food' },
  { id: 3, person: 'Self', initials: 'SR', gradient: 'from-emerald-400 to-teal-500',  med: 'Cetirizine 10mg',        time: '10:00 PM', food: 'Before Sleep' },
];

const DOC_TYPES = [
  { label: 'Prescriptions', count: 3, color: 'bg-emerald-500', width: '55%' },
  { label: 'Blood Tests',   count: 2, color: 'bg-sky-500',     width: '30%' },
  { label: 'Other',         count: 1, color: 'bg-slate-300',   width: '15%' },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3 hover:shadow-md hover:border-slate-200 transition-all duration-200 group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass} group-hover:scale-110 transition-transform duration-200`}>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{sub}</p>}
    </div>
  </div>
);

// ─── World Section ────────────────────────────────────────────────────────────

export const WorldSection = ({ onNavigate }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)' }}
      >
        {/* Background glow blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6ee7b7, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative z-10">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">{dateStr}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight" style={{ textWrap: 'balance' }}>
            {greeting}, Shivansh 👋
          </h1>
          <p className="text-emerald-200/80 text-sm font-medium mt-2 max-w-sm leading-relaxed">
            Your family's health is on track. 2 doses confirmed, 1 report waiting for review.
          </p>
          {/* Adherence pill */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white">78% Family Adherence Today</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 flex flex-col gap-2 shrink-0 sm:items-end">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all duration-150"
          >
            <UploadCloud className="w-4 h-4" /> Upload Prescription
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.97] text-white text-sm font-bold border border-white/20 transition-all duration-150"
          >
            <FileText className="w-4 h-4" /> Upload Lab Report
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Active Regimens"  value={7}   icon={Pill}         colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <KpiCard label="Docs in Vault"    value={6}   icon={FileText}     colorClass="text-sky-600"     bgClass="bg-sky-50"     sub="Last: 5h ago" />
        <KpiCard label="Adherence"        value="78%" icon={TrendingUp}   colorClass="text-teal-600"    bgClass="bg-teal-50"    sub="Family average" />
        <KpiCard label="Care Loop Active" value={2}   icon={Send}         colorClass="text-violet-600"  bgClass="bg-violet-50"  sub="of 3 members" />
        <KpiCard label="Drug Alerts"      value={1}   icon={ShieldCheck}  colorClass="text-amber-600"   bgClass="bg-amber-50"   sub="1 moderate" />
      </div>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-black text-slate-800">Live Activity Feed</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {ACTIVITY_FEED.map(act => (
              <div key={act.id} className="flex items-start gap-3.5 px-6 py-4 hover:bg-slate-50/60 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${act.bg}`}>
                  <act.icon className={`w-4 h-4 ${act.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{act.message}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{act.sub}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 mt-0.5">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Telegram Status + Doc Vault Summary */}
        <div className="flex flex-col gap-5">

          {/* Telegram Care Loop Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-black text-slate-800">Telegram Care Loop</h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Two-way dose confirmations</p>
            </div>
            <div className="divide-y divide-slate-50">
              {FAMILY_TELEGRAM.map(m => (
                <div key={m.name} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                    {m.initials}
                  </div>
                  <span className="text-sm font-bold text-slate-700 flex-1">{m.name}</span>
                  {m.linked ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  ) : (
                    <a
                      href="https://t.me/dosiq_bot"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-sky-600 transition-colors"
                    >
                      Link <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Vault Summary */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">Clinical Records</h3>
                </div>
                <button
                  onClick={() => onNavigate('medical')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {/* Total count badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-3xl font-black text-slate-900 tabular-nums">6</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">Total<br/>Documents</span>
              </div>
              {/* Bar breakdown */}
              <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-0.5">
                {DOC_TYPES.map(d => (
                  <div key={d.label} className={`${d.color} rounded-full`} style={{ width: d.width }} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {DOC_TYPES.map(d => (
                  <div key={d.label} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${d.color}`} />
                    <span className="text-[10px] text-slate-500 font-medium">{d.label} ({d.count})</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Document
            </button>
          </div>

        </div>
      </div>

      {/* ── Upcoming Doses (Family-wide) ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800">Upcoming Doses — Family</h3>
          </div>
          <button
            onClick={() => onNavigate('health')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
          >
            Health Tab <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {UPCOMING_DOSES.map(dose => (
            <div key={dose.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${dose.gradient} flex items-center justify-center text-[11px] font-black text-white shrink-0`}>
                {dose.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-tight truncate">{dose.med}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dose.time} · {dose.food}</p>
                <p className="text-[10px] font-semibold text-slate-500">{dose.person}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
};
