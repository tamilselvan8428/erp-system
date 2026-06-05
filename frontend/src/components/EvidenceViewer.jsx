import React, { useState } from 'react';
import { FileUp, FolderUp, Eye, Trash2, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const EvidenceViewer = ({ attachments = [], onChange, label = "Evidence Documents" }) => {
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // Append all selected files to 'files' field
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json(); // Expecting array of { name, url, type }
        
        const nextList = [...attachments];
        data.forEach(file => {
          const dupIdx = nextList.findIndex(a => a.name.toLowerCase() === file.name.toLowerCase());
          
          if (dupIdx >= 0) {
            const prevVer = nextList[dupIdx].version || 1;
            nextList[dupIdx] = {
              name: file.name,
              url: file.url,
              version: prevVer + 1,
              uploadedAt: new Date().toISOString()
            };
          } else {
            nextList.push({
              name: file.name,
              url: file.url,
              version: 1,
              uploadedAt: new Date().toISOString()
            });
          }
        });
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

  const handleFilesChange = (e) => {
    uploadFiles(e.target.files);
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
            No documents uploaded yet. Add certificates, reports, or photos as evidence.
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
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input 
            type="file" 
            id="evidence-files-input"
            multiple
            className="hidden"
            onChange={handleFilesChange}
            disabled={uploading}
          />
          <label
            htmlFor="evidence-files-input"
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-light/30 cursor-pointer
              ${uploading ? 'animate-pulse pointer-events-none opacity-50' : ''}`}
          >
            <FileUp size={14} />
            {uploading ? 'Processing...' : 'Upload Files'}
          </label>
        </div>

        <div className="relative flex-1">
          <input 
            type="file" 
            id="evidence-folder-input"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFilesChange}
            disabled={uploading}
          />
          <label
            htmlFor="evidence-folder-input"
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-secondary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-secondary-light/30 cursor-pointer
              ${uploading ? 'animate-pulse pointer-events-none opacity-50' : ''}`}
          >
            <FolderUp size={14} />
            {uploading ? 'Processing...' : 'Upload Folder'}
          </label>
        </div>
      </div>
    </div>
  );
};
