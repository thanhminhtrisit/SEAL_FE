import React, { useState } from 'react';
import { Lock, Unlock, Trophy, Award, Globe, AlertTriangle, Star, Download, TrendingUp, Check, Send, BarChart2, Shield, Eye } from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const rankingData = [
  { rank: 1, team: 'Code Seals', category: 'Web Application', score: 87.5, technical: 9.2, innovation: 8.5, uiux: 9.0, presentation: 8.8, status: 'PROMOTED', judge1: 88, judge2: 87 },
  { rank: 2, team: 'MobileFirst', category: 'Mobile Application', score: 83.2, technical: 8.8, innovation: 8.0, uiux: 8.5, presentation: 8.2, status: 'PROMOTED', judge1: 84, judge2: 82 },
  { rank: 3, team: 'AlphaBot', category: 'AI/Automation Tool', score: 81.0, technical: 8.5, innovation: 9.0, uiux: 7.5, presentation: 8.0, status: 'PROMOTED', judge1: 80, judge2: 82 },
  { rank: 4, team: 'NexGen', category: 'Web Application', score: 74.8, technical: 7.5, innovation: 7.8, uiux: 7.2, presentation: 7.5, status: '', judge1: 75, judge2: 74 },
  { rank: 5, team: 'DataFlow', category: 'AI/Automation Tool', score: 68.5, technical: 7.0, innovation: 7.2, uiux: 6.5, presentation: 6.8, status: '', judge1: 69, judge2: 68 },
];

const awardsData = [
  { placement: '1st Place', team: 'Code Seals', category: 'Web Application', prize: '15,000,000 VND', assigned: true },
  { placement: '2nd Place', team: 'MobileFirst', category: 'Mobile Application', prize: '10,000,000 VND', assigned: true },
  { placement: '3rd Place', team: 'AlphaBot', category: 'AI/Automation Tool', prize: '5,000,000 VND', assigned: true },
  { placement: 'Best Innovation', team: '', category: '', prize: 'Certificate', assigned: false },
  { placement: 'Best UI/UX', team: '', category: '', prize: 'Certificate', assigned: false },
];

const rblData = {
  icc: 0.84,
  krippendorff: 0.81,
  judges: ['Pham Duc Dat', 'Vu Minh Phuong'],
  criteriaVariance: [
    { criterion: 'Technical Quality', variance: 0.8, judge1: 9.2, judge2: 8.8 },
    { criterion: 'Innovation', variance: 2.1, judge1: 8.5, judge2: 9.5 },
    { criterion: 'UI/UX Design', variance: 0.5, judge1: 9.0, judge2: 8.5 },
    { criterion: 'Presentation', variance: 1.2, judge1: 8.8, judge2: 8.2 },
  ],
  teamScores: rankingData.map(r => ({ team: r.team, judge1: r.judge1, judge2: r.judge2 })),
};

const radarData = [
  { criterion: 'Technical', code_seals: 9.2, mobileFirst: 8.8, alphaBot: 8.5 },
  { criterion: 'Innovation', code_seals: 8.5, mobileFirst: 8.0, alphaBot: 9.0 },
  { criterion: 'UI/UX', code_seals: 9.0, mobileFirst: 8.5, alphaBot: 7.5 },
  { criterion: 'Presentation', code_seals: 8.8, mobileFirst: 8.2, alphaBot: 8.0 },
];

