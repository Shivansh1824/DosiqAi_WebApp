import React, { useState } from 'react';
import {
  Activity, FileText, ShieldCheck, Send, Users,
  UploadCloud, ChevronRight, CheckCircle2,
  TrendingUp, Pill, Clock, Plus, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UploadDocumentModal } from './UploadDocumentModal';

// ─── Color Helper ─────────────────────────────────────────────────────────────

const RELATIONSHIP_GRADIENTS = {
  'Self':    'from-emerald-400 to-teal-500',
  'Father':  'from-sky-400 to-cyan-500',
  'Mother':  'from-violet-400 to-fuchsia-500',
  'Child':   'from-amber-400 to-orange-500',
  'Son':     'from-amber-400 to-orange-500',
  'Daughter':'from-pink-400 to-rose-500',
  'Spouse':  'from-rose-400 to-pink-500',
  'Brother': 'from-teal-400 to-emerald-500',
  'Sister':  'from-fuchsia-400 to-purple-500',
  'Other':   'from-slate-400 to-gray-500',
};

const PRESET_EMOJIS = {
  'preset-1': '👨‍⚕️', 'preset-2': '👩‍⚕️', 'preset-3': '🧑‍💼',
  'preset-4': '👴',   'preset-5': '👩',    'preset-6': '🧑',
  'preset-7': '👦',   'preset-8': '👧',
};

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

