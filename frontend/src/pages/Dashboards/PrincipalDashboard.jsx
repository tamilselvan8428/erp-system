import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  TrendingUp, Briefcase, Landmark, 
  GraduationCap, RefreshCw, BarChart2, Users, BookOpen,
  FileText, Eye, Activity, Award as BadgeIcon, Clock, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

export const PrincipalDashboard = () => {
  const { token } = useAuth();
  
  // Dynamic list metadata
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Selection filters
  const [scope, setScope] = useState('global'); // 'global' | 'department' | 'faculty' | 'student'
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Dashboard state loading
  const [globalStats, setGlobalStats] = useState(null);
  const [entityItems, setEntityItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGridItem, setSelectedGridItem] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const COLORS = ['#1F57A3', '#28A745', '#ECBF19', '#DC3545', '#8A2BE2', '#FF8C00'];

  // 1. Fetch metadata (users and departments)
  const loadMetadata = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resDepts, resUsers] = await Promise.all([
        fetch('/api/admin/departments', { headers }),
        fetch('/api/admin/users', { headers })
      ]);
      let defaultDept = '';
      if (resDepts.ok) {
        const depts = await resDepts.json();
        setDepartments(depts);
        if (depts.length > 0) {
          defaultDept = depts[0].code;
          setSelectedDept(defaultDept);
        }
      }
      if (resUsers.ok) {
        const allUsers = await resUsers.json();
        setUsers(allUsers);
        
        if (defaultDept) {
          const deptFaculties = allUsers.filter(u => u.role === 'Faculty' && u.department === defaultDept);
          if (deptFaculties.length > 0) setSelectedFacultyId(deptFaculties[0]._id);
          
          const deptStudents = allUsers.filter(u => u.role === 'Student' && u.department === defaultDept);
          if (deptStudents.length > 0) setSelectedStudentId(deptStudents[0]._id);
        }
      }
    } catch (e) {
      console.error('Failed to load Principal console metadata:', e);
    }
  };

  // 2. Fetch global analytics
  const loadGlobalStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/iqac/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGlobalStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMetadata();
    loadGlobalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Utility to determine academic year
  const getAcademicYearFromDate = (dateString) => {
    if (!dateString) return '2025-2026';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '2025-2026';
    const month = d.getMonth();
    const year = d.getFullYear();
    return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  // Schema normalizer for grid representation
  const normalizeItem = (item, modelType) => {
    let title = item.title || '';
    let category = '';
    let type = '';
    let ownerName = '';
    let department = item.department || '';
    let date = '';
    let details = '';

    if (modelType === 'faculty') {
      category = 'Faculty Development';
      type = item.type;
      ownerName = item.facultyName || '';
      date = item.startDate;
      details = `Host: ${item.organizer}. Duration: ${item.duration} Days. Role: ${item.role}`;
    } else if (modelType === 'publication') {
      category = 'Research (CFRD)';
      type = `${item.type} Pub`;
      ownerName = item.authorName || '';
      date = item.publicationDate;
      details = `Journal: ${item.journalConferenceName}. Publisher: ${item.publisher || 'N/A'}. ISSN: ${item.issnIsbn || 'N/A'}`;
    } else if (modelType === 'patent') {
      category = 'Research (CFRD)';
      type = 'Patent';
      ownerName = item.inventorName || '';
      date = item.filingDate;
      details = `App No: ${item.applicationNumber}. Status: ${item.status}. Country: ${item.country}`;
    } else if (modelType === 'grant') {
      category = 'Research (CFRD)';
      type = item.type;
      ownerName = item.investigatorName || '';
      date = item.startDate;
      details = `Agency: ${item.fundingAgency}. Amount: ₹${item.amountSanctioned?.toLocaleString()}. Duration: ${item.durationYears} Years`;
    } else if (modelType === 'student') {
      category = 'Student Achievement';
      type = item.type;
      ownerName = item.studentName || '';
      date = item.dateOccurred;
      details = `Org: ${item.organization}. Details: ${item.details || 'N/A'}`;
    } else if (modelType === 'event') {
      category = 'Events Organized';
      type = `Organized ${item.type}`;
      ownerName = item.organizerName || '';
      date = item.startDate;
      details = `Venue: ${item.venue}. Attendees: ${item.participantsCount}. Budget spent: ₹${item.budgetSpent?.toLocaleString()}`;
    }

    return {
      _id: item._id,
      title,
      category,
      type,
      ownerName,
      department,
      date: date ? new Date(date).toLocaleDateString() : 'N/A',
      rawDate: date || item.createdAt,
      details,
      verificationStatus: item.verificationStatus || 'Pending',
      attachments: item.attachments || [],
      originalData: item
    };
  };

  // 3. Fetch granular logs based on selected scope
  const loadEntityReport = async () => {
    if (scope === 'global') return;
    setLoading(true);
    setEntityItems([]);
    
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (scope === 'department' && selectedDept) {
        // Fetch all department-scoped activities
        const params = `?department=${selectedDept}`;
        const [resFac, resPub, resPat, resGra, resEve, resStu] = await Promise.all([
          fetch(`/api/faculty${params}`, { headers }),
          fetch(`/api/research/publications${params}`, { headers }),
          fetch(`/api/research/patents${params}`, { headers }),
          fetch(`/api/research/grants${params}`, { headers }),
          fetch(`/api/events${params}`, { headers }),
          fetch(`/api/student${params}`, { headers })
        ]);

        let combined = [];
        if (resFac.ok) combined.push(...(await resFac.json()).map(x => normalizeItem(x, 'faculty')));
        if (resPub.ok) combined.push(...(await resPub.json()).map(x => normalizeItem(x, 'publication')));
        if (resPat.ok) combined.push(...(await resPat.json()).map(x => normalizeItem(x, 'patent')));
        if (resGra.ok) combined.push(...(await resGra.json()).map(x => normalizeItem(x, 'grant')));
        if (resEve.ok) combined.push(...(await resEve.json()).map(x => normalizeItem(x, 'event')));
        if (resStu.ok) combined.push(...(await resStu.json()).map(x => normalizeItem(x, 'student')));
        
        combined.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setEntityItems(combined);

      } else if (scope === 'faculty' && selectedFacultyId) {
        // Fetch specific faculty member's portfolio
        const [resFac, resPub, resPat, resGra, resEve] = await Promise.all([
          fetch(`/api/faculty?facultyId=${selectedFacultyId}`, { headers }),
          fetch(`/api/research/publications?authorId=${selectedFacultyId}`, { headers }),
          fetch(`/api/research/patents?inventorId=${selectedFacultyId}`, { headers }),
          fetch(`/api/research/grants?investigatorId=${selectedFacultyId}`, { headers }),
          fetch(`/api/events?organizerId=${selectedFacultyId}`, { headers })
        ]);

        let combined = [];
        if (resFac.ok) combined.push(...(await resFac.json()).map(x => normalizeItem(x, 'faculty')));
        if (resPub.ok) combined.push(...(await resPub.json()).map(x => normalizeItem(x, 'publication')));
        if (resPat.ok) combined.push(...(await resPat.json()).map(x => normalizeItem(x, 'patent')));
        if (resGra.ok) combined.push(...(await resGra.json()).map(x => normalizeItem(x, 'grant')));
        if (resEve.ok) combined.push(...(await resEve.json()).map(x => normalizeItem(x, 'event')));

        combined.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setEntityItems(combined);

      } else if (scope === 'student' && selectedStudentId) {
        // Fetch specific student member's dossier
        const res = await fetch(`/api/student?studentId=${selectedStudentId}`, { headers });
        if (res.ok) {
          const list = await res.json();
          setEntityItems(list.map(x => normalizeItem(x, 'student')));
        }
      }
    } catch (e) {
      console.error('Failed to load granular entity report:', e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch granular data whenever scope or active selection changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntityReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, selectedDept, selectedFacultyId, selectedStudentId]);

  // Handle department change to pre-select first users
  const handleDeptFilterChange = (deptCode) => {
    setSelectedDept(deptCode);
    
    // Auto-select first faculty in new department
    const deptFaculties = users.filter(u => u.role === 'Faculty' && u.department === deptCode);
    if (deptFaculties.length > 0) setSelectedFacultyId(deptFaculties[0]._id);
    else setSelectedFacultyId('');

    // Auto-select first student in new department
    const deptStudents = users.filter(u => u.role === 'Student' && u.department === deptCode);
    if (deptStudents.length > 0) setSelectedStudentId(deptStudents[0]._id);
    else setSelectedStudentId('');
  };

  // Dynamic visual charts aggregation for granular reports
  const graphicalReportData = (() => {
    const statsMap = {
      publications: 0,
      patents: 0,
      grants: 0,
      fdps: 0,
      studentAchievements: 0,
      organizedEvents: 0
    };

    const typeBreakdown = {};
    const statusBreakdown = { Pending: 0, HOD_Approved: 0, IQAC_Approved: 0, Rejected: 0 };

    entityItems.forEach(item => {
      // Metric counts
      if (item.category === 'Research (CFRD)') {
        if (item.type.includes('Pub')) statsMap.publications++;
        else if (item.type === 'Patent') statsMap.patents++;
        else statsMap.grants++;
      } else if (item.category === 'Faculty Development') {
        statsMap.fdps++;
      } else if (item.category === 'Student Achievement') {
        statsMap.studentAchievements++;
      } else if (item.category === 'Events Organized') {
        statsMap.organizedEvents++;
      }

      // Type counts
      typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1;

      // Status counts
      statusBreakdown[item.verificationStatus] = (statusBreakdown[item.verificationStatus] || 0) + 1;
    });

    const typeChartData = Object.keys(typeBreakdown).map(name => ({
      name,
      value: typeBreakdown[name]
    }));

    const statusChartData = Object.keys(statusBreakdown).map(name => ({
      name,
      value: statusBreakdown[name]
    }));

    return {
      totals: statsMap,
      typeData: typeChartData,
      statusData: statusChartData
    };
  })();

  // Global historical trend parameters
  const revenueHistory = [
    { year: '2022', Grants: 4500000, Consultancy: 800000 },
    { year: '2023', Grants: 6000000, Consultancy: 1200000 },
    { year: '2024', Grants: 8500000, Consultancy: 2100000 },
    { year: '2025', Grants: 11000000, Consultancy: 2800000 },
    { year: '2026', Grants: globalStats?.kpis.grantsRevenue || 1200000, Consultancy: globalStats?.kpis.consultancyRevenue || 50000 }
  ];

  return (
    <div className="space-y-6">
      
      {/* HEADER PANELS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="text-primary h-6 w-6" /> Principal's Reporting Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sri Eshwar College of Engineering • Integrated Performance Reports and Visual Analytics Portal
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => { loadMetadata(); loadGlobalStats(); loadEntityReport(); }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Overview
          </button>
        </div>
      </div>

      {/* REVENUE & COMPLIANCE tabs (Scope switcher) */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'global', label: 'Global Overview', icon: Activity },
          { id: 'department', label: 'Departmental Audits', icon: Landmark },
          { id: 'faculty', label: 'Faculty Dossiers', icon: Users },
          { id: 'student', label: 'Student Portfolios', icon: GraduationCap }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setScope(tab.id); setSelectedGridItem(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition
                ${scope === tab.id 
                  ? 'border-primary text-primary font-black' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* DYNAMIC FILTER DECK CONTAINER */}
      {scope !== 'global' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap gap-4 items-center">
          
          {/* Department Select Dropdown */}
          <div className="w-56">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Department</label>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptFilterChange(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-primary focus:outline-none"
            >
              {departments.map(d => (
                <option key={d._id} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Faculty select - only visible if Faculty scope is active */}
          {scope === 'faculty' && (
            <div className="w-64">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Faculty Member</label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-primary focus:outline-none"
              >
                {users.filter(u => u.role === 'Faculty' && u.department === selectedDept).map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.designation || 'Faculty'})</option>
                ))}
                {users.filter(u => u.role === 'Faculty' && u.department === selectedDept).length === 0 && (
                  <option value="">No Faculty loaded in {selectedDept}</option>
                )}
              </select>
            </div>
          )}

          {/* Student select - only visible if Student scope is active */}
          {scope === 'student' && (
            <div className="w-64">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-primary focus:outline-none"
              >
                {users.filter(u => u.role === 'Student' && u.department === selectedDept).map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.studentId || 'Roll No'})</option>
                ))}
                {users.filter(u => u.role === 'Student' && u.department === selectedDept).length === 0 && (
                  <option value="">No Students loaded in {selectedDept}</option>
                )}
              </select>
            </div>
          )}

        </div>
      )}

      {/* SUMMARY STATS GRID */}
      {scope === 'global' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Sponsored Grants Revenue', val: `Rs. ${(globalStats?.kpis.grantsRevenue || 0).toLocaleString()}`, icon: Landmark, color: 'text-primary bg-primary-light' },
            { label: 'Consultancy Revenues', val: `Rs. ${(globalStats?.kpis.consultancyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-success bg-green-50' },
            { label: 'Accredited Publications', val: globalStats?.kpis.publications || 0, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
            { label: 'Verified Internships', val: globalStats?.kpis.internships || 0, icon: Briefcase, color: 'text-warning bg-amber-50' }
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Publications Logged', val: graphicalReportData.totals.publications, icon: BookOpen, color: 'text-primary bg-primary-light' },
            { label: 'Patents Registered', val: graphicalReportData.totals.patents, icon: BadgeIcon, color: 'text-warning bg-amber-50' },
            { label: 'Grants Logged', val: graphicalReportData.totals.grants, icon: Landmark, color: 'text-purple-600 bg-purple-50' },
            { label: 'FDP Programs', val: graphicalReportData.totals.fdps, icon: Clock, color: 'text-success bg-green-50' },
            { label: 'Student Achievements', val: graphicalReportData.totals.studentAchievements, icon: GraduationCap, color: 'text-slate-600 bg-slate-100' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{item.label}</span>
                  <div className={`rounded-lg p-1 ${item.color}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <h2 className="text-lg font-black text-slate-800 mt-2">{item.val}</h2>
              </div>
            );
          })}
        </div>
      )}

      {/* GRAPHIC REPRESENTATIONS (VISUAL CHARTS DECK) */}
      {scope === 'global' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Institutional revenue trend */}
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

          {/* Placements comparative chart */}
          {globalStats && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900 text-sm">Placements Comparative Audit</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified placement offers count across major departments</p>
              <div className="h-72 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalStats.charts.placementsByDept} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Distribution by type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Activity Type Distribution</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Activity classification share of selected entity</p>
            </div>
            
            <div className="h-64 mt-4 w-full flex items-center justify-center">
              {graphicalReportData.typeData.length === 0 ? (
                <div className="text-xs text-slate-400 font-medium">No activity data available for selected criteria</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphicalReportData.typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graphicalReportData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Audit Verification status distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Accreditation Audit Verification Rates</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Distribution of approval status for logged items</p>
            </div>
            
            <div className="h-64 mt-4 w-full">
              {entityItems.length === 0 ? (
                <div className="text-xs text-slate-400 font-medium flex h-full items-center justify-center">No audit logs available for selected criteria</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphicalReportData.statusData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="value" name="Records Count" fill="#28A745" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* DYNAMIC REPORTS LISTING GRID */}
      {scope !== 'global' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Detailed Dossier Logs ({entityItems.length} records resolved)
            </h3>
            
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
            >
              Export Report to PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold text-[10px]">Status</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Title</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Category</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Type</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Owner / Submitter</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Details</th>
                  <th className="py-3.5 px-4 font-bold text-[10px]">Date Logged</th>
                  <th className="py-3.5 px-4 font-bold text-[10px] text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {entityItems.map(item => {
                  let statusClass = '';
                  let statusLabel = '';
                  if (item.verificationStatus === 'Pending') {
                    statusClass = 'bg-amber-50 text-warning border-amber-200/60';
                    statusLabel = 'For Approval';
                  } else if (item.verificationStatus === 'HOD_Approved') {
                    statusClass = 'bg-blue-50 text-primary border-blue-200/60';
                    statusLabel = 'HOD Approved';
                  } else if (item.verificationStatus === 'IQAC_Approved') {
                    statusClass = 'bg-green-50 text-success border-green-200/60';
                    statusLabel = 'Approved';
                  } else if (item.verificationStatus === 'Rejected') {
                    statusClass = 'bg-red-50 text-danger border-red-200/60';
                    statusLabel = 'Rejected';
                  }

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{item.category}</td>
                      <td className="py-3 px-4 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{item.type}</td>
                      <td className="py-3 px-4 text-slate-600 font-bold">{item.ownerName}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={item.details}>{item.details}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{item.date}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => { setSelectedGridItem(item); setIsDetailDrawerOpen(true); }}
                          className="p-1 rounded text-primary hover:bg-primary/5 transition border border-primary/10"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {entityItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400 text-xs font-medium">
                      No matching dossier logs found. Try changing selection filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLOAT INSPECTION DETAIL DRAWER */}
      {isDetailDrawerOpen && selectedGridItem && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDetailDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
              
              {/* Header */}
              <div className="px-6 py-5 bg-primary-dark text-white flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold truncate pr-3 max-w-[300px]" title={selectedGridItem.title}>
                    Inspect: {selectedGridItem.title}
                  </h2>
                  <p className="text-[10px] text-primary-light/70 font-light mt-0.5">Submitted by {selectedGridItem.ownerName}</p>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-primary text-primary-light">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                
                {/* Status Block */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Verification status</span>
                    <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">{selectedGridItem.verificationStatus}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Academic Year</span>
                    <span className="font-bold text-slate-800">{getAcademicYearFromDate(selectedGridItem.rawDate)}</span>
                  </div>
                  {selectedGridItem.rejectionReason && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-danger rounded-lg p-3 text-xs">
                      <strong>Rejection reason:</strong> {selectedGridItem.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Details</h3>
                  <div className="space-y-2 font-medium">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Category:</span>
                      <span className="text-slate-800 font-bold">{selectedGridItem.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Activity Type:</span>
                      <span className="text-slate-800 font-bold uppercase">{selectedGridItem.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-800 font-bold">{selectedGridItem.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Details Metadata:</span>
                      <span className="text-slate-800 text-right max-w-[200px] truncate" title={selectedGridItem.details}>{selectedGridItem.details}</span>
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supportive Documents</h3>
                  <div className="space-y-2">
                    {selectedGridItem.attachments && selectedGridItem.attachments.map((att, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200/60 p-2.5 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className="text-primary shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate" title={att.name}>{att.name}</span>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black hover:bg-primary/20 transition"
                        >
                          View
                        </a>
                      </div>
                    ))}

                    {(!selectedGridItem.attachments || selectedGridItem.attachments.length === 0) && (
                      <div className="text-center text-slate-400 py-6 font-medium">
                        No documents uploaded as supportive evidence.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrincipalDashboard;
