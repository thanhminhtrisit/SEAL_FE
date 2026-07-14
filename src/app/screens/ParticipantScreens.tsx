import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Users, Send, Trophy, Bell, Calendar, Clock, CheckCircle2,
  ExternalLink, AlertTriangle, Star, ChevronRight, UserPlus, Mail, Plus,
  XCircle, Link, Info, Award, RefreshCw, Check, Inbox,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  getMySubmissionOverview,
  getCurrentSubmission,
  getSubmissionDetail,
  getSubmissionHistory,
  submitSubmission,
  type CreateSubmissionRequest,
  type SubmissionMyOverview,
  type SubmissionMyOverviewRound,
  type SubmissionMyOverviewTeam,
  type SubmissionDetail,
  type SubmissionAttempt,
} from '../../api/submissions';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import { getEvents, getEventCategories, type EventSummary, type EventCategory } from '../../api/events';
import {
  createTeam, getTeam, sendInvitation, getMyInvitations, acceptInvitation, declineInvitation,
  type TeamDetail as TeamData, type Invitation,
} from '../../api/teams';
import { ranking, type ScoreBreakdownResponse } from '../../api/ranking';
import type { RankingResponse } from '../types';

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

const LS_TEAM_ID = 'seal_my_team_id';
function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const myTeam = {
  name: 'Code Seals',
  description: 'We build scalable, user-friendly web applications using React and TypeScript.',
  category: 'Web Application',
  event: 'SEAL SE Hackathon Summer 2026',
  status: 'APPROVED',
  leader: { name: 'Nguyen Thanh Phong', email: 'phong.nt@student.fpt.edu.vn', studentId: 'SE171234' },
  members: [
    { name: 'Do Thi Quynh', email: 'quynh.dt@student.fpt.edu.vn', studentId: 'SE171390', role: 'Member', status: 'ACTIVE' },
    { name: 'Tran Van Minh', email: 'minh.tv@student.fpt.edu.vn', studentId: 'SE171511', role: 'Member', status: 'ACTIVE' },
    { name: 'Bui Quang Huy', email: 'huy.bq@student.fpt.edu.vn', studentId: 'SE171622', role: 'Member', status: 'ACTIVE' },
  ],
  invitations: [
    { email: 'lan.nt@student.fpt.edu.vn', status: 'PENDING', sentAt: '2026-06-23' },
  ],
};

const mockSubmissionHistory = [
  { attemptNumber: 3, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: 'drive.google.com/file/seal-slides', submittedAt: '2026-07-22 14:30', note: 'Added authentication module and improved routing' },
  { attemptNumber: 2, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: null, submittedAt: '2026-07-20 09:15', note: 'Fixed CI/CD pipeline issues' },
  { attemptNumber: 1, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: null, slideUrl: null, submittedAt: '2026-07-18 16:42', note: 'Initial submission' },
];

const notifications = [
  { id: 1, type: 'success', title: 'Account Approved', message: 'Your participant account has been approved by the Event Coordinator. You can now join and create teams.', time: '2026-06-21 10:30', read: true },
  { id: 2, type: 'success', title: 'Team Registration Approved', message: 'Your team "Code Seals" has been approved for the Web Application category in SEAL Hackathon Summer 2026.', time: '2026-06-23 14:15', read: true },
  { id: 3, type: 'info', title: 'Scoring Has Begun', message: 'Preliminary Round scoring is now open. Results will be published after scoring is complete.', time: '2026-07-15 09:00', read: false },
  { id: 4, type: 'warning', title: 'Submission Deadline Reminder', message: 'Preliminary Round submission deadline is 2026-07-25. Your latest submission is Attempt #3. Resubmission is allowed until the deadline.', time: '2026-07-24 08:00', read: false },
];

const publishedResults = {
  rank: 1,
  totalScore: 87.5,
  promoted: true,
  award: '1st Place',
  criteriaBreakdown: [
    { name: 'Technical Quality', score: 9.2, weight: 40, weighted: 3.68 },
    { name: 'Innovation', score: 8.5, weight: 25, weighted: 2.13 },
    { name: 'UI/UX Design', score: 9.0, weight: 20, weighted: 1.80 },
    { name: 'Presentation', score: 8.8, weight: 15, weighted: 1.32 },
  ],
};

