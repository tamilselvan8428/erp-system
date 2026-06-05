import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Settings, Users, ShieldAlert, PlusCircle, Trash2, Edit,
  RefreshCw, Landmark, CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';

export const AdminControl = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'departments', 'audits'
  
  const [usersList, setUsersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // User Form fields
  const [editingUserId, setEditingUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Faculty');
  const [department, setDepartment] = useState('CSE');
  const [designation, setDesignation] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Department Form fields
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Always load departments first to populate user form select fields
      const resDepts = await fetch('/api/admin/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resDepts.ok) {
        const depts = await resDepts.json();
        setDepartmentsList(depts);
        if (depts.length > 0 && !department) {
          setDepartment(depts[0].code);
        }
      }

      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setUsersList(await res.json());
      } else if (activeTab === 'departments') {
        // Already fetched above, but sync data lists
      } else if (activeTab === 'audits') {
        const res = await fetch('/api/admin/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error('Failed to load admin workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFormError('');
    setFormSuccess('');
    clearUserForm();
    clearDeptForm();
  }, [activeTab, token]);

  const clearUserForm = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Faculty');
    setDesignation('');
    setStudentId('');
    setFacultyId('');
  };

  const clearDeptForm = () => {
    setDeptName('');
    setDeptCode('');
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const isEditing = !!editingUserId;
      const url = isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        name,
        email,
        role,
        department,
        designation,
        studentId: role === 'Student' ? studentId : undefined,
        facultyId: role !== 'Student' ? facultyId : undefined,
        academicYear
      };

      // Only include password if creating, or if modifying and password isn't blank
      if (!isEditing || (password && password.trim() !== '')) {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setFormSuccess(isEditing ? `User account ${email} updated successfully!` : `User account ${email} created successfully!`);
      clearUserForm();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setDepartment(user.department);
    setDesignation(user.designation || '');
    setStudentId(user.studentId || '');
    setFacultyId(user.facultyId || '');
    setAcademicYear(user.academicYear || '2025-2026');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFormSuccess('User deleted successfully.');
        loadData();
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: deptName, code: deptCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add department');

      setFormSuccess(`Department ${deptCode.toUpperCase()} added successfully!`);
      clearDeptForm();
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFormSuccess('Department deleted successfully.');
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
            <Settings className="text-primary h-6 w-6" /> Institutional Administration Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage user accounts, add/remove academic departments, and audit security log modifications in real-time.
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync view
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'departments', label: 'Department Manager', icon: Landmark },
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
        
        {/* Left Column Forms */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> 
              {editingUserId ? 'Edit User Account' : 'Create User Account'}
            </h2>

            <form onSubmit={handleUserSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name</label>
                <input type="text" required placeholder="e.g. Dr. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email Address</label>
                <input type="email" required placeholder="name@sece.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Password {editingUserId && <span className="text-[9px] text-slate-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input type="password" required={!editingUserId} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
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
                    {departmentsList.map(d => (
                      <option key={d._id} value={d.code}>{d.code}</option>
                    ))}
                    {departmentsList.length === 0 && <option value="CSE">CSE</option>}
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

              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">
                  {editingUserId ? 'Update Account' : 'Create Account'}
                </button>
                {editingUserId && (
                  <button type="button" onClick={clearUserForm} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> Create Department
            </h2>

            <form onSubmit={handleDeptSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department Code</label>
                <input type="text" required placeholder="e.g. AIDS, CSBS" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department Full Name</label>
                <input type="text" required placeholder="e.g. Artificial Intelligence & Data Science" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <button type="submit" className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Add Department</button>
            </form>
          </div>
        )}

        {/* Right Column Lists */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${activeTab === 'audits' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4 capitalize">{activeTab} List</h2>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            
            {/* Users list */}
            {activeTab === 'users' && (
              usersList.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No user accounts found.</div> : (
                usersList.map(u => (
                  <div key={u._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{u.name}</span>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">{u.role}</span>
                        <span>•</span>
                        <span>{u.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditClick(u)} className="text-primary hover:bg-primary-light/50 p-1.5 rounded transition border border-primary/20 bg-white" title="Edit Properties"><Edit size={12} /></button>
                      <button onClick={() => handleDeleteUser(u._id)} className="text-danger hover:bg-danger/5 p-1.5 rounded transition border border-danger/10 bg-white" title="Delete User"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Departments list */}
            {activeTab === 'departments' && (
              departmentsList.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No departments configured.</div> : (
                departmentsList.map(d => (
                  <div key={d._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{d.code}</span>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{d.name}</p>
                    </div>
                    <button onClick={() => handleDeleteDept(d._id)} className="text-danger hover:bg-danger/5 p-1.5 rounded transition border border-danger/10 bg-white" title="Delete Department"><Trash2 size={12} /></button>
                  </div>
                ))
              )
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
