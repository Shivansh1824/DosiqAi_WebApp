import React, { useState, useEffect } from 'react';
import {
  FileText, FlaskConical, Scan, BookOpen,
  Zap, CheckCircle2, Clock, Filter, Download, Stethoscope
} from 'lucide-react';

// ─── Doc type config ──────────────────────────────────────────────────────────

const TYPE_META = {
  'Prescription':      { icon: FileText,    color: 'emerald', label: 'Prescription (Rx)' },
  'Blood Test':        { icon: FlaskConical, color: 'sky',     label: 'Blood Test'        },
  'Scan':              { icon: Scan,         color: 'violet',  label: 'Scan & Imaging'    },
  'Discharge Summary': { icon: BookOpen,     color: 'amber',   label: 'Discharge Summary' },
};

const DOC_COLOR = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  sky:     { bg: 'bg-sky-50',     icon: 'text-sky-600',     border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-700'     },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
};

const ALL_TYPES = ['All', 'Prescription', 'Blood Test', 'Scan', 'Discharge Summary'];

// ─── Demo extraction animation state ─────────────────────────────────────────

const EXTRACTION_STAGES = [
  'Detecting clinical document structure...',
  'Transcribing handwritten doctor script...',
  'Extracting medications, dosages & timing...',
  'Running drug-drug interaction shield...',
  'Finalizing clinical directives & care loop...',
];

