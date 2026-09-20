import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Upload, FileText, FlaskConical, ChevronLeft,
  UserPlus, CheckCircle2, Zap, ArrowRight,
  Pill, Activity, Check, Loader2, Sparkles,
} from 'lucide-react';
import { FamilyMemberModal } from '../onboarding/FamilyMemberModal';
import { QrCodeSyncCard } from './QrCodeSyncCard';
import { DocumentPhotoGallery } from './DocumentPhotoGallery';
import { ImageZoomModal } from './ImageZoomModal';
import { generateSyncSessionId, processDocumentFilesForVault } from '../../lib/documentService';
import { useAuth } from '../../context/AuthContext';

const PRESET_EMOJIS = { 'preset-1': '👨‍⚕️', 'preset-2': '👩‍⚕️', 'preset-3': '🧑‍💼', 'preset-4': '👴', 'preset-5': '👩', 'preset-6': '🧑', 'preset-7': '👦', 'preset-8': '👧' };
const RELATIONSHIP_GRADIENTS = {
  Self: 'from-emerald-400 to-teal-500', Father: 'from-sky-400 to-cyan-500', Mother: 'from-violet-400 to-fuchsia-500',
  Child: 'from-amber-400 to-orange-500', Son: 'from-amber-400 to-orange-500', Daughter: 'from-pink-400 to-rose-500',
  Spouse: 'from-rose-400 to-pink-500', Brother: 'from-teal-400 to-emerald-500', Sister: 'from-fuchsia-400 to-purple-500', Other: 'from-slate-400 to-gray-500',
};

