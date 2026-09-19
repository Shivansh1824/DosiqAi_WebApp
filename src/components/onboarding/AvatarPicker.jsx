import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

// 6 clinical avatar presets — emoji-based so zero asset dependencies
const PRESETS = [
  { id: 'preset-1', emoji: '👨‍⚕️', label: 'Clinician' },
  { id: 'preset-2', emoji: '👩‍⚕️', label: 'Care Expert' },
  { id: 'preset-3', emoji: '🧑‍💼', label: 'Professional' },
  { id: 'preset-4', emoji: '👴', label: 'Senior' },
  { id: 'preset-5', emoji: '👩', label: 'Classic' },
  { id: 'preset-6', emoji: '🧑', label: 'Casual' },
];

/**
 * AvatarPicker
 * @param {string}   name        – person's display name (for initials fallback)
 * @param {string}   value       – current avatar: data-url | preset-id | null
 * @param {Function} onChange    – called with new avatar string
 */
export const AvatarPicker = ({ name = '', value, onChange }) => {
  const fileRef = useRef(null);

  const isPreset = value?.startsWith('preset-');
  const isPhoto  = value && !isPreset;
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main preview circle */}
      <div className="relative group">
        <div
          className="w-24 h-24 rounded-full border-4 border-white shadow-xl shadow-black/10 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:scale-105"
          style={{
            background: isPhoto
              ? 'transparent'
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0d9488 100%)',
          }}
          onClick={() => fileRef.current?.click()}
        >
          {isPhoto ? (
            <img src={value} alt="avatar" className="w-full h-full object-cover" />
          ) : isPreset ? (
            <span className="text-4xl leading-none">
              {PRESETS.find(p => p.id === value)?.emoji}
            </span>
          ) : (
            <span className="text-2xl font-black text-white/90 font-display tracking-tight">
              {initials}
            </span>
          )}
        </div>

        {/* Camera overlay on hover */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors duration-150"
          aria-label="Upload photo"
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Preset grid */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          or choose a preset
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              aria-label={p.label}
              className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all duration-200 border-2 ${
                value === p.id
                  ? 'border-emerald-500 bg-emerald-50 scale-110 shadow-md shadow-emerald-200/60'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-105'
              }`}
            >
              {p.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors duration-150"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload your photo
      </button>
    </div>
  );
};
