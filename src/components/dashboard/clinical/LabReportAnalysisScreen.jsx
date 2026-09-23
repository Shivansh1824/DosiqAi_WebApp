import React, { useState, useRef } from 'react';
import {
  ArrowLeft, FlaskConical, Brain, Activity, Code2,
  Eye, Calendar, User, AlertTriangle, CheckCircle2,
  Loader2, Lightbulb, Printer, FileText, Stethoscope,
  Layers, SlidersHorizontal,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { BiomarkerPanelCard, MetricRow } from './BiomarkerPanelCard';
import { TrendChart } from './LabTrendChart';
import { LabRangeChartsView } from './LabRangeChartsView';
import { LabRangeHighlightsOverview } from './LabRangeHighlightsOverview';
import { LabAIIntelligenceView } from './LabAIIntelligenceView';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { normalizeBiomarkerName, resolveClinicalReportDate } from '../../../lib/biomarkerUtils';

gsap.registerPlugin(useGSAP);

export const LabReportAnalysisScreen = ({ doc, onBack, isExtracting = false, allReportDocs = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
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

  // Build cross-report trend data from allReportDocs (sorted by genuine clinical date)
  const trendMap = {};
  const sortedDocs = [...allReportDocs]
    .filter(d => d.ai_analysis_result?.report_data?.grouped_metrics)
    .sort((a, b) => {
      const dateA = resolveClinicalReportDate(a).isoDate;
      const dateB = resolveClinicalReportDate(b).isoDate;
      return new Date(dateA || 0) - new Date(dateB || 0);
    });

  sortedDocs.forEach((d, docIdx) => {
    const rd = d.ai_analysis_result?.report_data;
    const { displayDate } = resolveClinicalReportDate(d);
    const hasDuplicateDate = sortedDocs.some((other, oi) => oi !== docIdx && resolveClinicalReportDate(other).displayDate === displayDate);
    const shortLab = d.clinic ? d.clinic.split(' ')[0] : (d.doctor ? d.doctor.split(' ')[0] : '');
    const sameLabCount = sortedDocs.filter(other => resolveClinicalReportDate(other).displayDate === displayDate && (other.clinic ? other.clinic.split(' ')[0] : (other.doctor ? other.doctor.split(' ')[0] : '')) === shortLab).length;
    const dateLabel = hasDuplicateDate
      ? (sameLabCount > 1
          ? `${displayDate} (${shortLab ? `${shortLab} #${docIdx + 1}` : `Rep ${docIdx + 1}`})`
          : `${displayDate} (${shortLab || `Rep ${docIdx + 1}`})`)
      : displayDate;

    const recordedInDoc = new Set();

    (rd?.grouped_metrics || []).forEach(panel => {
      panel.metrics.forEach(metric => {
        const rawName = metric.test_name;
        const key = normalizeBiomarkerName(rawName) || rawName;

        if (recordedInDoc.has(key)) return;

        const numVal = metric.numeric_value ?? parseFloat(metric.value);
        if (!isNaN(numVal)) {
          recordedInDoc.add(key);
          if (!trendMap[key]) trendMap[key] = { unit: metric.unit, data: [] };
          trendMap[key].data.push({
            date: dateLabel,
            value: numVal,
            unit: metric.unit || trendMap[key].unit,
            is_abnormal: metric.is_abnormal,
            reportTitle: d.file_name || d.ai_file_name || 'Lab Report'
          });
        }
      });
    });
  });

  // ─── GSAP Fluid Orchestration ─────────────────────────────────────────────
  useGSAP(() => {
    if (isExtracting || !extraction) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Top nav entrance
      gsap.fromTo(
        '.gsap-report-nav',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );

      // Hero banner
      gsap.fromTo(
        '.gsap-report-hero',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.05 }
      );

      // Main active tab container
      gsap.fromTo(
        '.gsap-report-tab',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.1 }
      );

      // Tab-specific micro-animations
      if (activeTab === 'overview') {
        gsap.fromTo(
          '.gsap-kpi-card',
          { scale: 0.94, opacity: 0, y: 12 },
          { scale: 1, opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'back.out(1.4)', delay: 0.15 }
        );
        gsap.fromTo(
          '.gsap-summary-card',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out', delay: 0.22 }
        );
        gsap.fromTo(
          '.gsap-range-card',
          { scale: 0.96, y: 14, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.25 }
        );
        gsap.fromTo(
          '.gsap-metric-row',
          { x: -10, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.25, stagger: 0.04, ease: 'power1.out', delay: 0.28 }
        );
      } else if (activeTab === 'panels') {
        gsap.fromTo(
          '.gsap-panel-card',
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.07, ease: 'power2.out', delay: 0.12 }
        );
        gsap.fromTo(
          '.gsap-metric-row',
          { x: -8, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.25, stagger: 0.025, ease: 'power1.out', delay: 0.22 }
        );
      } else if (activeTab === 'ranges') {
        gsap.fromTo(
          '.gsap-range-card',
          { scale: 0.96, y: 16, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.12 }
        );
      } else if (activeTab === 'trends') {
        gsap.fromTo(
          '.gsap-trend-card',
          { scale: 0.96, y: 16, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.12 }
        );
      } else if (activeTab === 'ai') {
        gsap.fromTo(
          '.gsap-ai-card',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.12 }
        );
      }
    });
  }, { dependencies: [activeTab, isExtracting, Boolean(extraction)], scope: containerRef });

  // ─── Tab: Overview ────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="gsap-kpi-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tests</span>
          <span className="text-2xl font-black text-slate-900">{totalTests}</span>
          <span className="text-[11px] text-slate-500">Parameters analyzed</span>
        </div>
        <div className="gsap-kpi-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abnormal</span>
          <span className={`text-2xl font-black ${totalAbnormal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalAbnormal}
          </span>
          <span className="text-[11px] text-slate-500">Out of range</span>
        </div>
        <div className="gsap-kpi-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Confidence</span>
          <span className="text-2xl font-black text-teal-700">{confidencePct}%</span>
          <span className="text-[11px] text-slate-500">Extraction accuracy</span>
        </div>
        <div className="gsap-kpi-card bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panels Tested</span>
          <span className="text-2xl font-black text-violet-700">{panels.length}</span>
          <span className="text-[11px] text-slate-500">Clinical categories</span>
        </div>
      </div>

      {/* AI Clinical Summary */}
      <div className="gsap-summary-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
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
        <div className="gsap-summary-card bg-violet-50 rounded-2xl p-5 border border-violet-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-violet-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-violet-700">For You & Your Family</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{reportData.clinical_narrative}</p>
        </div>
      )}

      {/* Featured Clinical Range Gauges */}
      <LabRangeHighlightsOverview
        panels={panels}
        onViewAllRanges={() => setActiveTab('ranges')}
      />

      {/* Abnormal highlights strip */}
      {totalAbnormal > 0 && (
        <div className="gsap-summary-card bg-white rounded-2xl p-5 border border-rose-100 shadow-sm flex flex-col gap-3">
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
        <div className="gsap-summary-card bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-3">
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
    <LabAIIntelligenceView
      confidencePct={confidencePct}
      meta={meta}
      reportData={reportData}
      common={common}
      reasoning={reasoning}
      extraction={extraction}
      panels={panels}
      totalTests={totalTests}
      totalAbnormal={totalAbnormal}
      onInspectJson={() => setShowJsonModal(true)}
    />
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
          {/* View Original Uploaded Report */}
          <button
            type="button"
            onClick={() => setShowDocPreview(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-sky-200 transition-colors"
            title="View Original Uploaded Lab Report"
          >
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">View Report</span>
            <span className="sm:hidden">View</span>
          </button>

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

                  {/* View Original Lab Document Pill */}
                  <button
                    type="button"
                    onClick={() => setShowDocPreview(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-3 py-1 rounded-full border border-slate-200/80 hover:border-sky-200 transition-colors cursor-pointer"
                    title="View original uploaded lab report document"
                  >
                    <Eye className="w-3 h-3 text-sky-600" />
                    <span>View Original</span>
                  </button>
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
                { key: 'overview',  icon: Layers,            label: 'Overview'           },
                { key: 'panels',    icon: FlaskConical,      label: 'Biomarker Panels'   },
                { key: 'ranges',    icon: SlidersHorizontal, label: 'Range Charts'       },
                { key: 'trends',    icon: Activity,          label: 'Trend Charts'       },
                { key: 'ai',        icon: Brain,             label: 'AI Intelligence'    },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 ${
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
            {activeTab === 'ranges'   && <LabRangeChartsView panels={panels} />}
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

      {/* ── Original Document Preview Modal ──────────────────────────── */}
      <DocumentPreviewModal
        doc={doc}
        isOpen={showDocPreview}
        onClose={() => setShowDocPreview(false)}
      />
    </div>
  );
};
