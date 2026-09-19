import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut, Settings, User, LayoutDashboard, Upload,
  ChevronDown, Bell, Send, Zap
} from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';
import { useAuth } from '../../context/AuthContext';

// ─── Profile Switcher Pills ───────────────────────────────────────────────────

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

const ProfilePill = ({ profile, active, onSelect }) => {
  const color = CATEGORY_COLORS[profile.relationship] || 'bg-slate-500';
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (profile.relationship || 'P')[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shrink-0 ${
        active
          ? 'bg-slate-900 text-white border-slate-700 shadow-md shadow-slate-900/20'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <span className={`w-4 h-4 rounded-full ${color} text-white flex items-center justify-center text-[9px] font-black shrink-0`}>
        {initials.charAt(0)}
      </span>
      {profile.relationship === 'Self' ? 'You' : profile.name?.split(' ')[0] || profile.relationship}
    </button>
  );
};

// ─── User Avatar Dropdown ─────────────────────────────────────────────────────

const MENU_ITEMS = [
  { icon: User,            label: 'My Profile',   id: 'profile' },
  { icon: LayoutDashboard, label: 'Dashboard',    id: 'dashboard' },
  { icon: Settings,        label: 'Settings',     id: 'settings' },
  { icon: Settings,        label: 'Planning',     id: 'planning' },
  { icon: LogOut,          label: 'Sign Out',     id: 'signout',  danger: true },
];

const UserAvatarDropdown = ({ user, onSignOut }) => {
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

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleItem = (id) => {
    setOpen(false);
    if (id === 'signout') onSignOut();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 group"
        aria-label="Open user menu"
        aria-expanded={open}
      >
        {/* Avatar circle */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/25 ring-2 ring-white ring-offset-1 ring-offset-transparent group-hover:ring-emerald-200 transition-all duration-200 select-none">
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/12 overflow-hidden z-50"
          style={{ animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {MENU_ITEMS.map(({ icon: Icon, label, id, danger }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleItem(id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Header ─────────────────────────────────────────────────────────────

export const DashboardHeader = ({
  profiles,
  activeProfile,
  onProfileChange,
  onUpload,
}) => {
  const { user, signOut } = useAuth();

  const careLoopActive = activeProfile?.care_loop_enabled ?? false;
  const botLinked = activeProfile?.telegram_linked ?? false;

  return (
    <>
      {/* Dropdown keyframe */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_0_0_rgba(15,23,42,0.04)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: Logo */}
          <div className="shrink-0">
            <DosiqLogo size="default" showBadge={false} />
          </div>

          {/* Center: Profile switcher (scrollable on mobile) */}
          {profiles && profiles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 justify-center max-w-sm">
              {profiles.map(p => (
                <ProfilePill
                  key={p.id}
                  profile={p}
                  active={activeProfile?.id === p.id}
                  onSelect={onProfileChange}
                />
              ))}
            </div>
          )}

          {/* Right: Care Loop pill + Upload + User */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Care Loop status pill — desktop only */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
              careLoopActive && botLinked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${careLoopActive && botLinked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {careLoopActive && botLinked ? (
                <><Send className="w-3 h-3" /> Care Loop</>
              ) : (
                <><Send className="w-3 h-3" /> Link Bot</>
              )}
            </div>

            {/* Notification bell */}
            <button
              type="button"
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Unread dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
            </button>

            {/* Upload CTA */}
            <button
              type="button"
              onClick={onUpload}
              id="upload-document-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all duration-150"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Doc</span>
            </button>

            {/* User avatar + dropdown */}
            <UserAvatarDropdown user={user} onSignOut={signOut} />
          </div>

        </div>
      </header>
    </>
  );
};
