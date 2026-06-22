import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFormSuccess } from '../context/FormSuccessContext.jsx';
import { 
  Award, PlusCircle, Trash2, Calendar, 
  RefreshCw, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import { EvidenceViewer } from '../components/EvidenceViewer.jsx';

export const StudentAchievements = () => {
  const { user, token } = useAuth();
  const { showSuccess } = useFormSuccess();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [type, setType] = useState('Internship');
  const [title, setTitle] = useState('');
  const [org, setOrg] = useState('');
  const [details, setDetails] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [attachments, setAttachments] = useState([]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formConfig, setFormConfig] = useState(null);
  const [customFields, setCustomFields] = useState({});

  const loadAchievements = async () => {
    try {
      const res = await fetch('/api/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAchievements(await res.json());
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
  };

  const loadFormConfig = async () => {
    try {
      const res = await fetch('/api/admin/form-config/StudentAchievement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormConfig(data);
        if (data.categories && data.categories.length > 0) {
          setType(data.categories[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load form config:', err);
    }
  };

  useEffect(() => {
    loadAchievements();
    loadFormConfig();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          title,
          organization: org,
          details,
          dateOccurred,
          attachments: attachments,
          customFields
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit entry');

      showSuccess('Achievement logged successfully! Sent to department for verification.', 'Achievement Logged!');
      setFormSuccess('Achievement logged successfully! Sent to department for verification.');
      setTitle('');
      setOrg('');
      setDetails('');
      setDateOccurred('');
      setAttachments([]);
      setCustomFields({});
      loadAchievements();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/student/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadAchievements();
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
            <Award className="text-primary h-6 w-6" /> Student Placement & Achievements
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Log and review student internship offers, core placements, co-curricular contest wins, and global certification badges.
          </p>
        </div>
        <button 
          onClick={loadAchievements}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Refresh list
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Container */}
        {(user?.role === 'Student' || user?.role === 'Faculty' || user?.role === 'Admin') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> Log Student Achievement
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Achievement Category</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                  {formConfig?.categories?.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  )) || (
                    <>
                      <option value="Internship">Internship Offer</option>
                      <option value="Placement Offer">Placement Career Offer</option>
                      <option value="Co-curricular Prize">Co-curricular Contest Win</option>
                      <option value="Certification">External Certification</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Activity Title / Role</label>
                <input type="text" required placeholder="e.g. Frontend Intern or 1st Place Smart Hackathon" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Organization / Recruiter</label>
                <input type="text" required placeholder="e.g. Zoho Corporation or IIT Bombay" value={org} onChange={(e) => setOrg(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Date Occurred</label>
                <input type="date" required value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Key Details (Stipend, salary, award, etc.)</label>
                <input type="text" placeholder="e.g. Stipend: Rs. 20,000/month or Cash Prize: Rs. 50,000" value={details} onChange={(e) => setDetails(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <EvidenceViewer attachments={attachments} onChange={setAttachments} label="Upload Placement Offer / Certificate / Photos" proofMethods={formConfig?.proofMethods || []} />

              {/* Dynamic Custom Fields */}
              {formConfig?.fields?.map((field, idx) => {
                const value = customFields[field.name] || '';
                const handleFieldChange = (val) => {
                  setCustomFields({ ...customFields, [field.name]: val });
                };

                return (
                  <div key={idx}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      {field.label} {field.required && <span className="text-danger">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={value}
                        required={field.required}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Select option --</option>
                        {field.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        required={field.required}
                        value={value}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                      />
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        required={field.required}
                        value={value}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        required={field.required}
                        value={value}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Submit Achievement</button>
            </form>
          </div>
        )}

        {/* List Container */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${user?.role === 'Student' || user?.role === 'Faculty' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Achievements Registry ({achievements.length})</h2>

          <div className="space-y-4">
            {achievements.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No achievements logged yet.</div> : (
              achievements.map(ach => (
                <div key={ach._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{ach.title}</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{ach.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{ach.organization} • {ach.details}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[9px] text-slate-400 font-medium">
                        <span>Student: {ach.studentName} ({ach.department})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> Date: {new Date(ach.dateOccurred).toLocaleDateString()}</span>
                      </div>
                      {ach.customFields && Object.keys(ach.customFields).length > 0 && (
                        <div className="mt-2 bg-slate-100/80 p-2 rounded-lg text-[10px] space-y-1 max-w-lg border border-slate-200/50">
                          {Object.keys(ach.customFields).map(key => {
                            const fConfig = formConfig?.fields?.find(f => f.name === key);
                            const label = fConfig ? fConfig.label : key;
                            return (
                              <div key={key} className="flex gap-1.5">
                                <span className="font-bold text-slate-500">{label}:</span>
                                <span className="text-slate-800 font-medium">{ach.customFields[key]}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {ach.attachments && ach.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 border-t border-slate-100 pt-2">
                          {ach.attachments.map((att, idx) => (
                            <a 
                              key={idx}
                              href={att.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[9px] font-bold text-primary border border-primary/20 px-2 py-0.5 rounded bg-white hover:bg-primary-light/30 transition max-w-[150px] truncate"
                              title={att.name}
                            >
                              <FileText size={10} className="shrink-0" /> {att.name || `Proof ${idx + 1}`}
                            </a>
                          ))}
                        </div>
                      )}
                      {ach.rejectionReason && ach.verificationStatus === 'Rejected' && (
                        <div className="mt-3 flex items-start gap-1 rounded bg-danger/5 p-2 text-[10px] text-danger border border-danger/10">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span><strong>Feedback:</strong> {ach.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                        ${ach.verificationStatus === 'HOD_Approved' || ach.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                          ach.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                        {ach.verificationStatus === 'HOD_Approved' || ach.verificationStatus === 'IQAC_Approved' ? 'Verified' : ach.verificationStatus}
                      </span>
                      {((user?.role === 'Student' && ach.studentId === String(user._id)) || user?.role === 'Admin') && (ach.verificationStatus === 'Pending' || ach.verificationStatus === 'Rejected') && (
                        <button onClick={() => handleDelete(ach._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
                      )}
                    </div>
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
export default StudentAchievements;
