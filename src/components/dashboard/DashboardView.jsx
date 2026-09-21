import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { SidebarLayout }  from './SidebarLayout';
import { WorldSection }   from './WorldSection';
import { MedicalSection } from './MedicalSection';
import { HealthSection }  from './HealthSection';
import { FamilySection }  from './FamilySection';
import { Loader2 }        from 'lucide-react';

const formatProfile = (m, memberVitals = {}) => {
  const birthYear = m.date_of_birth ? new Date(m.date_of_birth).getFullYear() : null;
  const calculatedAge = birthYear ? (new Date().getFullYear() - birthYear) : (m.age ? Number(m.age) : null);
  
  return {
    id: m.id,
    name: m.name || m.relationship,
    relationship: m.relationship || 'Other',
    initials: m.name
      ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : (m.relationship || 'P')[0],
    avatar: m.avatar_url,
    date_of_birth: m.date_of_birth || '',
    age: calculatedAge,
    gender: m.gender || 'male',
    marital_status: memberVitals.marital_status || m.marital_status || (m.relationship === 'Self' ? 'Single' : 'Married'),
    mobile_number: m.phone_number,
    phone_number: m.phone_number,
    blood_group: memberVitals.blood_group || m.blood_group || '',
    weight: memberVitals.weight || m.weight || '',
    height: memberVitals.height || m.height || '',
    morning_dose_time: m.morning_dose_time ? m.morning_dose_time.slice(0, 5) : '08:00',
    afternoon_dose_time: m.afternoon_dose_time ? m.afternoon_dose_time.slice(0, 5) : '14:00',
    night_dose_time: m.night_dose_time ? m.night_dose_time.slice(0, 5) : '20:00',
    telegram_linked: !!(m.telegram_chat_id || m.telegram_username),
    telegram_username: m.telegram_username || '',
    care_loop_enabled: !!m.care_loop_enabled,
    onboarding_completed: !!m.onboarding_completed,
  };
};

