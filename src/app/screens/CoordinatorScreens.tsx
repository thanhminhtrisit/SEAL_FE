import React, { useState } from 'react';
import { Calendar, Plus, ChevronRight, CheckCircle2, Clock, AlertTriangle, Users, Send, Lock, Trophy, Globe, FileBarChart, Eye, Edit2, UserCheck, UserX, Search, Download, Check, BarChart2 } from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const sampleEvent = {
  id: 1, name: 'SEAL Software Engineering Hackathon Summer 2026', type: 'SUMMER',
  discipline: 'Software Engineering', term: 'Summer 2026', status: 'IN_PROGRESS',
  registrationOpen: '2026-06-20', registrationClose: '2026-06-30',
  eventStart: '2026-07-15', eventEnd: '2026-08-10',
  teamsRegistered: 24, maxTeams: 40,
  rounds: [
    { id: 1, name: 'Preliminary Round', status: 'SCORING_OPEN', deadline: '2026-07-25', promotionTopN: 6 },
    { id: 2, name: 'Final Round', status: 'DRAFT', deadline: '2026-08-08', promotionTopN: 3 },
  ],
  categories: ['Web Application', 'Mobile Application', 'AI/Automation Tool'],
};

const lifecycleSteps = [
  { label: 'Draft', status: 'done', date: '2026-06-05' },
  { label: 'Pending Approval', status: 'done', date: '2026-06-10' },
  { label: 'Approved', status: 'done', date: '2026-06-12' },
  { label: 'Open', status: 'done', date: '2026-06-20' },
  { label: 'In Progress', status: 'current', date: '2026-07-15' },
  { label: 'Completed', status: 'future', date: '—' },
  { label: 'Archived', status: 'future', date: '—' },
];

const myEvents = [
  { id: 1, name: 'SEAL Software Engineering Hackathon Summer 2026', status: 'IN_PROGRESS', teams: 24, term: 'Summer 2026', createdDate: '2026-06-05' },
  { id: 2, name: 'SE Mini Challenge Spring 2026', status: 'COMPLETED', teams: 18, term: 'Spring 2026', createdDate: '2026-02-10' },
  { id: 3, name: 'SE Ideathon Fall 2025', status: 'ARCHIVED', teams: 22, term: 'Fall 2025', createdDate: '2025-09-01' },
];

const pendingParticipants = [
  { id: 1, name: 'Nguyen Thanh Phong', email: 'phong.nt@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171234', appliedDate: '2026-06-21' },
  { id: 2, name: 'Do Thi Quynh', email: 'quynh.dt@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171390', appliedDate: '2026-06-21' },
  { id: 3, name: 'Tran Van Minh', email: 'minh.tv@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171511', appliedDate: '2026-06-21' },
  { id: 4, name: 'Pham Anh Tuan', email: 'tuan.pa@hcmut.edu.vn', type: 'External', studentId: '2212345 (HCMUT)', appliedDate: '2026-06-22' },
  { id: 5, name: 'Le Hoang Nam', email: 'nam.lh@uit.edu.vn', type: 'External', studentId: '21521234 (UIT)', appliedDate: '2026-06-22' },
  { id: 6, name: 'Nguyen Bich Thao', email: 'thao.nb@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171678', appliedDate: '2026-06-22' },
  { id: 7, name: 'Vo Thi Kim', email: 'kim.vt@ute.edu.vn', type: 'External', studentId: '19110234 (UTE)', appliedDate: '2026-06-23' },
];

