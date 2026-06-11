import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Award, BookOpen, FileCheck, 
  Clock, Check, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const HODDashboard = () => {
  const { user, token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState(''); // 'faculty' or 'student'
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      // Fetch department specific analytics
      const res = await fetch(`/api/iqac/analytics?department=${user.department}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);

      // Fetch pending faculty activities
      const resFact = await fetch(`/api/faculty?department=${user.department}&status=Pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPendingFaculty(await resFact.json());

      // Fetch pending student achievements
      const resStud = await fetch(`/api/student?department=${user.department}&status=Pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPendingStudents(await resStud.json());
    } catch (err) {
      console.error('Error loading HOD dashboard data:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async (id, type) => {
    setLoading(true);
    const endpoint = type === 'faculty' 
      ? `/api/faculty/${id}/verify` 
      : `/api/student/${id}/verify`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'HOD_Approved' })
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

    const endpoint = rejectType === 'faculty' 
      ? `/api/faculty/${rejectId}/verify` 
      : `/api/student/${rejectId}/verify`;

    try {
      const res = await fetch(endpoint, {
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

  const chartData = analytics?.charts?.publicationsByType 
    ? analytics.charts.publicationsByType.map(item => ({
        name: item.name,
        Publications: item.value
      }))
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HOD Workspace - {user.department}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sri Eshwar College of Engineering • Department Auditing Workspace
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Publications Approved', val: analytics?.kpis.publications || 0, icon: BookOpen, color: 'text-primary bg-primary-light' },
          { label: 'Patents Logged', val: analytics?.kpis.patents || 0, icon: Award, color: 'text-warning bg-amber-50' },
          { label: 'Internships Verified', val: analytics?.kpis.internships || 0, icon: FileCheck, color: 'text-success bg-green-50' },
          { label: 'FDP Records', val: analytics?.kpis.fdps || 0, icon: Clock, color: 'text-purple-600 bg-purple-50' }
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

      {/* Rejection Modal/Form Panel */}
      {rejectId && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
          <form onSubmit={handleRejectSubmit} className="space-y-3">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertCircle size={18} /> Enter Rejection Reason
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Please state why this entry is being rejected. This notification will be sent back to the student or faculty member.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Missing certificate / Incorrect date / Typo in title"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white shadow hover:bg-danger/90 transition"
              >
                Submit Reject
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

      {/* APPROVAL WORKFLOW QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Faculty Approvals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock size={16} className="text-warning" /> Pending Faculty Logs ({pendingFaculty.length})
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">FDPs, Publications, Patents awaiting HOD department verification</p>
          </div>

          <div className="flex-1 space-y-3 mt-4 overflow-y-auto max-h-72">
            {pendingFaculty.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">All faculty activities are approved. Excellent!</div>
            ) : (
              pendingFaculty.map((item) => (
                <div key={item._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-3">
                      <span className="text-xs font-semibold text-slate-800 block truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        By {item.facultyName} • <span className="text-primary">{item.type}</span>
                      </span>
                    </div>
                    {item.attachments?.[0] && (
                      <a 
                        href={item.attachments[0].url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0 hover:bg-primary/20"
                      >
                        View cert
                      </a>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-2">
                    <button
                      onClick={() => handleApprove(item._id, 'faculty')}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-success px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-success/90 transition"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => { setRejectId(item._id); setRejectType('faculty'); }}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-danger px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-danger/90 transition"
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Approvals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock size={16} className="text-warning" /> Pending Student Logs ({pendingStudents.length})
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Internships, placements, certifications awaiting department approval</p>
          </div>

          <div className="flex-1 space-y-3 mt-4 overflow-y-auto max-h-72">
            {pendingStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">All student records are verified. Excellent!</div>
            ) : (
              pendingStudents.map((item) => (
                <div key={item._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-3">
                      <span className="text-xs font-semibold text-slate-800 block truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        By {item.studentName} • <span className="text-primary">{item.type}</span>
                        {item.details && ` (${item.details})`}
                      </span>
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
                      onClick={() => handleApprove(item._id, 'student')}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-success px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-success/90 transition"
                    >
                      <Check size={12} /> Verify
                    </button>
                    <button
                      onClick={() => { setRejectId(item._id); setRejectType('student'); }}
                      disabled={loading}
                      className="flex items-center gap-1 rounded bg-danger px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-danger/90 transition"
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DEPARTMENT PUBLICATIONS BREAKDOWN CHART */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 text-sm">Research Publications Breakdown</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Publications category breakdown for {user.department}</p>
        
        <div className="h-64 mt-4 w-full">
          {chartData.length === 0 ? (
            <div className="text-xs text-slate-400">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Publications" fill="#1F57A3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};
export default HODDashboard;
