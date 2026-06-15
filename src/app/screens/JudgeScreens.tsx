import React, { useState } from 'react';
import { Star, Clock, CheckCircle2, AlertTriangle, ExternalLink, Save, Send } from 'lucide-react';
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

const assignedSubmissions = [
  { id: 1, event: 'SEAL SE Hackathon Summer 2026', round: 'Preliminary Round', category: 'Web Application', team: 'Code Seals', repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: 'drive.google.com/...', deadline: '2026-07-25', status: 'SCORED' },
  { id: 2, event: 'SEAL SE Hackathon Summer 2026', round: 'Preliminary Round', category: 'AI/Automation Tool', team: 'AlphaBot', repoUrl: 'github.com/alphabot/ai-tool', demoUrl: 'alphabot-demo.netlify.app', slideUrl: null, deadline: '2026-07-25', status: 'SCORED' },
  { id: 3, event: 'SEAL SE Hackathon Summer 2026', round: 'Preliminary Round', category: 'Mobile Application', team: 'MobileFirst', repoUrl: 'github.com/mobilefirst/app', demoUrl: null, slideUrl: 'drive.google.com/...', deadline: '2026-07-25', status: 'SCORED' },
  { id: 4, event: 'SEAL SE Hackathon Summer 2026', round: 'Preliminary Round', category: 'Web Application', team: 'NexGen', repoUrl: 'github.com/nexgen/webapp', demoUrl: 'nexgen-webapp.vercel.app', slideUrl: null, deadline: '2026-07-25', status: 'NOT_SCORED' },
  { id: 5, event: 'SEAL SE Hackathon Summer 2026', round: 'Preliminary Round', category: 'AI/Automation Tool', team: 'DataFlow', repoUrl: 'github.com/dataflow/tool', demoUrl: null, slideUrl: null, deadline: '2026-07-25', status: 'NOT_SCORED' },
];

const criteria = [
  { id: 1, name: 'Technical Quality', description: 'Code quality, architecture, performance, and scalability', maxScore: 10, weight: 40 },
  { id: 2, name: 'Innovation', description: 'Originality, creative use of technology, novelty of approach', maxScore: 10, weight: 25 },
  { id: 3, name: 'UI/UX Design', description: 'Interface usability, visual design, user experience quality', maxScore: 10, weight: 20 },
  { id: 4, name: 'Presentation', description: 'Demo clarity, Q&A responses, communication effectiveness', maxScore: 10, weight: 15 },
];

