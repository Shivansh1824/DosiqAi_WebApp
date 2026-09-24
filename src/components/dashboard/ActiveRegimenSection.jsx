import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Send, Pill, Coffee, Sun, Moon, 
  ExternalLink, Sparkles, FileText, Stethoscope, ChevronDown, ChevronUp,
  RotateCcw, Check, Zap, AlertCircle
} from 'lucide-react';

const SLOT_META = {
  morning:   { icon: Coffee, label: 'Morning Slot',   time: '08:00 AM', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800' },
  afternoon: { icon: Sun,    label: 'Afternoon Slot', time: '02:00 PM', gradient: 'from-sky-400 to-cyan-400',    bg: 'bg-sky-50',    border: 'border-sky-200',   text: 'text-sky-800'   },
  night:     { icon: Moon,   label: 'Night Slot',     time: '08:00 PM', gradient: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
};

const CATEGORY_COLORS = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  teal:    'bg-teal-50 text-teal-800 border-teal-200',
  sky:     'bg-sky-50 text-sky-800 border-sky-200',
  violet:  'bg-violet-50 text-violet-800 border-violet-200',
  amber:   'bg-amber-50 text-amber-800 border-amber-200',
  rose:    'bg-rose-50 text-rose-800 border-rose-200',
};

// ─── Single Active Medication Card ───────────────────────────────────────────

const ActiveMedCard = ({ med, onAction, onComplete }) => {
  const [localStatus, setLocalStatus] = useState(med.status || 'pending');
  const [loading, setLoading] = useState(false);
  const catColor = CATEGORY_COLORS[med.categoryColor] || CATEGORY_COLORS.emerald;

  const handleAction = async (action) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setLocalStatus(action === 'take' ? 'taken' : 'skipped');
    setLoading(false);
    onAction?.(med.id, action);
  };

  const isTaken = localStatus === 'taken';
  const isSkipped = localStatus === 'skipped';
  const isPending = localStatus === 'pending' || localStatus === 'active';

  return (
    <div
      className={`relative flex flex-col justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 bg-white ${
        isTaken ? 'border-emerald-300 bg-emerald-50/30 shadow-xs' :
        isSkipped ? 'border-red-200 bg-red-50/20 opacity-80' :
        'border-slate-200 hover:border-emerald-300 hover:shadow-md shadow-xs'
      }`}
    >
      {/* Top Header: Drug Name + Category + Telegram Live Badge */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                {med.brand || med.name}
              </h4>
              {med.strength && (
                <span className="text-xs font-black px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {med.strength}
                </span>
              )}
            </div>
            {med.scientific_name && (
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {med.scientific_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Send className="w-2.5 h-2.5 text-emerald-600" />
            Live Synced
          </span>
          {med.category && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${catColor}`}>
              {med.category}
            </span>
          )}
        </div>
      </div>

      {/* Meta Info: Time, Meal, Duration */}
      <div className="flex items-center gap-2.5 text-xs text-slate-600 flex-wrap pt-1 border-t border-slate-100 font-medium">
        <span className="flex items-center gap-1 text-slate-700 font-bold">
          <Clock className="w-3.5 h-3.5 text-emerald-600" /> {med.time || '08:00 AM'}
        </span>
        <span className="text-slate-300">•</span>
        <span>{med.food || 'With Food'}</span>
        <span className="text-slate-300">•</span>
        <span>{med.duration || 'Ongoing Course'}</span>
        {med.doc_name && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={med.doc_name}>
              📄 {med.doc_name}
            </span>
          </>
        )}
      </div>

      {/* Action Buttons: Take / Skip + Mark Completed */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          {isPending && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('take')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Taken</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('skip')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] text-slate-600 text-xs font-bold transition-all border border-slate-200"
              >
                Skip
              </button>
            </>
          )}

          {isTaken && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dose Confirmed via Care Loop</span>
            </div>
          )}

          {isSkipped && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Dose Skipped</span>
            </div>
          )}
        </div>

        {/* Mark Completed Button */}
        <button
          type="button"
          onClick={() => onComplete?.(med.id)}
          className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors shrink-0"
          title="Mark this medicine's treatment course as completed"
        >
          Finish Course
        </button>
      </div>
    </div>
  );
};

// ─── Extracted Prescription Medicine Card (Pending Sync) ─────────────────────

const UnlinkedPrescriptionMedCard = ({ med, onSync }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncClick = async () => {
    setSyncing(true);
    await onSync?.(med);
    setSyncing(false);
  };

  return (
    <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-300 hover:bg-white transition-all duration-150">
      {/* Attached Document Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-800 truncate" title={med.doc_name}>
            {med.doc_name || 'Prescription Dossier'}
          </span>
        </div>
        {med.doctor_name && (
          <span className="text-[10px] text-slate-500 font-medium">
            Prescribed by {med.doctor_name}
          </span>
        )}
      </div>

      {/* Drug details */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs text-slate-700">
            <Pill className="w-4.5 h-4.5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h5 className="text-sm font-black text-slate-900 leading-tight">
                {med.name}
              </h5>
              {med.strength && (
                <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-800">
                  {med.strength}
                </span>
              )}
              {med.form && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                  {med.form}
                </span>
              )}
            </div>
            {med.scientific_name && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Active: {med.scientific_name}
              </p>
            )}
          </div>
        </div>

        {/* 1-Tap Connect to Telegram Button */}
        <button
          type="button"
          disabled={syncing}
          onClick={handleSyncClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black shadow-sm shadow-emerald-700/20 transition-all shrink-0"
        >
          {syncing ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>{syncing ? 'Connecting...' : 'Connect to Telegram'}</span>
        </button>
      </div>

      {/* Dosage, timing & doctor instructions */}
      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-1 font-medium">
        <span className="font-bold text-slate-800">
          Schedule: {typeof med.slot === 'string' ? med.slot : (med.timing?.dosage || 'Daily')}
        </span>
        <span className="text-slate-300">•</span>
        <span>{typeof med.food === 'string' ? med.food : 'After Food'}</span>
        {med.duration && (
          <>
            <span className="text-slate-300">•</span>
            <span>{med.duration}</span>
          </>
        )}
        {med.dosage_instruction && (
          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            Note: &ldquo;{med.dosage_instruction}&rdquo;
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Completed Medication Card ────────────────────────────────────────────────

const CompletedMedCard = ({ med, onReactivate }) => (
  <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap opacity-85">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-bold text-slate-800">{med.brand || med.name}</h5>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Course Finished
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {med.duration ? `Duration: ${med.duration}` : 'Completed regimen'} {med.doc_name ? `• From ${med.doc_name}` : ''}
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onReactivate?.(med)}
      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
    >
      Re-activate
    </button>
  </div>
);

// ─── Main ActiveRegimenSection ────────────────────────────────────────────────

export const ActiveRegimenSection = ({ 
  medications = [], 
  onSyncMedicine, 
  onCompleteMedicine, 
  onAction 
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'unlinked' | 'completed'

  // Categorize medications
  const activeMeds = medications.filter(m => m.status === 'active' || m.is_synced);
  const completedMeds = medications.filter(m => m.status === 'completed');
  const unlinkedMeds = medications.filter(m => m.status === 'unlinked' || (!m.is_synced && m.status !== 'completed'));

  const totalCount = medications.length;
  const activeCount = activeMeds.length;
  const unlinkedCount = unlinkedMeds.length;
  const completedCount = completedMeds.length;

  return (
    <section id="regimen-section" className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              Clinical Medication Center
            </h2>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Live Telegram care loop synchronization, prescription extractions, and completed courses.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlinked')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'unlinked' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Sync ({unlinkedCount})
          </button>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'completed' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      {/* ── 1. ACTIVE MEDICINES (LIVE SYNCED WITH TELEGRAM) ────────────────── */}
      {(filter === 'all' || filter === 'active') && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Medicines (Synced to Telegram Care Loop)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeCount} Active
              </span>
            </div>
          </div>

          {activeCount > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {activeMeds.map(med => (
                <ActiveMedCard 
                  key={med.id} 
                  med={med} 
                  onAction={onAction}
                  onComplete={onCompleteMedicine}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center gap-1.5 py-6">
              <p className="text-xs font-bold text-slate-700">No active medicines synced yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Connect any extracted prescription medicine below to activate automated Telegram reminders.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 2. EXTRACTED PRESCRIPTION MEDICINES (PENDING SYNC) ─────────────── */}
      {(filter === 'all' || filter === 'unlinked') && unlinkedCount > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Prescription Medicines (Extracted from Documents)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {unlinkedCount} Pending Sync
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Click &lsquo;Connect to Telegram&rsquo; to start live sync
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {unlinkedMeds.map(med => (
              <UnlinkedPrescriptionMedCard 
                key={med.id} 
                med={med} 
                onSync={onSyncMedicine}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 3. COMPLETED MEDICINES ────────────────────────────────────────── */}
      {(filter === 'all' || filter === 'completed') && completedCount > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Completed Medicines &amp; Finished Courses
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {completedCount} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {completedMeds.map(med => (
              <CompletedMedCard 
                key={med.id} 
                med={med} 
                onReactivate={onSyncMedicine}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no medicines at all */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-white border border-slate-100 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Pill className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-slate-800">No medications found</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Upload a prescription in Clinical Records to automatically decode and populate your medicines here.
          </p>
        </div>
      )}
    </section>
  );
};
