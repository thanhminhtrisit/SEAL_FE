import React, { useState, useCallback, useEffect } from 'react';
import type { Role } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useAuth } from '../auth/AuthContext';

// Public screens
import { LandingPage, LoginPage, RegisterPage, PendingApprovalPage } from './screens/PublicScreens';

// Admin screens
import { AdminDashboard, StaffManagement, AuditLog, SystemConfig } from './screens/AdminScreens';

// Super Coordinator screens
import { SCDashboard, EventApprovals, SCAnalytics, Disciplines, TermQuotas } from './screens/SuperCoordScreens';

// Coordinator screens
import {
  CoordDashboard, EventList, CreateEventWizard, ParticipantApproval,
  SubmissionMonitor, JudgeAssignment, TeamManagement,
} from './screens/CoordinatorScreens';
import {
  ScoringControl, RankingPage, AwardsPage, ResultPublication, RBLDashboard,
} from './screens/CoordinatorEventScreens';

// Judge screens
import { JudgeDashboard, JudgeSubmissions, JudgeScoringPage } from './screens/JudgeScreens';

// Mentor screens
import { MentorDashboard, MentorTeams } from './screens/MentorScreens';

// Participant screens
import {
  ParticipantDashboard, TeamDetail, SubmitProject, ViewResults, NotificationsPage,
} from './screens/ParticipantScreens';

// Template screens
import { TemplateCenter } from './screens/TemplateScreens';

// Shared screens
import { ProfilePage, AccessDeniedPage } from './screens/SharedScreens';

// Ranking screen (can be accessed by Coordinator and Super Coordinator)
import { RankingScreen } from './screens/RankingScreen';

// ── Breadcrumb map ────────────────────────────────────────────────────────────
const breadcrumbs: Record<string, string[]> = {
  landing: ['SEAL', 'Home'],
  login: ['SEAL', 'Sign In'],
  register: ['SEAL', 'Register'],
  pending: ['SEAL', 'Pending Approval'],
  'admin-dashboard': ['SEAL', 'Admin', 'Dashboard'],
  'admin-staff': ['SEAL', 'Admin', 'Staff Accounts'],
  'admin-roles': ['SEAL', 'Admin', 'Role Assignment'],
  'admin-config': ['SEAL', 'Admin', 'Configuration'],
  'admin-security': ['SEAL', 'Admin', 'Security & Backup'],
  'admin-audit': ['SEAL', 'Admin', 'Audit Log'],
  'sc-dashboard': ['SEAL', 'Super Coordinator', 'Dashboard'],
  'sc-disciplines': ['SEAL', 'Super Coordinator', 'Disciplines'],
  'sc-quotas': ['SEAL', 'Super Coordinator', 'Term Quotas'],
  'sc-approvals': ['SEAL', 'Super Coordinator', 'Event Approvals'],
  'sc-analytics': ['SEAL', 'Super Coordinator', 'Analytics'],
  'coord-dashboard': ['SEAL', 'Coordinator', 'Dashboard'],
  'coord-events': ['SEAL', 'Coordinator', 'My Events'],
  'coord-create': ['SEAL', 'Coordinator', 'Create Event'],
  'coord-participants': ['SEAL', 'Coordinator', 'Participant Approval'],
  'coord-teams': ['SEAL', 'Coordinator', 'Teams'],
  'coord-judges': ['SEAL', 'Coordinator', 'Judge Assignment'],
  'coord-submissions': ['SEAL', 'Coordinator', 'Submissions'],
  'coord-scoring': ['SEAL', 'Coordinator', 'Scoring Control'],
  'coord-ranking': ['SEAL', 'Coordinator', 'Rankings'],
  'coord-awards': ['SEAL', 'Coordinator', 'Awards'],
  'coord-results': ['SEAL', 'Coordinator', 'Publish Results'],
  'coord-rbl': ['SEAL', 'Coordinator', 'RBL Dashboard'],
  'judge-dashboard': ['SEAL', 'Judge', 'Dashboard'],
  'judge-submissions': ['SEAL', 'Judge', 'Assigned Submissions'],
  'judge-scoring': ['SEAL', 'Judge', 'Score Entry'],
  'mentor-dashboard': ['SEAL', 'Mentor', 'Dashboard'],
  'mentor-teams': ['SEAL', 'Mentor', 'My Teams'],
  'mentor-category': ['SEAL', 'Mentor', 'Category View'],
  'participant-dashboard': ['SEAL', 'Participant', 'Dashboard'],
  'participant-team': ['SEAL', 'Participant', 'My Team'],
  'participant-submit': ['SEAL', 'Participant', 'Submit Project'],
  'participant-results': ['SEAL', 'Participant', 'Results'],
  'participant-notifications': ['SEAL', 'Participant', 'Notifications'],
  'templates-criteria': ['SEAL', 'Templates', 'Criteria & Presets'],
  profile: ['SEAL', 'My Profile'],
  'access-denied': ['SEAL', 'Access Denied'],
};

