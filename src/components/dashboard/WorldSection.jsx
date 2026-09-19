import React from 'react';
import { Globe, BellRing, Activity, ShieldAlert, CheckCircle2, ChevronRight, UploadCloud } from 'lucide-react';

const STATS = [
  { label: 'Active Regimens', value: 12, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Pending Labs',    value: 3,  icon: UploadCloud, color: 'text-sky-500',  bg: 'bg-sky-50' },
  { label: 'Drug Alerts',     value: 0,  icon: ShieldAlert, color: 'text-slate-400', bg: 'bg-slate-50' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'med',  message: 'Dad took Telma-40 (Morning Dose)', time: '2h ago', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 2, type: 'doc',  message: 'New Blood Report uploaded for Mom', time: '5h ago', icon: UploadCloud, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 3, type: 'alert', message: 'Upcoming: Child vaccination at 4 PM', time: 'Yesterday', icon: BellRing, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const UPCOMING_DOSES = [
  { id: 1, person: 'Dad',   med: 'Metformin 500mg', time: '8:00 PM (After Dinner)' },
  { id: 2, person: 'Self',  med: 'Vitamin D3',      time: '9:00 PM' },
];

export const WorldSection = ({ onNavigate }) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-sky-500" />
          World Overview
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Master command center for your entire family's health.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
            <button className="text-xs font-bold text-sky-600 hover:text-sky-700">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {RECENT_ACTIVITY.map(act => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${act.bg}`}>
                  <act.icon className={`w-4 h-4 ${act.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{act.message}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Across Family */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">Upcoming Doses (Family)</h3>
          </div>
          <div className="flex flex-col gap-3">
            {UPCOMING_DOSES.map(dose => (
              <div key={dose.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {dose.person[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{dose.med}</p>
                    <p className="text-xs text-slate-500 font-medium">{dose.time} · {dose.person}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('health')}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-sky-300 group-hover:text-sky-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Quick action to go to Medical vault to upload */}
            <button 
              onClick={() => onNavigate('medical')}
              className="mt-2 w-full py-3 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all"
            >
              + Upload Document to Vault
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
