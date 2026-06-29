import React, { useState } from 'react';
import { Code2, Calendar, Users, Trophy, ChevronRight, Eye, EyeOff, ArrowRight, GraduationCap, Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/shared/Badge';
import { useAuth } from '../../auth/AuthContext';
import { registerApi } from '../../api/auth';

interface PublicScreensProps {
  screen: string;
  onNavigate: (screen: string) => void;
  onRoleLogin: (role: string) => void;
}

const openEvents = [
  {
    id: 1, name: 'SEAL Software Engineering Hackathon Summer 2026', type: 'SUMMER',
    discipline: 'Software Engineering', status: 'OPEN',
    registrationDeadline: '2026-06-30', eventDates: 'Jul 15 – Aug 10, 2026',
    teams: 24, maxTeams: 40, categories: ['Web Application', 'Mobile Application', 'AI/Automation Tool'],
  },
  {
    id: 2, name: 'FPT Innovation Challenge Fall 2026', type: 'FALL',
    discipline: 'Artificial Intelligence', status: 'OPEN',
    registrationDeadline: '2026-08-15', eventDates: 'Sep 5 – Oct 20, 2026',
    teams: 11, maxTeams: 30, categories: ['NLP Application', 'Computer Vision', 'Generative AI'],
  },
];

export function LandingPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2351 0%, #1e3a8a 50%, #0891b2 100%)' }}>
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SEAL</span>
          <span className="text-blue-300 text-sm">| FPT University</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('login')} className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Sign In
          </button>
          <button onClick={() => onNavigate('register')} className="bg-white text-blue-900 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            Register
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            Open for Registration — Summer 2026
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Software Engineering<br />
            <span className="text-cyan-300">Hackathon Platform</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-xl">
            SEAL digitizes the complete academic hackathon lifecycle—from event proposal and approval to team registration, scoring, and award publication—for FPT University HCMC.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('register')} className="bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-7 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/30">
              Register as Participant <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('login')} className="border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Staff Login
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: '2', label: 'Open Events', icon: Calendar },
            { value: '35+', label: 'Registered Teams', icon: Users },
            { value: '3', label: 'Categories', icon: Trophy },
            { value: '8', label: 'Judges', icon: GraduationCap },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                <p className="text-blue-300 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Events */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Open for Registration</h2>
            <span className="text-sm text-slate-500">{openEvents.length} events available</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {openEvents.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge status={event.status} />
                  <span className="text-xs text-slate-400 font-mono">{event.type}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>{event.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{event.discipline}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {event.categories.map(cat => (
                    <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{cat}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {event.eventDates}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Deadline: {event.registrationDeadline}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {event.teams}/{event.maxTeams} teams
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(event.teams / event.maxTeams) * 100}%` }} />
                </div>
                <button onClick={() => onNavigate('register')} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                  Register Team <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center" style={{ fontFamily: 'var(--font-display)' }}>Platform Features</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: 'Managed Event Lifecycle', desc: 'From proposal to award publication, every stage is tracked and gated.' },
              { icon: Users, title: 'Multi-role Access Control', desc: 'Admin, Coordinators, Judges, Mentors, and Students each see only what they need.' },
              { icon: Trophy, title: 'Transparent Rankings', desc: 'Weighted criteria scoring, ICC/Krippendorff RBL analysis, and published results.' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-semibold text-slate-700">SEAL</span>
            <span className="text-xs text-slate-400">— FPT University HCMC, Software Engineering Dept.</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 SEAL Platform. Academic Use Only.</p>
        </div>
      </footer>
    </div>
  );
}

export function LoginPage({ onNavigate, onRoleLogin }: { onNavigate: (s: string) => void; onRoleLogin: (role: string) => void }) {
  const auth = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const role = await auth.login({ email, password });
      onRoleLogin(role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ background: 'linear-gradient(145deg, #0f2351, #1e3a8a)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>SEAL</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Manage your<br /><span className="text-cyan-300">hackathon</span><br />from one place.
          </h2>
          <p className="text-blue-200 leading-relaxed">SEAL handles everything from event proposals and budget approval to team scoring, RBL analysis, and result publication.</p>
        </div>
        <p className="text-blue-400 text-xs">FPT University HCMC — Academic Platform</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Sign in to SEAL</h1>
            <p className="text-slate-500 text-sm">Use your FPT University or registered account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@seal.local"
                autoComplete="email"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300" /> Remember me
              </label>
              <button type="button" className="text-sm text-blue-700 hover:text-blue-800 font-medium">Forgot password?</button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang đăng nhập…</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            New participant? <button onClick={() => onNavigate('register')} className="text-blue-700 font-medium hover:text-blue-800">Create account</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [studentType, setStudentType] = useState<'fpt' | 'external'>('fpt');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
    university: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await registerApi({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
        fptStudent: studentType === 'fpt',
        studentId: form.studentId || undefined,
        university: studentType === 'external' ? form.university || undefined : undefined,
      });
      toast.success('Tài khoản đã tạo — chờ admin duyệt trước khi đăng nhập');
      onNavigate('login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'var(--font-display)' }}>SEAL</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Create Participant Account</h1>
          <p className="text-slate-500 text-sm">Register to join SEAL hackathon events at FPT University</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
          {/* Type Selector */}
          <div className="flex rounded-xl border border-slate-200 p-1 mb-6">
            {[{ type: 'fpt', label: 'FPT Student', icon: GraduationCap }, { type: 'external', label: 'External Student', icon: Building2 }].map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setStudentType(opt.type as 'fpt' | 'external')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${studentType === opt.type ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <opt.icon className="w-4 h-4" />{opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input value={form.fullName} onChange={set('fullName')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Nguyen Thanh Phong" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder={studentType === 'fpt' ? 'phong.nt@student.fpt.edu.vn' : 'your@university.edu.vn'} />
            </div>
            {studentType === 'fpt' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input value={form.studentId} onChange={set('studentId')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="SE171234" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">University / Institution</label>
                  <input value={form.university} onChange={set('university')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Ho Chi Minh City University of Technology" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (at your institution)</label>
                  <input value={form.studentId} onChange={set('studentId')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="2212345" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input value={form.phone} onChange={set('phone')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="0901 234 567" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={set('password')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="••••••••" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">After registration, your account must be approved by the Event Coordinator before you can join a team.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo tài khoản…</>
              ) : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered? <button onClick={() => onNavigate('login')} className="text-blue-700 font-medium">Sign in</button>
        </p>
      </div>
    </div>
  );
}

export function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Account Pending Approval</h1>
          <p className="text-slate-500 leading-relaxed mb-6">
            Your registration has been received. The <strong>Event Coordinator</strong> for your target event must review and approve your account before you can join a team and participate.
          </p>
          <div className="space-y-3 text-left mb-7">
            {[
              { step: 'Registration submitted', done: true },
              { step: 'Coordinator review', done: false },
              { step: 'Account activated', done: false },
              { step: 'Join a team', done: false },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {item.done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="w-2 h-2 bg-slate-400 rounded-full" />}
                </div>
                <span className={`text-sm ${item.done ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{item.step}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">You will receive an email notification once your account is approved. Typical review time: 1–2 business days.</p>
        </div>
      </div>
    </div>
  );
}
