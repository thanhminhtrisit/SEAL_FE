import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Settings, LogOut, UserCircle, Shield, Briefcase, Code2, Gavel, BookOpen, Users, User } from 'lucide-react';
import type { Role } from '../types';
import { useAuth } from '../../auth/AuthContext';
import { getMe, type MeResponse } from '../../api/auth';
import { NotificationBell } from './notification_bell/NotificationBell';

const ROLE_META: Record<Role, { label: string; icon: typeof Shield; color: string }> = {
  PUBLIC:            { label: 'Public View',       icon: User,       color: 'text-slate-500' },
  ADMIN:             { label: 'Admin',              icon: Shield,     color: 'text-red-500' },
  SUPER_COORDINATOR: { label: 'Super Coordinator',  icon: Briefcase,  color: 'text-purple-600' },
  EVENT_COORDINATOR: { label: 'Event Coordinator',  icon: Code2,      color: 'text-blue-600' },
  INTERNAL_JUDGE:    { label: 'Internal Judge',     icon: Gavel,      color: 'text-amber-600' },
  GUEST_JUDGE:       { label: 'Guest Judge',        icon: Gavel,      color: 'text-orange-600' },
  MENTOR:            { label: 'Mentor',             icon: BookOpen,   color: 'text-teal-600' },
  TEAM_LEADER:       { label: 'Team Leader',        icon: Users,      color: 'text-cyan-600' },
  TEAM_MEMBER:       { label: 'Team Member',        icon: UserCircle, color: 'text-green-600' },
};


function avatarInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface HeaderProps {
  currentRole: Role;
  onLogout?: () => void;
  breadcrumbs: string[];
  onNavigate?: (screen: string) => void;
}

export function Header({ currentRole, onLogout, breadcrumbs, onNavigate }: HeaderProps) {
  const auth = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch real user info whenever the user logs in; clear on logout
  useEffect(() => {
    if (!auth.isAuthenticated) { setMe(null); return; }
    getMe().then(setMe).catch(() => { /* silently ignore — JWT data still shown */ });
  }, [auth.isAuthenticated]);

  const roleInfo = ROLE_META[currentRole];

  const displayName = me?.fullName ?? '…';
  const displayEmail = me?.email ?? '';
  const displayRole = me?.roleCode ?? roleInfo.label;
  const displayAvatar = me ? avatarInitials(me.fullName) : roleInfo.label.slice(0, 2).toUpperCase();

  const closeAll = () => { setShowProfile(false); };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav className="flex-1 flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-400 hover:text-slate-600 cursor-pointer'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Role badge — shows real roleCode from /me once loaded */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm select-none">
        <roleInfo.icon className={`w-4 h-4 ${roleInfo.color}`} />
        <span className="font-medium text-slate-700">{displayRole}</span>
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(v => !v);}}
          className="flex items-center gap-2.5 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center" style={{ fontFamily: 'var(--font-display)' }}>
            {displayAvatar}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{displayName}</p>
            <p className="text-xs text-slate-400 leading-tight truncate max-w-[160px]">{displayEmail}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{displayRole}</p>
            </div>
            <button onClick={() => { onNavigate?.('profile'); closeAll(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <UserCircle className="w-4 h-4 text-slate-400" /> My Profile
            </button>
            <button onClick={() => { onNavigate?.('admin-config'); closeAll(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="w-4 h-4 text-slate-400" /> Settings
            </button>
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { closeAll(); onLogout?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
