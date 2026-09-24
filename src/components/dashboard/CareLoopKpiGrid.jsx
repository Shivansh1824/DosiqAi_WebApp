import React, { useRef } from 'react';
import { Activity, CheckCircle2, Flame, Clock } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const CareLoopKpiGrid = ({ dayStats, selectedDate, isLinked = true }) => {
  const containerRef = useRef(null);

  // Staggered entrance animation when selectedDate or stats update
  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      '.kpi-card',
      { y: 12, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.32,
        stagger: 0.05,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    );
  }, { dependencies: [selectedDate, dayStats?.rate, dayStats?.totalScheduled, isLinked], scope: containerRef });

  // GSAP micro-hover lift & scale
  const handleMouseEnter = (e) => {
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.015,
      duration: 0.2,
      ease: 'power2.out',
      boxShadow: '0 10px 24px -6px rgba(15, 23, 42, 0.08)',
    });
    const icon = e.currentTarget.querySelector('.kpi-icon-wrap');
    if (icon) {
      gsap.to(icon, { scale: 1.12, rotation: 4, duration: 0.2, ease: 'back.out(2)' });
    }
  };

  const handleMouseLeave = (e) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    });
    const icon = e.currentTarget.querySelector('.kpi-icon-wrap');
    if (icon) {
      gsap.to(icon, { scale: 1, rotation: 0, duration: 0.2, ease: 'power2.out' });
    }
  };

  const rate = dayStats.rate;
  const isHigh = rate !== null && rate >= 80;
  const isPartial = rate !== null && rate > 0 && rate < 80;

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* ── 1. Date Adherence ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 min-h-[96px] border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-default transition-all duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Adherence</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1.5 my-0.5">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {!isLinked ? '—' : rate !== null ? `${rate}%` : '—'}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            !isLinked
              ? 'text-slate-500 bg-slate-100 border-slate-200'
              : isHigh
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : isPartial
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-slate-500 bg-slate-100 border-slate-200'
          }`}>
            {!isLinked ? 'Setup Req.' : rate !== null ? (isHigh ? 'High' : 'Partial') : 'No Doses'}
          </span>
        </div>

        {/* Adherence Mini-Bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden my-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              !isLinked ? 'bg-slate-200' : isHigh ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-slate-300'
            }`}
            style={{ width: `${isLinked && rate !== null ? Math.max(rate, 4) : 0}%` }}
          />
        </div>

        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
          {!isLinked
            ? 'Connect Telegram bot to track'
            : dayStats.totalScheduled > 0
            ? `${dayStats.takenCount} of ${dayStats.totalScheduled} doses taken`
            : 'No scheduled doses on this date'}
        </span>
      </div>

      {/* ── 2. Doses Taken ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 min-h-[96px] border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-default transition-all duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-500 to-sky-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doses Taken</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1.5 my-0.5">
          <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
            {!isLinked ? '0' : dayStats.takenCount}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            !isLinked
              ? 'text-slate-500 bg-slate-100 border-slate-200'
              : 'text-sky-700 bg-sky-50 border-sky-200'
          }`}>
            {!isLinked ? 'Not Synced' : 'Telegram'}
          </span>
        </div>

        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-auto">
          {!isLinked
            ? 'Awaiting check-in connection'
            : dayStats.takenCount > 0
            ? 'Confirmed via 1-tap responses'
            : 'Awaiting check-in confirmation'}
        </span>
      </div>

      {/* ── 3. Active Streak ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 min-h-[96px] border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-default transition-all duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1.5 my-0.5">
          <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
            {!isLinked ? '0 Days' : '4 Days 🔥'}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            !isLinked
              ? 'text-slate-500 bg-slate-100 border-slate-200'
              : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            {!isLinked ? 'Inactive' : 'On Track'}
          </span>
        </div>

        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-auto">
          {!isLinked ? 'Begins on first confirmed dose' : 'Zero missed doses across active course'}
        </span>
      </div>

      {/* ── 4. Response Latency ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 min-h-[96px] border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-default transition-all duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Response Latency</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-1.5 my-0.5">
          <span className="text-xl sm:text-2xl font-black text-violet-600 tracking-tight">
            {!isLinked ? '—' : '2s'}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            !isLinked
              ? 'text-slate-500 bg-slate-100 border-slate-200'
              : 'text-violet-700 bg-violet-50 border-violet-200'
          }`}>
            {!isLinked ? 'Offline' : 'Real-Time'}
          </span>
        </div>

        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-auto">
          {!isLinked ? 'Telemetry active upon sync' : 'Average 1-tap inline button latency'}
        </span>
      </div>
    </div>
  );
};
