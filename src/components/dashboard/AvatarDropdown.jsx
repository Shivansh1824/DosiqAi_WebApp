import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User, LayoutDashboard, ClipboardList, Settings, LogOut,
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: User,            label: 'My Profile',   id: 'profile' },
  { icon: LayoutDashboard, label: 'Dashboard',    id: 'dashboard' },
  { icon: ClipboardList,   label: 'Planning',     id: 'planning' },
  { icon: Settings,        label: 'Settings',     id: 'settings' },
  { icon: LogOut,          label: 'Sign Out',     id: 'signout', danger: true },
];

export const AvatarDropdown = () => {
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
          className="absolute right-0 top-full mt-3 w-60 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            className="px-4 py-3.5 border-b border-slate-100"
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
