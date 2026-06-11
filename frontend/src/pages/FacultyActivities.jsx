import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Award, Calendar, Clock, PlusCircle, Trash2, 
  AlertTriangle, CheckCircle, Info, RefreshCw, FileText,
  Filter, Check, X, Search, ChevronDown, Eye, HelpCircle,
  FileCheck, Shield, BookOpen, Download, HelpCircle as HelpIcon
} from 'lucide-react';
import { EvidenceViewer } from '../components/EvidenceViewer.jsx';

export const FacultyActivities = () => {
  const { user, token } = useAuth();
  
  // All loaded datasets
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Selection / Detail panels state
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('documents'); // 'documents', 'participants', 'outcomes'
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters selection states (Set is excellent for multi-select checkboxes)
  const [selectedYears, setSelectedYears] = useState(new Set());
  const [selectedDepts, setSelectedDepts] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedEventNames, setSelectedEventNames] = useState(new Set());
  
  // Controls for drawer & modal
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [itemToReject, setItemToReject] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Logging Form State
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

  const [formConfig, setFormConfig] = useState(null);
  const [customFields, setCustomFields] = useState({});

  // Utility to determine academic year
  const getAcademicYearFromDate = (dateString) => {
    if (!dateString) return '2025-2026';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '2025-2026';
    const month = d.getMonth(); // 0-indexed (5 = June)
    const year = d.getFullYear();
    return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  // Maps backend schemas to a unified visual representation
  const normalizeItem = (item, modelType) => {
    let academicYear = '';
    let category = '';
    let eventName = '';
    let title = item.title || '';
    let authors = '';
    let role = item.role || 'Coordinator';
    let publisherInfo = '';
    let identityNumber = '';
    let submittedDate = '';
    let detailsText = '';
    let authorPosition = 'First';

    if (modelType === 'faculty') {
      academicYear = getAcademicYearFromDate(item.startDate);
      category = 'Faculty Development';
      eventName = item.type === 'FDP' ? 'Faculty Dev Program' : 
                  item.type === 'STTP' ? 'Short Term Training' : 
                  item.type === 'Workshop' ? 'Workshop Attended' : 
                  item.type === 'Online Course' ? 'Online Course Completed' : 
                  item.type === 'Resource Person' ? 'Resource Person Invite' : item.type;
      authors = item.facultyName || '';
      role = item.role || 'Participant';
      publisherInfo = item.organizer || '';
      submittedDate = item.startDate;
      detailsText = `${item.role} at ${item.organizer} for ${item.duration} days`;
    } else if (modelType === 'publication') {
      academicYear = getAcademicYearFromDate(item.publicationDate);
      category = 'Research (CFRD)';
      eventName = item.type === 'Journal' ? 'Journal Publication' : 
                  item.type === 'Conference' ? 'Conference Publication' : 
                  item.type === 'Book' ? 'Book Publication' : 'Book Chapter Publication';
      authors = item.authorName || '';
      if (item.coAuthors && item.coAuthors.length > 0) {
        authors += ` (with ${item.coAuthors.join(', ')})`;
        authorPosition = 'Second / Co-author';
      }
      publisherInfo = item.journalConferenceName || '';
      if (item.publisher) publisherInfo += ` [${item.publisher}]`;
      identityNumber = item.issnIsbn || '';
      submittedDate = item.publicationDate;
      detailsText = `Indexing: ${item.indexing?.join(', ') || 'None'}. IF: ${item.impactFactor || 0}`;
    } else if (modelType === 'patent') {
      academicYear = getAcademicYearFromDate(item.filingDate);
      category = 'Research (CFRD)';
      eventName = 'Patent Registration';
      authors = item.inventorName || '';
      if (item.coInventors && item.coInventors.length > 0) {
        authors += ` (with ${item.coInventors.join(', ')})`;
      }
      publisherInfo = item.country || 'India';
      identityNumber = item.applicationNumber || '';
      submittedDate = item.filingDate;
      detailsText = `Patent Status: ${item.status || 'Filed'}`;
    } else if (modelType === 'grant') {
      academicYear = getAcademicYearFromDate(item.startDate);
      category = 'Research (CFRD)';
      eventName = item.type === 'Research Grant' ? 'Funded Research Project Submission' : 
                  item.type === 'Consultancy' ? 'Consultancy Project' : 'Seed Money Grant';
      authors = item.investigatorName || '';
      publisherInfo = item.fundingAgency || '';
      identityNumber = item.fundingAgency || '';
      submittedDate = item.startDate;
      detailsText = `INR ₹${item.amountSanctioned?.toLocaleString()} for ${item.durationYears} yrs`;
    } else if (modelType === 'event') {
      academicYear = getAcademicYearFromDate(item.startDate);
      category = 'Events Organized';
      eventName = `Organized ${item.type}`;
      authors = item.organizerName || '';
      publisherInfo = item.venue || '';
      submittedDate = item.startDate;
      detailsText = `Venue: ${item.venue}. Budget: ₹${item.budgetSpent?.toLocaleString()}`;
    }

    return {
      _id: item._id,
      title,
      category,
      eventName,
      authors,
      authorPosition,
      department: item.department || '',
      publisherInfo,
      identityNumber,
      submittedDate: submittedDate ? new Date(submittedDate).toLocaleDateString() : 'N/A',
      rawDate: submittedDate || item.createdAt,
      academicYear,
      verificationStatus: item.verificationStatus || 'Pending',
      rejectionReason: item.rejectionReason || '',
      attachments: item.attachments || [],
      detailsText,
      role,
      originalModel: modelType,
      originalData: item,
      customFields: item.customFields || {}
    };
  };

  // Load all data sources in parallel
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resFac, resPub, resPat, resGra, resEve] = await Promise.all([
        fetch('/api/faculty', { headers }),
        fetch('/api/research/publications', { headers }),
        fetch('/api/research/patents', { headers }),
        fetch('/api/research/grants', { headers }),
        fetch('/api/events', { headers })
      ]);

      let facultyArr = [];
      let publicationArr = [];
      let patentArr = [];
      let grantArr = [];
      let eventArr = [];

      if (resFac.ok) facultyArr = await resFac.json();
      if (resPub.ok) publicationArr = await resPub.json();
      if (resPat.ok) patentArr = await resPat.json();
      if (resGra.ok) grantArr = await resGra.json();
      if (resEve.ok) eventArr = await resEve.json();

      const combined = [
        ...facultyArr.map(x => normalizeItem(x, 'faculty')),
        ...publicationArr.map(x => normalizeItem(x, 'publication')),
        ...patentArr.map(x => normalizeItem(x, 'patent')),
        ...grantArr.map(x => normalizeItem(x, 'grant')),
        ...eventArr.map(x => normalizeItem(x, 'event'))
      ];

      // Sort by rawDate descending
      combined.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      
      setAllItems(combined);

      // Auto select first item if present
      if (combined.length > 0) {
        setSelectedItem(combined[0]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to fetch unified activity records.');
    } finally {
      setLoading(false);
    }
  };

  const loadFormConfig = async () => {
    try {
      const res = await fetch('/api/admin/form-config/FacultyActivity', {
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
    loadData();
    loadFormConfig();
  }, [token]);

  // Compute counts for the filter deck dynamically based on ALL items
  const filterCounts = (() => {
    const counts = {
      years: {},
      depts: {},
      categories: {},
      events: {}
    };

    allItems.forEach(item => {
      // Academic year counts
      counts.years[item.academicYear] = (counts.years[item.academicYear] || 0) + 1;
      // Department counts
      counts.depts[item.department] = (counts.depts[item.department] || 0) + 1;
      // Category counts
      counts.categories[item.category] = (counts.categories[item.category] || 0) + 1;
      // Event name counts
      counts.events[item.eventName] = (counts.events[item.eventName] || 0) + 1;
    });

    return counts;
  })();

  // Filter items matching checkable boxes & query search
  const filteredItems = allItems.filter(item => {
    const matchesYear = selectedYears.size === 0 || selectedYears.has(item.academicYear);
    const matchesDept = selectedDepts.size === 0 || selectedDepts.has(item.department);
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(item.category);
    const matchesEventName = selectedEventNames.size === 0 || selectedEventNames.has(item.eventName);

    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchesSearch = (
        item.title.toLowerCase().includes(q) ||
        item.authors.toLowerCase().includes(q) ||
        item.publisherInfo.toLowerCase().includes(q) ||
        item.eventName.toLowerCase().includes(q)
      );
    }

    return matchesYear && matchesDept && matchesCategory && matchesEventName && matchesSearch;
  });

  // Handle filter selection toggles
  const toggleFilter = (type, value) => {
    let nextSet;
    if (type === 'year') {
      nextSet = new Set(selectedYears);
      nextSet.has(value) ? nextSet.delete(value) : nextSet.add(value);
      setSelectedYears(nextSet);
    } else if (type === 'dept') {
      nextSet = new Set(selectedDepts);
      nextSet.has(value) ? nextSet.delete(value) : nextSet.add(value);
      setSelectedDepts(nextSet);
    } else if (type === 'category') {
      nextSet = new Set(selectedCategories);
      nextSet.has(value) ? nextSet.delete(value) : nextSet.add(value);
      setSelectedCategories(nextSet);
    } else if (type === 'eventName') {
      nextSet = new Set(selectedEventNames);
      nextSet.has(value) ? nextSet.delete(value) : nextSet.add(value);
      setSelectedEventNames(nextSet);
    }
  };

  const clearFilters = () => {
    setSelectedYears(new Set());
    setSelectedDepts(new Set());
    setSelectedCategories(new Set());
    setSelectedEventNames(new Set());
    setSearchQuery('');
  };

  // Submit new FDP activity
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setActionLoading(true);

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
          attachments,
          customFields
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to log activity');
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
      setCustomFields({});
      setIsDrawerOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete logged entry
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this "${item.title}"?`)) return;
    
    let url = '';
    if (item.originalModel === 'faculty') url = `/api/faculty/${item._id}`;
    else if (item.originalModel === 'publication') url = `/api/research/publications/${item._id}`;
    else if (item.originalModel === 'patent') url = `/api/research/patents/${item._id}`;
    else if (item.originalModel === 'grant') url = `/api/research/grants/${item._id}`;
    else if (item.originalModel === 'event') url = `/api/events/${item._id}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
        if (selectedItem?._id === item._id) setSelectedItem(null);
      } else {
        const err = await res.json();
        alert(`Delete failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Verify/Approve Actions
  const handleVerify = async (item, status, reason = '') => {
    setActionLoading(true);
    let url = '';
    if (item.originalModel === 'faculty') url = `/api/faculty/${item._id}/verify`;
    else if (item.originalModel === 'publication') url = `/api/research/publications/${item._id}/verify`;
    else if (item.originalModel === 'patent') url = `/api/research/patents/${item._id}/verify`;
    else if (item.originalModel === 'grant') url = `/api/research/grants/${item._id}/verify`;
    else if (item.originalModel === 'event') url = `/api/events/${item._id}/verify`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejectionReason: reason })
      });

      if (res.ok) {
        setShowRejectDialog(false);
        setRejectionComment('');
        setItemToReject(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(`Approval change failed: ${err.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to determine printable classes
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CARD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-primary h-6 w-6" /> Master Activities & Accreditation Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Filter, search, audit, and approve faculty publications, patents, funding grants, FDP programs, and campus events.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh console
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <Download size={14} /> Print Dossier
          </button>

          {user?.role === 'Faculty' && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark transition shadow"
            >
              <PlusCircle size={14} /> Log Activity
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL DECK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print bg-slate-50 p-4 rounded-2xl border border-slate-200">
        
        {/* Academic Year(s) Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            Select Academic Year(s)
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
              {Object.keys(filterCounts.years).length} Options
            </span>
          </span>
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1.5">
            {Object.keys(filterCounts.years).sort().reverse().map(year => (
              <label key={year} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition">
                <div className="flex items-center gap-2 min-w-0">
                  <input 
                    type="checkbox"
                    checked={selectedYears.has(year)}
                    onChange={() => toggleFilter('year', year)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{year}</span>
                </div>
                <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded font-black">
                  {filterCounts.years[year]}
                </span>
              </label>
            ))}
            {Object.keys(filterCounts.years).length === 0 && (
              <div className="text-center text-xs text-slate-400 py-12">No years resolved</div>
            )}
          </div>
        </div>

        {/* Department(s) Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            Select Department(s)
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
              {Object.keys(filterCounts.depts).length} Depts
            </span>
          </span>
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1.5">
            {Object.keys(filterCounts.depts).sort().map(dept => (
              <label key={dept} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition">
                <div className="flex items-center gap-2 min-w-0">
                  <input 
                    type="checkbox"
                    checked={selectedDepts.has(dept)}
                    onChange={() => toggleFilter('dept', dept)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{dept}</span>
                </div>
                <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded font-black">
                  {filterCounts.depts[dept]}
                </span>
              </label>
            ))}
            {Object.keys(filterCounts.depts).length === 0 && (
              <div className="text-center text-xs text-slate-400 py-12">No departments resolved</div>
            )}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            Select Categories
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
              {Object.keys(filterCounts.categories).length} Cats
            </span>
          </span>
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1.5">
            {Object.keys(filterCounts.categories).map(cat => (
              <label key={cat} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition">
                <div className="flex items-center gap-2 min-w-0">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.has(cat)}
                    onChange={() => toggleFilter('category', cat)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{cat}</span>
                </div>
                <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded font-black">
                  {filterCounts.categories[cat]}
                </span>
              </label>
            ))}
            {Object.keys(filterCounts.categories).length === 0 && (
              <div className="text-center text-xs text-slate-400 py-12">No categories resolved</div>
            )}
          </div>
        </div>

        {/* Event Name Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            Choose an Event Name
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
              {Object.keys(filterCounts.events).length} Types
            </span>
          </span>
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1.5">
            {Object.keys(filterCounts.events).sort().map(evName => (
              <label key={evName} className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition">
                <div className="flex items-center gap-2 min-w-0">
                  <input 
                    type="checkbox"
                    checked={selectedEventNames.has(evName)}
                    onChange={() => toggleFilter('eventName', evName)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{evName}</span>
                </div>
                <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded font-black">
                  {filterCounts.events[evName]}
                </span>
              </label>
            ))}
            {Object.keys(filterCounts.events).length === 0 && (
              <div className="text-center text-xs text-slate-400 py-12">No events resolved</div>
            )}
          </div>
        </div>

      </div>

      {/* FILTER RESET HEADER */}
      {(selectedYears.size > 0 || selectedDepts.size > 0 || selectedCategories.size > 0 || selectedEventNames.size > 0) && (
        <div className="flex items-center justify-between bg-primary-light/50 rounded-xl px-4 py-2 text-xs border border-primary/10 no-print">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Filter size={14} className="text-primary" /> Active filters:
            {selectedYears.size > 0 && <span className="bg-white border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">{selectedYears.size} Years</span>}
            {selectedDepts.size > 0 && <span className="bg-white border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">{selectedDepts.size} Depts</span>}
            {selectedCategories.size > 0 && <span className="bg-white border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">{selectedCategories.size} Categories</span>}
            {selectedEventNames.size > 0 && <span className="bg-white border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">{selectedEventNames.size} Event Names</span>}
          </div>
          <button 
            onClick={clearFilters}
            className="text-primary hover:text-primary-dark font-bold underline transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* MASTER EVENTS GRID */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* GRID CONTROLS */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 no-print">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Events Grid ({filteredItems.length} records matched)
          </h2>
          
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search paper title, author, journal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold text-[10px] w-28">Status</th>
                <th className="py-3.5 px-4 font-bold text-[10px] min-w-[200px]">Activity / Paper Title</th>
                <th className="py-3.5 px-4 font-bold text-[10px]">Author(s) / Creator</th>
                <th className="py-3.5 px-4 font-bold text-[10px]">Position</th>
                <th className="py-3.5 px-4 font-bold text-[10px] w-20">Dept</th>
                <th className="py-3.5 px-4 font-bold text-[10px] min-w-[150px]">Host / Journal / Publisher</th>
                <th className="py-3.5 px-4 font-bold text-[10px]">Identity</th>
                <th className="py-3.5 px-4 font-bold text-[10px] w-24">Date</th>
                <th className="py-3.5 px-4 font-bold text-[10px] text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map(item => {
                const isSelected = selectedItem?._id === item._id;
                
                // Status styles mapper
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
                  <tr 
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors duration-150
                      ${isSelected ? 'bg-primary-light/40 border-l-4 border-l-primary' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex flex-col">
                        <span className="line-clamp-2 leading-tight">{item.title}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{item.eventName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap max-w-[150px] truncate" title={item.authors}>
                      {item.authors}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {item.role || item.authorPosition || 'Creator'}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-700">
                      {item.department}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate" title={item.publisherInfo}>
                      {item.publisherInfo || '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {item.identityNumber || '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {item.submittedDate}
                    </td>

                    <td className="py-3 px-4 text-right no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* HOD/IQAC verification controls */}
                        {user?.role === 'HOD' && item.verificationStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(item, 'HOD_Approved')}
                              className="p-1 rounded bg-green-50 text-success border border-green-200 hover:bg-green-100 transition"
                              title="Approve Entry"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => { setItemToReject(item); setShowRejectDialog(true); }}
                              className="p-1 rounded bg-red-50 text-danger border border-red-200 hover:bg-red-100 transition"
                              title="Reject Entry"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}

                        {user?.role === 'IQAC' && item.verificationStatus === 'HOD_Approved' && (
                          <>
                            <button
                              onClick={() => handleVerify(item, 'IQAC_Approved')}
                              className="p-1 rounded bg-green-50 text-success border border-green-200 hover:bg-green-100 transition"
                              title="Final Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => { setItemToReject(item); setShowRejectDialog(true); }}
                              className="p-1 rounded bg-red-50 text-danger border border-red-200 hover:bg-red-100 transition"
                              title="Reject Entry"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}

                        {/* Owner delete permissions */}
                        {user?.role === 'Faculty' && 
                         (item.verificationStatus === 'Pending' || item.verificationStatus === 'Rejected') && 
                         (String(user._id) === item.originalData.facultyId || 
                          String(user._id) === item.originalData.authorId || 
                          String(user._id) === item.originalData.inventorId || 
                          String(user._id) === item.originalData.investigatorId || 
                          String(user._id) === item.originalData.organizerId) && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 rounded text-danger hover:bg-danger/5 transition border border-danger/10"
                            title="Delete Log"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-16 text-slate-400 text-xs font-medium">
                    {loading ? "Syncing data from academic models..." : "No events match current filter deck."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL INSPECTION DECK (BOTTOM DRAWER) */}
      {selectedItem && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* TAB HEADERS */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 justify-between items-center no-print">
            <div className="flex gap-1">
              {[
                { id: 'documents', label: 'View uploaded Supportive documents' },
                { id: 'participants', label: 'View Staff Participants' },
                { id: 'outcomes', label: 'View Student Participants & Outcomes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition
                    ${activeDetailTab === tab.id 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pr-4">
              Inspect: <span className="text-slate-700 font-black">{selectedItem.title.substring(0, 40)}...</span>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="p-6">
            
            {/* Rejection comment display banner */}
            {selectedItem.verificationStatus === 'Rejected' && selectedItem.rejectionReason && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-danger/5 p-4 text-xs text-danger border border-danger/10">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-black uppercase tracking-wider block mb-0.5">Audit Comment (Rejection reason):</span>
                  <span className="font-medium">{selectedItem.rejectionReason}</span>
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeDetailTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proof of Activity / supportive attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedItem.attachments && selectedItem.attachments.map((att, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200/60 p-3 bg-slate-50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary font-bold text-[10px]">
                          {att.name.split('.').pop()?.toUpperCase() || 'DOC'}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-bold text-slate-800 truncate block" title={att.name}>{att.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Uploaded: {new Date(att.uploadedAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a 
                        href={att.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="rounded-lg p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                        title="Download / View"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  ))}

                  {(!selectedItem.attachments || selectedItem.attachments.length === 0) && (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                      No supportive evidence uploaded for this entry.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: STAFF PARTICIPANTS */}
            {activeDetailTab === 'participants' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Details & Academic Roles</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Faculty Creator</span>
                      <span className="font-bold text-slate-800">{selectedItem.authors}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department</span>
                      <span className="font-bold text-slate-800">{selectedItem.department}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Academic Role</span>
                      <span className="font-bold text-slate-800">{selectedItem.role || 'Coordinator / Author'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Submission Model</span>
                      <span className="font-bold text-slate-800 uppercase text-[10px] bg-primary-light text-primary px-1.5 py-0.5 rounded font-black tracking-wide inline-block">{selectedItem.originalModel}</span>
                    </div>
                  </div>

                  {selectedItem.originalData.coAuthors && selectedItem.originalData.coAuthors.length > 0 && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 text-xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Co-Authors</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.originalData.coAuthors.map((author, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">{author}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.originalData.coInventors && selectedItem.originalData.coInventors.length > 0 && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 text-xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Co-Inventors</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.originalData.coInventors.map((inv, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">{inv}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Fields Details */}
                  {selectedItem.customFields && Object.keys(selectedItem.customFields).length > 0 && (
                    <div className="mt-4 border-t border-slate-200/60 pt-3 text-xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Activity Information</span>
                      <div className="grid grid-cols-2 gap-3 bg-white border border-slate-100 p-3 rounded-xl mt-1">
                        {Object.keys(selectedItem.customFields).map((key) => {
                          const fConfig = formConfig?.fields?.find(f => f.name === key);
                          const label = fConfig ? fConfig.label : key;
                          return (
                            <div key={key}>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
                              <span className="font-semibold text-slate-700">{selectedItem.customFields[key] || '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: OUTCOMES / STUDENTS */}
            {activeDetailTab === 'outcomes' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Participation, Budget Allocation & Outcomes</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-2xl">
                  
                  {selectedItem.originalModel === 'event' ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sanctioned Budget</span>
                        <span className="font-bold text-slate-800">₹{selectedItem.originalData.budgetSanctioned?.toLocaleString() || '0'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Budget Spent</span>
                        <span className="font-bold text-slate-800">₹{selectedItem.originalData.budgetSpent?.toLocaleString() || '0'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Target Audience Scope</span>
                        <span className="font-bold text-slate-800">{selectedItem.originalData.targetedAudience || 'Students'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-bold">Total Student Attendees</span>
                        <span className="font-bold text-primary font-black">{selectedItem.originalData.participantsCount || '0'}</span>
                      </div>
                    </div>
                  ) : selectedItem.originalModel === 'grant' ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Amount Granted</span>
                        <span className="font-bold text-slate-800">₹{selectedItem.originalData.amountSanctioned?.toLocaleString() || '0'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Granting Agency</span>
                        <span className="font-bold text-slate-800">{selectedItem.originalData.fundingAgency || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Project Outcomes / Goals</span>
                        <span className="font-medium text-slate-700 block mt-1">{selectedItem.originalData.projectOutcome || 'Outcome details not specified'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-6 font-medium">
                      No detailed student participation or budget parameters exist for this type of activity.
                    </div>
                  )}
                  
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FLOAT LOGGING FORM OVERLAY DRAWER (SLIDE-OVER) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-primary-dark text-white flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-1.5">
                    <PlusCircle size={18} className="text-accent" /> Log Faculty Activity
                  </h2>
                  <p className="text-[10px] text-primary-light/70 font-light mt-0.5">Submit new logs directly to the accreditation workflow</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-primary text-primary-light">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleLogSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-danger/10 p-3 text-xs font-semibold text-danger">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Activity Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {formConfig?.categories?.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                    {!formConfig && (
                      <>
                        <option value="FDP">FDP (Faculty Dev Program)</option>
                        <option value="STTP">STTP (Short Term Training)</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Online Course">Online Course</option>
                        <option value="Resource Person">Resource Person Invite</option>
                      </>
                    )}
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
                  <EvidenceViewer attachments={attachments} onChange={setAttachments} label="Upload Proof / Certificates" proofMethods={formConfig?.proofMethods || []} />
                </div>

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

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-white shadow hover:bg-primary-dark transition"
                  >
                    {actionLoading ? 'Logging...' : 'Submit to HOD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON CUSTOM OVERLAY MODAL */}
      {showRejectDialog && itemToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRejectDialog(false)} />
          
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl relative z-10 p-6 space-y-4">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertTriangle size={18} /> Review Audit: Enter Rejection Comment
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              State the reason why this publication, event, or activity is being rejected. This feedback is sent directly back to the faculty member.
            </p>

            <textarea
              required
              rows="3"
              placeholder="e.g. Missing completion certificate / incorrect publisher ISSN / wrong dates"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
            />

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => { setShowRejectDialog(false); setRejectionComment(''); }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionComment.trim()}
                onClick={() => handleVerify(itemToReject, 'Rejected', rejectionComment)}
                className="px-4 py-1.5 bg-danger text-white rounded-lg text-xs font-bold shadow hover:bg-danger-dark transition"
              >
                {actionLoading ? 'Submitting...' : 'Reject Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyActivities;
