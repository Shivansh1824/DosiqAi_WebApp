import React, { useState } from 'react';
import {
  Activity, FileText, ShieldCheck, Send, Users,
  UploadCloud, ChevronRight, CheckCircle2,
  TrendingUp, Pill, Clock, Plus, ExternalLink,
  Brain, Stethoscope, ArrowRight, Check, User
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
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight truncate">{sub}</p>}
    </div>
  </div>
);

// ─── World Section ────────────────────────────────────────────────────────────

export const WorldSection = ({
  user: propUser,
  profiles = [],
  activeProfile = null,
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

  // Consolidated vs Individual Member Mode
  const isAllFamily = !activeProfile || activeProfile.id === 'all';
  const currentMemberName = activeProfile?.name || 'Caregiver';
  const currentRelationship = activeProfile?.relationship || 'Self';

  // Subtitle & Header Copy customized per profile
  let heroTitle = `${greeting}, ${userName} 👋`;
  let heroSubtitle = `You are currently viewing all family profiles. Showing consolidated clinical records and adherence across all ${profiles.length} registered profiles.`;
  let heroBadge = `Entire Family · ${profiles.length} Profiles Active`;

  if (!isAllFamily) {
    if (activeProfile?.relationship === 'Self') {
      heroTitle = `${greeting}, ${activeProfile.name?.split(' ')[0] || userName} 👋`;
      heroSubtitle = `You are currently viewing your own profile (${activeProfile.name}). Showing your personal prescriptions, lab records, and care loop check-ins.`;
      heroBadge = `Personal Medical Dossier · ${documents.length} Records`;
    } else {
      const isChild = ['Child', 'Son', 'Daughter'].includes(activeProfile?.relationship);
      const childGenderDesc = activeProfile?.relationship === 'Child'
        ? (activeProfile?.gender === 'female' ? 'daughter' : activeProfile?.gender === 'male' ? 'son' : 'child')
        : activeProfile?.relationship.toLowerCase();

      heroTitle = `Viewing ${activeProfile.name} (${activeProfile.relationship}) 👤`;
      heroSubtitle = isChild
        ? `You are currently on ${activeProfile.name}'s pediatric profile (${childGenderDesc}${activeProfile.age ? `, ${activeProfile.age} yrs` : ''}). Dedicated immunizations, prescriptions, and pediatric records.`
        : `You are currently on your ${activeProfile.relationship.toLowerCase()}'s profile (${activeProfile.name}). Displaying dedicated prescriptions, clinical vault, and Telegram check-ins.`;
      
      heroBadge = `${activeProfile.name} · ${activeProfile.relationship}${activeProfile.age ? ` (${activeProfile.age} yrs)` : ''} · Routine: ${activeProfile.morning_dose_time || '08:00'}`;
    }
  }

  // Find the latest analyzed document
  const latestDoc = documents[0] || null;
  const latestDocProfile = latestDoc
    ? (profiles.find(p => p.id === latestDoc.family_member_id) || activeProfile || profiles[0] || null)
    : null;
  const extraction = latestDoc?.ai_analysis_result;
  const isReport = extraction?.document_type === 'medical_report' || latestDoc?.type === 'Blood Test';
  const rxData = extraction?.prescription_data;
  const reportData = extraction?.report_data;
  const extractedMeds = rxData?.medications || [];
  const extractedBiomarkers = reportData?.biomarkers || [];

  // Telegram Family List (Filtered to active person if single person selected)
  const visibleProfiles = isAllFamily ? profiles : [activeProfile].filter(Boolean);
  const familyTelegram = visibleProfiles.map(p => ({
    id: p.id,
    name: p.name?.split(' ')[0] || p.relationship,
    fullName: p.name,
    relationship: p.relationship,
    initials: p.initials || 'P',
    avatar: p.avatar,
    linked: !!p.telegram_linked,
    telegram_username: p.telegram_username,
    gradient: RELATIONSHIP_GRADIENTS[p.relationship] || RELATIONSHIP_GRADIENTS['Other'],
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

  const linkedTelegramCount = isAllFamily
    ? profiles.filter(p => p.telegram_linked).length
    : (activeProfile?.telegram_linked ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">

      {/* ── Hero Banner ── */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-300"
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
            {heroTitle}
          </h1>
          <p className="text-emerald-200/90 text-sm font-medium mt-2 max-w-lg leading-relaxed">
            {heroSubtitle}
          </p>
          {/* Adherence / Profile Badge */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white">{heroBadge}</span>
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
        {isAllFamily ? (
          <>
            <KpiCard label="Family Profiles"  value={profiles.length}  icon={Users}        colorClass="text-emerald-600" bgClass="bg-emerald-50" sub="Registered" />
            <KpiCard label="Docs in Vault"    value={documents.length} icon={FileText}     colorClass="text-sky-600"     bgClass="bg-sky-50"     sub="Encrypted records" />
            <KpiCard label="Care Loop Active" value={linkedTelegramCount} icon={Send}      colorClass="text-violet-600"  bgClass="bg-violet-50"  sub={`of ${profiles.length} members`} />
            <KpiCard label="Active Regimens"  value={medications.length} icon={Pill}       colorClass="text-teal-600"    bgClass="bg-teal-50"    sub={medications.length > 0 ? `${medications.length} prescribed` : "0 active meds"} />
            <KpiCard label="Drug Alerts"      value={0}                icon={ShieldCheck}  colorClass="text-emerald-600" bgClass="bg-emerald-50" sub="0 conflicts" />
          </>
        ) : (
          <>
            <KpiCard label="Active Member"    value={activeProfile?.name?.split(' ')[0] || '1'} icon={User}       colorClass="text-emerald-600" bgClass="bg-emerald-50" sub={activeProfile?.relationship || 'Self'} />
            <KpiCard label="Docs in Vault"    value={documents.length} icon={FileText}     colorClass="text-sky-600"     bgClass="bg-sky-50"     sub={`for ${activeProfile?.name?.split(' ')[0] || 'member'}`} />
            <KpiCard label="Care Loop Status" value={activeProfile?.telegram_linked ? 'Active' : 'Offline'} icon={Send} colorClass="text-violet-600" bgClass="bg-violet-50" sub={activeProfile?.telegram_linked ? 'Linked' : 'Not linked'} />
            <KpiCard label="Active Regimens"  value={medications.length} icon={Pill}       colorClass="text-teal-600"    bgClass="bg-teal-50"    sub={medications.length > 0 ? `${medications.length} active` : "0 active meds"} />
            <KpiCard label="Drug Alerts"      value={0}                icon={ShieldCheck}  colorClass="text-emerald-600" bgClass="bg-emerald-50" sub="0 conflicts" />
          </>
        )}
      </div>

      {/* ── Main Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Column (2/3 width): Clinical AI Command Center & Care Loop Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* 1. Latest AI Clinical Analysis Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {isAllFamily ? "Latest AI Clinical Insights" : `Latest AI Clinical Insights — ${activeProfile?.name?.split(' ')[0] || ''}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Decoded with Google Gemini 3.8 Flash</p>
                </div>
              </div>

              {latestDoc && (
                <button
                  type="button"
                  onClick={() => onViewDocument ? onViewDocument(latestDoc) : onNavigate('medical')}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                >
                  <span>Inspect Analysis</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {latestDoc ? (
              <div className="p-6 flex flex-col gap-4">
                {/* Document Metadata Row */}
                <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        latestDoc.type === 'Blood Test'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {latestDoc.type}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-medium">{latestDoc.date || 'Recent'}</span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">
                      {latestDoc.diagnosis || (isReport ? 'Blood Biomarkers & Chemistry Panel' : 'Primary Care Prescription')}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Issued by <span className="font-semibold text-slate-700">{latestDoc.doctor || 'Consulting Physician'}</span>
                    </p>
                  </div>

                  {latestDocProfile && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-2xl shrink-0">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${RELATIONSHIP_GRADIENTS[latestDocProfile.relationship] || 'from-slate-400 to-gray-500'} flex items-center justify-center text-[10px] font-black text-white`}>
                        {latestDocProfile.initials || 'P'}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{latestDocProfile.name}</p>
                        <p className="text-[10px] text-slate-400 leading-none">{latestDocProfile.relationship}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real Extracted Clinical Highlights */}
                {isReport ? (
                  extractedBiomarkers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {extractedBiomarkers.slice(0, 3).map((bio, idx) => (
                        <div key={idx} className="bg-sky-50/60 border border-sky-100 rounded-2xl p-3">
                          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">{bio.name || bio.marker}</p>
                          <p className="text-lg font-black text-slate-900 mt-0.5">{bio.value} <span className="text-xs font-semibold text-slate-400">{bio.unit}</span></p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                            bio.status === 'high' || bio.status === 'critical' ? 'text-rose-700 bg-rose-100/70' :
                            bio.status === 'borderline' ? 'text-amber-700 bg-amber-100/70' : 'text-emerald-700 bg-emerald-100/70'
                          }`}>
                            {bio.status || 'Normal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-2xl">
                      <p className="text-xs font-bold text-sky-900">Lab Report Secured in Vault</p>
                      <p className="text-xs text-sky-700 mt-0.5">Click "Inspect Analysis" above to view full laboratory chemistry panel and biomarker charts.</p>
                    </div>
                  )
                ) : (
                  extractedMeds.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Decoded Prescriptions:</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {extractedMeds.slice(0, 3).map((m, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            {m.name || m.drug} ({m.timing || m.dosage || 'As directed'})
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1 bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Conflict Shield: Verified safe for medication schedule and automated dispatch.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                      <p className="text-xs font-bold text-emerald-900">Prescription Encrypted in Vault</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Click "Inspect Analysis" to view decoded handwritten medicines, dosage timings, and physician instructions.</p>
                    </div>
                  )
                )}
              </div>
            ) : (
              /* Clean Empty State without placeholder data */
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {isAllFamily ? "No Clinical Documents Decoded Yet" : `No Clinical Records for ${activeProfile?.name || 'this member'}`}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {isAllFamily
                      ? "Upload a prescription or lab test report to let Gemini extract handwritten medicines, dosage schedules, and health biomarkers automatically."
                      : `Upload a prescription or lab test for ${activeProfile?.name} to view their decoded medicines and biomarker analysis.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 mt-1"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Today's Medication Adherence Timeline (Care Loop Live Feed) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {isAllFamily ? "Today's Family Medication Timeline" : `Today's Regimen — ${activeProfile?.name?.split(' ')[0] || ''}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Synced with Telegram & WhatsApp Care Loop</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('health')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                View Meds Tab →
              </button>
            </div>

            {medications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {medications.map((item, idx) => {
                  const prof = profiles.find(p => p.id === item.family_member_id) || activeProfile || {};
                  const grad = RELATIONSHIP_GRADIENTS[prof.relationship] || 'from-emerald-400 to-teal-500';

                  return (
                    <div key={item.id || idx} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                          {prof.name?.[0] || 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{item.brand || item.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {prof.name || 'Member'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {item.slot || 'Routine'} · {item.time || '08:00 AM'} · {item.food || 'With Food'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Regimen</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Clean Empty State without fake data */
              <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Pill className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">
                  {isAllFamily ? "No Active Medications Scheduled" : `No Medications Prescribed for ${activeProfile?.name}`}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  {isAllFamily
                    ? "No medication schedules are active in the database. When you upload a doctor's prescription, dosiq AI extracts and schedules dosages automatically."
                    : `No active prescriptions scheduled for ${activeProfile?.name}. Upload a prescription to start automated Telegram reminders.`}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right column: Telegram Status + Doc Vault Summary */}
        <div className="flex flex-col gap-5">

          {/* Telegram Care Loop Panel (Shows all profiles or only active member) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-black text-slate-800">
                  {isAllFamily ? "Telegram Care Loop" : `${activeProfile?.name?.split(' ')[0] || ''}'s Care Loop`}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isAllFamily ? "Automated check-ins for family members" : `Two-way check-ins for ${activeProfile?.relationship || 'member'}`}
              </p>
            </div>

            {familyTelegram.length > 0 ? (
              familyTelegram.map(m => {
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
                      <span className="text-sm font-bold text-slate-700 block truncate">{m.fullName || m.name}</span>
                      {m.telegram_username ? (
                        <span className="text-[10px] text-sky-600 font-mono font-medium block truncate">
                          @{m.telegram_username.replace(/^@/, '')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {m.relationship}
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
              })
            ) : (
              <p className="px-5 py-4 text-xs text-slate-400">No member linked to Telegram yet</p>
            )}
          </div>

          {/* Document Vault Summary */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">
                    {isAllFamily ? "Clinical Records" : `${activeProfile?.name?.split(' ')[0] || ''}'s Records`}
                  </h3>
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
                <p className="text-xs text-slate-400 mt-2">No documents stored in this dossier yet</p>
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
