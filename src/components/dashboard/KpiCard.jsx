import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * Compact, modern KPI Card for high-density overview dashboards.
 */
export const KpiCard = ({ label, value, sub, icon: Icon, colorClass, bgClass, className = '' }) => {
  const valueRef = useRef(null);

  useGSAP(() => {
    // Only animate if value is a pure number or can be parsed as a number easily (and is not a mixed string like '2/3' or 'Active')
    if (valueRef.current && typeof value === 'number') {
      gsap.from(valueRef.current, {
        innerHTML: 0,
        duration: 1.5,
        ease: 'power3.out',
        snap: { innerHTML: 1 },
      });
    }
  }, [value]);

  return (
    <div className={`kpi-card bg-white rounded-2xl px-3 py-2.5 sm:px-3 sm:py-2.5 border border-slate-100/90 shadow-xs flex items-center gap-2.5 hover:shadow-sm hover:border-slate-200 transition-all duration-150 min-w-0 group ${className}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bgClass} group-hover:scale-105 transition-transform duration-150`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p ref={valueRef} className="text-base sm:text-lg font-black text-slate-900 leading-none tabular-nums truncate">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 leading-tight truncate">{label}</p>
        {sub && <p className="text-[9.5px] text-slate-400 font-medium mt-0.5 leading-tight truncate">{sub}</p>}
      </div>
    </div>
  );
};
