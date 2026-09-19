import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, FlaskConical, Scan, BookOpen, Zap, CheckCircle2 } from 'lucide-react';

const DOC_TYPES = [
  { id: 'Prescription',      label: 'Prescription (Rx)', icon: FileText,     color: 'emerald' },
  { id: 'Blood Test',        label: 'Blood Test',         icon: FlaskConical, color: 'sky'     },
  { id: 'Scan',              label: 'Scan & Imaging',     icon: Scan,         color: 'violet'  },
  { id: 'Discharge Summary', label: 'Discharge Summary',  icon: BookOpen,     color: 'amber'   },
];

const COLOR_MAP = {
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  sky:     'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100',
  violet:  'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100',
  amber:   'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100',
};

const ACTIVE_MAP = {
  emerald: 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
  sky:     'border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-500/20',
  violet:  'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/20',
  amber:   'border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-500/20',
};

const QUICK_SAMPLES = [
  { key: 'rx',  label: '⚡ Sample Prescription', sub: 'Dr. Mehta · Hypertension · 2026' },
  { key: 'lab', label: '⚡ Sample Lab Report',    sub: 'SRL Diagnostics · HbA1c + Lipid · 2026' },
];

export const UploadDocumentModal = ({ open, onClose }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [docType, setDocType]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]         = useState(false);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => { setFile(null); setDocType(null); setUploading(false); setDone(false); }, 300);
    }
  }, [open]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileInput = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSample = (key) => {
    const fakeFile = { name: key === 'rx' ? 'sample_prescription.pdf' : 'sample_lab_report.pdf', size: 204800 };
    setFile(fakeFile);
    setDocType(key === 'rx' ? 'Prescription' : 'Blood Test');
  };

  const handleUpload = async () => {
    if (!file || !docType) return;
    setUploading(true);
    await new Promise(r => setTimeout(r, 1800));
    setUploading(false);
    setDone(true);
    setTimeout(() => onClose?.(), 1200);
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'modalIn 0.2s ease both' }}
      />

      {/* Modal */}
      <div
        className="fixed z-50 inset-0 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Upload clinical document"
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden"
          style={{ animation: 'modalIn 0.22s cubic-bezier(0.16,1,0.3,1) both' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Upload Clinical Document</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">dosiq AI will decode & extract data automatically</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Quick sample buttons */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judge-Friendly Fast Track</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_SAMPLES.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleSample(s.key)}
                    className="flex flex-col gap-0.5 text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white transition-all duration-150 border border-slate-700"
                  >
                    <span className="text-[11px] font-bold">{s.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">or upload your file</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Drop zone */}
            <label
              htmlFor="file-input"
              className={`flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-700">{file.name}</p>
                  <p className="text-[11px] text-slate-400">{file.size ? `${Math.round(file.size / 1024)} KB` : 'Sample file'}</p>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">Drop PDF or image here</p>
                  <p className="text-[11px] text-slate-400">PNG, JPG, HEIC, PDF — max 10 MB</p>
                </>
              )}
              <input id="file-input" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.heic" onChange={handleFileInput} />
            </label>

            {/* Doc type selector */}
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDocType(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    docType === id ? ACTIVE_MAP[color] : COLOR_MAP[color]
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Upload button */}
            <button
              type="button"
              id="confirm-upload-btn"
              onClick={handleUpload}
              disabled={!file || !docType || uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {done ? (
                <><CheckCircle2 className="w-4 h-4" /> Uploaded &amp; Queued for Analysis</>
              ) : uploading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              ) : (
                <><Zap className="w-4 h-4" /> Upload &amp; Extract with dosiq AI</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
