import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Compass, Shield, KeyRound, ArrowRight, UserCheck, Lock, Info, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, register, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('operator');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegisterMode) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(demoRole);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(`Quick demo sign-in error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50 text-slate-700">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link to Landing */}
        <div>
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded px-1.5 py-1"
          >
            <ArrowLeft size={14} />
            <span>Return to Public Overview</span>
          </NavLink>
        </div>

        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
            <Compass size={24} />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            {isRegisterMode ? 'Register Prototype Account' : 'Console Sign In'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isRegisterMode 
              ? 'Create a local operator credential for interface testing' 
              : 'Sign in to access protected monitoring maps, sensor meshes, and risk calculation'}
          </p>
        </div>

        {/* Prototype Authentication Notice */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-amber-900 block mb-0.5 font-semibold">Local Prototype Authentication:</strong>
              This application utilizes local JSON Web Token sessions strictly for interface evaluation. 
              It is not connected to an enterprise single sign-on or certified production directory.
            </div>
          </div>
        </div>

        {/* Quick Demo Login Pill Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-700">
              <UserCheck size={14} />
              <span>One-Click Demo Accounts</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">PRE-SEEDED</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Select a simulated role preset to immediately explore protected views:
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('admin')}
              className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-800 hover:border-orange-500 hover:bg-white transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="block font-bold">Admin</span>
              <span className="text-[9px] text-slate-500 font-mono block">Full Access</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('operator')}
              className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-800 hover:border-orange-500 hover:bg-white transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="block font-bold text-orange-700">Operator</span>
              <span className="text-[9px] text-slate-500 font-mono block">Ack / Edits</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('viewer')}
              className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold text-slate-800 hover:border-orange-500 hover:bg-white transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="block font-bold text-slate-700">Viewer</span>
              <span className="text-[9px] text-slate-500 font-mono block">Read Only</span>
            </button>
          </div>
        </div>

        {/* Login / Register Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegisterMode && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geotechnical Researcher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="operator@landslide.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Demo Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="operator">Monitoring Operator (Dispatches &amp; Acknowledgements)</option>
                  <option value="admin">Administrator (System Seeding &amp; Node Config)</option>
                  <option value="viewer">Public Viewer (Read-only)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
            >
              <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Register Local Demo Account' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setError(null); }}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 focus-visible:ring-1 focus-visible:ring-orange-500 rounded px-1"
            >
              {isRegisterMode
                ? 'Already have credentials? Sign In'
                : "Need a custom user? Register new test account"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
