import React, { useState, useCallback } from 'react';
import {
  ArrowRight, CheckCircle2, Sparkles, Users, Phone, User,
  MessageCircle, Clock, Loader2, Shield, Heart, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DosiqLogo } from '../common/DosiqLogo';
import { AvatarPicker } from './AvatarPicker';
import { DoseTimeSelector } from './DoseTimeSelector';
import { FamilyMemberCard } from './FamilyMemberCard';

// ── Preset quick-add buttons for family members ──────────────────────────────
const FAMILY_PRESETS = [
  { label: 'Dad',    emoji: '👨', relationship: 'Father'  },
  { label: 'Mom',    emoji: '👩', relationship: 'Mother'  },
  { label: 'Spouse', emoji: '💑', relationship: 'Spouse'  },
  { label: 'Child',  emoji: '🧒', relationship: 'Son'     },
  { label: 'Custom', emoji: '➕', relationship: 'Other'   },
];

const DEFAULT_DOSE = { morning: '08:00', afternoon: '14:00', night: '20:00' };
let _memberId = 0;
const newMember = (relationship) => ({
  id: ++_memberId,
  name: '',
  relationship,
  phone: '',
  avatar: null,
  doseTime: { ...DEFAULT_DOSE },
});

// ── Left Panel — dynamic content per step ────────────────────────────────────
const LeftPanel = ({ step, primaryName, avatar, doseTime, familyMembers }) => {
  const isStep1 = step === 1;

  return (
    <div
      className="hidden lg:flex lg:w-[52%] xl:w-[54%] relative flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 90% 80% at 20% -10%, #0d9488 0%, #065f46 35%, #064e3b 70%, #022c22 100%)',
      }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      {/* Atmospheric glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-teal-300/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 px-10 pt-8 shrink-0">
        <DosiqLogo size="default" showBadge={false} variant="light" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 py-8 gap-6">

        {/* Step badge */}
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          {isStep1 ? 'Step 1 of 2 — Your Profile' : 'Step 2 of 2 — Family Network'}
        </div>

        {/* Headline — morphs per step */}
        <div>
          <h1
            className="font-extrabold tracking-tight text-white leading-[1.15] max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 2.2vw, 2.4rem)', textWrap: 'balance' }}
          >
            {isStep1 ? 'Setting up your primary health dossier.' : 'Connecting your family care network.'}
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mt-3 max-w-md" style={{ textWrap: 'pretty' }}>
            {isStep1
              ? 'Personalise your vault profile — your photo, preferred name, and daily medication routine so dosiq AI serves you perfectly.'
              : 'Add profiles for the people you care for. Each family member gets their own dossier with separate medication schedules, lab history, and Telegram check-ins.'}
          </p>
        </div>

        {/* Live reactive preview card */}
        {isStep1 ? (
          <Step1PreviewCard name={primaryName} avatar={avatar} doseTime={doseTime} />
        ) : (
          <Step2PreviewCard members={familyMembers} primaryName={primaryName} />
        )}

        {/* Trust signals */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { icon: <Shield className="w-3 h-3" />, label: 'Private encrypted vault' },
            { icon: <Heart className="w-3 h-3" />, label: 'Built for families' },
            { icon: <Zap className="w-3 h-3" />, label: '2-minute setup' },
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

        {/* Contextual feature rows — fill dead space with live stats */}
        <div className="flex flex-col gap-2">
          {[
            { emoji: '🔍', title: 'AI Rx Decoder', desc: 'Handwriting decoded in 1.1s' },
            { emoji: '🛡️', title: 'Drug Conflict Shield', desc: 'Zero interaction risks' },
            { emoji: '📱', title: 'Telegram Care Loop', desc: 'Automated daily check-ins' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.08] transition-colors duration-150">
              <span className="text-xl shrink-0">{emoji}</span>
              <div>
                <p className="text-[12px] font-bold text-white/90">{title}</p>
                <p className="text-[11px] text-white/45 font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-10 pb-7 text-center text-[11px] text-white/35 font-medium border-t border-white/[0.07] pt-4 shrink-0">
        © 2026 dosiq AI · All rights reserved
      </div>
    </div>
  );
};

// ── Step 1 live preview card ──────────────────────────────────────────────────
const Step1PreviewCard = ({ name, avatar, doseTime }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const isPreset = avatar?.startsWith('preset-');
  const PRESET_EMOJIS = { 'preset-1': '👨‍⚕️','preset-2':'👩‍⚕️','preset-3':'🧑‍💼','preset-4':'👴','preset-5':'👩','preset-6':'🧑' };

  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/30 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #064e3b, #0d9488)' }}
        >
          {avatar && !isPreset
            ? <img src={avatar} alt="you" className="w-full h-full object-cover" />
            : isPreset
            ? <span className="text-2xl">{PRESET_EMOJIS[avatar]}</span>
            : <span className="text-base font-black text-white/90">{initials}</span>
          }
        </div>
        <div>
          <p className="font-bold text-white text-sm">{name || 'Your Name'}</p>
          <p className="text-emerald-300 text-[11px] font-medium">Primary Account · Self</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Morning', time: doseTime.morning, icon: '🌅' },
          { label: 'Afternoon', time: doseTime.afternoon, icon: '☀️' },
          { label: 'Night', time: doseTime.night, icon: '🌙' },
        ].map(({ label, time, icon }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <span className="text-lg">{icon}</span>
            <span className="text-[10px] text-white/50 font-medium">{label}</span>
            <span className="text-[11px] font-bold text-white font-variant-numeric tabular-nums">
              {time || '--:--'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Step 2 live preview card ──────────────────────────────────────────────────
const Step2PreviewCard = ({ members, primaryName }) => {
  const allProfiles = [
    { name: primaryName || 'You', relationship: 'Self', isYou: true },
    ...members.map(m => ({ name: m.name || m.relationship, relationship: m.relationship, isYou: false })),
  ];
  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-emerald-300" />
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Family Vault</span>
        <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-400/20">
          {allProfiles.length} {allProfiles.length === 1 ? 'Dossier' : 'Dossiers'}
        </span>
      </div>
      <div className="space-y-2">
        {allProfiles.map((p, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white/90 shrink-0"
              style={{ background: p.isYou ? 'linear-gradient(135deg,#064e3b,#0d9488)' : 'linear-gradient(135deg,#1e3a5f,#0369a1)' }}
            >
              {p.name ? p.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{p.name || '—'}</p>
              <p className="text-[10px] text-white/50">{p.relationship}</p>
            </div>
            {p.isYou && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">Primary</span>
            )}
          </div>
        ))}
        {allProfiles.length === 1 && (
          <p className="text-center text-[11px] text-white/35 py-2">
            Add family members → they appear here
          </p>
        )}
      </div>
    </div>
  );
};

// ── Step 1 Form ───────────────────────────────────────────────────────────────
const Step1Form = ({ data, onChange, onNext }) => {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Your name is required';

  const handleNext = () => {
    if (errors.name) return;
    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex flex-col items-center py-2">
        <AvatarPicker
          name={data.name}
          value={data.avatar}
          onChange={(avatar) => onChange({ avatar })}
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Your Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Shivansh Rana"
            className={`w-full pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 ${errors.name ? 'border-red-300' : 'border-slate-200'} focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150`}
          />
        </div>
        {errors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.name}</p>}
      </div>

      {/* Mobile */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Your Mobile Number
          <span className="ml-1.5 text-[10px] font-normal text-slate-400 normal-case">(for Telegram care-loop check-ins)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
          />
        </div>
      </div>

      {/* Dose Times */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Your Daily Dose Routine
        </label>
        <DoseTimeSelector
          value={data.doseTime}
          onChange={(doseTime) => onChange({ doseTime })}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!!errors.name}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
      >
        Continue to Family Members
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Step 2 Form ───────────────────────────────────────────────────────────────
const Step2Form = ({ members, onAdd, onUpdate, onRemove, onComplete, loading }) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Quick-add chips */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Add Family Members
        </label>
        <div className="flex flex-wrap gap-2">
          {FAMILY_PRESETS.map((p) => {
            const alreadyAdded = members.some(m => m.relationship === p.relationship);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => !alreadyAdded && onAdd(p.relationship)}
                disabled={alreadyAdded && p.relationship !== 'Other'}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                  alreadyAdded && p.relationship !== 'Other'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600 opacity-60 cursor-default'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95'
                }`}
              >
                <span>{p.emoji}</span>
                {alreadyAdded && p.relationship !== 'Other' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  '+'
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Family member cards */}
      {members.length > 0 && (
        <div className="flex flex-col gap-3 max-h-[36vh] overflow-y-auto pr-1">
          {members.map((m) => (
            <FamilyMemberCard
              key={m.id}
              member={m}
              onChange={(updated) => onUpdate(m.id, updated)}
              onRemove={() => onRemove(m.id)}
            />
          ))}
        </div>
      )}

      {members.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No family members added yet</p>
          <p className="text-xs text-slate-300 mt-0.5">You can add them any time from the dashboard.</p>
        </div>
      )}

      {/* Telegram tip */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
        <MessageCircle className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-sky-800">Telegram Care Loop</p>
          <p className="text-[11px] text-sky-600 mt-0.5">
            After setup, connect the Telegram bot to start sending automated medication check-ins.
            Phone numbers you've added are already linked.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up your vault…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Complete Setup &amp; Launch Vault
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold transition-colors duration-150"
        >
          Skip for now &amp; open dashboard →
        </button>
      </div>
    </div>
  );
};

// ── Main OnboardingView ───────────────────────────────────────────────────────
export const OnboardingView = () => {
  const { user, completeOnboarding } = useAuth();

  // Derive prefilled name from auth metadata or email
  const derivedName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [primary, setPrimary] = useState({
    name: derivedName,
    phone: '',
    avatar: null,
    doseTime: { ...DEFAULT_DOSE },
  });

  const [familyMembers, setFamilyMembers] = useState([]);

  const updatePrimary = useCallback((patch) => setPrimary(p => ({ ...p, ...patch })), []);

  const addMember     = (rel) => setFamilyMembers(ms => [...ms, newMember(rel)]);
  const updateMember  = (id, updated) => setFamilyMembers(ms => ms.map(m => m.id === id ? updated : m));
  const removeMember  = (id) => setFamilyMembers(ms => ms.filter(m => m.id !== id));

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({ primary, familyMembers });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left Panel ── */}
      <LeftPanel
        step={step}
        primaryName={primary.name}
        avatar={primary.avatar}
        doseTime={primary.doseTime}
        familyMembers={familyMembers}
      />

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-slate-50/80 relative">
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />

        {/* Mobile logo */}
        <header className="lg:hidden relative z-10 w-full border-b border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <DosiqLogo size="default" showBadge={false} />
          <span className="text-xs font-semibold text-slate-500">Step {step} of 2</span>
        </header>

        {/* Step progress bar */}
        <div className="relative z-10 w-full h-1 bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Form content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-4 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Section heading */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Clock className="w-3 h-3" />
                {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                {step === 1 ? 'Your Profile' : 'Family Members'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {step === 1
                  ? 'Set up your primary dosiq AI dossier.'
                  : 'Add family members to manage their care separately.'}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Step forms */}
            {step === 1 ? (
              <Step1Form
                data={primary}
                onChange={updatePrimary}
                onNext={() => setStep(2)}
              />
            ) : (
              <Step2Form
                members={familyMembers}
                onAdd={addMember}
                onUpdate={updateMember}
                onRemove={removeMember}
                onComplete={handleComplete}
                loading={loading}
              />
            )}

            {/* Back button for step 2 */}
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-3 w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors duration-150"
              >
                ← Back to your profile
              </button>
            )}
          </div>
        </main>

        <footer className="lg:hidden relative z-10 py-4 text-center text-[11px] text-slate-400 shrink-0">
          © 2026 dosiq AI · All rights reserved
        </footer>
      </div>
    </div>
  );
};
