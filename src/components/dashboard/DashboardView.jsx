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
  const [profiles, setProfiles] = useState(PROFILES);
  const [activeProfile, setActiveProfile] = useState(profiles[0]);

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
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            documents={documents}
            medications={medications}
            events={CARE_LOOP_EVENTS}
          />
        )}

        {activeTab === 'health' && (
          <HealthSection 
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            medications={medications}
            biomarkers={biomarkers}
            conflicts={conflicts}
            events={CARE_LOOP_EVENTS}
          />
        )}

        {activeTab === 'family' && (
          <FamilySection 
            profiles={profiles}
            setProfiles={setProfiles}
            activeProfile={activeProfile}
            onProfileSelect={(p) => {
              setActiveProfile(p);
            }}
          />
        )}

      </div>

    </SidebarLayout>
  );
};