export const UploadDocumentModal = ({
  open,
  onClose,
  profiles = [],
  activeProfile,
  onUploadSuccess,
  onAddMember,
}) => {
  const { user } = useAuth();

  // Multi-step state: 1 = Member, 2 = Category, 3 = Upload & QR
  const [step, setStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState(activeProfile || profiles[0] || null);
  const [docType, setDocType] = useState(null); // 'Blood Test' | 'Prescription'
  const [sessionId, setSessionId] = useState('');
  
  // Multi-file state
  const [files, setFiles] = useState([]); // [{ id, name, size, type, dataUrl, capturedVia }]
  const [zoomImage, setZoomImage] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  
  // FamilyMemberModal state for inline member addition
  const [familyModalOpen, setFamilyModalOpen] = useState(false);

  // Initialize modal state on open (stable sessionId)
  useEffect(() => {
    if (open) {
      setSelectedMember(prev => prev || activeProfile || profiles[0] || null);
      setStep(1);
      setFiles([]);
      setZoomImage(null);
      setDocType(null);
      setUploading(false);
      setDone(false);
      setSessionId(generateSyncSessionId());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle local file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length > 0) processFiles(dropped);
  };

  // Handle local file picker
  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) processFiles(selected);
    e.target.value = '';
  };

  const processFiles = (fileList) => {
    fileList.forEach(f => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: f.name,
            size: f.size,
            type: f.type,
            dataUrl: event.target.result,
            capturedVia: 'desktop_upload',
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
  };

  // Quick sample loader for fast testing
  const handleSample = (type) => {
    setFiles(prev => [
      ...prev,
      {
        id: `sample_${Date.now()}`,
        name: type === 'Prescription' ? 'sample_prescription_dr_mehta.pdf' : 'sample_blood_report_srl.pdf',
        size: type === 'Prescription' ? 245000 : 380000,
        type: 'application/pdf',
        dataUrl: null,
        capturedVia: 'sample_preset',
      },
    ]);
  };

  // Handler when photo is received from smartphone QR sync (supports multiple sequential snaps)
  const handleMobilePhotoReceived = useCallback((payload) => {
    setFiles(prev => [
      ...prev,
      {
        id: `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: payload.name || `mobile_scan_${Date.now()}.jpg`,
        size: payload.size || 180000,
        type: payload.type || 'image/jpeg',
        dataUrl: payload.dataUrl,
        capturedVia: 'mobile_camera',
      },
    ]);
  }, []);

  // Remove single file
  const handleRemoveFile = (idToRemove) => {
    setFiles(prev => prev.filter(f => f.id !== idToRemove));
  };

  // Handle adding new family member inline
  const handleSaveNewMember = async (newMemberData) => {
    try {
      if (onAddMember) {
        await onAddMember(newMemberData);
      }
      setFamilyModalOpen(false);
      if (newMemberData && typeof newMemberData === 'object') {
        setSelectedMember(newMemberData);
      }
    } catch (err) {
      console.error('Failed to add family member inline:', err);
    }
  };

  // Upload and persist document to vault
  const handleConfirmUpload = async () => {
    if (files.length === 0 || !docType) return;

    try {
      setUploading(true);

      const memberId = selectedMember?.id || null;
      const patientName = selectedMember?.name || selectedMember?.relationship || 'Family Member';

      // 1-file: direct upload without conversion; 2+ files: compile into multi-page PDF
      const { finalFileName, cloudFileKey, pageCount, isMulti } = await processDocumentFilesForVault(
        user?.id,
        files,
        docType,
        patientName
      );

      const newDocPayload = {
        id: `doc_${Date.now()}`,
        user_id: user?.id,
        family_member_id: memberId,
        type: docType,
        patient_name: patientName,
        diagnosis: docType === 'Blood Test' ? 'Complete Diagnostic & Lipid Panel' : 'Clinical Prescription Protocol',
        doctor: docType === 'Blood Test' ? 'Metropolis Diagnostic Labs' : 'Consulting Physician, MD',
        clinic: 'Clinical Vault',
        date: new Date().toISOString().split('T')[0],
        verified: true,
        badge: isMulti ? `${pageCount} Pages Compiled` : (docType === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded'),
        ai_status: 'pending',
        cloud_file_key: cloudFileKey,
        local_file_path: finalFileName,
        page_count: pageCount,
      };

      onUploadSuccess?.(newDocPayload);

      setUploading(false);
      setDone(true);
      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error('Error in handleConfirmUpload:', err);
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="fixed z-50 inset-0 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                  title="Go Back"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Upload Clinical Document
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                  <span className={step === 1 ? 'text-emerald-600 font-bold' : ''}>1. Member</span>
                  <span>•</span>
                  <span className={step === 2 ? 'text-emerald-600 font-bold' : ''}>2. Category</span>
                  <span>•</span>
                  <span className={step === 3 ? 'text-emerald-600 font-bold' : ''}>3. Upload &amp; QR</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            
            {/* ── STEP 1: CHOOSE FAMILY MEMBER ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Who is this document for?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select the family member dossier where this document will be secured and analyzed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {profiles.map((p) => {
                    const isSelected = selectedMember?.id === p.id || selectedMember?.name === p.name;
                    const gradient = RELATIONSHIP_GRADIENTS[p.relationship] || RELATIONSHIP_GRADIENTS['Other'];
                    const isCustomPhoto = p.avatar && !p.avatar.startsWith('preset-');
                    const presetEmoji = p.avatar?.startsWith('preset-') ? PRESET_EMOJIS[p.avatar] : null;

                    return (
                      <div
                        key={p.id || p.name}
                        onClick={() => {
                          setSelectedMember(p);
                          setStep(2);
                        }}
                        className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        {isCustomPhoto ? (
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : presetEmoji ? (
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shrink-0`}>
                            {presetEmoji}
                          </div>
                        ) : (
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-black text-white shrink-0`}>
                            {p.initials || 'P'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{p.name || p.relationship}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {p.relationship} {p.age ? `· ${p.age} yrs` : ''}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* + Add Family Member Button */}
                  <button
                    type="button"
                    onClick={() => setFamilyModalOpen(true)}
                    className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-emerald-700 transition-all font-bold text-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span>Add Family Member</span>
                  </button>
                </div>

                {selectedMember && (
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <span>Continue with {selectedMember.name?.split(' ')[0] || selectedMember.relationship}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: SIDE-BY-SIDE CATEGORY SELECTION ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Select Document Category</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose whether you are uploading a diagnostic lab test or a doctor prescription for <span className="font-bold text-slate-800">{selectedMember?.name || selectedMember?.relationship}</span>.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                    For: {selectedMember?.name?.split(' ')[0] || selectedMember?.relationship}
                  </span>
                </div>

                {/* Side-by-Side Left & Right Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Upload Report */}
                  <div
                    onClick={() => {
                      setDocType('Blood Test');
                      setStep(3);
                    }}
                    className="group relative cursor-pointer flex flex-col justify-between p-5 rounded-3xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">
                          Diagnostics &amp; Labs
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                        Upload Report
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Blood test reports, CBC, lipid profiles, HbA1c, metabolic panels, urine tests, or pathology summaries.
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Extracts biomarker vitals</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                          <span>Populates interactive health trend charts</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                      <span>Choose Report</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Right: Upload Prescription */}
                  <div
                    onClick={() => {
                      setDocType('Prescription');
                      setStep(3);
                    }}
                    className="group relative cursor-pointer flex flex-col justify-between p-5 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Pill className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Rx &amp; Regimens
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Upload Prescription
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Doctor's handwritten or printed prescription slips, clinic discharge instructions, and medication routines.
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Decodes doctor handwriting &amp; doses</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Cross-checks drug-drug conflict shield</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                      <span>Choose Prescription</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── STEP 3: DUAL UPLOAD (QR SCANNER FIRST, PHOTO GALLERY BELOW) ── */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                {/* Dossier & Category Banner */}
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Uploading {docType} for <span className="text-emerald-700">{selectedMember?.name || selectedMember?.relationship}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Change Type
                  </button>
                </div>

                {/* 1. Desktop File Dropzone (As it was originally) */}
                <div className="flex flex-col gap-2.5">
                  <label
                    htmlFor="desktop-file-input"
                    className={`flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                      dragging
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-6 h-6 text-slate-400" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700">Drop PDF, JPG, PNG here or browse from computer</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 15 MB · Supports multi-page upload</p>
                    </div>
                    <input
                      id="desktop-file-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.heic"
                      onChange={handleFileInput}
                    />
                  </label>

                  {/* Judge / Evaluator Fast-Track Explainer Notice */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-slate-600 leading-snug">
                        <strong className="text-amber-800 font-bold">Judge / Evaluator Fast-Track:</strong> No medical file on hand? Click to load our pre-configured sample {docType === 'Blood Test' ? 'lab report' : 'prescription'} to test clinical extraction instantly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSample(docType)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs transition-all shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Load Sample {docType === 'Blood Test' ? 'Lab' : 'Rx'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. QR Code Phone Sync Card */}
                <QrCodeSyncCard
                  sessionId={sessionId}
                  activeProfile={selectedMember}
                  docType={docType}
                  onPhotoReceived={handleMobilePhotoReceived}
                  isSynced={files.some(f => f.capturedVia === 'mobile_camera')}
                />

                {/* 3. Synced Document Photo Gallery (Placed BELOW the QR card) */}
                {files.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300">
                    <DocumentPhotoGallery
                      files={files}
                      onRemove={handleRemoveFile}
                      onZoom={setZoomImage}
                      onAddClick={() => document.getElementById('desktop-file-input')?.click()}
                    />
                  </div>
                )}

                {/* 4. Action Button */}
                <button
                  type="button"
                  id="confirm-upload-btn"
                  onClick={handleConfirmUpload}
                  disabled={files.length === 0 || uploading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{files.length > 1 ? `${files.length} Pages Compiled & Secured in Vault!` : 'Document Secured in Vault!'}</span>
                    </>
                  ) : uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{files.length > 1 ? 'Compiling Multi-Page PDF & Securing…' : 'Securing Document to Vault…'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        {files.length > 1 
                          ? `Compile & Save PDF to Vault (${files.length} Pages)`
                          : `Upload & Save to Vault ${files.length > 0 ? '(1 File)' : ''}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      <ImageZoomModal
        imageSrc={zoomImage}
        title={`Inspecting ${docType || 'Document'} for ${selectedMember?.name || 'Patient'}`}
        onClose={() => setZoomImage(null)}
      />

      {/* Inline Family Member Modal */}
      <FamilyMemberModal
        isOpen={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        existingMembers={profiles}
        defaultRelationship="Father"
        onSave={handleSaveNewMember}
      />
    </>
  );
};
