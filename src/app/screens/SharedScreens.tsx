import React, { useState } from 'react';
import { User, Mail, Phone, Building2, GraduationCap, Edit2, Save, Shield, AlertTriangle, Bell, CheckCircle2, Info, Lock } from 'lucide-react';

export function ProfilePage({ currentRole }: { currentRole: string }) {
  const [editing, setEditing] = useState(false);

  const isParticipant = currentRole === 'TEAM_LEADER' || currentRole === 'TEAM_MEMBER';
  const isStaff = !isParticipant && currentRole !== 'PUBLIC';

  const profiles: Record<string, { name: string; email: string; phone: string; affiliation: string; studentId?: string; university?: string; role: string; avatar: string }> = {
    ADMIN: { name: 'Nguyen Van An', email: 'an.nv@fpt.edu.vn', phone: '0901 000 001', affiliation: 'FPT University HCMC — IT Dept.', role: 'Platform Administrator', avatar: 'NA' },
    SUPER_COORDINATOR: { name: 'Tran Thi Bich', email: 'bich.tt@fpt.edu.vn', phone: '0901 111 222', affiliation: 'FPT University HCMC — SE Dept.', role: 'Super Coordinator', avatar: 'TB' },
    EVENT_COORDINATOR: { name: 'Le Minh Cuong', email: 'cuong.lm@fpt.edu.vn', phone: '0901 333 444', affiliation: 'FPT University HCMC — SE Dept.', role: 'Event Coordinator', avatar: 'LC' },
    INTERNAL_JUDGE: { name: 'Pham Duc Dat', email: 'dat.pd@fpt.edu.vn', phone: '0901 555 666', affiliation: 'FPT University HCMC — SE Dept.', role: 'Internal Judge', avatar: 'PD' },
    GUEST_JUDGE: { name: 'Dr. Sarah Chen', email: 'schen@industry.com', phone: '+1 415 555 0123', affiliation: 'TechCorp Inc.', role: 'Guest Judge', avatar: 'SC' },
    MENTOR: { name: 'Hoang Thi Em', email: 'em.ht@fpt.edu.vn', phone: '0901 777 888', affiliation: 'FPT University HCMC — SE Dept.', role: 'Mentor', avatar: 'HE' },
    TEAM_LEADER: { name: 'Nguyen Thanh Phong', email: 'phong.nt@student.fpt.edu.vn', phone: '0912 345 678', affiliation: 'FPT University HCMC', studentId: 'SE171234', role: 'Team Leader', avatar: 'NP' },
    TEAM_MEMBER: { name: 'Do Thi Quynh', email: 'quynh.dt@student.fpt.edu.vn', phone: '0923 456 789', affiliation: 'FPT University HCMC', studentId: 'SE171390', role: 'Team Member', avatar: 'DQ' },
    PUBLIC: { name: 'Guest', email: '', phone: '', affiliation: '', role: 'Guest', avatar: 'GU' },
  };

  const profile = profiles[currentRole] || profiles.PUBLIC;

  return (
    <div className="p-7 max-w-2xl">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and edit your personal information</p>
        </div>
        <button onClick={() => setEditing(!editing)} className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${editing ? 'bg-blue-800 text-white hover:bg-blue-900' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {editing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Avatar & Role */}
        <div className="flex items-center gap-5 pb-5 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {profile.avatar}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{profile.name}</h2>
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{profile.role}</span>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: 'Full Name', value: profile.name, icon: User, type: 'text' },
            { label: 'Email Address', value: profile.email, icon: Mail, type: 'email' },
            { label: 'Phone Number', value: profile.phone, icon: Phone, type: 'tel' },
            { label: 'Affiliation', value: profile.affiliation, icon: Building2, type: 'text' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><f.icon className="w-3.5 h-3.5 text-slate-400" />{f.label}</span>
              </label>
              {editing ? (
                <input type={f.type} defaultValue={f.value} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              ) : (
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{f.value || '—'}</p>
              )}
            </div>
          ))}
        </div>

        {/* Participant-specific fields */}
        {isParticipant && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" />Student ID</span>
              </label>
              {editing ? (
                <input defaultValue={profile.studentId} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" />
              ) : (
                <p className="text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{profile.studentId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label>
              <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">FPT Student</p>
            </div>
          </div>
        )}

        {/* Security Section */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />Security
          </h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Password</p>
              <p className="text-xs text-slate-500">Last changed 30 days ago</p>
            </div>
            <button className="text-sm text-blue-700 font-medium hover:text-blue-800">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccessDeniedPage({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Access Denied</h1>
        <p className="text-slate-500 leading-relaxed mb-6">
          You do not have the required permissions to view this page. If you believe this is an error, please contact the platform administrator or switch to a role that has access.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Access Restricted</p>
          <ul className="text-xs text-red-700 space-y-1 mt-2">
            <li>• Admins cannot approve events or score submissions</li>
            <li>• Super Coordinators cannot provision system roles or score</li>
            <li>• Coordinators cannot score or approve their own events</li>
            <li>• Judges can only access assigned rounds</li>
          </ul>
        </div>
        <button onClick={() => onNavigate('landing')} className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
