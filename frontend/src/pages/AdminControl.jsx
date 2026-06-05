import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Settings, Users, ShieldAlert, PlusCircle, Trash2, 
  RefreshCw, KeyRound, Mail, UserCheck
} from 'lucide-react';

export const AdminControl = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'audits'
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Faculty');
  const [department, setDepartment] = useState('CSE');
  const [designation, setDesignation] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setUsersList(await res.json());
      } else if (activeTab === 'audits') {
        const res = await fetch('/api/admin/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error('Failed to load admin controls:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFormError('');
    setFormSuccess('');
  }, [activeTab, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
          designation,
          studentId: role === 'Student' ? studentId : undefined,
          facultyId: role !== 'Student' ? facultyId : undefined,
          academicYear
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Create user failed');

      setFormSuccess(`User ${email} created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      setDesignation('');
      setStudentId('');
      setFacultyId('');
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-primary h-6 w-6" /> Admin Control Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage institutional users, roles, departments, security profiles, and inspect system audit trail actions.
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh view
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'audits', label: 'Audit Trail Logs', icon: ShieldAlert }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition
                ${activeTab === t.id 
                  ? 'border-primary text-primary font-black' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Container (Only in users tab) */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> Create User Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name</label>
                <input type="text" required placeholder="Dr. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email Address</label>
                <input type="email" required placeholder="name@sece.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Password</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">System Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">HOD</option>
                    <option value="IQAC">IQAC</option>
                    <option value="Principal">Principal</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="IT">IT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Designation</label>
                <input type="text" placeholder="e.g. Associate Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              {role === 'Student' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Student Roll Number</label>
                  <input type="text" placeholder="e.g. 22CS001" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Faculty ID Code</label>
                  <input type="text" placeholder="e.g. SECE-FAC-099" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Create Account</button>
            </form>
          </div>
        )}

        {/* List Grid */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${activeTab === 'users' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4 capitalize">{activeTab} Details</h2>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            
            {/* Users log display */}
            {activeTab === 'users' && (
              usersList.map(u => (
                <div key={u._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{u.name}</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span>{u.email}</span>
                      <span>•</span>
                      <span className="text-primary font-bold">{u.role}</span>
                      <span>•</span>
                      <span>{u.department}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteUser(u._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
                </div>
              ))
            )}

            {/* Audit Logs list */}
            {activeTab === 'audits' && (
              auditLogs.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No audits found. Make some edits or approvals to see trail updates.</div> : (
                auditLogs.map(a => (
                  <div key={a._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{a.action}</span>
                          <span className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-bold uppercase">{a.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 font-medium">{a.details}</p>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">User: {a.userEmail} • Time: {new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
export default AdminControl;