export function ParticipantDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [overview, setOverview] = useState<SubmissionMyOverview | null>(null);
  const [invitationCount, setInvitationCount] = useState<number | null>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [overviewData, invitations] = await Promise.all([
          getMySubmissionOverview(),
          getMyInvitations().catch(() => [] as Invitation[]),
        ]);
        if (cancelled) return;
        setOverview(overviewData);
        setInvitationCount(safeArray(invitations).length);
      } catch {
        if (!cancelled) {
          setOverview({ teams: [] });
          setInvitationCount(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const primaryTeam = useMemo(
    () => safeArray(overview?.teams).find(team => team.memberRole === 'LEADER')
      ?? safeArray(overview?.teams)[0]
      ?? null,
    [overview],
  );

  const latestSubmission = useMemo(() => {
    return safeArray(overview?.teams)
      .flatMap(team => safeArray(team.rounds)
        .filter(round => !!round.submission)
        .map(round => ({
          roundName: round.roundName,
          submission: round.submission!,
        })))
      .sort((left, right) => {
        const leftTime = left.submission.submittedAt ? new Date(left.submission.submittedAt).getTime() : 0;
        const rightTime = right.submission.submittedAt ? new Date(right.submission.submittedAt).getTime() : 0;
        return rightTime - leftTime || right.submission.attemptNumber - left.submission.attemptNumber;
      })[0] ?? null;
  }, [overview]);
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="My Dashboard" subtitle="Participant Dashboard" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Team" value={primaryTeam?.teamName ?? '-'} subtitle={primaryTeam?.categoryName ?? 'View My Team'} icon={Users} accent="blue" />
        <KPICard title="Invitations" value={invitationCount ?? '...'} subtitle="Check My Invitations" icon={Inbox} accent="cyan" />
        <KPICard title="Submission" value={latestSubmission ? `v${latestSubmission.submission.attemptNumber}` : '-'} subtitle={latestSubmission?.roundName ?? 'Submit Project'} icon={Send} accent="green" />
        <KPICard title="Notifications" value={unread} subtitle="Unread" icon={Bell} accent="amber" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'My Team', icon: Users, screen: 'participant-team', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'My Invitations', icon: Inbox, screen: 'participant-invitations', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
              { label: 'Submit Project', icon: Send, screen: 'participant-submit', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { label: 'View Results', icon: Trophy, screen: 'participant-results', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            ].map(a => (
              <button key={a.label} onClick={() => onNavigate(a.screen)} className={`${a.color} p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors text-left`}>
                <a.icon className="w-4 h-4 flex-shrink-0" /> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Recent Notifications</h3>
            <button onClick={() => onNavigate('participant-notifications')} className="text-xs text-blue-700 hover:text-blue-800">View all</button>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className={`p-2.5 rounded-lg border ${!n.read ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100'}`}>
                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ My Team (wired) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function TeamDetail({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { userId } = useAuth();

  // Persistent teamId from localStorage
  const [teamId, setTeamId] = useState<number | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Create-form meta
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [creating, setCreating] = useState(false);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // A user can belong to one team PER EVENT, so across events they may have several teams.
  const [myTeams, setMyTeams] = useState<SubmissionMyOverviewTeam[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load event list for create form
  useEffect(() => {
    getEvents()
      .then(eventList => setEvents(safeArray(eventList)))
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được danh sách event'))
      .finally(() => setLoadingMeta(false));
  }, []);

  // Load categories when event is selected
  useEffect(() => {
    if (selectedEventId === '') { setCategories([]); setSelectedCategoryId(''); return; }
    getEventCategories(selectedEventId as number)
      .then(categoryList => setCategories(safeArray(categoryList)))
      .catch(err => {
        setCategories([]);
        toast.error(err instanceof Error ? err.message : 'Không tải được category');
      });
  }, [selectedEventId]);

  const hydrateTeam = useCallback(async () => {
    // Load ALL of the user's teams (one per event) so they can switch between events.
    const overview = await getMySubmissionOverview();
    const teams = safeArray(overview.teams);
    setMyTeams(teams);

    if (teams.length === 0) {
      setTeamId(null);
      setTeam(null);
      localStorage.removeItem(LS_TEAM_ID);
      return false;
    }

    const stored = Number(localStorage.getItem(LS_TEAM_ID));
    const chosen =
      teams.find(t => t.teamId === stored)
      ?? teams.find(t => t.memberRole === 'LEADER')
      ?? teams[0];

    const teamData = await getTeam(chosen.teamId);
    setTeamId(chosen.teamId);
    setTeam({ ...teamData, members: safeArray(teamData.members) });
    localStorage.setItem(LS_TEAM_ID, String(chosen.teamId));
    return true;
  }, []);

  const switchTeam = async (id: number) => {
    if (id === teamId) return;
    setLoadingTeam(true);
    try {
      const teamData = await getTeam(id);
      setTeamId(id);
      setTeam({ ...teamData, members: safeArray(teamData.members) });
      localStorage.setItem(LS_TEAM_ID, String(id));
      setShowCreateForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được team');
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingTeam(true);
      try {
        await hydrateTeam();
      } catch (err) {
        if (!cancelled) {
          localStorage.removeItem(LS_TEAM_ID);
          setTeamId(null);
          setTeam(null);
          toast.error(err instanceof Error ? err.message : 'Không tải được thông tin team, vui lòng chọn hoặc tạo team lại');
        }
      } finally {
        if (!cancelled) setLoadingTeam(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateTeam]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { toast.error('Vui lòng nhập tên team'); return; }
    if (selectedEventId === '') { toast.error('Vui lòng chọn event'); return; }
    if (selectedCategoryId === '') { toast.error('Vui lòng chọn category'); return; }
    setCreating(true);
    try {
      const newTeam = await createTeam({
        eventId: selectedEventId as number,
        categoryId: selectedCategoryId as number,
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      localStorage.setItem(LS_TEAM_ID, String(newTeam.id));
      setTeamId(newTeam.id);
      setTeam({ ...newTeam, members: safeArray(newTeam.members) });
      setShowCreateForm(false);
      setSelectedEventId('');
      setSelectedCategoryId('');
      setTeamName('');
      setTeamDescription('');
      try { setMyTeams(safeArray((await getMySubmissionOverview()).teams)); } catch { /* ignore refresh error */ }
      toast.success(`Team "${newTeam.name}" đã được tạo!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo team thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !teamId) return;
    setInviting(true);
    try {
      await sendInvitation(teamId, inviteEmail.trim());
      toast.success(`Đã gửi lời mời đến ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi lời mời thất bại');
    } finally {
      setInviting(false);
    }
  };

  const teamMembers = safeArray(team?.members);
  const isLeader =
    teamMembers.some(m => String(m.userId) === String(userId) && m.role === 'LEADER')
    || (team?.leaderId != null && String(team.leaderId) === String(userId));
  const memberCount = teamMembers.length;
  const canInvite = isLeader && memberCount < 5;

  // Loading team
  if (loadingTeam) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Đang tải thông tin team...</span>
      </div>
    );
  }

  // Has team - show detail (unless the user explicitly opened the create form for another event)
  if (team && !showCreateForm) {
    const leader = teamMembers.find(m => m.role === 'LEADER');
    const members = teamMembers.filter(m => m.role === 'MEMBER');
    return (
      <div className="p-7 space-y-5">
        <PageHeader
          title="My Team"
          subtitle={`${team.name}${team.categoryName ? ` — ${team.categoryName}` : ''}`}
          actions={
            canInvite ? (
              <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            ) : memberCount >= 5 ? (
              <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg">Team Full (5/5)</span>
            ) : null
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          {myTeams.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Team / sự kiện:</label>
              <select
                value={teamId ?? ''}
                onChange={e => switchTeam(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {myTeams.map(t => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.eventName} — {t.teamName} ({t.memberRole === 'LEADER' ? 'Leader' : 'Member'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="text-sm text-blue-700 font-medium hover:text-blue-800 flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" /> Tạo team cho sự kiện khác
          </button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            {/* Team Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{team.name}</h2>
                  {team.description && <p className="text-sm text-slate-500 mt-0.5">{team.description}</p>}
                </div>
                <StatusBadge status={team.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {team.eventName && <div><span className="text-slate-500">Event:</span> <span className="font-medium text-slate-800">{team.eventName}</span></div>}
                {team.categoryName && <div><span className="text-slate-500">Category:</span> <span className="font-medium text-slate-800">{team.categoryName}</span></div>}
                <div><span className="text-slate-500">Members:</span> <span className="font-medium text-slate-800">{memberCount} / 5</span></div>
                <div><span className="text-slate-500">Team ID:</span> <span className="font-mono text-xs text-slate-600">#{team.id}</span></div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Team Members ({memberCount}/5)</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Name', 'Email', 'Role', 'Status'].map(c => (
                      <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leader && (
                    <tr className="bg-blue-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                            {(leader.fullName ?? 'Leader').split(' ').pop()?.[0] ?? '?'}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {leader.fullName ?? 'Leader'}
                            {String(leader.userId) === String(userId) && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{leader.email ?? '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Team Leader</span></td>
                      <td className="px-4 py-3"><StatusBadge status="ACTIVE" /></td>
                    </tr>
                  )}
                  {members.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                            {(m.fullName ?? 'Member').split(' ').pop()?.[0] ?? '?'}
                          </div>
                          <span className="text-sm text-slate-900">
                            {m.fullName ?? 'Member'}
                            {String(m.userId) === String(userId) && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{m.email ?? '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs text-slate-500">Member</span></td>
                      <td className="px-4 py-3"><StatusBadge status="ACTIVE" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {memberCount < 3 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-amber-50/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Team cần ít nhất 3 thành viên để được duyệt. Còn thiếu {3 - memberCount} người.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Team Rules</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> 3-5 members required</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> One category per event</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> Repository URL required for submission</li>
                <li className="flex items-start gap-2"><Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" /> Demo & slide links optional</li>
              </ul>
            </div>
            {isLeader && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-800 mb-1">Invite Members</p>
                <p className="text-xs text-blue-700">
                  {canInvite ? `${5 - memberCount} slot còn lại. Người được mời cần có tài khoản SEAL đã được duyệt.` : 'Team đã đủ 5 thành viên.'}
                </p>
                {canInvite && (
                  <button onClick={() => setShowInvite(true)} className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:text-blue-800">
                    <UserPlus className="w-3 h-3" /> Invite Member
                  </button>
                )}
              </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Leave / Change Team</p>
              <p className="text-xs text-slate-500">Để thay đổi team, liên hệ Event Coordinator.</p>
            </div>
          </div>
        </div>

        {showInvite && (
          <Modal
            title="Invite Member"
            subtitle="Nhập email người bạn muốn mời vào team."
            size="sm"
            onClose={() => setShowInvite(false)}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={inviting || !inviteEmail.trim()}
                  onClick={handleInvite}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-800 text-white font-semibold hover:bg-blue-900 disabled:opacity-50"
                >
                  {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
                </button>
              </>
            }
          >
            <div className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && inviteEmail.trim() && !inviting) handleInvite(); }}
                placeholder="email@example.com"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                {Math.max(0, 5 - memberCount)} slot còn lại. Người được mời cần có tài khoản SEAL; chỉ mời được khi team đang REGISTERED và sự kiện còn hạn đăng ký.
              </p>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // No team - show create form
  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="My Team"
        subtitle="Tạo team cho một sự kiện. Mỗi sự kiện chỉ được 1 team; bạn có thể tham gia nhiều sự kiện."
        actions={
          team ? (
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-slate-600 hover:text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg"
            >
              ← Về team của tôi
            </button>
          ) : null
        }
      />

      <div className="max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Tạo Team Mới</h2>
              <p className="text-xs text-slate-500">Bạn sẽ là Team Leader</p>
            </div>
          </div>

          {loadingMeta ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách event...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event <span className="text-red-500">*</span></label>
                <select
                  value={selectedEventId}
                  onChange={e => { setSelectedEventId(e.target.value === '' ? '' : Number(e.target.value)); setSelectedCategoryId(''); }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">— Chọn event —</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.eventType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={selectedEventId === '' || categories.length === 0}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
                >
                  <option value="">{selectedEventId === "" ? "— Chọn event trước —" : categories.length === 0 ? "Không có category" : "— Chọn category —"}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Team <span className="text-red-500">*</span></label>
                <input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="VD: Code Seals"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={teamDescription}
                  onChange={e => setTeamDescription(e.target.value)}
                  rows={2}
                  placeholder="Mô tả ngắn về team và dự án..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <button
                onClick={handleCreateTeam}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {creating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Tạo Team
              </button>
            </>
          )}
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Inbox className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Đã được mời vào team?</p>
            <p className="text-sm text-blue-700 mt-0.5">Kiểm tra lời mời và Accept để tham gia.</p>
            <button onClick={() => onNavigate('participant-invitations')} className="mt-1.5 text-xs text-blue-700 font-medium underline hover:text-blue-800">
              Xem My Invitations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// My Invitations
export function MyInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvitations(safeArray(await getMyInvitations()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được lời mời');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (inv: Invitation) => {
    setActionId(inv.invitationId);
    try {
      await acceptInvitation(inv.invitationId);
      localStorage.setItem(LS_TEAM_ID, String(inv.teamId));
      setInvitations(prev => prev.filter(i => i.invitationId !== inv.invitationId));
      toast.success(`Đã tham gia team "${inv.teamName}"! Vào My Team để xem.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Accept thất bại');
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (inv: Invitation) => {
    setActionId(inv.invitationId);
    try {
      await declineInvitation(inv.invitationId);
      setInvitations(prev => prev.filter(i => i.invitationId !== inv.invitationId));
      toast.success(`Đã từ chối lời mời từ team "${inv.teamName}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Decline thất bại');
    } finally {
      setActionId(null);
    }
  };

  const fmtDate = (s?: string | null) => s ? s.replace('T', ' ').slice(0, 16) : '—';

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="My Invitations"
        subtitle={'L\u1eddi m\u1eddi tham gia team \u0111ang ch\u1edd ph\u1ea3n h\u1ed3i'}
        actions={
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">{'\u0110ang t\u1ea3i l\u1eddi m\u1eddi...'}</span>
        </div>
      )}

      {!loading && invitations.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
          <Inbox className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">{'Kh\u00f4ng c\u00f3 l\u1eddi m\u1eddi n\u00e0o'}</p>
          <p className="text-xs">{'Khi \u0111\u01b0\u1ee3c m\u1eddi v\u00e0o team, l\u1eddi m\u1eddi s\u1ebd hi\u1ec3n th\u1ecb \u1edf \u0111\u00e2y.'}</p>
        </div>
      )}

      {!loading && invitations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {invitations.map(inv => (
            <div key={inv.invitationId} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-900">{inv.teamName}</p>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono"># team</span>
                </div>
                <p className="text-xs text-slate-600">{inv.eventName}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span>{'\u0110\u01b0\u1ee3c m\u1eddi b\u1edfi '}<span className="font-medium text-slate-600">{inv.invitedByName}</span></span>
                  <span>{'·'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {'H\u1ebft h\u1ea1n '}{fmtDate(inv.expiresAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAccept(inv)}
                  disabled={actionId !== null}
                  className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  {actionId === inv.invitationId ? <span className="w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-600 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(inv)}
                  disabled={actionId !== null}
                  className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SubmitProject() {
  const auth = useAuth();

  const [overview, setOverview] = useState<SubmissionMyOverview | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionAttempt[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [slideUrl, setSlideUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [changeNote, setChangeNote] = useState('Initial submission from FE demo');
  const [manualTeamId, setManualTeamId] = useState('1');
  const [manualRoundId, setManualRoundId] = useState('2');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const selectedTeam = useMemo(
    () => overview?.teams.find(team => team.teamId === selectedTeamId) ?? overview?.teams[0] ?? null,
    [overview, selectedTeamId],
  );

  // Leadership is per-team (team_members.member_role via overview.memberRole), NOT the global role —
  // every participant's global role is TEAM_MEMBER, so gating on the global role blocked everyone.
  const canEdit = selectedTeam?.memberRole === 'LEADER';

  const selectedRound = useMemo(
    () => selectedTeam?.rounds.find(round => round.roundId === selectedRoundId) ?? selectedTeam?.rounds[0] ?? null,
    [selectedTeam, selectedRoundId],
  );

  const submissionRequirements = selectedRound?.submissionRequirements ?? null;
  const artifactFields = [
    submissionRequirements?.requiresRepo ? { key: 'repoUrl' as const, label: 'Repository URL', value: repoUrl } : null,
    submissionRequirements?.requiresDemo ? { key: 'demoUrl' as const, label: 'Demo URL', value: demoUrl } : null,
    submissionRequirements?.requiresSlide ? { key: 'slideUrl' as const, label: 'Slide URL', value: slideUrl } : null,
    submissionRequirements?.requiresReport ? { key: 'reportUrl' as const, label: 'Report URL', value: reportUrl } : null,
].filter((field): field is { key: 'repoUrl' | 'demoUrl' | 'slideUrl' | 'reportUrl'; label: string; value: string } => field !== null);  const submissionPayload = useMemo<CreateSubmissionRequest>(() => {
    const payload: CreateSubmissionRequest = {
      teamId: selectedTeam?.teamId ?? 0,
      roundId: selectedRound?.roundId ?? 0,
      changeNote: changeNote.trim(),
    };

    if (submissionRequirements?.requiresRepo) payload.repoUrl = repoUrl.trim();
    if (submissionRequirements?.requiresDemo) payload.demoUrl = demoUrl.trim();
    if (submissionRequirements?.requiresSlide) payload.slideUrl = slideUrl.trim();
    if (submissionRequirements?.requiresReport) payload.reportUrl = reportUrl.trim();

    return payload;
  }, [
    changeNote,
    demoUrl,
    reportUrl,
    repoUrl,
    selectedRound?.roundId,
    selectedTeam?.teamId,
    slideUrl,
    submissionRequirements,
  ]);

  const selectedSubmissionId = selectedRound?.submission?.submissionId ?? null;
  const selectedRoundSubmission = selectedRound?.submission ?? null;
  const latestSubmission = submissionHistory.find(item => item.status === 'SUBMITTED')
    ?? (submission?.status === 'SUBMITTED' ? submission : null)
    ?? (selectedRoundSubmission?.status === 'SUBMITTED' ? selectedRoundSubmission : null);
  const displayedSubmission = latestSubmission ?? submission ?? selectedRoundSubmission;
  const nextAttemptNumber = submissionHistory.reduce(
    (maximum, attempt) => Math.max(maximum, attempt.attemptNumber),
    0,
  ) + 1;
  const isDeadlinePassed = (deadline?: string | null) => {
    if (!deadline) return false;
    const parsed = new Date(deadline);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
  };
  const selectedDeadlinePassed = isDeadlinePassed(selectedRound?.submissionDeadline);
  const roundClosedByTime = selectedRound?.status !== 'OPEN_FOR_SUBMISSION' || selectedDeadlinePassed;
  const requiredArtifactsPresent = !!submissionRequirements
    && artifactFields.every(field => !!field.value.trim());
  const artifactUrlsValid = !!submissionRequirements && [
    { required: submissionRequirements.requiresRepo, value: repoUrl },
    { required: submissionRequirements.requiresDemo, value: demoUrl },
    { required: submissionRequirements.requiresSlide, value: slideUrl },
    { required: submissionRequirements.requiresReport, value: reportUrl },
  ].every(field => !field.required || isValidHttpUrl(field.value));
  const canSubmitNow = !!canEdit
    && !!selectedTeam
    && !!selectedRound
    && requiredArtifactsPresent
    && artifactUrlsValid
    && !roundClosedByTime
    && actionLoading === null;

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await getMySubmissionOverview();
      setOverview(data);
      setError(null);
      if (data.teams.length === 0) {
        setSelectedTeamId(null);
        setSelectedRoundId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load submission overview';
      setError(message);
      setOverview(null);
      setSelectedTeamId(null);
      setSelectedRoundId(null);
      toast.error(message);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadSubmissionData = useCallback(async (
    teamId: number,
    roundId: number,
    submissionId?: number | null,
  ) => {
    setLoadingDetail(true);
    try {
      const [detail, history] = await Promise.all([
        submissionId ? getSubmissionDetail(submissionId) : Promise.resolve(null),
        getSubmissionHistory(teamId, roundId),
      ]);
      setSubmission(detail);
      setSubmissionHistory(history);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load submission detail';
      setSubmission(null);
      setSubmissionHistory([]);
      setError(message);
      if (!message.toLowerCase().includes('not found')) {
        toast.error(message);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!overview?.teams.length) return;
    if (!selectedTeamId || !overview.teams.some(team => team.teamId === selectedTeamId)) {
      setSelectedTeamId(overview.teams[0].teamId);
    }
  }, [overview, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeam) {
      setSelectedRoundId(null);
      return;
    }
    if (!selectedRoundId || !selectedTeam.rounds.some(round => round.roundId === selectedRoundId)) {
      setSelectedRoundId(selectedTeam.rounds[0]?.roundId ?? null);
    }
  }, [selectedTeam, selectedRoundId]);

  useEffect(() => {
    if (!selectedTeam || !selectedRound) {
      setSubmission(null);
      setSubmissionHistory([]);
      return;
    }
    setSubmission(null);
    setSubmissionHistory([]);
    void loadSubmissionData(selectedTeam.teamId, selectedRound.roundId, selectedSubmissionId);
  }, [loadSubmissionData, selectedRound, selectedSubmissionId, selectedTeam]);

  const handleSubmit = useCallback(async () => {
    const teamId = selectedTeam?.teamId;
    const roundId = selectedRound?.roundId;
    if (!teamId || !roundId) {
      setError('Select a team and round first');
      return;
    }
    if (!canEdit) {
      setError('Only active team leaders can submit projects');
      return;
    }
    if (!submissionRequirements) {
      setError('Submission requirements are unavailable. Reload the page or contact the coordinator.');
      return;
    }
    const missingRequired = [
      { required: submissionRequirements.requiresRepo, value: repoUrl, label: 'Repository URL' },
      { required: submissionRequirements.requiresDemo, value: demoUrl, label: 'Demo URL' },
      { required: submissionRequirements.requiresSlide, value: slideUrl, label: 'Slide URL' },
      { required: submissionRequirements.requiresReport, value: reportUrl, label: 'Report URL' },
    ].find(field => field.required && !field.value.trim());
    if (missingRequired) {
      setError(`${missingRequired.label} is required for this round`);
      return;
    }
    const invalidUrl = [
      { required: submissionRequirements.requiresRepo, value: repoUrl, label: 'Repository URL' },
      { required: submissionRequirements.requiresDemo, value: demoUrl, label: 'Demo URL' },
      { required: submissionRequirements.requiresSlide, value: slideUrl, label: 'Slide URL' },
      { required: submissionRequirements.requiresReport, value: reportUrl, label: 'Report URL' },
    ].find(field => field.required && !isValidHttpUrl(field.value));
    if (invalidUrl) {
      setError(`${invalidUrl.label} must be a valid HTTP or HTTPS URL`);
      return;
    }

    setActionLoading('submit');
    setError(null);
    try {
      const submitted = await submitSubmission(submissionPayload);
      setSubmission(submitted);
      toast.success(`Submission Attempt #${submitted.attemptNumber} created`);
      await loadOverview();
      await loadSubmissionData(submitted.teamId, submitted.roundId, submitted.submissionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submit failed';
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }, [canEdit, loadOverview, loadSubmissionData, submissionPayload, submissionRequirements]);

  const loadManualSubmission = useCallback(async () => {
    const teamId = Number(manualTeamId);
    const roundId = Number(manualRoundId);
    if (!Number.isInteger(teamId) || teamId <= 0 || !Number.isInteger(roundId) || roundId <= 0) {
      setError('Manual teamId and roundId must be positive numbers');
      return;
    }

    setLoadingDetail(true);
    setError(null);
    try {
      const current = await getCurrentSubmission(teamId, roundId);
      setSubmission(current);
      await loadSubmissionData(teamId, roundId, current.submissionId);
      toast.success('Loaded submission by teamId and roundId');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load submission';
      setSubmission(null);
      setSubmissionHistory([]);
      setError(message);
      if (message.toLowerCase().includes('not found')) {
        toast.message('No submission yet for that team/round');
      } else {
        toast.error(message);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [loadSubmissionData, manualRoundId, manualTeamId]);

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Project Submission Tracking"
        subtitle="Choose your team and round, then submit a new official attempt"
        actions={
          <button
            onClick={loadOverview}
            disabled={loadingOverview}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            {loadingOverview ? 'Loading...' : 'Refresh'}
          </button>
        }
      />

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Backend response</p>
            <p className="text-sm text-amber-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>My Teams</h3>
                <p className="text-sm text-slate-500">Pick a team to see all rounds and submission states</p>
              </div>
              <span className="text-xs text-slate-500">{auth.role ?? "PUBLIC"}</span>
            </div>
            {loadingOverview ? (
              <p className="text-sm text-slate-500">Loading team overview...</p>
            ) : !overview?.teams.length ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No active team membership found for this account.
              </div>
            ) : (
              <div className="space-y-3">
                {overview.teams.map(team => {
                  const isSelected = team.teamId === selectedTeam?.teamId;
                  return (
                    <button
                      key={team.teamId}
                      onClick={() => {
                        setSelectedTeamId(team.teamId);
                        setSelectedRoundId(team.rounds[0]?.roundId ?? null);
                      }}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{team.teamName}</h4>
                            <span className="text-[11px] text-slate-500">#{team.teamId}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{team.eventName} • {team.categoryName}</p>
                        </div>
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full">{team.memberRole}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Rounds</h3>
                  <p className="text-sm text-slate-500">{selectedTeam ? selectedTeam.eventName : 'Select a team to view rounds'}</p>
                </div>
              {selectedTeam && <span className="text-xs text-slate-500">{selectedTeam.rounds.length} rounds</span>}
              </div>

            {!selectedTeam ? (
              <p className="text-sm text-slate-500">No team selected.</p>
            ) : selectedTeam.rounds.length === 0 ? (
              <p className="text-sm text-slate-500">No rounds available for this event.</p>
            ) : (
              <div className="space-y-3">
                {selectedTeam.rounds.map(round => {
                  const isSelected = round.roundId === selectedRound?.roundId;
                  const roundDeadlinePassed = isDeadlinePassed(round.submissionDeadline);
                  const roundClosedByTimeForRound = round.status !== 'OPEN_FOR_SUBMISSION' || roundDeadlinePassed;
                  return (
                    <div
                      key={round.roundId}
                      onClick={() => setSelectedRoundId(round.roundId)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-slate-900">{round.roundName}</h4>
                            <span className="text-[11px] text-slate-500">#{round.roundId}</span>
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Order {round.orderNumber}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            Status: {round.status} • Deadline: {round.submissionDeadline ?? "-"}
                          </p>
                          <p className="text-sm mt-2">
                            {roundDeadlinePassed && round.submissionDeadline ? (
                              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                                <AlertTriangle className="w-3.5 h-3.5" /> Deadline passed
                              </span>
                            ) : null}
                            {round.submission ? (
                              <>
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {round.submission.status}
                                </span>
                                <span className="ml-2 text-xs text-slate-500">
                                  Latest Submission: Attempt #{round.submission.attemptNumber}
                                  {round.submission.submittedAt ? ` • submitted ${round.submission.submittedAt}` : ""}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                <Info className="w-3.5 h-3.5" /> No submission yet
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {round.submission ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedRoundId(round.roundId); }}
                              className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium"
                            >
                              View Details
                            </button>
                          ) : !roundClosedByTimeForRound ? (
                            <span className="text-xs text-slate-500">Select to submit</span>
                          ) : (
                            <span className="text-xs text-slate-400">Closed</span>
                          )}
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Selected Submission</h3>
                <p className="text-sm text-slate-500">
                  {selectedTeam && selectedRound
                    ? `${selectedTeam.teamName} / ${selectedRound.roundName}`
                    : 'Select a round to inspect submission detail'}
                </p>
              </div>
              {loadingDetail && <span className="text-xs text-slate-500">Loading detail...</span>}
            </div>

            {selectedTeam && selectedRound ? (
              <>
                <div className={`border rounded-xl p-4 flex items-start gap-3 ${displayedSubmission ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  {displayedSubmission ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-semibold ${displayedSubmission ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {displayedSubmission
                        ? `Latest Submission: Attempt #${displayedSubmission.attemptNumber}`
                        : 'No submission yet'}
                    </p>
                    <p className={`text-sm mt-0.5 ${displayedSubmission ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {latestSubmission
                        ? `Submission #${latestSubmission.submissionId} is an official immutable attempt.`
                        : selectedDeadlinePassed
                          ? 'The submission deadline has passed. You can only view detail and history.'
                          : `Complete the form below to create Submission Attempt #${nextAttemptNumber}.`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                  {[
                    ['Status', displayedSubmission?.status ?? 'No submission yet'],
                    ['Team', `${selectedTeam.teamName} (#${selectedTeam.teamId})`],
                    ['Round', `${selectedRound.roundName} (#${selectedRound.roundId})`],
                    ['Event', `${selectedTeam.eventName} (#${selectedTeam.eventId})`],
                    ['Category', `${selectedTeam.categoryName} (#${selectedTeam.categoryId})`],
                    ['Submitted At', displayedSubmission?.submittedAt ?? 'Not submitted'],
                    ['Last Updated', displayedSubmission?.lastUpdatedAt ?? 'Not updated'],
                    ['Attempt', displayedSubmission ? `Attempt #${displayedSubmission.attemptNumber}` : 'None'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="font-medium text-slate-900 mt-0.5 break-words">{value}</p>
                    </div>
                  ))}
                </div>

                {displayedSubmission && (
                  <div id="submission-detail" className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Latest Submission</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        ['Repository', displayedSubmission.repoUrl],
                        ['Demo', displayedSubmission.demoUrl],
                        ['Slides', displayedSubmission.slideUrl],
                        ['Report', displayedSubmission.reportUrl],
                        ['Change Note', displayedSubmission.changeNote],
                      ].map(([label, value]) => (
                        <div key={label} className="flex gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                          <span className="w-28 text-slate-500 flex-shrink-0">{label}</span>
                          <span className="text-slate-900 break-all">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    {roundClosedByTime ? 'Read-only Actions' : `Submit New Attempt #${nextAttemptNumber}`}
                  </h4>
                  {roundClosedByTime ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                        The submission deadline has passed. New attempts are no longer accepted.
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => document.getElementById('submission-detail')?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => document.getElementById('submission-history')?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          View Submission History
                        </button>
                      </div>
                    </div>
                  ) : !submissionRequirements ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Submission requirements could not be loaded. Submission is disabled; reload the page or contact the coordinator.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {artifactFields.map(({ key, label, value }) => {
                          const setter = {
                            repoUrl: setRepoUrl,
                            demoUrl: setDemoUrl,
                            slideUrl: setSlideUrl,
                            reportUrl: setReportUrl,
                          }[key];
                          const placeholder = {
                            repoUrl: 'https://github.com/team/project',
                            demoUrl: 'https://your-demo.vercel.app',
                            slideUrl: 'https://drive.google.com/...',
                            reportUrl: 'https://docs.google.com/...',
                          }[key];
                          const hasValue = !!value.trim();
                          const validUrl = isValidHttpUrl(value);
                          const fieldError = !hasValue
                            ? `${label} is required for this round`
                            : !validUrl
                              ? `${label} must be a valid HTTP or HTTPS URL`
                              : '';
                          return (
                          <div key={label}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              {label} *
                            </label>
                            <div className="relative">
                              <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input
                                type="url"
                                required
                                value={value}
                                onChange={e => setter(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                                placeholder={placeholder}
                              />
                            </div>
                            <p className={`mt-1 text-xs ${fieldError ? 'text-rose-600' : 'text-slate-500'}`}>
                              {fieldError || 'Required for this round'}
                            </p>
                          </div>
                          );
                        })}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Change Note</label>
                        <textarea
                          value={changeNote}
                          onChange={e => setChangeNote(e.target.value)}
                          className="w-full min-h-20 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                          placeholder="Describe what changed in this submission"
                        />
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        Form changes are local and not official until submitted. Each submission creates a new immutable attempt.
                      </div>
                      {!canSubmitNow && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          Fix the highlighted requirements before submitting.
                        </div>
                      )}
                      <button
                        onClick={() => void handleSubmit()}
                        disabled={!canSubmitNow}
                        className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> {actionLoading === 'submit' ? 'Submitting...' : `Submit New Attempt #${nextAttemptNumber}`}
                      </button>
                    </div>
                  )}
                </div>

                <div id="submission-history" className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900">Submission History</h4>
                    <span className="text-xs text-slate-500">{submissionHistory.length} attempts</span>
                  </div>
                  {submissionHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">No submission history yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissionHistory.map(attempt => (
                        <div key={attempt.submissionId} className={`p-3.5 rounded-lg border ${attempt.submissionId === latestSubmission?.submissionId ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${attempt.submissionId === latestSubmission?.submissionId ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Attempt #{attempt.attemptNumber}</span>
                              <span className="text-xs text-slate-600 font-medium">{attempt.status}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{attempt.submittedAt ?? attempt.lastUpdatedAt ?? "-"}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{attempt.changeNote || 'No change note'}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-slate-500 break-all">Repo: <span className="text-slate-800">{attempt.repoUrl || '-'}</span></span>
                            <span className="text-slate-500 break-all">Demo: <span className="text-slate-800">{attempt.demoUrl || '-'}</span></span>
                            <span className="text-slate-500 break-all">Slides: <span className="text-slate-800">{attempt.slideUrl || '-'}</span></span>
                            <span className="text-slate-500 break-all">Report: <span className="text-slate-800">{attempt.reportUrl || '-'}</span></span>
                            <span className="text-slate-500">Submitted by: <span className="text-slate-800">{attempt.submittedBy || '-'}</span></span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              {attempt.submissionId === latestSubmission?.submissionId
                                ? 'Latest official submission'
                                : 'Official submission attempt'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a team and round from the overview to see submission detail.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Demo fallback</h4>
              <button onClick={() => setShowFallback(v => !v)} className="text-xs text-blue-700 hover:text-blue-800">{showFallback ? 'Hide' : 'Show'}</button>
            </div>
            {showFallback ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">teamId</label>
                    <input value={manualTeamId} onChange={e => setManualTeamId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">roundId</label>
                    <input value={manualRoundId} onChange={e => setManualRoundId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                  </div>
                </div>
                <button onClick={loadManualSubmission} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  <Clock className="w-4 h-4" /> Load by IDs
                </button>
                <p className="text-xs text-slate-500">Use this only as a fallback when testing direct submission lookup.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Primary flow uses your active teams and rounds from backend overview.</p>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {canEdit ? 'You can create, update, and submit for your active leader team.' : 'You can inspect submission data, but only active team leaders can mutate it.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitProjectMock() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Project Submission" subtitle="Preliminary Round — Deadline: 2026-07-25 23:59" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-sm text-slate-600">
        This mock submission screen is not used in the active flow.
      </div>
    </div>
  );
}


function ordinalLabel(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) return `${rank}th Place`;
  switch (rank % 10) {
    case 1: return `${rank}st Place`;
    case 2: return `${rank}nd Place`;
    case 3: return `${rank}rd Place`;
    default: return `${rank}th Place`;
  }
}


export function NotificationsPage() {
  const [readIds, setReadIds] = useState<number[]>([1, 2]);
  const iconMap = { success: CheckCircle2, warning: AlertTriangle, info: Info };
  const colorMap = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-blue-500' };

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Notifications" subtitle="Event updates, approvals, and system messages"
        actions={<button onClick={() => setReadIds(notifications.map(n => n.id))} className="text-sm text-blue-700 font-medium hover:text-blue-800">Mark all as read</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {notifications.map(n => {
          const Icon = iconMap[n.type as keyof typeof iconMap];
          const isRead = readIds.includes(n.id);
          return (
            <div key={n.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${!isRead ? 'bg-blue-50/40' : ''}`}
              onClick={() => setReadIds([...readIds, n.id])}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!isRead ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <Icon className={`w-4 h-4 ${colorMap[n.type as keyof typeof colorMap]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
