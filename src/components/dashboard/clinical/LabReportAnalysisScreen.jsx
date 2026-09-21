import React, { useState, useRef } from 'react';
import {
  ArrowLeft, FlaskConical, Brain, Activity, Code2,
  Eye, Calendar, User, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Loader2, Lightbulb,
  Printer, FileText, Stethoscope, Layers, ChevronRight,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';

gsap.registerPlugin(useGSAP);

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY = {
  normal:     { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Normal'     },
  borderline: { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',    label: 'Borderline'  },
  high:       { bg: 'bg-rose-50',     border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',     label: 'High'        },
  low:        { bg: 'bg-sky-50',      border: 'border-sky-200',     text: 'text-sky-700',     dot: 'bg-sky-500',      label: 'Low'         },
  critical:   { bg: 'bg-red-100',     border: 'border-red-400',     text: 'text-red-800',     dot: 'bg-red-600',      label: 'Critical'    },
};

const getSeverityConfig = (metric) => {
  if (metric.severity && SEVERITY[metric.severity]) return SEVERITY[metric.severity];
  return metric.is_abnormal ? SEVERITY.high : SEVERITY.normal;
};

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

// ─── Metric Row (single biomarker) ───────────────────────────────────────────

const MetricRow = ({ metric }) => {
  const sev = getSeverityConfig(metric);
  const numVal = metric.numeric_value ?? parseFloat(metric.value);
  const displayVal = isNaN(numVal) ? metric.value : numVal;

  return (
    <div className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${sev.bg} ${sev.border} transition-all`}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">{metric.test_name}</p>
          {metric.method && (
            <p className="text-[10px] text-slate-400 font-medium">{metric.method}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Value */}
        <div className="text-right">
          <p className={`text-sm font-black tabular-nums ${sev.text}`}>
            {displayVal} <span className="text-[10px] font-bold text-slate-400">{metric.unit}</span>
          </p>
        </div>

        {/* Reference Range */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-400 font-medium">Reference</p>
          <p className="text-[11px] text-slate-600 font-bold whitespace-nowrap">{metric.reference_range || '—'}</p>
        </div>

        {/* Severity Badge */}
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${sev.bg} ${sev.border} ${sev.text} shrink-0`}>
          {sev.label}
        </span>
      </div>
    </div>
  );
};

// ─── Biomarker Panel Card ─────────────────────────────────────────────────────

const BiomarkerPanelCard = ({ panel }) => {
  const [expanded, setExpanded] = useState(true);
  const abnormalCount = panel.metrics.filter(m => m.is_abnormal).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">{panel.category_name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{panel.metrics.length} parameters tested</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
              {abnormalCount} Abnormal
            </span>
          )}
          {abnormalCount === 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              All Normal
            </span>
          )}
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 flex flex-col gap-2">
          {panel.metrics.map((metric, idx) => (
            <MetricRow key={idx} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Trend Chart for a single metric ─────────────────────────────────────────

const TrendChart = ({ testName, trendData, unit }) => {
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3">
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const LabReportAnalysisScreen = ({ doc, onBack, isExtracting = false, allReportDocs = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const containerRef = useRef(null);

  const extraction = doc?.ai_analysis_result;
  const reportData = extraction?.report_data;
  const patient = extraction?.patient_info;
  const common = extraction?.common_data;
  const meta = extraction?.analysis_metadata;
  const errorResp = extraction?.error_response;
  const reasoning = extraction?.reasoning;
  const fileName = extraction?.file_name || doc?.local_file_path || `${patient?.name || 'Patient'} Lab Report`;
  const confidencePct = Math.round((meta?.confidence_score ?? 0.95) * 100);

  const panels = reportData?.grouped_metrics || [];
  const totalAbnormal = reportData?.total_abnormalities ?? 0;
  const totalTests = panels.reduce((acc, p) => acc + p.metrics.length, 0);

  // Build cross-report trend data from allReportDocs (sorted by date)
  const trendMap = {};
  const sortedDocs = [...allReportDocs]
    .filter(d => d.ai_analysis_result?.report_data?.grouped_metrics)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  sortedDocs.forEach(d => {
    const rd = d.ai_analysis_result?.report_data;
    const dateLabel = d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '?';
    (rd?.grouped_metrics || []).forEach(panel => {
      panel.metrics.forEach(metric => {
        const key = metric.test_name;
        if (!trendMap[key]) trendMap[key] = { unit: metric.unit, data: [] };
        const numVal = metric.numeric_value ?? parseFloat(metric.value);
        if (!isNaN(numVal)) {
          trendMap[key].data.push({ date: dateLabel, value: numVal, unit: metric.unit, is_abnormal: metric.is_abnormal });
        }
      });
    });
  });

  // GSAP entrance
  useGSAP(() => {
    if (isExtracting || !extraction) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.gsap-report-nav', { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo('.gsap-report-hero', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.05 });
      gsap.fromTo('.gsap-report-tab', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.1 });
    });
  }, { dependencies: [activeTab, isExtracting], scope: containerRef });

  // ─── Tab: Overview ────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tests</span>
          <span className="text-2xl font-black text-slate-900">{totalTests}</span>
          <span className="text-[11px] text-slate-500">Parameters analyzed</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abnormal</span>
          <span className={`text-2xl font-black ${totalAbnormal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalAbnormal}
          </span>
          <span className="text-[11px] text-slate-500">Out of range</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Confidence</span>
          <span className="text-2xl font-black text-teal-700">{confidencePct}%</span>
          <span className="text-[11px] text-slate-500">Extraction accuracy</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panels Tested</span>
          <span className="text-2xl font-black text-violet-700">{panels.length}</span>
          <span className="text-[11px] text-slate-500">Clinical categories</span>
        </div>
      </div>

      {/* AI Clinical Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-700">
          <Brain className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Dosiq AI — Clinical Summary</h3>
        </div>
        {common?.summary && (
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{common.summary}</p>
        )}
      </div>

      {/* Patient Narrative */}
      {reportData?.clinical_narrative && (
        <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-violet-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-violet-700">For You & Your Family</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{reportData.clinical_narrative}</p>
        </div>
      )}

      {/* Abnormal highlights strip */}
      {totalAbnormal > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Abnormal Findings Requiring Attention</h3>
          </div>
          <div className="flex flex-col gap-2">
            {panels.flatMap(p => p.metrics.filter(m => m.is_abnormal)).map((metric, idx) => (
              <MetricRow key={idx} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* All-normal message */}
      {totalAbnormal === 0 && totalTests > 0 && (
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-black text-emerald-900">All Parameters Within Normal Limits</p>
            <p className="text-xs text-emerald-700 mt-0.5">Excellent! All {totalTests} test results are in the healthy reference range.</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Tab: Biomarker Panels ────────────────────────────────────────────────

  const renderPanels = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Biomarker Panels</h3>
        <p className="text-xs text-slate-500 mt-0.5">{panels.length} clinical categories · {totalTests} parameters tested</p>
      </div>
      {panels.length > 0 ? (
        panels.map((panel, idx) => <BiomarkerPanelCard key={idx} panel={panel} />)
      ) : (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <FlaskConical className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No biomarker panels extracted</p>
        </div>
      )}
    </div>
  );

  // ─── Tab: Trend Charts ────────────────────────────────────────────────────

  const renderTrends = () => {
    const trendEntries = Object.entries(trendMap).filter(([, v]) => v.data.length > 0);
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Historical Biomarker Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {allReportDocs.length} report{allReportDocs.length !== 1 ? 's' : ''} compared · Red dots indicate abnormal readings
          </p>
        </div>

        {allReportDocs.length < 2 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Upload a second blood test report to unlock trend comparison charts and direction indicators.
            </p>
          </div>
        )}

        {trendEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendEntries.map(([testName, { unit, data }]) => (
              <TrendChart key={testName} testName={testName} trendData={data} unit={unit} />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No trend data available</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Tab: AI Intelligence ─────────────────────────────────────────────────

  const renderAI = () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Analysis Confidence</span>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${confidencePct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-lg font-black text-emerald-700">{confidencePct}%</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Eye className="w-5 h-5 text-sky-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scan Clarity</p>
            <p className="text-sm font-black text-slate-900 capitalize">{meta?.scan_clarity || 'Clear'}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-violet-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lab Identified</p>
            <p className="text-sm font-black text-slate-900">{reportData?.lab_name || 'Lab'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Dosiq AI Clinical Reasoning Trace</h3>
        </div>
        {common?.summary && (
          <p className="text-sm font-bold text-slate-800 leading-relaxed">{common.summary}</p>
        )}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-mono">
          {reasoning || `Extraction Engine: Dosiq AI Lab Pathology Intelligence
Document Type: ${extraction?.document_type || 'medical_report'}
Image Clarity: ${meta?.scan_clarity || 'Clear'}
Confidence: ${confidencePct}%
Panels Extracted: ${panels.length}
Total Tests: ${totalTests}
Abnormalities Found: ${totalAbnormal}`}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h4 className="text-sm font-black text-slate-900">Developer & Clinical JSON Audit</h4>
          <p className="text-xs text-slate-500 mt-0.5">View the full structured payload extracted by the AI pipeline.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowJsonModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          Inspect JSON Payload
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-20">

      {/* ── Top Nav ── */}
      <div className="gsap-report-nav flex items-center justify-between gap-4 flex-wrap bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-3.5 py-2 rounded-xl transition-all duration-150 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Clinical Vault</span>
            <span>/</span>
            <span>Lab Report</span>
            <span>/</span>
            <span className="text-slate-800 font-bold truncate max-w-xs">{fileName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl border border-sky-200/70 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-600" />
            JSON Result
          </button>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isExtracting ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center gap-5 my-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Dosiq AI Lab Report Extraction In Progress</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Scanning all biomarkers, applying abnormality detection, and building your clinical profile.
            </p>
          </div>
          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      ) : !extraction ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center gap-4 my-8">
          <FileText className="w-12 h-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No Structured Lab Analysis Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">This report has not been processed through the AI clinical analysis pipeline yet.</p>
        </div>
      ) : (
        <>
          {/* Error Banner */}
          {errorResp?.is_error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-900 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black">AI Processing Warning</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorResp.technical_reason || 'Please review document quality.'}</p>
              </div>
            </div>
          )}

          {/* ── Hero Card ── */}
          <div className="gsap-report-hero bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-sky-50 text-sky-800 border-sky-200">
                    <FlaskConical className="w-3.5 h-3.5" />
                    Pathology Lab Report
                  </span>
                  {totalAbnormal > 0 && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {totalAbnormal} Abnormalities Found
                    </span>
                  )}
                  {totalAbnormal === 0 && totalTests > 0 && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      All Clear
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {reportData?.lab_name || 'Clinical Pathology Laboratory'}
                </h1>

                <div className="flex items-center gap-4 mt-2.5 text-sm text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-800">
                      {extraction?.prescription_data?.doctor_name || 'Reporting Pathologist'}
                    </span>
                  </div>
                  {(common?.visit_date || doc?.date) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Collection Date: {common?.visit_date || doc?.date}</span>
                    </div>
                  )}
                  {reportData?.report_date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Report Date: {reportData.report_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {patient && (
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:w-64 shrink-0 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Dossier</span>
                  </div>
                  <p className="text-base font-black text-slate-900">{patient.name || doc?.patient_name || 'Patient'}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    {patient.age && <span>{patient.age} yrs</span>}
                    {patient.gender && <span className="capitalize">· {patient.gender}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-hide">
              {[
                { key: 'overview',  icon: Layers,      label: 'Overview'           },
                { key: 'panels',    icon: FlaskConical, label: 'Biomarker Panels'   },
                { key: 'trends',    icon: Activity,     label: 'Trend Charts'       },
                { key: 'ai',        icon: Brain,        label: 'AI Intelligence'    },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                    activeTab === tab.key
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="gsap-report-tab">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'panels'   && renderPanels()}
            {activeTab === 'trends'   && renderTrends()}
            {activeTab === 'ai'       && renderAI()}
          </div>
        </>
      )}

      {/* JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-800 shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">Lab Report Clinical JSON Payload</span>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-sky-300/90 leading-relaxed">
              <pre>{JSON.stringify(extraction || doc, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
