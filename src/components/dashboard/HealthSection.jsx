import React from 'react';
import { HeartPulse } from 'lucide-react';
import { ActiveRegimenSection } from './ActiveRegimenSection';
import { ConflictShieldBanner } from './ConflictShieldBanner';
import { LabTrendsSection }     from './LabTrendsSection';
import { CareLoopSection }      from './CareLoopSection';
import { QuickProfileSwitcher } from './QuickProfileSwitcher';

export const HealthSection = ({ profiles, activeProfile, onProfileSelect, medications = [], biomarkers = {}, conflicts = [], events = [] }) => {
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-rose-500" />
            Health &amp; Wellness
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Active regimen, lab trends, and Telegram care loop for <span className="text-slate-800 font-bold">{firstName}</span>.
          </p>
        </div>
        
        <QuickProfileSwitcher 
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileSelect={onProfileSelect}
        />
      </div>

      {/* Conflict Shield Banner - full width */}
      <ConflictShieldBanner conflicts={conflicts} />

      {/* Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3): Regimen + Trends */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <ActiveRegimenSection medications={medications} onUpload={() => {}} />
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <LabTrendsSection biomarkers={biomarkers} />
          </div>
        </div>

        {/* Right Column (1/3): Care Loop */}
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
    </div>
  );
};
