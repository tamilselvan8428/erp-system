import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { KeyRound, Mail, UserCheck, ShieldAlert } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, 'Password123');
      navigate('/');
    } catch (err) {
      setError(`Quick login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Student', email: 'student@sece.ac.in', desc: 'Upload internship & placement records' },
    { role: 'Faculty', email: 'faculty@sece.ac.in', desc: 'Track FDPs, publications, submit closure' },
    { role: 'HOD', email: 'hod@sece.ac.in', desc: 'Verify CSE activities, track ranking' },
    { role: 'IQAC', email: 'iqac@sece.ac.in', desc: 'Final audit, map NAAC/NBA targets' },
    { role: 'Principal', email: 'principal@sece.ac.in', desc: 'High-level grants, placing analytics' },
    { role: 'Admin', email: 'admin@sece.ac.in', desc: 'Audit trail logger, user configs' },
  ];

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background blobs for premium layout */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Title Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg text-accent text-3xl font-black">
            SE
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-primary-dark">
            FSAIS Academic Intelligence
          </h2>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            One Platform. Real-Time Updates. Reliable Data. Stronger Institution.
          </p>
        </div>

        {/* Login form Glassmorphism container */}
        <div className="glass rounded-2xl shadow-xl p-8 border border-white/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-xs font-semibold text-danger">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sece.ac.in"
                    className="block w-full rounded-lg border border-slate-300 bg-white/50 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-300 bg-white/50 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Demo Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-[1px] w-full bg-slate-200" />
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Evaluator shortcuts
            </span>
            <div className="h-[1px] w-full bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => handleQuickLogin(acc.email)}
                disabled={loading}
                className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-primary hover:shadow transition duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-primary transition">
                    {acc.role} login
                  </span>
                  <UserCheck size={14} className="text-slate-400 group-hover:text-primary transition" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-medium">{acc.desc}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
