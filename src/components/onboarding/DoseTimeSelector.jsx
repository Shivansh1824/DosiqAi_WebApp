import React, { useState } from 'react';
import { Clock } from 'lucide-react';

const PRESETS = [
  {
    id: 'standard',
    label: 'Standard',
    sub: '8 AM · 2 PM · 8 PM',
    morning: '08:00', afternoon: '14:00', night: '20:00',
  },
  {
    id: 'early',
    label: 'Early Bird',
    sub: '7 AM · 1 PM · 7 PM',
    morning: '07:00', afternoon: '13:00', night: '19:00',
  },
  {
    id: 'custom',
    label: 'Custom',
    sub: 'Set your own',
    morning: null, afternoon: null, night: null,
  },
];

/**
 * DoseTimeSelector
 * @param {object}   value    – { morning, afternoon, night } in "HH:MM" format
 * @param {Function} onChange – called with updated { morning, afternoon, night }
 */
export const DoseTimeSelector = ({ value, onChange }) => {
  const [activePreset, setActivePreset] = useState(() => {
    if (value.morning === '08:00' && value.afternoon === '14:00' && value.night === '20:00') return 'standard';
    if (value.morning === '07:00' && value.afternoon === '13:00' && value.night === '19:00') return 'early';
    return 'custom';
  });

  const selectPreset = (preset) => {
    setActivePreset(preset.id);
    if (preset.id !== 'custom') {
      onChange({ morning: preset.morning, afternoon: preset.afternoon, night: preset.night });
    }
  };

  const updateTime = (slot, time) => {
    setActivePreset('custom');
    onChange({ ...value, [slot]: time });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preset chips */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-center transition-all duration-200 ${
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

      {/* Time pickers — always visible so user can see/tweak current values */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { slot: 'morning', label: '🌅 Morning' },
          { slot: 'afternoon', label: '☀️ Afternoon' },
          { slot: 'night', label: '🌙 Night' },
        ].map(({ slot, label }) => (
          <div key={slot} className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              {label}
            </label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500 pointer-events-none" />
              <input
                type="time"
                value={value[slot] || ''}
                onChange={(e) => updateTime(slot, e.target.value)}
                className="w-full pl-7 pr-2 py-2 text-xs font-semibold text-slate-800 rounded-lg border-2 border-slate-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white transition-colors duration-150"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
