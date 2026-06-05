import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Award, Briefcase, FileCheck, CheckCircle2, ShieldAlert, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

export const StudentDashboard = () => {
  const { user, token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ Placed: 'Pending', Internship: 0, Nptel: 0, Total: 0 });

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch(`/api/student?studentId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          setAchievements(list);

          // Calculate summary metrics
          let internshipsCount = 0;
          let nptelCount = 0;
          let hasPlacement = 'None';
          list.forEach(item => {
            if (item.verificationStatus === 'HOD_Approved') {
              if (item.type === 'Internship') internshipsCount++;
              if (item.type === 'NPTEL Certification') nptelCount++;
              if (item.type === 'Placement Offer') hasPlacement = 'Placed (Verified)';
            } else if (item.type === 'Placement Offer' && item.verificationStatus === 'Pending') {
              hasPlacement = 'Awaiting HOD Verify';
            }
          });

          setStats({
            Placed: hasPlacement,
            Internship: internshipsCount,
            Nptel: nptelCount,
            Total: list.length
          });
        }
      } catch (err) {
        console.error('Failed to load student achievements:', err);
      }
    };
    fetchAchievements();
  }, [user.id, token]);

  const COLORS = ['#1F57A3', '#ECBF19', '#28A745', '#DC3545'];
  const chartData = [
    { name: 'Internships', value: achievements.filter(a => a.type === 'Internship').length },
    { name: 'NPTEL', value: achievements.filter(a => a.type === 'NPTEL Certification').length },
    { name: 'Hackathons', value: achievements.filter(a => a.type === 'Hackathon').length },
    { name: 'Others', value: achievements.filter(a => !['Internship', 'NPTEL Certification', 'Hackathon'].includes(a.type)).length }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Student • Class of 2026 • Roll No: {user.studentId} • CSE
          </p>
        </div>
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 self-start md:self-auto
          ${stats.Placed.includes('Verified') 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-primary-light border-primary/20 text-primary'}`}>
          <Briefcase size={22} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Placement Status</span>
            <span className="text-sm font-bold truncate">{stats.Placed}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Verified Internships', val: stats.Internship, icon: Briefcase, color: 'text-primary' },
          { label: 'NPTEL Certifications', val: stats.Nptel, icon: Award, color: 'text-success' },
          { label: 'Total Logs Submitted', val: stats.Total, icon: FileCheck, color: 'text-warning' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between hover-card-lift">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <h2 className="text-2xl font-black text-slate-800 mt-2">{item.val}</h2>
              </div>
              <div className={`rounded-xl p-3 bg-slate-50 border border-slate-100 ${item.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Achievements chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Achievements Breakdown</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Ratio of submitted academic milestones</p>
          </div>
          <div className="h-48 mt-4 w-full flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-xs text-slate-400">No achievements recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List of submissions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submission Statuses</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Track verification by Faculty Advisor and HOD</p>
            </div>
            <Link to="/student-achievements" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-primary-dark transition">
              <PlusCircle size={14} /> Upload Achievement
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-72">
            {achievements.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No achievements logged yet. Click the button above to upload an offer letter or certificate!
              </div>
            ) : (
              achievements.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-3">
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-xs font-semibold text-slate-800 truncate block">{item.title}</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span className="text-primary font-semibold">{item.type}</span>
                      <span>•</span>
                      <span className="truncate">{item.organization}</span>
                      {item.details && (
                        <>
                          <span>•</span>
                          <span className="truncate text-slate-500 font-normal">{item.details}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded
                      ${item.verificationStatus === 'HOD_Approved' || item.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                        item.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                      {item.verificationStatus}
                    </span>
                    {item.verificationStatus === 'Rejected' && (
                      <span className="text-[8px] text-danger max-w-[120px] truncate" title={item.rejectionReason}>
                        Reason: {item.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default StudentDashboard;
