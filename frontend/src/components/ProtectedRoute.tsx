import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    let isLoggingOut = false;
    try {
      isLoggingOut = sessionStorage.getItem('sa_logging_out') === '1';
      if (isLoggingOut) {
        sessionStorage.removeItem('sa_logging_out');
      }
    } catch {}

    if (isLoggingOut) {
      return <Navigate to="/" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
