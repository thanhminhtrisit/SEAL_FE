import React, { useState } from 'react';
import { Bell, ChevronDown, Settings, LogOut, UserCircle, Shield, Briefcase, Code2, Gavel, BookOpen, Users, User } from 'lucide-react';
import type { Role } from '../types';

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

const roleUsers: Record<Role, { name: string; email: string; avatar: string }> = {
  PUBLIC: { name: 'Guest', email: '', avatar: 'GU' },
  ADMIN: { name: 'Nguyen Van An', email: 'an.nv@fpt.edu.vn', avatar: 'NA' },
  SUPER_COORDINATOR: { name: 'Tran Thi Bich', email: 'bich.tt@fpt.edu.vn', avatar: 'TB' },
  EVENT_COORDINATOR: { name: 'Le Minh Cuong', email: 'cuong.lm@fpt.edu.vn', avatar: 'LC' },
  INTERNAL_JUDGE: { name: 'Pham Duc Dat', email: 'dat.pd@fpt.edu.vn', avatar: 'PD' },
  GUEST_JUDGE: { name: 'Dr. Sarah Chen', email: 'schen@industry.com', avatar: 'SC' },
  MENTOR: { name: 'Hoang Thi Em', email: 'em.ht@fpt.edu.vn', avatar: 'HE' },
  TEAM_LEADER: { name: 'Nguyen Thanh Phong', email: 'phong.nt@student.fpt.edu.vn', avatar: 'NP' },
  TEAM_MEMBER: { name: 'Do Thi Quynh', email: 'quynh.dt@student.fpt.edu.vn', avatar: 'DQ' },
};

const notifications = [
  { id: 1, text: 'Event "SEAL Hackathon Summer 2026" approved by Super Coordinator', time: '5m ago', unread: true },
  { id: 2, text: 'Team "Code Seals" submitted project for Preliminary Round', time: '1h ago', unread: true },
  { id: 3, text: 'New participant registration pending approval', time: '2h ago', unread: true },
  { id: 4, text: 'Scoring deadline in 24 hours – Final Round', time: '3h ago', unread: false },
  { id: 5, text: 'RBL analysis complete for Preliminary Round', time: '1d ago', unread: false },
];

interface HeaderProps {
  currentRole: Role;
  onLogout?: () => void;
  breadcrumbs: string[];
  onNavigate?: (screen: string) => void;
}

export function Header({ currentRole, onLogout, breadcrumbs, onNavigate }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const user = roleUsers[currentRole];
  const roleInfo = ROLE_META[currentRole];
  const unreadCount = notifications.filter(n => n.unread).length;

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

      {/* Current role badge (read-only — derived from JWT) */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm select-none">
        <roleInfo.icon className={`w-4 h-4 ${roleInfo.color}`} />
        <span className="font-medium text-slate-700">{roleInfo.label}</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowRoleMenu(false); setShowProfile(false); }}
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700">Mark all read</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 ${n.unread ? 'bg-blue-50/50' : ''}`}>
                  <p className="text-sm text-slate-700 leading-snug">{n.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(!showProfile); setShowRoleMenu(false); setShowNotifications(false); }}
          className="flex items-center gap-2.5 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center" style={{ fontFamily: 'var(--font-display)' }}>
            {user.avatar}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
            <p className="text-xs text-slate-400 leading-tight">{user.email}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <button onClick={() => { onNavigate?.('profile'); setShowProfile(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <UserCircle className="w-4 h-4 text-slate-400" /> My Profile
            </button>
            <button onClick={() => { onNavigate?.('admin-config'); setShowProfile(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="w-4 h-4 text-slate-400" /> Settings
            </button>
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setShowProfile(false); onLogout?.(); }}
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
