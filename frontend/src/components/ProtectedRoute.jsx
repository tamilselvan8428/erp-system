import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-accent"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading FSAIS Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and remember where they wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their default dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};
