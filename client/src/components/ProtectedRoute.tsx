import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          <p className="text-xs tracking-wider uppercase font-medium">Authenticating Geospatial Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-rose-50 p-4 border border-rose-200 text-rose-700 mb-4 shadow-sm">
          <span className="text-2xl font-bold font-mono">403</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          Your current account role (<span className="text-orange-700 font-mono font-semibold">{user.role}</span>) does not have authorization to view or manage this administrative interface.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
