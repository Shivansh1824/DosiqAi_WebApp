import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { ClinicalVaultSection } from './ClinicalVaultSection';
import { UploadDocumentModal }  from './UploadDocumentModal';

export const MedicalSection = ({ activeProfile, documents = [] }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-emerald-500" />
          Medical Vault
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Secure document storage and AI extraction for <span className="text-slate-800 font-bold">{firstName}</span>.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <ClinicalVaultSection 
          documents={documents} 
          onUpload={() => setUploadOpen(true)} 
        />
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
      />
    </div>
  );
};
