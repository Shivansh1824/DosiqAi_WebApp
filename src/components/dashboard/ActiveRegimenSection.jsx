import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Send, Pill, Coffee, Sun, Moon } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLOT_META = {
  morning:   { icon: Coffee, label: 'Morning',   time: '08:00 AM', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700' },
  afternoon: { icon: Sun,    label: 'Afternoon',  time: '02:00 PM', gradient: 'from-sky-400 to-cyan-400',    bg: 'bg-sky-50',    border: 'border-sky-200',   text: 'text-sky-700'   },
  night:     { icon: Moon,   label: 'Night',      time: '08:00 PM', gradient: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

const CATEGORY_COLORS = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  teal:    'bg-teal-100 text-teal-700 border-teal-200',
  sky:     'bg-sky-100 text-sky-700 border-sky-200',
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  amber:   'bg-amber-100 text-amber-700 border-amber-200',
  rose:    'bg-rose-100 text-rose-700 border-rose-200',
};

// ─── Adherence Badge ──────────────────────────────────────────────────────────

const AdherenceBadge = ({ status, confirmedAt, channel }) => {
  if (status === 'taken') {
    return (
      <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Confirmed {channel === 'telegram' ? 'via Telegram' : ''} {confirmedAt}</span>
      </div>
    );
  }
  if (status === 'skipped') {
    return (
      <div className="flex items-center gap-1 text-red-500 text-[11px] font-semibold">
        <XCircle className="w-3.5 h-3.5" />
        <span>Skipped</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
      <Clock className="w-3.5 h-3.5" />
      <span>Pending</span>
    </div>
  );
};

// ─── Single Medication Card ───────────────────────────────────────────────────

const MedCard = ({ med, onAction }) => {
  const [localStatus, setLocalStatus] = useState(med.status);
  const [loading, setLoading] = useState(false);
  const catColor = CATEGORY_COLORS[med.categoryColor] || CATEGORY_COLORS.emerald;

  const handleAction = async (action) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async
    setLocalStatus(action === 'take' ? 'taken' : 'skipped');
    setLoading(false);
    onAction?.(med.id, action);
  };

  const isPending = localStatus === 'pending';
  const isTaken   = localStatus === 'taken';
  const isSkipped = localStatus === 'skipped';

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-2xl border bg-white transition-all duration-300 ${
        isTaken  ? 'border-emerald-200 bg-emerald-50/30 shadow-sm shadow-emerald-100' :
        isSkipped? 'border-red-100 bg-red-50/20 opacity-70' :
                   'border-slate-200 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50 shadow-sm'
      }`}
    >
      {/* Top row: drug + category */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isTaken ? 'bg-emerald-100' : isSkipped ? 'bg-red-50' : 'bg-slate-100'
          }`}>
            <Pill className={`w-4.5 h-4.5 ${isTaken ? 'text-emerald-600' : isSkipped ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">{med.brand}</p>
            <p className="text-[11px] text-slate-400 font-medium">{med.name}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${catColor}`}>
          {med.category}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {med.time}
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-200" />
        <span>{med.food}</span>
        <span className="w-1 h-1 rounded-full bg-slate-200" />
        <span>{med.duration}</span>
      </div>

      {/* Adherence badge */}
      <AdherenceBadge status={localStatus} confirmedAt={med.confirmedAt} channel={med.channel} />

      {/* Actions — only if pending */}
      {isPending && (
        <div className="flex gap-2 mt-0.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction('take')}
            id={`mark-taken-${med.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all duration-150 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Mark Taken
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction('skip')}
            id={`skip-${med.id}`}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] text-slate-500 text-xs font-bold border border-slate-200 hover:border-red-200 transition-all duration-150 disabled:opacity-60"
          >
            Skip
          </button>
        </div>
      )}

      {/* Telegram confirmation ribbon */}
      {isTaken && med.channel === 'telegram' && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-100">
          <Send className="w-2.5 h-2.5" />
          Confirmed via Telegram Care Loop
        </div>
      )}
    </div>
  );
};

// ─── Slot Group ───────────────────────────────────────────────────────────────

const SlotGroup = ({ slotKey, meds, onAction }) => {
  const meta = SLOT_META[slotKey];
  if (!meta || !meds.length) return null;
  const Icon = meta.icon;

  const takenCount = meds.filter(m => m.status === 'taken').length;
  const pct = Math.round((takenCount / meds.length) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Slot header */}
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${meta.gradient} shadow-sm`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-800">{meta.label}</span>
        <span className="text-xs text-slate-400 font-medium">{meta.time}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${meta.gradient} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500">{takenCount}/{meds.length}</span>
        </div>
      </div>

      {/* Med cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {meds.map(med => (
          <MedCard key={med.id} med={med} onAction={onAction} />
        ))}
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyRegimen = ({ onUpload }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
      <Pill className="w-6 h-6 text-emerald-400" />
    </div>
    <p className="text-sm font-bold text-slate-800">No medications added yet</p>
    <p className="text-xs text-slate-400 max-w-xs">Upload a prescription and let dosiq AI decode it instantly into a daily schedule.</p>
    <button
      type="button"
      onClick={onUpload}
      className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
    >
      Upload Prescription
    </button>
  </div>
);

// ─── Active Regimen Section ───────────────────────────────────────────────────

export const ActiveRegimenSection = ({ medications = [], onUpload, onAction }) => {
  const slots = { morning: [], afternoon: [], night: [] };

  medications.forEach(med => {
    if (slots[med.slot] !== undefined) slots[med.slot].push(med);
  });

  const totalMeds   = medications.length;
  const totalTaken  = medications.filter(m => m.status === 'taken').length;
  const totalPct    = totalMeds > 0 ? Math.round((totalTaken / totalMeds) * 100) : 0;

  const hasAny = totalMeds > 0;

  return (
    <section id="regimen-section" className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-600" />
            Today's Active Regimen
          </h2>
          {hasAny && (
            <p className="text-xs text-slate-500 mt-0.5">
              {totalTaken} of {totalMeds} doses confirmed today · {totalPct}% adherence
            </p>
          )}
        </div>
        {hasAny && (
          <div className="flex items-center gap-2">
            {/* Overall progress bar */}
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600">{totalPct}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      {hasAny ? (
        <div className="flex flex-col gap-6">
          {Object.entries(slots).map(([slotKey, meds]) =>
            meds.length > 0 ? (
              <SlotGroup key={slotKey} slotKey={slotKey} meds={meds} onAction={onAction} />
            ) : null
          )}
        </div>
      ) : (
        <EmptyRegimen onUpload={onUpload} />
      )}
    </section>
  );
};
