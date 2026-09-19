import React from 'react';
import { X, Phone } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker';
import { DoseTimeSelector } from './DoseTimeSelector';

const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'];

/**
 * FamilyMemberCard
 * Interactive drawer card to configure a single family member's details.
 *
 * @param {object}   member   – { id, name, relationship, phone, avatar, doseTime }
 * @param {Function} onChange – called with updated member object
 * @param {Function} onRemove – called when the × button is clicked
 */
export const FamilyMemberCard = ({ member, onChange, onRemove }) => {
  const update = (patch) => onChange({ ...member, ...patch });

  return (
    <div className="rounded-2xl border-2 border-emerald-300/70 bg-emerald-50/30 backdrop-blur-sm shadow-sm shadow-emerald-100/50 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/8 border-b border-emerald-200/60">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-emerald-800 font-display">
            {member.name || member.relationship} Profile
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            {member.relationship}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors duration-150"
          aria-label={`Remove ${member.relationship}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: avatar + name + relationship */}
        <div className="flex flex-col gap-3">
          <AvatarPicker
            name={member.name}
            value={member.avatar}
            onChange={(avatar) => update({ avatar })}
          />
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={member.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={`e.g. ${member.relationship === 'Father' ? 'Rajesh Kumar' : member.relationship === 'Mother' ? 'Sunita Devi' : 'Family member name'}`}
                className="w-full px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Relationship
              </label>
              <select
                value={member.relationship}
                onChange={(e) => update({ relationship: e.target.value })}
                className="w-full px-3 py-2.5 text-sm font-semibold text-slate-800 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150 appearance-none"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {/* Phone for this member's care loop */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Their Mobile (Telegram Check-ins)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                <input
                  type="tel"
                  value={member.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: dose times */}
        <div className="flex flex-col gap-2">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {member.name || member.relationship}'s Dose Schedule
          </label>
          <DoseTimeSelector
            value={member.doseTime}
            onChange={(doseTime) => update({ doseTime })}
          />
        </div>
      </div>
    </div>
  );
};