export function ScoringControl() {
  const [prelim, setPrelim] = useState(true);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Scoring Control" subtitle="Manage scoring rounds and monitor judge progress" />
      <div className="grid grid-cols-3 gap-5">
        {[{ round: 'Preliminary Round', status: 'SCORING_OPEN', open: prelim, scored: 7, total: 14, incomplete: ['DataFlow — Vu Minh Phuong', 'DataFlow — Pham Duc Dat', 'NexGen — Vu Minh Phuong'] },
          { round: 'Final Round', status: 'DRAFT', open: false, scored: 0, total: 12, incomplete: [] }].map((r, i) => (
          <div key={r.round} className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{r.round}</h3>
              <StatusBadge status={r.status} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Scorecards completed</span><span className="font-mono">{r.scored}/{r.total}</span></div>
              <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${(r.scored / r.total) * 100}%` }} /></div>
            </div>
            {r.open && r.incomplete.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1.5">Incomplete Scorecards ({r.incomplete.length})</p>
                <ul className="space-y-0.5">{r.incomplete.map(item => <li key={item} className="text-xs text-amber-700">• {item}</li>)}</ul>
              </div>
            )}
            {i === 0 && (
              <button onClick={() => setPrelim(!prelim)} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${r.open ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                {r.open ? <><Lock className="w-4 h-4" /> Lock Scoring</> : <><Unlock className="w-4 h-4" /> Open Scoring</>}
              </button>
            )}
            {i === 1 && (
              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200">
                <Unlock className="w-4 h-4" /> Open After Promotion
              </button>
            )}
          </div>
        ))}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Judge Progress</h3>
          {[{ name: 'Pham Duc Dat', scored: 4, total: 7 }, { name: 'Vu Minh Phuong', scored: 3, total: 7 }].map(j => (
            <div key={j.name} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-700">{j.name}</span><span className="font-mono text-slate-500 text-xs">{j.scored}/{j.total}</span></div>
              <div className="h-2 bg-slate-100 rounded-full"><div className={`h-2 rounded-full ${j.scored === j.total ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${(j.scored / j.total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RankingPage() {
  const [showCompute, setShowCompute] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Rankings" subtitle="Preliminary Round — SEAL Hackathon Summer 2026"
        actions={
          <>
            <button onClick={() => setShowCompute(true)} className="flex items-center gap-2 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"><BarChart2 className="w-4 h-4" /> Recompute Ranking</button>
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Event-Level Ranking</h3>
            <span className="text-xs text-slate-500">Top 6 promoted to Final Round</span>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">{['Rank', 'Team', 'Category', 'Score', 'Status'].map(c => <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rankingData.map(r => (
                <tr key={r.rank} className={`hover:bg-slate-50 transition-colors ${r.rank <= 3 ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${r.rank === 1 ? 'bg-yellow-400 text-yellow-900' : r.rank === 2 ? 'bg-slate-300 text-slate-700' : r.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {r.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.team}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.category}</td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-800">{r.score}</td>
                  <td className="px-4 py-3">
                    {r.status === 'PROMOTED' ? <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium"><Check className="w-3 h-3" /> Promoted</span> : <span className="text-xs text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Profile — Top 3 Teams</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Radar name="Code Seals" dataKey="code_seals" stroke="#1e3a8a" fill="#1e3a8a" fillOpacity={0.15} />
              <Radar name="MobileFirst" dataKey="mobileFirst" stroke="#0891b2" fill="#0891b2" fillOpacity={0.1} />
              <Radar name="AlphaBot" dataKey="alphaBot" stroke="#059669" fill="#059669" fillOpacity={0.1} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Criterion Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={rankingData.map(r => ({ team: r.team, technical: r.technical, innovation: r.innovation, uiux: r.uiux, presentation: r.presentation }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="team" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="technical" name="Technical" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="innovation" name="Innovation" fill="#0891b2" radius={[2, 2, 0, 0]} />
            <Bar dataKey="uiux" name="UI/UX" fill="#059669" radius={[2, 2, 0, 0]} />
            <Bar dataKey="presentation" name="Presentation" fill="#d97706" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showCompute && (
        <Modal title="Recompute Rankings" onClose={() => setShowCompute(false)} size="sm"
          footer={<><button onClick={() => setShowCompute(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button onClick={() => setShowCompute(false)} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900">Recompute</button></>}>
          <p className="text-sm text-slate-600">Recalculate all weighted scores using current judge entries. Only scores from locked rounds are included. This will overwrite the current rankings.</p>
        </Modal>
      )}
    </div>
  );
}

export function AwardsPage() {
  const [showAssign, setShowAssign] = useState<typeof awardsData[0] | null>(null);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Awards Management" subtitle="Assign placements and special awards — SEAL Hackathon Summer 2026" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Award Assignments</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Award', 'Assigned Team', 'Category', 'Prize', 'Status', 'Action'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {awardsData.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : i === 2 ? 'bg-amber-600' : 'bg-blue-100'}`}>
                      <Trophy className={`w-3.5 h-3.5 ${i === 0 ? 'text-yellow-800' : i === 1 ? 'text-slate-600' : i === 2 ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{a.placement}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.team || <span className="text-slate-400 italic">Not assigned</span>}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.category || '—'}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{a.prize}</td>
                <td className="px-4 py-3"><StatusBadge status={a.assigned ? 'APPROVED' : 'PENDING'} label={a.assigned ? 'Assigned' : 'Pending'} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setShowAssign(a)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${a.assigned ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>{a.assigned ? 'Change' : 'Assign'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAssign && (
        <Modal title={`Assign ${showAssign.placement}`} onClose={() => setShowAssign(null)} size="sm"
          footer={<><button onClick={() => setShowAssign(null)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button onClick={() => setShowAssign(null)} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900">Assign Award</button></>}>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Select Team</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                {rankingData.map(r => <option key={r.team} value={r.team}>{r.team} (#{r.rank} — {r.score} pts)</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function ResultPublication() {
  const [published, setPublished] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Publish Results" subtitle="Preview and publish final results to participants" />
      {!published ? (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-blue-800">Results Preview (Not Yet Published)</p><p className="text-sm text-blue-700 mt-1">Results are only visible to you. Participants cannot see rankings, scores, or awards until you publish.</p></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Final Results Preview</h3>
            <div className="space-y-3">
              {rankingData.slice(0, 3).map(r => (
                <div key={r.rank} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${r.rank === 1 ? 'bg-yellow-400 text-yellow-900' : r.rank === 2 ? 'bg-slate-300 text-slate-700' : 'bg-amber-600 text-white'}`}>{r.rank}</div>
                  <div className="flex-1"><p className="font-semibold text-slate-900 text-sm">{r.team}</p><p className="text-xs text-slate-500">{r.category}</p></div>
                  <span className="font-mono font-bold text-blue-800">{r.score}</span>
                  {r.status === 'PROMOTED' && <StatusBadge status="PROMOTED" />}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export CSV</button>
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export Excel</button>
            <button onClick={() => setPublished(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors ml-auto"><Globe className="w-4 h-4" /> Publish & Notify Participants</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Globe className="w-7 h-7 text-emerald-600" /></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Results Published!</h2>
          <p className="text-slate-500 mb-5">All participants have been notified. Rankings, scores, and awards are now visible to teams.</p>
          <button onClick={() => setPublished(false)} className="text-sm text-blue-700 font-medium hover:text-blue-800">Unpublish Results</button>
        </div>
      )}
    </div>
  );
}

export function RBLDashboard() {
  return (
    <div className="p-7 space-y-6">
      <PageHeader title="RBL Inter-Rater Reliability" subtitle="Preliminary Round — Statistical analysis of judge consistency"
        actions={<button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Anonymized Export</button>}
      />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="ICC (Two-Way Mixed)" value={rblData.icc.toFixed(2)} subtitle="95% CI: [0.79, 0.91]" icon={Shield} accent={rblData.icc >= 0.75 ? 'green' : rblData.icc >= 0.6 ? 'amber' : 'red'} />
        <KPICard title="Krippendorff's α" value={rblData.krippendorff.toFixed(2)} subtitle="Interval scale" icon={BarChart2} accent={rblData.krippendorff >= 0.8 ? 'green' : 'amber'} />
        <KPICard title="Reliability Level" value="Good" subtitle="ICC ≥ 0.75 threshold met" icon={Check} accent="green" />
        <KPICard title="Judges Analyzed" value={rblData.judges.length} subtitle="Pham Duc Dat, Vu Minh Phuong" icon={Star} accent="blue" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Comparison by Team</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rblData.teamScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="team" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="judge1" name="Pham Duc Dat" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="judge2" name="Vu Minh Phuong" fill="#0891b2" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Variance by Criterion</h3>
          <div className="space-y-3">
            {rblData.criteriaVariance.map(c => (
              <div key={c.criterion}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{c.criterion}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.variance > 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>σ²={c.variance}</span>
                    {c.variance > 1.5 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-700" /><span className="font-mono">{c.judge1}</span></div>
                  <div className="h-1 flex-1 bg-slate-100 rounded-full relative">
                    <div className="absolute h-1 bg-blue-200 rounded-full" style={{ left: `${Math.min(c.judge1, c.judge2) / 10 * 100 - 100}%`, width: `${Math.abs(c.judge1 - c.judge2) / 10 * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-600" /><span className="font-mono">{c.judge2}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-amber-700 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Innovation shows elevated variance (σ²=2.1) — flagged for review.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Interpretation Guide</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{ range: 'ICC < 0.60', level: 'Poor', desc: 'Significant disagreement. Consider recalibration.', color: 'bg-red-50 border-red-200 text-red-800' },
            { range: 'ICC 0.60–0.74', level: 'Moderate', desc: 'Acceptable with caveats. Review flagged criteria.', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { range: 'ICC ≥ 0.75', level: 'Good–Excellent', desc: 'Reliable scoring. Results may be finalized.', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' }].map(g => (
            <div key={g.range} className={`rounded-lg border p-3 ${g.color}`}>
              <p className="text-xs font-mono font-bold mb-1">{g.range}</p>
              <p className="text-sm font-semibold mb-1">{g.level}</p>
              <p className="text-xs">{g.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-800">Current ICC of <strong>0.84</strong> meets the <strong>"Good"</strong> threshold. Results may be finalized and published.</p>
        </div>
      </div>
    </div>
  );
}
