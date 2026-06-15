import React, { useState } from 'react';
import { Users, Shield, Lock, Activity, AlertTriangle, Server, Database, Clock, CheckCircle2, Plus, Search, Download, Eye, Edit2, UserX, Key } from 'lucide-react';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';

const staffData = [
  { id: 1, name: 'Tran Thi Bich', email: 'bich.tt@fpt.edu.vn', role: 'SUPER_COORDINATOR', type: 'Faculty', status: 'ACTIVE', lastLogin: '2026-06-13 09:21', phone: '0901 111 222' },
  { id: 2, name: 'Le Minh Cuong', email: 'cuong.lm@fpt.edu.vn', role: 'EVENT_COORDINATOR', type: 'Faculty', status: 'ACTIVE', lastLogin: '2026-06-13 08:45', phone: '0901 333 444' },
  { id: 3, name: 'Pham Duc Dat', email: 'dat.pd@fpt.edu.vn', role: 'INTERNAL_JUDGE', type: 'Faculty', status: 'ACTIVE', lastLogin: '2026-06-12 16:30', phone: '0901 555 666' },
  { id: 4, name: 'Hoang Thi Em', email: 'em.ht@fpt.edu.vn', role: 'MENTOR', type: 'Faculty', status: 'ACTIVE', lastLogin: '2026-06-12 14:10', phone: '0901 777 888' },
  { id: 5, name: 'Vu Minh Phuong', email: 'phuong.vm@fpt.edu.vn', role: 'INTERNAL_JUDGE', type: 'Faculty', status: 'ACTIVE', lastLogin: '2026-06-11 11:05', phone: '0902 111 222' },
  { id: 6, name: 'Dr. Sarah Chen', email: 'schen@industry.com', role: 'GUEST_JUDGE', type: 'External', status: 'ACTIVE', lastLogin: '2026-06-10 09:30', phone: '+1 415 555 0123' },
  { id: 7, name: 'Nguyen Van Hoa', email: 'hoa.nv@fpt.edu.vn', role: 'EVENT_COORDINATOR', type: 'Faculty', status: 'INACTIVE', lastLogin: '2026-05-28 17:00', phone: '0903 111 222' },
  { id: 8, name: 'Dr. James Park', email: 'jpark@techcorp.com', role: 'GUEST_JUDGE', type: 'External', status: 'INACTIVE', lastLogin: '2026-04-15 14:20', phone: '+82 10 1234 5678' },
];

const auditLogs = [
  { id: 1, actor: 'Le Minh Cuong', action: 'EVENT_CREATED', target: 'SEAL Hackathon Summer 2026', time: '2026-06-13 09:15', ip: '192.168.1.45', severity: 'info' },
  { id: 2, actor: 'Tran Thi Bich', action: 'EVENT_APPROVED', target: 'SEAL Hackathon Summer 2026', time: '2026-06-12 16:30', ip: '192.168.1.23', severity: 'success' },
  { id: 3, actor: 'Le Minh Cuong', action: 'PARTICIPANT_APPROVED', target: 'Nguyen Thanh Phong', time: '2026-06-12 10:05', ip: '192.168.1.45', severity: 'info' },
  { id: 4, actor: 'Le Minh Cuong', action: 'SCORING_OPENED', target: 'Preliminary Round', time: '2026-06-11 09:00', ip: '192.168.1.45', severity: 'info' },
  { id: 5, actor: 'Nguyen Van An', action: 'STAFF_CREATED', target: 'Dr. Sarah Chen', time: '2026-06-10 14:30', ip: '192.168.1.10', severity: 'warning' },
  { id: 6, actor: 'Nguyen Van An', action: 'ACCOUNT_LOCKED', target: 'Nguyen Van Hoa', time: '2026-06-09 11:00', ip: '192.168.1.10', severity: 'warning' },
  { id: 7, actor: 'System', action: 'BACKUP_COMPLETED', target: 'Full DB Snapshot', time: '2026-06-09 02:00', ip: 'system', severity: 'success' },
  { id: 8, actor: 'Le Minh Cuong', action: 'TEAM_DISQUALIFIED', target: 'Team AlphaBot', time: '2026-06-08 15:20', ip: '192.168.1.45', severity: 'danger' },
];

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

