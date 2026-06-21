import './TopBar.css';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

interface TopBarProps {
  /** Page title from active route */
  title: string;
  user: UserInfo | null;
  tokenExpiresAt: number | null;
  onSignOut: () => void;
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" fill="currentColor">
      <path d="M5 5a3 3 0 0 1 3-3h4a1 1 0 1 1 0 2H8a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4a1 1 0 1 1 0 2H8a3 3 0 0 1-3-3V5Zm12.293 4.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L18.586 13H10a1 1 0 1 1 0-2h8.586l-1.293-1.293a1 1 0 0 1 0-1.414Z" />
    </svg>
  );
}

export function TopBar({ title, user, tokenExpiresAt, onSignOut }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="topbar-breadcrumb-label">{title}</span>
      </div>

      <div className="topbar-end">
        {user && (
          <>
            <div className="topbar-user">
              <span className="topbar-user-name" title={user.email ?? undefined}>
                {user.name ?? user.email ?? ''}
              </span>
              {user.isAdmin && (
                <span className="topbar-admin-badge">Admin</span>
              )}
              {tokenExpiresAt && (
                <span className="topbar-token-expiry">
                  expires {new Date(tokenExpiresAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              className="topbar-sign-out"
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <SignOutIcon />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
