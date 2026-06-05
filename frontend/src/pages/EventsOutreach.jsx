import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Calendar, MapPin, Users, PlusCircle, Trash2, 
  RefreshCw, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';

export const EventsOutreach = () => {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [type, setType] = useState('Workshop');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [internalExternal, setInternalExternal] = useState('Internal');
  const [targetedAudience, setTargetedAudience] = useState('Students');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [budgetSanctioned, setBudgetSanctioned] = useState(0);
  const [budgetSpent, setBudgetSpent] = useState(0);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          title,
          description,
          startDate,
          endDate,
          venue,
          internalExternal,
          targetedAudience,
          participantsCount: Number(participantsCount),
          budgetSanctioned: Number(budgetSanctioned),
          budgetSpent: Number(budgetSpent),
          attachments: [{ name: 'Event Report', url: '/uploads/sample-cert.pdf' }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to log event');

      setFormSuccess('Event logged successfully. HOD review pending.');
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setVenue('');
      setParticipantsCount(0);
      setBudgetSanctioned(0);
      setBudgetSpent(0);
      loadEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadEvents();
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
            <Calendar className="text-primary h-6 w-6" /> Events Coordination & Outreach
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage conferences, guest lectures, hackathons, symposia, and other activities organized by the faculty.
          </p>
        </div>
        <button 
          onClick={loadEvents}
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
              <PlusCircle size={16} className="text-primary" /> Log Organized Event
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{formError}</div>}
              {formSuccess && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{formSuccess}</div>}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Event Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">National/Intl Conference</option>
                  <option value="Symposium">Symposium</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Project Expo">Project Expo</option>
                  <option value="Guest Lecture">Guest Lecture / Seminar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Event Title</label>
                <input type="text" required placeholder="Event theme/title" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                <textarea placeholder="Brief summary of event objectives" value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" rows="2" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Venue</label>
                  <input type="text" required placeholder="Hall / Lab room" value={venue} onChange={(e) => setVenue(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Audience Scope</label>
                  <select value={internalExternal} onChange={(e) => setInternalExternal(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                    <option value="Internal">Internal (Only SECE)</option>
                    <option value="External">External (Inter-college)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Attendees</label>
                  <input type="number" value={participantsCount} onChange={(e) => setParticipantsCount(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Budget (INR)</label>
                  <input type="number" value={budgetSanctioned} onChange={(e) => setBudgetSanctioned(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Spent (INR)</label>
                  <input type="number" value={budgetSpent} onChange={(e) => setBudgetSpent(e.target.value)} className="block w-full rounded-lg border border-slate-300 p-1.5 text-xs focus:border-primary focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition">Log Organized Event</button>
            </form>
          </div>
        )}

        {/* List Container */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${user?.role === 'Faculty' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Events List ({events.length})</h2>

          <div className="space-y-4">
            {events.length === 0 ? <div className="text-center py-12 text-xs text-slate-400">No events logged yet.</div> : (
              events.map(ev => (
                <div key={ev._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{ev.title}</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{ev.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{ev.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[9px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {ev.venue} ({ev.internalExternal})</span>
                        <span className="flex items-center gap-1"><Users size={10} /> {ev.participantsCount} participants</span>
                        <span>Budget: ₹{ev.budgetSpent?.toLocaleString()} spent / ₹{ev.budgetSanctioned?.toLocaleString()} sanctioned</span>
                      </div>
                      {ev.rejectionReason && ev.verificationStatus === 'Rejected' && (
                        <div className="mt-3 flex items-start gap-1 rounded bg-danger/5 p-2.5 text-[10px] text-danger border border-danger/10">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span><strong>Audit comment:</strong> {ev.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                        ${ev.verificationStatus === 'IQAC_Approved' ? 'bg-green-100 text-success' : 
                          ev.verificationStatus === 'HOD_Approved' ? 'bg-primary-light text-primary' : 
                          ev.verificationStatus === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                        {ev.verificationStatus}
                      </span>
                      {user?.role === 'Faculty' && (ev.verificationStatus === 'Pending' || ev.verificationStatus === 'Rejected') && (
                        <button onClick={() => handleDelete(ev._id)} className="text-danger hover:bg-danger/5 p-1 rounded transition border border-danger/10"><Trash2 size={12} /></button>
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
export default EventsOutreach;
