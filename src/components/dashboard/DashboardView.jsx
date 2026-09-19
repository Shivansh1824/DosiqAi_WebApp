import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  HeartPulse, 
  LogOut, 
  User, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Pill, 
  Activity, 
  Send, 
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';

export const DashboardView = () => {
  const { user, currentFamilyMember, isDemoUser, signOut } = useAuth();

  const displayName = currentFamilyMember?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Caregiver';

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold font-display shadow-md shadow-emerald-500/20">
              <HeartPulse className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                Dosiq<span className="text-emerald-400">AI</span>
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium">
                Vault Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isDemoUser && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Judge Demo Session</span>
              </span>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200">{displayName}</p>
                <p className="text-[10px] text-slate-400">{user?.email || 'authenticated'}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:text-red-300 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl glass-card border border-slate-700/60 relative overflow-hidden mb-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Caregiver Locker Initialized</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Your secure family medical vault is operational. Active dossier profile:{' '}
                <strong className="text-emerald-400 font-medium">
                  {currentFamilyMember?.relationship || 'Self'} ({currentFamilyMember?.name || displayName})
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Profile: <strong>Self</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Foundations for Next Phase) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Document Vault */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Medical Vault</h3>
              <p className="text-xs text-slate-400 mt-1">
                Permanent encrypted storage for prescriptions, blood tests, and discharge summaries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
              <span>Ready for Upload</span>
              <Upload className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active Medication Regimen */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/30 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Active Regimen</h3>
              <p className="text-xs text-slate-400 mt-1">
                Normalized dosage times (Morning 8 AM, Afternoon 2 PM, Night 8 PM).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
              <span>Auto-Scheduled</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Drug Conflict Shield */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 hover:border-amber-500/30 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Conflict Shield</h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time clinical screening to flag duplicate or conflicting drugs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-400 font-medium">
              <span>Engine Armed</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Telegram Care Loop */}
          <div className="p-5 rounded-xl glass-panel border border-slate-800 hover:border-teal-500/30 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Care Loop</h3>
              <p className="text-xs text-slate-400 mt-1">
                Telegram interactive check-ins with 1-tap inline buttons for family members.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-teal-400 font-medium">
              <span>Bot Online</span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
