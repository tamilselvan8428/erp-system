import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFormSuccess } from '../context/FormSuccessContext.jsx';
import { 
  BookOpen, Award, Landmark, PlusCircle, Trash2, 
  Calendar, FileText, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { EvidenceViewer } from '../components/EvidenceViewer.jsx';

export const ResearchTracker = () => {
  const { user, token } = useAuth();
  const { showSuccess } = useFormSuccess();
  const [activeTab, setActiveTab] = useState('publications'); // 'publications', 'patents', 'grants'
  
  // Data lists
  const [publications, setPublications] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grants, setGrants] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Publication Form Fields
  const [pubType, setPubType] = useState('Journal');
  const [pubTitle, setPubTitle] = useState('');
  const [pubName, setPubName] = useState(''); // journal or conference name
  const [pubIssn, setPubIssn] = useState('');
  const [pubPublisher, setPubPublisher] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [pubDoi, setPubDoi] = useState('');
  const [pubImpact, setPubImpact] = useState('');
  const [pubIndexing, setPubIndexing] = useState('Scopus'); // comma sep or select
  
  // 2. Patent Form Fields
  const [patTitle, setPatTitle] = useState('');
  const [patAppNo, setPatAppNo] = useState('');
  const [patFilingDate, setPatFilingDate] = useState('');
  const [patStatus, setPatStatus] = useState('Filed');
  const [patCountry, setPatCountry] = useState('India');

  // 3. Grant Form Fields
  const [grantType, setGrantType] = useState('Research Grant');
  const [grantTitle, setGrantTitle] = useState('');
  const [grantAgency, setGrantAgency] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantYears, setGrantYears] = useState(1);
  const [grantStart, setGrantStart] = useState('');
  const [grantEnd, setGrantEnd] = useState('');
  const [grantStatus, setGrantStatus] = useState('Ongoing');

  // Upload lists
  const [pubAttachments, setPubAttachments] = useState([]);
  const [patAttachments, setPatAttachments] = useState([]);
  const [grantAttachments, setGrantAttachments] = useState([]);

  const loadData = async () => {
    try {
      if (activeTab === 'publications') {
        const res = await fetch('/api/research/publications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setPublications(await res.json());
      } else if (activeTab === 'patents') {
        const res = await fetch('/api/research/patents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setPatents(await res.json());
      } else if (activeTab === 'grants') {
        const res = await fetch('/api/research/grants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setGrants(await res.json());
      }
    } catch (e) {
      console.error('Failed to load research data:', e);
    }
  };

  useEffect(() => {
    loadData();
    setFormError('');
    setFormSuccess('');
  }, [activeTab, token]);

  const handlePubSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);
    try {
      const indexingArr = pubIndexing.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/research/publications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: pubType,
          title: pubTitle,
          journalConferenceName: pubName,
          issnIsbn: pubIssn,
          publisher: pubPublisher,
          publicationDate: pubDate,
          doi: pubDoi,
          impactFactor: pubImpact ? Number(pubImpact) : undefined,
          indexing: indexingArr,
          attachments: pubAttachments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit failed');
      
      showSuccess('Publication logged successfully and routed for approval.', 'Publication Logged!');
      setFormSuccess('Publication logged successfully and routed for approval.');
      setPubTitle('');
      setPubName('');
      setPubIssn('');
      setPubPublisher('');
      setPubDate('');
      setPubDoi('');
      setPubImpact('');
      setPubAttachments([]);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/research/patents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: patTitle,
          applicationNumber: patAppNo,
          filingDate: patFilingDate,
          status: patStatus,
          country: patCountry,
          attachments: patAttachments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit failed');
      
      showSuccess('Patent registered successfully and routed for approval.', 'Patent Registered!');
      setFormSuccess('Patent registered successfully and routed for approval.');
      setPatTitle('');
      setPatAppNo('');
      setPatFilingDate('');
      setPatAttachments([]);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/research/grants', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: grantType,
          title: grantTitle,
          fundingAgency: grantAgency,
          amountSanctioned: Number(grantAmount),
          durationYears: Number(grantYears),
          startDate: grantStart,
          endDate: grantEnd,
          status: grantStatus,
          attachments: grantAttachments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit failed');
      
      showSuccess('Grant/Consultancy project logged successfully.', 'Project Logged!');
      setFormSuccess('Grant/Consultancy project logged successfully.');
      setGrantTitle('');
      setGrantAgency('');
      setGrantAmount('');
      setGrantYears(1);
      setGrantStart('');
      setGrantEnd('');
      setGrantAttachments([]);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (endpoint, id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`${endpoint}/${id}`, {
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
            <BookOpen className="text-primary h-6 w-6" /> Research & Academic Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage your publications, registered patents, external funding grants, and consultancy revenues.
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} /> Refresh tab
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'publications', label: 'Publications', icon: BookOpen },
          { id: 'patents', label: 'Patents & IP', icon: Award },
          { id: 'grants', label: 'Grants & Consultancy', icon: Landmark }
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
        
        {/* Forms column (Only for Faculty) */}
        {user?.role === 'Faculty' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <PlusCircle size={16} className="text-primary" /> Log Entry
            </h2>

            {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger mb-4">{formError}</div>}
            {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success mb-4">{formSuccess}</div>}

            {activeTab === 'publications' && (
              <form onSubmit={handlePubSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Publication Type</label>
                  <select value={pubType} onChange={(e) => setPubType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Journal">Journal</option>
                    <option value="Conference">Conference</option>
                    <option value="Book">Book</option>
                    <option value="Book Chapter">Book Chapter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Title</label>
                  <input type="text" required placeholder="Title of publication" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Journal/Conference Name</label>
                  <input type="text" required placeholder="Journal/Conf name" value={pubName} onChange={(e) => setPubName(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">ISSN/ISBN</label>
                    <input type="text" placeholder="ISSN/ISBN no" value={pubIssn} onChange={(e) => setPubIssn(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Publisher</label>
                    <input type="text" placeholder="Springer, IEEE, etc." value={pubPublisher} onChange={(e) => setPubPublisher(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Pub Date</label>
                    <input type="date" required value={pubDate} onChange={(e) => setPubDate(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Impact Factor</label>
                    <input type="number" step="0.01" placeholder="e.g. 5.12" value={pubImpact} onChange={(e) => setPubImpact(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">DOI</label>
                  <input type="text" placeholder="e.g. 10.1109/..." value={pubDoi} onChange={(e) => setPubDoi(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Indexing (Comma separated)</label>
                  <input type="text" placeholder="Scopus, Web of Science" value={pubIndexing} onChange={(e) => setPubIndexing(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <EvidenceViewer attachments={pubAttachments} onChange={setPubAttachments} label="Upload Publication Evidence" />
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Submit Publication</button>
              </form>
            )}

            {activeTab === 'patents' && (
              <form onSubmit={handlePatSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Patent Title</label>
                  <input type="text" required placeholder="e.g. IoT Smart Irrigation Controller" value={patTitle} onChange={(e) => setPatTitle(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Application Number</label>
                  <input type="text" required placeholder="e.g. 202541012345 A" value={patAppNo} onChange={(e) => setPatAppNo(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Filing Date</label>
                    <input type="date" required value={patFilingDate} onChange={(e) => setPatFilingDate(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Country</label>
                    <input type="text" value={patCountry} onChange={(e) => setPatCountry(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Patent Status</label>
                  <select value={patStatus} onChange={(e) => setPatStatus(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Filed">Filed</option>
                    <option value="Published">Published</option>
                    <option value="Granted">Granted</option>
                  </select>
                </div>
                <EvidenceViewer attachments={patAttachments} onChange={setPatAttachments} label="Upload Patent Evidence/Doc" />
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Register Patent</button>
              </form>
            )}

            {activeTab === 'grants' && (
              <form onSubmit={handleGrantSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Project Type</label>
                  <select value={grantType} onChange={(e) => setGrantType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Research Grant">Research Grant</option>
                    <option value="Consultancy">Consultancy Revenue</option>
                    <option value="Seed Money">Seed Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Project Title</label>
                  <input type="text" required placeholder="Project title" value={grantTitle} onChange={(e) => setGrantTitle(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Funding Agency / Client</label>
                  <input type="text" required placeholder="e.g. AICTE, DST, Zoho Corp" value={grantAgency} onChange={(e) => setGrantAgency(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Amount Sanctioned (INR)</label>
                    <input type="number" required placeholder="INR Amount" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Duration (Years)</label>
                    <input type="number" required value={grantYears} onChange={(e) => setGrantYears(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                    <input type="date" required value={grantStart} onChange={(e) => setGrantStart(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
                    <input type="date" required value={grantEnd} onChange={(e) => setGrantEnd(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Project Status</label>
                  <select value={grantStatus} onChange={(e) => setGrantStatus(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <EvidenceViewer attachments={grantAttachments} onChange={setGrantAttachments} label="Upload Grant/Project Proofs" />
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Log Grant Project</button>
              </form>
            )}
          </div>
        )}

        {/* List Grid */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${user?.role === 'Faculty' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4 capitalize">{activeTab} List</h2>
          
          <div className="space-y-4">
            {/* 1. Publications Display */}
            {activeTab === 'publications' && (
              publications.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No publications logged yet.</div> : (
                publications.map(p => (
                  <div key={p._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{p.title}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-medium">
                          <span className="text-primary font-bold">{p.type}</span>
                          <span>•</span>
                          <span>{p.journalConferenceName}</span>
                          <span>•</span>
                          <span className="text-slate-400">IF: {p.impactFactor || 0}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.indexing?.map((ind, i) => (
                            <span key={i} className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-medium">{ind}</span>
                          ))}
                        </div>
                        {p.attachments && p.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 border-t border-slate-100 pt-2">
                            {p.attachments.map((att, idx) => (
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
                        {p.rejectionReason && p.verificationStatus === 'Rejected' && (
                          <div className="mt-3 flex items-start gap-1 rounded bg-danger/5 p-2 text-[10px] text-danger border border-danger/10">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span><strong>Audit:</strong> {p.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                          ${p.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                            p.verificationStatus === 'HOD_Approved' ? 'bg-primary-light text-primary' : 
                            p.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                          {p.verificationStatus}
                        </span>
                        {user?.role === 'Faculty' && (p.verificationStatus === 'Pending' || p.verificationStatus === 'Rejected') && (
                          <button onClick={() => handleDelete('/api/research/publications', p._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* 2. Patents Display */}
            {activeTab === 'patents' && (
              patents.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No patents registered yet.</div> : (
                patents.map(p => (
                  <div key={p._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{p.title}</span>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-medium">
                          <span className="text-warning font-bold">App: {p.applicationNumber}</span>
                          <span>•</span>
                          <span>Country: {p.country}</span>
                          <span>•</span>
                          <span>Filed: {new Date(p.filingDate).toLocaleDateString()}</span>
                        </div>
                        {p.attachments && p.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 border-t border-slate-100 pt-2">
                            {p.attachments.map((att, idx) => (
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
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-warning-light text-warning border border-warning/10">{p.status}</span>
                        {user?.role === 'Faculty' && (p.verificationStatus === 'Pending' || p.verificationStatus === 'Rejected') && (
                          <button onClick={() => handleDelete('/api/research/patents', p._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* 3. Grants Display */}
            {activeTab === 'grants' && (
              grants.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No grant projects logged yet.</div> : (
                grants.map(g => (
                  <div key={g._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{g.title}</span>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-medium">
                          <span className="text-purple-600 font-bold">{g.type}</span>
                          <span>•</span>
                          <span>Agency: {g.fundingAgency}</span>
                          <span>•</span>
                          <span className="text-slate-700">Amount: ₹{g.amountSanctioned?.toLocaleString()}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Duration: {g.durationYears} Years ({new Date(g.startDate).toLocaleDateString()} to {new Date(g.endDate).toLocaleDateString()})</p>
                        {g.attachments && g.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 border-t border-slate-100 pt-2">
                            {g.attachments.map((att, idx) => (
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
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">{g.status}</span>
                        {user?.role === 'Faculty' && (g.verificationStatus === 'Pending' || g.verificationStatus === 'Rejected') && (
                          <button onClick={() => handleDelete('/api/research/grants', g._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
                        )}
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
export default ResearchTracker;
