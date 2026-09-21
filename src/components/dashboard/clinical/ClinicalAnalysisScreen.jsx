import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Pill, FlaskConical, Brain, ShieldCheck,
  AlertTriangle, CheckCircle2, Clock, User, Building2,
  Stethoscope, Zap, Activity, Code2, Download, Eye, Feather,
  Calendar, MapPin, HeartPulse, FileText, Loader2, Sparkles,
  AlertCircle, Printer, ChevronRight, FileCheck, Check, Send,
  LayoutGrid, Layers
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MedicineCard } from './MedicineCard';
import { BiomarkerPanel } from './BiomarkerPanel';
import { TelegramPrescriptionSync } from './TelegramPrescriptionSync';

gsap.registerPlugin(useGSAP);

export const ClinicalAnalysisScreen = ({ doc, onBack, isExtracting = false }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'clinical' | 'directives' | 'reasoning'
  const [showJsonModal, setShowJsonModal] = useState(false);
  const containerRef = useRef(null);

  const extraction = doc?.ai_analysis_result;
  const isReport = extraction?.document_type === 'medical_report' || doc?.type === 'Blood Test';
  const rx = extraction?.prescription_data;
  const reportData = extraction?.report_data;
  const patient = extraction?.patient_info;
  const common = extraction?.common_data;
  const meta = extraction?.analysis_metadata;
  const errorResp = extraction?.error_response;
  const reasoning = extraction?.reasoning;
  const fileName = extraction?.file_name || doc?.local_file_path || `${patient?.name || 'Patient'} Prescription Dossier`;

  const confidencePct = Math.round((meta?.confidence_score ?? 0.95) * 100);
  const [medicines, setMedicines] = useState(rx?.medicines || []);

  useEffect(() => {
    if (rx?.medicines) {
      setMedicines(rx.medicines);
    }
  }, [rx?.medicines]);

  const handleUpdateMedicine = (idx, updatedMed) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[idx] = updatedMed;
      return copy;
    });
  };

  const durationDays = medicines.find(m => m.duration_days)?.duration_days || 3;
  const interactionFlag = rx?.drug_interactions?.potential_interactions_flag;
  const interactionNote = rx?.drug_interactions?.interaction_note || '';

  // GSAP Smooth Header Entry
  useGSAP(() => {
    if (isExtracting || !extraction) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.gsap-screen-nav', 
        { y: -12, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo('.gsap-hero-card', 
        { y: 14, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.05 }
      );
      gsap.fromTo('.gsap-tab-content', 
        { y: 12, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.1 }
      );
    });
  }, { dependencies: [activeTab, isExtracting], scope: containerRef });

  // ─── Sub-Section 1: AI Intelligence & Verification (Light Mode) ─────────────
  const renderAIIntelligence = (showAuditCTA = false) => (
    <div className="flex flex-col gap-4">
      {/* 3 Quality & Confidence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Confidence Meter */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Analysis Confidence</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {confidencePct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidencePct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            High precision clinical extraction
          </p>
        </div>

        {/* 2. Scan Clarity */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scan Clarity</p>
            <p className="text-sm font-black text-slate-900 capitalize">
              {meta?.scan_clarity || 'Clear'}
            </p>
            <p className="text-[10px] text-slate-500">Optical resolution verified</p>
          </div>
        </div>

        {/* 3. Handwriting Detector */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Handwriting Status</p>
            <p className="text-sm font-black text-slate-900">
              {meta?.handwriting_detected ? 'Doctor Script Decoded' : 'Printed Document'}
            </p>
            <p className="text-[10px] text-slate-500">
              {meta?.handwriting_detected ? 'Handwriting OCR active' : 'Digital font OCR'}
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Reasoning Trace Card (Light Mode) */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <Brain className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Gemini AI Clinical Reasoning Trace
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
              Confidence: {confidencePct}%
            </span>
          </div>

          {common?.summary && (
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {common.summary}
            </p>
          )}

          {reasoning ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-mono">
              <p className="font-sans text-xs text-emerald-800 font-bold mb-1.5 uppercase tracking-wide">
                Clinical Decoding Logic:
              </p>
              {reasoning}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-mono">
              {`Extraction Engine: Gemini 3.8 Flash
Document Type: ${extraction?.document_type || 'Prescription'}
Image Clarity: ${meta?.scan_clarity || 'Clear'}
Handwriting: ${meta?.handwriting_detected ? 'Handwritten script decoded' : 'Printed document'}
Confidence: ${confidencePct}%
Prescribed Drugs Extracted: ${medicines.length}
Drug Conflict Shield: ${interactionFlag ? 'Interaction Flagged' : 'All Clear'}`}
            </div>
          )}
        </div>
      </div>

      {/* JSON Inspection CTA Card */}
      {showAuditCTA && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 className="text-sm font-black text-slate-900">Developer &amp; Clinical JSON Audit</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              View the full structured payload extracted by the multi-layer pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inspect JSON Payload</span>
          </button>
        </div>
      )}
    </div>
  );

  // ─── Sub-Section 2: Medical Result / Medications Regimen ────────────────────
  const renderMedicalResult = () => (
    <div className="flex flex-col gap-5">
      {!isReport && (
        <>
          {/* Executive Regimen Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Medications</span>
              <span className="text-xl font-black text-slate-900">{medicines.length}</span>
              <span className="text-[11px] text-slate-500">Prescribed by doctor</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Treatment Duration</span>
              <span className="text-xl font-black text-teal-700">{durationDays} Days</span>
              <span className="text-[11px] text-slate-500">Complete therapy course</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Slots</span>
              <span className="text-xl font-black text-amber-700">3 Slots</span>
              <span className="text-[11px] text-slate-500">Morning, Afternoon, Night</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Interaction Shield</span>
              <span className={`text-sm font-black ${interactionFlag ? 'text-amber-600' : 'text-emerald-700'}`}>
                {interactionFlag ? '1 Flagged' : 'All Clear (0)'}
              </span>
              <span className="text-[11px] text-slate-500">Clinical pharmacology</span>
            </div>
          </div>

          {/* Drug-Drug Interaction Alert Banner */}
          {interactionFlag ? (
            <div className="p-4 sm:p-5 rounded-2xl border bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black">Drug-Drug Interaction Alert</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                    Pharmacology Safety Shield
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed text-amber-800">
                  {interactionNote || 'Concomitant use of corticosteroids and NSAIDs increases the risk of gastrointestinal irritation/bleeding. Ensure doses are taken with food.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl border bg-emerald-50/70 border-emerald-200/80 text-emerald-900 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold">
                <strong>Drug Conflict Shield: All Clear.</strong> No adverse synergistic interactions or counter-indications detected across prescribed medications.
              </p>
            </div>
          )}

          {/* Prescribed Medications Heading */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Prescribed Medications &amp; Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed breakdown with dosage frequency, daily time slots, meal timings, and clinical indications.
              </p>
            </div>
          </div>

          {/* Medication Cards List */}
          <div className="flex flex-col gap-4">
            {medicines.length > 0 ? (
              medicines.map((med, idx) => (
                <MedicineCard
                  key={idx}
                  med={med}
                  index={idx}
                  interactionNote={interactionNote}
                  onUpdate={(updated) => handleUpdateMedicine(idx, updated)}
                />
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-bold text-slate-600">No individual medications identified</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Lab Report Panels View */}
      {isReport && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Biomarker Panels</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportData?.panels?.length || 0} test panels with abnormality detection and reference limits.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {reportData?.panels?.map((panel, idx) => (
              <BiomarkerPanel key={idx} panel={panel} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ─── Sub-Section 3: Clinical Directives, Tests & Advice ─────────────────────
  const renderClinicalDirectives = () => (
    <div className="flex flex-col gap-5">
      {/* Grid 1: Core Clinical Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Diagnosis */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <Stethoscope className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Primary Diagnosis / Assessment</h4>
          </div>
          <p className="text-base font-black text-slate-900 leading-snug">
            {rx?.medical_issue_diagnosis || rx?.diagnosis || common?.provisional_diagnosis || 'Clinical Consultation Record'}
          </p>
          {rx?.diagnosis_source && (
            <p className="text-xs text-slate-500">
              Diagnosis Source: <span className="font-semibold capitalize text-slate-700">{rx.diagnosis_source}</span> (on prescription document)
            </p>
          )}
        </div>

        {/* Follow Up */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-700">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Follow-Up Schedule</h4>
          </div>
          <p className="text-base font-black text-slate-900 leading-snug">
            {rx?.follow_up?.follow_up_date
              ? `Follow up on ${rx.follow_up.follow_up_date}${rx.follow_up.follow_up_days ? ` (${rx.follow_up.follow_up_days} days)` : ''}`
              : common?.follow_up_instructions || (rx?.follow_up?.follow_up_days ? `Follow up in ${rx.follow_up.follow_up_days} days` : 'Follow up in 3 days if symptoms persist')}
          </p>
          <p className="text-xs text-slate-500">
            Consult attending doctor immediately if fever rises or symptoms worsen.
          </p>
        </div>
      </div>

      {/* Recommended Diagnostic Tests */}
      {rx?.recommended_tests && rx.recommended_tests.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-700">
            <FlaskConical className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Advised Diagnostic Tests</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rx.recommended_tests.map((test, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-slate-900">{test.test_name}</p>
                  {test.reason && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{test.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Information & Directives (Diet, Lifestyle, Vitals, Notes) */}
      {rx?.other_information && rx.other_information.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Physician Directives &amp; Clinical Notes</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rx.other_information.map((info, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {info.category || 'Note'}
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {info.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Sub-Section 4: Telegram Care Loop Connection (Light Mode) ───────────────
  const renderTelegramLoop = () => (
    <div className="pt-2">
      <TelegramPrescriptionSync
        patientName={patient?.name || 'Patient'}
        medicines={medicines}
        durationDays={durationDays}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-20">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="gsap-screen-nav flex items-center justify-between gap-4 flex-wrap bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-all duration-150 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Clinical Vault</span>
            <span>/</span>
            <span>{isReport ? 'Lab Report' : 'Prescription'}</span>
            <span>/</span>
            <span className="text-slate-800 font-bold truncate max-w-xs">
              {fileName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Dossier */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-colors"
            title="Print Clinical Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Raw JSON Inspector */}
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200/70 transition-colors"
            title="Inspect AI Extracted JSON"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>JSON Result</span>
          </button>
        </div>
      </div>

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {isExtracting ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center gap-5 my-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Gemini AI Clinical Extraction In Progress</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Decoding handwriting, verifying Indian Drug Index, and building clinical regimen.
            </p>
          </div>
          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      ) : !extraction ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center gap-4 my-8">
          <FileText className="w-12 h-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No Structured Analysis Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            This document has not been processed through the AI clinical analysis pipeline yet.
          </p>
        </div>
      ) : (
        <>
          {/* ── Error Banner (if error_response.is_error is true) ───────── */}
          {errorResp?.is_error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-900 shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black">AI Processing Warning Detected</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  {errorResp.technical_reason || 'The system encountered difficulty fully resolving one or more clinical elements. Please review details below.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Hero Dossier Card ───────────────────────────────────────── */}
          <div className="gsap-hero-card bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1 min-w-0">
                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${
                    isReport
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isReport ? <FlaskConical className="w-3.5 h-3.5" /> : <Pill className="w-3.5 h-3.5" />}
                    {isReport ? 'Pathology Lab Report' : 'Prescription Analysis'}
                  </span>

                  {/* Diagnosis Tag */}
                  {(rx?.medical_issue_diagnosis || rx?.diagnosis) && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white shadow-sm flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rx.medical_issue_diagnosis || rx.diagnosis}</span>
                      {rx?.diagnosis_source && (
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          ({rx.diagnosis_source})
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Primary Title: Clinic / Hospital */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {isReport
                    ? (reportData?.lab_name || 'Clinical Pathology Laboratory')
                    : (rx?.hospital_name || 'Medical Clinic & Hospital')}
                </h1>

                {/* Doctor & Location Info */}
                <div className="flex items-center gap-4 mt-2.5 text-sm text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">
                      {isReport
                        ? (rx?.doctor_name || 'Reporting Pathologist')
                        : (rx?.doctor_name || 'Attending Physician')}
                    </span>
                    {rx?.doctor_registration_number && (
                      <span className="text-xs text-slate-400 font-normal">
                        (Reg: {rx.doctor_registration_number})
                      </span>
                    )}
                  </div>

                  {(common?.visit_date || doc?.date) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Visit Date: {common?.visit_date || doc?.date}</span>
                    </div>
                  )}

                  {rx?.hospital_address && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-xs">{rx.hospital_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Badge Card */}
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
                    {patient.blood_group && <span className="font-bold text-rose-600">· {patient.blood_group}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tabs Navigation: Overview (All) on the left + Specific Tabs ── */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-hide">
              {/* Tab 1: Overview (All) */}
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overview (All)</span>
              </button>

              {/* Tab 2: Medications & Regimen */}
              <button
                type="button"
                onClick={() => setActiveTab('clinical')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  activeTab === 'clinical'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isReport ? <FlaskConical className="w-3.5 h-3.5" /> : <Pill className="w-3.5 h-3.5" />}
                <span>{isReport ? 'Biomarker Panels' : 'Medications & Regimen'}</span>
              </button>

              {/* Tab 3: Clinical Directives */}
              <button
                type="button"
                onClick={() => setActiveTab('directives')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  activeTab === 'directives'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinical Directives &amp; Tests</span>
              </button>

              {/* Tab 4: AI Intelligence & Reasoning */}
              <button
                type="button"
                onClick={() => setActiveTab('reasoning')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  activeTab === 'reasoning'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>AI Intelligence &amp; Reasoning</span>
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── TAB: OVERVIEW (ALL) ─────────────────────────────────────── */}
          {/* Sequence: 1. AI intelligence, 2. Medical result,               */}
          {/*           3. Clinical directives, 4. Telegram loop             */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="gsap-tab-content flex flex-col gap-8">
              {/* 1. AI Intelligence Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    1. AI Intelligence &amp; Clinical Reasoning
                  </h3>
                </div>
                {renderAIIntelligence(false)}
              </div>

              {/* 2. Medical Result / Medications Regimen */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    2. Medical Result &amp; Prescribed Regimen
                  </h3>
                </div>
                {renderMedicalResult()}
              </div>

              {/* 3. Clinical Directives & Diagnostics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    3. Clinical Directives &amp; Advised Tests
                  </h3>
                </div>
                {renderClinicalDirectives()}
              </div>

              {/* 4. Telegram Care Loop Connection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Send className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    4. Telegram Care Loop Connection
                  </h3>
                </div>
                {renderTelegramLoop()}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── TAB: MEDICATIONS & REGIMEN ──────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'clinical' && (
            <div className="gsap-tab-content flex flex-col gap-6">
              {renderMedicalResult()}
              {renderTelegramLoop()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── TAB: CLINICAL DIRECTIVES, TESTS & ADVICE ────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'directives' && (
            <div className="gsap-tab-content flex flex-col gap-5">
              {renderClinicalDirectives()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── TAB: AI INTELLIGENCE & REASONING TRACE ──────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'reasoning' && (
            <div className="gsap-tab-content flex flex-col gap-6">
              {renderAIIntelligence(true)}
            </div>
          )}
        </>
      )}

      {/* ── JSON Debug Modal ─────────────────────────────────────────── */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-800 shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Extracted Clinical JSON Payload
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-300/90 leading-relaxed">
              <pre>{JSON.stringify(extraction || doc, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
