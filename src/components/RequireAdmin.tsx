import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useConfigStore } from '../store/configStore';

interface RequireAdminProps {
  children: ReactNode;
  redirectTo?: string;
}

export function RequireAdmin({ children, redirectTo = '/' }: RequireAdminProps) {
  const accessToken = useConfigStore((state) => state.accessToken);
  const hydrated = useConfigStore((state) => state.hydrated);
  const user = useConfigStore((state) => state.user);
  const location = useLocation();

  if (!hydrated) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
