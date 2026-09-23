import React, { useRef } from 'react';
import { ArrowDown, ArrowUp, Check, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { parseBiomarkerRange } from '../../../lib/referenceRanges';

gsap.registerPlugin(useGSAP);

/**
 * BiomarkerRangeGauge
 * 
 * Visualizes a clinical metric along a continuous reference spectrum:
 * [ LOW ZONE ] ─── [ NORMAL TARGET ZONE (Min to Max) ] ─── [ HIGH ZONE ]
 * 
 * Includes GSAP animated needle positioning, boundary tags, and delta offsets.
 */
export const BiomarkerRangeGauge = ({
  metric,
  mode = 'full', // 'full' | 'compact'
  animate = true,
  className = '',
}) => {
  const containerRef = useRef(null);
  const pinRef = useRef(null);
  const trackRef = useRef(null);

  const model = parseBiomarkerRange(metric);

  useGSAP(() => {
    if (!animate || !pinRef.current || !model.hasValidRange) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 1. Entrance animation for the value pin needle
      gsap.fromTo(
        pinRef.current,
        { left: '0%', scale: 0.6, opacity: 0 },
        {
          left: `${model.pinPct}%`,
          scale: 1,
          opacity: 1,
          duration: 0.75,
          ease: 'power2.out',
          delay: 0.1,
        }
      );

      // 2. Track bar expansion
      if (trackRef.current) {
        gsap.fromTo(
          trackRef.current,
          { scaleX: 0.85, opacity: 0.4 },
          { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
      }
    });
  }, { dependencies: [model.pinPct, model.patientVal], scope: containerRef });

  if (!model.hasValidRange) {
    // Fallback for metrics without parseable range
    return (
      <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 ${className}`}>
        <div>
          <p className="text-xs font-black text-slate-800">{metric.test_name}</p>
          <p className="text-[11px] text-slate-500 font-medium">Reference: {model.rawRange || 'Clinical observation'}</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-slate-900">{model.patientVal} {model.unit}</span>
        </div>
      </div>
    );
  }

  // ─── Compact Mode (Used in list rows) ────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <div ref={containerRef} className={`flex flex-col gap-1.5 w-full ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
          <span className="truncate max-w-[120px]">Min: {model.min}</span>
          <span className="text-emerald-700 font-bold">Target: {model.optimalText}</span>
          <span className="truncate max-w-[120px]">Max: {model.max}</span>
        </div>

        {/* Graphical spectrum bar */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-100 overflow-visible my-1">
          {/* Optimal zone background */}
          <div
            className="absolute top-0 bottom-0 rounded-sm bg-emerald-500/25 border-x-2 border-emerald-500"
            style={{
              left: `${model.normalLeftPct}%`,
              width: `${model.normalWidthPct}%`,
            }}
          />

          {/* Animated pin dot */}
          <div
            ref={pinRef}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-transform"
            style={{ left: animate ? '0%' : `${model.pinPct}%` }}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                model.zone === 'normal' ? 'bg-emerald-500' : model.zone === 'low' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Full Mode (Used in Range Charts section) ───────────────────────────────
  const isNormal = model.zone === 'normal';
  const isLow = model.zone === 'low';
  const isHigh = model.zone === 'high';

  const badgeConfig = isNormal
    ? {
        label: 'Optimal / Within Range',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
        icon: ShieldCheck,
      }
    : isLow
    ? {
        label: 'Below Normal Limit',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        icon: ArrowDown,
      }
    : {
        label: 'Above Normal Limit',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-800',
        dot: 'bg-rose-500',
        icon: ArrowUp,
      };

  const BadgeIcon = badgeConfig.icon;

  return (
    <div
      ref={containerRef}
      className={`gsap-range-card bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between gap-5 transition-all hover:shadow-md ${className}`}
    >
      {/* ── Card Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {metric.category_name || 'Biomarker'}
            </span>
            {model.isStandardFallback && (
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100" title="Clinical standard laboratory benchmark applied">
                Clinical Standard
              </span>
            )}
          </div>
          <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
            {metric.test_name}
          </h4>
          {metric.method && (
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Method: {metric.method}</p>
          )}
        </div>

        {/* Current Patient Value Badge */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={`text-2xl font-black tabular-nums tracking-tight ${
                isNormal ? 'text-emerald-700' : isLow ? 'text-amber-600' : 'text-rose-600'
              }`}
            >
              {model.patientVal}
            </span>
            <span className="text-xs font-bold text-slate-500">{model.unit}</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-black mt-1 ${badgeConfig.bg} ${badgeConfig.border} ${badgeConfig.text}`}>
            <BadgeIcon className="w-3 h-3 shrink-0" />
            <span>{badgeConfig.label}</span>
          </div>
        </div>
      </div>

      {/* ── Graphical Range Gauge Spectrum ── */}
      <div className="flex flex-col gap-2 pt-2">
        {/* Min / Max & Target Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-black text-slate-400">Lower Bound:</span>
            <span className="text-slate-700 font-black tabular-nums">{model.min} {model.unit}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider">Optimal Range:</span>
            <span className="font-black tabular-nums">{model.optimalText} {model.unit}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-black text-slate-400">Upper Bound:</span>
            <span className="text-slate-700 font-black tabular-nums">{model.max} {model.unit}</span>
          </div>
        </div>

        {/* Track Bar with Zones & Pin */}
        <div className="relative pt-6 pb-2 px-1">
          {/* Continuum Track */}
          <div
            ref={trackRef}
            className="relative w-full h-3.5 rounded-full bg-slate-100 overflow-hidden shadow-inner flex"
          >
            {/* Low Zone (Left of Normal) */}
            <div
              className="h-full bg-gradient-to-r from-amber-200/80 to-amber-100"
              style={{ width: `${model.normalLeftPct}%` }}
              title={`Low Zone (< ${model.min})`}
            />

            {/* Optimal / Normal Target Zone */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-sm relative"
              style={{ width: `${model.normalWidthPct}%` }}
              title={`Normal Zone (${model.min} - ${model.max})`}
            >
              <div className="absolute inset-0 bg-white/10" />
            </div>

            {/* High Zone (Right of Normal) */}
            <div
              className="h-full bg-gradient-to-r from-rose-200 to-rose-300"
              style={{ width: `${Math.max(0, 100 - (model.normalLeftPct + model.normalWidthPct))}%` }}
              title={`High Zone (> ${model.max})`}
            />
          </div>

          {/* Normal Zone Boundary Markers */}
          <div
            className="absolute top-6 bottom-2 w-0.5 bg-emerald-700/80 z-10 pointer-events-none"
            style={{ left: `calc(${model.normalLeftPct}% + 4px)` }}
          />
          <div
            className="absolute top-6 bottom-2 w-0.5 bg-emerald-700/80 z-10 pointer-events-none"
            style={{ left: `calc(${model.normalLeftPct + model.normalWidthPct}% + 4px)` }}
          />

          {/* Animated Patient Value Needle Pin */}
          <div
            ref={pinRef}
            className="absolute top-0 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
            style={{ left: animate ? '0%' : `${model.pinPct}%` }}
          >
            {/* Top Value Pill */}
            <div
              className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white shadow-md flex items-center gap-1 mb-0.5 whitespace-nowrap ${
                isNormal
                  ? 'bg-emerald-600'
                  : isLow
                  ? 'bg-amber-600 ring-2 ring-amber-300'
                  : 'bg-rose-600 ring-2 ring-rose-300'
              }`}
            >
              <span>{model.patientVal}</span>
            </div>

            {/* Downward indicator triangle */}
            <div
              className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
                isNormal ? 'border-t-emerald-600' : isLow ? 'border-t-amber-600' : 'border-t-rose-600'
              }`}
            />

            {/* Marker Dot on the Track */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg mt-0.5 ${
                isNormal
                  ? 'bg-emerald-500'
                  : isLow
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
          </div>
        </div>

        {/* Lower Scale Ticks */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 mt-0.5">
          <span>{model.scaleMin.toFixed(model.scaleMin < 1 ? 2 : 0)}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Low
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal Range
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> High
            </span>
          </div>
          <span>{model.scaleMax.toFixed(model.scaleMax < 1 ? 2 : 0)}</span>
        </div>
      </div>

      {/* ── Card Footer: Clinical Insight & Delta ── */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            {model.description || `Measured: ${model.patientVal} ${model.unit} (Standard reference ${model.optimalText}).`}
          </span>
        </div>

        <div className="shrink-0">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
              isNormal
                ? 'bg-emerald-50 text-emerald-800'
                : isLow
                ? 'bg-amber-50 text-amber-800'
                : 'bg-rose-50 text-rose-800'
            }`}
          >
            {model.deltaLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
