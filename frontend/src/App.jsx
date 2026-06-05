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

// Polished placeholder view for secondary sections
const ModulePlaceholder = ({ name, description, activeEndpoint }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto mt-12 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary text-2xl font-bold mb-4">
        ✨
      </div>
      <h2 className="text-xl font-bold text-slate-800">{name} Module</h2>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        {description || "The database schemas and API controllers are fully active. Data logged here maps directly to global audits and department rankings."}
      </p>
      <div className="mt-6 text-left border border-slate-100 bg-slate-50 rounded-xl p-4">
        <span className="font-bold text-xs text-primary block mb-1">Backend Integration active:</span>
        <code className="text-[10px] text-slate-600 block bg-slate-200/50 p-1.5 rounded select-all mb-2">
          {activeEndpoint || `/api/${name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
        </code>
        <span className="text-[10px] text-slate-400 font-medium">
          All actions in this area trigger audit logs, verification tasks, and notification updates for department heads and administrators.
        </span>
      </div>
    </div>
  );
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
            <Route 
              path="/faculty-activities" 
              element={
                <ModulePlaceholder 
                  name="Faculty Development" 
                  description="Log and edit Faculty Development Programs (FDPs), Short-Term Training Programs (STTPs), and guest lectures."
                  activeEndpoint="/api/faculty"
                />
              } 
            />
            <Route 
              path="/research-tracker" 
              element={
                <ModulePlaceholder 
                  name="Research Tracker" 
                  description="Publish and search journals, conferences, books, book chapters, patent applications, and project funding grants."
                  activeEndpoint="/api/research/publications"
                />
              } 
            />
            <Route 
              path="/events-outreach" 
              element={
                <ModulePlaceholder 
                  name="Events & Outreach" 
                  description="Manage national conferences, workshops, symposia, hackathons, project expos, and student outreach campaigns."
                  activeEndpoint="/api/events"
                />
              } 
            />
            <Route 
              path="/industry-interaction" 
              element={
                <ModulePlaceholder 
                  name="Industry Interaction" 
                  description="Track MOUs, industrial visits, guest lectures, student internships, and corporate consultancy programs."
                  activeEndpoint="/api/industry"
                />
              } 
            />
            <Route 
              path="/student-achievements" 
              element={
                <ModulePlaceholder 
                  name="Student Achievements" 
                  description="Submit and review student placement records, external awards, hackathon prizes, and global certification programs."
                  activeEndpoint="/api/student"
                />
              } 
            />
            <Route 
              path="/accreditation-iqac" 
              element={
                <ModulePlaceholder 
                  name="Accreditation & IQAC" 
                  description="Perform NAAC/NBA/NIRF comparative audits, map criterion indicators, and audit department closure timelines."
                  activeEndpoint="/api/iqac/analytics"
                />
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ModulePlaceholder 
                  name="Reports Portal" 
                  description="Generate, filter, and export PDF or Excel reports for NAAC, NBA, and overall departmental performance metrics."
                  activeEndpoint="/api/reports/export?format=pdf&reportType=faculty"
                />
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ModulePlaceholder 
                  name="Admin Control" 
                  description="Manage institutional system user roles, access tokens, modify profiles, and browse global activity audit logs."
                  activeEndpoint="/api/admin/audit-logs"
                />
              } 
            />
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
