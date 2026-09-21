import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Phone, User,
  Loader2, Users, MessageCircle, LogOut, Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DosiqLogo } from '../common/DosiqLogo';
import { AvatarPicker } from './AvatarPicker';
import { DoseTimeSelector } from './DoseTimeSelector';
import { FamilyMemberModal } from './FamilyMemberModal';
import { OnboardingLeftPanel } from './OnboardingLeftPanel';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// ── Preset quick-add buttons for family members ──────────────────────────────
const FAMILY_PRESETS = [
  { label: 'Dad',     emoji: '👨', relationship: 'Father'  },
  { label: 'Mom',     emoji: '👩', relationship: 'Mother'  },
  { label: 'Spouse',  emoji: '💑', relationship: 'Spouse'  },
  { label: 'Child',   emoji: '🧒', relationship: 'Child'   },
  { label: 'Brother', emoji: '👦', relationship: 'Brother' },
  { label: 'Sister',  emoji: '👧', relationship: 'Sister'  },
  { label: 'Other',   emoji: '➕', relationship: 'Other'   },
];

const DEFAULT_DOSE = { morning: '08:00', afternoon: '14:00', night: '20:00' };
const DEFAULT_SAMPLE_MEMBERS = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    relationship: 'Father',
    gender: 'male',
    age: '64',
    phone: '',
    avatar: 'preset-4',
    telegram_username: '',
    doseTime: { morning: '08:00', afternoon: '14:00', night: '20:00' },
  },
  {
    id: 2,
    name: 'Sunita Sharma',
    relationship: 'Mother',
    gender: 'female',
    age: '61',
    phone: '',
    avatar: 'preset-5',
    telegram_username: '',
    doseTime: { morning: '08:00', afternoon: '14:00', night: '20:00' },
  },
];
let _memberId = 2;
const newMember = (relationship) => ({
  id: ++_memberId,
  name: '',
  relationship,
  phone: '',
  avatar: null,
  doseTime: { ...DEFAULT_DOSE },
});



