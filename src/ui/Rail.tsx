import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';

import './Rail.css';

interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: () => JSX.Element;
  requiresAdmin?: boolean;
}

interface RailProps {
  items: NavItem[];
  isAdmin: boolean;
  healthStatus: 'loading' | 'ok' | 'error' | 'unknown';
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" fill="currentColor">
      <path d="M10.325 2.317a2 2 0 0 1 3.35 0l.776 1.3a2 2 0 0 0 1.516.955l1.497.13a2 2 0 0 1 1.802 2.097l-.11 1.502a2 2 0 0 0 .58 1.542l1.04 1.079a2 2 0 0 1 0 2.828l-1.04 1.079a2 2 0 0 0-.58 1.542l.11 1.502a2 2 0 0 1-1.802 2.097l-1.497.13a2 2 0 0 0-1.516.955l-.776 1.3a2 2 0 0 1-3.35 0l-.776-1.3a2 2 0 0 0-1.516-.955l-1.497-.13a2 2 0 0 1-1.802-2.097l.11-1.502a2 2 0 0 0-.58-1.542L3.74 13.77a2 2 0 0 1 0-2.828l1.04-1.079a2 2 0 0 0 .58-1.542l-.11-1.502a2 2 0 0 1 1.802-2.097l1.497-.13a2 2 0 0 0 1.516-.955l.776-1.3Z" />
    </svg>
  );
}

export function Rail({ items, isAdmin, healthStatus }: RailProps) {
  const [adminExpanded, setAdminExpanded] = useState(true);

  const toggleAdmin = useCallback(() => {
    setAdminExpanded((prev) => !prev);
  }, []);

  const mainItems = items.filter(
    (item) => !item.requiresAdmin && item.to !== '/settings'
  );
  const adminItems = items.filter((item) => item.requiresAdmin);
  const settingsItem = items.find((item) => item.to === '/settings');

  const healthLabel =
    healthStatus === 'loading'
      ? 'Checking...'
      : healthStatus === 'ok'
        ? 'API ready'
        : healthStatus === 'error'
          ? 'API error'
          : 'Unknown';

  return (
    <nav className="rail" aria-label="Primary navigation">
      <div className="rail-nav">
        {mainItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rail-item${isActive ? ' is-active' : ''}`
            }
            end={item.to === '/'}
            data-tooltip={item.label}
            aria-label={item.label}
          >
            <item.icon />
          </NavLink>
        ))}

        {isAdmin && adminItems.length > 0 && (
          <>
            <button
              type="button"
              className={`rail-section-toggle${adminExpanded ? ' is-expanded' : ''}`}
              onClick={toggleAdmin}
              data-tooltip={adminExpanded ? 'Collapse admin' : 'Admin tools'}
              aria-label={adminExpanded ? 'Collapse admin section' : 'Expand admin section'}
              aria-expanded={adminExpanded}
            >
              <GearIcon />
            </button>

            <div
              className={`rail-admin-items${adminExpanded ? ' is-expanded' : ' is-collapsed'}`}
              role="group"
              aria-label="Admin navigation"
            >
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rail-item${isActive ? ' is-active' : ''}`
                  }
                  data-tooltip={item.label}
                  aria-label={item.label}
                >
                  <item.icon />
                </NavLink>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rail-divider" role="separator" />

      <div className="rail-footer">
        {settingsItem && (
          <NavLink
            to={settingsItem.to}
            className={({ isActive }) =>
              `rail-item${isActive ? ' is-active' : ''}`
            }
            data-tooltip={settingsItem.label}
            aria-label={settingsItem.label}
          >
            <settingsItem.icon />
          </NavLink>
        )}

        <div
          className="rail-health"
          data-tooltip={healthLabel}
          title={healthLabel}
        >
          <span className={`rail-health-dot ${healthStatus}`} aria-hidden="true" />
        </div>
      </div>
    </nav>
  );
}
