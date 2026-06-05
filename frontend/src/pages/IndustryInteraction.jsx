import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Building2, PlusCircle, Trash2, Mail, 
  Calendar, RefreshCw, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';

export const IndustryInteraction = () => {
  const { user, token } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [type, setType] = useState('MoU');
  const [orgName, setOrgName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [validityEndDate, setValidityEndDate] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/industry', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLinks(await res.json());
      }
    } catch (e) {
      console.error('Failed to load industry links:', e);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/industry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          organizationName: orgName,
          contactPerson,
          contactEmail,
          dateOccurred,
          validityEndDate: type === 'MoU' ? validityEndDate : undefined,
          description,
          attachments: [{ name: 'MoU Document', url: '/uploads/sample-cert.pdf' }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit entry');

      setFormSuccess('Industry interaction logged successfully and routed for approval.');
      setOrgName('');
      setContactPerson('');
      setContactEmail('');
      setDateOccurred('');
      setValidityEndDate('');
      setDescription('');
      loadLinks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/industry/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadLinks();
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
            <Building2 className="text-primary h-6 w-6" /> Industry Collaboration & MoUs
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Register and manage active Memorandum of Understanding (MoUs), corporate collaborations, and industrial student training links.
          </p>
        </div>
        <button 
          onClick={loadLinks}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Refresh list
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Container */}
        {user?.role === 'Faculty' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> Log Industry Collaboration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Link Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                  <option value="MoU">MoU (Agreement)</option>
                  <option value="Industrial Visit">Industrial Visit</option>
                  <option value="Guest Lecture">Industry Guest Lecture</option>
                  <option value="Placement Partner">Placement Collaboration</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Company / Organization Name</label>
                <input type="text" required placeholder="e.g. Zoho Corporation" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Contact Person</label>
                  <input type="text" required placeholder="Name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Contact Email</label>
                  <input type="email" required placeholder="email@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Signing / Commencement Date</label>
                <input type="date" required value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              {type === 'MoU' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">MoU Validity End Date</label>
                  <input type="date" required value={validityEndDate} onChange={(e) => setValidityEndDate(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description / Notes</label>
                <textarea placeholder="e.g. Internships and research collaboration terms" value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" rows="2" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Log Industry Link</button>
            </form>
          </div>
        )}

        {/* List Container */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${user?.role === 'Faculty' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Active Partnerships & Logs ({links.length})</h2>

          <div className="space-y-4">
            {links.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No industry collaborations registered yet.</div> : (
              links.map(link => (
                <div key={link._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{link.organizationName}</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{link.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{link.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[9px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Mail size={10} /> {link.contactPerson} ({link.contactEmail})</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> Commencement: {new Date(link.dateOccurred).toLocaleDateString()}</span>
                        {link.validityEndDate && (
                          <span className="font-bold">Expires: {new Date(link.validityEndDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {link.rejectionReason && link.verificationStatus === 'Rejected' && (
                        <div className="mt-3 flex items-start gap-1 rounded bg-danger/5 p-2 text-[10px] text-danger border border-danger/10">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span><strong>Comment:</strong> {link.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex gap-2 items-center">
                        {link.type === 'MoU' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${link.status === 'Active' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>{link.status}</span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                          ${link.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                            link.verificationStatus === 'HOD_Approved' ? 'bg-primary-light text-primary' : 
                            link.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                          {link.verificationStatus}
                        </span>
                      </div>
                      {user?.role === 'Faculty' && (link.verificationStatus === 'Pending' || link.verificationStatus === 'Rejected') && (
                        <button onClick={() => handleDelete(link._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
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
export default IndustryInteraction;
