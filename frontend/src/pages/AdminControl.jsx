import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFormSuccess } from '../context/FormSuccessContext.jsx';
import { 
  Settings, PlusCircle, Trash2, Edit, RefreshCw, Info, Check, Save, ToggleLeft, ArrowRight
} from 'lucide-react';

export const AdminControl = () => {
  const { token } = useAuth();
  const { showSuccess } = useFormSuccess();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'forms'
  
  const [usersList, setUsersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Load departments first to populate user form select fields
      const [resDepts, resUsers] = await Promise.all([
        fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (resDepts.ok) {
        const depts = await resDepts.json();
        setDepartmentsList(depts);
        if (depts.length > 0 && !department) {
          setDepartment(depts[0].code);
        }
      }

      if (resUsers.ok) {
        setUsersList(await resUsers.json());
      }
    } catch (e) {
      console.error('Failed to load admin workspace:', e);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadData();
    setFormError('');
    setFormSuccess('');
    clearUserForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

      showSuccess(isEditing ? `User account ${email} updated successfully!` : `User account ${email} created successfully!`, isEditing ? 'Account Updated!' : 'Account Created!');
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-primary h-6 w-6" /> User & Form Administration Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage user accounts, credentials, and customize dynamic form templates.
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

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'users' 
              ? 'bg-white text-primary shadow' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'forms' 
              ? 'bg-white text-primary shadow' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Form Configurator
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column Form */}
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

          {/* Right Column List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Users List</h2>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {usersList.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No user accounts found.</div>
              ) : (
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
              )}
            </div>
          </div>

        </div>
      ) : (
        <FormConfiguratorConsole token={token} />
      )}
    </div>
  );
};

// Form Customizer Panel component
const FormConfiguratorConsole = ({ token }) => {
  const { showSuccess } = useFormSuccess();
  const [formName, setFormName] = useState('FacultyActivity');
  const [categories, setCategories] = useState([]);
  const [proofMethods, setProofMethods] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local states for inputs
  const [newCategory, setNewCategory] = useState('');
  const [newProofMethod, setNewProofMethod] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/form-config/${formName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setProofMethods(data.proofMethods || []);
        setFields(data.fields || []);
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to load form config');
      }
    } catch (err) {
      console.error(err);
      setError('Form configuration not initialized yet. It will seed on backend restart or you can create one by clicking Save below.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formName, token]);

  const handleSaveConfig = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/form-config/${formName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories, proofMethods, fields })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save form config');
      showSuccess('Form configuration successfully saved and synchronized!', 'Config Synchronized!');
      setSuccess('Form configuration successfully saved and synchronized!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('Category already exists!');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const addProofMethod = () => {
    const trimmed = newProofMethod.trim();
    if (!trimmed) return;
    if (proofMethods.includes(trimmed)) {
      alert('Proof method already exists!');
      return;
    }
    setProofMethods([...proofMethods, trimmed]);
    setNewProofMethod('');
  };

  const removeProofMethod = (method) => {
    setProofMethods(proofMethods.filter(m => m !== method));
  };

  const addCustomField = () => {
    if (!fieldKey.trim() || !fieldLabel.trim()) {
      alert('Please fill out both key and label.');
      return;
    }
    // Clean identifier key
    const cleanKey = fieldKey.trim().replace(/\s+/g, '');
    if (fields.some(f => f.name === cleanKey)) {
      alert('A field with this identifier key already exists!');
      return;
    }

    const newField = {
      name: cleanKey,
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      options: fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : []
    };

    setFields([...fields, newField]);
    setFieldKey('');
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
  };

  const removeCustomField = (name) => {
    setFields(fields.filter(f => f.name !== name));
  };

  return (
    <div className="space-y-6">
      
      {/* Config Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
          <Info className="text-primary" size={16} /> Choose Academic Form template
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Select which activity submission form fields, attachments, and categories you wish to design.
        </p>
        <div className="max-w-xs">
          <select
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-primary focus:outline-none"
          >
            <option value="FacultyActivity">Faculty Activities Form</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg bg-danger/10 p-3 text-xs font-bold text-danger">{error}</div>}
      {success && <div className="rounded-lg bg-success/10 p-3 text-xs font-bold text-success flex items-center gap-2"><Check size={16} /> {success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Categories Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Form Categories / Type Selections</h3>
          <p className="text-xs text-slate-400 mb-4 font-medium">Add or remove categories mapped directly to academic and research logs.</p>
          
          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-lg text-xs">
                <span className="font-semibold text-slate-700">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="text-danger hover:bg-danger/5 p-1 rounded transition">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {categories.length === 0 && <div className="text-center py-8 text-xs text-slate-400 font-medium">No custom categories specified.</div>}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Webinar, Seminar"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
            <button onClick={addCategory} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition flex items-center gap-1 shadow-sm">
              Add
            </button>
          </div>
        </div>

        {/* Proof Methods Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-fit">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Proof Attachment Methods</h3>
          <p className="text-xs text-slate-400 mb-4 font-medium">Configure allowed file tags that users use when presenting supportive evidence.</p>
          
          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
            {proofMethods.map((method, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-lg text-xs">
                <span className="font-semibold text-slate-700">{method}</span>
                <button onClick={() => removeProofMethod(method)} className="text-danger hover:bg-danger/5 p-1 rounded transition">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {proofMethods.length === 0 && <div className="text-center py-8 text-xs text-slate-400 font-medium">No file tags defined.</div>}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Invitation Card, Letter"
              value={newProofMethod}
              onChange={(e) => setNewProofMethod(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
            <button onClick={addProofMethod} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition flex items-center gap-1 shadow-sm">
              Add
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic Custom Fields Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Custom Form Fields</h3>
        <p className="text-xs text-slate-400 mb-4 font-medium">Design additional input fields that faculty will be prompted to fill out on submission.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Custom Fields List */}
          <div className="lg:col-span-2 space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {fields.map((field, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    <span className="text-[9px] font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">{field.type}</span>
                    {field.required && <span className="text-[9px] font-bold bg-danger/10 text-danger px-1.5 py-0.5 rounded">Required</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Database identifier: {field.name}</p>
                  {field.type === 'select' && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.options?.map((opt, oIdx) => (
                        <span key={oIdx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 font-medium">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeCustomField(field.name)} className="text-danger hover:bg-danger/5 p-1.5 rounded border border-danger/10 bg-white shadow-sm transition" title="Delete Field">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-16 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl font-medium">
                No custom fields configured. Faculty will see standard fields only.
              </div>
            )}
          </div>

          {/* Add Custom Field Form */}
          <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-3 h-fit">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Custom Field</h4>
            
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Identifier Key (No spaces, alphanumeric)</label>
              <input
                type="text"
                placeholder="e.g. venue"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Label</label>
              <input
                type="text"
                placeholder="e.g. Event Venue"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-primary"
                >
                  <option value="text">Short Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date picker</option>
                  <option value="select">Dropdown Select</option>
                </select>
              </div>
              <div className="flex items-center pt-4 pl-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Required</span>
                </label>
              </div>
            </div>

            {fieldType === 'select' && (
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Options (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. AICTE, DST, Internal"
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <button
              type="button"
              onClick={addCustomField}
              className="w-full rounded-lg bg-slate-800 text-white font-bold py-2 text-xs hover:bg-slate-700 transition flex items-center justify-center gap-1"
            >
              Add Field to list <ArrowRight size={12} />
            </button>
          </div>

        </div>
      </div>

      {/* Main Save Action */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSaveConfig}
          disabled={loading}
          className="rounded-xl bg-primary text-white font-bold px-6 py-3 text-xs hover:bg-primary-dark transition shadow-md flex items-center gap-1.5"
        >
          <Save size={15} /> {loading ? 'Saving...' : 'Save Form Configuration'}
        </button>
      </div>
    </div>
  );
};

export default AdminControl;
