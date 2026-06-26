import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, GraduationCap, Shield, AlertTriangle, Lock, RefreshCw, Calendar, Clock } from 'lucide-react';
import { getMe, type MeResponse } from '../../api/auth';

function avatarInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtDateTime(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace('T', ' ').slice(0, 16);
}

export function ProfilePage({ currentRole }: { currentRole: string }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getMe()
      .then(setMe)
      .catch(err => setError(err instanceof Error ? err.message : 'Không tải được hồ sơ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-7 flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Đang tải hồ sơ…</span>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="p-7 flex flex-col items-center py-20 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{error ?? 'Không tải được hồ sơ'}</p>
        <button onClick={load} className="text-sm text-blue-700 underline">Thử lại</button>
      </div>
    );
  }

  const isParticipant = currentRole === 'TEAM_LEADER' || currentRole === 'TEAM_MEMBER';
  const hasStudentInfo = !!(me.studentId || me.university);

  return (
    <div className="p-7 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hồ sơ tài khoản từ hệ thống SEAL</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Avatar & Role */}
        <div className="flex items-center gap-5 pb-5 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
            {avatarInitials(me.fullName)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-display)' }}>{me.fullName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-mono">{me.roleCode}</span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{me.accountType}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${me.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {me.status}
              </span>
            </div>
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: 'Full Name', value: me.fullName, icon: User },
            { label: 'Email', value: me.email, icon: Mail },
            { label: 'Phone', value: me.phone ?? '—', icon: Phone },
            { label: 'Account Type', value: me.accountType, icon: Shield },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <f.icon className="w-3.5 h-3.5 text-slate-400" />{f.label}
                </span>
              </label>
              <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-lg break-all">{f.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Student fields (participant or any account with studentId/university) */}
        {(isParticipant || hasStudentInfo) && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-5">
            {me.studentId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />Student ID
                  </span>
                </label>
                <p className="text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{me.studentId}</p>
              </div>
            )}
            {me.university && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />University
                  </span>
                </label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{me.university}</p>
              </div>
            )}
            {me.isFptStudent != null && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">FPT Student</label>
                <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">
                  {me.isFptStudent ? 'Yes' : 'No (External)'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />Last Login</span>
            </label>
            <p className="text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{fmtDateTime(me.lastLoginAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Account Created</span>
            </label>
            <p className="text-sm font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{fmtDateTime(me.createdAt)}</p>
          </div>
        </div>

        {/* Security section */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />Security
          </h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Password</p>
              <p className="text-xs text-slate-500">Đổi mật khẩu khi cần thiết</p>
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
