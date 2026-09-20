import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { ClinicalVaultSection } from './ClinicalVaultSection';
import { UploadDocumentModal }  from './UploadDocumentModal';
import { CareLoopSection }      from './CareLoopSection';
import { QuickProfileSwitcher } from './QuickProfileSwitcher';
import { ClinicalAnalysisModal } from './ClinicalAnalysisModal';
import { extractDocumentData } from '../../lib/documentService';

export const MedicalSection = ({
  profiles,
  activeProfile,
  onProfileSelect,
  documents = [],
  medications = [],
  events = [],
  onDocumentAdded,
  onAddMember,
}) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [analysisDoc, setAnalysisDoc] = useState(null);
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

  const handleDocumentClick = async (doc) => {
    if (doc.ai_analysis_result || !doc.cloud_file_key) {
      setAnalysisDoc(doc);
    } else {
      // Need to extract - open in loading state
      setAnalysisDoc({ ...doc, isExtracting: true });
      try {
        const result = await extractDocumentData(doc.cloud_file_key, doc.type);
        setAnalysisDoc({ ...doc, ai_analysis_result: result, isExtracting: false });
      } catch (err) {
        console.error('Extraction failed on click:', err);
        setAnalysisDoc({ ...doc, isExtracting: false });
      }
    }
  };

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
            Secure AI-decoded documents and care loop for <span className="text-slate-800 font-bold">{firstName}</span>.
          </p>
        </div>

        <QuickProfileSwitcher
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileSelect={onProfileSelect}
        />
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Documents (left, 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <ClinicalVaultSection
            documents={documents}
            onUpload={() => setUploadOpen(true)}
            onDocumentAdded={onDocumentAdded}
            onDocumentClick={handleDocumentClick}
          />
        </div>

        {/* Care Loop Panel (right, 1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-24">
            <CareLoopSection
              profile={activeProfile}
              medications={medications}
              events={events}
            />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onUploadSuccess={onDocumentAdded}
        onExtractionComplete={(doc) => {
          setUploadOpen(false);
          setAnalysisDoc(doc);
        }}
        onAddMember={onAddMember}
      />

      {/* Analysis Modal */}
      <ClinicalAnalysisModal
        open={!!analysisDoc}
        onClose={() => setAnalysisDoc(null)}
        doc={analysisDoc}
        isExtracting={analysisDoc?.isExtracting}
      />
    </div>
  );
};
