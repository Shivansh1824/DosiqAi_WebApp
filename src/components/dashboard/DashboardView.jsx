import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { SidebarLayout }  from './SidebarLayout';
import { WorldSection }   from './WorldSection';
import { MedicalSection } from './MedicalSection';
import { HealthSection }  from './HealthSection';
import { FamilySection }  from './FamilySection';
import { Loader2 }        from 'lucide-react';
import { TELEGRAM_BOT_URL } from '../../lib/telegramConfig';
import { CareLoopHistorySection } from './CareLoopHistorySection';
import { normalizeBiomarkerName, resolveClinicalReportDate } from '../../lib/biomarkerUtils';

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
  const [events, setEvents] = useState([]);

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
      let mergedList = [];
      const selfMembers = raw.filter(m => m.relationship === 'Self');
      const primarySelf = selfMembers.find(m => m.onboarding_completed) ||
                          selfMembers.find(m => m.telegram_username) ||
                          selfMembers.find(m => m.phone_number) ||
                          selfMembers[0];
      const dependents = raw.filter(m => m.relationship !== 'Self');
      mergedList = primarySelf ? [primarySelf, ...dependents] : dependents;

      // Check if current browser session has a local Telegram pairing for this demo tester
      const localDemoTelegram = localStorage.getItem('dosiq_demo_telegram_username');
      if (localDemoTelegram && mergedList[0]) {
        mergedList[0].telegram_username = localDemoTelegram;
        mergedList[0].care_loop_enabled = true;
      }

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
        const formattedDocs = docsRes.data.map(d => {
          const ai = d.ai_analysis_result;
          const isRx = (d.type || 'Prescription') === 'Prescription';
          const doctorFromAi = ai?.prescription_data?.doctor_name || ai?.report_data?.referred_by || ai?.report_data?.lab_name;
          const diagnosisFromAi = ai?.prescription_data?.medical_issue_diagnosis || ai?.report_data?.primary_diagnosis;
          const hospitalFromAi = ai?.prescription_data?.hospital_name || ai?.report_data?.lab_name;
          const jsonFileName = ai?.file_name;
          const uploadedFileName = d.local_file_path || d.file_name || (d.cloud_file_key ? d.cloud_file_key.split('/').pop() : null) || (isRx ? 'prescription_dossier.pdf' : 'lab_report_panel.pdf');

          return {
            id: d.id,
            family_member_id: d.family_member_id,
            type: d.type || 'Prescription',
            file_name: uploadedFileName,
            local_file_path: d.local_file_path || uploadedFileName,
            ai_file_name: jsonFileName,
            doctor: doctorFromAi || (d.issued_by && !d.issued_by.includes('Consulting') ? d.issued_by : (isRx ? 'Attending Physician' : 'Clinical Pathology Laboratory')),
            clinic: hospitalFromAi || 'Clinical Vault',
            hospital: hospitalFromAi,
            date: ai?.report_data?.report_date || ai?.report_data?.collection_date || ai?.common_data?.visit_date || d.visit_date || (d.created_at ? d.created_at.split('T')[0] : '2026-09-20'),
            diagnosis: diagnosisFromAi || (d.diagnosis && !d.diagnosis.includes('Protocol') ? d.diagnosis : (isRx ? 'Prescription Regimen' : 'Complete Metabolic & Lipid Panel')),
            verified: d.ai_analysis_status === 'completed',
            badge: d.type === 'Blood Test' ? 'Lab Analyzed' : 'Rx Decoded',
            ai_status: d.ai_analysis_status || 'completed',
            cloud_file_key: d.cloud_file_key || null,
            ai_analysis_result: d.ai_analysis_result || null,
          };
        });
        setDocuments(formattedDocs);
      }

      // 4. Format medication schedules & extract from prescription documents
      const syncedMeds = (medsRes.data || []).map(m => ({
        id: m.id,
        family_member_id: m.family_member_id,
        name: m.name,
        brand: m.name,
        scientific_name: m.generic_name || m.name,
        category: m.medicine_purpose || m.medicine_type || 'Prescription',
        categoryColor: 'emerald',
        slot: m.timing_dosage || '0-0-1',
        timing_dosage: m.timing_dosage || '0-0-1',
        time: m.reminder_times?.[0] || '08:00 PM',
        reminder_times: m.reminder_times || ['20:00'],
        food: m.food_relationship || 'With Food',
        duration: m.duration_days ? `${m.duration_days} days` : 'Ongoing',
        duration_days: m.duration_days || 60,
        start_date: m.start_date || '2026-09-21',
        interval_days: m.interval_days !== undefined && m.interval_days !== null ? m.interval_days : 1,
        dosage_instruction: m.dosage_instruction || null,
        strength: m.strength || null,
        status: m.status || 'active',
        is_synced: true,
        doc_id: m.document_id || null,
        doc_name: m.document_name || 'Active Regimen',
        confirmedAt: null,
        channel: 'telegram',
      }));

      // 5. Extract medicines from decoded prescription documents
      const docMeds = [];
      if (docsRes.data) {
        docsRes.data.forEach(d => {
          const rxMedicines = d.ai_analysis_result?.prescription_data?.medicines;
          if (Array.isArray(rxMedicines)) {
            rxMedicines.forEach((med, mIdx) => {
              const medName = med.exact_written_name || med.name || 'Prescription Drug';
              const isAlreadySynced = syncedMeds.some(sm => 
                sm.name.toLowerCase() === medName.toLowerCase()
              );

              if (!isAlreadySynced) {
                const enriched = med.assumed_enriched_data || {};
                const timing = med.timing || {};
                const mealRelation = timing.relation_to_meal ? timing.relation_to_meal.replace('_', ' ') : 'After Food';
                const dosage = timing.dosage || (timing.total_times_per_day ? `${timing.total_times_per_day}x Daily` : 'Daily');

                docMeds.push({
                  id: `doc_med_${d.id}_${mIdx}`,
                  family_member_id: d.family_member_id,
                  name: medName,
                  brand: medName,
                  strength: med.strength || null,
                  form: med.form || 'Medicine',
                  scientific_name: enriched.scientific_name || null,
                  category: enriched.medicine_purpose || enriched.medicine_type || 'Prescription',
                  categoryColor: 'emerald',
                  slot: dosage,
                  timing_dosage: timing.dosage || '0-0-1',
                  time: '08:00 AM',
                  reminder_times: ['08:00'],
                  food: mealRelation,
                  duration: med.duration_days ? `${med.duration_days} days` : 'As Prescribed',
                  duration_days: med.duration_days || 60,
                  start_date: d.visit_date || '2026-09-21',
                  status: 'unlinked',
                  is_synced: false,
                  doc_id: d.id,
                  doc_name: d.ai_analysis_result?.file_name || d.local_file_path || d.file_name || 'Prescription Dossier',
                  doctor_name: d.ai_analysis_result?.prescription_data?.doctor_name || d.issued_by || 'Attending Physician',
                  dosage_instruction: med.dosage_instruction || null,
                  timing: timing,
                  interval_days: med.interval_days !== undefined && med.interval_days !== null ? med.interval_days : 1,
                });
              }
            });
          }
        });
      }

      const allResolvedMeds = [...syncedMeds, ...docMeds];
      if (allResolvedMeds.length === 0 && (user.id === 'demo-caregiver-judge-01' || user.id === 'f60a2cc4-0b10-48fa-899e-1ac1e8d360c5')) {
        allResolvedMeds.push(
          {
            id: 'demo-med-1',
            family_member_id: 'demo-dad-01',
            name: 'Tab Telma-40',
            brand: 'Telma-40',
            scientific_name: 'Telmisartan 40mg',
            category: 'Blood Pressure',
            categoryColor: 'emerald',
            slot: '1-0-0',
            time: '08:00 AM',
            food: 'After Breakfast',
            duration: 'Ongoing',
            status: 'active',
            is_synced: true,
            doc_name: 'Dr. Mehta Cardiology Follow-up',
          },
          {
            id: 'demo-med-2',
            family_member_id: 'demo-dad-01',
            name: 'Cap Pan-D',
            brand: 'Pan-D',
            scientific_name: 'Pantoprazole + Domperidone',
            category: 'Gastric Care',
            categoryColor: 'teal',
            slot: '1-0-0',
            time: '07:30 AM',
            food: 'Before Food',
            duration: '30 days',
            status: 'active',
            is_synced: true,
            doc_name: 'Dr. Mehta Cardiology Follow-up',
          },
          {
            id: 'demo-med-3',
            family_member_id: 'demo-mom-01',
            name: 'Tab Metformin 500',
            brand: 'Metformin',
            scientific_name: 'Metformin Hydrochloride 500mg',
            category: 'Diabetes Care',
            categoryColor: 'sky',
            slot: '1-0-1',
            time: '08:30 AM',
            food: 'With Meals',
            duration: 'Ongoing',
            status: 'active',
            is_synced: true,
            doc_name: 'Dr. Patel Endocrinology Consult',
          }
        );
      }
      setMedications(allResolvedMeds);

      // 5. Fetch Care Loop Events
      try {
        const { data: loopEvents } = await supabase
          .from('care_loop_events')
          .select('*')
          .order('dispatched_at', { ascending: false });

        if (loopEvents && loopEvents.length > 0) {
          const mappedEvents = loopEvents.map(e => ({
            id: e.id,
            date: e.dispatched_at ? e.dispatched_at.split('T')[0] : new Date().toISOString().split('T')[0],
            time: e.dispatched_at ? new Date(e.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:27 PM',
            medication: e.medication_name,
            dosage: e.dosage_instruction || 'As prescribed',
            slot: e.scheduled_slot ? `${e.scheduled_slot.charAt(0).toUpperCase() + e.scheduled_slot.slice(1)} Slot` : 'Night Slot',
            status: e.response_status || 'confirmed',
            patient: primarySelf?.name || 'Shivansh',
            profile: e.family_member_id || primarySelf?.id,
            channel: 'Telegram Bot',
            latency: e.latency_seconds ? `${e.latency_seconds}s` : '2s',
            notes: e.notes || 'Verified through Telegram Care Loop',
            message: `${primarySelf?.name || 'Shivansh'} ${e.response_status === 'skipped' ? 'skipped' : 'confirmed'} ${e.medication_name || 'medication'} at ${e.dispatched_at ? new Date(e.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:27 PM'}`
          }));
          setEvents(mappedEvents);
        }
      } catch (loopErr) {
        console.warn('Could not fetch care_loop_events:', loopErr);
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

  // Listen for background biomarker reconciliation completion to refresh trends seamlessly
  useEffect(() => {
    const handleReconciled = (e) => {
      const { documentId, result } = e.detail || {};
      if (documentId && result) {
        setDocuments(prev => prev.map(d => {
          if (d.id === documentId || (d.cloud_file_key && d.cloud_file_key === documentId)) {
            return {
              ...d,
              ai_analysis_result: result,
              trends_status: 'completed',
            };
          }
          return d;
        }));
      }
    };

    window.addEventListener('dosiq:biomarkers-reconciled', handleReconciled);
    return () => window.removeEventListener('dosiq:biomarkers-reconciled', handleReconciled);
  }, []);

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
        const docInsertPayload = {
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
        };
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(newDoc.id)) {
          docInsertPayload.id = newDoc.id;
        }
        await supabase.from('documents').insert([docInsertPayload]);
      } catch (err) {
        console.error('Error persisting document:', err);
      }
    }
  };

  // Live Sync Medicine to Telegram Care Loop
  const handleSyncMedicine = async (med) => {
    // 1. Update state immediately
    setMedications(prev => prev.map(m => {
      if (m.id === med.id || (m.name === med.name && m.doc_id === med.doc_id)) {
        return {
          ...m,
          status: 'active',
          is_synced: true,
          channel: 'telegram',
        };
      }
      return m;
    }));

    // 2. Persist into Supabase medication_schedules
    if (user?.id) {
      try {
        const payload = {
          user_id: user.id,
          family_member_id: med.family_member_id || (activeProfile?.id !== 'all' ? activeProfile?.id : null),
          name: med.name,
          generic_name: med.scientific_name || med.name,
          medicine_type: med.form || 'Tablet',
          medicine_purpose: med.category || 'Prescription',
          strength: med.strength || null,
          dosage_instruction: med.dosage_instruction || null,
          timing_dosage: med.slot || '0-0-1',
          reminder_times: ['20:00'],
          food_relationship: med.food || 'After Food',
          start_date: new Date().toISOString().split('T')[0],
          duration_days: parseInt(med.duration, 10) || 60,
          source_document_id: med.doc_id || null,
        };

        await supabase
          .from('medication_schedules')
          .insert([payload]);
      } catch (err) {
        console.warn('Error syncing medicine to Supabase:', err);
      }
    }

    // 3. Mark active profile as telegram linked
    setActiveProfile(prev => prev ? { ...prev, telegram_linked: true } : prev);
    setProfiles(prev => prev.map(p => (p.id === activeProfile?.id || p.relationship === 'Self') ? { ...p, telegram_linked: true } : p));

    // 4. Open Telegram bot
    window.open(TELEGRAM_BOT_URL, '_blank');
  };

  // Mark Medicine as Course Completed
  const handleCompleteMedicine = async (medId) => {
    setMedications(prev => prev.map(m => {
      if (m.id === medId) {
        return {
          ...m,
          status: 'completed',
          completed_at: new Date().toISOString().split('T')[0],
        };
      }
      return m;
    }));

    if (user?.id) {
      try {
        await supabase
          .from('medication_schedules')
          .update({ status: 'completed' })
          .eq('id', medId);
      } catch (err) {
        console.warn('Error updating medicine status:', err);
      }
    }
  };

  // Mark Dose Taken or Skipped
  const handleActionMedicine = (medId, action) => {
    setMedications(prev => prev.map(m => {
      if (m.id === medId) {
        return {
          ...m,
          status: action === 'take' ? 'taken' : 'skipped',
          confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'telegram'
        };
      }
      return m;
    }));
  };

  // Build real biomarker trend data from all Blood Test documents (sorted by date)
  const buildBiomarkersFromDocs = (docs) => {
    const biomarkers = {};
    const bloodTestDocs = docs
      .filter(d => d.type === 'Blood Test' && d.ai_analysis_result?.report_data?.grouped_metrics)
      .sort((a, b) => {
        const dateA = resolveClinicalReportDate(a).isoDate;
        const dateB = resolveClinicalReportDate(b).isoDate;
        return new Date(dateA || 0) - new Date(dateB || 0);
      });

    bloodTestDocs.forEach((doc, docIdx) => {
      const panels = doc.ai_analysis_result.report_data.grouped_metrics;
      const { displayDate } = resolveClinicalReportDate(doc);

      // Disambiguate if multiple reports share the exact same display date
      const hasDuplicateDate = bloodTestDocs.some((other, oi) => oi !== docIdx && resolveClinicalReportDate(other).displayDate === displayDate);
      const shortLab = doc.clinic ? doc.clinic.split(' ')[0] : (doc.doctor ? doc.doctor.split(' ')[0] : '');
      const sameLabCount = bloodTestDocs.filter(other => resolveClinicalReportDate(other).displayDate === displayDate && (other.clinic ? other.clinic.split(' ')[0] : (other.doctor ? other.doctor.split(' ')[0] : '')) === shortLab).length;
      const dateLabel = hasDuplicateDate
        ? (sameLabCount > 1
            ? `${displayDate} (${shortLab ? `${shortLab} #${docIdx + 1}` : `Rep ${docIdx + 1}`})`
            : `${displayDate} (${shortLab || `Rep ${docIdx + 1}`})`)
        : displayDate;

      // Ensure each document contributes at most 1 data point per biomarker
      const recordedInDoc = new Set();

      panels.forEach(panel => {
        panel.metrics.forEach(metric => {
          if (metric.is_junk) return;
          const rawName = metric.test_name;
          const canonical = metric.canonical_name || normalizeBiomarkerName(rawName);
          const key = canonical || rawName;

          if (recordedInDoc.has(key)) return;

          const numVal = metric.numeric_value ?? parseFloat(metric.value);
          if (!isNaN(numVal)) {
            recordedInDoc.add(key);
            if (!biomarkers[key]) {
              biomarkers[key] = {
                unit: metric.unit,
                label: key,
                rawName,
                data: []
              };
            }
            biomarkers[key].data.push({
              month: dateLabel,
              value: numVal,
              unit: metric.unit || biomarkers[key].unit,
              is_abnormal: metric.is_abnormal,
              reportTitle: doc.file_name || doc.ai_file_name || 'Lab Report',
              lab: doc.clinic || doc.doctor || 'Pathology Lab',
            });
          }
        });
      });
    });

    return biomarkers;
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

  const vitalsBiomarkers = buildBiomarkersFromDocs(profileDocs);
  const bloodTestDocs = profileDocs.filter(d => d.type === 'Blood Test' && d.ai_analysis_result?.report_data);

  // Always closed by default; expands smoothly on hover via SidebarLayout
  const isSidebarCollapsed = true;

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
            documents={profileDocs}
            biomarkers={vitalsBiomarkers}
            reportDocs={bloodTestDocs}
            conflicts={[]}
            events={events}
            onSyncMedicine={handleSyncMedicine}
            onCompleteMedicine={handleCompleteMedicine}
            onActionMedicine={handleActionMedicine}
          />
        )}

        {activeTab === 'careloop' && (
          <CareLoopHistorySection
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileSelect={setActiveProfile}
            medications={profileMeds}
            events={events}
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
