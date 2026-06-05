import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Award, Calendar, Clock, PlusCircle, Trash2, 
  AlertTriangle, CheckCircle, Info, RefreshCw, FileText
} from 'lucide-react';
import { EvidenceViewer } from '../components/EvidenceViewer.jsx';


export const FacultyActivities = () => {
  const { user, token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [type, setType] = useState('FDP');
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [role, setRole] = useState('Participant');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [attachments, setAttachments] = useState([]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadActivities = async () => {
    try {
      const res = await fetch('/api/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (e) {
      console.error('Failed to load activities:', e);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          title,
          organizer,
          startDate,
          endDate,
          duration: Number(duration),
          role,
          participantsCount: Number(participantsCount),
          attachments: attachments
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit activity');
      }

      setFormSuccess('Activity logged successfully and sent to HOD for review!');
      setTitle('');
      setOrganizer('');
      setStartDate('');
      setEndDate('');
      setDuration(1);
      setRole('Participant');
      setParticipantsCount(0);
      setAttachments([]);
      loadActivities();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      const res = await fetch(`/api/faculty/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadActivities();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-primary h-6 w-6" /> Faculty Development & Activities
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Log and review FDPs, workshops, STTPs, and courses. Approved activities recalculate your API Score automatically.
          </p>
        </div>
        <button 
          onClick={loadActivities}
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
              <PlusCircle size={16} className="text-primary" /> Log New Activity
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-danger/10 p-3 text-xs font-semibold text-danger">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-lg bg-success/10 p-3 text-xs font-semibold text-success">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Activity Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="FDP">FDP (Faculty Dev Program)</option>
                  <option value="STTP">STTP (Short Term Training)</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Online Course">Online Course</option>
                  <option value="Resource Person">Resource Person Invite</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Title / Theme</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cyber Security Trends 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Organizer / Host Institution</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. IIT Madras, NITTTR"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">My Role</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Participant">Participant</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Resource Person">Resource Person</option>
                  </select>
                </div>
              </div>

              {role === 'Coordinator' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Number of Participants</label>
                  <input 
                    type="number"
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <EvidenceViewer attachments={attachments} onChange={setAttachments} label="Upload Proof / Photos / Certificates" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
              >
                {loading ? 'Submitting...' : 'Submit to HOD'}
              </button>
            </form>
          </div>
        )}

        {/* List Container */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${user?.role === 'Faculty' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Activity Log Histoy ({activities.length})</h2>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No logged activity found. Select "Faculty" login to add new items.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-slate-200 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{act.title}</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{act.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {act.organizer} • Role: {act.role}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2.5 text-[9px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(act.startDate).toLocaleDateString()} to {new Date(act.endDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {act.duration} Days</span>
                      </div>
                      
                      {act.rejectionReason && act.verificationStatus === 'Rejected' && (
                        <div className="mt-3 flex items-start gap-1 rounded-lg bg-danger/5 p-2.5 text-[10px] text-danger border border-danger/10">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span><strong>Rejection reason:</strong> {act.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-0 pt-2 sm:pt-0 border-slate-200/50">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded
                        ${act.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                          act.verificationStatus === 'HOD_Approved' ? 'bg-primary-light text-primary' : 
                          act.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                        {act.verificationStatus}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {act.attachments && act.attachments.map((att, idx) => (
                          <a 
                            key={idx}
                            href={att.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[9px] font-bold text-primary border border-primary/20 px-2 py-0.5 rounded bg-white hover:bg-primary-light/30 transition max-w-[120px] truncate"
                            title={att.name}
                          >
                            <FileText size={10} className="shrink-0" /> {att.name || `Proof ${idx + 1}`}
                          </a>
                        ))}

                        {user?.role === 'Faculty' && (act.verificationStatus === 'Pending' || act.verificationStatus === 'Rejected') && (
                          <button 
                            onClick={() => handleDelete(act._id)}
                            className="text-[9px] font-bold text-danger border border-danger/10 hover:bg-danger/5 p-1 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
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
export default FacultyActivities;
