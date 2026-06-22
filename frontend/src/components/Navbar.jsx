import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Bell, LogOut, Menu, User, UserCheck, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ onMobileToggle }) => {
  const { user, logout, login } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleQuickSwitch = async (role) => {
    const email = `${role.toLowerCase()}@sece.ac.in`;
    try {
      await login(email, 'Password123');
      setIsSwitchOpen(false);
      navigate('/');
    } catch (err) {
      alert(`Demo user switch failed. Ensure backend seeders are loaded: ${err.message}`);
    }
  };

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif._id);
    setIsNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6 no-print">
      
      {/* Mobile Drawer Trigger & Brand Name */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMobileToggle}
          className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden text-slate-600"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:flex flex-col">
          <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Sri Eshwar College of Engineering</span>
          <span className="text-[10px] text-primary font-medium">One Platform. Real-Time Updates. Reliable Data. Stronger Institution.</span>
        </div>
        <div className="md:hidden font-bold text-primary text-sm tracking-wide">FSAIS</div>
      </div>

      {/* Control Area */}
      <div className="flex items-center gap-4">
        
        {/* DEV MODE QUICK SWITCHER */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsSwitchOpen(!isSwitchOpen);
              setIsProfileOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent/30 transition duration-150"
          >
            <UserCheck size={14} />
            <span className="hidden sm:inline">Role Switcher</span>
          </button>
          
          {isSwitchOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-lg bg-white p-2 shadow-xl border border-slate-200 z-50">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Demo Persona</div>
              <div className="grid grid-cols-1 gap-1">
                {['Student', 'Faculty', 'HOD', 'IQAC', 'Principal', 'Admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleQuickSwitch(role)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-xs text-left hover:bg-slate-50 transition duration-100
                      ${user.role === role ? 'text-primary font-bold bg-primary/5' : 'text-slate-700'}`}
                  >
                    <span>{role} Dashboard</span>
                    {user.role === role && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS BELL */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
              setIsSwitchOpen(false);
            }}
            className="relative rounded-full p-2 hover:bg-slate-100 text-slate-600 transition"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
                <span className="text-xs font-semibold">Notifications ({unreadCount} unread)</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded font-bold transition duration-150"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex w-full flex-col text-left p-3 hover:bg-slate-50 transition duration-150
                        ${!notif.readStatus ? 'bg-primary-light/30 border-l-2 border-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900">{notif.title}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="bg-slate-50 p-2 text-center border-t border-slate-100 flex items-center justify-between px-3">
                <span className="text-[9px] text-slate-400 font-semibold uppercase">End of Alerts</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] text-primary hover:text-primary-dark font-black tracking-wider hover:underline transition duration-150"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE DRIVER */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
              setIsSwitchOpen(false);
            }}
            className="flex items-center gap-2 rounded-full p-1.5 hover:bg-slate-100 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm overflow-hidden border border-slate-200 shadow-sm">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white p-2 shadow-xl border border-slate-200 z-50">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                <p className="text-[9px] text-primary font-medium leading-none mt-1">{user.department} Department</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  <User size={14} />
                  Profile
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-danger hover:bg-danger/5 transition font-medium"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
