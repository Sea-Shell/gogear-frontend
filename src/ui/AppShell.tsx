import type { ReactNode } from 'react';

import { Rail } from './Rail';
import { TopBar } from './TopBar';

import './AppShell.css';

interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: () => JSX.Element;
  requiresAdmin?: boolean;
}

interface UserInfo {
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

interface AppShellProps {
  children: ReactNode;
  navItems: NavItem[];
  isAdmin: boolean;
  user: UserInfo | null;
  tokenExpiresAt: number | null;
  onSignOut: () => void;
  healthStatus: 'loading' | 'ok' | 'error' | 'unknown';
  /** Page title for the top-bar breadcrumb */
  pageTitle: string;
}

export function AppShell({
  children,
  navItems,
  isAdmin,
  user,
  tokenExpiresAt,
  onSignOut,
  healthStatus,
  pageTitle
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Rail
        items={navItems}
        isAdmin={isAdmin}
        healthStatus={healthStatus}
      />

      <div className="app-shell-main">
        <TopBar
          title={pageTitle}
          user={user}
          tokenExpiresAt={tokenExpiresAt}
          onSignOut={onSignOut}
        />

        <main className="app-shell-content">
          {children}
        </main>
      </div>
    </div>
  );
}
