import React, { useState } from 'react';
import { FileUp, Eye, Trash2, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const EvidenceViewer = ({ attachments = [], onChange, label = "Evidence Documents" }) => {
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        // Auto-increment version if attachment with same name is uploaded
        const nextList = [...attachments];
        const dupIdx = nextList.findIndex(a => a.name.toLowerCase() === file.name.toLowerCase());
        
        if (dupIdx >= 0) {
          const prevVer = nextList[dupIdx].version || 1;
          nextList[dupIdx] = {
            name: file.name,
            url: data.url,
            version: prevVer + 1,
            uploadedAt: new Date().toISOString()
          };
        } else {
          nextList.push({
            name: file.name,
            url: data.url,
            version: 1,
            uploadedAt: new Date().toISOString()
          });
        }
        onChange(nextList);
      } else {
        const err = await res.json();
        alert(err.message || 'File upload rejected by server.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (index) => {
    const nextList = attachments.filter((_, i) => i !== index);
    onChange(nextList);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</h3>
      
      {/* File List */}
      <div className="space-y-2 mb-4">
        {attachments.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 p-4 justify-center text-xs text-slate-400">
            <AlertCircle size={16} />
            No documents uploaded yet. Add certificates, reports, or circulars as evidence.
          </div>
        ) : (
          attachments.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary-light text-primary font-bold text-[10px]">
                  {item.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-medium text-slate-800 truncate block">{item.name}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                    <span className="flex items-center gap-0.5 font-bold text-primary bg-primary-light/50 px-1 rounded">
                      <History size={8} /> v{item.version || 1}
                    </span>
                    <span>•</span>
                    <span>{new Date(item.uploadedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="rounded p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                  title="View Document"
                >
                  <Eye size={15} />
                </a>
                <button 
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="rounded p-1 hover:bg-danger/10 text-slate-400 hover:text-danger transition"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload button wrapper */}
      <div className="relative">
        <input 
          type="file" 
          id="evidence-file-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <button
          type="button"
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary px-4 py-3 text-xs font-semibold text-primary transition hover:bg-primary-light/30
            ${uploading ? 'animate-pulse pointer-events-none' : ''}`}
        >
          <FileUp size={16} />
          {uploading ? 'Processing Document...' : 'Upload Document Evidence'}
        </button>
      </div>
    </div>
  );
};
