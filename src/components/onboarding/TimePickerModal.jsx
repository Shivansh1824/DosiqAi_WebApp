import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * TimePickerModal — a premium drum-roller time picker.
 * @param {boolean}  isOpen   – whether the modal is visible
 * @param {string}   value    – "HH:MM"
 * @param {string}   label    – e.g. "Morning Dose"
 * @param {string}   emoji    – e.g. "🌅"
 * @param {Function} onSave   – called with "HH:MM"
 * @param {Function} onClose  – close without saving
 */
export const TimePickerModal = ({ isOpen, value, label, emoji, onSave, onClose }) => {
  const parseTime = (t) => {
    const [h, m] = (t || '08:00').split(':').map(Number);
    return { h: isNaN(h) ? 8 : h, m: isNaN(m) ? 0 : m, period: h >= 12 ? 'PM' : 'AM' };
  };

  const [h, setH] = useState(8);
  const [m, setM] = useState(0);
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (isOpen) {
      const p = parseTime(value);
      const hour12 = p.h % 12 === 0 ? 12 : p.h % 12;
      setH(hour12);
      setM(p.m);
      setPeriod(p.period);
    }
  }, [isOpen, value]);

  const cycleH = useCallback((dir) => {
    setH(prev => {
      let next = prev + dir;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  }, []);

  const cycleM = useCallback((dir) => {
    setM(prev => {
      let next = prev + (dir * 5);
      if (next >= 60) next = 0;
      if (next < 0) next = 55;
      return next;
    });
  }, []);

  const handleSave = () => {
    let hour24 = h % 12;
    if (period === 'PM') hour24 += 12;
    const hh = String(hour24).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    onSave(`${hh}:${mm}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl shadow-black/20 w-full max-w-xs overflow-hidden"
        style={{ boxShadow: '0 32px 64px -12px rgba(15,23,42,0.28), 0 0 0 1px rgba(226,232,240,0.8)' }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0d9488 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">{label}</span>
              </div>
              <p className="text-white/60 text-[11px]">Set the preferred dose time</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          {/* Live display */}
          <div className="mt-4 text-center">
            <span
              className="font-black text-white tracking-tight"
              style={{ fontSize: '3rem', fontFamily: 'Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}
            >
              {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
            </span>
            <span className="text-2xl font-bold text-emerald-300 ml-2">{period}</span>
          </div>
        </div>

        {/* Drum roller */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-3">

            {/* Hours */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => cycleH(1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div className="w-20 h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-800 font-display" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {String(h).padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => cycleH(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hour</span>
            </div>

            {/* Separator */}
            <span className="text-3xl font-black text-slate-300 mb-5">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => cycleM(1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div className="w-20 h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-800 font-display" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {String(m).padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => cycleM(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-all duration-150 active:scale-95"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min</span>
            </div>

            {/* AM / PM toggle */}
            <div className="flex flex-col gap-2 mb-5">
              {['AM', 'PM'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`w-14 h-[52px] rounded-2xl text-sm font-black transition-all duration-200 ${
                    period === p
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 mt-2 mb-1">
            {[
              { label: '+15 min', action: () => cycleM(3) },
              { label: '+30 min', action: () => cycleM(6) },
              { label: '+1 hour', action: () => cycleH(1) },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex-1 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-150"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
          >
            Set Time
          </button>
        </div>
      </div>
    </div>
  );
};