const defaultScreenByRole: Record<Role, string> = {
  PUBLIC: 'landing',
  ADMIN: 'admin-dashboard',
  SUPER_COORDINATOR: 'sc-dashboard',
  EVENT_COORDINATOR: 'coord-dashboard',
  INTERNAL_JUDGE: 'judge-dashboard',
  GUEST_JUDGE: 'judge-dashboard',
  MENTOR: 'mentor-dashboard',
  TEAM_LEADER: 'participant-dashboard',
  TEAM_MEMBER: 'participant-dashboard',
};

const publicScreens = new Set(['landing', 'login', 'register', 'pending']);

export default function App() {
  const auth = useAuth();
  const [currentRole, setCurrentRole] = useState<Role>('PUBLIC');
  const [currentScreen, setCurrentScreen] = useState<string>('landing');

  // Restore session from localStorage token on mount / auth state change
  useEffect(() => {
    if (auth.isAuthenticated && auth.role) {
      setCurrentRole(auth.role);
      setCurrentScreen(defaultScreenByRole[auth.role]);
    }
  }, [auth.isAuthenticated, auth.role]);

  // Listen for 401 unauthorised events to kick user back to login
  useEffect(() => {
    const handle = () => {
      setCurrentRole('PUBLIC');
      setCurrentScreen('login');
    };
    window.addEventListener('seal:unauthorized', handle);
    return () => window.removeEventListener('seal:unauthorized', handle);
  }, []);

  const navigate = useCallback((screen: string) => {
    setCurrentScreen(screen);
  }, []);

  const handleRoleChange = useCallback((role: Role) => {
    setCurrentRole(role);
    setCurrentScreen(defaultScreenByRole[role]);
  }, []);

  const handleRoleLogin = useCallback((role: string) => {
    const r = role as Role;
    setCurrentRole(r);
    setCurrentScreen(defaultScreenByRole[r]);
  }, []);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setCurrentRole('PUBLIC');
    setCurrentScreen('login');
  }, [auth]);

  // Public screens bypass the shell layout
  if (publicScreens.has(currentScreen)) {
    return (
      <div className="min-h-screen">
        {currentScreen === 'landing' && (
          <LandingPage onNavigate={navigate} />
        )}
        {currentScreen === 'login' && (
          <LoginPage onNavigate={navigate} onRoleLogin={handleRoleLogin} />
        )}
        {currentScreen === 'register' && (
          <RegisterPage onNavigate={navigate} />
        )}
        {currentScreen === 'pending' && (
          <PendingApprovalPage />
        )}
      </div>
    );
  }

  // Dashboard shell layout
  const roleAccent: Record<Role, string> = {
    PUBLIC: '#64748b',
    ADMIN: '#dc2626',
    SUPER_COORDINATOR: '#7c3aed',
    EVENT_COORDINATOR: '#1e3a8a',
    INTERNAL_JUDGE: '#d97706',
    GUEST_JUDGE: '#ea580c',
    MENTOR: '#0d9488',
    TEAM_LEADER: '#0891b2',
    TEAM_MEMBER: '#059669',
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Role accent strip */}
      <div className="h-0.5 flex-shrink-0 w-full" style={{ backgroundColor: roleAccent[currentRole] }} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar currentRole={currentRole} currentScreen={currentScreen} onNavigate={navigate} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            onLogout={handleLogout}
            breadcrumbs={breadcrumbs[currentScreen] || ['SEAL']}
            onNavigate={navigate}
          />
          <main className="flex-1 overflow-y-auto">
            <ScreenRenderer
              screen={currentScreen}
              role={currentRole}
              onNavigate={navigate}
              onRoleLogin={handleRoleLogin}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Screen Renderer ──────────────────────────────────────────────────────────
