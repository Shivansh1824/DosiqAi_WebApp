import React, { useRef } from 'react';
import { Activity, CheckCircle2, Flame, Clock } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const CareLoopKpiGrid = ({ dayStats, selectedDate }) => {
  const containerRef = useRef(null);

  // Staggered entrance animation when selectedDate or stats update
  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      '.kpi-card',
      { y: 14, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.38,
        stagger: 0.06,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    );
  }, { dependencies: [selectedDate, dayStats?.rate, dayStats?.totalScheduled], scope: containerRef });

  // GSAP micro-hover lift & scale
  const handleMouseEnter = (e) => {
    gsap.to(e.currentTarget, {
      y: -4,
      scale: 1.02,
      duration: 0.24,
      ease: 'power2.out',
      boxShadow: '0 16px 32px -8px rgba(15, 23, 42, 0.12)',
    });
    const icon = e.currentTarget.querySelector('.kpi-icon-wrap');
    if (icon) {
      gsap.to(icon, { scale: 1.15, rotation: 6, duration: 0.22, ease: 'back.out(2)' });
    }
  };

  const handleMouseLeave = (e) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.22,
      ease: 'power2.out',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    });
    const icon = e.currentTarget.querySelector('.kpi-icon-wrap');
    if (icon) {
      gsap.to(icon, { scale: 1, rotation: 0, duration: 0.22, ease: 'power2.out' });
    }
  };

  const rate = dayStats.rate;
  const isHigh = rate !== null && rate >= 80;
  const isPartial = rate !== null && rate > 0 && rate < 80;

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* ── 1. Date Adherence ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col gap-2 relative overflow-hidden cursor-default transition-colors duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Adherence</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {rate !== null ? `${rate}%` : '—'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isHigh
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : isPartial
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-slate-500 bg-slate-100 border-slate-200'
          }`}>
            {rate !== null ? (isHigh ? 'High' : 'Partial') : 'No Doses'}
          </span>
        </div>

        {/* Adherence Mini-Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHigh ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-slate-300'
            }`}
            style={{ width: `${rate !== null ? Math.max(rate, 4) : 0}%` }}
          />
        </div>

        <span className="text-[11px] text-slate-500 font-medium truncate">
          {dayStats.totalScheduled > 0
            ? `${dayStats.takenCount} of ${dayStats.totalScheduled} doses taken`
            : 'No scheduled doses on this date'}
        </span>
      </div>

      {/* ── 2. Doses Taken ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col gap-2 relative overflow-hidden cursor-default transition-colors duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-500 to-sky-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doses Taken</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {dayStats.takenCount}
          </span>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            Telegram
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-medium truncate mt-auto">
          {dayStats.takenCount > 0 ? 'Confirmed via 1-tap responses' : 'Awaiting check-in confirmation'}
        </span>
      </div>

      {/* ── 3. Active Streak ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col gap-2 relative overflow-hidden cursor-default transition-colors duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
            4 Days 🔥
          </span>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            On Track
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-medium truncate mt-auto">
          Zero missed doses across active course
        </span>
      </div>

      {/* ── 4. Response Latency ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="kpi-card bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex flex-col gap-2 relative overflow-hidden cursor-default transition-colors duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-600" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Response Latency</span>
          <div className="kpi-icon-wrap w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-black text-violet-600 tracking-tight">
            2s
          </span>
          <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
            Real-Time
          </span>
        </div>

        <span className="text-[11px] text-slate-500 font-medium truncate mt-auto">
          Average 1-tap inline button latency
        </span>
      </div>
    </div>
  );
};
