import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';

// ─── Metric definitions ───────────────────────────────────────────────────────

const METRICS = {
  bloodSugar: {
    label: 'Blood Sugar',
    unit: 'mg/dL',
    keys: [
      { key: 'fasting',       name: 'Fasting',      color: '#10B981' },
      { key: 'postprandial',  name: 'Post-Prandial', color: '#06B6D4' },
    ],
    normalMin: 70, normalMax: 100,
    borderlineMax: 126,
    referenceLines: [
      { y: 70,  label: 'Low',    stroke: '#f59e0b', strokeDash: '4 4' },
      { y: 100, label: 'Normal', stroke: '#10b981', strokeDash: '4 4' },
      { y: 126, label: 'Pre-diabetic', stroke: '#f97316', strokeDash: '4 4' },
    ],
  },
  hba1c: {
    label: 'HbA1c',
    unit: '%',
    keys: [
      { key: 'value', name: 'HbA1c', color: '#8B5CF6' },
    ],
    normalMin: 4.0, normalMax: 5.7,
    borderlineMax: 6.5,
    referenceLines: [
      { y: 5.7, label: 'Normal', stroke: '#10b981', strokeDash: '4 4' },
      { y: 6.5, label: 'Diabetic threshold', stroke: '#f97316', strokeDash: '4 4' },
    ],
  },
  bp: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    keys: [
      { key: 'systolic',  name: 'Systolic',  color: '#EF4444' },
      { key: 'diastolic', name: 'Diastolic', color: '#F97316' },
    ],
    normalMin: 60, normalMax: 120,
    borderlineMax: 140,
    referenceLines: [
      { y: 120, label: 'Normal systolic', stroke: '#10b981', strokeDash: '4 4' },
      { y: 140, label: 'High',            stroke: '#f97316', strokeDash: '4 4' },
    ],
  },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-[11px] text-slate-400 font-medium mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300 font-medium">{p.name}:</span>
          <span className="text-white font-bold">{p.value} {unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Latest Value Summary Card ────────────────────────────────────────────────

const LatestCard = ({ metricKey, data }) => {
  const metric = METRICS[metricKey];
  if (!data.length) return null;

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  return (
    <div className="flex flex-col gap-0.5">
      {metric.keys.map(({ key, name, color }) => {
        const latest = last?.[key];
        const previous = prev?.[key];
        const delta = latest !== undefined && previous !== undefined ? latest - previous : null;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs text-slate-500 font-medium">{name}:</span>
            <span className="text-xs font-black text-slate-900">{latest} {metric.unit}</span>
            {delta !== null && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                delta < 0 ? 'text-emerald-600' : delta > 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {delta < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Lab Trends Section ───────────────────────────────────────────────────────

export const LabTrendsSection = ({ biomarkers = {} }) => {
  const [activeMetric, setActiveMetric] = useState('bloodSugar');

  const metric = METRICS[activeMetric];
  const data   = biomarkers[activeMetric] || [];
  const hasData = data.length > 0;

  return (
    <section id="lab-trends-section" className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-600" />
            Biomarker Trend Visualizer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">6-month historical trends with clinical reference ranges</p>
        </div>

        {/* Latest values */}
        {hasData && <LatestCard metricKey={activeMetric} data={data} />}
      </div>

      {/* Metric tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {Object.entries(METRICS).map(([key, m]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMetric(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              activeMetric === key
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {hasData ? (
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
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
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={<CustomTooltip unit={metric.unit} />}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                />

                {/* Normal range shading */}
                <ReferenceArea
                  y1={metric.normalMin}
                  y2={metric.normalMax}
                  fill="#10b981"
                  fillOpacity={0.05}
                />

                {/* Reference lines */}
                {metric.referenceLines.map(rl => (
                  <ReferenceLine
                    key={rl.y}
                    y={rl.y}
                    stroke={rl.stroke}
                    strokeDasharray={rl.strokeDash}
                    strokeWidth={1.5}
                    label={{
                      value: rl.label,
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: rl.stroke,
                      fontWeight: 600,
                    }}
                  />
                ))}

                {/* Data lines */}
                {metric.keys.map(({ key, name, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={name}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: '#fff' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Activity className="w-8 h-8 text-slate-200" />
            <p className="text-sm font-bold text-slate-600">No lab data available</p>
            <p className="text-xs text-slate-400">Upload a blood test report to populate this chart automatically.</p>
          </div>
        )}
      </div>
    </section>
  );
};