export const WorldSection = ({
  user: propUser,
  profiles = [],
  activeProfile,
  documents = [],
  medications = [],
  onNavigate,
  onAddMember,
  onDocumentAdded,
  onViewDocument,
}) => {
  const auth = useAuth();
  const user = propUser || auth?.user;
  const [uploadOpen, setUploadOpen] = useState(false);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const userName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    profiles.find(p => p.relationship === 'Self')?.name?.split(' ')[0] ||
    'Caregiver';

  // Dynamic Telegram Family List
  const familyTelegram = profiles.map(p => ({
    id: p.id,
    name: p.name?.split(' ')[0] || p.relationship,
    initials: p.initials || 'P',
    avatar: p.avatar,
    linked: !!p.telegram_linked,
    telegram_username: p.telegram_username,
    gradient: RELATIONSHIP_GRADIENTS[p.relationship] || RELATIONSHIP_GRADIENTS['Other'],
  }));

  // Dynamic Upcoming Doses (only from real prescribed medications)
  const upcomingDoses = medications.slice(0, 3).map((m, idx) => {
    const prof = profiles.find(p => p.id === m.profileId) || profiles[0] || {};
    return {
      id: m.id || idx,
      person: m.patientName || prof.name?.split(' ')[0] || 'Patient',
      initials: prof.initials || 'P',
      avatar: prof.avatar,
      gradient: RELATIONSHIP_GRADIENTS[prof.relationship] || RELATIONSHIP_GRADIENTS['Other'],
      med: m.brand || m.name || 'Prescription Dose',
      time: m.time || '08:00 AM',
      food: m.food || 'As directed',
    };
  });

  // Dynamic Live Activity Feed based on real profiles
  const activityFeed = profiles.map((p, idx) => ({
    id: p.id || idx,
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 border-emerald-100',
    message: `${p.name} (${p.relationship}) dossier active`,
    sub: p.mobile_number ? `Phone: ${p.mobile_number} · Routine: ${p.morning_dose_time || '08:00'}` : `Dose time: ${p.morning_dose_time || '08:00'}`,
    time: 'Synced',
  }));

  // Document breakdown
  const rxCount = documents.filter(d => d.type === 'Prescription').length;
  const labCount = documents.filter(d => d.type === 'Blood Test').length;
  const otherCount = documents.length - rxCount - labCount;
  const totalDocs = documents.length;

  const docTypes = [
    { label: 'Prescriptions', count: rxCount, color: 'bg-emerald-500', width: totalDocs > 0 ? `${Math.round((rxCount / totalDocs) * 100)}%` : '50%' },
    { label: 'Blood Tests',   count: labCount, color: 'bg-sky-500',     width: totalDocs > 0 ? `${Math.round((labCount / totalDocs) * 100)}%` : '30%' },
    { label: 'Other',         count: otherCount, color: 'bg-slate-300',   width: totalDocs > 0 ? `${Math.round((otherCount / totalDocs) * 100)}%` : '20%' },
  ];

  const linkedTelegramCount = profiles.filter(p => p.telegram_linked).length;

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
            {greeting}, {userName} 👋
          </h1>
          <p className="text-emerald-200/80 text-sm font-medium mt-2 max-w-sm leading-relaxed">
            Your family medical vault is active with {profiles.length} registered profiles. {documents.length} records secured.
          </p>
          {/* Adherence pill */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white">Family Dossiers Operational · {profiles.length} Active</span>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="relative z-10 flex items-center shrink-0">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all duration-150"
          >
            <UploadCloud className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Family Profiles"  value={profiles.length}  icon={Users}        colorClass="text-emerald-600" bgClass="bg-emerald-50" sub="Registered" />
        <KpiCard label="Docs in Vault"    value={documents.length} icon={FileText}     colorClass="text-sky-600"     bgClass="bg-sky-50"     sub="Encrypted records" />
        <KpiCard label="Care Loop Active" value={linkedTelegramCount} icon={Send}      colorClass="text-violet-600"  bgClass="bg-violet-50"  sub={`of ${profiles.length} members`} />
        <KpiCard label="Active Regimens"  value={medications.length} icon={Pill} colorClass="text-teal-600" bgClass="bg-teal-50" sub={medications.length > 0 ? `${medications.length} prescribed` : "0 active meds"} />
        <KpiCard label="Drug Alerts"      value={0}                icon={ShieldCheck}  colorClass="text-emerald-600" bgClass="bg-emerald-50" sub="0 conflicts" />
      </div>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-black text-slate-800">Family Status Feed</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button onClick={() => onNavigate('family')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Manage Family
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {activityFeed.map(act => (
              <div key={act.id} className="flex items-start gap-3.5 px-6 py-4 hover:bg-slate-50/60 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${act.bg}`}>
                  <act.icon className={`w-4 h-4 ${act.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{act.message}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{act.sub}</p>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold shrink-0 mt-0.5">{act.time}</span>
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
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Automated check-ins for family members</p>
            </div>
              {familyTelegram.map(m => {
                const isCustom = m.avatar && !m.avatar.startsWith('preset-');
                const isPreset = m.avatar && m.avatar.startsWith('preset-');
                const presetEmoji = isPreset ? PRESET_EMOJIS[m.avatar] : null;

                return (
                  <div key={m.id || m.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    {isCustom ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-xs border border-slate-200 shrink-0">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                    ) : presetEmoji ? (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-sm shrink-0`}>
                        {presetEmoji}
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                        {m.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-700 block truncate">{m.name}</span>
                      {m.telegram_username && (
                        <span className="text-[10px] text-sky-600 font-mono font-medium block truncate">
                          @{m.telegram_username.replace(/^@/, '')}
                        </span>
                      )}
                    </div>
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
                );
              })}
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
                <span className="text-3xl font-black text-slate-900 tabular-nums">{totalDocs}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">Total<br/>Documents</span>
              </div>
              {totalDocs > 0 ? (
                <>
                  <div className="flex h-2 rounded-full overflow-hidden mt-3 gap-0.5">
                    {docTypes.map(d => (
                      <div key={d.label} className={`${d.color} rounded-full`} style={{ width: d.width }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {docTypes.map(d => (
                      <div key={d.label} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="text-[10px] text-slate-500 font-medium">{d.label} ({d.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Vault encrypted & ready for uploads</p>
              )}
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

      {/* ── Scheduled Medications (Family-wide) ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800">Scheduled Medications — Family</h3>
          </div>
          <button
            onClick={() => onNavigate('health')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
          >
            Health Tab <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {upcomingDoses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {upcomingDoses.map(dose => {
              const isCustom = dose.avatar && !dose.avatar.startsWith('preset-');
              const isPreset = dose.avatar && dose.avatar.startsWith('preset-');
              const presetEmoji = isPreset ? PRESET_EMOJIS[dose.avatar] : null;

              return (
                <div key={dose.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {isCustom ? (
                    <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs border border-slate-200 shrink-0">
                      <img src={dose.avatar} alt={dose.person} className="w-full h-full object-cover" />
                    </div>
                  ) : presetEmoji ? (
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${dose.gradient} flex items-center justify-center text-xl shrink-0`}>
                      {presetEmoji}
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${dose.gradient} flex items-center justify-center text-[11px] font-black text-white shrink-0`}>
                      {dose.initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight truncate">{dose.med}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dose.time} · {dose.food}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{dose.person}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Pill className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Medications Prescribed Yet</p>
            <p className="text-xs text-slate-400 max-w-sm">
              No active medicine regimens are scheduled. Once you upload a prescription in Clinical Records, dosiq AI extracts and displays real medicines here.
            </p>
          </div>
        )}
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onUploadSuccess={onDocumentAdded}
        onExtractionComplete={(doc) => {
          setUploadOpen(false);
          if (onViewDocument) {
            onViewDocument(doc);
          } else if (onNavigate) {
            onNavigate('medical');
          }
        }}
        onAddMember={onAddMember}
      />
    </div>
  );
};
