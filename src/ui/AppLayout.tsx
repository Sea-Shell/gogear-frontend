import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { HealthApi } from '../api/endpoints';
import { useConfigStore } from '../store/configStore';
import { AppShell } from './AppShell';
import '../styles/components.css';

/* ─── Nav Item Type ─── */
interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: () => JSX.Element;
  requiresAdmin?: boolean;
}

/* ─── Icon Components ─── */

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M4 13.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 12 13.5v6A1.5 1.5 0 0 1 10.5 21h-5A1.5 1.5 0 0 1 4 19.5v-6Zm8-9A1.5 1.5 0 0 1 13.5 3h5A1.5 1.5 0 0 1 20 4.5v6a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 12 10.5v-6Zm-8 0A1.5 1.5 0 0 1 5.5 3h2A1.5 1.5 0 0 1 9 4.5v4A1.5 1.5 0 0 1 7.5 10h-2A1.5 1.5 0 0 1 4 8.5v-4Zm12.5 9A1.5 1.5 0 0 1 18 15v4.5A1.5 1.5 0 0 1 16.5 21h-2A1.5 1.5 0 0 1 13 19.5V15a1.5 1.5 0 0 1 1.5-1.5h2Z" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M4.75 5A1.75 1.75 0 0 1 6.5 3.25h10a1.75 1.75 0 0 1 0 3.5H6.5A1.75 1.75 0 0 1 4.75 5Zm0 7A1.75 1.75 0 0 1 6.5 10.25h10a1.75 1.75 0 0 1 0 3.5H6.5A1.75 1.75 0 0 1 4.75 12Zm0 7A1.75 1.75 0 0 1 6.5 17.25h10a1.75 1.75 0 0 1 0 3.5H6.5A1.75 1.75 0 0 1 4.75 19Z" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M11.11 2.63a2 2 0 0 1 1.78 0l6.38 3.2A2 2 0 0 1 20 7.64v8.72a2 2 0 0 1-1.08 1.81l-6.38 3.2a2 2 0 0 1-1.78 0l-6.38-3.2A2 2 0 0 1 4 16.36V7.64a2 2 0 0 1 1.08-1.81l6.03-3.03Zm.89 2.25L7 7.09l5 2.53 5-2.53-5-2.21Zm-6 4.4v6.65l5 2.53V11.8l-5-2.53Zm7 9.18 5-2.53V9.28l-5 2.53v6.65Z" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M3.5 3A1.5 1.5 0 0 1 5 4.5v15a1.5 1.5 0 0 1-3 0v-15A1.5 1.5 0 0 1 3.5 3ZM9 5a1 1 0 0 1 1 1v3.382l3.211-2.406A1 1 0 0 1 14 6.882V10.5l3.211-2.406A1 1 0 0 1 19 9.382V20h1.5a1.5 1.5 0 0 1 0 3h-17a1.5 1.5 0 0 1 0-3H9V6a1 1 0 0 1 1-1Zm7 13h-2v2h2v-2Zm-4 0h-2v2h2v-2Zm-4 0H6v2h2v-2Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M8.5 4a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7Zm7 2a3 3 0 1 1 0 6a3 3 0 0 1 0-6ZM8 12a4.98 4.98 0 0 1 4.472 2.77A5.98 5.98 0 0 1 17 12c3.314 0 6 2.686 6 6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2c0-3.314 2.686-6 6-6Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M13.06 4.94a5.5 5.5 0 0 1 7.778 7.778l-1.768 1.768a2 2 0 1 1-2.828-2.828l1.768-1.768a1.5 1.5 0 1 0-2.121-2.121l-1.768 1.768a5 5 0 0 1-7.071 0a5 5 0 0 1 0-7.071l1.768-1.768a2 2 0 1 1 2.828 2.828l-1.768 1.768a1.5 1.5 0 1 0 2.121 2.121l1.768-1.768Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M10.325 2.317a2 2 0 0 1 3.35 0l.776 1.3a2 2 0 0 0 1.516.955l1.497.13a2 2 0 0 1 1.802 2.097l-.11 1.502a2 2 0 0 0 .58 1.542l1.04 1.079a2 2 0 0 1 0 2.828l-1.04 1.079a2 2 0 0 0-.58 1.542l.11 1.502a2 2 0 0 1-1.802 2.097l-1.497.13a2 2 0 0 0-1.516.955l-.776 1.3a2 2 0 0 1-3.35 0l-.776-1.3a2 2 0 0 0-1.516-.955l-1.497-.13a2 2 0 0 1-1.802-2.097l.11-1.502a2 2 0 0 0-.58-1.542L3.74 13.77a2 2 0 0 1 0-2.828l1.04-1.079a2 2 0 0 0 .58-1.542l-.11-1.502a2 2 0 0 1 1.802-2.097l1.497-.13a2 2 0 0 0 1.516-.955l.776-1.3ZM12 15.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7Z" />
    </svg>
  );
}

function BackpackIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M12 2a5 5 0 0 0-5 5v1.55a7 7 0 0 0-3 5.7V19a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4.75a7 7 0 0 0-3-5.7V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v1h-6V7Z" />
    </svg>
  );
}

/* ─── AppLayout Component ─── */

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const baseUrl = useConfigStore((state) => state.baseUrl);
  const user = useConfigStore((state) => state.user);
  const tokenExpiresAt = useConfigStore((state) => state.tokenExpiresAt);
  const logout = useConfigStore((state) => state.logout);
  const isAdmin = user?.isAdmin ?? false;

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        to: '/',
        label: 'Basecamp',
        description: 'Dashboard & system health',
        icon: DashboardIcon
      },
      {
        to: '/categories',
        label: 'Categories',
        description: 'Organise the gear taxonomy',
        icon: CollectionIcon,
        requiresAdmin: true
      },
      {
        to: '/gear',
        label: 'Gear',
        description: 'Create and fine tune equipment',
        icon: CubeIcon
      },
      {
        to: '/loadouts',
        label: 'Loadouts',
        description: 'Plan trips & pack gear',
        icon: BackpackIcon
      },
      {
        to: '/manufacturers',
        label: 'Manufacturers',
        description: 'Oversee makers & partners',
        icon: FactoryIcon,
        requiresAdmin: true
      },
      {
        to: '/users',
        label: 'Users',
        description: 'Manage explorers & admins',
        icon: UsersIcon,
        requiresAdmin: true
      },
      {
        to: '/user-gear',
        label: 'User Gear',
        description: 'Track registrations & ownership',
        icon: LinkIcon
      },
      {
        to: '/settings',
        label: 'Settings',
        description: 'Adjust console connection',
        icon: SettingsIcon,
        requiresAdmin: true
      }
    ],
    []
  );

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (item.requiresAdmin ? isAdmin : true)),
    [navItems, isAdmin]
  );

  const healthQuery = useQuery({
    queryKey: ['layout-health', baseUrl],
    queryFn: HealthApi.get,
    staleTime: 60_000,
    retry: 0
  });

  const activeNavItem = useMemo(
    () => {
      const path = location.pathname;
      if (path.includes('/checklist')) {
        return { label: 'Checklist' } as NavItem;
      }
      return visibleNavItems.find((item) => item.to === path) ?? null;
    },
    [visibleNavItems, location.pathname]
  );

  const statusTone = healthQuery.isLoading
    ? ('loading' as const)
    : healthQuery.isError
      ? ('error' as const)
      : healthQuery.data?.status === 'ok'
        ? ('ok' as const)
        : ('unknown' as const);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const pageTitle = activeNavItem?.label ?? 'GoGear';

  return (
    <AppShell
      navItems={visibleNavItems}
      isAdmin={isAdmin}
      user={user ?? null}
      tokenExpiresAt={tokenExpiresAt ?? null}
      onSignOut={handleSignOut}
      healthStatus={statusTone}
      pageTitle={pageTitle}
    >
      <Outlet />
    </AppShell>
  );
}
