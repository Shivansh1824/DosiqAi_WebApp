import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

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

// ─── Trend Chart Component ───────────────────────────────────────────────────

export const TrendChart = ({ testName, trendData, unit }) => {
  if (!trendData || trendData.length < 1) return null;

  const values = trendData.map(d => d.value).filter(v => !isNaN(v));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.2 || 5;

  const last = trendData[trendData.length - 1];
  const prev = trendData[trendData.length - 2];
  const delta = prev ? (last.value - prev.value) : null;
  const isImproving = delta !== null && !last.is_abnormal && delta !== 0;
  const isWorsening = delta !== null && last.is_abnormal && delta > 0;

  return (
    <div className="gsap-trend-card bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3 transition-all hover:shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">{testName}</p>
          <p className="text-[10px] text-slate-400 font-medium">{trendData.length} readings over time</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Latest value */}
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
            last.is_abnormal
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {last.value} {unit}
          </span>
          {/* Trend direction */}
          {delta !== null && delta !== 0 && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
              isImproving ? 'bg-emerald-50 text-emerald-600' :
              isWorsening ? 'bg-rose-50 text-rose-600' :
              'bg-slate-100 text-slate-500'
            }`}>
              {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {Math.abs(delta).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {trendData.length > 1 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={trendData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              domain={[Math.max(0, minVal - padding), maxVal + padding]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="value"
              name={testName}
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={({ cx, cy, payload }) => (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx} cy={cy} r={4}
                  fill={payload.is_abnormal ? '#ef4444' : '#0ea5e9'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              activeDot={{ r: 6, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-20 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Upload another report to see trend</p>
        </div>
      )}
    </div>
  );
};
