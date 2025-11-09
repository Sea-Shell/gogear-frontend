import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useConfigStore } from '../store/configStore';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const accessToken = useConfigStore((state) => state.accessToken);
  const hydrated = useConfigStore((state) => state.hydrated);
  const location = useLocation();

  if (!hydrated) {
    return null;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
