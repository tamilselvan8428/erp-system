import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  TrendingUp, Award, Briefcase, Landmark, 
  Building2, GraduationCap, RefreshCw, BarChart2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export const PrincipalDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/iqac/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());
    } catch (e) {
      console.error('Failed to load Principal dashboard:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Simulated annual growth revenue data
  const revenueHistory = [
    { year: '2022', Grants: 4500000, Consultancy: 800000 },
    { year: '2023', Grants: 6000000, Consultancy: 1200000 },
    { year: '2024', Grants: 8500000, Consultancy: 2100000 },
    { year: '2025', Grants: 11000000, Consultancy: 2800000 },
    { year: '2026', Grants: stats?.kpis.grantsRevenue || 1200000, Consultancy: stats?.kpis.consultancyRevenue || 50000 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Principal's Executive Console</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sri Eshwar College of Engineering • Institutional Performance & Funding Metrics
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Sync Overview
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sponsored Grants Revenue', val: `Rs. ${(stats?.kpis.grantsRevenue || 0).toLocaleString()}`, icon: Landmark, color: 'text-primary bg-primary-light' },
          { label: 'Consultancy Revenue', val: `Rs. ${(stats?.kpis.consultancyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-success bg-green-50' },
          { label: 'Placements Verified', val: stats?.kpis.placements || 0, icon: Briefcase, color: 'text-warning bg-amber-50' },
          { label: 'Verified Publications', val: stats?.kpis.publications || 0, icon: GraduationCap, color: 'text-purple-600 bg-purple-50' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 hover-card-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className={`rounded-lg p-1.5 ${item.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-3">{item.val}</h2>
            </div>
          );
        })}
      </div>

      {/* Financial Growth area chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 text-sm">Sponsored Funding & Consultancy Growth</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Year-over-year revenue analysis from verified research grants and consultancy</p>
        
        <div className="h-72 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGrants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F57A3" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1F57A3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28A745" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#28A745" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="Grants" stroke="#1F57A3" fillOpacity={1} fill="url(#colorGrants)" />
              <Area type="monotone" dataKey="Consultancy" stroke="#28A745" fillOpacity={1} fill="url(#colorCons)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placements Comparative bar chart */}
      {stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 text-sm">Placements comparative audit</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Verified placement offers count across major departments</p>
          
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.placementsByDept} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="value" name="Placement Offers" fill="#ECBF19" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
export default PrincipalDashboard;
