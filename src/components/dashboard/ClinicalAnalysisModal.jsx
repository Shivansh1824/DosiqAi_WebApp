import React, { useState, useRef } from 'react';
import {
  X, Pill, FlaskConical, FileText, Brain, ShieldCheck,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Clock, User, Building2, Stethoscope, Zap, Activity,
  ArrowRight, Loader2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEAL_LABELS = {
  before_food: 'Before Meals',
  after_food: 'After Meals',
  with_food: 'With Meals',
  empty_stomach: 'Empty Stomach',
  any: 'Anytime',
};

const TIMING_COLORS = {
  '1-0-0': { label: 'Morning Only', dot: 'bg-amber-400' },
  '0-0-1': { label: 'Night Only', dot: 'bg-indigo-400' },
  '1-0-1': { label: 'Morning & Night', dot: 'bg-emerald-400' },
  '0-1-0': { label: 'Afternoon Only', dot: 'bg-sky-400' },
  '1-1-1': { label: 'Three Times Daily', dot: 'bg-rose-400' },
  '2-0-2': { label: 'Morning & Night (2x)', dot: 'bg-emerald-500' },
  '1-1-0': { label: 'Morning & Afternoon', dot: 'bg-teal-400' },
};

const ConfidenceBadge = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : pct >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% confidence
    </span>
  );
};

// ─── Prescription: Medicine Card ──────────────────────────────────────────────