export function AdminDashboard() {
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Admin Dashboard" subtitle="Platform health and account overview" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="Total Users" value="47" subtitle="Staff + Participants" icon={Users} accent="blue" trend={{ value: 8, label: 'this month' }} />
        <KPICard title="Active Staff" value="12" subtitle="Faculty + Guest Judges" icon={Shield} accent="green" />
        <KPICard title="Locked Accounts" value="2" subtitle="Require review" icon={Lock} accent="amber" />
        <KPICard title="Audit Events (24h)" value="23" subtitle="All actions logged" icon={Activity} accent="cyan" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Recent Audit Events</h3>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.severity === 'success' ? 'bg-emerald-500' : log.severity === 'warning' ? 'bg-amber-500' : log.severity === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{log.actor}</span> · <span className="font-mono text-xs text-slate-500">{log.action}</span>
                  </p>
                  <p className="text-xs text-slate-500 truncate">Target: {log.target}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{log.time.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>System Health</h3>
            <div className="space-y-3">
              {[
                { label: 'API Uptime', value: '99.97%', color: 'bg-emerald-500', pct: 100 },
                { label: 'DB Response', value: '12 ms', color: 'bg-blue-500', pct: 95 },
                { label: 'Auth Service', value: 'Healthy', color: 'bg-emerald-500', pct: 100 },
                { label: 'Storage', value: '34% used', color: 'bg-amber-500', pct: 34 },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{s.label}</span><span className="font-mono">{s.value}</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full"><div className={`h-1.5 rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">2 Locked Accounts</p>
                <p className="text-xs text-amber-600 mt-0.5">Nguyen Van Hoa and Dr. James Park require review</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffManagement() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = staffData.filter(s =>
    (roleFilter === 'ALL' || s.role === roleFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Staff Account Management"
        subtitle={`${staffData.length} staff accounts across all roles`}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Create Staff Account
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-700" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
            <option value="ALL">All Roles</option>
            <option value="SUPER_COORDINATOR">Super Coordinator</option>
            <option value="EVENT_COORDINATOR">Event Coordinator</option>
            <option value="INTERNAL_JUDGE">Internal Judge</option>
            <option value="GUEST_JUDGE">Guest Judge</option>
            <option value="MENTOR">Mentor</option>
          </select>
          <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Name', 'Email', 'Role', 'Type', 'Status', 'Last Login', 'Actions'].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(staff => (
              <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                      {staff.name.split(' ').map(n => n[0]).slice(-2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{staff.name}</p>
                      <p className="text-xs text-slate-400">{staff.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{staff.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">{staff.role.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{staff.type}</td>
                <td className="px-4 py-3"><StatusBadge status={staff.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-500 font-mono">{staff.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"><Key className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filtered.length} of {staffData.length} staff</span>
        </div>
      </div>

      {showCreate && (
        <Modal title="Create Staff Account" subtitle="New platform staff member" onClose={() => setShowCreate(false)} size="md"
          footer={
            <>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900">Create Account</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Nguyen Van X" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="090x xxx xxx" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="name@fpt.edu.vn" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign Role</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                <option>Super Coordinator</option>
                <option>Event Coordinator</option>
                <option>Internal Judge</option>
                <option>Mentor</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                <option>Faculty</option>
                <option>External</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="tempPwd" className="rounded border-slate-300" defaultChecked />
              <label htmlFor="tempPwd" className="text-sm text-slate-700">Send temporary password via email</label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AuditLog() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const severityColors = { info: 'bg-blue-100 text-blue-700', success: 'bg-emerald-100 text-emerald-700', warning: 'bg-amber-100 text-amber-700', danger: 'bg-red-100 text-red-700' };

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Global Audit Log" subtitle="Append-only, immutable record of all platform actions"
        actions={<button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export Log</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by actor or target…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-700" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
            <option value="ALL">All Action Types</option>
            <option value="EVENT">Event Actions</option>
            <option value="ACCOUNT">Account Actions</option>
            <option value="SYSTEM">System Actions</option>
          </select>
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue="2026-06-01" />
          <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue="2026-06-13" />
        </div>
        <div className="divide-y divide-slate-100">
          {auditLogs.map((log, i) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500 mt-0.5">
                #{auditLogs.length - i}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-900">{log.actor}</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${severityColors[log.severity as keyof typeof severityColors]}`}>{log.action}</span>
                </div>
                <p className="text-sm text-slate-500">Target: <span className="text-slate-700">{log.target}</span></p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono text-slate-500">{log.time}</p>
                <p className="text-xs text-slate-400">IP: {log.ip}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <p className="text-xs text-slate-400 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Audit logs are append-only and cannot be modified or deleted.</p>
        </div>
      </div>
    </div>
  );
}

export function SystemConfig() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="System Configuration" subtitle="Platform-wide settings and policies" />
      <div className="grid grid-cols-2 gap-5">
        {[
          {
            title: 'Authentication & Security', icon: Lock, items: [
              { label: 'JWT Token Expiry', value: '24 hours', type: 'select', opts: ['1 hour', '8 hours', '24 hours', '7 days'] },
              { label: 'Max Failed Login Attempts', value: '5', type: 'number' },
              { label: 'Account Lockout Duration', value: '30 minutes', type: 'select', opts: ['15 minutes', '30 minutes', '1 hour', '24 hours'] },
              { label: 'Require 2FA for Staff', value: true, type: 'toggle' },
            ]
          },
          {
            title: 'Password Policy', icon: Key, items: [
              { label: 'Minimum Password Length', value: '8', type: 'number' },
              { label: 'Require Uppercase', value: true, type: 'toggle' },
              { label: 'Require Numbers', value: true, type: 'toggle' },
              { label: 'Require Special Characters', value: false, type: 'toggle' },
              { label: 'Password Expiry (days)', value: '90', type: 'number' },
            ]
          },
          {
            title: 'Email Provider', icon: Server, items: [
              { label: 'SMTP Host', value: 'smtp.gmail.com', type: 'text' },
              { label: 'SMTP Port', value: '587', type: 'number' },
              { label: 'Sender Email', value: 'noreply@seal.fpt.edu.vn', type: 'text' },
              { label: 'Enable Email Notifications', value: true, type: 'toggle' },
            ]
          },
          {
            title: 'Backup Schedule', icon: Database, items: [
              { label: 'Full Backup Frequency', value: 'Daily at 02:00', type: 'text' },
              { label: 'Incremental Backup', value: 'Every 6 hours', type: 'text' },
              { label: 'Retention Period', value: '30 days', type: 'text' },
              { label: 'Enable Cloud Backup', value: true, type: 'toggle' },
            ]
          },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <section.icon className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <label className="text-sm text-slate-700">{item.label}</label>
                  {item.type === 'toggle' ? (
                    <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${item.value ? 'bg-blue-700' : 'bg-slate-300'} flex items-center px-0.5`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{String(item.value)}</span>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-sm text-blue-700 font-medium hover:text-blue-800 transition-colors">Edit Section</button>
          </div>
        ))}
      </div>
    </div>
  );
}
