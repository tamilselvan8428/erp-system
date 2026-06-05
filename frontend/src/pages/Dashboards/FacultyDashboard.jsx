import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Award, BookOpen, FileCode, Landmark, 
  AlertTriangle, CheckCircle, ArrowRight, PlusCircle, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

export const FacultyDashboard = () => {
  const { user, token, updateClosureStatus } = useAuth();
  const [kpis, setKpis] = useState({ FDP: 0, Journal: 0, Patent: 0, Grants: 0 });
  const [activities, setActivities] = useState([]);
  const [closureLoading, setClosureLoading] = useState(false);
  const [closureError, setClosureError] = useState('');
  const [closureSuccess, setClosureSuccess] = useState('');

  const currentMonth = 6; // June
  const currentYear = 2026;
  const isMonthClosed = user?.monthlyClosureStatus?.some(
    s => s.month === currentMonth && s.year === currentYear && s.closed
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch all activities logged by this faculty member
        const resAct = await fetch('/api/faculty', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const acts = await resAct.json();
        setActivities(acts.slice(0, 5));

        // Group counts
        let fdps = 0;
        acts.forEach(a => { if (a.type === 'FDP') fdps++; });

        const resPub = await fetch('/api/research/publications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pubs = await resPub.json();
        let journals = pubs.filter(p => p.type === 'Journal').length;

        const resPat = await fetch('/api/research/patents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pats = await resPat.json();

        const resGra = await fetch('/api/research/grants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const grants = await resGra.json();

        setKpis({
          FDP: fdps,
          Journal: journals,
          Patent: pats.length,
          Grants: grants.length
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [token]);

  const handleClosureSubmit = async () => {
    setClosureLoading(true);
    setClosureError('');
    setClosureSuccess('');
    try {
      const res = await fetch('/api/iqac/submit-closure', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ month: currentMonth, year: currentYear })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Closure failed');
      }
      setClosureSuccess(data.message);
      updateClosureStatus(data.monthlyClosureStatus);
    } catch (err) {
      setClosureError(err.message);
    } finally {
      setClosureLoading(false);
    }
  };

  // Radar metrics mapping API scores
  const radarData = [
    { subject: 'Publications', A: kpis.Journal * 15, fullMark: 50 },
    { subject: 'FDP/STTP', A: kpis.FDP * 10, fullMark: 50 },
    { subject: 'Patents', A: kpis.Patent * 30, fullMark: 50 },
    { subject: 'Grants', A: kpis.Grants * 20, fullMark: 50 },
    { subject: 'Outreach', A: user.apiScore > 40 ? 30 : 10, fullMark: 50 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Profile card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {user.designation} • Department of {user.department}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-primary-light border border-primary/20 px-5 py-3 self-start md:self-auto">
          <Award className="text-primary h-8 w-8 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] text-primary/60 font-bold uppercase tracking-wider">Academic API Score</span>
            <span className="text-xl font-black text-primary">{user.apiScore || 0} Points</span>
          </div>
        </div>
      </div>

      {/* MONTHLY ACADEMIC CLOSURE BLOCK */}
      {!isMonthClosed ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning h-6 w-6 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm">Monthly Academic Closure Pending</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-normal">
                Monthly closure for **June 2026** is pending. The institutional rules block closure if you have logged items in "Pending" status. Ensure all FDP, publications, and patents are updated.
              </p>
              {closureError && <span className="text-[10px] font-bold text-danger mt-2">{closureError}</span>}
              {closureSuccess && <span className="text-[10px] font-bold text-success mt-2">{closureSuccess}</span>}
            </div>
          </div>
          <button
            onClick={handleClosureSubmit}
            disabled={closureLoading}
            className="rounded-lg bg-warning px-4 py-2 text-xs font-bold text-white shadow hover:bg-warning/90 transition shrink-0"
          >
            {closureLoading ? 'Verifying Closure...' : 'Submit Closure'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
          <CheckCircle className="text-success h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">
            Monthly Academic Closure for June 2026 is completed. (Closed on {new Date().toLocaleDateString()})
          </span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'FDP/Workshops', val: kpis.FDP, icon: Award, color: 'text-primary bg-primary-light border-primary/10' },
          { label: 'Journal Pubs', val: kpis.Journal, icon: BookOpen, color: 'text-success bg-green-50 border-green-100' },
          { label: 'Patents filed', val: kpis.Patent, icon: FileCode, color: 'text-warning bg-amber-50 border-amber-100' },
          { label: 'Grants & Revenue', val: kpis.Grants, icon: Landmark, color: 'text-purple-600 bg-purple-50 border-purple-100' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 hover-card-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{item.label}</span>
                <div className={`rounded-lg p-1.5 ${item.color} border`}>
                  <Icon size={16} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mt-3">{item.val}</h2>
            </div>
          );
        })}
      </div>

      {/* Main Content splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar profile chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Academic Performance Radar</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Strength dimension map of verified achievements</p>
          </div>
          <div className="h-64 mt-4 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 50]} tick={{ fill: '#94a3b8' }} />
                <Radar name="Rajesh" dataKey="A" stroke="#1F57A3" fill="#1F57A3" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent logs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Activities Log</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Approval workflow tracks for logged events</p>
            </div>
            <Link to="/faculty-activities" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No activities logged yet. Click below to add.</div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex items-center justify-between py-3">
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-xs font-semibold text-slate-800 truncate block">{act.title}</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span className="text-primary">{act.type}</span>
                      <span>•</span>
                      <span>{act.organizer}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0
                    ${act.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                      act.verificationStatus === 'HOD_Approved' ? 'bg-primary-light text-primary' : 
                      act.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                    {act.verificationStatus}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <Link 
              to="/faculty-activities" 
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-white shadow hover:bg-primary-dark transition"
            >
              <PlusCircle size={14} /> Log FDP/Course
            </Link>
            <Link 
              to="/research-tracker" 
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary py-2.5 text-xs font-bold text-primary hover:bg-primary-light/30 transition"
            >
              <PlusCircle size={14} /> Log Publication
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
export default FacultyDashboard;
