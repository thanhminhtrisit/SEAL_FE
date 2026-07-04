import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Shield, Settings, FileText, BarChart3,
  Calendar, CheckSquare, BookOpen, Layers, Award, ClipboardList,
  Gavel, TrendingUp, Target, Send, Eye, GitBranch,
  Database, Lock, Bell, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Code2, Briefcase, FolderOpen, Activity, Globe, FileBarChart, Zap,
  UserPlus, ServerCog, AlertTriangle, Star, Trophy, FilePen, Inbox
} from 'lucide-react';
import type { Role, Screen } from '../types';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  screen: Screen;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navConfig: Record<Role, NavSection[]> = {
  PUBLIC: [],
  ADMIN: [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'admin-dashboard' },
        { label: 'Audit Log', icon: Activity, screen: 'admin-audit' },
      ],
    },
    {
      title: 'Account Management',
      items: [
        { label: 'Staff Accounts', icon: Users, screen: 'admin-staff' },
        { label: 'Role Assignment', icon: Shield, screen: 'admin-roles' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Configuration', icon: ServerCog, screen: 'admin-config' },
        { label: 'Security & Backup', icon: Lock, screen: 'admin-security' },
      ],
    },
  ],
  SUPER_COORDINATOR: [
    {
      title: 'Overview',
      items: [
        { label: 'Program Dashboard', icon: LayoutDashboard, screen: 'sc-dashboard' },
        { label: 'Cross-Event Analytics', icon: BarChart3, screen: 'sc-analytics' },
      ],
    },
    {
      title: 'Program Management',
      items: [
        { label: 'Disciplines', icon: BookOpen, screen: 'sc-disciplines' },
        { label: 'Term Quotas', icon: Target, screen: 'sc-quotas' },
      ],
    },
    {
      title: 'Approvals',
      items: [
        { label: 'Event Approvals', icon: CheckSquare, screen: 'sc-approvals', badge: 3 },
      ],
    },
  ],
  EVENT_COORDINATOR: [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'coord-dashboard' },
        { label: 'My Events', icon: Calendar, screen: 'coord-events' },
        { label: 'Create Event', icon: FilePen, screen: 'coord-create' },
      ],
    },
    {
      title: 'Event Operations',
      items: [
        { label: 'Account Approvals', icon: UserPlus, screen: 'coord-account-approvals' },
        { label: 'Teams', icon: Users, screen: 'coord-teams' },
        { label: 'Judge Assignment', icon: Gavel, screen: 'coord-judges' },
        { label: 'Submissions', icon: Send, screen: 'coord-submissions' },
      ],
    },
    {
      title: 'Scoring & Results',
      items: [
        { label: 'Scoring Control', icon: Lock, screen: 'coord-scoring' },
        { label: 'Rankings', icon: TrendingUp, screen: 'coord-ranking' },
        { label: 'Awards', icon: Award, screen: 'coord-awards' },
        { label: 'Publish Results', icon: Globe, screen: 'coord-results' },
        { label: 'RBL Dashboard', icon: FileBarChart, screen: 'coord-rbl' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Criteria Templates', icon: Layers, screen: 'templates-criteria' },
      ],
    },
  ],
  INTERNAL_JUDGE: [
    {
      title: 'Judging',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'judge-dashboard' },
        { label: 'Assigned Submissions', icon: ClipboardList, screen: 'judge-submissions' },
        { label: 'Score Entry', icon: Star, screen: 'judge-scoring' },
      ],
    },
  ],
  GUEST_JUDGE: [
    {
      title: 'Judging',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'judge-dashboard' },
        { label: 'Assigned Submissions', icon: ClipboardList, screen: 'judge-submissions' },
        { label: 'Score Entry', icon: Star, screen: 'judge-scoring' },
      ],
    },
  ],
  MENTOR: [
    {
      title: 'Mentoring',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'mentor-dashboard' },
        { label: 'My Teams', icon: Users, screen: 'mentor-teams' },
        { label: 'Category View', icon: FolderOpen, screen: 'mentor-category' },
      ],
    },
  ],
  TEAM_LEADER: [
    {
      title: 'Participation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'participant-dashboard' },
        { label: 'My Team', icon: Users, screen: 'participant-team' },
        { label: 'My Invitations', icon: Inbox, screen: 'participant-invitations' },
        { label: 'Submit Project', icon: Send, screen: 'participant-submit' },
        { label: 'Results', icon: Trophy, screen: 'participant-results' },
        { label: 'Notifications', icon: Bell, screen: 'participant-notifications' },
      ],
    },
  ],
  TEAM_MEMBER: [
    {
      title: 'Participation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, screen: 'participant-dashboard' },
        { label: 'My Team', icon: Users, screen: 'participant-team' },
        { label: 'My Invitations', icon: Inbox, screen: 'participant-invitations' },
        { label: 'Submissions', icon: Send, screen: 'participant-submit' },
        { label: 'Results', icon: Trophy, screen: 'participant-results' },
        { label: 'Notifications', icon: Bell, screen: 'participant-notifications' },
      ],
    },
  ],
};

interface SidebarProps {
  currentRole: Role;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentRole, currentScreen, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sections = navConfig[currentRole] || [];

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 flex flex-col h-full transition-all duration-200`}
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SEAL</span>
              <span className="block text-[10px] text-slate-400 leading-none -mt-0.5 tracking-wide uppercase">Hackathon Platform</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
            <Code2 className="w-5 h-5 text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-slate-400 hover:text-slate-200 transition-colors">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="p-3 flex justify-center text-slate-400 hover:text-slate-200 transition-colors border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {sections.map(section => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{section.title}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = currentScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => onNavigate(item.screen)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: FPT University branding */}
      {!collapsed && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">FPT University HCMC</p>
          <p className="text-[10px] text-slate-600">Software Engineering Dept.</p>
        </div>
      )}
    </aside>
  );
}