const MedicineCard = ({ med, index }) => {
  const [expanded, setExpanded] = useState(false);
  const timingMeta = TIMING_COLORS[med.timing?.dosage];

  return (
    <div className="gsap-med-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 text-white font-black text-sm shadow-sm shadow-emerald-500/25">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-slate-900 leading-snug">
                {med.exact_written_name}
              </p>
              {med.assumed_enriched_data?.scientific_name && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {med.assumed_enriched_data.scientific_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {med.form && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {med.form}
                </span>
              )}
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {med.timing?.dosage && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${timingMeta?.dot || 'bg-slate-300'}`} />
                <span className="text-[10px] font-bold text-slate-700 font-mono">{med.timing.dosage}</span>
              </div>
            )}
            {med.timing?.relation_to_meal && (
              <span className="text-[10px] text-slate-500 font-medium">
                {MEAL_LABELS[med.timing.relation_to_meal] || med.timing.relation_to_meal}
              </span>
            )}
            {med.duration_days && (
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100">
                {med.duration_days}d course
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-3">
          {med.dosage_instruction && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dosage Instruction</p>
              <p className="text-xs text-slate-700 font-medium">{med.dosage_instruction}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {med.assumed_enriched_data?.medicine_type && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine Type</p>
                <p className="text-xs font-semibold text-slate-700">{med.assumed_enriched_data.medicine_type}</p>
              </div>
            )}
            {med.assumed_enriched_data?.medicine_purpose && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Purpose</p>
                <p className="text-xs font-semibold text-slate-700">{med.assumed_enriched_data.medicine_purpose}</p>
              </div>
            )}
            {med.interval_days != null && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Frequency</p>
                <p className="text-xs font-semibold text-slate-700">
                  {med.interval_days === 1 ? 'Daily' : med.interval_days === 2 ? 'Alternate Days' : `Every ${med.interval_days} days`}
                </p>
              </div>
            )}
            {med.timing?.total_times_per_day != null && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Times Per Day</p>
                <p className="text-xs font-semibold text-slate-700">{med.timing.total_times_per_day}x</p>
              </div>
            )}
          </div>

          {med.assumed_enriched_data && (
            <div className="flex items-center justify-between">
              <ConfidenceBadge value={med.assumed_enriched_data.confidence} />
              {med.assumed_enriched_data.is_identified && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Drug Identified
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Lab Report: Biomarker Panel ──────────────────────────────────────────────

const BiomarkerRow = ({ metric }) => {
  const Icon = metric.is_abnormal
    ? (parseFloat(metric.value) > 0 ? TrendingUp : TrendingDown)
    : Minus;

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${metric.is_abnormal ? 'bg-red-50 border border-red-100' : 'bg-white border border-slate-100'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{metric.test_name}</p>
        {metric.method && (
          <p className="text-[10px] text-slate-400 font-medium">{metric.method}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <p className={`text-sm font-black tabular-nums ${metric.is_abnormal ? 'text-red-700' : 'text-slate-800'}`}>
            {metric.value}
            {metric.unit && <span className="text-[10px] font-semibold ml-0.5">{metric.unit}</span>}
          </p>
          {metric.reference_range && (
            <p className="text-[10px] text-slate-400 font-medium">{metric.reference_range}</p>
          )}
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${metric.is_abnormal ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-500'}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

const BiomarkerPanel = ({ panel }) => {
  const [expanded, setExpanded] = useState(true);
  const abnormalCount = panel.metrics.filter(m => m.is_abnormal).length;

  return (
    <div className="gsap-panel-card border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-black text-slate-900">{panel.category_name}</span>
          {abnormalCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              {abnormalCount} Abnormal
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-medium">{panel.metrics.length} tests</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-3 flex flex-col gap-2">
          {panel.metrics.map((m, i) => (
            <BiomarkerRow key={i} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Clinical Analysis Modal ──────────────────────────────────────────────────

const TABS = [
  { id: 'clinical', label: 'Medicines & Report', icon: Pill },
  { id: 'overview', label: 'Clinical Overview', icon: Stethoscope },
  { id: 'reasoning', label: 'AI Reasoning', icon: Brain },
];

export const ClinicalAnalysisModal = ({ open, onClose, doc, isExtracting = false }) => {
  const [activeTab, setActiveTab] = useState('clinical');
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(() => {
    if (!open || !modalRef.current) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline();
      tl.from(modalRef.current, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' });
      tl.from(contentRef.current, { y: 32, autoAlpha: 0, duration: 0.4, ease: 'power3.out' }, '-=0.1');
      tl.from('.gsap-med-card, .gsap-panel-card', {
        y: 20, autoAlpha: 0, stagger: 0.07, duration: 0.35, ease: 'power2.out',
      }, '-=0.15');
    });
  }, { dependencies: [open, activeTab], scope: modalRef });

  if (!open) return null;

  const extraction = doc?.ai_analysis_result;
  const isReport = extraction?.document_type === 'medical_report' || doc?.type === 'Blood Test';
  const rx = extraction?.prescription_data;
  const reportData = extraction?.report_data;
  const patient = extraction?.patient_info;
  const common = extraction?.common_data;
  const meta = extraction?.analysis_metadata;

  return (
    <>
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          ref={contentRef}
          className="relative w-full max-w-2xl max-h-[92vh] bg-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${isReport ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                    {isReport ? <FlaskConical className="w-3 h-3" /> : <Pill className="w-3 h-3" />}
                    {isReport ? 'Lab Report Analysis' : 'Prescription Analysis'}
                  </span>
                  {meta?.scan_clarity && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                      {meta.scan_clarity} scan
                    </span>
                  )}
                  {meta?.handwriting_detected && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      Handwritten
                    </span>
                  )}
                  {meta?.confidence_score != null && <ConfidenceBadge value={meta.confidence_score} />}
                </div>

                <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  {isReport
                    ? (reportData?.lab_name || 'Laboratory Report')
                    : (rx?.hospital_name || extraction?.file_name || 'Clinical Prescription')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isReport ? (rx?.doctor_name || 'Pathology Analysis') : (rx?.doctor_name || 'Consulting Physician')}
                  {common?.visit_date && ` · ${new Date(common.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors shrink-0 mt-0.5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-0 px-5 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto">
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center gap-5 h-64 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Clinical Intelligence Extracting...</p>
                  <p className="text-xs text-slate-500 mt-1">Gemini 3.8 Flash is decoding handwriting, normalizing dosage codes, and structuring clinical data.</p>
                </div>
                <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-3/5 animate-pulse" />
                </div>
              </div>
            ) : !extraction ? (
              <div className="flex flex-col items-center justify-center gap-4 h-64 px-8 text-center">
                <FileText className="w-10 h-10 text-slate-200" />
                <div>
                  <p className="text-sm font-bold text-slate-700">No AI analysis available yet</p>
                  <p className="text-xs text-slate-400 mt-1">The document has not been processed by the AI extraction engine.</p>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">

                {activeTab === 'clinical' && (
                  <>
                    {!isReport && rx?.drug_interactions && (
                      <div className={`flex items-start gap-3 p-3.5 rounded-2xl border ${rx.drug_interactions.potential_interactions_flag ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        {rx.drug_interactions.potential_interactions_flag ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-xs font-black ${rx.drug_interactions.potential_interactions_flag ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {rx.drug_interactions.potential_interactions_flag ? 'Drug Interaction Warning' : 'Drug Conflict Shield: All Clear'}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {rx.drug_interactions.interaction_note || 'No adverse drug-drug interactions detected among prescribed medications.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {isReport && reportData?.total_abnormalities != null && (
                      <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${reportData.total_abnormalities > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center gap-2">
                          <Activity className={`w-5 h-5 ${reportData.total_abnormalities > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                          <div>
                            <p className={`text-xs font-black ${reportData.total_abnormalities > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                              {reportData.total_abnormalities > 0 ? `${reportData.total_abnormalities} Abnormal Parameters Detected` : 'All Parameters Within Normal Range'}
                            </p>
                            {reportData.lab_name && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{reportData.lab_name}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-2xl font-black tabular-nums ${reportData.total_abnormalities > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {reportData.total_abnormalities}
                        </span>
                      </div>
                    )}

                    {!isReport && rx?.medicines?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm font-black text-slate-900">{rx.medicines.length} Medicine{rx.medicines.length !== 1 ? 's' : ''} Prescribed</p>
                        </div>
                        {rx.medicines.map((med, i) => (
                          <MedicineCard key={i} med={med} index={i} />
                        ))}
                      </div>
                    )}

                    {!isReport && rx?.recommended_tests?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-sky-500" /> Recommended Diagnostic Tests
                        </p>
                        {rx.recommended_tests.map((t, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-100">
                            <ArrowRight className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{t.test_name}</p>
                              {t.reason && <p className="text-[10px] text-slate-500 mt-0.5">{t.reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isReport && reportData?.grouped_metrics?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {reportData.grouped_metrics.map((panel, i) => (
                          <BiomarkerPanel key={i} panel={panel} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-sm">
                          {patient?.name?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{patient?.name || 'Patient'}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {[patient?.age && `${patient.age} yrs`, patient?.gender].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>

                      {common?.summary && (
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AI Summary</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{common.summary}</p>
                        </div>
                      )}
                    </div>

                    {!isReport && rx?.medical_issue_diagnosis && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Stethoscope className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-black text-slate-700">Diagnosis</p>
                          {rx.diagnosis_source && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rx.diagnosis_source === 'explicit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {rx.diagnosis_source === 'explicit' ? 'Written on Rx' : 'AI Inferred'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{rx.medical_issue_diagnosis}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {rx?.doctor_name && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{rx.doctor_name}</p>
                        </div>
                      )}
                      {(rx?.hospital_name || reportData?.lab_name) && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isReport ? 'Laboratory' : 'Hospital'}</p>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{rx?.hospital_name || reportData?.lab_name}</p>
                        </div>
                      )}
                    </div>

                    {rx?.follow_up?.follow_up_date && (
                      <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-slate-800">Follow-up Appointment</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(rx.follow_up.follow_up_date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {rx?.other_information?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Information</p>
                        {rx.other_information.map((info, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${info.category === 'Vitals' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {info.category}
                            </span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{info.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reasoning' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200">
                      <Brain className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-violet-800">Gemini 3.8 Flash -- Clinical Chain-of-Thought</p>
                        <p className="text-[10px] text-violet-600 font-medium mt-0.5">Multimodal reasoning trace from the AI extraction engine</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      {extraction?.reasoning ? (
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{extraction.reasoning}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No reasoning trace available for this document.</p>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setReasoningExpanded(e => !e)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Raw JSON Extraction</span>
                        </div>
                        {reasoningExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {reasoningExpanded && (
                        <pre className="p-4 bg-slate-950 text-emerald-300 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-72 overflow-y-auto">
                          {JSON.stringify(extraction, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Encrypted vault · Powered by Gemini 3.8 Flash</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
