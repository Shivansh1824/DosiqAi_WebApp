import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, Zap, ExternalLink, Bell, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';

export const TelegramPrescriptionSync = ({ patientName = 'Patient', medicines = [], durationDays = 3 }) => {
  const [simulated, setSimulated] = useState(false);
  const [doseLogged, setDoseLogged] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Group medicines by timing slot
  const morningMeds = medicines.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[0] > 0) return true;
    if (m.timing?.total_times_per_day >= 2) return true;
    return false;
  });

  const afternoonMeds = medicines.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[1] > 0) return true;
    if (m.timing?.total_times_per_day >= 3) return true;
    return false;
  });

  const nightMeds = medicines.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[2] > 0) return true;
    if (m.timing?.total_times_per_day >= 1) return true;
    return false;
  });

  const handleSimulate = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 800));
    setSimulating(false);
    setSimulated(true);
  };

  const handleLogDose = (status) => {
    setDoseLogged(status);
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col gap-5">
      {/* Ambient background glows for distinct branding */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Connect Telegram Care Loop
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Automated Reminders
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sync {patientName}&apos;s {durationDays ? `${durationDays}-day` : 'prescribed'} regimen to Telegram for instant 1-tap dose tracking.
              </p>
            </div>
          </div>

          {/* Telegram Connect Button */}
          <a
            href="https://t.me/dosiq_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white text-xs font-black transition-all shadow-lg shadow-sky-500/30 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open @dosiq_bot on Telegram</span>
            <ExternalLink className="w-3 h-3 text-sky-200" />
          </a>
        </div>

        {/* Schedule Preview Grid (Dark Mode Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Morning Slot */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>☀️</span> Morning Slot
              </span>
              <span className="text-[11px] font-mono text-slate-400">08:00 AM</span>
            </div>
            <p className="text-xs font-black text-white">
              {morningMeds.length > 0 ? `${morningMeds.length} Medications` : 'No meds scheduled'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {morningMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None'}
              {morningMeds.length > 2 && ` +${morningMeds.length - 2} more`}
            </p>
          </div>

          {/* Afternoon Slot */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <span>🌤️</span> Afternoon Slot
              </span>
              <span className="text-[11px] font-mono text-slate-400">02:00 PM</span>
            </div>
            <p className="text-xs font-black text-white">
              {afternoonMeds.length > 0 ? `${afternoonMeds.length} Medications` : 'No meds scheduled'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {afternoonMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None'}
              {afternoonMeds.length > 2 && ` +${afternoonMeds.length - 2} more`}
            </p>
          </div>

          {/* Night Slot */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <span>🌙</span> Night Slot
              </span>
              <span className="text-[11px] font-mono text-slate-400">08:00 PM</span>
            </div>
            <p className="text-xs font-black text-white">
              {nightMeds.length > 0 ? `${nightMeds.length} Medications` : 'No meds scheduled'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {nightMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None'}
              {nightMeds.length > 2 && ` +${nightMeds.length - 2} more`}
            </p>
          </div>
        </div>

        {/* Live Simulator for Judge / Demonstration (Dark Mode) */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Care Loop Simulator</span>
            </div>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <Bell className="w-3 h-3 text-sky-400" />
              <span>{simulating ? 'Sending alert...' : 'Test Dose Reminder Notification'}</span>
            </button>
          </div>

          {/* Simulated Telegram Message Bubble */}
          {simulated && (
            <div className="bg-sky-950/70 border border-sky-500/30 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-sky-300">Dosiq Care Bot (@dosiq_bot)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Just now</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                ⏰ <strong>Medicine Reminder for {patientName}:</strong><br />
                It&apos;s time for the Morning dose ({morningMeds[0]?.exact_written_name || 'Prescription Medication'}).<br />
                <span className="text-slate-400 text-[11px]">
                  Take {morningMeds[0]?.strength || 'as prescribed'} {morningMeds[0]?.timing?.relation_to_meal ? `(${morningMeds[0].timing.relation_to_meal.replace('_', ' ')})` : 'after meals'}.
                </span>
              </p>

              {doseLogged ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Dose logged as &apos;{doseLogged}&apos;! Care loop updated and synced to family dashboard.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleLogDose('Taken')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    ✅ Took Dose
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogDose('Skipped')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                  >
                    ❌ Skipped
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
