import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Shield, Building, Award, KeyRound, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

export const Profile = () => {
  const { user, token, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [srcImage, setSrcImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handlePhotoSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSrcImage(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCropComplete = async (croppedFile) => {
    setIsCropModalOpen(false);
    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('files', croppedFile);

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
        if (data && data.length > 0) {
          setProfilePhoto(data[0].url);
          setSuccess('Profile photo uploaded! Save changes to apply.');
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to upload photo');
      }
    } catch (err) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name,
        email,
        profilePhoto
      };
      if (password) {
        payload.password = password;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage/context user object
      setUser(data.user);
      setSuccess('Profile updated successfully!');
      setPassword(''); // Clear password field
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-primary h-6 w-6" /> User Profile Setting
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage your personal credentials, profile picture, and view institutional assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide self-start">Profile Photo</h2>
          
          <div className="relative group">
            <div className="h-32 w-32 rounded-full border-4 border-primary/10 overflow-hidden flex items-center justify-center bg-primary/5 shadow-md">
              {profilePhoto ? (
                <img src={profilePhoto} alt="User Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-primary">{user?.name?.charAt(0)}</span>
              )}
            </div>
            
            <label htmlFor="photo-upload-input" className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark shadow-md transition-all duration-200 group-hover:scale-105">
              <Upload size={16} />
            </label>
            <input 
              type="file" 
              id="photo-upload-input" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoSelected}
              disabled={uploading || isCropModalOpen}
            />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
            <span className="inline-block text-[10px] text-primary font-bold bg-primary-light px-2.5 py-0.5 rounded-full mt-2">
              {user?.role}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal max-w-[200px]">
            PNG, JPG, or JPEG allowed. Recommended square aspect ratio.
          </p>
        </div>

        {/* Profile Settings form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Edit Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-xs font-semibold text-danger flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Institutional Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sece.ac.in"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Department - Read Only */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department (Read-Only)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Building size={14} />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user?.department || ''}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role - Read Only */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Institutional Role (Read-Only)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Shield size={14} />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user?.role || ''}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ID - Read Only */}
              {user?.role === 'Student' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Roll / Student ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Award size={14} />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={user?.studentId || ''}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {user?.role === 'Faculty' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Faculty ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Award size={14} />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={user?.facultyId || ''}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Academic Year - Read Only */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Academic Year</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Award size={14} />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user?.academicYear || ''}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">New Password (Leave blank to keep current)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound size={14} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark focus:outline-none transition duration-150 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
      {isCropModalOpen && (
        <CropModal 
          src={srcImage} 
          onClose={() => setIsCropModalOpen(false)} 
          onCropComplete={handleCropComplete} 
        />
      )}
    </div>
  );
};

const CropModal = ({ src, onClose, onCropComplete }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
  }, [src]);

  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const canvasSize = 256;
    
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    let dw, dh;
    const imgRatio = imgElement.width / imgElement.height;
    if (imgRatio > 1) {
      dh = canvasSize;
      dw = canvasSize * imgRatio;
    } else {
      dw = canvasSize;
      dh = canvasSize / imgRatio;
    }

    dw = dw * zoom;
    dh = dh * zoom;

    const dx = (canvasSize - dw) / 2 + offset.x;
    const dy = (canvasSize - dh) / 2 + offset.y;

    ctx.save();
    ctx.drawImage(imgElement, dx, dy, dw, dh);
    
    // Circular mask
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.rect(0, 0, canvasSize, canvasSize);
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 4, 0, Math.PI * 2, true);
    ctx.fill();

    // Circle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [imgElement, zoom, offset]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCrop = () => {
    if (!imgElement) return;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 400;
    exportCanvas.height = 400;
    const ctx = exportCanvas.getContext('2d');

    const canvasSize = 256;
    let dw, dh;
    const imgRatio = imgElement.width / imgElement.height;
    if (imgRatio > 1) {
      dh = canvasSize;
      dw = canvasSize * imgRatio;
    } else {
      dw = canvasSize;
      dh = canvasSize / imgRatio;
    }

    dw = dw * zoom;
    dh = dh * zoom;

    const dx = (canvasSize - dw) / 2 + offset.x;
    const dy = (canvasSize - dh) / 2 + offset.y;

    const scaleFactor = 400 / 256;
    
    ctx.drawImage(
      imgElement, 
      dx * scaleFactor, 
      dy * scaleFactor, 
      dw * scaleFactor, 
      dh * scaleFactor
    );

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped-profile.jpg', { type: 'image/jpeg' });
        onCropComplete(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2">Adjust Profile Photo</h3>
        <p className="text-[10px] text-slate-500 mb-4 font-medium">Position your image correctly in the circle frame.</p>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative border border-slate-200 rounded-full overflow-hidden shadow-inner bg-slate-50">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="cursor-move block"
            />
          </div>
          
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
          >
            Apply & Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
