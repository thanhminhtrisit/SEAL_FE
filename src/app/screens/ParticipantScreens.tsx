import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Send, Trophy, Bell, Plus, Calendar, Clock, CheckCircle2,
  ExternalLink, AlertTriangle, Star, ChevronRight, UserPlus, Mail,
  XCircle, Link, Info, Award, RefreshCw, Check, Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import { getEvents, getEventCategories, type EventSummary, type EventCategory } from '../../api/events';
import {
  createTeam, getTeam, sendInvitation, getMyInvitations, acceptInvitation, declineInvitation,
  type TeamDetail as TeamData, type Invitation,
} from '../../api/teams';
import { useAuth } from '../../auth/AuthContext';

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

const submissionHistory = [
  { version: 3, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: 'drive.google.com/file/seal-slides', submittedAt: '2026-07-22 14:30', note: 'Added authentication module and improved routing' },
  { version: 2, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: null, submittedAt: '2026-07-20 09:15', note: 'Fixed CI/CD pipeline issues' },
  { version: 1, repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: null, slideUrl: null, submittedAt: '2026-07-18 16:42', note: 'Initial submission' },
];

const notifications = [
  { id: 1, type: 'success', title: 'Account Approved', message: 'Your participant account has been approved by the Event Coordinator. You can now join and create teams.', time: '2026-06-21 10:30', read: true },
  { id: 2, type: 'success', title: 'Team Registration Approved', message: 'Your team "Code Seals" has been approved for the Web Application category in SEAL Hackathon Summer 2026.', time: '2026-06-23 14:15', read: true },
  { id: 3, type: 'info', title: 'Scoring Has Begun', message: 'Preliminary Round scoring is now open. Results will be published after scoring is complete.', time: '2026-07-15 09:00', read: false },
  { id: 4, type: 'warning', title: 'Submission Deadline Reminder', message: 'Preliminary Round submission deadline is 2026-07-25. You have submitted version 3. Resubmission is allowed until the deadline.', time: '2026-07-24 08:00', read: false },
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
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="My Dashboard" subtitle="Participant Dashboard" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Team" value="—" subtitle="View My Team" icon={Users} accent="blue" />
        <KPICard title="Invitations" value="?" subtitle="Check My Invitations" icon={Inbox} accent="cyan" />
        <KPICard title="Submission" value="—" subtitle="Submit Project" icon={Send} accent="green" />
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

// ── My Team (wired) ──────────────────────────────────────────────────────────
export function TeamDetail({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { userId } = useAuth();

  // Persistent teamId from localStorage
  const [teamId, setTeamId] = useState<number | null>(() => {
    const v = localStorage.getItem(LS_TEAM_ID);
    return v ? Number(v) : null;
  });
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(!!localStorage.getItem(LS_TEAM_ID));

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

  // Load team detail when teamId is known
  useEffect(() => {
    if (!teamId) return;
    setLoadingTeam(true);
    getTeam(teamId)
      .then(teamData => setTeam({ ...teamData, members: safeArray(teamData.members) }))
      .catch(() => {
        localStorage.removeItem(LS_TEAM_ID);
        setTeamId(null);
        setTeam(null);
        toast.error('Không tải được thông tin team, vui lòng chọn hoặc tạo team lại');
      })
      .finally(() => setLoadingTeam(false));
  }, [teamId]);

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
  const isLeader = teamMembers.some(m => m.userId === Number(userId) && m.role === 'LEADER');
  const memberCount = teamMembers.length;
  const canInvite = isLeader && memberCount < 5;

  // Loading team
  if (loadingTeam) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Đang tải thông tin team…</span>
      </div>
    );
  }

  // Has team — show detail
  if (team) {
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
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> 3–5 members required</li>
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
            title="Invite Team Member"
            onClose={() => { setShowInvite(false); setInviteEmail(''); }}
            size="sm"
            footer={
              <>
                <button onClick={() => { setShowInvite(false); setInviteEmail(''); }} disabled={inviting} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                  {inviting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Send Invitation
                </button>
              </>
            }
          >
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">Slots remaining: <strong>{5 - memberCount}</strong>. Người được mời phải có tài khoản SEAL đã được duyệt.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="member@student.fpt.edu.vn"
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // No team — show create form
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="My Team" subtitle="Bạn chưa có team. Tạo team mới hoặc chờ lời mời." />

      <div className="max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Tạo Team Mới</h2>
              <p className="text-xs text-slate-500">Bạn sẽ là Team Leader</p>
            </div>
          </div>

          {loadingMeta ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải danh sách event…
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
                  <option value="">{selectedEventId === '' ? '— Chọn event trước —' : categories.length === 0 ? 'Không có category' : '— Chọn category —'}</option>
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
                  placeholder="Mô tả ngắn về team và dự án…"
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

// ── My Invitations ───────────────────────────────────────────────────────────
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
        subtitle="Lời mời tham gia team đang chờ phản hồi"
        actions={
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Đang tải lời mời…</span>
        </div>
      )}

      {!loading && invitations.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
          <Inbox className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Không có lời mời nào</p>
          <p className="text-xs">Khi được mời vào team, lời mời sẽ hiển thị ở đây.</p>
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
                  <span>Được mời bởi <span className="font-medium text-slate-600">{inv.invitedByName}</span></span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hết hạn {fmtDate(inv.expiresAt)}</span>
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
  const [repoUrl, setRepoUrl] = useState('https://github.com/codeseals/seal-webapp');
  const [demoUrl, setDemoUrl] = useState('https://seal-demo.vercel.app');
  const [slideUrl, setSlideUrl] = useState('https://drive.google.com/file/seal-slides');
  const [reportUrl, setReportUrl] = useState('');

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Project Submission" subtitle="Preliminary Round — Deadline: 2026-07-25 23:59" />

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Submission Received — Version 3</p>
              <p className="text-sm text-emerald-700 mt-0.5">Last submitted: 2026-07-22 14:30. You may resubmit until the deadline.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Submission URLs</h3>
            <div className="space-y-4">
              {[
                { label: 'Repository URL', required: true, value: repoUrl, setter: setRepoUrl, placeholder: 'https://github.com/team/project' },
                { label: 'Demo URL', required: false, value: demoUrl, setter: setDemoUrl, placeholder: 'https://your-demo.vercel.app' },
                { label: 'Slide / Presentation URL', required: false, value: slideUrl, setter: setSlideUrl, placeholder: 'https://drive.google.com/...' },
                { label: 'Report URL', required: false, value: reportUrl, setter: setReportUrl, placeholder: 'https://docs.google.com/...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {f.label} {f.required ? <span className="text-red-500">*</span> : <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span>}
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input value={f.value} onChange={e => f.setter(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder={f.placeholder} />
                  </div>
                </div>
              ))}
              <button disabled={!repoUrl.trim()} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" /> Resubmit (v4)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Version History</h3>
            <div className="space-y-3">
              {submissionHistory.map((s, i) => (
                <div key={i} className={`p-3.5 rounded-lg border ${i === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${i === 0 ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>v{s.version}</span>
                      {i === 0 && <span className="text-xs text-blue-600 font-medium">Current</span>}
                    </div>
                    <span className="text-xs font-mono text-slate-400">{s.submittedAt}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{s.note}</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="#" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" />Repo</a>
                    {s.demoUrl && <a href="#" className="flex items-center gap-1 text-xs text-cyan-600 hover:underline"><ExternalLink className="w-3 h-3" />Demo</a>}
                    {s.slideUrl && <a href="#" className="flex items-center gap-1 text-xs text-purple-600 hover:underline"><ExternalLink className="w-3 h-3" />Slides</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Submission Info</h4>
            <div className="space-y-2.5 text-xs">
              {[['Team', '—'], ['Round', 'Preliminary Round'], ['Deadline', '2026-07-25 23:59']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-900 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 mb-2" />
            <p className="text-xs font-semibold text-amber-800">Resubmission Allowed</p>
            <p className="text-xs text-amber-700 mt-1">You can resubmit any time before the deadline. Only the latest version will be evaluated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ViewResults() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Published Results" subtitle="Preliminary Round — SEAL Hackathon Summer 2026" />

      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-7 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm mb-1">Code Seals — Web Application</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-900 font-bold text-xl">1</span>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>1st Place</p>
                <p className="text-blue-200 text-sm">Preliminary Round Ranking</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Weighted Score</p>
            <p className="text-4xl font-bold font-mono">{publishedResults.totalScore}</p>
            <p className="text-blue-300 text-sm">/ 10.00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
          <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Promoted to Final Round
          </span>
          <span className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Award className="w-3.5 h-3.5" /> 1st Place Award — 15,000,000 VND
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Breakdown by Criterion</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {['Criterion', 'Weight', 'Raw Score / 10', 'Weighted Score', 'Bar'].map(c => (
                <th key={c} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {publishedResults.criteriaBreakdown.map(c => (
              <tr key={c.name} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                <td className="px-3 py-3 text-sm font-mono text-slate-600">{c.weight}%</td>
                <td className="px-3 py-3 text-sm font-mono font-bold text-blue-800">{c.score}</td>
                <td className="px-3 py-3 text-sm font-mono text-emerald-700">{c.weighted.toFixed(2)}</td>
                <td className="px-3 py-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full">
                    <div className="h-2 bg-blue-700 rounded-full" style={{ width: `${(c.score / 10) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-slate-900">Total Weighted Score</td>
              <td className="px-3 py-2.5 text-sm font-bold text-blue-800 font-mono">{publishedResults.totalScore}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Individual judge scores are not shown per SEAL platform policy. Only the final weighted aggregate is published.
        </p>
      </div>
    </div>
  );
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
