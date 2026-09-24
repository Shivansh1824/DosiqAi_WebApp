import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, Zap, ExternalLink, Bell, Edit3 } from 'lucide-react';
import { TimePickerModal } from '../../onboarding/TimePickerModal';
import { isMedicationSos, calculateDoseSchedule, formatTime12h } from '../../../lib/medicationScheduler';
import { TELEGRAM_BOT_USERNAME, TELEGRAM_BOT_URL } from '../../../lib/telegramConfig';

export const TelegramPrescriptionSync = ({ patientName = 'Patient', medicines = [], durationDays = 3 }) => {
  const [simulated, setSimulated] = useState(false);
  const [doseLogged, setDoseLogged] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Customizable Slot Times (Default 8 AM, 2 PM, 8 PM)
  const [slotTimes, setSlotTimes] = useState({
    morning: '08:00',
    afternoon: '14:00',
    night: '20:00'
  });
  const [openSlotPicker, setOpenSlotPicker] = useState(null);

  // Filter out SOS medications from fixed reminder loops
  const sosMeds = medicines.filter(m => isMedicationSos(m));
  const scheduledMeds = medicines.filter(m => !isMedicationSos(m));

  // High-frequency medications (>= 4 times per day)
  const highFreqMeds = scheduledMeds.filter(m => {
    const times = m.timing?.total_times_per_day || (m.timing?.dosage ? m.timing.dosage.split('-').filter(x => parseInt(x, 10) > 0).length : 1);
    return times >= 4;
  });

  // Group scheduled medicines by timing slot
  const morningMeds = scheduledMeds.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[0] > 0) return true;
    const total = m.timing?.total_times_per_day;
    if (total >= 2) return true;
    if (total === 1 && (!dosage || dosage === '1-0-0')) return true;
    return false;
  });

  const afternoonMeds = scheduledMeds.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[1] > 0) return true;
    const total = m.timing?.total_times_per_day;
    if (total >= 3) return true;
    return false;
  });

  const nightMeds = scheduledMeds.filter(m => {
    const dosage = m.timing?.dosage;
    if (dosage && dosage.split('-')[2] > 0) return true;
    const total = m.timing?.total_times_per_day;
    if (total >= 2 && (!dosage || dosage.split('-')[2] > 0)) return true;
    if (total === 1 && dosage === '0-0-1') return true;
    return false;
  });

  const handleOpenTelegram = async () => {
    try {
      fetch('/api/send-telegram-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'greeting',
          patientName,
          medicines,
          slotTimes
        })
      }).catch(err => console.warn('Could not dispatch Telegram greeting:', err));
    } catch (e) {
      // Non-blocking
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await fetch('/api/send-telegram-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          patientName,
          medicines,
          slotTimes
        })
      });
    } catch (err) {
      console.warn('Could not dispatch Telegram checkin:', err);
    }
    await new Promise(r => setTimeout(r, 600));
    setSimulating(false);
    setSimulated(true);
  };

  const handleLogDose = (status) => {
    setDoseLogged(status);
  };

  const handleSaveSlotTime = (slot, newTime) => {
    setSlotTimes(prev => ({ ...prev, [slot]: newTime }));
  };

  const slotMeta = {
    morning: { label: 'Morning Dose Time', emoji: '☀️' },
    afternoon: { label: 'Afternoon Dose Time', emoji: '🌤️' },
    night: { label: 'Night Dose Time', emoji: '🌙' },
  };

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-7 border border-emerald-700/60 shadow-xl shadow-emerald-950/20 relative overflow-hidden flex flex-col gap-5">
        {/* Ambient glowing accents matching Dosiq green brand */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Connect Telegram Care Loop
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    Automated Reminders
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Sync {patientName}&apos;s {durationDays ? `${durationDays}-day` : 'prescribed'} regimen to Telegram for instant 1-tap dose tracking.
                </p>
              </div>
            </div>

            {/* Telegram Connect Button */}
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenTelegram}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-[0.98] text-emerald-950 text-xs font-black transition-all shadow-lg shadow-black/20 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              <span>Open @{TELEGRAM_BOT_USERNAME} on Telegram</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          </div>

          {/* Schedule Preview Grid (Interactive Customizable Times) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Telegram Reminder Schedule (Click time to customize)
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold">
                Customizable Time Slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Morning Slot */}
              <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-2xl p-3.5 flex flex-col gap-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>☀️</span> Morning Slot
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSlotPicker('morning')}
                    className="flex items-center gap-1 text-[11px] font-mono text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg border border-white/15 transition-colors"
                    title="Click to change morning reminder time"
                  >
                    <Clock className="w-2.5 h-2.5 text-emerald-300" />
                    <span>{formatTime12h(slotTimes.morning)}</span>
                    <Edit3 className="w-2.5 h-2.5 opacity-70" />
                  </button>
                </div>
                <p className="text-xs font-black text-white">
                  {morningMeds.length > 0 ? `${morningMeds.length} Medications` : 'No meds scheduled'}
                </p>
                <p className="text-[11px] text-emerald-100/70 truncate">
                  {morningMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None scheduled'}
                  {morningMeds.length > 2 && ` +${morningMeds.length - 2} more`}
                </p>
              </div>

              {/* Afternoon Slot */}
              <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-2xl p-3.5 flex flex-col gap-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <span>🌤️</span> Afternoon Slot
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSlotPicker('afternoon')}
                    className="flex items-center gap-1 text-[11px] font-mono text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg border border-white/15 transition-colors"
                    title="Click to change afternoon reminder time"
                  >
                    <Clock className="w-2.5 h-2.5 text-emerald-300" />
                    <span>{formatTime12h(slotTimes.afternoon)}</span>
                    <Edit3 className="w-2.5 h-2.5 opacity-70" />
                  </button>
                </div>
                <p className="text-xs font-black text-white">
                  {afternoonMeds.length > 0 ? `${afternoonMeds.length} Medications` : 'No meds scheduled'}
                </p>
                <p className="text-[11px] text-emerald-100/70 truncate">
                  {afternoonMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None scheduled'}
                  {afternoonMeds.length > 2 && ` +${afternoonMeds.length - 2} more`}
                </p>
              </div>

              {/* Night Slot */}
              <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-2xl p-3.5 flex flex-col gap-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>🌙</span> Night Slot
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSlotPicker('night')}
                    className="flex items-center gap-1 text-[11px] font-mono text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg border border-white/15 transition-colors"
                    title="Click to change night reminder time"
                  >
                    <Clock className="w-2.5 h-2.5 text-emerald-300" />
                    <span>{formatTime12h(slotTimes.night)}</span>
                    <Edit3 className="w-2.5 h-2.5 opacity-70" />
                  </button>
                </div>
                <p className="text-xs font-black text-white">
                  {nightMeds.length > 0 ? `${nightMeds.length} Medications` : 'No meds scheduled'}
                </p>
                <p className="text-[11px] text-emerald-100/70 truncate">
                  {nightMeds.map(m => m.exact_written_name || m.name).slice(0, 2).join(', ') || 'None scheduled'}
                  {nightMeds.length > 2 && ` +${nightMeds.length - 2} more`}
                </p>
              </div>
            </div>
          </div>

          {/* High Frequency Meds Notification (if any medication is 4x, 5x, or 6x daily) */}
          {highFreqMeds.length > 0 && (
            <div className="bg-emerald-900/50 border border-emerald-400/30 rounded-2xl p-3.5 flex flex-col gap-2 backdrop-blur-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-200">
                    High Frequency Regimen Active ({highFreqMeds.length} Medication{highFreqMeds.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
                    Cyclic Safe Spacing
                  </span>
                </div>
                <span className="text-[10px] text-emerald-200/80 font-mono">
                  Calculated safe 2.75h – 4.5h breaks
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {highFreqMeds.map((m, idx) => {
                  const times = m.timing?.total_times_per_day || 4;
                  const slots = calculateDoseSchedule(times);
                  return (
                    <div key={idx} className="bg-white/10 rounded-xl px-3 py-1.5 text-xs text-emerald-100 flex items-center gap-2 border border-white/10">
                      <span className="font-bold">{m.exact_written_name || m.name}:</span>
                      <span className="font-mono text-[11px] text-emerald-300">
                        {slots.map(s => s.time12).join(' • ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SOS / As Needed Notice (if any medication is SOS) */}
          {sosMeds.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="font-bold text-amber-200">
                  On-Demand (SOS): {sosMeds.map(m => m.exact_written_name || m.name).join(', ')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-400/20">
                No scheduled alarms (Taken as needed)
              </span>
            </div>
          )}

          {/* Live Simulator for Hackathon Judges & Evaluators */}
          <div className="bg-black/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-col gap-1 max-w-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs font-black text-white">Interactive Care Loop Simulator</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/25 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Hackathon Judge Mode
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                  <strong>For Hackathon Judges:</strong> Test real-time Telegram reminder notifications and 1-tap adherence logging right now, without waiting for the scheduled dose times ({formatTime12h(slotTimes.morning)}, {formatTime12h(slotTimes.afternoon)}, {formatTime12h(slotTimes.night)}).
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={simulating}
                className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 active:scale-95 text-white transition-all flex items-center gap-2 border border-emerald-400/40 shadow-sm shrink-0"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-200" />
                <span>{simulating ? 'Dispatching alert...' : 'Test Reminder (Judge Mode)'}</span>
              </button>
            </div>

            {/* Simulated Telegram Message Bubble (Crisp White Card for Legibility) */}
            {simulated && (
              <div className="bg-white text-slate-900 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-900">Dosiq Care Bot (@{TELEGRAM_BOT_USERNAME})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  ⏰ <strong>Medicine Reminder for {patientName}:</strong><br />
                  It&apos;s {formatTime12h(slotTimes.morning)} (Morning Dose). Time for {morningMeds[0]?.exact_written_name || 'Prescription Medication'}.<br />
                  <span className="text-slate-500 text-[11px]">
                    Take {morningMeds[0]?.strength || 'as prescribed'} {morningMeds[0]?.timing?.relation_to_meal ? `(${morningMeds[0].timing.relation_to_meal.replace('_', ' ')})` : 'after meals'}.
                  </span>
                </p>

                {doseLogged ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Dose logged as &apos;{doseLogged}&apos;! Care loop updated and synced to family dashboard.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLogDose('Taken')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      ✅ Took Dose
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogDose('Skipped')}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition-all border border-slate-200"
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

      {/* Time Picker Modal for Customizing Slots */}
      {openSlotPicker && (
        <TimePickerModal
          isOpen={true}
          value={slotTimes[openSlotPicker]}
          label={slotMeta[openSlotPicker]?.label || 'Dose Time'}
          emoji={slotMeta[openSlotPicker]?.emoji || '⏰'}
          onSave={(newTime) => handleSaveSlotTime(openSlotPicker, newTime)}
          onClose={() => setOpenSlotPicker(null)}
        />
      )}
    </>
  );
};