interface RendererProps {
  screen: string;
  role: Role;
  onNavigate: (s: string) => void;
  onRoleLogin: (role: string) => void;
}

function ScreenRenderer({ screen, role, onNavigate, onRoleLogin }: RendererProps) {
  switch (screen) {
    // Admin
    case 'admin-dashboard': return <AdminDashboard />;
    case 'admin-staff': return <StaffManagement />;
    case 'admin-audit': return <AuditLog />;
    case 'admin-config': return <SystemConfig />;
    case 'admin-security': return <SecurityPage />;
    case 'admin-roles': return <RoleAssignmentPage />;

    // Super Coordinator
    case 'sc-dashboard': return <SCDashboard />;
    case 'sc-disciplines': return <Disciplines />;
    case 'sc-quotas': return <TermQuotas />;
    case 'sc-approvals': return <EventApprovals onNavigate={onNavigate} />;
    case 'sc-analytics': return <SCAnalytics />;

    // Event Coordinator
    case 'coord-dashboard': return <CoordDashboard onNavigate={onNavigate} />;
    case 'coord-events': return <EventList onNavigate={onNavigate} />;
    case 'coord-create': return <CreateEventWizard onNavigate={onNavigate} />;
    case 'coord-participants': return <ParticipantApproval />;
    case 'coord-teams': return <TeamManagement />;
    case 'coord-judges': return <JudgeAssignment />;
    case 'coord-submissions': return <SubmissionMonitor />;
    case 'coord-scoring': return <ScoringControl />;
    case 'coord-ranking': 
      return (
        <RankingScreen 
          roundId={1} // Tạm fix cứng vòng 1 để test khớp với Database
          isCoordinator={role === 'EVENT_COORDINATOR' || role === 'SUPER_COORDINATOR' || role === 'ADMIN'} 
        />
      );
    case 'coord-awards': return <AwardsPage />;
    case 'coord-results': return <ResultPublication />;
    case 'coord-rbl': return <RBLDashboard />;

    // Judge
    case 'judge-dashboard': return <JudgeDashboard onNavigate={onNavigate} />;
    case 'judge-submissions': return <JudgeSubmissions onNavigate={onNavigate} />;
    case 'judge-scoring': return <JudgeScoringPage />;

    // Mentor
    case 'mentor-dashboard': return <MentorDashboard onNavigate={onNavigate} />;
    case 'mentor-teams': return <MentorTeams onNavigate={onNavigate} />;
    case 'mentor-category': return <MentorTeams onNavigate={onNavigate} />;

    // Participant
    case 'participant-dashboard': return <ParticipantDashboard onNavigate={onNavigate} />;
    case 'participant-team': return <TeamDetail onNavigate={onNavigate} />;
    case 'participant-submit': return <SubmitProject />;
    case 'participant-results': return <ViewResults />;
    case 'participant-notifications': return <NotificationsPage />;

    // Templates
    case 'templates-criteria': return <TemplateCenter />;

    // Shared
    case 'profile': return <ProfilePage currentRole={role} />;
    case 'access-denied': return <AccessDeniedPage onNavigate={onNavigate} />;

    default: return <NotFoundPage onNavigate={onNavigate} />;
  }
}

