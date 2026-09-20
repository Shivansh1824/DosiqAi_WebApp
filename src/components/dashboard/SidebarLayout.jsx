import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe, Stethoscope, HeartPulse, Users,
  Menu, X, Settings, LogOut, LayoutDashboard, User, ClipboardList
} from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';

// ─── Avatar Dropdown (Right Header) ──────────────────────────────────────────

const MENU_ITEMS = [
  { icon: User,            label: 'My Profile',   id: 'profile' },
  { icon: LayoutDashboard, label: 'Dashboard',    id: 'dashboard' },
  { icon: ClipboardList,   label: 'Planning',     id: 'planning' },
  { icon: Settings,        label: 'Settings',     id: 'settings' },
  { icon: LogOut,          label: 'Sign Out',     id: 'signout', danger: true },
];

const AvatarDropdown = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleItemClick = (id) => {
    setOpen(false);
    if (id === 'signout') signOut();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm hover:border-emerald-300 active:scale-95 transition-all duration-200 select-none"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <span className="font-bold text-[11px] text-white tracking-wide">{initials}</span>
        </div>
        <span className="text-sm font-bold text-slate-800 hidden sm:block max-w-[120px] truncate">{displayName}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-60 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden z-50"
          style={{ animation: 'dropdownIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="px-4 py-3.5 border-b border-slate-100"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="font-black text-sm text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-emerald-300 truncate font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="py-2">
            {MENU_ITEMS.map(({ icon: Icon, label, id, danger }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleItemClick(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  danger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar Layout ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'world',    label: 'Overview',          icon: Globe,        desc: 'Family command center' },
  { id: 'medical',  label: 'Clinical Records',  icon: Stethoscope,  desc: 'Documents & Vault' },
  { id: 'health',   label: 'Health',            icon: HeartPulse,   desc: 'Meds & Biomarkers' },
  { id: 'family',   label: 'Family',            icon: Users,        desc: 'Profile management' },
];

export const SidebarLayout = ({ activeTab, onTabChange, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const activeTab_ = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen flex text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans"
      style={{ background: 'hsl(210, 20%, 98%)' }}
    >
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sidebarGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* ── Left Sidebar — Emerald ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(160deg, #022c22 0%, #064e3b 40%, #065f46 75%, #047857 100%)',
          boxShadow: '4px 0 32px rgba(6, 78, 59, 0.35)',
        }}
      >
        {/* Subtle noise/texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }}
        />

        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-5 shrink-0 border-b border-white/10 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-none">dosiq</p>
              <p className="text-emerald-300 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">AI · Medical Co-Pilot</p>
            </div>
          </div>
          <button
            type="button"
            className="ml-auto p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            onClick={closeMenu}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto relative">
          {/* Section label */}
          <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-[0.2em] px-3 mb-2">Navigation</p>

          {TABS.map(({ id, label, icon: Icon, desc }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { onTabChange(id); closeMenu(); }}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 w-full text-left relative overflow-hidden ${
                  isActive
                    ? 'bg-white/[0.15] text-white shadow-lg'
                    : 'text-emerald-100/70 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {/* Active left accent */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-300" />
                )}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isActive ? 'bg-white/20' : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-200/60 group-hover:text-emerald-200'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`leading-tight truncate ${isActive ? 'text-white' : ''}`}>{label}</p>
                  <p className={`text-[10px] font-medium leading-tight truncate transition-colors ${
                    isActive ? 'text-emerald-300/80' : 'text-emerald-200/40 group-hover:text-emerald-200/60'
                  }`}>{desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer — Telegram Status Indicator */}
        <div className="px-4 py-5 border-t border-white/10 shrink-0 space-y-3 relative">
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white/[0.08] border border-white/10">
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Care Loop Active</p>
              <p className="text-[10px] text-emerald-300/70 font-medium">2 of 3 members linked</p>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-emerald-400/40 uppercase tracking-widest text-center">© 2026 Dosiq AI</p>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen min-w-0">

        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">
                  Dashboard
                </span>
                <span className="text-sm font-black text-slate-900 leading-tight">
                  {activeTab_?.label || 'Overview'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AvatarDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-8 flex flex-col gap-8">
          {children}
        </main>

      </div>
    </div>
  );
};
