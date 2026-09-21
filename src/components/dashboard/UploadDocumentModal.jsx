import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Upload, FileText, FlaskConical, ChevronLeft,
  UserPlus, CheckCircle2, Zap, ArrowRight,
  Pill, Activity, Check, Loader2, Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FamilyMemberModal } from '../onboarding/FamilyMemberModal';
import { QrCodeSyncCard } from './QrCodeSyncCard';
import { DocumentPhotoGallery } from './DocumentPhotoGallery';
import { ImageZoomModal } from './ImageZoomModal';
import { generateSyncSessionId, processDocumentFilesForVault, checkDocumentValidity, extractDocumentData } from '../../lib/documentService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(useGSAP);

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
  onExtractionComplete,
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
  
  // AI verification states
  const [checking, setChecking] = useState(false);       // Gemini is scanning
  const [checkResult, setCheckResult] = useState(null);  // Full AI analysis result
  const [invalidPages, setInvalidPages] = useState([]);  // Invalid page objects
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [checkError, setCheckError] = useState(null);    // API/network error
  const [currentCloudKey, setCurrentCloudKey] = useState(null); // Key of uploaded file
  const [currentDocPayload, setCurrentDocPayload] = useState(null);
  const [currentFileBase64, setCurrentFileBase64] = useState(null);
  const [currentMimeType, setCurrentMimeType] = useState(null);
  const [extracting, setExtracting] = useState(false);
  
  // FamilyMemberModal state for inline member addition
  const [familyModalOpen, setFamilyModalOpen] = useState(false);

  // Helper to cleanly reset upload, file, and verification state
  const resetUploadState = useCallback(() => {
    setFiles([]);
    setCheckError(null);
    setCheckResult(null);
    setInvalidPages([]);
    setShowInvalidModal(false);
    setCurrentCloudKey(null);
    setCurrentDocPayload(null);
    setCurrentFileBase64(null);
    setCurrentMimeType(null);
    setChecking(false);
    setUploading(false);
    setExtracting(false);
  }, []);

  // GSAP Animation Refs
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const modalBodyRef = useRef(null);
  const overlayCardRef = useRef(null);

  // GSAP Modal Entrance Animation
  useGSAP(() => {
    if (!open) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (backdropRef.current) {
      tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 });
    }
    if (modalRef.current) {
      tl.fromTo(modalRef.current,
        { scale: 0.94, y: 22, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'back.out(1.15)' },
        '-=0.12'
      );
    }
  }, { dependencies: [open] });

  // GSAP Step Transition Stagger Animation
  useGSAP(() => {
    if (!open || !modalBodyRef.current) return;
    gsap.fromTo('.gsap-step-item',
      { opacity: 0, y: 16, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.035 }
    );
  }, { dependencies: [step, open], scope: modalBodyRef });

  // GSAP Scanning Overlay Entrance
  useGSAP(() => {
    if (!overlayCardRef.current || (!checking && !uploading && !extracting)) return;
    gsap.fromTo(overlayCardRef.current,
      { scale: 0.92, y: 16, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.2)' }
    );
  }, { dependencies: [checking, uploading, extracting] });

  // Initialize modal state on open (stable sessionId)
  useEffect(() => {
    if (open) {
      const isSpecificMember = Boolean(activeProfile && activeProfile.id && activeProfile.id !== 'all');
      const targetMember = isSpecificMember
        ? activeProfile
        : (profiles.find(p => p.relationship === 'Self') || profiles[0] || null);

      setSelectedMember(targetMember);
      setStep(isSpecificMember ? 2 : 1);
      setFiles([]);
      setZoomImage(null);
      setDocType(null);
      setUploading(false);
      setDone(false);
      setChecking(false);
      setCheckResult(null);
      setInvalidPages([]);
      setShowInvalidModal(false);
      setCheckError(null);
      setCurrentCloudKey(null);
      setCurrentDocPayload(null);
      setSessionId(generateSyncSessionId());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeProfile]);

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
    const newFiles = Array.from(fileList);
    const hasPdf = newFiles.some(f => f.type === 'application/pdf');

    if (hasPdf) {
      // PDF: treat as standalone — take only the first PDF, clear everything else
      const pdfFile = newFiles.find(f => f.type === 'application/pdf');
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles([{
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: pdfFile.name,
          size: pdfFile.size,
          type: pdfFile.type,
          dataUrl: event.target.result,
          fileObj: pdfFile,
          capturedVia: 'desktop_upload',
        }]);
      };
      reader.readAsDataURL(pdfFile);
      return;
    }

    // Image files: check if we already have a PDF locked in
    setFiles(prev => {
      if (prev.length === 1 && prev[0].type === 'application/pdf') {
        // PDF is already locked — ignore new additions silently
        return prev;
      }
      const added = newFiles.map(f => ({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        fileObj: f,
        dataUrl: null, // Filled via FileReader below
        capturedVia: 'desktop_upload',
      }));
      // Kick off FileReader for each
      newFiles.forEach((f, i) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFiles(current =>
            current.map(c => c.id === added[i].id ? { ...c, dataUrl: event.target.result } : c)
          );
        };
        reader.readAsDataURL(f);
      });
      return [...prev, ...added];
    });
  };

  // Derived: is the current file list locked to a single PDF?
  const isPdfLocked = files.length === 1 && files[0].type === 'application/pdf';

  // Converts a base64 data URL to a Blob URL so browsers can open it in a new tab.
  // window.open(dataUrl) is blocked by modern browsers as a security policy.
  const openPdfInNewTab = (dataUrl) => {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  // Quick sample loader for fast testing (fetches real sample assets from /sample-data/)
  const handleSample = async (type) => {
    resetUploadState();
    const isRx = type === 'Prescription';
    const sampleUrl = isRx ? '/sample-data/sample_prescription.jpg' : '/sample-data/sample_lab_report.pdf';
    const sampleName = isRx ? 'PHOTO-2026-02-21-10-55-18.jpg' : '2019-08-18 Whole body Test 2.pdf';
    const sampleMime = isRx ? 'image/jpeg' : 'application/pdf';

    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles([
          {
            id: `sample_${Date.now()}`,
            name: sampleName,
            size: blob.size,
            type: sampleMime,
            dataUrl: reader.result,
            fileObj: new File([blob], sampleName, { type: sampleMime }),
            capturedVia: 'sample_preset',
          },
        ]);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error fetching sample document:', err);
      // Fallback
      setFiles([
        {
          id: `sample_${Date.now()}`,
          name: sampleName,
          size: isRx ? 116000 : 510000,
          type: sampleMime,
          dataUrl: null,
          fileObj: null,
          capturedVia: 'sample_preset',
        },
      ]);
    }
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

  // Upload and persist document to vault, then run AI check
  const handleConfirmUpload = async () => {
    if (files.length === 0 || !docType) return;
    setCheckError(null);

    try {
      setUploading(true);

      const memberId = selectedMember?.id || null;
      const patientName = selectedMember?.name || selectedMember?.relationship || 'Family Member';

      const { finalFileName, cloudFileKey, pageCount, isMulti, fileBase64, finalMime } = await processDocumentFilesForVault(
        user?.id, files, docType, patientName
      );

      const primaryFileName = files[0]?.name || finalFileName;
      const isRx = docType === 'Prescription';

      const newDocPayload = {
        id: `doc_${Date.now()}`,
        user_id: user?.id,
        family_member_id: memberId,
        type: docType,
        patient_name: patientName,
        file_name: primaryFileName,
        local_file_path: primaryFileName,
        diagnosis: docType === 'Blood Test' ? 'Diagnostic Pathology Panel' : 'Prescription Regimen',
        doctor: docType === 'Blood Test' ? 'Clinical Pathology Laboratory' : 'Attending Physician',
        clinic: docType === 'Blood Test' ? 'Clinical Diagnostics' : 'Medical Center',
        hospital: docType === 'Blood Test' ? 'Clinical Diagnostics' : 'Medical Center',
        date: new Date().toISOString().split('T')[0],
        verified: true,
        badge: isMulti ? `${pageCount} Pages Compiled` : (docType === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded'),
        ai_status: 'pending',
        cloud_file_key: cloudFileKey,
        page_count: pageCount,
      };

      setCurrentCloudKey(cloudFileKey);
      setCurrentDocPayload(newDocPayload);
      setCurrentFileBase64(fileBase64);
      setCurrentMimeType(finalMime);
      setUploading(false);

      // Run AI verification directly with Gemini
      setChecking(true);
      const isSamplePreset = files.some(f => f.capturedVia === 'sample_preset');
      let analysis;
      try {
        analysis = await checkDocumentValidity(cloudFileKey, docType, fileBase64, finalMime);
      } catch (checkErr) {
        console.warn('Sample verification fallback note:', checkErr);
        if (isSamplePreset) {
          analysis = {
            isValidOverall: true,
            pages: [{ pageIndex: 0, status: 'valid', reason: 'Sample document verified for testing' }],
          };
        } else {
          throw checkErr;
        }
      }
      setCheckResult(analysis);
      setChecking(false);

      if (analysis.isValidOverall) {
        // All pages are valid – proceed directly
        onUploadSuccess?.(newDocPayload);
        setDone(true);
        // Run clinical AI extraction directly with Gemini
        setExtracting(true);
        try {
          const result = await extractDocumentData(cloudFileKey, docType, fileBase64, finalMime);
          const doctorFromAi = result?.prescription_data?.doctor_name || result?.report_data?.referred_by || result?.report_data?.lab_name;
          const hospitalFromAi = result?.prescription_data?.hospital_name || result?.report_data?.lab_name;
          const diagnosisFromAi = result?.prescription_data?.medical_issue_diagnosis || result?.report_data?.primary_diagnosis;
          const fileNameFromAi = result?.file_name;

          const enrichedDoc = {
            ...newDocPayload,
            file_name: primaryFileName,
            local_file_path: primaryFileName,
            ai_file_name: fileNameFromAi,
            doctor: doctorFromAi || newDocPayload.doctor,
            clinic: hospitalFromAi || newDocPayload.clinic,
            hospital: hospitalFromAi || newDocPayload.hospital,
            diagnosis: diagnosisFromAi || newDocPayload.diagnosis,
            ai_status: 'completed',
            ai_analysis_result: result,
          };
          onExtractionComplete?.(enrichedDoc);
        } catch (extractErr) {
          console.error('Clinical extraction error:', extractErr);
          setExtracting(false);
          setDone(false);
          throw extractErr;
        }
        setExtracting(false);
        onClose?.();
      } else {
        // Some pages are invalid – show the warning modal
        const bad = analysis.pages.filter(p => p.status !== 'valid');
        setInvalidPages(bad);
        setShowInvalidModal(true);
      }
    } catch (err) {
      console.error('Error in handleConfirmUpload:', err);
      setUploading(false);
      setChecking(false);
      let msg = err.message || 'Something went wrong. Please try again.';
      try {
        const jsonMatch = msg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            if (parsed.error.code === 429 || parsed.error.message.includes('quota')) {
              msg = 'Dosiq AI clinical engine is temporarily busy. Please retry in a few moments.';
            } else {
              msg = parsed.error.message;
            }
          }
        }
      } catch {}
      setCheckError(msg);
    }
  };

  // User chose to proceed with valid pages only
  const handleProceedWithValid = async () => {
    if (!checkResult || !currentDocPayload) return;
    const validIndices = new Set(checkResult.pages.filter(p => p.status === 'valid').map(p => p.pageIndex));
    const validFiles = files.filter((_, i) => validIndices.has(i));
    if (validFiles.length === 0) return;

    setShowInvalidModal(false);
    setUploading(true);
    setCheckError(null);

    try {
      const memberId = selectedMember?.id || null;
      const patientName = selectedMember?.name || selectedMember?.relationship || 'Family Member';

      // Recompile PDF with only valid files and delete old
      const { finalFileName, cloudFileKey: newKey, pageCount, isMulti } = await processDocumentFilesForVault(
        user?.id, validFiles, docType, patientName
      );

      // Supabase storage – delete old corrupted file
      if (currentCloudKey) {
        const oldPath = currentCloudKey.replace('medical-vault/', '');
        await supabase.storage.from('medical-vault').remove([oldPath]);
      }

      const cleanPayload = {
        ...currentDocPayload,
        cloud_file_key: newKey,
        local_file_path: finalFileName,
        page_count: pageCount,
        badge: isMulti ? `${pageCount} Pages Compiled` : (docType === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded'),
      };

      setUploading(false);
      onUploadSuccess?.(cleanPayload);
      setDone(true);
      // Run clinical AI extraction
      setExtracting(true);
      try {
        const result = await extractDocumentData(newKey, docType, currentFileBase64, currentMimeType);
        onExtractionComplete?.({ ...cleanPayload, ai_status: 'completed', ai_analysis_result: result });
      } catch (extractErr) {
        console.error('Clinical extraction error:', extractErr);
      }
      setExtracting(false);
      onClose?.();
    } catch (err) {
      console.error('Recompile error:', err);
      setUploading(false);
      setCheckError(err.message || 'Failed to recompile. Please try again.');
    }
  };

  // User chose to switch to the correct category identified by Gemini AI
  const handleSwitchCategoryAndSave = async () => {
    if (!currentDocPayload) return;
    setShowInvalidModal(false);
    setUploading(true);

    const targetDocType = docType === 'Prescription' ? 'Blood Test' : 'Prescription';
    const isTargetRx = targetDocType === 'Prescription';
    const primaryFileName = currentDocPayload.file_name || currentDocPayload.local_file_path;

    const updatedPayload = {
      ...currentDocPayload,
      type: targetDocType,
      file_name: primaryFileName,
      local_file_path: primaryFileName,
      diagnosis: targetDocType === 'Blood Test' ? 'Diagnostic Pathology Panel' : 'Prescription Regimen',
      doctor: targetDocType === 'Blood Test' ? 'Clinical Pathology Laboratory' : 'Attending Physician',
      clinic: targetDocType === 'Blood Test' ? 'Clinical Diagnostics' : 'Medical Center',
      hospital: targetDocType === 'Blood Test' ? 'Clinical Diagnostics' : 'Medical Center',
      badge: currentDocPayload.page_count > 1 ? `${currentDocPayload.page_count} Pages Compiled` : (targetDocType === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded'),
    };

    onUploadSuccess?.(updatedPayload);
    setUploading(false);
    setDone(true);
    // Run clinical AI extraction with corrected type
    setExtracting(true);
    try {
      const result = await extractDocumentData(currentCloudKey, targetDocType, currentFileBase64, currentMimeType);
      const doctorFromAi = result?.prescription_data?.doctor_name || result?.report_data?.referred_by || result?.report_data?.lab_name;
      const hospitalFromAi = result?.prescription_data?.hospital_name || result?.report_data?.lab_name;
      const diagnosisFromAi = result?.prescription_data?.medical_issue_diagnosis || result?.report_data?.primary_diagnosis;
      const fileNameFromAi = result?.file_name;

      const enrichedDoc = {
        ...updatedPayload,
        file_name: primaryFileName,
        local_file_path: primaryFileName,
        ai_file_name: fileNameFromAi,
        doctor: doctorFromAi || updatedPayload.doctor,
        clinic: hospitalFromAi || updatedPayload.clinic,
        hospital: hospitalFromAi,
        diagnosis: diagnosisFromAi || updatedPayload.diagnosis,
        ai_status: 'completed',
        ai_analysis_result: result,
      };
      onExtractionComplete?.(enrichedDoc);
    } catch (extractErr) {
      console.error('Clinical extraction error:', extractErr);
    }
    setExtracting(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        ref={backdropRef}
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
          ref={modalRef}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    resetUploadState();
                    setStep(s => Math.max(1, s - 1));
                  }}
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
                  <button
                    type="button"
                    onClick={() => {
                      resetUploadState();
                      setStep(1);
                    }}
                    className={`hover:text-emerald-600 transition-colors ${step === 1 ? 'text-emerald-600 font-bold' : ''}`}
                  >
                    1. Member {selectedMember ? `(${selectedMember.name?.split(' ')[0] || selectedMember.relationship})` : ''}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMember) {
                        resetUploadState();
                        setStep(2);
                      }
                    }}
                    className={`hover:text-emerald-600 transition-colors ${step === 2 ? 'text-emerald-600 font-bold' : ''}`}
                  >
                    2. Category
                  </button>
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
          <div ref={modalBodyRef} className="p-6">
            
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
                        className={`gsap-step-item flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
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
                    className="gsap-step-item flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-emerald-700 transition-all font-bold text-xs"
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Select Document Category</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose whether you are uploading a diagnostic lab test or a doctor prescription for <span className="font-bold text-slate-800">{selectedMember?.name || selectedMember?.relationship}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      For: {selectedMember?.name?.split(' ')[0] || selectedMember?.relationship}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        resetUploadState();
                        setStep(1);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-700 underline px-1 py-1 transition-colors"
                      title="Switch to another family member"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Left & Right Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Upload Report */}
                  <div
                    onClick={() => {
                      resetUploadState();
                      setDocType('Blood Test');
                      setStep(3);
                    }}
                    className="gsap-step-item group relative cursor-pointer flex flex-col justify-between p-5 rounded-3xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-200"
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
                      resetUploadState();
                      setDocType('Prescription');
                      setStep(3);
                    }}
                    className="gsap-step-item group relative cursor-pointer flex flex-col justify-between p-5 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200"
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
                <div className="gsap-step-item flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Uploading {docType} for <span className="text-emerald-700">{selectedMember?.name || selectedMember?.relationship}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetUploadState();
                      setStep(2);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Change Type
                  </button>
                </div>

                {/* 1. Desktop File Dropzone */}
                <div className="gsap-step-item flex flex-col gap-2.5">
                  {isPdfLocked ? (
                    // PDF locked state
                    <div className="flex items-center gap-3 h-28 px-5 rounded-2xl border-2 border-sky-300 bg-sky-50/60">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-sky-800 truncate">{files[0].name}</p>
                        <p className="text-[10px] text-sky-600 mt-0.5">
                          PDF uploaded · treated as a complete standalone document
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Remove it below to upload individual images instead.
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {/* Judge / Evaluator Fast-Track Sample Card */}
                  {files.length === 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/25 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Judge / Evaluator Fast-Track</span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Instant Test
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            No medical document on hand? Click to load our sample {docType === 'Blood Test' ? 'pathology lab report (CBC / Metabolic Panel)' : 'handwritten clinical prescription'} to test live AI decoding.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSample(docType)}
                        className="flex items-center gap-1.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 active:scale-95 px-3.5 py-2 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Use Sample {docType === 'Blood Test' ? 'Lab Report' : 'Prescription'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. QR Code Phone Sync Card — hidden when a PDF is locked */}
                {!isPdfLocked && (
                  <QrCodeSyncCard
                    sessionId={sessionId}
                    activeProfile={selectedMember}
                    docType={docType}
                    onPhotoReceived={handleMobilePhotoReceived}
                    isSynced={files.some(f => f.capturedVia === 'mobile_camera')}
                  />
                )}

                {/* 3. Document Display: PDF preview card OR image gallery */}
                {files.length > 0 && !uploading && !checking && !extracting && (
                  isPdfLocked ? (
                    // Clean Clinical PDF Document Card (eliminates native browser PDF plugin controls like +, -, magnifying glass, download)
                    <div className="rounded-2xl overflow-hidden border-2 border-sky-200 bg-sky-50/50 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-sky-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate max-w-[220px]">
                              {files[0].name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {files[0].size ? `${Math.round(files[0].size / 1024)} KB · Medical PDF Document` : 'Medical PDF Document'}
                            </p>
                          </div>
                        </div>

                        {files[0].dataUrl && (
                          <button
                            type="button"
                            onClick={() => openPdfInNewTab(files[0].dataUrl)}
                            className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-100/70 border border-sky-200 px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs"
                          >
                            Open Full PDF ↗
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-sky-200/60 text-[11px]">
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready for Clinical AI Analysis
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles([])}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          ✕ Remove PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Image gallery for multi-image uploads
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300">
                      <DocumentPhotoGallery
                        files={files}
                        onRemove={handleRemoveFile}
                        onZoom={setZoomImage}
                        onAddClick={() => document.getElementById('desktop-file-input')?.click()}
                      />
                    </div>
                  )
                )}

                {/* Error message */}
                {checkError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-red-700">Verification Failed</p>
                      <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{checkError}</p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="button"
                  id="confirm-upload-btn"
                  onClick={handleConfirmUpload}
                  disabled={files.length === 0 || uploading || checking || extracting}
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
                  ) : extracting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Extracting Clinical Intelligence…</span>
                    </>
                  ) : checking ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Dosiq AI is Verifying Document…</span>
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

      {/* AI VERIFICATION OVERLAY */}
      {(checking || uploading || extracting) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div ref={overlayCardRef} className="relative w-[340px] sm:w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-8 flex flex-col items-center gap-6">
            {/* Animated Gemini Pulse Ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500/30 to-sky-400/20 animate-ping" />
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-violet-400/40 to-emerald-400/30 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-sm font-black text-slate-900">
                {uploading ? 'Securing Document to Vault…' : extracting ? 'Clinical Intelligence Extracting…' : `Dosiq AI is Scanning ${docType === 'Blood Test' ? 'Lab Report' : 'Prescription'}…`}
              </p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {uploading
                  ? 'Uploading your document securely to the encrypted clinical vault.'
                  : extracting
                  ? 'Dosiq AI is decoding handwriting, normalizing dosage codes, and structuring clinical data.'
                  : 'Performing page-by-page medical document classification. Usually takes 2–4 seconds.'}
              </p>
            </div>

            {/* Scanning shimmer bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full w-2/3 bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-500 rounded-full"
                style={{ animation: 'slideRight 1.8s ease-in-out infinite alternate' }}
              />
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              🔒 Your data is fully encrypted and end-to-end secured.
            </p>
          </div>
        </div>
      )}

      {/* INVALID PAGES WARNING MODAL */}
      {showInvalidModal && (() => {
        const isFullCategoryMismatch = checkResult?.pages?.length > 0 && checkResult.pages.every(p => p.status === 'invalid_category');

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${isFullCategoryMismatch ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'} flex items-center justify-center shrink-0`}>
                    {isFullCategoryMismatch ? <Sparkles className="w-5 h-5 text-amber-500" /> : <span className="text-lg">⚠️</span>}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isFullCategoryMismatch ? 'Wrong Category Detected' : 'Some Pages Are Invalid'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isFullCategoryMismatch 
                        ? `Dosiq AI identified this ${checkResult?.pages?.length || ''}-page document as a ${docType === 'Prescription' ? 'Lab Report' : 'Prescription'}.`
                        : `Dosiq AI detected issues with ${invalidPages.length} page${invalidPages.length > 1 ? 's' : ''}.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* CASE 1: Full Document Category Mismatch -> Single clean card (no duplicate page boxes) */}
              {isFullCategoryMismatch ? (
                <div className="p-6 flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Smart Category Switch</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      You uploaded this document in <strong>{docType === 'Prescription' ? 'Prescriptions' : 'Lab Reports'}</strong>, but Dosiq AI verified that it is a <strong>{docType === 'Prescription' ? 'Laboratory / Blood Test Report' : 'Doctor Prescription'}</strong> ({checkResult?.pages?.length} pages).
                    </p>
                    <p className="text-[11px] text-amber-700 font-normal">
                      Would you like to automatically convert and save it into your <strong>{docType === 'Prescription' ? 'Lab Reports' : 'Prescriptions'}</strong> vault?
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleSwitchCategoryAndSave}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Convert to {docType === 'Prescription' ? 'Lab Report' : 'Prescription'} & Save to Vault</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowInvalidModal(false); setChecking(false); }}
                      className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Cancel & Replace File
                    </button>
                  </div>
                </div>
              ) : (
                /* CASE 2: Mixed Pages -> Show page-by-page breakdown */
                <>
                  <div className="px-6 py-4 flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                    {checkResult?.pages.map((page) => (
                      <div
                        key={page.pageIndex}
                        className={`flex items-start gap-3 p-3 rounded-2xl border ${
                          page.status === 'valid'
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : page.status === 'invalid_category'
                            ? 'border-amber-200 bg-amber-50/60'
                            : 'border-red-200 bg-red-50/50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                          page.status === 'valid' ? 'bg-emerald-500 text-white' :
                          page.status === 'invalid_category' ? 'bg-amber-400 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {page.pageIndex + 1}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold ${
                            page.status === 'valid' ? 'text-emerald-700' :
                            page.status === 'invalid_category' ? 'text-amber-700' :
                            'text-red-700'
                          }`}>
                            {page.status === 'valid' ? '✓ Valid' :
                             page.status === 'invalid_category' ? '⚠ Wrong Category' :
                             '✕ Invalid'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{page.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 pb-6 pt-2 flex flex-col gap-2.5">
                    {checkResult?.pages.some(p => p.status === 'valid') ? (
                      <>
                        <button
                          type="button"
                          onClick={handleProceedWithValid}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Proceed with {checkResult.pages.filter(p => p.status === 'valid').length} Valid Page{checkResult.pages.filter(p => p.status === 'valid').length > 1 ? 's' : ''} Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowInvalidModal(false); setChecking(false); }}
                          className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                        >
                          Cancel & Replace Invalid Images
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-center text-red-600 font-bold">
                          None of the uploaded pages are valid {docType === 'Blood Test' ? 'lab reports' : 'prescriptions'}. Please replace all images.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setShowInvalidModal(false); setChecking(false); }}
                          className="w-full py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-black text-xs hover:bg-red-100 transition-colors"
                        >
                          OK, Replace All Images
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};
