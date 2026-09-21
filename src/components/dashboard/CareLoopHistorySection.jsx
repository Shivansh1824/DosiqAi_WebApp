import React, { useState, useMemo, useRef } from 'react';
import {
  Send, CheckCircle2, Clock, AlertTriangle, Calendar,
  Zap, ExternalLink, Flame, RefreshCw, HelpCircle
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TELEGRAM_BOT_USERNAME, TELEGRAM_BOT_URL } from '../../lib/telegramConfig';
import { CareLoopKpiGrid } from './CareLoopKpiGrid';

gsap.registerPlugin(useGSAP);

// Helper: Format date string to display format
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper: Check if slot time has passed today
const hasSlotPassed = (slotTime24) => {
  const now = new Date();
  const [hh, mm] = (slotTime24 || '20:00').split(':').map(Number);
  const slotDate = new Date();
  slotDate.setHours(hh, mm, 0, 0);
  return now > slotDate;
};

export const CareLoopHistorySection = ({
  profiles = [],
  activeProfile = null,
  medications = [],
  events = [],
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchToast, setDispatchToast] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'confirmed' | 'skipped'
  const [showAllHistory, setShowAllHistory] = useState(false);

  const mainContainerRef = useRef(null);
  const activeName = activeProfile?.name || 'Shivansh';

  // 7-day strip around today
  const dayStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = i === 6;
      return { dateStr, dayLabel, dayNum, isToday };
    });
  }, []);

  // ─── Dynamic Schedule & Adherence Computation for selectedDate ───────────────
  const {
    scheduledSlots,
    notScheduledList,
    sosMedications,
    dayStats,
    dayEvents,
  } = useMemo(() => {
    const isToday = selectedDate === todayStr;
    const isPast = selectedDate < todayStr;

    const morningMeds = [];
    const afternoonMeds = [];
    const nightMeds = [];
    const notScheduled = [];
    const sosMeds = [];

    const currentDayEvents = events.filter(e => e.date === selectedDate);

    medications.forEach(med => {
      const startDate = med.start_date || '2026-09-21';
      const durationDays = parseInt(med.duration_days, 10) || 60;
      const intervalDays = med.interval_days !== undefined ? Number(med.interval_days) : 1;
      
      const startD = new Date(startDate + 'T00:00:00');
      const endD = new Date(startD);
      endD.setDate(endD.getDate() + durationDays);
      const endDate = endD.toISOString().split('T')[0];

      const isSos = intervalDays === 0 || 
                    String(med.dosage_instruction || '').toLowerCase().includes('sos') ||
                    String(med.slot || '').toLowerCase().includes('sos');

      if (isSos) {
        sosMeds.push({
          ...med,
          reason: 'On-Demand (SOS) — Take only as needed for acute symptoms (Not a fixed daily schedule)'
        });
        return;
      }

      if (selectedDate < startDate) {
        notScheduled.push({
          ...med,
          statusType: 'not_started',
          reason: `Course begins on ${formatDisplayDate(startDate)} (${durationDays} days duration)`
        });
        return;
      }

      if (selectedDate > endDate) {
        notScheduled.push({
          ...med,
          statusType: 'completed',
          reason: `Course completed on ${formatDisplayDate(endDate)}`
        });
        return;
      }

      if (intervalDays > 1) {
        const diffDays = Math.round((new Date(selectedDate + 'T00:00:00') - startD) / (1000 * 60 * 60 * 24));
        const isDue = diffDays >= 0 && diffDays % intervalDays === 0;
        if (!isDue) {
          const nextDueDays = intervalDays - (diffDays % intervalDays);
          const nextDueD = new Date(selectedDate + 'T00:00:00');
          nextDueD.setDate(nextDueD.getDate() + nextDueDays);
          notScheduled.push({
            ...med,
            statusType: 'interval_not_due',
            reason: `Fortnightly dose (every ${intervalDays} days). Next scheduled dose: ${formatDisplayDate(nextDueD.toISOString().split('T')[0])}`
          });
          return;
        }
      }

      // Adherence resolution
      const medNameLower = med.name.toLowerCase();
      const ev = currentDayEvents.find(e => 
        (e.medication && e.medication.toLowerCase().includes(medNameLower)) ||
        medNameLower.includes(e.medication?.toLowerCase())
      );

      let doseStatus = 'scheduled';
      let statusBadge = 'Scheduled 📅';
      let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      let statusDetail = 'Scheduled';

      if (ev) {
        if (ev.status === 'confirmed' || ev.status === 'taken') {
          doseStatus = 'taken';
          statusBadge = 'Taken ✓';
          badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          statusDetail = `Confirmed via Telegram (${ev.time})`;
        } else if (ev.status === 'skipped') {
          doseStatus = 'skipped';
          statusBadge = 'Skipped ⚠️';
          badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
          statusDetail = `Marked as Skipped on Telegram (${ev.time})`;
        }
      } else {
        if (isToday) {
          const passed = hasSlotPassed(med.reminder_times?.[0] || '20:00');
          if (passed) {
            doseStatus = 'pending';
            statusBadge = 'Awaiting Check-in ⏳';
            badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
            statusDetail = 'Slot time passed · Telegram check-in pending';
          } else {
            doseStatus = 'upcoming';
            statusBadge = 'Upcoming ⏰';
            badgeStyle = 'bg-sky-50 text-sky-800 border-sky-200';
            statusDetail = `Scheduled for ${med.time || '08:00 PM'}`;
          }
        } else if (isPast) {
          doseStatus = 'missed';
          statusBadge = 'Not Logged / Missed ✕';
          badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
          statusDetail = 'No Telegram check-in recorded for this date';
        } else {
          doseStatus = 'future';
          statusBadge = 'Scheduled 📅';
          badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
          statusDetail = `Scheduled for ${med.time || '08:00 PM'}`;
        }
      }

      const scheduledItem = {
        ...med,
        doseStatus,
        statusBadge,
        badgeStyle,
        statusDetail,
        event: ev || null,
      };

      const timingStr = String(med.timing_dosage || med.slot || '').toLowerCase();
      const isMorning = timingStr.startsWith('1') || timingStr.includes('morning') || timingStr.includes('08:00');
      const isAfternoon = timingStr.includes('-1-') || timingStr.includes('afternoon') || timingStr.includes('14:00');
      const isNight = timingStr.endsWith('1') || timingStr.includes('night') || timingStr.includes('dinner') || timingStr.includes('20:00');

      if (isMorning) morningMeds.push(scheduledItem);
      if (isAfternoon) afternoonMeds.push(scheduledItem);
      if (isNight || (!isMorning && !isAfternoon)) nightMeds.push(scheduledItem);
    });

    const totalScheduled = morningMeds.length + afternoonMeds.length + nightMeds.length;
    const allScheduledMeds = [...morningMeds, ...afternoonMeds, ...nightMeds];
    const takenCount = allScheduledMeds.filter(m => m.doseStatus === 'taken').length;
    const skippedCount = allScheduledMeds.filter(m => m.doseStatus === 'skipped').length;
    const rate = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : null;

    return {
      scheduledSlots: {
        morning: morningMeds,
        afternoon: afternoonMeds,
        night: nightMeds,
      },
      notScheduledList: notScheduled,
      sosMedications: sosMeds,
      dayStats: {
        totalScheduled,
        takenCount,
        skippedCount,
        rate,
      },
      dayEvents: currentDayEvents,
    };
  }, [selectedDate, medications, events, todayStr]);

  // ─── GSAP Animations ────────────────────────────────────────────────────────
  useGSAP(() => {
    if (!mainContainerRef.current) return;

    // Staggered entrance for dose slot cards
    gsap.fromTo(
      '.slot-col-card',
      { y: 16, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power2.out',
        overwrite: 'auto',
      }
    );
  }, { dependencies: [selectedDate], scope: mainContainerRef });

  // GSAP Button / Card Hover Helpers
  const onDayHover = (e) => {
    gsap.to(e.currentTarget, { y: -3, scale: 1.05, duration: 0.2, ease: 'power2.out' });
  };
  const onDayLeave = (e) => {
    gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.2, ease: 'power2.out' });
  };

  const onSlotCardHover = (e) => {
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.01,
      duration: 0.22,
      ease: 'power2.out',
      boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
    });
  };
  const onSlotCardLeave = (e) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.22,
      ease: 'power2.out',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    });
  };

  // Dispatch Live Test Check-in to Telegram
  const handleDispatchTelegram = async () => {
    setIsDispatching(true);
    setDispatchToast(null);
    try {
      const res = await fetch('/api/send-telegram-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          patientName: activeName,
          medicines: [
            { name: 'Zyloric 200mg', strength: '200mg', food: 'After Food' },
            { name: 'Rosovas 20mg', strength: '200mg', food: 'After Food' }
          ],
          slotTimes: { night: '08:00' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchToast({ type: 'success', text: 'Check-in dispatched to Telegram! Check your phone 📱' });
      } else {
        setDispatchToast({ type: 'error', text: data.error || 'Failed to dispatch alert' });
      }
    } catch (err) {
      setDispatchToast({ type: 'error', text: 'Error connecting to Telegram API' });
    } finally {
      setIsDispatching(false);
      setTimeout(() => setDispatchToast(null), 5000);
    }
  };

  // Filtered audit list
  const displayEvents = showAllHistory ? events : dayEvents;
  const filteredEvents = displayEvents.filter(e => {
    if (filterType === 'confirmed') return e.status === 'confirmed' || e.status === 'taken';
    if (filterType === 'skipped') return e.status === 'skipped';
    return true;
  });

  return (
    <div ref={mainContainerRef} className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20 animate-in fade-in duration-300">
      {/* ── 1. Top Header ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              Two-Way Telegram Care Loop
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Synced (@{TELEGRAM_BOT_USERNAME})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Care Loop Schedule &amp; History
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium max-w-2xl">
            Real-time adherence telemetry, date-specific scheduled doses, and 1-tap Telegram check-in history for{' '}
            <span className="text-slate-800 font-bold">{activeName}</span>.
          </p>
        </div>

        {/* Live Test Trigger */}
        <div className="relative z-10 flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            disabled={isDispatching}
            onClick={handleDispatchTelegram}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60"
          >
            {isDispatching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300" />
            )}
            <span>{isDispatching ? 'Sending Alert...' : 'Dispatch Test Check-in'}</span>
          </button>

          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>Open Bot</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Toast Alert */}
      {dispatchToast && (
        <div
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            dispatchToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {dispatchToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{dispatchToast.text}</span>
        </div>
      )}

      {/* ── 2. Improvised GSAP KPI Grid ── */}
      <CareLoopKpiGrid dayStats={dayStats} selectedDate={selectedDate} />

      {/* ── 3. Date-Wise Schedule & Adherence Timeline ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-6">
        {/* Date Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Date-Wise Medication Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any date to inspect scheduled slots, adherence records, and unprescribed medications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* 7-Day Quick Strip with GSAP Hover */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {dayStrip.map(({ dateStr, dayLabel, dayNum, isToday }) => {
            const isSelected = selectedDate === dateStr;
            const hasEventOnDate = events.some(e => e.date === dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onMouseEnter={onDayHover}
                onMouseLeave={onDayLeave}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-colors duration-150 relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {dayLabel}
                </span>
                <span className="text-base sm:text-lg font-black mt-0.5">{dayNum}</span>
                {isToday ? (
                  <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    Today
                  </span>
                ) : hasEventOnDate ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Selected Day Slots Breakdown */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Doses for {formatDisplayDate(selectedDate)}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {dayStats.totalScheduled} Prescribed Dose{dayStats.totalScheduled === 1 ? '' : 's'}
            </span>
          </div>

          {/* Empty state when no doses scheduled */}
          {dayStats.totalScheduled === 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-bold text-slate-700">
                No medications were scheduled for {formatDisplayDate(selectedDate)}.
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                {selectedDate < (medications[0]?.start_date || '2026-09-21')
                  ? `The active prescription regimen begins on ${formatDisplayDate(medications[0]?.start_date || '2026-09-21')}.`
                  : 'There are no active doses scheduled on this day.'}
              </p>
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Jump to Today ({formatDisplayDate(todayStr)})
                </button>
              )}
            </div>
          )}

          {/* 3 Slot Columns */}
          {dayStats.totalScheduled > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Morning Slot */}
              <div className="slot-col-card bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">☀️</span>
                    <span className="text-xs font-black text-slate-800">Morning Slot</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">08:00 AM</span>
                </div>
                {scheduledSlots.morning.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">No medications scheduled for morning</p>
                ) : (
                  scheduledSlots.morning.map(med => (
                    <div
                      key={med.id}
                      onMouseEnter={onSlotCardHover}
                      onMouseLeave={onSlotCardLeave}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col gap-1.5 transition-colors cursor-default"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{med.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${med.badgeStyle}`}>
                          {med.statusBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{med.dosage_instruction || `${med.strength || ''} · ${med.food}`}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{med.statusDetail}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Afternoon Slot */}
              <div className="slot-col-card bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌤️</span>
                    <span className="text-xs font-black text-slate-800">Afternoon Slot</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">02:00 PM</span>
                </div>
                {scheduledSlots.afternoon.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">No medications scheduled for afternoon</p>
                ) : (
                  scheduledSlots.afternoon.map(med => (
                    <div
                      key={med.id}
                      onMouseEnter={onSlotCardHover}
                      onMouseLeave={onSlotCardLeave}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col gap-1.5 transition-colors cursor-default"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{med.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${med.badgeStyle}`}>
                          {med.statusBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{med.dosage_instruction || `${med.strength || ''} · ${med.food}`}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{med.statusDetail}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Night Slot */}
              <div className="slot-col-card bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/70 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌙</span>
                    <span className="text-xs font-black text-emerald-950">Night Slot</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800">08:00 PM</span>
                </div>
                {scheduledSlots.night.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">No medications scheduled for night</p>
                ) : (
                  scheduledSlots.night.map(med => (
                    <div
                      key={med.id}
                      onMouseEnter={onSlotCardHover}
                      onMouseLeave={onSlotCardLeave}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col gap-1.5 transition-colors cursor-default"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{med.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${med.badgeStyle}`}>
                          {med.statusBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{med.dosage_instruction || `${med.strength || ''} · ${med.food}`}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                        {med.doseStatus === 'taken' && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        {med.doseStatus === 'skipped' && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                        <span className={med.doseStatus === 'taken' ? 'text-emerald-700' : med.doseStatus === 'skipped' ? 'text-rose-600' : 'text-slate-400'}>
                          {med.statusDetail}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── 4. What Was NOT Scheduled for this Date ── */}
          {(notScheduledList.length > 0 || sosMedications.length > 0) && (
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Medicines Not Scheduled for this Date ({formatDisplayDate(selectedDate)})
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notScheduledList.map(med => (
                  <div key={med.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{med.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {med.statusType === 'not_started' ? 'Not Started Yet' : med.statusType === 'completed' ? 'Course Completed' : 'Cycle Not Due'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{med.reason}</p>
                  </div>
                ))}

                {sosMedications.map(med => (
                  <div key={med.id} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold text-xs">⚡ On-Demand (SOS):</span>
                        <span className="text-xs font-black text-slate-900">{med.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                        As Needed Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{med.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Chronological Care Loop Audit Trail ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Telegram Adherence &amp; Confirmation History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {showAllHistory
                ? 'Showing complete all-time ledger of dose dispatches and 1-tap Telegram responses.'
                : `Showing check-in activity for ${formatDisplayDate(selectedDate)}.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {showAllHistory ? `Filter to ${selectedDate}` : 'View All Dates'}
            </button>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({displayEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('confirmed')}
                className={`px-3 py-1 rounded-lg transition-all ${filterType === 'confirmed' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Taken ({displayEvents.filter(e => e.status === 'confirmed' || e.status === 'taken').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('skipped')}
                className={`px-3 py-1 rounded-lg transition-all ${filterType === 'skipped' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Skipped ({displayEvents.filter(e => e.status === 'skipped').length})
              </button>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center gap-2">
            <Clock className="w-7 h-7 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">
              No Telegram check-in events recorded for {formatDisplayDate(selectedDate)}.
            </p>
            <p className="text-[11px] text-slate-400">
              {events.length > 0
                ? `You have ${events.length} event(s) recorded on other dates. Click "View All Dates" above to see the complete history.`
                : 'Click "Dispatch Test Check-in" above to trigger a live check-in on Telegram.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEvents.map((ev) => {
              const isTaken = ev.status === 'confirmed' || ev.status === 'taken';

              return (
                <div
                  key={ev.id}
                  onMouseEnter={onSlotCardHover}
                  onMouseLeave={onSlotCardLeave}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isTaken ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900">{ev.medication}</span>
                        <span className="text-xs text-slate-400 font-medium">({ev.dosage})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isTaken
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isTaken ? 'Confirmed Taken' : 'Marked Skipped'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {ev.notes || 'Verified through Telegram Care Loop'} · {ev.slot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block font-mono">{ev.time}</span>
                      <span className="text-[10px] text-slate-400 block">{ev.date}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                      Telegram ({ev.latency || '2s'})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
