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
  const dirText = delta < 0 ? 'decreased' : 'increased';
  const abs = Math.abs(delta).toFixed(1);
  const isGood = delta <= 0 && !last.is_abnormal;
  const isWorsening = last.is_abnormal && delta > 0;

  return {
    text: `${last.unit ? `Value has ${dirText} by ${abs} ${last.unit}` : `${dirText} by ${abs}`} over ${data.length} readings.`,
    positive: isGood,
    worsening: isWorsening,
  };
};

// ─── Lab Trends Section ───────────────────────────────────────────────────────

export const LabTrendsSection = ({ biomarkers = {}, documents = [] }) => {
  const containerRef = useRef(null);
  const testNames = useMemo(() => Object.keys(biomarkers).filter(k => biomarkers[k].data?.length > 0), [biomarkers]);
  const [activeTest, setActiveTest] = useState(testNames[0] || null);

  // Sync active test when keys change (new doc uploaded)
  React.useEffect(() => {
    if (testNames.length > 0 && !testNames.includes(activeTest)) {
      setActiveTest(testNames[0]);
    }
  }, [testNames, activeTest]);

  const hasData = testNames.length > 0;
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
            {documents.length} report{documents.length !== 1 ? 's' : ''} loaded · {testNames.length} biomarkers tracked · Dynamic trend comparison
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
          {/* Biomarker selector tabs — scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {testNames.map(name => {
              const d = biomarkers[name]?.data || [];
              const last = d[d.length - 1];
              const isActive = activeTest === name;
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
                  <span className="truncate max-w-[120px]">{name}</span>
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

              {delta !== null && delta !== 0 && (
                <div className={`gsap-trend-badge flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                  isImproving ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  isWorsening ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  <span>
                    {isImproving ? 'Improving' : isWorsening ? 'Worsening' : 'Stable'} ({delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit})
                  </span>
                </div>
              )}

              {data.length === 1 && (
                <span className="text-[10px] text-slate-400 font-medium px-2">
                  Upload another report to see trend direction
                </span>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="gsap-trend-chart-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
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
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${insight.worsening ? 'bg-rose-500' : insight.positive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-xs font-medium text-slate-700 leading-snug">
                  <span className="font-bold text-slate-900">{activeTest}: </span>
                  {insight.text}{' '}
                  <span className={`font-bold ${insight.worsening ? 'text-rose-600' : insight.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {insight.worsening ? '— Trending upward while abnormal. Monitor closely and consult your doctor.' :
                     insight.positive ? '— Moving in the right direction. Keep it up! ✓' :
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
