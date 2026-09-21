import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe, Stethoscope, HeartPulse, Users,
  Menu, X, Settings, LogOut, LayoutDashboard, User, ClipboardList,
  ChevronDown, ChevronsLeft, ChevronsRight, Plus, CheckCircle2,
  Users2, Send
} from 'lucide-react';
import { DosiqLogo } from '../common/DosiqLogo';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// ─── Color Helper ─────────────────────────────────────────────────────────────

const RELATIONSHIP_GRADIENTS = {
  'Self':     'from-emerald-400 to-teal-500',
  'Father':   'from-sky-400 to-cyan-500',
  'Mother':   'from-violet-400 to-fuchsia-500',
  'Child':    'from-amber-400 to-orange-500',
  'Son':      'from-amber-400 to-orange-500',
  'Daughter': 'from-pink-400 to-rose-500',
  'Spouse':   'from-rose-400 to-pink-500',
  'Brother':  'from-teal-400 to-emerald-500',
  'Sister':   'from-fuchsia-400 to-purple-500',
  'Other':    'from-slate-400 to-gray-500',
  'Consolidated': 'from-emerald-500 to-cyan-600',
};

// ─── Avatar Dropdown Component ───────────────────────────────────────────────
import { AvatarDropdown } from './AvatarDropdown';

// ─── Sidebar Navigation Tabs ──────────────────────────────────────────────────

const TABS = [
  { id: 'world',    label: 'Overview',          icon: Globe,        desc: 'Family command center' },
  { id: 'medical',  label: 'Clinical Records',  icon: Stethoscope,  desc: 'Documents & Vault' },
  { id: 'health',   label: 'Health',            icon: HeartPulse,   desc: 'Meds & Biomarkers' },
  { id: 'careloop', label: 'Care Loop',         icon: Send,         desc: 'Schedule & Adherence' },
  { id: 'family',   label: 'Family',            icon: Users,        desc: 'Profile management' },
];

// ─── Sidebar Layout ──────────────────────────────────────────────────────────

