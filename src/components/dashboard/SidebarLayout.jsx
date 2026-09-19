import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe, Stethoscope, HeartPulse, Users,
  Menu, X, Settings, LogOut, LayoutDashboard, User
} from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';

// ─── Avatar Dropdown (Right Header) ──────────────────────────────────────────

const MENU_ITEMS = [
  { icon: User,            label: 'My Profile',   id: 'profile' },
  { icon: LayoutDashboard, label: 'Dashboard',    id: 'dashboard' },
  { icon: Settings,        label: 'Settings',     id: 'settings_1' },
  { icon: Settings,        label: 'Planning',     id: 'planning' },
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
        className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all duration-200 select-none border border-slate-700/50"
        aria-label="User menu"
      >
        <span className="font-bold text-sm tracking-wide">{initials}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden z-50 backdrop-blur-xl"
          style={{ animation: 'dropdownIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{user?.email}</p>
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
  { id: 'world',   label: 'World',   icon: Globe },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'health',  label: 'Health',  icon: HeartPulse },
  { id: 'family',  label: 'Family',  icon: Users },
];

export const SidebarLayout = ({ activeTab, onTabChange, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex bg-slate-50/50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(15,23,42,0.02)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header (Logo) */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <DosiqLogo size="default" showBadge={false} />
          <button
            type="button"
            className="ml-auto p-2 rounded-xl text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={closeMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { onTabChange(id); closeMenu(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
          © 2026 dosiq AI
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen min-w-0 transition-all duration-300">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Context Title/Breadcrumb */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
              <span className="text-sm font-black text-slate-900 leading-tight">
                Dashboard Overview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
