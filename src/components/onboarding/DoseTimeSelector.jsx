import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { TimePickerModal } from './TimePickerModal';

const PRESETS = [
  { id: 'standard', label: 'Standard', sub: '8 AM · 2 PM · 8 PM', morning: '08:00', afternoon: '14:00', night: '20:00' },
  { id: 'early',    label: 'Early Bird', sub: '7 AM · 1 PM · 7 PM', morning: '07:00', afternoon: '13:00', night: '19:00' },
  { id: 'custom',   label: 'Custom',    sub: 'Set your own',         morning: null,    afternoon: null,    night: null },
];

const SLOTS = [
  { key: 'morning',   label: 'Morning',   emoji: '🌅' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { key: 'night',     label: 'Night',     emoji: '🌙' },
];

// Format "HH:MM" → "h:MM AM/PM"
const fmt = (t) => {
  if (!t) return '--:--';
  const [hh, mm] = t.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${period}`;
};

/**
 * DoseTimeSelector
 * @param {object}   value    – { morning, afternoon, night } "HH:MM"
 * @param {Function} onChange – called with updated object
 */
export const DoseTimeSelector = ({ value, onChange }) => {
  const [activePreset, setActivePreset] = useState(() => {
    if (value.morning === '08:00' && value.afternoon === '14:00' && value.night === '20:00') return 'standard';
    if (value.morning === '07:00' && value.afternoon === '13:00' && value.night === '19:00') return 'early';
    return 'custom';
  });

  // Which slot has the modal open
  const [openSlot, setOpenSlot] = useState(null);

  const selectPreset = (preset) => {
    setActivePreset(preset.id);
    if (preset.id !== 'custom') {
      onChange({ morning: preset.morning, afternoon: preset.afternoon, night: preset.night });
    }
  };

  const saveSlot = (slot, time) => {
    const next = { ...value, [slot]: time };
    // Re-check if the full resulting time still matches a named preset
    const matched = PRESETS.find(
      p => p.id !== 'custom' && p.morning === next.morning && p.afternoon === next.afternoon && p.night === next.night
    );
    setActivePreset(matched ? matched.id : 'custom');
    onChange(next);
  };

  const activeSlotMeta = SLOTS.find(s => s.key === openSlot);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Preset chips */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl border-2 text-center transition-all duration-200 ${
                activePreset === p.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-200/60'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              <span className={`text-[11px] font-bold ${activePreset === p.id ? 'text-emerald-700' : 'text-slate-700'}`}>
                {p.label}
              </span>
              <span className={`text-[10px] font-medium ${activePreset === p.id ? 'text-emerald-500' : 'text-slate-400'}`}>
                {p.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Time slot buttons — open modal on click */}
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map(({ key, label, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpenSlot(key)}
              className="group flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 active:scale-[0.97]"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600 transition-colors">
                {label}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500 opacity-70" />
                <span className="text-[12px] font-black text-slate-700 group-hover:text-emerald-700 transition-colors" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(value[key])}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal — rendered outside the grid via portal-like approach */}
      {openSlot && (
        <TimePickerModal
          isOpen={true}
          value={value[openSlot]}
          label={`${activeSlotMeta?.label} Dose`}
          emoji={activeSlotMeta?.emoji}
          onSave={(time) => saveSlot(openSlot, time)}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </>
  );
};