export const DashboardView = () => {
  const { user } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('world');
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);

  // Real Database Data State
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);

  // Fetch all real account data for the logged-in user
  const fetchAccountData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch family members, documents, medications, and vitals concurrently
      const [membersRes, docsRes, medsRes, vitalsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('medication_schedules').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('health_vitals').select('*').eq('user_id', user.id).order('measured_at', { ascending: true }),
      ]);

      // 1. Build vitals dictionary
      const vitalsMap = {};
      if (vitalsRes.data) {
        vitalsRes.data.forEach(v => {
          if (!vitalsMap[v.family_member_id]) vitalsMap[v.family_member_id] = {};
          vitalsMap[v.family_member_id][v.type] = v.value;
        });
        setVitals(vitalsRes.data);
      }

      // 2. Format profiles with vitals
      const raw = membersRes.data || [];
      const selfMembers = raw.filter(m => m.relationship === 'Self');
      const primarySelf = selfMembers.find(m => m.onboarding_completed) ||
                          selfMembers.find(m => m.phone_number) ||
                          selfMembers[0];
      const dependents = raw.filter(m => m.relationship !== 'Self');
      const mergedList = primarySelf ? [primarySelf, ...dependents] : dependents;

      const formattedProfiles = mergedList.map(m => formatProfile(m, vitalsMap[m.id] || {}));
      setProfiles(formattedProfiles);

      setActiveProfile(prev => {
        if (prev?.id === 'all') return prev;
        if (prev && formattedProfiles.some(p => p.id === prev.id)) {
          return formattedProfiles.find(p => p.id === prev.id);
        }
        return formattedProfiles[0] || null;
      });

      // 3. Format documents
      if (docsRes.data) {
        const formattedDocs = docsRes.data.map(d => ({
          id: d.id,
          family_member_id: d.family_member_id,
          type: d.type || 'Prescription',
          doctor: d.issued_by || 'Consulting Physician',
          clinic: 'Clinical Vault',
          date: d.visit_date || (d.created_at ? d.created_at.split('T')[0] : '2026-09-20'),
          diagnosis: d.diagnosis || 'Clinical Consultation Record',
          verified: d.ai_analysis_status === 'completed',
          badge: d.type === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded',
          ai_status: d.ai_analysis_status || 'completed',
          cloud_file_key: d.cloud_file_key || null,
          ai_analysis_result: d.ai_analysis_result || null,
        }));
        setDocuments(formattedDocs);
      }

      // 4. Format medication schedules
      if (medsRes.data) {
        const formattedMeds = medsRes.data.map(m => ({
          id: m.id,
          family_member_id: m.family_member_id,
          name: m.name,
          brand: m.generic_name || m.name,
          category: m.medicine_purpose || m.medicine_type || 'Prescription',
          categoryColor: 'emerald',
          slot: m.timing_dosage || 'morning',
          time: m.reminder_times?.[0] || '08:00',
          food: m.food_relationship || 'With Food',
          duration: m.duration_days ? `${m.duration_days} days` : 'Ongoing',
          status: 'pending',
          confirmedAt: null,
          channel: null,
        }));
        setMedications(formattedMeds);
      }

    } catch (err) {
      console.error('Error hydrating dashboard from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Handler for updating existing family member profile & vitals in Supabase
  const handleUpdateProfile = async (updated) => {
    if (!user?.id || !updated?.id) return;

    try {
      // 1. Update family_members table
      const updatePayload = {
        name: updated.name,
        relationship: updated.relationship,
        gender: updated.gender,
        phone_number: updated.mobile_number || updated.phone_number || null,
        date_of_birth: updated.date_of_birth || null,
        avatar_url: updated.avatar || null,
        morning_dose_time: updated.morning_dose_time ? `${updated.morning_dose_time.slice(0, 5)}:00` : '08:00:00',
        afternoon_dose_time: updated.afternoon_dose_time ? `${updated.afternoon_dose_time.slice(0, 5)}:00` : '14:00:00',
        night_dose_time: updated.night_dose_time ? `${updated.night_dose_time.slice(0, 5)}:00` : '20:00:00',
        care_loop_enabled: !!updated.care_loop_enabled,
        telegram_username: updated.telegram_username || null,
        updated_at: new Date().toISOString(),
      };

      const { error: mErr } = await supabase
        .from('family_members')
        .update(updatePayload)
        .eq('id', updated.id);

      if (mErr) {
        console.error('Error updating family_members in Supabase:', mErr);
      }

      // 2. Persist vitals in health_vitals
      const vitalsToSync = [
        { type: 'weight', label: 'Body Weight', value: updated.weight, unit: 'kg' },
        { type: 'height', label: 'Height', value: updated.height, unit: 'cm' },
        { type: 'blood_group', label: 'Blood Group', value: updated.blood_group, unit: '' },
        { type: 'marital_status', label: 'Marital Status', value: updated.marital_status, unit: '' },
      ].filter(v => v.value);

      if (vitalsToSync.length > 0) {
        await supabase
          .from('health_vitals')
          .delete()
          .eq('family_member_id', updated.id)
          .in('type', vitalsToSync.map(v => v.type));

        await supabase
          .from('health_vitals')
          .insert(vitalsToSync.map(v => ({
            user_id: user.id,
            family_member_id: updated.id,
            type: v.type,
            label: v.label,
            value: v.value,
            unit: v.unit,
            status: 'normal',
            icon_name: 'Activity',
          })));
      }

      // 3. Update React state immediately
      const initials = updated.name
        ? updated.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (updated.relationship || 'P')[0];

      const birthYear = updated.date_of_birth ? new Date(updated.date_of_birth).getFullYear() : null;
      const calculatedAge = birthYear ? (new Date().getFullYear() - birthYear) : (updated.age ? Number(updated.age) : null);

      const refreshed = {
        ...updated,
        initials,
        age: calculatedAge,
        morning_dose_time: updated.morning_dose_time?.slice(0, 5) || '08:00',
        afternoon_dose_time: updated.afternoon_dose_time?.slice(0, 5) || '14:00',
        night_dose_time: updated.night_dose_time?.slice(0, 5) || '20:00',
      };

      setProfiles(prev => prev.map(p => p.id === updated.id ? refreshed : p));
      setActiveProfile(prev => prev?.id === updated.id ? refreshed : prev);

    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  // Handler for adding new family member permanently to Supabase
  const handleAddMember = async (payload) => {
    const isArray = Array.isArray(payload);
    const newMembers = isArray ? payload : [payload];
    
    if (!user?.id) return;

    try {
      const rows = newMembers.map(m => ({
        user_id: user.id,
        name: m.name,
        relationship: m.relationship,
        gender: m.gender,
        phone_number: m.phone || null,
        avatar_url: m.avatar || null,
        telegram_username: m.telegram_username || null,
        care_loop_enabled: !!m.telegram_username,
        morning_dose_time: m.doseTime?.morning ? `${m.doseTime.morning}:00` : '08:00:00',
        afternoon_dose_time: m.doseTime?.afternoon ? `${m.doseTime.afternoon}:00` : '14:00:00',
        night_dose_time: m.doseTime?.night ? `${m.doseTime.night}:00` : '20:00:00',
        onboarding_completed: true,
      }));

      const { data: inserted, error } = await supabase
        .from('family_members')
        .insert(rows)
        .select();

      if (!error && inserted) {
        const formatted = inserted.map(m => formatProfile(m, {}));
        setProfiles(prev => [...prev, ...formatted]);
        setActiveProfile(formatted[0]);
      }
    } catch (err) {
      console.error('Error saving new family member:', err);
    }
  };

  // Handler for adding document to real vault
  const handleDocumentAdded = async (newDoc) => {
    setDocuments(prev => {
      const exists = prev.some(d => d.id === newDoc.id || (d.cloud_file_key && d.cloud_file_key === newDoc.cloud_file_key));
      if (exists) {
        return prev.map(d => (d.id === newDoc.id || (d.cloud_file_key && d.cloud_file_key === newDoc.cloud_file_key)) ? { ...d, ...newDoc } : d);
      }
      return [newDoc, ...prev];
    });

    if (user?.id) {
      try {
        await supabase.from('documents').insert([{
          user_id: user.id,
          family_member_id: activeProfile?.id !== 'all' ? activeProfile?.id : null,
          type: newDoc.type,
          patient_name: activeProfile?.name || 'Patient',
          diagnosis: newDoc.diagnosis,
          issued_by: newDoc.doctor,
          visit_date: newDoc.date,
          cloud_file_key: newDoc.cloud_file_key || null,
          local_file_path: newDoc.local_file_path || null,
          ai_analysis_status: newDoc.ai_status || 'pending',
          ai_analysis_result: newDoc.ai_analysis_result || null,
        }]);
      } catch (err) {
        console.error('Error persisting document:', err);
      }
    }
  };

  // Filtered slices for active profile (supports 'all' for consolidated view)
  const isAllFamily = !activeProfile || activeProfile.id === 'all';
  const selfProfile = profiles.find(p => p.relationship === 'Self') || profiles[0];

  const profileDocs = isAllFamily
    ? documents
    : documents.filter(d => {
        const docOwnerId = d.family_member_id || selfProfile?.id;
        return docOwnerId === activeProfile?.id;
      });

  const profileMeds = isAllFamily
    ? medications
    : medications.filter(m => {
        const medOwnerId = m.family_member_id || selfProfile?.id;
        return medOwnerId === activeProfile?.id;
      });

  // Auto-collapse sidebar when analyzing documents/PDFs, or when manually toggled
  const isSidebarCollapsed = isAnalyzingDoc || Boolean(viewingDoc) || isManualCollapsed;

  const handleToggleCollapse = () => {
    setIsManualCollapsed(prev => !prev);
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading family clinical dossiers…</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'medical') {
          setViewingDoc(null);
          setIsAnalyzingDoc(false);
        }
      }}
      profiles={profiles}
      activeProfile={activeProfile}
      onProfileSelect={setActiveProfile}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={handleToggleCollapse}
    >
      
      {/* Router Logic */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        
        {activeTab === 'world' && (
          <WorldSection 
            key={activeProfile?.id || 'all'}
            user={user}
            profiles={profiles}
            activeProfile={activeProfile}
            documents={profileDocs}
            medications={profileMeds}
            onNavigate={setActiveTab}
            onAddMember={handleAddMember}
            onDocumentAdded={handleDocumentAdded}
            onViewDocument={(doc) => {
              if (doc?.ai_analysis_result) {
                setDocuments(prev => prev.map(d => 
                  (d.id === doc.id || (d.cloud_file_key && d.cloud_file_key === doc.cloud_file_key))
                    ? { ...d, ...doc }
                    : d
                ));
              }
              setViewingDoc(doc);
              setIsAnalyzingDoc(true);
              setActiveTab('medical');
            }}
          />
        )}

        {activeTab === 'medical' && (
          <MedicalSection
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            documents={profileDocs}
            medications={profileMeds}
            onDocumentAdded={handleDocumentAdded}
            onAddMember={handleAddMember}
            initialDoc={viewingDoc}
            onClearInitialDoc={() => {
              setViewingDoc(null);
              setIsAnalyzingDoc(false);
            }}
            onAnalysisStateChange={setIsAnalyzingDoc}
          />
        )}

        {activeTab === 'health' && (
          <HealthSection 
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            medications={profileMeds}
            biomarkers={{}}
            conflicts={[]}
          />
        )}

        {activeTab === 'family' && (
          <FamilySection 
            profiles={profiles}
            setProfiles={setProfiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            onAddMember={handleAddMember}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

      </div>

    </SidebarLayout>
  );
};
