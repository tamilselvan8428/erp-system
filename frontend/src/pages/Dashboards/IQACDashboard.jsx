import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Award, Shield, FileText, Check, X, 
  AlertCircle, RefreshCw, Layers, Compass
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const IQACDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState(''); // 'faculty', 'pub', 'patent', 'grant', 'industry'

  const loadData = async () => {
    try {
      // Fetch global analytics
      const res = await fetch('/api/iqac/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());

      // Fetch pending final review items (status: HOD_Approved)
      const list = [];
      
      const resFact = await fetch('/api/faculty?status=HOD_Approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const acts = await resFact.json();
      acts.forEach(a => list.push({ ...a, source: 'Activity', endpoint: `/api/faculty/${a._id}/verify` }));

      const resPub = await fetch('/api/research/publications?status=HOD_Approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pubs = await resPub.json();
      pubs.forEach(p => list.push({ ...p, source: 'Publication', endpoint: `/api/research/publications/${p._id}/verify` }));

      const resPat = await fetch('/api/research/patents?status=HOD_Approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pats = await resPat.json();
      pats.forEach(pt => list.push({ ...pt, source: 'Patent', endpoint: `/api/research/patents/${pt._id}/verify` }));

      const resGra = await fetch('/api/research/grants?status=HOD_Approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const grs = await resGra.json();
      grs.forEach(g => list.push({ ...g, source: 'Grant', endpoint: `/api/research/grants/${g._id}/verify` }));

      setPendingItems(list);
    } catch (err) {
      console.error('Failed to load IQAC workspace data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleFinalApprove = async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'IQAC_Approved' })
      });
      if (res.ok) {
        await loadData();
      } else {
        const err = await res.json();
        alert(`Approve failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason) return;
    setLoading(true);

    try {
      const res = await fetch(rejectId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Rejected', rejectionReason: rejectReason })
      });
      if (res.ok) {
        setRejectId(null);
        setRejectReason('');
        await loadData();
      } else {
        const err = await res.json();
        alert(`Reject failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1F57A3', '#ECBF19', '#28A745', '#DC3545', '#9333EA'];

  const publicationsByType = stats?.charts?.publicationsByType || [];

  return (
    <div className="space-y-6">
      
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary h-6 w-6" /> IQAC Institutional Auditing Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sri Eshwar College of Engineering • Final Verification, NAAC Mapping, & Accreditation Audits
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI statistics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Publications Verified', val: stats.kpis.publications, icon: FileText, color: 'text-primary bg-primary-light' },
            { label: 'Patents Verified', val: stats.kpis.patents, icon: Award, color: 'text-warning bg-amber-50' },
            { label: 'Consultancy Projects', val: stats.kpis.consultancy, icon: Compass, color: 'text-success bg-green-50' },
            { label: 'FDP Records Total', val: stats.kpis.fdps, icon: Layers, color: 'text-purple-600 bg-purple-50' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 hover-card-lift">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{item.label}</span>
                  <div className={`rounded-lg p-1.5 ${item.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-3">{item.val}</h2>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection form */}
      {rejectId && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <form onSubmit={handleRejectSubmit} className="space-y-3">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertCircle size={18} /> Enter Auditor Rejection Reason
            </div>
            <p className="text-xs text-slate-600">
              Please specify details of the non-compliance. This will cancel HOD approval and notify the faculty member directly.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Missing brochure, missing signatures, or wrong category mapped"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-danger focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white shadow hover:bg-danger/90 transition"
              >
                Send Rejection
              </button>
              <button
                type="button"
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IQAC FINAL VERIFICATION WORKFLOW QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals checklist queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">IQAC final verification Queue ({pendingItems.length})</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Entries approved by HODs awaiting final institutional sign-off</p>
          </div>

          <div className="flex-1 space-y-3 mt-4 overflow-y-auto max-h-80">
            {pendingItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">All submissions are fully audited and approved!</div>
            ) : (
              pendingItems.map((item) => (
                <div key={item._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-3">
                      <span className="text-xs font-semibold text-slate-800 block truncate">{item.title}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                        <span className="text-slate-400 font-bold bg-slate-200/50 px-1 rounded">{item.source}</span>
                        <span>•</span>
                        <span>{item.facultyName || item.authorName || item.inventorName} ({item.department})</span>
                      </div>
                      <div className="text-[9px] text-primary font-bold mt-1 uppercase tracking-wide">
                        Auto-Maps to NAAC: {item.accreditationMapping?.naac?.join(', ') || 'N/A'}
                      </div>
                    </div>
                    {item.attachments?.[0] && (
                      <a 
                        href={item.attachments[0].url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0 hover:bg-primary/20"
                      >
                        Evidence
                      </a>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-2">
                    <button
                      onClick={() => handleFinalApprove(item.endpoint)}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-success px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-success/90 transition"
                    >
                      <Check size={12} /> Final Approve & Map
                    </button>
                    <button
                      onClick={() => { setRejectId(item.endpoint); setRejectType(item.source); }}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-danger px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-danger/90 transition"
                    >
                      <X size={12} /> Reject to Faculty
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global distribution graph */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Publications distribution</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Audited publication types across institution</p>
          </div>
          <div className="h-48 mt-4 w-full flex items-center justify-center">
            {publicationsByType.length === 0 ? (
              <div className="text-xs text-slate-400">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={publicationsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
            <div className="grid grid-cols-2 gap-2 mt-2">
              {publicationsByType.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* DEPARTMENT GRAPH COMPARISONS */}
      {stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 text-sm">Department comparative audit</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Approved publications and student placements side-by-side</p>
          
          <div className="h-64 mt-4 w-full">
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
      )}

    </div>
  );
};
export default IQACDashboard;