const teams = [
  { id: 1, name: 'Code Seals', category: 'Web Application', leader: 'Nguyen Thanh Phong', members: 4, status: 'APPROVED', registered: '2026-06-22' },
  { id: 2, name: 'AlphaBot', category: 'AI/Automation Tool', leader: 'Le Hoang Nam', members: 3, status: 'APPROVED', registered: '2026-06-22' },
  { id: 3, name: 'MobileFirst', category: 'Mobile Application', leader: 'Tran Van Minh', members: 5, status: 'APPROVED', registered: '2026-06-23' },
  { id: 4, name: 'NexGen', category: 'Web Application', leader: 'Pham Anh Tuan', members: 4, status: 'PENDING', registered: '2026-06-23' },
  { id: 5, name: 'DataFlow', category: 'AI/Automation Tool', leader: 'Nguyen Bich Thao', members: 3, status: 'PENDING', registered: '2026-06-24' },
];

const judges = [
  { id: 1, name: 'Pham Duc Dat', email: 'dat.pd@fpt.edu.vn', type: 'INTERNAL', round: 'Preliminary Round', category: 'All', scored: 4, total: 7 },
  { id: 2, name: 'Vu Minh Phuong', email: 'phuong.vm@fpt.edu.vn', type: 'INTERNAL', round: 'Preliminary Round', category: 'All', scored: 3, total: 7 },
  { id: 3, name: 'Dr. Sarah Chen', email: 'schen@industry.com', type: 'GUEST', round: 'Final Round', category: 'All', scored: 0, total: 6 },
  { id: 4, name: 'Dr. James Park', email: 'jpark@techcorp.com', type: 'GUEST', round: 'Final Round', category: 'All', scored: 0, total: 6 },
];

const submissions = [
  { id: 1, team: 'Code Seals', round: 'Preliminary', category: 'Web Application', repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: 'drive.google.com/...', submittedAt: '2026-07-22 14:30', status: 'SUBMITTED', version: 3 },
  { id: 2, team: 'AlphaBot', round: 'Preliminary', category: 'AI/Automation Tool', repoUrl: 'github.com/alphabot/ai-tool', demoUrl: 'alphabot-demo.netlify.app', slideUrl: null, submittedAt: '2026-07-23 10:15', status: 'SUBMITTED', version: 1 },
  { id: 3, team: 'MobileFirst', round: 'Preliminary', category: 'Mobile Application', repoUrl: 'github.com/mobilefirst/app', demoUrl: null, slideUrl: 'drive.google.com/...', submittedAt: '2026-07-24 16:45', status: 'SUBMITTED', version: 2 },
  { id: 4, team: 'NexGen', round: 'Preliminary', category: 'Web Application', repoUrl: 'github.com/nexgen/webapp', demoUrl: 'nexgen-webapp.vercel.app', slideUrl: null, submittedAt: '2026-07-24 20:10', status: 'SUBMITTED', version: 1 },
  { id: 5, team: 'DataFlow', round: 'Preliminary', category: 'AI/Automation Tool', repoUrl: '', demoUrl: '', slideUrl: '', submittedAt: '—', status: 'NOT_SUBMITTED', version: 0 },
];

