import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import Loader from './Loader';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader label="Checking admin session…" />
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