// ── Inline minor screens ──────────────────────────────────────────────────────
function SecurityPage() {
  const checks = [
    { label: 'SSL Certificate', status: 'valid', detail: 'Expires 2027-01-15', ok: true },
    { label: 'Last Full Backup', status: 'complete', detail: '2026-06-13 02:00 UTC', ok: true },
    { label: 'Failed Login Attempts (24h)', status: '3 attempts', detail: '2 from 192.168.1.99', ok: true },
    { label: 'Locked Accounts', status: '2 accounts', detail: 'Nguyen Van Hoa, Dr. James Park', ok: false },
    { label: 'JWT Secret Rotation', status: 'overdue', detail: 'Last rotated 95 days ago (recommended: 90 days)', ok: false },
    { label: 'Rate Limiting', status: 'active', detail: '100 req/min per IP', ok: true },
    { label: 'CORS Policy', status: 'configured', detail: 'Allow: *.fpt.edu.vn, localhost', ok: true },
  ];
  return (
    <div className="p-7 space-y-5">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Security & Backup Monitoring</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform security health at a glance</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center justify-between px-5 py-4 ${!c.ok ? 'bg-amber-50/30' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div>
                <p className="text-sm font-medium text-slate-900">{c.label}</p>
                <p className="text-xs text-slate-500">{c.detail}</p>
              </div>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${c.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Trigger Manual Backup</button>
        <button className="flex items-center gap-2 border border-amber-300 text-amber-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors">Rotate JWT Secret</button>
      </div>
    </div>
  );
}

function RoleAssignmentPage() {
  const assignments = [
    { user: 'Le Minh Cuong', role: 'EVENT_COORDINATOR', scope: 'Event', scopeTarget: 'SEAL Hackathon Summer 2026', assignedBy: 'Nguyen Van An', assignedAt: '2026-06-01' },
    { user: 'Pham Duc Dat', role: 'INTERNAL_JUDGE', scope: 'Round', scopeTarget: 'Preliminary Round', assignedBy: 'Le Minh Cuong', assignedAt: '2026-06-15' },
    { user: 'Vu Minh Phuong', role: 'INTERNAL_JUDGE', scope: 'Round', scopeTarget: 'Preliminary Round', assignedBy: 'Le Minh Cuong', assignedAt: '2026-06-15' },
    { user: 'Dr. Sarah Chen', role: 'GUEST_JUDGE', scope: 'Round', scopeTarget: 'Final Round', assignedBy: 'Le Minh Cuong', assignedAt: '2026-06-18' },
    { user: 'Hoang Thi Em', role: 'MENTOR', scope: 'Category', scopeTarget: 'Web Application', assignedBy: 'Le Minh Cuong', assignedAt: '2026-06-16' },
    { user: 'Tran Thi Bich', role: 'SUPER_COORDINATOR', scope: 'Platform', scopeTarget: 'SE Dept.', assignedBy: 'Nguyen Van An', assignedAt: '2026-01-10' },
  ];
  return (
    <div className="p-7 space-y-5">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Role Assignment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Scoped role assignments — event, round, category, or platform level</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['User', 'Assigned Role', 'Scope', 'Target', 'Assigned By', 'Date', 'Actions'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{a.user}</td>
                <td className="px-4 py-3"><span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{a.role.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.scope === 'Event' ? 'bg-purple-100 text-purple-700' : a.scope === 'Round' ? 'bg-cyan-100 text-cyan-700' : a.scope === 'Category' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{a.scope}</span></td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.scopeTarget}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{a.assignedBy}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{a.assignedAt}</td>
                <td className="px-4 py-3"><button className="text-xs text-red-600 hover:text-red-700 font-medium">Revoke</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotFoundPage({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="text-center">
        <p className="text-7xl font-black text-slate-200 mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</p>
        <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Page Not Found</h2>
        <p className="text-slate-500 mb-5">This screen doesn't exist or you don't have access.</p>
        <button onClick={() => onNavigate('landing')} className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">Go Home</button>
      </div>
    </div>
  );
}
