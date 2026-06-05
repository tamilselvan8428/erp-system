import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FileText, Download, RefreshCw, Info, CheckCircle, AlertTriangle
} from 'lucide-react';

export const ReportsPortal = () => {
  const { user, token } = useAuth();
  
  if (user?.role === 'Student') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <AlertTriangle className="text-danger h-12 w-12 animate-bounce" />
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md">
          Students are not authorized to access the institutional Reports Portal. Please contact your department administration if you require any academic reports.
        </p>
      </div>
    );
  }

  const [reportType, setReportType] = useState('faculty');
  const [format, setFormat] = useState('pdf');
  const [department, setDepartment] = useState('CSE');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const url = `/api/reports/export?format=${format}&reportType=${reportType}&department=${department}&academicYear=${academicYear}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Report generation failed');
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${reportType}_report_${academicYear}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
      
      setSuccess('Report generated and downloaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-primary h-6 w-6" /> Institutional Reports Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Generate and export custom compliance reports for NAAC visits, NBA audits, and departmental reviews.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 h-fit">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
            Configure Report Export
          </h2>

          <form onSubmit={handleDownload} className="space-y-4">
            {error && <div className="rounded-lg bg-danger/10 p-2.5 text-xs font-bold text-danger">{error}</div>}
            {success && <div className="rounded-lg bg-success/10 p-2.5 text-xs font-bold text-success">{success}</div>}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Report Target / Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                <option value="faculty">My Academic Performance (Faculty)</option>
                <option value="department">Department Activities Audit</option>
                <option value="research">Research & Publications Summary</option>
                <option value="student">Student Achievements & Placement</option>
                <option value="naac">NAAC Accreditation Audit Trail</option>
                <option value="nba">NBA Indicator Mappings</option>
                <option value="nirf">NIRF Parameters Report</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`py-2 text-xs font-bold rounded-lg border transition
                    ${format === 'pdf' 
                      ? 'border-primary bg-primary-light text-primary' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                >
                  PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('excel')}
                  className={`py-2 text-xs font-bold rounded-lg border transition
                    ${format === 'excel' 
                      ? 'border-primary bg-primary-light text-primary' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                >
                  Excel Spreadsheet
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="IT">IT</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Academic Year</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-primary focus:outline-none">
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Compiling Report...
                </>
              ) : (
                <>
                  <Download size={14} /> Download Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Informative guidelines */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Compliance & Regulatory Exporters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-700 block mb-1">NAAC (Criterion 3 & 6)</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Export verified evidence parameters automatically grouped into sub-indicators 3.4.5, 3.4.3, and 6.3.3. This document contains signatures and auditor logs validating dates and values.
              </p>
            </div>
            
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-700 block mb-1">NBA Self-Assessment Report</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Provides criterion maps that align directly with NBA Criteria 5.4, 5.7, and 10.2, showing placement statistics and faculty development metrics.
              </p>
            </div>
            
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-700 block mb-1">NIRF Data Input Capture</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Calculates total sponsored research funding (FR) and consultancy projects revenue, as well as the FSPD score.
              </p>
            </div>

            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <span className="font-bold text-xs text-slate-700 block mb-1">Annual Performance Reviews</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Generates a clean PDF summing up a single faculty member's achievements, total API score, and monthly closure timestamps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsPortal;
