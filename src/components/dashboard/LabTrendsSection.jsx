import React, { useState, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Activity, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-[11px] text-slate-400 font-medium mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300 font-medium">{p.name}:</span>
          <span className="text-white font-bold tabular-nums">{p.value} {p.payload?.unit || ''}</span>
        </div>
      ))}
    </div>
  );
};

// ─── AI Trend Insight ─────────────────────────────────────────────────────────

const getTrendInsight = (data) => {
  if (!data || data.length < 2) return null;
  const first = data[0];
  const last = data[data.length - 1];
  const delta = last.value - first.value;
  const abs = Math.abs(delta).toFixed(1);
  const isStable = Math.abs(delta) < 0.001;
  const dirText = delta < 0 ? 'decreased' : 'increased';
  const isGood = delta <= 0 && !last.is_abnormal;
  const isWorsening = last.is_abnormal && delta > 0;

  const text = isStable
    ? `Value has remained steady at ${last.value} ${last.unit || ''} across ${data.length} reports.`
    : `${last.unit ? `Value has ${dirText} by ${abs} ${last.unit}` : `${dirText} by ${abs}`} over ${data.length} readings.`;

  return {
    text,
    positive: isGood,
    worsening: isWorsening,
    stable: isStable,
  };
};

// ─── Lab Trends Section ───────────────────────────────────────────────────────

