import React, { useState } from 'react';
import { CheckSquare, XCircle, BookOpen, Target, BarChart3, Eye, ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Calendar, Users, DollarSign, Filter, Download } from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const pendingApprovals = [
  { id: 1, name: 'SEAL Software Engineering Hackathon Summer 2026', coordinator: 'Le Minh Cuong', discipline: 'Software Engineering', term: 'Summer 2026', status: 'PENDING_APPROVAL', submittedDate: '2026-06-10', budget: '45,000,000 VND', rounds: 2, categories: 3 },
  { id: 2, name: 'FPT AI Innovation Challenge Fall 2026', coordinator: 'Nguyen Van Hoa', discipline: 'Artificial Intelligence', term: 'Fall 2026', status: 'PENDING_APPROVAL', submittedDate: '2026-06-08', budget: '38,000,000 VND', rounds: 2, categories: 3 },
  { id: 3, name: 'IoT Smart City Hackathon Summer 2026', coordinator: 'Pham Thi Lan', discipline: 'IoT & Embedded', term: 'Summer 2026', status: 'PENDING_APPROVAL', submittedDate: '2026-06-05', budget: '27,500,000 VND', rounds: 1, categories: 2 },
];

const disciplines = [
  { id: 1, name: 'Software Engineering', code: 'SE', status: 'ACTIVE', activeEvents: 1, totalTeams: 24, completedEvents: 8 },
  { id: 2, name: 'Artificial Intelligence', code: 'AI', status: 'ACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 3 },
  { id: 3, name: 'IoT & Embedded Systems', code: 'IoT', status: 'ACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 2 },
  { id: 4, name: 'Cybersecurity', code: 'CS', status: 'INACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 1 },
];

const termQuotas = [
  { id: 1, term: 'Summer', year: 2026, discipline: 'Software Engineering', maxEvents: 2, usedEvents: 1, status: 'ok' },
  { id: 2, term: 'Summer', year: 2026, discipline: 'Artificial Intelligence', maxEvents: 1, usedEvents: 0, status: 'ok' },
  { id: 3, term: 'Summer', year: 2026, discipline: 'IoT & Embedded Systems', maxEvents: 1, usedEvents: 1, status: 'warn' },
  { id: 4, term: 'Fall', year: 2026, discipline: 'Software Engineering', maxEvents: 2, usedEvents: 0, status: 'ok' },
  { id: 5, term: 'Fall', year: 2026, discipline: 'Artificial Intelligence', maxEvents: 2, usedEvents: 1, status: 'ok' },
];

const registrationData = [
  { month: 'Jan', registered: 12, completed: 10 },
  { month: 'Feb', registered: 18, completed: 14 },
  { month: 'Mar', registered: 22, completed: 19 },
  { month: 'Apr', registered: 16, completed: 13 },
  { month: 'May', registered: 28, completed: 24 },
  { month: 'Jun', registered: 24, completed: 0 },
];

const scoreDistData = [
  { range: '0-20', count: 2 },
  { range: '21-40', count: 8 },
  { range: '41-60', count: 15 },
  { range: '61-70', count: 22 },
  { range: '71-80', count: 18 },
  { range: '81-90', count: 9 },
  { range: '91-100', count: 4 },
];

const eventTrendData = [
  { term: 'Fall 23', events: 2, teams: 18, avgScore: 68 },
  { term: 'Spring 24', events: 3, teams: 27, avgScore: 71 },
  { term: 'Summer 24', events: 2, teams: 20, avgScore: 69 },
  { term: 'Fall 24', events: 4, teams: 36, avgScore: 73 },
  { term: 'Spring 25', events: 3, teams: 31, avgScore: 74 },
  { term: 'Summer 25', events: 3, teams: 33, avgScore: 75 },
  { term: 'Fall 25', events: 4, teams: 40, avgScore: 76 },
  { term: 'Summer 26', events: 1, teams: 24, avgScore: 0 },
];

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SCDashboard() {
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Program Dashboard" subtitle="FPT University HCMC — Software Engineering Department" />
      <div className="grid grid-cols-5 gap-5">
        <KPICard title="Pending Approvals" value="3" subtitle="Requires review" icon={CheckSquare} accent="amber" />
        <KPICard title="Approved This Term" value="1" subtitle="Summer 2026" icon={Calendar} accent="green" />
        <KPICard title="Quota Usage" value="3/6" subtitle="Across all disciplines" icon={Target} accent="blue" />
        <KPICard title="Total Budget Approved" value="45M VND" subtitle="Current term" icon={DollarSign} accent="cyan" />
        <KPICard title="Completed Events" value="18" subtitle="All terms" icon={TrendingUp} accent="purple" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pending Event Approvals</h3>
          <div className="space-y-3">
            {pendingApprovals.map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ev.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.coordinator} · {ev.discipline} · {ev.budget}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="PENDING_APPROVAL" />
                  <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Discipline Status</h3>
          <div className="space-y-3">
            {disciplines.filter(d => d.status === 'ACTIVE').map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{d.code}</span>
                  <span className="text-sm text-slate-900">{d.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{d.activeEvents} active · {d.completedEvents} completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventApprovals({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [selectedEvent, setSelectedEvent] = useState<typeof pendingApprovals[0] | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const budgetItems = [
    { category: 'Prize', description: 'First Place Prize', qty: 1, unitCost: '15,000,000', amount: '15,000,000' },
    { category: 'Prize', description: 'Second Place Prize', qty: 1, unitCost: '10,000,000', amount: '10,000,000' },
    { category: 'Prize', description: 'Third Place Prize', qty: 1, unitCost: '5,000,000', amount: '5,000,000' },
    { category: 'Catering', description: 'Event Day Meals & Drinks', qty: 1, unitCost: '8,000,000', amount: '8,000,000' },
    { category: 'Honorarium', description: 'Guest Judge Honorarium', qty: 2, unitCost: '2,000,000', amount: '4,000,000' },
    { category: 'Marketing', description: 'Posters & Online Promotion', qty: 1, unitCost: '3,000,000', amount: '3,000,000' },
  ];

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Event Approval Queue" subtitle={`${pendingApprovals.length} events awaiting review`} />

      {!selectedEvent ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              {['Event', 'Coordinator', 'Discipline', 'Term', 'Submitted', 'Budget', 'Status', 'Actions'].map(c => (
                <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {pendingApprovals.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{ev.name}</p>
                    <p className="text-xs text-slate-400">{ev.rounds} rounds · {ev.categories} categories</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{ev.coordinator}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{ev.discipline}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{ev.term}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{ev.submittedDate}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{ev.budget}</td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelectedEvent(ev)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"><Eye className="w-3 h-3" /> Review</button>
                      <button onClick={() => { setSelectedEvent(ev); setShowApprove(true); }} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Approve</button>
                      <button onClick={() => { setSelectedEvent(ev); setShowReject(true); }} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedEvent(null)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors">← Back to queue</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{selectedEvent.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">Submitted by <strong>{selectedEvent.coordinator}</strong> · {selectedEvent.submittedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowReject(true)} className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Reject</button>
                  <button onClick={() => setShowApprove(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"><CheckSquare className="w-4 h-4" /> Approve Event</button>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {['overview', 'rounds', 'categories', 'criteria', 'budget', 'audit'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${activeTab === tab ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {tab === 'audit' ? 'Audit Trail' : tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[['Event Type', 'SUMMER'], ['Discipline', selectedEvent.discipline], ['Term', selectedEvent.term], ['Registration Open', '2026-06-20'], ['Registration Close', '2026-06-30'], ['Event Start', '2026-07-15'], ['Event End', '2026-08-10']].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500">{k}</span>
                        <span className="text-sm font-medium text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-700 mb-3 text-sm">Event Description</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">A multi-round software engineering hackathon for FPT University HCMC students. Teams of 3–5 compete across three categories — Web Application, Mobile Application, and AI/Automation Tool — through a preliminary round and a final round judged by industry experts and faculty.</p>
                  </div>
                </div>
              )}
              {activeTab === 'budget' && (
                <div>
                  <table className="w-full mb-4">
                    <thead><tr className="border-b border-slate-200">
                      {['Category', 'Description', 'Qty', 'Unit Cost (VND)', 'Amount (VND)'].map(c => (
                        <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {budgetItems.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-sm text-slate-600">{item.category}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-900">{item.description}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 font-mono">{item.qty}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-700 text-right">{item.unitCost}</td>
                          <td className="px-3 py-2.5 text-sm font-mono font-semibold text-slate-900 text-right">{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-3 py-2.5 text-sm font-bold text-slate-900">Total Estimated Cost</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-blue-800 font-mono text-right">45,000,000</td>
                    </tr></tfoot>
                  </table>
                </div>
              )}
              {activeTab === 'rounds' && (
                <div className="space-y-3">
                  {[{ name: 'Preliminary Round', order: 1, deadline: '2026-07-25', promotionTopN: 6, isFinal: false }, { name: 'Final Round', order: 2, deadline: '2026-08-08', promotionTopN: 3, isFinal: true }].map(r => (
                    <div key={r.name} className="p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Round {r.order}: {r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Submission Deadline: {r.deadline} · Top {r.promotionTopN} promoted {r.isFinal && '· Final Round'}</p>
                      </div>
                      {r.isFinal && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Final</span>}
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'criteria' && (
                <div>
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-200">
                      {['Criterion', 'Description', 'Max Score', 'Weight (%)'].map(c => (
                        <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {[['Technical Quality', 'Code quality, architecture, performance, scalability', '10', '40%'], ['Innovation', 'Originality, creative use of technology, novelty of approach', '10', '25%'], ['UI/UX Design', 'Interface usability, visual design, user experience quality', '10', '20%'], ['Presentation', 'Demo clarity, Q&A responses, communication', '10', '15%']].map(([name, desc, max, weight]) => (
                        <tr key={name} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{name}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600">{desc}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-700">{max}</td>
                          <td className="px-3 py-2.5"><span className="text-sm font-mono font-bold text-blue-700">{weight}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={3} className="px-3 py-2 text-sm font-bold text-slate-900">Total Weight</td>
                      <td className="px-3 py-2"><span className="text-sm font-mono font-bold text-emerald-700">100%</span></td>
                    </tr></tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showApprove && (
        <Modal title="Approve Event" subtitle={selectedEvent?.name} onClose={() => setShowApprove(false)} size="sm"
          footer={<><button onClick={() => setShowApprove(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button onClick={() => setShowApprove(false)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">Confirm Approval</button></>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">You are about to <strong>approve</strong> this event. The Event Coordinator will be notified and may proceed to open registration.</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-emerald-800">✓ Budget of 45,000,000 VND will be authorized</p>
              <p className="text-sm text-emerald-700 mt-1">2 rounds and 3 categories confirmed</p>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Approval Notes (optional)</label>
              <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600" rows={3} placeholder="Add any conditions or notes for the coordinator…" /></div>
          </div>
        </Modal>
      )}
      {showReject && (
        <Modal title="Reject Event" subtitle={selectedEvent?.name} onClose={() => setShowReject(false)} size="sm"
          footer={<><button onClick={() => setShowReject(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button disabled={!rejectReason.trim()} onClick={() => setShowReject(false)} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Reject Event</button></>}>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">The coordinator will be notified with your rejection reason and may revise and resubmit the event.</p></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={4} placeholder="Provide a clear, actionable reason so the coordinator can revise and resubmit…" /></div>
            {!rejectReason.trim() && <p className="text-xs text-red-500">Rejection reason is required.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SCAnalytics() {
  return (
    <div className="p-7 space-y-6">
      <div className="flex items-start justify-between mb-4">
        <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Cross-Event Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Program-level trends and performance across all terms</p></div>
        <div className="flex items-center gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>All Disciplines</option><option>Software Engineering</option><option>Artificial Intelligence</option></select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>2023–2026</option><option>2025–2026</option></select>
          <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Registration vs Completion by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="registered" stroke="#1e3a8a" fill="#dbeafe" name="Registered" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#0891b2" fill="#cffafe" name="Completed" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#1e3a8a" name="Teams" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Event & Participation Trend by Term</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={eventTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="events" stroke="#1e3a8a" strokeWidth={2} name="Events" dot={{ fill: '#1e3a8a', r: 4 }} />
            <Line yAxisId="left" type="monotone" dataKey="teams" stroke="#0891b2" strokeWidth={2} name="Teams" dot={{ fill: '#0891b2', r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" name="Avg Score" dot={{ fill: '#059669', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Disciplines() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Discipline Management" subtitle="Academic disciplines available for hackathon events" />
      <div className="grid grid-cols-2 gap-5">
        {disciplines.map(d => (
          <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-sm font-mono">{d.code}</span>
                </div>
                <div><p className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{d.name}</p><StatusBadge status={d.status} /></div>
              </div>
              <button className="text-xs text-blue-700 hover:text-blue-800 font-medium border border-blue-200 px-2.5 py-1 rounded-lg">Edit</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.activeEvents}</p><p className="text-xs text-slate-500">Active Events</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.completedEvents}</p><p className="text-xs text-slate-500">Completed</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.totalTeams}</p><p className="text-xs text-slate-500">Total Teams</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TermQuotas() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Term Quota Management" subtitle="Maximum events per discipline per academic term" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Term', 'Year', 'Discipline', 'Max Events', 'Used', 'Remaining', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {termQuotas.map(q => (
              <tr key={q.id} className={`hover:bg-slate-50 transition-colors ${q.status === 'warn' ? 'bg-amber-50/50' : ''}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{q.term}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.year}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{q.discipline}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.maxEvents}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.usedEvents}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full"><div className={`h-2 rounded-full ${q.usedEvents >= q.maxEvents ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(q.usedEvents / q.maxEvents) * 100}%` }} /></div>
                    <span className="text-sm font-mono text-slate-700">{q.maxEvents - q.usedEvents}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {q.status === 'warn' ? <span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Quota Full</span> : <span className="text-xs text-emerald-700 flex items-center gap-1">● Available</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