export function CoordDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Coordinator Dashboard" subtitle="Manage your events, teams, scoring, and results" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Events" value="3" subtitle="Summer 2026" icon={Calendar} accent="blue" />
        <KPICard title="Pending Participants" value="7" subtitle="Awaiting approval" icon={UserCheck} accent="amber" />
        <KPICard title="Scoring Open" value="1" subtitle="Preliminary Round" icon={Lock} accent="cyan" />
        <KPICard title="Results to Publish" value="0" subtitle="Final Round pending" icon={Globe} accent="purple" />
      </div>

      {/* Active Event Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1"><StatusBadge status="IN_PROGRESS" /><span className="text-xs text-slate-400">SUMMER 2026</span></div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{sampleEvent.name}</h2>
          </div>
          <button onClick={() => onNavigate('coord-events')} className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">View All Events <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>

        {/* Lifecycle Timeline */}
        <div className="flex items-center gap-0 mb-5">
          {lifecycleSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step.status === 'done' ? 'bg-emerald-500 border-emerald-500' : step.status === 'current' ? 'bg-blue-800 border-blue-800' : 'bg-white border-slate-300'}`}>
                  {step.status === 'done' ? <Check className="w-3.5 h-3.5 text-white" /> : step.status === 'current' ? <span className="w-2 h-2 bg-white rounded-full" /> : <span className="w-2 h-2 bg-slate-300 rounded-full" />}
                </div>
                <p className={`text-[10px] mt-1.5 text-center w-14 ${step.status === 'current' ? 'text-blue-800 font-semibold' : step.status === 'done' ? 'text-emerald-700' : 'text-slate-400'}`}>{step.label}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{step.date}</p>
              </div>
              {i < lifecycleSteps.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 mb-5 ${step.status === 'done' ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Teams Registered', value: '24 / 40', action: () => onNavigate('coord-teams') },
            { label: 'Pending Participants', value: '7', action: () => onNavigate('coord-participants') },
            { label: 'Submissions (Prelim)', value: '4 / 5 teams', action: () => onNavigate('coord-submissions') },
            { label: 'Scores Completed', value: '7 / 14', action: () => onNavigate('coord-scoring') },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="text-left p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Rounds</h3>
          {sampleEvent.rounds.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div><p className="text-sm font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">Deadline: {r.deadline}</p></div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Approve Participants', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', screen: 'coord-participants' },
              { label: 'Monitor Submissions', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', screen: 'coord-submissions' },
              { label: 'Scoring Control', icon: Lock, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', screen: 'coord-scoring' },
              { label: 'View Rankings', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100', screen: 'coord-ranking' },
            ].map(a => (
              <button key={a.label} onClick={() => onNavigate(a.screen)} className={`${a.bg} ${a.color} p-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}>
                <a.icon className="w-4 h-4" />{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventList({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="My Events" subtitle="All events you coordinate" actions={
        <button onClick={() => onNavigate('coord-create')} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /> Create Event</button>
      } />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Event Name', 'Term', 'Teams', 'Status', 'Created', 'Actions'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {myEvents.map(ev => (
              <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900">{ev.name}</p></td>
                <td className="px-4 py-3 text-sm text-slate-600">{ev.term}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{ev.teams}</td>
                <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{ev.createdDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WIZARD_STEPS = ['Basic Info', 'Rounds', 'Categories', 'Criteria', 'Budget', 'Review & Submit'];

const initialCriteria = [
  { name: 'Technical Quality', description: 'Code quality, architecture, performance, scalability', maxScore: 10, weight: 40, order: 1, active: true },
  { name: 'Innovation', description: 'Originality, creative use of technology, novelty of approach', maxScore: 10, weight: 25, order: 2, active: true },
  { name: 'UI/UX Design', description: 'Interface usability, visual design, user experience quality', maxScore: 10, weight: 20, order: 3, active: true },
  { name: 'Presentation', description: 'Demo clarity, Q&A responses, communication', maxScore: 10, weight: 15, order: 4, active: true },
];

const initialBudget = [
  { category: 'Prize', description: 'First Place Prize', qty: 1, unitCost: 15000000, amount: 15000000 },
  { category: 'Prize', description: 'Second Place Prize', qty: 1, unitCost: 10000000, amount: 10000000 },
  { category: 'Prize', description: 'Third Place Prize', qty: 1, unitCost: 5000000, amount: 5000000 },
  { category: 'Catering', description: 'Event Day Meals & Drinks', qty: 1, unitCost: 8000000, amount: 8000000 },
  { category: 'Honorarium', description: 'Guest Judge Honorarium', qty: 2, unitCost: 2000000, amount: 4000000 },
  { category: 'Marketing', description: 'Posters & Online Promotion', qty: 1, unitCost: 3000000, amount: 3000000 },
];

export function CreateEventWizard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState(initialCriteria);
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const totalBudget = initialBudget.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-7">
      <PageHeader title="Create New Event" subtitle="Step-by-step event configuration wizard" />

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        {WIZARD_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <button onClick={() => setStep(i)} className="flex flex-col items-center flex-1 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <p className={`text-[11px] mt-1.5 font-medium transition-colors ${i === step ? 'text-blue-800' : i < step ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</p>
            </button>
            {i < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mt-0 mb-5 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Step {step + 1}: {WIZARD_STEPS[step]}</h2>
        </div>
        <div className="p-6">
          {step === 0 && (
            <div className="max-w-xl space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Name <span className="text-red-500">*</span></label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue="SEAL Software Engineering Hackathon Summer 2026" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>SUMMER</option><option>SPRING</option><option>FALL</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Discipline</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>Software Engineering</option><option>Artificial Intelligence</option><option>IoT & Embedded Systems</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Term Plan</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>Summer 2026</option><option>Fall 2026</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700" rows={3} defaultValue="A multi-round software engineering hackathon for FPT University HCMC students." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Registration Opens</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue="2026-06-20" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Registration Closes</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue="2026-06-30" /></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-end"><button className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800"><Plus className="w-4 h-4" /> Add Round</button></div>
              {[{ name: 'Preliminary Round', order: 1, deadline: '2026-07-25', promotionTopN: 6, isFinal: false }, { name: 'Final Round', order: 2, deadline: '2026-08-08', promotionTopN: 3, isFinal: true }].map((r, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">Round {r.order}</span>
                    {r.isFinal && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Final</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Round Name</label>
                      <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={r.name} /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Submission Deadline</label>
                      <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={r.deadline} /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Promote Top N Teams</label>
                      <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={r.promotionTopN} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-end"><button className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800"><Plus className="w-4 h-4" /> Add Category</button></div>
              {[{ name: 'Web Application', desc: 'Full-stack web apps', mentor: 'Hoang Thi Em' }, { name: 'Mobile Application', desc: 'iOS/Android mobile apps', mentor: 'Pham Duc Dat' }, { name: 'AI/Automation Tool', desc: 'ML, AI-powered tools', mentor: 'Hoang Thi Em' }].map((cat, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Category Name</label>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={cat.name} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={cat.desc} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Assigned Mentor</label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>{cat.mentor}</option><option>Pham Duc Dat</option></select></div>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Scoring criteria and weights for all judging. Total weight must equal 100%.</p>
                <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1 rounded-lg ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {totalWeight === 100 ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  Total: {totalWeight}%
                </div>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-slate-200">{['Criterion', 'Description', 'Max Score', 'Weight (%)', 'Active'].map(c => <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {criteria.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5"><input className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700" value={c.name} onChange={e => { const copy = [...criteria]; copy[i].name = e.target.value; setCriteria(copy); }} /></td>
                      <td className="px-3 py-2.5"><input className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700" value={c.description} onChange={() => {}} /></td>
                      <td className="px-3 py-2.5"><input type="number" min={1} max={100} className="w-16 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" value={c.maxScore} onChange={() => {}} /></td>
                      <td className="px-3 py-2.5"><input type="number" min={0} max={100} className="w-16 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" value={c.weight} onChange={e => { const copy = [...criteria]; copy[i].weight = Number(e.target.value); setCriteria(copy); }} /></td>
                      <td className="px-3 py-2.5"><div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${c.active ? 'bg-blue-700' : 'bg-slate-300'}`} onClick={() => { const copy = [...criteria]; copy[i].active = !copy[i].active; setCriteria(copy); }}><div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform shadow ${c.active ? 'translate-x-5' : 'translate-x-0'}`} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalWeight !== 100 && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2"><AlertTriangle className="w-4 h-4 text-red-600" /><p className="text-sm text-red-700">Total weight is {totalWeight}%. Must equal exactly 100%.</p></div>}
            </div>
          )}
          {step === 4 && (
            <div>
              <table className="w-full mb-3">
                <thead><tr className="border-b border-slate-200">{['Category', 'Description', 'Qty', 'Unit Cost (VND)', 'Amount (VND)'].map(c => <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {initialBudget.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2"><select className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700"><option>{item.category}</option></select></td>
                      <td className="px-3 py-2"><input className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700" defaultValue={item.description} /></td>
                      <td className="px-3 py-2"><input type="number" className="w-14 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" defaultValue={item.qty} /></td>
                      <td className="px-3 py-2"><input type="number" className="w-28 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" defaultValue={item.unitCost} /></td>
                      <td className="px-3 py-2 text-sm font-mono font-semibold text-slate-900 text-right">{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50"><td colSpan={4} className="px-3 py-2 text-sm font-bold">Total Estimated</td><td className="px-3 py-2 text-sm font-bold text-blue-800 font-mono text-right">{totalBudget.toLocaleString()}</td></tr></tfoot>
              </table>
              <button className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800"><Plus className="w-4 h-4" /> Add Budget Item</button>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-5 max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Review Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['Event Name', 'SEAL SE Hackathon Summer 2026'], ['Type', 'SUMMER'], ['Discipline', 'Software Engineering'], ['Term', 'Summer 2026'], ['Rounds', '2 (Preliminary + Final)'], ['Categories', '3'], ['Criteria', '4 criteria (total weight 100%)'], ['Total Budget', '45,000,000 VND']].map(([k, v]) => (
                    <div key={k}><span className="text-blue-600 font-medium">{k}:</span><span className="text-blue-900 ml-2">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div><p className="text-sm font-semibold text-amber-800">Submitting for Approval</p><p className="text-sm text-amber-700 mt-1">This event will be sent to the Super Coordinator for review. You cannot edit the event while it is under review.</p></div>
              </div>
              <button className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Submit Event for Approval</button>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">← Previous</button>
          <span className="text-xs text-slate-400">Step {step + 1} of {WIZARD_STEPS.length}</span>
          <button onClick={() => setStep(Math.min(WIZARD_STEPS.length - 1, step + 1))} disabled={step === WIZARD_STEPS.length - 1} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-40 transition-colors">Next →</button>
        </div>
      </div>
    </div>
  );
}

export function ParticipantApproval() {
  const [selected, setSelected] = useState<number[]>([]);
  const [showReject, setShowReject] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Participant Approval" subtitle={`${pendingParticipants.length} accounts pending approval for SEAL Hackathon Summer 2026`}
        actions={<>
          {selected.length > 0 && <><button onClick={() => setSelected([])} className="text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50">Clear ({selected.length})</button>
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><UserCheck className="w-4 h-4" /> Approve Selected</button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><UserX className="w-4 h-4" /> Reject Selected</button></>}
        </>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input placeholder="Search participants…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-700" /></div>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>All Types</option><option>FPT Student</option><option>External</option></select>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-slate-300" onChange={e => setSelected(e.target.checked ? pendingParticipants.map(p => p.id) : [])} /></th>
            {['Name & Email', 'Type', 'Student ID', 'Applied', 'Actions'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {pendingParticipants.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selected.includes(p.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} /></td>
                <td className="px-4 py-3"><p className="text-sm font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-400 font-mono">{p.email}</p></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'FPT Student' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.type}</span></td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{p.studentId}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.appliedDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><UserCheck className="w-3 h-3" /> Approve</button>
                    <button onClick={() => setShowReject(true)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><UserX className="w-3 h-3" /> Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showReject && (
        <Modal title="Reject Participant" onClose={() => setShowReject(false)} size="sm"
          footer={<><button onClick={() => setShowReject(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">Confirm Rejection</button></>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">The participant will be notified of the rejection with your reason.</p>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="E.g., Student ID not found in FPT enrollment records" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SubmissionMonitor() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Submission Monitoring" subtitle="Preliminary Round — SEAL Hackathon Summer 2026" actions={<button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>} />
      <div className="grid grid-cols-3 gap-4 mb-2">
        <KPICard title="Submitted" value="4" subtitle="of 5 teams" icon={Send} accent="green" />
        <KPICard title="Not Submitted" value="1" subtitle="DataFlow pending" icon={AlertTriangle} accent="amber" />
        <KPICard title="Deadline" value="2026-07-25" subtitle="1 day remaining" icon={Clock} accent="red" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Team', 'Category', 'Repository URL', 'Demo URL', 'Slides', 'Submitted At', 'Version', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${s.status === 'NOT_SUBMITTED' ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.team}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{s.category}</td>
                <td className="px-4 py-3">
                  {s.repoUrl ? <a href="#" className="text-xs text-blue-600 hover:underline font-mono">{s.repoUrl}</a> : <span className="text-xs text-red-500">Missing (required)</span>}
                </td>
                <td className="px-4 py-3">
                  {s.demoUrl ? <a href="#" className="text-xs text-cyan-600 hover:underline font-mono">{s.demoUrl}</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {s.slideUrl ? <a href="#" className="text-xs text-purple-600 hover:underline">View</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.submittedAt}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600">v{s.version || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status === 'SUBMITTED' ? 'SUBMITTED' : 'PENDING'} label={s.status === 'SUBMITTED' ? 'Submitted' : 'Not Submitted'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function JudgeAssignment() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Judge Assignment" subtitle="Assign internal and guest judges to rounds"
        actions={<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /> Add Guest Judge</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Judge', 'Email', 'Type', 'Assigned Round', 'Progress', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {judges.map(j => (
              <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">{j.name.split(' ').slice(-2).map(n => n[0]).join('')}</div>
                    <span className="text-sm font-medium text-slate-900">{j.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{j.email}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.type === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{j.type}</span></td>
                <td className="px-4 py-3 text-sm text-slate-700">{j.round}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full"><div className="h-2 bg-blue-600 rounded-full" style={{ width: `${(j.scored / j.total) * 100}%` }} /></div>
                    <span className="text-xs font-mono text-slate-600">{j.scored}/{j.total}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={j.scored === j.total ? 'COMPLETED' : 'IN_PROGRESS'} label={j.scored === j.total ? 'Complete' : 'Scoring'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <Modal title="Create Guest Judge Account" onClose={() => setShowCreate(false)} size="md"
          footer={<><button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900">Create & Send Invite</button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Dr. Jane Smith" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="jane@company.com" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Organization</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Tech Corp Ltd." /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign to Round</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>Final Round</option><option>Preliminary Round</option></select></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-xs text-blue-700">A temporary password will be emailed. Guest judges can only access their assigned rounds.</p></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function TeamManagement() {
  const [showDisqualify, setShowDisqualify] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Team Registration" subtitle={`${teams.length} teams registered — SEAL Hackathon Summer 2026`} />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Team Name', 'Category', 'Leader', 'Members', 'Registered', 'Status', 'Actions'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{t.category}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{t.leader}</td>
                <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${t.members >= 3 && t.members <= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{t.members} / 5</span></td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{t.registered}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded"><Eye className="w-3.5 h-3.5" /></button>
                    {t.status === 'APPROVED' && <button onClick={() => setShowDisqualify(true)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded font-medium">Disqualify</button>}
                    {t.status === 'PENDING' && <><button className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded font-medium">Approve</button><button className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded font-medium ml-1">Reject</button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDisqualify && (
        <Modal title="Disqualify Team" subtitle="Code Seals — Web Application" onClose={() => setShowDisqualify(false)} size="sm"
          footer={<><button onClick={() => setShowDisqualify(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">Disqualify Team</button></>}>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">Disqualification is reversible by reinstating the team. The team will be notified with your reason.</p></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason <span className="text-red-500">*</span></label><textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="E.g., Submission contains plagiarized code detected by system check" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