export const SidebarLayout = ({
  activeTab,
  onTabChange,
  children,
  profiles = [],
  activeProfile = null,
  onProfileSelect = () => {},
  isCollapsed = true,
  onToggleCollapse = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewingDropdownOpen, setViewingDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);

  const closeMenu = () => setMobileMenuOpen(false);

  const activeTab_ = TABS.find(t => t.id === activeTab);
  const linkedCount = profiles.filter(p => p.telegram_linked || !!p.telegram_chat_id || !!p.telegram_username).length;
  const totalMembers = profiles.length || 1;

  // Close viewing dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setViewingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Is the sidebar effectively showing full labels?
  const isEffectivelyExpanded = !isCollapsed || isHovered;

  // GSAP Smooth Width & Label Transitions
  useGSAP(() => {
    if (!sidebarRef.current) return;

    // Desktop only GSAP tween
    if (window.innerWidth >= 1024) {
      if (isEffectivelyExpanded) {
        gsap.to(sidebarRef.current, {
          width: 256,
          duration: 0.28,
          ease: 'power3.out',
          boxShadow: '8px 0 36px rgba(0, 20, 10, 0.45)',
          overwrite: 'auto',
        });
        gsap.to('.sidebar-label-fade', {
          opacity: 1,
          x: 0,
          duration: 0.22,
          stagger: 0.015,
          overwrite: 'auto',
        });
      } else {
        gsap.to(sidebarRef.current, {
          width: 72,
          duration: 0.26,
          ease: 'power3.inOut',
          boxShadow: '4px 0 32px rgba(6, 78, 59, 0.35)',
          overwrite: 'auto',
        });
        gsap.to('.sidebar-label-fade', {
          opacity: 0,
          x: -6,
          duration: 0.15,
          overwrite: 'auto',
        });
      }
    }
  }, { dependencies: [isEffectivelyExpanded], scope: sidebarRef });

  // Handle Profile Selection
  const handleSelectProfile = (p) => {
    onProfileSelect(p);
    setViewingDropdownOpen(false);
  };

  const isAll = !activeProfile || activeProfile.id === 'all';
  const activeName = isAll ? 'Entire Family' : (activeProfile.name?.split(' ')[0] || activeProfile.relationship);
  const activeRole = isAll
    ? 'Consolidated View'
    : (activeProfile.age ? `${activeProfile.relationship} · ${activeProfile.age} yrs` : activeProfile.relationship);
  const activeGradient = isAll
    ? RELATIONSHIP_GRADIENTS['Consolidated']
    : (RELATIONSHIP_GRADIENTS[activeProfile.relationship] || 'from-emerald-400 to-teal-500');
  const activeInitials = isAll
    ? 'ALL'
    : (activeProfile.initials || activeName[0] || 'P');

  const handleTabEnter = (e) => {
    gsap.to(e.currentTarget, {
      x: 4,
      duration: 0.22,
      ease: 'power2.out',
    });
    const iconBox = e.currentTarget.querySelector('.tab-icon-box');
    if (iconBox) {
      gsap.to(iconBox, {
        scale: 1.14,
        rotation: -4,
        duration: 0.22,
        ease: 'back.out(2)',
      });
    }
  };

  const handleTabLeave = (e) => {
    gsap.to(e.currentTarget, {
      x: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
    const iconBox = e.currentTarget.querySelector('.tab-icon-box');
    if (iconBox) {
      gsap.to(iconBox, {
        scale: 1,
        rotation: 0,
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  };

  return (
    <div
      className="min-h-screen flex text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans relative"
      style={{ background: 'hsl(210, 20%, 98%)' }}
    >
      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* ── Left Sidebar — Emerald & GSAP Animated ── */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setViewingDropdownOpen(false);
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
        style={{
          background: 'linear-gradient(160deg, #022c22 0%, #064e3b 40%, #065f46 75%, #047857 100%)',
          boxShadow: '4px 0 32px rgba(6, 78, 59, 0.35)',
        }}
      >
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundSize: '128px'
          }}
        />

        {/* ── Sidebar Header: Logo (clean & centered when closed, never eaten up) ── */}
        <div className={`h-16 flex items-center shrink-0 border-b border-white/10 relative transition-all duration-200 ${
          isEffectivelyExpanded ? 'justify-between px-4' : 'justify-center px-0'
        }`}>
          {isEffectivelyExpanded ? (
            <div className="flex items-center gap-2.5 overflow-hidden sidebar-label-fade">
              <DosiqLogo size="default" variant="light" showBadge={false} iconOnly={false} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full" title="Dosiq AI">
              <img
                src="/dosiq-logo.jpg"
                alt="dosiq logo"
                width={36}
                height={36}
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-white/10 hover:scale-105 transition-transform"
              />
            </div>
          )}

          {/* Close for mobile drawer */}
          <button
            type="button"
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 lg:hidden transition-colors ml-auto mr-3"
            onClick={closeMenu}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Unstop-style "You're viewing as" Dropdown Widget ── */}
        <div className="px-3 pt-3 pb-2 relative" ref={dropdownRef}>
          {isEffectivelyExpanded ? (
            <div className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-2xl p-2.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[9px] font-bold text-emerald-300/80 uppercase tracking-widest leading-none sidebar-label-fade">
                  You're viewing as
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDropdownOpen(o => !o)}
                className="w-full flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform select-none"
              >
                <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${activeGradient} flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm overflow-hidden`}>
                  {activeProfile?.avatar && !activeProfile.avatar.startsWith('preset-') ? (
                    <img src={activeProfile.avatar} alt={activeName} className="w-full h-full object-cover" />
                  ) : (
                    activeInitials
                  )}
                </div>
                <div className="min-w-0 flex-1 sidebar-label-fade">
                  <p className="text-xs font-black text-white truncate leading-tight">{activeName}</p>
                  <p className="text-[10px] text-emerald-300 font-medium truncate leading-tight">{activeRole}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-300/80 group-hover:text-white transition-transform duration-200 shrink-0 ${viewingDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : (
            /* Compact Profile Avatar Button when sidebar is collapsed */
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setViewingDropdownOpen(o => !o)}
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activeGradient} flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform relative group`}
                title={`Viewing as: ${activeName}`}
              >
                {activeProfile?.avatar && !activeProfile.avatar.startsWith('preset-') ? (
                  <img src={activeProfile.avatar} alt={activeName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  activeInitials
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center">
                  <ChevronDown className="w-2.5 h-2.5 text-emerald-300" />
                </span>
              </button>
            </div>
          )}

          {/* ── Family Selection Dropdown Menu ── */}
          {viewingDropdownOpen && (
            <div
              className={`absolute top-full mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-950/20 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 ${
                !isEffectivelyExpanded ? 'left-14' : 'left-3 right-3'
              }`}
            >
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active View
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {profiles.length} Profiles
                </span>
              </div>

              <div className="p-1.5 max-h-64 overflow-y-auto space-y-0.5">
                {/* 1. All Family (Consolidated) Option */}
                <button
                  type="button"
                  onClick={() => handleSelectProfile({ id: 'all', name: 'Entire Family', relationship: 'Consolidated View', initials: 'ALL' })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    isAll ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-xs">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">Entire Family</p>
                      <p className="text-[10px] text-slate-400">All dossiers combined</p>
                    </div>
                  </div>
                  {isAll && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>

                <div className="h-px bg-slate-100 my-1" />

                {/* 2. Individual Family Members */}
                {profiles.map(p => {
                  const isSelected = activeProfile?.id === p.id;
                  const grad = RELATIONSHIP_GRADIENTS[p.relationship] || 'from-slate-400 to-gray-500';
                  const initials = p.initials || p.name?.[0] || 'P';

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-[10px] font-black text-white overflow-hidden shadow-xs`}>
                          {p.avatar && !p.avatar.startsWith('preset-') ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {p.relationship}
                            {p.age ? ` · ${p.age} yrs` : ''}
                            {p.relationship === 'Child' && p.gender ? ` · ${p.gender}` : ''}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {/* 3. Add Family Member Trigger */}
              <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    setViewingDropdownOpen(false);
                    onTabChange('family');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Family Member</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation Tabs ── */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto relative">
          {/* Section label */}
          {isEffectivelyExpanded && (
            <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-[0.2em] px-3 mb-1.5 sidebar-label-fade">
              Navigation
            </p>
          )}

          {TABS.map(({ id, label, icon: Icon, desc }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onMouseEnter={handleTabEnter}
                onMouseLeave={handleTabLeave}
                onClick={() => { onTabChange(id); closeMenu(); }}
                className={`group flex items-center gap-3 rounded-2xl font-bold text-sm transition-all duration-200 w-full text-left relative overflow-hidden ${
                  isEffectivelyExpanded ? 'px-3.5 py-3' : 'px-0 py-3 justify-center'
                } ${
                  isActive
                    ? 'bg-white/[0.15] text-white shadow-lg'
                    : 'text-emerald-100/70 hover:bg-white/[0.08] hover:text-white'
                }`}
                title={!isEffectivelyExpanded ? label : undefined}
              >
                {/* Active left accent */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-300" />
                )}
                <div className={`tab-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isActive ? 'bg-white/20' : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-200/60 group-hover:text-emerald-200'}`} />
                </div>
                {isEffectivelyExpanded && (
                  <div className="min-w-0 sidebar-label-fade">
                    <p className={`leading-tight truncate ${isActive ? 'text-white' : ''}`}>{label}</p>
                    <p className={`text-[10px] font-medium leading-tight truncate transition-colors ${
                      isActive ? 'text-emerald-300/80' : 'text-emerald-200/40 group-hover:text-emerald-200/60'
                    }`}>{desc}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Sidebar Footer — Telegram Care Loop Status ── */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0 space-y-2.5 relative">
          {isEffectivelyExpanded ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.08] border border-white/10 sidebar-label-fade">
              <div className="relative shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Care Loop</p>
                <p className="text-[10px] text-emerald-300/70 font-medium">
                  {linkedCount} of {totalMembers} linked
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`Care Loop: ${linkedCount}/${totalMembers} linked`}>
              <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}
          {isEffectivelyExpanded && (
            <p className="text-[10px] font-semibold text-emerald-400/40 uppercase tracking-widest text-center sidebar-label-fade">
              © 2026 Dosiq AI
            </p>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
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
