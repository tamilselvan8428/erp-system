import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Login } from './pages/Login.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';

import FacultyDashboard from './pages/Dashboards/FacultyDashboard.jsx';
import HODDashboard from './pages/Dashboards/HODDashboard.jsx';
import IQACDashboard from './pages/Dashboards/IQACDashboard.jsx';
import PrincipalDashboard from './pages/Dashboards/PrincipalDashboard.jsx';
import StudentDashboard from './pages/Dashboards/StudentDashboard.jsx';

// Import sub-pages
import FacultyActivities from './pages/FacultyActivities.jsx';
import ResearchTracker from './pages/ResearchTracker.jsx';
import EventsOutreach from './pages/EventsOutreach.jsx';
import IndustryInteraction from './pages/IndustryInteraction.jsx';
import StudentAchievements from './pages/StudentAchievements.jsx';
import AccreditationIqac from './pages/AccreditationIqac.jsx';
import ReportsPortal from './pages/ReportsPortal.jsx';
import AdminControl from './pages/AdminControl.jsx';

// Component to handle redirection to correct dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Student':
      return <StudentDashboard />;
    case 'Faculty':
      return <FacultyDashboard />;
    case 'HOD':
      return <HODDashboard />;
    case 'IQAC':
    case 'Admin':
      return <IQACDashboard />;
    case 'Principal':
      return <PrincipalDashboard />;
    default:
      return (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center max-w-md mx-auto mt-12">
          <h2 className="font-bold text-danger text-lg">Access Mismatch</h2>
          <p className="text-xs text-slate-600 mt-2">
            No dashboard matches the role: <strong>{user.role}</strong>
          </p>
        </div>
      );
  }
};

// Main layout frame with navigation drawer
const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<DashboardRouter />} />
            <Route path="/faculty-activities" element={<FacultyActivities />} />
            <Route path="/research-tracker" element={<ResearchTracker />} />
            <Route path="/events-outreach" element={<EventsOutreach />} />
            <Route path="/industry-interaction" element={<IndustryInteraction />} />
            <Route path="/student-achievements" element={<StudentAchievements />} />
            <Route path="/accreditation-iqac" element={<AccreditationIqac />} />
            <Route path="/reports" element={<ReportsPortal />} />
            <Route path="/admin" element={<AdminControl />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