export const LabTrendsSection = ({ biomarkers = {}, documents = [] }) => {
  const containerRef = useRef(null);

  // Intelligently sort biomarkers:
  // 1. Tests with 2+ readings (actual comparative trends) come FIRST
  // 2. Tests with abnormal values come next
  // 3. Alphabetical order within each category
  const allTestNames = useMemo(() => {
    return Object.keys(biomarkers)
      .filter(k => biomarkers[k].data?.length > 0)
      .sort((a, b) => {
        const countA = biomarkers[a].data.length;
        const countB = biomarkers[b].data.length;
        if (countA >= 2 && countB < 2) return -1;
        if (countB >= 2 && countA < 2) return 1;
        if (countB !== countA) return countB - countA;

        const abA = biomarkers[a].data.some(d => d.is_abnormal) ? 1 : 0;
        const abB = biomarkers[b].data.some(d => d.is_abnormal) ? 1 : 0;
        if (abB !== abA) return abB - abA;

        return a.localeCompare(b);
      });
  }, [biomarkers]);

  const trendingTests = useMemo(() => allTestNames.filter(name => (biomarkers[name]?.data?.length || 0) >= 2), [allTestNames, biomarkers]);
  const abnormalTests = useMemo(() => allTestNames.filter(name => biomarkers[name]?.data?.some(d => d.is_abnormal)), [allTestNames, biomarkers]);

  // Filter mode: 'all' | 'trending' | 'abnormal'
  const [filterMode, setFilterMode] = useState(trendingTests.length > 0 ? 'trending' : 'all');

  const visibleTestNames = useMemo(() => {
    if (filterMode === 'trending' && trendingTests.length > 0) return trendingTests;
    if (filterMode === 'abnormal' && abnormalTests.length > 0) return abnormalTests;
    return allTestNames;
  }, [filterMode, trendingTests, abnormalTests, allTestNames]);

  const [activeTest, setActiveTest] = useState(visibleTestNames[0] || allTestNames[0] || null);

  // Sync active test when keys change (new doc uploaded or filter switched)
  React.useEffect(() => {
    if (visibleTestNames.length > 0 && !visibleTestNames.includes(activeTest)) {
      setActiveTest(visibleTestNames[0]);
    } else if (allTestNames.length > 0 && !allTestNames.includes(activeTest)) {
      setActiveTest(allTestNames[0]);
    }
  }, [visibleTestNames, allTestNames, activeTest]);

  const hasData = allTestNames.length > 0;
  const metric = activeTest ? biomarkers[activeTest] : null;
  const data = metric?.data || [];
  const unit = metric?.unit || '';
  const insight = getTrendInsight(data);

  const values = data.map(d => d.value).filter(v => !isNaN(v));
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const padding = (maxVal - minVal) * 0.25 || 5;

  const latestPoint = data[data.length - 1];
  const prevPoint = data[data.length - 2];
  const delta = prevPoint ? latestPoint?.value - prevPoint.value : null;
  const isImproving = delta !== null && !latestPoint?.is_abnormal && delta < 0;
  const isWorsening = delta !== null && latestPoint?.is_abnormal && delta > 0;

  // Count abnormal tests across all loaded reports
  const totalAbnormalGlobal = documents.reduce((acc, doc) => {
    return acc + (doc.ai_analysis_result?.report_data?.total_abnormalities || 0);
  }, 0);

  // GSAP animation for biomarker tab switch & charts
  useGSAP(() => {
    if (!hasData) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '.gsap-trend-badge',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, stagger: 0.05, ease: 'back.out(1.2)' }
      );
      gsap.fromTo(
        '.gsap-trend-chart-card',
        { opacity: 0.5, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-trend-insight',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', delay: 0.1 }
      );
    });
  }, { dependencies: [activeTest, hasData], scope: containerRef });

  return (
    <section ref={containerRef} id="lab-trends-section" className="flex flex-col gap-4">

      {/* Section Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-600" />
            Biomarker Trend Visualizer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {documents.length} report{documents.length !== 1 ? 's' : ''} loaded · {allTestNames.length} biomarkers tracked{trendingTests.length > 0 ? ` · ${trendingTests.length} tests with comparative trend lines` : ''}
          </p>
        </div>
        {totalAbnormalGlobal > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
            <AlertTriangle className="w-3 h-3" />
            {totalAbnormalGlobal} total abnormalities across reports
          </span>
        )}
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-14 gap-3 text-center px-6 shadow-sm">
          <Activity className="w-9 h-9 text-slate-200" />
          <p className="text-sm font-bold text-slate-600">No Lab Data Available</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Upload a blood test report (CBC, Lipid Profile, HbA1c, etc.) to auto-populate dynamic biomarker trend charts.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Quick Filter Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {trendingTests.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterMode === 'trending'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Comparing Trends ({trendingTests.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Biomarkers ({allTestNames.length})
            </button>

            {abnormalTests.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('abnormal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterMode === 'abnormal'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Abnormal ({abnormalTests.length})</span>
              </button>
            )}
          </div>

          {/* Biomarker selector tabs — scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {visibleTestNames.map(name => {
              const d = biomarkers[name]?.data || [];
              const last = d[d.length - 1];
              const isActive = activeTest === name;
              const hasTrend = d.length >= 2;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveTest(name)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {last?.is_abnormal && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                  <span className="truncate max-w-[130px]">{name}</span>
                  {hasTrend && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.length} pts
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Latest value & trend badge strip */}
          {latestPoint && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`gsap-trend-badge flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                latestPoint.is_abnormal
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {latestPoint.is_abnormal
                  ? <AlertTriangle className="w-3.5 h-3.5" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />
                }
                <span>Latest: {latestPoint.value} {unit}</span>
              </div>

              {delta !== null && (
                <div className={`gsap-trend-badge flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                  Math.abs(delta) < 0.001 ? 'bg-slate-100 border-slate-200 text-slate-700' :
                  isImproving ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  isWorsening ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {Math.abs(delta) < 0.001 ? <Minus className="w-3.5 h-3.5 text-slate-500" /> :
                   delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
                   <TrendingUp className="w-3.5 h-3.5" />}
                  <span>
                    {Math.abs(delta) < 0.001 ? `Stable (0.0 ${unit})` :
                     `${isImproving ? 'Improving' : isWorsening ? 'Worsening' : 'Changed'} (${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${unit})`}
                  </span>
                </div>
              )}

              {data.length >= 2 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{data.length} Readings Across Reports</span>
                </div>
              )}

              {data.length === 1 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium w-full mt-1">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {documents.length >= 2 ? (
                      <>
                        <strong>Single Report Reading:</strong> <em>{activeTest}</em> was only included in 1 of your {documents.length} uploaded reports ({latestPoint?.reportTitle || 'Report'}). Biomarkers with historical data (like Total Bilirubin, Albumin, etc.) show full trend comparison lines.
                      </>
                    ) : (
                      <>Upload a 2nd blood test report to unlock historical trend comparisons and direction indicators.</>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="gsap-trend-chart-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 15, right: 30, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    interval={0}
                    padding={{ left: 50, right: 50 }}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[Math.max(0, minVal - padding), maxVal + padding]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />

                  <Line
                    type="monotone"
                    dataKey="value"
                    name={activeTest}
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={({ cx, cy, payload }) => (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx} cy={cy} r={5}
                        fill={payload.is_abnormal ? '#ef4444' : '#8B5CF6'}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )}
                    activeDot={{ r: 7, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insight */}
          {insight && (
            <div className="gsap-trend-insight flex flex-col gap-2 p-4 rounded-2xl bg-violet-50/60 border border-violet-100">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-violet-500" />
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">AI Clinical Trend Insight</p>
              </div>
              <div className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${insight.worsening ? 'bg-rose-500' : insight.positive ? 'bg-emerald-500' : insight.stable ? 'bg-slate-400' : 'bg-amber-500'}`} />
                <p className="text-xs font-medium text-slate-700 leading-snug">
                  <span className="font-bold text-slate-900">{activeTest}: </span>
                  {insight.text}{' '}
                  <span className={`font-bold ${insight.worsening ? 'text-rose-600' : insight.positive ? 'text-emerald-600' : insight.stable ? 'text-slate-600' : 'text-amber-600'}`}>
                    {insight.worsening ? '— Trending upward while abnormal. Monitor closely and consult your doctor.' :
                     insight.positive ? '— Moving in the right direction. Keep it up! ✓' :
                     insight.stable ? '— Values are steady across both checkups.' :
                     '— Monitor closely.'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
