import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Shield, RefreshCw, BarChart2, PieChart as PieIcon, 
  Award, BookOpen, Landmark, FileCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

export const AccreditationIqac = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/iqac/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error('Failed to load accreditation stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  const COLORS = ['#1F57A3', '#ECBF19', '#28A745', '#DC3545', '#9333EA'];

  const publicationsByType = stats?.charts?.publicationsByType || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary h-6 w-6" /> Accreditation & IQAC Mappings
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review live accreditation indicators and parameter scores mapped to NAAC, NBA, NIRF, and AICTE frameworks.
          </p>
        </div>
        <button 
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync framework
        </button>
      </div>

      {stats && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'NAAC 3.4.5 (Publications)', val: stats.kpis.publications, icon: BookOpen, color: 'text-primary bg-primary-light' },
              { label: 'NAAC 3.4.3 (Patents)', val: stats.kpis.patents, icon: Award, color: 'text-warning bg-amber-50' },
              { label: 'NIRF (Grants Revenue)', val: `₹${(stats.kpis.grantsRevenue || 0).toLocaleString()}`, icon: Landmark, color: 'text-success bg-green-50' },
              { label: 'NBA Criteria 10.2 (Placements)', val: stats.kpis.placements, icon: FileCheck, color: 'text-purple-600 bg-purple-50' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{item.label}</span>
                    <div className={`rounded-lg p-1.5 ${item.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <h2 className="text-lg font-black text-slate-800 mt-3">{item.val}</h2>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Comparison Bar Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                <BarChart2 size={16} className="text-primary" /> Publications by Department
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Live comparison of verified academic journals and conferences</p>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.publicationsByDept} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="value" name="Publications" fill="#1F57A3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Publication Type Pie Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                  <PieIcon size={16} className="text-warning" /> Publications Distribution by Type
                </h3>
                <p className="text-[10px] text-slate-400 mb-4">Breakdown of verified output classifications</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {publicationsByType.length === 0 ? (
                  <div className="text-xs text-slate-400">No data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={publicationsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {publicationsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {publicationsByType.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  {publicationsByType.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-600 truncate font-semibold">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default AccreditationIqac;
