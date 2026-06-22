import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, BookOpen, Award, Calendar, 
  Building2, FileText, Shield, Settings, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    const role = user.role;
    
    if (role === 'Admin') {
      return [
        { name: 'User Management', path: '/', icon: Settings }
      ];
    }

    const items = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ];

    if (role !== 'Student' && role !== 'Principal') {
      items.push(
        { name: 'Faculty Dev', path: '/faculty-activities', icon: Award },
        { name: 'Research Tracker', path: '/research-tracker', icon: BookOpen },
        { name: 'Events & Outreach', path: '/events-outreach', icon: Calendar },
        { name: 'Industry Interaction', path: '/industry-interaction', icon: Building2 }
      );
    }

    if (role !== 'Principal') {
      items.push({ name: 'Student achievements', path: '/student-achievements', icon: Award });
    }

    if (role === 'IQAC' || role === 'HOD') {
      items.push({ name: 'Accreditation & IQAC', path: '/accreditation-iqac', icon: Shield });
    }

    if (role !== 'Student') {
      items.push({ name: 'Reports Portal', path: '/reports', icon: FileText });
    }

    return items;
  };

  const navItems = getNavItems();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-primary-dark text-white transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:relative lg:flex`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-primary/20 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src="/OIP.jpeg" 
              alt="Logo" 
              className="h-10 w-10 shrink-0 rounded-lg object-cover" 
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight tracking-wider">FSAIS PORTAL</span>
                <span className="text-[10px] text-primary-light/70 font-light">Sri Eshwar College</span>
              </div>
            )}
          </div>
          <button 
            onClick={toggleCollapse}
            className="hidden rounded-lg p-1.5 hover:bg-primary lg:block text-primary-light"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-accent text-primary-dark font-semibold' 
                    : 'text-primary-light/80 hover:bg-primary hover:text-white'}`}
              >
                <Icon 
                  size={20} 
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-105
                    ${isActive ? 'text-primary-dark' : 'text-primary-light/70 group-hover:text-white'}`} 
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 hidden rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-primary/20 p-4">
          {!isCollapsed ? (
            <div className="flex flex-col rounded-lg bg-primary/20 p-3">
              <span className="text-xs text-primary-light/60">Logged in as</span>
              <span className="font-semibold text-sm truncate">{user.name}</span>
              <span className="text-[10px] text-accent font-medium leading-normal bg-accent/15 px-2 py-0.5 rounded mt-1.5 self-start">
                {user.role}
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse"></div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