export function JudgeDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const scored = assignedSubmissions.filter(s => s.status === 'SCORED').length;
  const pending = assignedSubmissions.filter(s => s.status === 'NOT_SCORED').length;

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Judge Dashboard" subtitle="Pham Duc Dat — Internal Judge" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="Assigned Submissions" value={assignedSubmissions.length} icon={Star} accent="blue" />
        <KPICard title="Scored" value={scored} subtitle="Completed" icon={CheckCircle2} accent="green" />
        <KPICard title="Pending" value={pending} subtitle="Require scoring" icon={AlertTriangle} accent="amber" />
        <KPICard title="Deadline" value="2026-07-25" subtitle="1 day remaining" icon={Clock} accent="red" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pending Submissions</h3>
          {assignedSubmissions.filter(s => s.status === 'NOT_SCORED').map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50 mb-3 last:mb-0">
              <div>
                <p className="text-sm font-semibold text-slate-900">{s.team}</p>
                <p className="text-xs text-slate-500">{s.round} · {s.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="NOT_SCORED" label="Not Scored" />
                <button onClick={() => onNavigate('judge-scoring')} className="text-xs bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Score Now</button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Scoring Progress</h3>
          <div className="flex items-center justify-center my-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1e3a8a" strokeWidth="3.5"
                  strokeDasharray={`${(scored / assignedSubmissions.length) * 87.96} 87.96`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{scored}</span>
                <span className="text-xs text-slate-500">of {assignedSubmissions.length}</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-600 mb-3">{Math.round((scored / assignedSubmissions.length) * 100)}% complete</p>
          <div className="space-y-1.5">
            {assignedSubmissions.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                {s.status === 'SCORED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span className={s.status === 'SCORED' ? 'text-slate-500 line-through' : 'text-slate-700'}>{s.team}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function JudgeSubmissions({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Assigned Submissions" subtitle="Preliminary Round — Score before 2026-07-25" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Team', 'Category', 'Repository', 'Demo', 'Slides', 'Deadline', 'Status', 'Action'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {assignedSubmissions.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${s.status === 'NOT_SCORED' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.team}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{s.category}</td>
                <td className="px-4 py-3">
                  <a href="#" className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1"><ExternalLink className="w-3 h-3" />{s.repoUrl}</a>
                </td>
                <td className="px-4 py-3">
                  {s.demoUrl ? <a href="#" className="text-xs text-cyan-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Demo</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {s.slideUrl ? <a href="#" className="text-xs text-purple-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Slides</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.deadline}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status === 'SCORED' ? 'SCORED' : 'NOT_SCORED'} label={s.status === 'SCORED' ? 'Scored' : 'Pending'} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => onNavigate('judge-scoring')} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.status === 'SCORED' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-blue-800 text-white hover:bg-blue-900'}`}>
                    {s.status === 'SCORED' ? 'Edit Score' : 'Score Now'}
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

export function JudgeScoringPage() {
  const [scores, setScores] = useState<Record<number, number>>({ 1: 9, 2: 8, 3: 9, 4: 0 });
  const [comments, setComments] = useState<Record<number, string>>({ 1: 'Clean React + TypeScript with excellent component architecture. Performance optimization evident.', 2: 'Unique approach to UI generation but lacks some depth in novelty.', 3: '', 4: '' });
  const [submitted, setSubmitted] = useState(false);

  const totalScore = criteria.reduce((sum, c) => sum + ((scores[c.id] || 0) * c.weight / 100), 0);
  const allScored = criteria.every(c => (scores[c.id] || 0) > 0);

  if (submitted) {
    return (
      <div className="p-7">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Score Submitted</h2>
          <p className="text-slate-500 mb-2">Your scorecard for <strong>Code Seals</strong> has been submitted.</p>
          <p className="text-slate-400 text-sm mb-5">Weighted Total: <strong className="text-blue-800 font-mono">{totalScore.toFixed(2)}</strong> / 10</p>
          <p className="text-xs text-slate-400">Updates are tracked in the audit log. You can edit before scoring is locked by the coordinator.</p>
          <button onClick={() => setSubmitted(false)} className="mt-5 text-sm text-blue-700 font-medium hover:text-blue-800">Edit Score</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Score Submission" subtitle="Code Seals — Web Application — Preliminary Round" />

      {/* Team & Submission Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Team & Submission Info</h3>
          <StatusBadge status="SUBMITTED" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Team', value: 'Code Seals (4 members)' },
            { label: 'Category', value: 'Web Application' },
            { label: 'Round', value: 'Preliminary Round' },
          ].map(f => (
            <div key={f.label}><p className="text-xs text-slate-500 mb-0.5">{f.label}</p><p className="text-sm font-medium text-slate-900">{f.value}</p></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
          <a href="#" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"><ExternalLink className="w-3.5 h-3.5" /> Repository (GitHub)</a>
          <a href="#" className="flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium"><ExternalLink className="w-3.5 h-3.5" /> Live Demo</a>
          <a href="#" className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"><ExternalLink className="w-3.5 h-3.5" /> Slide Deck</a>
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Scoring Criteria</h3>
          <div className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold border ${allScored ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            Weighted Total: {totalScore.toFixed(2)} / 10
          </div>
        </div>
        <div className="space-y-5">
          {criteria.map(c => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">Weight: {c.weight}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold font-mono ${(scores[c.id] || 0) > 0 ? 'text-blue-800' : 'text-slate-300'}`}>{scores[c.id] || '–'}</span>
                  <span className="text-slate-400 font-mono">/{c.maxScore}</span>
                </div>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-1 mt-3">
                {Array.from({ length: c.maxScore }, (_, i) => i + 1).map(val => (
                  <button
                    key={val}
                    onClick={() => setScores({ ...scores, [c.id]: val })}
                    className={`flex-1 h-8 rounded-lg text-sm font-bold transition-all ${(scores[c.id] || 0) >= val ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-700'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range" min={0} max={c.maxScore} step={1} value={scores[c.id] || 0}
                onChange={e => setScores({ ...scores, [c.id]: Number(e.target.value) })}
                className="w-full mt-2 accent-blue-800"
              />

              {/* Comment */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Comment (optional)</label>
                <textarea
                  value={comments[c.id] || ''}
                  onChange={e => setComments({ ...comments, [c.id]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-700"
                  rows={2}
                  placeholder="Add scoring notes for this criterion…"
                />
              </div>

              {/* Contribution */}
              {(scores[c.id] || 0) > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  Weighted contribution: <span className="font-mono text-blue-700">{(((scores[c.id] || 0) / c.maxScore) * (c.weight / 100) * c.maxScore).toFixed(2)}</span> points
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation */}
      {!allScored && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-700">All {criteria.length} criteria must be scored before submitting.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button
          onClick={() => allScored && setSubmitted(true)}
          disabled={!allScored}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" /> Submit Scorecard
        </button>
      </div>
    </div>
  );
}