const SampleExtractionFlow = ({ type = 'Prescription', onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => {
        if (prev < EXTRACTION_STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => onComplete?.(), 400);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="bg-gradient-to-br from-emerald-950 to-teal-900 text-white rounded-2xl p-5 border border-emerald-700/60 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
            AI Clinical Analysis Engine
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-400">
          Stage {stage + 1}/{EXTRACTION_STAGES.length}
        </span>
      </div>

      <p className="text-sm font-semibold text-white">
        {EXTRACTION_STAGES[stage]}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
          style={{ width: `${Math.round(((stage + 1) / EXTRACTION_STAGES.length) * 100)}%` }}
        />
      </div>
    </div>
  );
};

// ─── Document Card ────────────────────────────────────────────────────────────

const DocCard = ({ doc, onClick }) => {
  const meta = TYPE_META[doc.type] || TYPE_META['Prescription'];
  const color = DOC_COLOR[meta.color] || DOC_COLOR.emerald;
  const Icon = meta.icon;
  const ai = doc.ai_analysis_result;
  const isRx = doc.type === 'Prescription';
  const isBloodTest = doc.type === 'Blood Test';

  // 1. Primary File Name
  const uploadedFileName = doc.local_file_path || 
    doc.file_name || 
    doc.original_filename || 
    doc.name || 
    (doc.cloud_file_key ? doc.cloud_file_key.split('/').pop() : null) ||
    (isRx ? 'prescription_dossier.pdf' : 'lab_report_panel.pdf');

  const displayFileName = uploadedFileName.includes('/') 
    ? uploadedFileName.split('/').pop() 
    : uploadedFileName;

  // 2. AI-decoded title from JSON
  const jsonFileName = ai?.file_name || 
    doc.ai_file_name || 
    (doc.diagnosis && !doc.diagnosis.includes('Protocol') && !doc.diagnosis.includes('Record')
      ? `${doc.patient_name || 'Patient'} - ${doc.diagnosis} ${isRx ? 'Prescription' : 'Report'}`
      : null) ||
    (doc.file_name && !doc.file_name.toLowerCase().startsWith('photo') && !doc.file_name.toLowerCase().endsWith('.jpg') && !doc.file_name.toLowerCase().endsWith('.jpeg') && !doc.file_name.toLowerCase().endsWith('.png') ? doc.file_name : null) ||
    (isRx ? 'Prescription Clinical Dossier' : 'Diagnostic Lab Analysis');

  // 3. Doctor / Lab name
  const doctorName = ai?.prescription_data?.doctor_name || 
    ai?.report_data?.referred_by || 
    ai?.report_data?.lab_name || 
    (doc.doctor && !doc.doctor.includes('Consulting') ? doc.doctor : null) ||
    (doc.issued_by && !doc.issued_by.includes('Consulting') ? doc.issued_by : null) ||
    (isRx ? 'Dr. R. Mehta, MD (Cardiology)' : 'Metropolis Healthcare Labs');

  // 4. Hospital / Lab name
  const hospitalName = ai?.prescription_data?.hospital_name || 
    ai?.report_data?.lab_name || 
    doc.hospital || 
    (doc.clinic && doc.clinic !== 'Clinical Vault' ? doc.clinic : null);

  // 5. Abnormality data (Blood Test only)
  const totalAbnormalities = ai?.report_data?.total_abnormalities ?? null;
  const totalTests = (ai?.report_data?.grouped_metrics || []).reduce((acc, p) => acc + p.metrics.length, 0);

  const dateFormatted = doc.date
    ? new Date(doc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div 
      className={`flex flex-col justify-between gap-3.5 p-4 rounded-2xl bg-white border ${color.border} hover:shadow-md transition-all duration-200 group cursor-pointer`}
      onClick={() => onClick?.(doc)}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-9 h-9 rounded-xl ${color.bg} ${color.icon} flex items-center justify-center shrink-0 border ${color.border}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${color.badge}`}>
              {meta.label}
            </span>
            {/* Abnormality count badge for Blood Tests */}
            {isBloodTest && totalAbnormalities !== null && (
              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${
                totalAbnormalities > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {totalAbnormalities > 0 ? `${totalAbnormalities} Abnormal` : 'All Normal'}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button 
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors" 
                aria-label="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Primary Title */}
          <h4 className="text-sm font-black text-slate-900 leading-snug tracking-tight" title={jsonFileName}>
            {jsonFileName}
          </h4>

          {/* Doctor / Lab info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 flex-wrap">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-800">{doctorName}</span>
            {hospitalName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500">{hospitalName}</span>
              </>
            )}
          </div>

          {/* Blood test stats row */}
          {isBloodTest && totalTests > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{totalTests} parameters tested</span>
              {totalAbnormalities > 0 && (
                <span className="text-[10px] text-rose-500 font-bold">· {totalAbnormalities} out of range</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2.5">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {dateFormatted}
        </span>
        {doc.verified && (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> {doc.badge}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Clinical Vault Section ───────────────────────────────────────────────────

export const ClinicalVaultSection = ({ documents = [], onUpload, onDocumentAdded, onDocumentClick }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [extractingType, setExtractingType] = useState(null);
  const [extractionDone, setExtractionDone] = useState({ rx: false, lab: false });

  const filtered = activeFilter === 'All'
    ? documents
    : documents.filter(d => d.type === activeFilter);

  const handleSample = (type) => {
    if (extractingType) return;
    setExtractingType(type);
  };

  const handleExtractionComplete = (type) => {
    setExtractingType(null);
    setExtractionDone(prev => ({ ...prev, [type]: true }));

    const isRx = type === 'rx';
    const sampleFileName = isRx ? 'Sample_Prescription_Cardiology.jpg' : '2019-08-18 Whole body Test 2.pdf';
    const sampleJsonFileName = isRx ? 'Alex Sharma - Cardiac Follow-up Prescription - 21 Sep 2026' : 'Alex Sharma - Comprehensive Metabolic & Lipid Panel - 21 Sep 2026';
    const sampleDoctor = isRx ? 'Dr. R. Mehta, MD (Cardiology)' : 'Dr. S. K. Gupta, MD (Pathologist)';
    const sampleClinic = isRx ? 'Apollo Heart & Clinical Institute' : 'Metropolis Healthcare Labs';
    const sampleDiagnosis = isRx ? 'Essential Hypertension & Cardiac Care' : 'Complete Metabolic & Lipid Profile';

    onDocumentAdded?.({
      id: `doc_${Date.now()}`,
      type: isRx ? 'Prescription' : 'Blood Test',
      file_name: sampleFileName,
      local_file_path: sampleFileName,
      ai_file_name: sampleJsonFileName,
      diagnosis: sampleDiagnosis,
      doctor: sampleDoctor,
      clinic: sampleClinic,
      hospital: sampleClinic,
      date: new Date().toISOString().split('T')[0],
      verified: true,
      badge: isRx ? 'Rx Decoded' : 'Lab Analyzed',
      ai_status: 'completed',
    });
  };

  return (
    <section id="vault-section" className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Clinical Vault
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {documents.length} document{documents.length !== 1 ? 's' : ''} secured · End-to-end encrypted
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {ALL_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveFilter(type)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
              activeFilter === type
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Document grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(doc => (
            <DocCard key={doc.id} doc={doc} onClick={onDocumentClick} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center bg-white border border-slate-100 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-200" />
          <p className="text-sm font-bold text-slate-700">No documents yet</p>
          <p className="text-xs text-slate-400 max-w-xs">Upload prescriptions, lab reports, scans, or discharge summaries to build your family health vault.</p>
          <button type="button" onClick={onUpload} className="mt-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
            Upload Document
          </button>
        </div>
      )}
    </section>
  );
};
