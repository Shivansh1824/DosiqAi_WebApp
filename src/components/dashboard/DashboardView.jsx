import React, { useState, useEffect } from 'react';
import { SidebarLayout }  from './SidebarLayout';
import { WorldSection }   from './WorldSection';
import { MedicalSection } from './MedicalSection';
import { HealthSection }  from './HealthSection';
import { FamilySection }  from './FamilySection';

import {
  PROFILES, MEDICATIONS, DOCUMENTS,
  BIOMARKERS, DRUG_CONFLICTS, CARE_LOOP_EVENTS,
} from './mockClinicalData';

export const DashboardView = () => {
  // Global State
  const [activeTab, setActiveTab] = useState('world');
  const [activeProfile, setActiveProfile] = useState(PROFILES[0]);

  // Data slices for the active profile
  const profileKey = activeProfile?.id || 'self';
  const medications = MEDICATIONS[profileKey] || [];
  const documents   = DOCUMENTS[profileKey]   || [];
  const biomarkers  = BIOMARKERS[profileKey]  || {};
  const conflicts   = DRUG_CONFLICTS[profileKey] || [];

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <SidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
      
      {/* ── Router Logic ── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        
        {activeTab === 'world' && (
          <WorldSection 
            onNavigate={setActiveTab} 
          />
        )}

        {activeTab === 'medical' && (
          <MedicalSection 
            activeProfile={activeProfile}
            documents={documents}
          />
        )}

        {activeTab === 'health' && (
          <HealthSection 
            activeProfile={activeProfile}
            medications={medications}
            biomarkers={biomarkers}
            conflicts={conflicts}
            events={CARE_LOOP_EVENTS}
          />
        )}

        {activeTab === 'family' && (
          <FamilySection 
            profiles={PROFILES}
            activeProfile={activeProfile}
            onProfileSelect={(p) => {
              setActiveProfile(p);
              // Optional: auto-navigate to health or medical after selecting
              // setActiveTab('health');
            }}
          />
        )}

      </div>

    </SidebarLayout>
  );
};
