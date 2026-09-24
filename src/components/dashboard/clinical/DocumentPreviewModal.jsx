import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, FileText, ZoomIn, ZoomOut,
  RotateCw, RefreshCw, ShieldCheck, FlaskConical, Pill
} from 'lucide-react';
import { getDocumentFileUrl } from '../../../lib/documentService';

/**
 * DocumentPreviewModal
 * Full-featured clinical lightbox & document viewer.
 * Allows patients and clinicians to inspect original uploaded prescription photos,
 * multi-page lab PDFs, or verified vault dossiers with zoom, rotate, and full-screen tools.
 */
export const DocumentPreviewModal = ({ doc, isOpen, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileName = doc?.file_name || doc?.local_file_path || (doc?.type === 'Blood Test' ? 'Lab_Report_Panel.pdf' : 'Prescription_Dossier.pdf');
  const isPdf = fileName?.toLowerCase().endsWith('.pdf') || doc?.type === 'application/pdf';
  const isBloodTest = doc?.type === 'Blood Test' || doc?.ai_analysis_result?.document_type === 'medical_report';

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !doc) {
      setFileUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setZoom(1);
    setRotation(0);

    const resolveUrl = async () => {
      // 1. Direct dataUrl or existing preview URL
      if (doc.dataUrl) {
        if (isMounted) {
          setFileUrl(doc.dataUrl);
          setLoading(false);
        }
        return;
      }
      if (doc.file_url || doc.url) {
        if (isMounted) {
          setFileUrl(doc.file_url || doc.url);
          setLoading(false);
        }
        return;
      }

      // 2. Cloud file key from Supabase Storage
      if (doc.cloud_file_key) {
        try {
          const url = await getDocumentFileUrl(doc.cloud_file_key);
          if (isMounted) {
            setFileUrl(url);
            setLoading(false);
          }
          return;
        } catch (err) {
          console.warn('Failed to resolve cloud URL:', err);
        }
      }

      if (isMounted) {
        setFileUrl(null);
        setLoading(false);
      }
    };

    resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, doc]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleOpenExternal = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isBloodTest ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isBloodTest ? <FlaskConical className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white truncate max-w-[280px] sm:max-w-md">
                  {fileName}
                </span>
                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isBloodTest ? 'bg-sky-500/10 text-sky-300 border-sky-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  {isBloodTest ? 'Lab Report' : 'Prescription'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Patient: <span className="text-slate-200 font-semibold">{doc?.patient_name || 'Patient'}</span> · Upload Date: {doc?.date || 'Recent'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {!isPdf && fileUrl && (
              <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-300 font-bold select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors border-l border-slate-700 ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Reset View"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {fileUrl && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 active:scale-95"
                title="Open document in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Open Full</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 hover:border-rose-500"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Document View Area ── */}
        <div className="relative flex-1 bg-slate-950/60 overflow-auto flex items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
              <p className="text-xs font-bold">Securing and loading document from vault…</p>
            </div>
          ) : fileUrl ? (
            isPdf ? (
              // Clean PDF Frame
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col">
                <iframe
                  src={fileUrl}
                  className="w-full flex-1 border-0 rounded-2xl bg-white"
                  title="Clinical Document PDF"
                />
              </div>
            ) : (
              // Zoomable Image
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                />
              </div>
            )
          ) : (
            // Sample / Demo Document Dossier (when direct binary is simulated or archived)
            <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center gap-5 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Verified Clinical Record</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  This document was analyzed and structured into clinical intelligence by Dosiq AI.
                </p>
              </div>

              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Record File:</span>
                  <span className="text-slate-200 font-bold truncate max-w-[200px]">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Document Type:</span>
                  <span className="text-emerald-400 font-bold">{doc?.type || 'Prescription'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient:</span>
                  <span className="text-slate-200 font-bold">{doc?.patient_name || 'Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Clinician / Facility:</span>
                  <span className="text-slate-200 font-bold">{doc?.doctor || doc?.clinic || doc?.hospital || 'Clinical Facility'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Security Vault:</span>
                  <span className="text-teal-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Encrypted
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                💡 Full structured medical extractions, dosage regimens, and biomarker indicators are available in the dashboard dossier.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>🔒 Dosiq AI Secure Clinical Vault · HIPAA &amp; NDHM Standard Encryption</span>
          <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
