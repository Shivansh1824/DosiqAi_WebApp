import React, { useRef } from 'react';
import { Trash2, Camera, Upload } from 'lucide-react';
import { DoseTimeSelector } from './DoseTimeSelector';
import { compressAvatarFile } from '../../lib/imageUtils';

/**
 * ChildDossierCard
 * Sub-card for configuring an individual child within the multi-child onboarding view.
 */
export const ChildDossierCard = ({
  child,
  index,
  ordinal,
  canRemove,
  sameDoseRoutine,
  defaultDoseTime,
  onUpdate,
  onRemove,
}) => {
  const childFileRef = useRef(null);

  const handleChildPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAvatarFile(file, 360, 0.85);
        onUpdate({ avatar: compressed });
      } catch (err) {
        console.error('Error uploading child photo:', err);
      }
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/90 border-2 border-slate-200 flex flex-col gap-3">
      {/* Child Card Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          {/* Child Photo Thumbnail / Avatar Picker */}
          <div className="relative group">
            <div
              onClick={() => childFileRef.current?.click()}
              className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500 bg-emerald-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all shrink-0"
              title="Click to upload child's photo"
            >
              {child.avatar && !child.avatar.startsWith('preset-') ? (
                <img src={child.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{child.gender === 'female' ? '👧' : '👦'}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => childFileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-white"
              title="Upload photo"
            >
              <Camera className="w-2 h-2" />
            </button>
            <input
              ref={childFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChildPhoto}
            />
          </div>

          <span className="text-xs font-bold text-slate-800">
            {child.name.trim() || `Child #${index + 1}`} ({ordinal} Child)
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 p-1 text-xs transition-colors rounded-lg hover:bg-red-50"
            title="Remove child"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Gender Selector: Boy (Son) / Girl (Daughter) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onUpdate({ gender: 'male' })}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
            child.gender === 'male'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
          }`}
        >
          <span>👦</span> Boy (Son)
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ gender: 'female' })}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
            child.gender === 'female'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
          }`}
        >
          <span>👧</span> Girl (Daughter)
        </button>
      </div>

      {/* Name and Age Inputs */}
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Name
          </label>
          <input
            type="text"
            value={child.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`e.g. ${child.gender === 'female' ? 'Ananya' : 'Aarav'}`}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none bg-white transition-colors"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Age (Yrs)
          </label>
          <input
            type="number"
            min="0"
            max="25"
            value={child.age}
            onChange={(e) => onUpdate({ age: e.target.value })}
            placeholder="e.g. 7"
            className="w-full px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-300 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:outline-none bg-white transition-colors"
          />
        </div>
      </div>

      {child.age && (
        <div className="text-[10px] font-semibold flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded-full border text-[9px] ${
            Number(child.age) < 12
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {Number(child.age) < 12 ? '🛡️ Pediatric Dosage Shield' : '✓ Adolescent Profile'}
          </span>
          <span className="text-slate-400 text-[10px]">· {child.age} years old</span>
        </div>
      )}

      {/* Individual child dose schedule if toggle is OFF */}
      {!sameDoseRoutine && (
        <div className="pt-2.5 border-t border-slate-200/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {child.name.trim() || `Child #${index + 1}`}'s Schedule
            </label>
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              Individual
            </span>
          </div>
          <DoseTimeSelector
            value={child.doseTime || defaultDoseTime}
            onChange={(doseTime) => onUpdate({ doseTime })}
          />
        </div>
      )}
    </div>
  );
};
