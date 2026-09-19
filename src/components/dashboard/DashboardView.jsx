import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Pill, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Users 
} from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';

export const DashboardView = () => {
  const { user, currentFamilyMember, signOut } = useAuth();

  const displayName = currentFamilyMember?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Caregiver';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <DosiqLogo size="default" showBadge={true} />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800">{displayName}</p>
                <p className="text-[10px] text-slate-500">{user?.email || 'authenticated'}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
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
        <div className="p-6 rounded-2xl glass-card border border-slate-200/90 relative overflow-hidden mb-8 shadow-md shadow-slate-200/50 bg-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Caregiver Locker Initialized</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Your family medical vault is secure and ready. Active dossier profile:{' '}
                <strong className="text-emerald-700 font-semibold">
                  {currentFamilyMember?.relationship || 'Self'} ({currentFamilyMember?.name || displayName})
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Profile: <strong>Self</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Document Vault */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Medical Vault</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Permanent encrypted storage for prescriptions, blood tests, and discharge summaries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span>Ready for Upload</span>
              <Upload className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active Medication Regimen */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Active Regimen</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Normalized dosage schedules (Morning 8 AM, Afternoon 2 PM, Night 8 PM).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
              <span>Auto-Scheduled</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Drug Conflict Shield */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Conflict Shield</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Real-time clinical screening to flag duplicate or conflicting medications.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-semibold">
              <span>Engine Armed</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Telegram Care Loop */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-cyan-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mb-3">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Care Loop</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Automated family check-ins with 1-tap confirmation buttons for elderly relatives.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-cyan-700 font-semibold">
              <span>Bot Online</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
