import React, { useState } from 'react';
import {
  Users, Send, Trophy, Bell, Plus, Calendar, Clock, CheckCircle2,
  ExternalLink, AlertTriangle, Star, ChevronRight, UserPlus, Mail,
  XCircle, Link, Info, Award
} from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';

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
      <PageHeader title="My Dashboard" subtitle="Nguyen Thanh Phong — Team Leader, Code Seals" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Team" value="Code Seals" subtitle="4 members" icon={Users} accent="blue" />
        <KPICard title="Category" value="Web App" subtitle="Registered" icon={CheckCircle2} accent="green" />
        <KPICard title="Submission" value="v3" subtitle="Preliminary Round" icon={Send} accent="cyan" />
        <KPICard title="Notifications" value={unread} subtitle="Unread" icon={Bell} accent="amber" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Event card */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status="IN_PROGRESS" />
                <span className="text-xs text-slate-400">SUMMER 2026</span>
              </div>
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>SEAL Software Engineering Hackathon Summer 2026</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Your Category', value: 'Web Application' },
              { label: 'Preliminary Deadline', value: '2026-07-25' },
              { label: 'Final Round', value: '2026-08-08' },
            ].map(f => (
              <div key={f.label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">{f.label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => onNavigate('participant-team')} className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Users className="w-3.5 h-3.5" /> My Team
            </button>
            <button onClick={() => onNavigate('participant-submit')} className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Send className="w-3.5 h-3.5" /> Manage Submission
            </button>
            <button onClick={() => onNavigate('participant-results')} className="flex items-center gap-1.5 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Trophy className="w-3.5 h-3.5" /> Results
            </button>
          </div>
        </div>

        {/* Notifications preview */}
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

export function TeamDetail({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const totalMembers = 1 + myTeam.members.length;
  const canAddMore = totalMembers < 5;

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="My Team" subtitle="Code Seals — Web Application" actions={
        canAddMore ? (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg">Team Full (5/5)</span>
        )
      } />

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Team Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{myTeam.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{myTeam.description}</p>
              </div>
              <StatusBadge status={myTeam.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Event:</span> <span className="font-medium text-slate-800">SEAL Hackathon Summer 2026</span></div>
              <div><span className="text-slate-500">Category:</span> <span className="font-medium text-slate-800">{myTeam.category}</span></div>
              <div><span className="text-slate-500">Members:</span> <span className="font-medium text-slate-800">{totalMembers} / 5</span></div>
              <div><span className="text-slate-500">Registration:</span> <StatusBadge status="APPROVED" /></div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Team Members ({totalMembers}/5)</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Email', 'Student ID', 'Role', 'Status'].map(c => (
                    <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">NP</div>
                      <span className="text-sm font-medium text-slate-900">{myTeam.leader.name} <span className="text-xs text-blue-600 ml-1">(You)</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{myTeam.leader.email}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{myTeam.leader.studentId}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Team Leader</span></td>
                  <td className="px-4 py-3"><StatusBadge status="ACTIVE" /></td>
                </tr>
                {myTeam.members.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">{m.name.split(' ').pop()?.[0]}</div>
                        <span className="text-sm text-slate-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{m.email}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{m.studentId}</td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{m.role}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {myTeam.invitations.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-amber-50/50">
                <p className="text-xs font-semibold text-amber-800 mb-2">Pending Invitations</p>
                {myTeam.invitations.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-600 flex items-center gap-1.5"><Mail className="w-3 h-3" />{inv.email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">Sent {inv.sentAt}</span>
                      <button className="text-red-500 hover:text-red-700"><XCircle className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar info */}
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-800 mb-1">Category Registered</p>
            <p className="text-sm text-emerald-700 font-medium">Web Application</p>
            <p className="text-xs text-emerald-600 mt-1">SEAL Hackathon Summer 2026</p>
          </div>
        </div>
      </div>

      {showInvite && (
        <Modal title="Invite Team Member" onClose={() => setShowInvite(false)} size="sm"
          footer={
            <>
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900">Send Invitation</button>
            </>
          }>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">Slots remaining: <strong>{5 - totalMembers}</strong>. The invited person must already have an approved SEAL account.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="member@student.fpt.edu.vn" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SubmitProject() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/codeseals/seal-webapp');
  const [demoUrl, setDemoUrl] = useState('https://seal-demo.vercel.app');
  const [slideUrl, setSlideUrl] = useState('https://drive.google.com/file/seal-slides');
  const [reportUrl, setReportUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Project Submission" subtitle="Preliminary Round — Deadline: 2026-07-25 23:59" />

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Current submission */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Submission Received — Version 3</p>
              <p className="text-sm text-emerald-700 mt-0.5">Last submitted: 2026-07-22 14:30. You may resubmit until the deadline.</p>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Submission URLs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Repository URL <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400 ml-2 font-normal">(Required — must be publicly accessible)</span>
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="https://github.com/team/project" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Demo URL <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={demoUrl} onChange={e => setDemoUrl(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="https://your-demo.vercel.app" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slide / Presentation URL <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={slideUrl} onChange={e => setSlideUrl(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="https://drive.google.com/..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Report URL <span className="text-slate-400 text-xs font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={reportUrl} onChange={e => setReportUrl(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="https://docs.google.com/..." />
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                File uploads are not accepted. All submissions must be URL-based. Ensure all links are publicly accessible before submitting.
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => setSubmitted(true)} disabled={!repoUrl.trim()} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" /> Resubmit (v4)
                </button>
              </div>
            </div>
          </div>

          {/* Version History */}
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

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Submission Info</h4>
            <div className="space-y-2.5 text-xs">
              {[['Team', 'Code Seals'], ['Category', 'Web Application'], ['Round', 'Preliminary Round'], ['Deadline', '2026-07-25 23:59'], ['Time Left', '~1 day']].map(([k, v]) => (
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

      {/* Result Card */}
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

      {/* Score Breakdown */}
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
