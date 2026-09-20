import React, { useState } from 'react';
import { UserPlus, User, Users, Settings, CheckCircle2, Crown, ShieldAlert, Heart, Phone, Activity } from 'lucide-react';
import { FamilyMemberModal } from '../onboarding/FamilyMemberModal';

const CATEGORY_COLORS = {
  'Self':     { bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-400 to-teal-500' },
  'Father':   { bg: 'bg-sky-50',      text: 'text-sky-600',     border: 'border-sky-200',     gradient: 'from-sky-400 to-cyan-500' },
  'Mother':   { bg: 'bg-violet-50',   text: 'text-violet-600',  border: 'border-violet-200',  gradient: 'from-violet-400 to-fuchsia-500' },
  'Child':    { bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200',   gradient: 'from-amber-400 to-orange-500' },
  'Spouse':   { bg: 'bg-rose-50',     text: 'text-rose-600',    border: 'border-rose-200',    gradient: 'from-rose-400 to-pink-500' },
  'Brother':  { bg: 'bg-teal-50',     text: 'text-teal-600',    border: 'border-teal-200',    gradient: 'from-teal-400 to-emerald-500' },
  'Sister':   { bg: 'bg-fuchsia-50',  text: 'text-fuchsia-600', border: 'border-fuchsia-200', gradient: 'from-fuchsia-400 to-purple-500' },
  'Other':    { bg: 'bg-slate-50',    text: 'text-slate-600',   border: 'border-slate-200',   gradient: 'from-slate-400 to-gray-500' },
};

const ProfileCard = ({ profile, isActive, onSelect }) => {
  const color = CATEGORY_COLORS[profile.relationship] || CATEGORY_COLORS['Other'];
  
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (profile.relationship || 'P')[0];

  const ageText = profile.age ? `${profile.age} yrs` : '';
  const isPrimary = profile.relationship === 'Self';

  return (
    <div
      onClick={() => {
        onSelect(profile);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-sm font-bold animate-in slide-in-from-bottom-5 fade-in duration-300';
        toast.innerHTML = `<span class="w-2 h-2 rounded-full ${color.bg.replace('bg-', 'bg-').replace('-50', '-500')}"></span> Dashboard updated for ${profile.name.split(' ')[0] || profile.relationship}`;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
          setTimeout(() => toast.remove(), 300);
        }, 2500);
      }}
      className={`relative group cursor-pointer flex flex-col p-5 rounded-3xl transition-all duration-300 ${
        isActive
          ? 'bg-white shadow-xl shadow-slate-900/10 border-2 border-slate-900 scale-[1.02] z-10'
          : 'bg-white border-2 border-transparent hover:border-slate-200 hover:shadow-lg hover:shadow-slate-900/5'
      }`}
    >
      {/* Active Checkmark */}
      {isActive && (
        <div className="absolute top-4 right-4 animate-in fade-in zoom-in">
          <CheckCircle2 className="w-5 h-5 text-slate-900" />
        </div>
      )}

      {/* Primary Badge */}
      {isPrimary && !isActive && (
        <div className="absolute top-4 right-4">
          <Crown className="w-5 h-5 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0 bg-gradient-to-br ${color.gradient}`}>
          {initials}
        </div>
        
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            {profile.name || profile.relationship}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.bg} ${color.text} uppercase tracking-wide`}>
              {profile.relationship}
            </span>
            {ageText && <span className="text-xs text-slate-400 font-medium">{ageText}</span>}
          </div>
        </div>
      </div>

      {/* Onboarding Rich Data */}
      <div className="grid grid-cols-2 gap-y-2 mb-4">
        {profile.mobile_number && (
          <div className="flex items-center gap-1.5 col-span-2 text-xs text-slate-500 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {profile.mobile_number}
          </div>
        )}
        {profile.marital_status && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Heart className="w-3.5 h-3.5 text-slate-400" />
            {profile.marital_status}
          </div>
        )}
        {profile.blood_group && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Blood: <span className="font-bold text-slate-700">{profile.blood_group}</span>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="bg-slate-50 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Weight</span>
          <span className="text-sm font-black text-slate-800">{profile.weight || '--'}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Height</span>
          <span className="text-sm font-black text-slate-800">{profile.height || '--'}</span>
        </div>
      </div>

      {/* Settings overlay on hover (desktop only) */}
      <button 
        className="absolute bottom-4 right-4 p-2 rounded-xl bg-white/90 shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex"
        onClick={(e) => { e.stopPropagation(); /* handle settings */ }}
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
};

export const FamilySection = ({ profiles, setProfiles, activeProfile, onProfileSelect }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleAddMember = (payload) => {
    const isArray = Array.isArray(payload);
    const newMembers = isArray ? payload : [payload];
    
    const enrichedMembers = newMembers.map(m => ({
      ...m,
      id: `m_${Date.now()}_${Math.random()}`,
      initials: m.name ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'P'
    }));

    setProfiles(prev => [...prev, ...enrichedMembers]);
    
    // Auto-select the newly added member (or the first one if multiple)
    onProfileSelect(enrichedMembers[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Family Management
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Select a profile to filter the Medical and Health vaults.
          </p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-sm font-bold shadow-md shadow-slate-900/10 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Family Member
        </button>
      </div>

      {/* Bento Grid for Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {profiles.map(p => (
          <ProfileCard
            key={p.id}
            profile={p}
            isActive={activeProfile?.id === p.id}
            onSelect={onProfileSelect}
          />
        ))}

        {/* Empty Add Card */}
        <button 
          onClick={() => setModalOpen(true)}
          className="flex flex-col items-center justify-center gap-3 min-h-[200px] p-5 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
            <UserPlus className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-700">Add New Member</p>
        </button>
      </div>

      <FamilyMemberModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        existingMembers={profiles}
        defaultRelationship="Father"
        onSave={handleAddMember}
      />
    </div>
  );
};
