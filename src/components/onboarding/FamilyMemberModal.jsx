import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, User, Phone, Plus } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker';
import { DoseTimeSelector } from './DoseTimeSelector';
import { ChildDossierCard } from './ChildDossierCard';

const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Child', 'Brother', 'Sister', 'Other'];
const DEFAULT_DOSE = { morning: '08:00', afternoon: '14:00', night: '20:00' };

const PRESET_EMOJIS = {
  'preset-1': '👨‍⚕️', 'preset-2': '👩‍⚕️', 'preset-3': '🧑‍💼',
  'preset-4': '👴',   'preset-5': '👩',    'preset-6': '🧑',
};

const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * FamilyMemberModal
 * Opens as a premium modal to add or edit a family member profile.
 * Supports multi-child batch addition when 'Child' lineage is selected.
 */
export const FamilyMemberModal = ({
  isOpen,
  member,
  existingMembers = [],
  defaultRelationship = 'Child',
  onSave,
  onRemove,
  onClose,
}) => {
  const isEditing = !!member;

  // Detect existing children to calculate sequence (1st child, 2nd child, etc.)
  const existingChildren = existingMembers.filter(m =>
    ['Child', 'Son', 'Daughter'].includes(m.relationship) && (!member || m.id !== member.id)
  );
  const childCount = existingChildren.length;
  const nextChildOrdinal = getOrdinal(childCount + 1);

  const [form, setForm] = useState({
    name: '',
    relationship: defaultRelationship,
    gender: 'male',
    age: '',
    phone: '',
    avatar: null,
    telegram_username: '',
    doseTime: { ...DEFAULT_DOSE },
  });

  // Multi-child state when adding children
  const [sameDoseRoutine, setSameDoseRoutine] = useState(true);
  const [children, setChildren] = useState([
    { id: 1, name: '', gender: 'male', age: '', doseTime: { ...DEFAULT_DOSE } },
  ]);

  // Sync form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (member) {
        const isChildRel = ['Child', 'Son', 'Daughter'].includes(member.relationship);
        const resolvedRel = isChildRel ? 'Child' : (member.relationship || defaultRelationship);
        const resolvedGender = member.gender || (member.relationship === 'Daughter' ? 'female' : 'male');
        setForm({
          name: member.name || '',
          relationship: resolvedRel,
          gender: resolvedGender,
          age: member.age || '',
          phone: member.phone || '',
          avatar: member.avatar || null,
          telegram_username: member.telegram_username || '',
          doseTime: member.doseTime || { ...DEFAULT_DOSE },
        });
      } else {
        const isChildRel = ['Child', 'Son', 'Daughter'].includes(defaultRelationship);
        setForm({
          name: '',
          relationship: isChildRel ? 'Child' : defaultRelationship,
          gender: 'male',
          age: '',
          phone: '',
          avatar: null,
          telegram_username: '',
          doseTime: { ...DEFAULT_DOSE },
        });
        setChildren([
          { id: Date.now(), name: '', gender: 'male', age: '', doseTime: { ...DEFAULT_DOSE } },
        ]);
        setSameDoseRoutine(true);
      }
    }
  }, [isOpen, member, defaultRelationship]);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  // Multi-child helpers
  const updateChild = (id, patch) => {
    setChildren(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const addChildRow = () => {
    setChildren(cs => [
      ...cs,
      {
        id: Date.now() + Math.random(),
        name: '',
        gender: cs.length % 2 === 1 ? 'female' : 'male',
        age: '',
        doseTime: { ...DEFAULT_DOSE },
      },
    ]);
  };

  const removeChildRow = (id) => {
    if (children.length <= 1) return;
    setChildren(cs => cs.filter(c => c.id !== id));
  };

  const handleSave = () => {
    // If adding new children, batch save all configured children
    if (form.relationship === 'Child' && !isEditing) {
      const payload = children.map((c, idx) => {
        const seqNum = childCount + idx + 1;
        const ordinal = getOrdinal(seqNum);
        const resolvedRel = c.gender === 'female' ? 'Daughter' : 'Son';
        const fallbackName = c.name.trim() || `${resolvedRel} (${ordinal} Child)`;
        const resolvedDoseTime = sameDoseRoutine
          ? (form.doseTime || { ...DEFAULT_DOSE })
          : (c.doseTime || form.doseTime || { ...DEFAULT_DOSE });

        return {
          name: fallbackName,
          relationship: resolvedRel,
          gender: c.gender,
          age: c.age ? String(c.age).trim() : null,
          phone: '',
          avatar: c.avatar || null,
          doseTime: resolvedDoseTime,
        };
      });

      onSave(payload);
      onClose();
      return;
    }

    // Single member save (editing or non-child)
    let finalRelationship = form.relationship;
    let defaultFallbackName = form.name.trim();

    if (form.relationship === 'Child') {
      finalRelationship = form.gender === 'female' ? 'Daughter' : 'Son';
      if (!defaultFallbackName) {
        defaultFallbackName = `${finalRelationship} (${nextChildOrdinal} Child)`;
      }
    } else if (!defaultFallbackName) {
      defaultFallbackName = form.relationship;
    }

    onSave({
      ...form,
      name: defaultFallbackName,
      relationship: finalRelationship,
      gender: form.gender,
      age: form.age ? String(form.age).trim() : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isMultiChildMode = form.relationship === 'Child' && !isEditing;

  // Avatar display for header
  const avatarIsPhoto  = form.avatar && !form.avatar.startsWith('preset-');
  const avatarIsPreset = form.avatar?.startsWith('preset-');
  const initials = form.name
    ? form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : form.relationship === 'Child'
    ? (form.gender === 'female' ? 'D' : 'S')
    : form.relationship.charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh', boxShadow: '0 32px 64px -12px rgba(15,23,42,0.3), 0 0 0 1px rgba(226,232,240,0.8)' }}
      >
        {/* ── Header ── */}
        <div
          className="relative px-5 pt-5 pb-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0d9488 100%)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                {isEditing ? 'Edit Profile' : isMultiChildMode ? 'Add Children' : 'Add Member'}
              </span>
              <h3 className="text-lg font-black text-white font-display mt-0.5">
                {isMultiChildMode
                  ? children.length === 1
                    ? 'Child Profile Dossier'
                    : `${children.length} Children Profiles`
                  : `${form.name || form.relationship} Dossier`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          {/* Mini avatar preview strip */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.12]">
            <div
              className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center overflow-hidden shrink-0 text-xl"
              style={{ background: 'linear-gradient(135deg,#022c22,#064e3b)' }}
            >
              {isMultiChildMode ? (
                '🧒'
              ) : avatarIsPhoto ? (
                <img src={form.avatar} alt="" className="w-full h-full object-cover" />
              ) : avatarIsPreset ? (
                <span>{PRESET_EMOJIS[form.avatar]}</span>
              ) : (
                <span className="text-sm font-black text-white/90">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate">
                {isMultiChildMode
                  ? `${children.length} ${children.length === 1 ? 'Child' : 'Children'} Setup`
                  : form.name || <span className="text-white/40 italic">Enter name below</span>}
              </p>
              <p className="text-[11px] text-emerald-300 font-medium">
                {isMultiChildMode
                  ? 'Batch Pediatric Care Loop'
                  : `${form.relationship}${form.age ? ` · ${form.age} yrs` : ''}`}
              </p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
              Family Dossier
            </span>
          </div>
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Lineage selector (only when not editing an existing member) */}
          {!isEditing && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Lineage / Relationship <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONSHIPS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update({ relationship: r })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-150 ${
                      form.relationship === r
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {r === 'Child' ? '🧒 Child' : r === 'Brother' ? '👦 Brother' : r === 'Sister' ? '👧 Sister' : r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════════ MULTI-CHILD VIEW (when Child is chosen) ════════ */}
          {isMultiChildMode ? (
            <div className="flex flex-col gap-4">

              {/* Individual Child Sections */}
              <div className="flex flex-col gap-3">
                {children.map((c, idx) => (
                  <ChildDossierCard
                    key={c.id}
                    child={c}
                    index={idx}
                    ordinal={getOrdinal(childCount + idx + 1)}
                    canRemove={children.length > 1}
                    sameDoseRoutine={sameDoseRoutine}
                    defaultDoseTime={form.doseTime}
                    onUpdate={(patch) => updateChild(c.id, patch)}
                    onRemove={() => removeChildRow(c.id)}
                  />
                ))}

                {/* Add Another Child Button */}
                <button
                  type="button"
                  onClick={addChildRow}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Child
                </button>
              </div>

              {/* Routine Coordination Toggle (when > 1 child) */}
              {children.length > 1 && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Same routine for all children</p>
                    <p className="text-[10px] text-slate-400">Share unified morning, afternoon &amp; night windows</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sameDoseRoutine}
                    onClick={() => setSameDoseRoutine(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      sameDoseRoutine ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        sameDoseRoutine ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Shared Dose Routine for Children (when toggle is ON or only 1 child) */}
              {sameDoseRoutine && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {children.length === 1 ? "Child's Daily Dose Routine" : "Children's Shared Dose Routine"}
                    </label>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      {children.length === 1 ? "Preset ready" : "Applies to all kids"}
                    </span>
                  </div>
                  <DoseTimeSelector
                    value={form.doseTime}
                    onChange={(doseTime) => update({ doseTime })}
                  />
                </div>
              )}

            </div>
          ) : (
            /* ════════ SINGLE MEMBER VIEW (Father, Mother, Spouse, etc. OR Editing) ════════ */
            <div className="flex flex-col gap-4">

              {/* Avatar picker */}
              <div className="flex flex-col items-center">
                <AvatarPicker
                  name={form.name}
                  value={form.avatar}
                  onChange={(avatar) => update({ avatar })}
                />
              </div>

              {/* Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    Defaults to {form.relationship} if blank
                  </span>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder={`e.g. ${form.relationship === 'Father' ? 'Rajesh Kumar' : form.relationship === 'Mother' ? 'Sunita Devi' : form.relationship === 'Brother' ? 'Rahul Sharma' : 'Family member name'}`}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Age (Years) — Essential for AI Dosing & Safety */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Age (Years)
                  </label>
                  {form.age ? (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      Number(form.age) < 12
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : Number(form.age) >= 65
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {Number(form.age) < 12 ? '🛡️ Pediatric Dosage Shield' : Number(form.age) >= 65 ? '🛡️ Geriatric Safety Shield' : '✓ Adult Dosing Profile'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Recommended for AI Dosage
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={form.age}
                    onChange={(e) => update({ age: e.target.value })}
                    placeholder={form.relationship === 'Father' || form.relationship === 'Mother' ? 'e.g. 62' : 'e.g. 28'}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Essential for AI prescription decoding — prevents dangerous pediatric overdosing and drug contraindications.
                </p>
              </div>



              {/* Telegram Handle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Telegram Handle
                  </label>
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional · For 1-tap reminders
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    @
                  </div>
                  <input
                    type="text"
                    value={form.telegram_username?.replace(/^@/, '') || ''}
                    onChange={(e) => update({ telegram_username: e.target.value ? `@${e.target.value.replace(/^@/, '')}` : '' })}
                    placeholder="username"
                    className="w-full pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150 font-mono"
                  />
                </div>
              </div>

              {/* Dose schedule */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {form.name || form.relationship}'s Dose Schedule
                </label>
                <DoseTimeSelector
                  value={form.doseTime}
                  onChange={(doseTime) => update({ doseTime })}
                />
              </div>

            </div>
          )}

        </div>

        {/* ── Footer Actions ── */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => { onRemove(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all duration-150 active:scale-95"
              aria-label="Remove member"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            {isEditing
              ? 'Save Changes'
              : isMultiChildMode
              ? children.length === 1
                ? 'Add Child to Vault'
                : `Add ${children.length} Children to Vault`
              : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};
