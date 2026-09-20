import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { ClinicalVaultSection } from './ClinicalVaultSection';
import { UploadDocumentModal }  from './UploadDocumentModal';
import { CareLoopSection }      from './CareLoopSection';
import { QuickProfileSwitcher } from './QuickProfileSwitcher';

export const MedicalSection = ({ profiles, activeProfile, onProfileSelect, documents = [], medications = [], events = [], onDocumentAdded }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

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
        activeProfile={activeProfile}
        onUploadSuccess={onDocumentAdded}
      />
    </div>
  );
};
