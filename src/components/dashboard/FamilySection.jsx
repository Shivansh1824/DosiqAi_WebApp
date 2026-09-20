import React, { useState } from 'react';
import {
  UserPlus, Users, Settings, CheckCircle2, Crown,
  Phone, Clock, Send,
} from 'lucide-react';
import { FamilyMemberModal } from '../onboarding/FamilyMemberModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';

const CATEGORY_COLORS = {
  'Self':     { bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-400 to-teal-500' },
  'Father':   { bg: 'bg-sky-50',      text: 'text-sky-600',     border: 'border-sky-200',     gradient: 'from-sky-400 to-cyan-500' },
  'Mother':   { bg: 'bg-violet-50',   text: 'text-violet-600',  border: 'border-violet-200',  gradient: 'from-violet-400 to-fuchsia-500' },
  'Child':    { bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200',   gradient: 'from-amber-400 to-orange-500' },
  'Son':      { bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200',   gradient: 'from-amber-400 to-orange-500' },
  'Daughter': { bg: 'bg-pink-50',     text: 'text-pink-600',    border: 'border-pink-200',    gradient: 'from-pink-400 to-rose-500' },
  'Spouse':   { bg: 'bg-rose-50',     text: 'text-rose-600',    border: 'border-rose-200',    gradient: 'from-rose-400 to-pink-500' },
  'Brother':  { bg: 'bg-teal-50',     text: 'text-teal-600',    border: 'border-teal-200',    gradient: 'from-teal-400 to-emerald-500' },
  'Sister':   { bg: 'bg-fuchsia-50',  text: 'text-fuchsia-600', border: 'border-fuchsia-200', gradient: 'from-fuchsia-400 to-purple-500' },
  'Other':    { bg: 'bg-slate-50',    text: 'text-slate-600',   border: 'border-slate-200',   gradient: 'from-slate-400 to-gray-500' },
};

const ProfileCard = ({ profile, isActive, onSelect, onOpenSettings }) => {
  const color = CATEGORY_COLORS[profile.relationship] || CATEGORY_COLORS['Other'];
  
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (profile.relationship || 'P')[0];

  const ageText = profile.age ? `${profile.age} yrs` : '';
  const isCustomPhoto = profile.avatar && !profile.avatar.startsWith('preset-');
  const isPrimary = profile.relationship === 'Self';
  const presetEmoji = profile.avatar?.startsWith('preset-')
    ? { 'preset-1': '👨‍⚕️', 'preset-2': '👩‍⚕️', 'preset-3': '🧑‍💼', 'preset-4': '👴', 'preset-5': '👩', 'preset-6': '🧑', 'preset-7': '👦', 'preset-8': '👧' }[profile.avatar]
    : profile.emoji;

  return (
    <div
      onClick={() => onSelect(profile)}
      className={`relative cursor-pointer flex flex-col p-5 rounded-3xl transition-all duration-300 ${
        isActive
          ? 'bg-white shadow-xl shadow-slate-900/10 border-2 border-slate-900 scale-[1.01] z-10 ring-4 ring-slate-900/5'
          : 'bg-white border-2 border-slate-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5'
      }`}
    >
      {/* ── Top Header Row with Status & Clean Settings Button (NO OVERLAP) ── */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with photo / preset / initials */}
          {isCustomPhoto ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-white ring-1 ring-slate-200 bg-slate-100">
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          ) : presetEmoji ? (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0 bg-gradient-to-br ${color.gradient}`}>
              {presetEmoji}
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 bg-gradient-to-br ${color.gradient}`}>
              {initials}
            </div>
          )}
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                {profile.name || profile.relationship}
              </h3>
              {isPrimary && (
                <Crown className="w-4 h-4 text-emerald-500 shrink-0" title="Primary Caregiver" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.bg} ${color.text} uppercase tracking-wide`}>
                {profile.relationship}
              </span>
              {ageText && <span className="text-xs text-slate-400 font-medium">{ageText}</span>}
              {profile.gender && (
                <span className="text-[10px] text-slate-400 capitalize font-medium">· {profile.gender}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action / Settings Cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active</span>
            </span>
          )}
          
          {/* Settings Button: clearly visible and placed in header without overlapping anything */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(profile);
            }}
            title="Edit Profile Settings"
            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-200/80 active:scale-90 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all border border-slate-100 hover:border-slate-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Compact Information & Contact Strip ── */}
      <div className="flex flex-col gap-2 py-2.5 border-t border-slate-100/80">
        {/* Phone / SIM */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> SIM / Mobile:
          </span>
          <span className="font-bold text-slate-700 tabular-nums">
            {profile.mobile_number || profile.phone_number || 'Not added'}
          </span>
        </div>

        {/* Dose Routine */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Doses:
          </span>
          <span className="font-bold text-slate-700 text-[11px]">
            {profile.morning_dose_time || '08:00'} · {profile.afternoon_dose_time || '14:00'} · {profile.night_dose_time || '20:00'}
          </span>
        </div>

        {/* Telegram Care Loop */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-sky-400" /> Care Loop:
          </span>
          {profile.telegram_linked || profile.telegram_username ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {profile.telegram_username ? `@${profile.telegram_username.replace(/^@/, '')}` : 'Linked'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Not Linked</span>
          )}
        </div>
      </div>

      {/* ── Compact Micro-Metrics Strip (NO OVERSIZED BOXES!) ── */}
      <div className="grid grid-cols-3 gap-1.5 pt-2.5 mt-auto border-t border-slate-100">
        <div className="bg-slate-50/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Weight</span>
          <span className="text-xs font-black text-slate-800">{profile.weight || '—'}</span>
        </div>
        <div className="bg-slate-50/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Height</span>
          <span className="text-xs font-black text-slate-800">{profile.height || '—'}</span>
        </div>
        <div className="bg-slate-50/80 rounded-xl py-1.5 px-2 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Blood</span>
          <span className="text-xs font-black text-slate-800">{profile.blood_group || '—'}</span>
        </div>
      </div>
    </div>
  );
};

export const FamilySection = ({
  profiles,
  setProfiles,
  activeProfile,
  onProfileSelect,
  onAddMember,
  onUpdateProfile,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const handleAddMember = async (payload) => {
    if (onAddMember) {
      await onAddMember(payload);
    } else {
      const isArray = Array.isArray(payload);
      const newMembers = isArray ? payload : [payload];
      
      const enrichedMembers = newMembers.map(m => ({
        ...m,
        id: `m_${Date.now()}_${Math.random()}`,
        initials: m.name ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'P'
      }));

      setProfiles(prev => [...prev, ...enrichedMembers]);
      onProfileSelect(enrichedMembers[0]);
    }
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
            Select a profile to filter clinical dossiers, or click settings (⚙️) to update member information.
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
            onOpenSettings={(prof) => setEditingProfile(prof)}
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

      {/* Add Member Modal */}
      <FamilyMemberModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        existingMembers={profiles}
        defaultRelationship="Father"
        onSave={handleAddMember}
      />

      {/* Edit Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={!!editingProfile}
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSave={onUpdateProfile}
      />
    </div>
  );
};

