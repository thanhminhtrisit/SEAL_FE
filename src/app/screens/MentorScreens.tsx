import React, { useState } from 'react';
import { Users, BookOpen, Calendar, ExternalLink, MessageSquare, ChevronRight, Clock, Send } from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

const assignedCategories = [
  {
    id: 1, name: 'Web Application', event: 'SEAL SE Hackathon Summer 2026',
    teams: [
      { id: 1, name: 'Code Seals', members: 4, leader: 'Nguyen Thanh Phong', submission: 'Submitted v3', submittedAt: '2026-07-22 14:30', repoUrl: 'github.com/codeseals/seal-webapp', status: 'SUBMITTED' },
      { id: 2, name: 'NexGen', members: 4, leader: 'Pham Anh Tuan', submission: 'Submitted v1', submittedAt: '2026-07-24 20:10', repoUrl: 'github.com/nexgen/webapp', status: 'SUBMITTED' },
    ],
    deadline: '2026-07-25',
  },
  {
    id: 2, name: 'AI/Automation Tool', event: 'SEAL SE Hackathon Summer 2026',
    teams: [
      { id: 3, name: 'AlphaBot', members: 3, leader: 'Le Hoang Nam', submission: 'Submitted v1', submittedAt: '2026-07-23 10:15', repoUrl: 'github.com/alphabot/ai-tool', status: 'SUBMITTED' },
      { id: 4, name: 'DataFlow', members: 3, leader: 'Nguyen Bich Thao', submission: 'Not submitted', submittedAt: '—', repoUrl: '', status: 'PENDING' },
    ],
    deadline: '2026-07-25',
  },
];

const allTeams = assignedCategories.flatMap(c => c.teams.map(t => ({ ...t, category: c.name })));

export function MentorDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const totalTeams = assignedCategories.reduce((s, c) => s + c.teams.length, 0);
  const submitted = allTeams.filter(t => t.status === 'SUBMITTED').length;

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Mentor Dashboard" subtitle="Hoang Thi Em — Assigned to Web Application & AI/Automation Tool" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="Assigned Categories" value={assignedCategories.length} icon={BookOpen} accent="blue" />
        <KPICard title="My Teams" value={totalTeams} icon={Users} accent="cyan" />
        <KPICard title="Submissions Received" value={`${submitted}/${totalTeams}`} icon={Send} accent="green" />
        <KPICard title="Deadline" value="2026-07-25" subtitle="Preliminary Round" icon={Clock} accent="amber" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {assignedCategories.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cat.event}</p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{cat.teams.length} teams</span>
            </div>
            <div className="space-y-2.5">
              {cat.teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {team.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{team.name}</p>
                      <p className="text-xs text-slate-400">{team.members} members · {team.leader}</p>
                    </div>
                  </div>
                  <StatusBadge status={team.status} label={team.status === 'SUBMITTED' ? 'Submitted' : 'Pending'} />
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('mentor-teams')} className="mt-3 w-full text-sm text-blue-700 font-medium hover:text-blue-800 flex items-center justify-center gap-1 pt-3 border-t border-slate-100">
              View All Teams <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Mentor Role — Scoring Restricted</p>
          <p className="text-sm text-blue-700 mt-0.5">As a mentor, you can view team submissions and provide guidance, but you cannot access judge scoring panels or see judge scores before publication.</p>
        </div>
      </div>
    </div>
  );
}

export function MentorTeams({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [selectedTeam, setSelectedTeam] = useState<typeof allTeams[0] | null>(null);
  const [guidance, setGuidance] = useState('');

  if (selectedTeam) {
    return (
      <div className="p-7 space-y-5">
        <button onClick={() => setSelectedTeam(null)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors mb-2">← Back to Teams</button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{selectedTeam.name}</h2>
              <p className="text-sm text-slate-500">{selectedTeam.category} · {selectedTeam.members} members</p>
            </div>
            <StatusBadge status={selectedTeam.status} label={selectedTeam.status === 'SUBMITTED' ? 'Submitted' : 'Pending'} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Team Members</h4>
              <div className="space-y-2">
                {[
                  { name: selectedTeam.leader, role: 'Team Leader' },
                  { name: 'Do Thi Quynh', role: 'Member' },
                  { name: 'Tran Van Minh', role: 'Member' },
                  { name: 'Bui Quang Huy', role: 'Member' },
                ].slice(0, selectedTeam.members).map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                      {m.name.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Project Submission</h4>
              {selectedTeam.status === 'SUBMITTED' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Submitted: {selectedTeam.submittedAt}</p>
                  <a href="#" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> {selectedTeam.repoUrl}
                  </a>
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Repository URL is the only required link. Demo and slide URLs are optional and may not be present for all teams.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">No submission yet. Deadline: 2026-07-25.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Guidance Notes</h3>
          <p className="text-xs text-slate-500 mb-3">These notes are visible only to you and the team. They are not part of the scoring process.</p>
          <textarea
            value={guidance}
            onChange={e => setGuidance(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700"
            rows={4}
            placeholder="Add mentoring notes, suggestions, or feedback for this team…"
          />
          <div className="flex justify-end mt-2">
            <button className="text-sm bg-blue-800 hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg transition-colors">Save Notes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="My Teams" subtitle="Teams across assigned categories" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Team', 'Category', 'Leader', 'Members', 'Submission', 'Submitted At', 'Status', 'Action'].map(c => (
                <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allTeams.map(team => (
              <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{team.name[0]}</div>
                    <span className="text-sm font-semibold text-slate-900">{team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{team.category}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{team.leader}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-slate-700">{team.members} / 5</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{team.submission}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{team.submittedAt}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={team.status} label={team.status === 'SUBMITTED' ? 'Submitted' : 'Pending'} />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedTeam(team)} className="text-xs text-blue-700 font-medium hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
