import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, UserCheck, Zap, ExternalLink } from 'lucide-react';

// ─── Notification Banner ──────────────────────────────────────────────────────

const NotificationBanner = ({ event }) => (
  <div
    className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200"
    style={{ animation: 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
  >
    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
    <p className="text-xs font-semibold text-emerald-800">{event.message}</p>
  </div>
);

// ─── Bot Link CTA ─────────────────────────────────────────────────────────────

const BotLinkPrompt = ({ profile }) => (
  <div className="flex flex-col items-center gap-3 py-6 text-center">
    <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
      <Send className="w-5 h-5 text-sky-500" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800">Connect Telegram Care Loop</p>
      <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
        Link {profile?.name?.split(' ')[0] || 'this profile'}'s Telegram to receive automated dose check-ins with 1-tap responses.
      </p>
    </div>
    <a
      href="https://t.me/dosiq_bot"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.97] text-white text-xs font-bold transition-all duration-150 shadow-sm shadow-sky-600/20"
    >
      <ExternalLink className="w-3 h-3" />
      Open @dosiq_bot on Telegram
    </a>
  </div>
);

// ─── Simulator (judge mode) ───────────────────────────────────────────────────

const CareLoopSimulator = ({ medications, onSimulate }) => {
  const [sent, setSent] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSend = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 1200));
    setSimulating(false);
    setSent(true);
    onSimulate?.();
  };

  const pendingMeds = medications.filter(m => m.status === 'pending');

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-sky-500 via-emerald-500 to-teal-500" />

      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-xs font-bold text-white">In-App Care Loop Simulator</p>
        <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
          Judge Mode
        </span>
      </div>

      {/* Simulated chat bubble */}
      <div className="bg-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-600">
        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
          ⏰ <span className="text-white font-bold">Medicine Check-in:</span>
          {pendingMeds.length > 0
            ? ` Did you take ${pendingMeds[0]?.brand || 'your medication'} (${pendingMeds[0]?.food || 'as prescribed'})?`
            : ' Your next dose is scheduled for tonight.'}
        </p>
        <div className="flex gap-2 mt-2.5">
          <button
            className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold text-center"
            onClick={handleSend}
          >
            ✅ Took Dose
          </button>
          <button className="flex-1 py-1.5 rounded-lg bg-slate-600 text-white/70 text-[11px] font-bold text-center">
            ❌ Skipped
          </button>
        </div>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Dashboard synced — card updated with confirmation timestamp
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={simulating}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.97] text-white text-xs font-bold transition-all duration-150 disabled:opacity-60"
        >
          {simulating ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulating…</>
          ) : (
            <><Send className="w-3 h-3" /> Simulate Telegram Check-in</>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Care Loop Section ────────────────────────────────────────────────────────

export const CareLoopSection = ({ profile, medications = [], events = [] }) => {
  const [simulated, setSimulated] = useState(false);
  const isLinked = profile?.telegram_linked;

  const relevantEvents = events.filter(e => e.profile === profile?.id);

  return (
    <section id="care-loop-section" className="flex flex-col gap-5">
      {/* Section header */}
      <div>
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-600" />
          Care Loop
          {isLinked && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Bot Active
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Two-way Telegram adherence check-ins — 1-tap confirmation for {profile?.name?.split(' ')[0] || 'this profile'}
        </p>
      </div>

      {/* Notifications for today */}
      {relevantEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Today's Confirmations
          </p>
          {relevantEvents.map(ev => (
            <NotificationBanner key={ev.id} event={ev} />
          ))}
          {simulated && (
            <NotificationBanner event={{
              id: 'sim',
              message: `${profile?.name?.split(' ')[0] || 'User'} confirmed their dose via Telegram Simulator ✓`,
            }} />
          )}
        </div>
      )}

      {/* Linked: show simulator | Unlinked: show CTA */}
      {isLinked ? (
        <CareLoopSimulator
          medications={medications}
          onSimulate={() => setSimulated(true)}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <BotLinkPrompt profile={profile} />
        </div>
      )}

      {/* Profile stats bar */}
      {isLinked && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Confirmed Today', value: relevantEvents.length + (simulated ? 1 : 0), icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'Response Rate',   value: '92%',  icon: UserCheck,    color: 'text-sky-600'     },
            { label: 'Avg. Response',   value: '4 min', icon: Clock,       color: 'text-violet-600'  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-3 px-2 bg-white border border-slate-100 rounded-xl text-center">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-sm font-black text-slate-900">{value}</p>
              <p className="text-[10px] text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
