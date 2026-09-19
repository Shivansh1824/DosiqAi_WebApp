import React from 'react';
import { Sparkles, Shield, Heart, Zap, CheckCircle2, Users } from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';

const PRESET_EMOJIS = {
  'preset-1': '👨‍⚕️', 'preset-2': '👩‍⚕️', 'preset-3': '🧑‍💼',
  'preset-4': '👴',   'preset-5': '👩',    'preset-6': '🧑',
};

// ── Step 1 live preview card ──────────────────────────────────────────────────
export const Step1PreviewCard = ({ name, avatar, doseTime }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const isPreset = avatar?.startsWith('preset-');

  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-2xl shadow-black/30 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #064e3b, #0d9488)' }}
        >
          {avatar && !isPreset ? (
            <img src={avatar} alt="you" className="w-full h-full object-cover" />
          ) : isPreset ? (
            <span className="text-2xl">{PRESET_EMOJIS[avatar]}</span>
          ) : (
            <span className="text-base font-black text-white/90">{initials}</span>
          )}
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
export const Step2PreviewCard = ({ members, primaryName, primaryAvatar }) => {
  const allProfiles = [
    { name: primaryName || 'You', relationship: 'Self', avatar: primaryAvatar, isYou: true },
    ...members.map(m => ({
      name: m.name || m.relationship,
      relationship: m.relationship,
      avatar: m.avatar,
      age: m.age,
      isYou: false,
    })),
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
        {allProfiles.map((p, i) => {
          const isPhoto  = p.avatar && !p.avatar.startsWith('preset-');
          const isPreset = p.avatar?.startsWith('preset-');
          const initial  = p.name ? p.name.charAt(0).toUpperCase() : '?';

          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white/90 shrink-0 overflow-hidden"
                style={{ background: p.isYou ? 'linear-gradient(135deg,#064e3b,#0d9488)' : 'linear-gradient(135deg,#1e3a5f,#0369a1)' }}
              >
                {isPhoto ? (
                  <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                ) : isPreset ? (
                  <span className="text-base">{PRESET_EMOJIS[p.avatar]}</span>
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{p.name || '—'}</p>
                <p className="text-[10px] text-white/50">
                  {p.relationship}{p.age ? ` · ${p.age} yrs` : ''}
                </p>
              </div>
              {p.isYou && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">Primary</span>
              )}
            </div>
          );
        })}
        {allProfiles.length === 1 && (
          <p className="text-center text-[11px] text-white/35 py-2">
            Add family members → they appear here
          </p>
        )}
      </div>
    </div>
  );
};

// ── Left Panel — dynamic content per step ────────────────────────────────────
export const OnboardingLeftPanel = ({ step, primaryName, avatar, doseTime, familyMembers }) => {
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
          <Step2PreviewCard members={familyMembers} primaryName={primaryName} primaryAvatar={avatar} />
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

        {/* Contextual feature rows */}
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
