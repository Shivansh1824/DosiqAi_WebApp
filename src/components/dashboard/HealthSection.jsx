import React, { useState } from 'react';
import { HeartPulse, Pill, Activity, Send, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { ActiveRegimenSection } from './ActiveRegimenSection';
import { ConflictShieldBanner } from './ConflictShieldBanner';
import { LabTrendsSection }     from './LabTrendsSection';
import { CareLoopSection }      from './CareLoopSection';
import { QuickProfileSwitcher } from './QuickProfileSwitcher';

export const HealthSection = ({ 
  profiles, 
  activeProfile, 
  onProfileSelect, 
  medications = [], 
  documents = [],
  biomarkers = {}, 
  reportDocs = [],
  conflicts = [], 
  events = [],
  onSyncMedicine,
  onCompleteMedicine,
  onActionMedicine
}) => {
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' | 'biomarkers'
  const firstName = activeProfile?.name?.split(' ')[0] || activeProfile?.relationship || 'this profile';

  const totalMedsCount = medications.length;
  const activeMedsCount = medications.filter(m => m.status === 'active' || m.is_synced).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-600" />
            Health &amp; Wellness
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Clinical medication center, Telegram care loop live sync, and biomarker trends for <span className="text-slate-800 font-bold">{firstName}</span>.
          </p>
        </div>
        
        <QuickProfileSwitcher 
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileSelect={onProfileSelect}
        />
      </div>

      {/* Top Level Section Switcher: Medicines vs Biomarkers */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('medicines')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'medicines'
              ? 'bg-white text-emerald-950 shadow-sm shadow-slate-200 border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-600" />
          <span>Medicines</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'medicines' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {totalMedsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('biomarkers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'biomarkers'
              ? 'bg-white text-sky-950 shadow-sm shadow-slate-200 border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Biomarkers</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'biomarkers' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
          }`}>
            Lab Trends
          </span>
        </button>
      </div>

      {/* ─── SECTION 1: MEDICINES & CARE LOOP ──────────────────────────────── */}
      {activeTab === 'medicines' && (
        <>
          {/* Conflict Shield Banner */}
          <ConflictShieldBanner conflicts={conflicts} />

          {/* 2-Column Bento: Left (2/3) Regimen & Prescriptions, Right (1/3) Care Loop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <ActiveRegimenSection 
                  medications={medications}
                  onSyncMedicine={onSyncMedicine}
                  onCompleteMedicine={onCompleteMedicine}
                  onAction={onActionMedicine}
                />
              </div>
            </div>

            {/* Right: Care Loop attached ONLY to Medicines */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-24">
                <CareLoopSection 
                  profile={activeProfile}
                  medications={medications.filter(m => m.status === 'active' || m.is_synced)}
                  events={events}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── SECTION 2: BIOMARKERS (Care Loop is NOT attached here) ──────────── */}
      {activeTab === 'biomarkers' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <LabTrendsSection biomarkers={biomarkers} documents={reportDocs} />
          </div>
        </div>
      )}
    </div>
  );
};
