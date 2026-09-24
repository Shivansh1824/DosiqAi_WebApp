import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import { ClinicalVaultSection } from './ClinicalVaultSection';
import { UploadDocumentModal }  from './UploadDocumentModal';
import { QuickProfileSwitcher } from './QuickProfileSwitcher';
import { ClinicalAnalysisScreen } from './clinical/ClinicalAnalysisScreen';
import { LabReportAnalysisScreen } from './clinical/LabReportAnalysisScreen';
import { extractDocumentData } from '../../lib/documentService';
import { reconcileReportBiomarkers } from '../../lib/biomarkerReconciliationService';

export const MedicalSection = ({
  profiles,
  activeProfile,
  onProfileSelect,
  documents = [],
  onDocumentAdded,
  onAddMember,
  initialDoc = null,
  onClearInitialDoc,
  onAnalysisStateChange,
  onStartMedicine,
  onLogDose,
}) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [analysisDoc, setAnalysisDoc] = useState(initialDoc);
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

  useEffect(() => {
    if (initialDoc) {
      setAnalysisDoc(initialDoc);
    }
  }, [initialDoc]);

  // Inform parent layout when document analysis view opens or closes
  useEffect(() => {
    if (onAnalysisStateChange) {
      onAnalysisStateChange(Boolean(analysisDoc));
    }
  }, [analysisDoc, onAnalysisStateChange]);

  // Handle hardware back button for modals and analysis overlays
  useEffect(() => {
    // Push state when opening an overlay
    if (uploadOpen || analysisDoc) {
      window.history.pushState({ isOverlayOpen: true }, '', window.location.pathname + window.location.search + '#view');
    }

    const handlePopState = (e) => {
      // If back button clicked, close whichever overlay is open
      if (uploadOpen) {
        setUploadOpen(false);
      } else if (analysisDoc) {
        setAnalysisDoc(null);
        if (onClearInitialDoc) onClearInitialDoc();
        if (onAnalysisStateChange) onAnalysisStateChange(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [uploadOpen, analysisDoc, onClearInitialDoc, onAnalysisStateChange]);

  const handleDocumentClick = async (doc) => {
    if (doc.ai_analysis_result || !doc.cloud_file_key) {
      setAnalysisDoc(doc);
    } else {
      // Need to extract - open in loading state
      setAnalysisDoc({ ...doc, isExtracting: true });
      try {
        const result = await extractDocumentData(doc.cloud_file_key, doc.type);
        setAnalysisDoc({
          ...doc,
          ai_analysis_result: result,
          isExtracting: false,
          trends_status: doc.type === 'Blood Test' ? 'calculating' : 'completed',
        });
        if (doc.type === 'Blood Test' && result?.report_data) {
          (async () => {
            try {
              const reconciliation = await reconcileReportBiomarkers(result, {
                userId: doc.user_id,
                familyMemberId: doc.family_member_id || activeProfile?.id,
                documentId: doc.id,
                reportDate: result?.common_data?.visit_date || result?.report_data?.report_date || doc.date || doc.visit_date,
                labName: doc.clinic || doc.doctor || 'Diagnostic Lab',
              });
              window.dispatchEvent(new CustomEvent('dosiq:biomarkers-reconciled', {
                detail: { documentId: doc.id, result, reconciliation },
              }));
            } catch (recErr) {
              console.warn('Reconcile on document click note:', recErr);
            }
          })();
        }
      } catch (err) {
        console.error('Extraction failed on click:', err);
        setAnalysisDoc({ ...doc, isExtracting: false });
      }
    }
  };

  const handleBackFromAnalysis = () => {
    setAnalysisDoc(null);
    if (onClearInitialDoc) onClearInitialDoc();
    if (onAnalysisStateChange) onAnalysisStateChange(false);
    
    // Clean up the history state we pushed
    if (window.history.state?.isOverlayOpen) {
      window.history.back();
    }
  };

  // Route to the correct screen based on document type
  if (analysisDoc) {
    const isLabReport = analysisDoc.type === 'Blood Test' ||
      analysisDoc.ai_analysis_result?.document_type === 'medical_report';
    const allReportDocs = (() => {
      const list = (documents || []).filter(d =>
        d.type === 'Blood Test' && d.ai_analysis_result?.report_data
      );
      const exists = list.some(d =>
        d.id === analysisDoc.id || (d.cloud_file_key && d.cloud_file_key === analysisDoc.cloud_file_key)
      );
      if (!exists && analysisDoc?.ai_analysis_result?.report_data) {
        return [analysisDoc, ...list];
      }
      return list.map(d =>
        (d.id === analysisDoc.id || (d.cloud_file_key && d.cloud_file_key === analysisDoc.cloud_file_key))
          ? { ...d, ...analysisDoc }
          : d
      );
    })();

    if (isLabReport) {
      return (
        <LabReportAnalysisScreen
          doc={analysisDoc}
          onBack={handleBackFromAnalysis}
          isExtracting={analysisDoc?.isExtracting}
          allReportDocs={allReportDocs}
        />
      );
    }

    return (
      <ClinicalAnalysisScreen
        doc={analysisDoc}
        onBack={handleBackFromAnalysis}
        isExtracting={analysisDoc?.isExtracting}
        onStartMedicine={onStartMedicine}
        onLogDose={onLogDose}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-500" />
            Clinical Records
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Secure AI-decoded documents and pathology reports for <span className="text-slate-800 font-bold">{firstName}</span>.
          </p>
        </div>

        <QuickProfileSwitcher
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileSelect={onProfileSelect}
        />
      </div>

      {/* Full-width Clinical Documents Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <ClinicalVaultSection
          documents={documents}
          onUpload={() => setUploadOpen(true)}
          onDocumentAdded={onDocumentAdded}
          onDocumentClick={handleDocumentClick}
        />
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          if (window.history.state?.isOverlayOpen) window.history.back();
        }}
        profiles={profiles}
        activeProfile={activeProfile}
        onUploadSuccess={onDocumentAdded}
        onExtractionComplete={(doc) => {
          setUploadOpen(false);
          setAnalysisDoc(doc);
          onDocumentAdded?.(doc);
        }}
        onAddMember={onAddMember}
      />
    </div>
  );
};