// ── Step 1 Form ───────────────────────────────────────────────────────────────
const Step1Form = ({ data, onChange, onNext }) => {
  const [touched, setTouched] = useState(false);
  const isNameEmpty = !data.name.trim();

  const handleNext = () => {
    setTouched(true);
    if (isNameEmpty) return;
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <AvatarPicker
          name={data.name}
          value={data.avatar}
          onChange={(avatar) => onChange({ avatar })}
        />
      </div>

      {/* Name (Required) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Your Full Name <span className="text-red-500 font-bold">*</span>
          </label>
          <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            Required
          </span>
        </div>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          <input
            type="text"
            value={data.name}
            onChange={(e) => {
              onChange({ name: e.target.value });
              if (!touched) setTouched(true);
            }}
            placeholder="e.g. Alex Sharma"
            className={`w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 ${
              touched && isNameEmpty ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
            } focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors duration-150`}
          />
        </div>
        {touched && isNameEmpty ? (
          <p className="text-red-500 text-[11px] mt-1.5 font-semibold flex items-center gap-1">
            <span>⚠️</span> Your name is required.
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-1">Pre-filled from your verified account · edit anytime.</p>
        )}
      </div>

      {/* Telegram Username (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-sky-500" />
            Telegram Username
          </label>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            Optional
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
            @
          </span>
          <input
            type="text"
            value={data.telegram_username?.replace(/^@/, '') || ''}
            onChange={(e) => onChange({ telegram_username: e.target.value.trim().replace(/^@/, '') })}
            placeholder="your_handle"
            className="w-full pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 bg-white transition-colors duration-150"
          />
        </div>

        {/* Informative guide when empty or filled */}
        {!data.telegram_username ? (
          <div className="mt-2 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 text-[11px] text-sky-800 leading-relaxed flex items-start gap-2">
            <span className="text-sm shrink-0">💡</span>
            <div>
              <p className="font-semibold text-sky-900">Don't have a Telegram handle handy?</p>
              <p className="text-sky-700 mt-0.5">
                You can skip this now and link Telegram anytime in <strong>CareLoop Settings</strong> on the dashboard. Simply open Telegram, search for <span className="font-bold text-sky-950 font-mono">@dosiq_care_bot</span>, and tap <strong>Start</strong>.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Check-ins will dispatch to @{data.telegram_username.replace(/^@/, '')} via @dosiq_care_bot
          </p>
        )}
      </div>

      {/* Dose Times (Preset applied) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Daily Dose Routine
          </label>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Defaults ready · click slot to customize
          </span>
        </div>
        <DoseTimeSelector
          value={data.doseTime}
          onChange={(doseTime) => onChange({ doseTime })}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isNameEmpty}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
      >
        Continue to Family Members
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Step 2 Form ───────────────────────────────────────────────────────────────
const Step2Form = ({ members, onAdd, onUpdate, onRemove, onComplete, loading, onBackToStep1 }) => {
  // Modal state: null = closed, { type:'new', relationship } or { type:'edit', member }
  const [modal, setModal] = useState(null);

  const openNew = (relationship) => setModal({ type: 'new', relationship });
  const openEdit = (member) => setModal({ type: 'edit', member });
  const closeModal = () => setModal(null);

  const handleSave = (formData) => {
    if (modal?.type === 'new') {
      if (Array.isArray(formData)) {
        formData.forEach(m => onAdd(m));
      } else {
        onAdd(formData);
      }
    } else if (modal?.type === 'edit') {
      onUpdate(modal.member.id, { ...modal.member, ...formData });
    }
  };

  const handleRemove = () => {
    if (modal?.type === 'edit') onRemove(modal.member.id);
  };

  // Avatar display helper for pills
  const PRESET_EMOJIS = {
    'preset-1':'👨‍⚕️','preset-2':'👩‍⚕️','preset-3':'🧑‍💼',
    'preset-4':'👴','preset-5':'👩','preset-6':'🧑',
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Quick-add chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Add Family Members
            </label>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              Optional · Can add anytime later
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FAMILY_PRESETS.map((p) => {
              const isUnique = ['Father', 'Mother', 'Spouse'].includes(p.relationship);
              const alreadyAdded = isUnique && members.some(m => m.relationship === p.relationship);
              const count = members.filter(m =>
                p.relationship === 'Child'
                  ? ['Child', 'Son', 'Daughter'].includes(m.relationship)
                  : m.relationship === p.relationship
              ).length;

              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => !alreadyAdded && openNew(p.relationship)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                    alreadyAdded
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-600 opacity-60 cursor-default'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95'
                  }`}
                >
                  <span>{p.emoji}</span>
                  {alreadyAdded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : count > 0 && !isUnique ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-black">+{count}</span>
                  ) : (
                    '+'
                  )}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Added member pills */}
        {members.length > 0 ? (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {members.length} Member{members.length > 1 ? 's' : ''} Added
              <span className="ml-1.5 font-normal normal-case text-slate-400">· click to edit, ×  to remove</span>
            </label>
            <div className="flex flex-col gap-2">
              {members.map((m) => {
                const isPhoto  = m.avatar && !m.avatar.startsWith('preset-');
                const isPreset = m.avatar?.startsWith('preset-');
                const PRESET_EMOJIS_MAP = {'preset-1':'👨‍⚕️','preset-2':'👩‍⚕️','preset-3':'🧑‍💼','preset-4':'👴','preset-5':'👩','preset-6':'🧑'};
                const initial  = (m.name || m.relationship).charAt(0).toUpperCase();

                return (
                  <div
                    key={m.id}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all duration-200"
                    onClick={() => openEdit(m)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openEdit(m)}
                    aria-label={`Edit ${m.name || m.relationship}`}
                  >
                    {/* Mini avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm overflow-hidden shrink-0 border-2 border-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#064e3b,#0d9488)' }}
                    >
                      {isPhoto
                        ? <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                        : isPreset
                        ? <span className="text-lg">{PRESET_EMOJIS_MAP[m.avatar]}</span>
                        : <span className="text-sm font-black text-white/90">{initial}</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.name || m.relationship}</p>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{m.relationship}</span>
                        {m.age && (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                            {m.age} yrs
                          </span>
                        )}
                        {m.phone && <span>· {m.phone}</span>}
                      </p>
                    </div>

                    {/* Dose badge */}
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0">
                      <span>🌅 {m.doseTime?.morning}</span>
                      <span className="text-emerald-200">·</span>
                      <span>🌙 {m.doseTime?.night}</span>
                    </div>

                    {/* Remove X */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(m.id); }}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-slate-400 transition-all duration-150 shrink-0 opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${m.name || m.relationship}`}
                    >
                      <span className="text-base leading-none font-bold">×</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 text-center">
            <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No family members added yet</p>
            <p className="text-xs text-slate-300 mt-0.5">You can always add them from the dashboard too.</p>
          </div>
        )}

        {/* Telegram tip */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 border border-sky-200">
          <MessageCircle className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-sky-800">Telegram Care Loop</p>
            <p className="text-[11px] text-sky-600 mt-0.5">
              Telegram handles link directly to the bot. Send /start to <strong className="font-mono text-sky-900">@dosiq_care_bot</strong> anytime to activate 1-tap medication check-ins.
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
              <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your vault…</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Complete Setup &amp; Launch Vault</>
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

          {onBackToStep1 && (
            <button
              type="button"
              onClick={onBackToStep1}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 pt-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to your profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Family member modal */}
      <FamilyMemberModal
        isOpen={!!modal}
        member={modal?.type === 'edit' ? modal.member : null}
        existingMembers={members}
        defaultRelationship={modal?.relationship || modal?.member?.relationship || 'Child'}
        onSave={handleSave}
        onRemove={handleRemove}
        onClose={closeModal}
      />
    </>
  );
};

// ── Main OnboardingView ───────────────────────────────────────────────────────
export const OnboardingView = () => {
  const { user, completeOnboarding, signOut } = useAuth();

  // Derive prefilled name from auth metadata or email
  const derivedName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const formPanelRef = useRef(null);
  const prevStep = useRef(1);

  // Animate form panel on step change
  useEffect(() => {
    if (prevStep.current === step || !formPanelRef.current) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const direction = step > prevStep.current ? 1 : -1;
      gsap.fromTo(formPanelRef.current,
        { y: direction * 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' }
      );
    });
    prevStep.current = step;
  }, [step]);

  // Entrance animation on mount
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(formPanelRef.current.querySelectorAll('.gsap-form-item'), {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
      });
    });
  }, { scope: formPanelRef });

  const [primary, setPrimary] = useState({
    name: derivedName || 'Alex Sharma',
    telegram_username: '',
    phone: '',
    avatar: null,
    doseTime: { ...DEFAULT_DOSE },
  });

  const [familyMembers, setFamilyMembers] = useState(DEFAULT_SAMPLE_MEMBERS);

  const updatePrimary = useCallback((patch) => setPrimary(p => ({ ...p, ...patch })), []);

  const addMember     = (formData) => setFamilyMembers(ms => [...ms, { ...newMember(formData.relationship), ...formData }]);
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
      <OnboardingLeftPanel
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

        {/* Top header bar with right-side corner navigation */}
        <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <DosiqLogo size="default" showBadge={false} />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-slate-700 font-bold">Onboarding Setup</span>
              <span className="text-slate-300">•</span>
              <span>{step === 1 ? 'Step 1: Your Profile' : 'Step 2: Family Members'}</span>
            </div>
          </div>

          {/* Right-side corner controls */}
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-all duration-150 active:scale-95"
                title="Go back to Step 1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Step 1</span>
                <span className="sm:hidden">Step 1</span>
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm transition-all duration-150 active:scale-95"
              title="Exit and return to login page"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Login</span>
            </button>
          </div>
        </header>

        {/* Step progress bar */}
        <div className="relative z-10 w-full h-1 bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Form content */}
        <main ref={formPanelRef} className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-4 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Section heading */}
            <div className="gsap-form-item mb-4">
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
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
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
                onBackToStep1={() => setStep(1)}
              />
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
