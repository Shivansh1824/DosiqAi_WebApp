import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

const CATEGORY_COLORS = {
  'Self':   'bg-emerald-500',
  'Father': 'bg-sky-500',
  'Mother': 'bg-violet-500',
  'Child':  'bg-amber-500',
  'Son':    'bg-amber-500',
  'Daughter': 'bg-pink-500',
  'Spouse': 'bg-rose-500',
  'Brother':'bg-teal-500',
  'Sister': 'bg-fuchsia-500',
  'Other':  'bg-slate-500',
};

export const QuickProfileSwitcher = ({ profiles, activeProfile, onProfileSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeColor = CATEGORY_COLORS[activeProfile?.relationship] || CATEGORY_COLORS['Other'];
  const initials = activeProfile?.name 
    ? activeProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'P';

  const handleSelect = (profile) => {
    onProfileSelect(profile);
    setIsOpen(false);
    
    // Create a temporary toast to show feedback
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-sm font-bold animate-in slide-in-from-bottom-5 fade-in duration-300';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full ${activeColor}"></span> Dashboard updated for ${profile.name.split(' ')[0]}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  return (
    <div className="relative z-20" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all active:scale-95 group"
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden ${activeColor}`}>
          {activeProfile?.avatar && !activeProfile.avatar.startsWith('preset-') ? (
            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none tracking-widest -mb-0.5">Viewing</span>
          <span className="text-xs font-black text-slate-800 leading-tight">
            {activeProfile?.name?.split(' ')[0] || activeProfile?.relationship}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Switch Profile</p>
          </div>
          {profiles.map(p => {
            const isActive = p.id === activeProfile?.id;
            const pColor = CATEGORY_COLORS[p.relationship] || CATEGORY_COLORS['Other'];
            const pInitials = p.name ? p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'P';
            
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${isActive ? 'bg-slate-50' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 overflow-hidden ${pColor}`}>
                    {p.avatar && !p.avatar.startsWith('preset-') ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      pInitials
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.relationship}</p>
                  </div>
                </div>
                {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
