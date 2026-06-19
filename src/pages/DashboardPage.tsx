import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { GearApi, LoadoutApi, TopCategoryApi } from '../api/endpoints';
import { useConfigStore, type ConfigState } from '../store/configStore';
import { IconPlus, IconPack } from '../components/icons';

import './DashboardPage.css';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const baseUrl = useConfigStore((state: ConfigState) => state.baseUrl);

  const loadoutsQuery = useQuery({
    queryKey: ['loadouts', baseUrl],
    queryFn: () => LoadoutApi.list()
  });

  const gearQuery = useQuery({
    queryKey: ['basecamp', 'gear-count', baseUrl],
    queryFn: () => GearApi.list({ limit: 1 }),
    staleTime: 60_000
  });

  const topCategoriesQuery = useQuery({
    queryKey: ['basecamp', 'top-categories', baseUrl],
    queryFn: () => TopCategoryApi.list({ limit: 100 }),
    staleTime: 60_000
  });

  const loadouts = loadoutsQuery.data ?? [];
  const recentLoadouts = loadouts.slice(0, 4);
  const gearCount = gearQuery.data?.total_item_count ?? 0;
  const topCategories = topCategoriesQuery.data?.items ?? [];

  const recentActivity = loadouts.slice(0, 5).map((l) => ({
    id: l.loadout_id,
    text: `Created loadout "${l.loadout_name}"`,
    date: l.created_at
  }));

  return (
    <div className="basecamp-page">
      <div className="basecamp-header">
        <h1 className="basecamp-title">Basecamp</h1>
        <p className="basecamp-subtitle">Plan trips, pack gear, get outside.</p>
      </div>

      {/* ── Recent Trips ── */}
      <section className="section">
        <div className="basecamp-section-header">
          <h3>Recent Trips</h3>
          <button className="button" type="button" onClick={() => navigate('/loadouts/new')}>
            <IconPlus style={{ width: 16, height: 16 }} /> New Trip
          </button>
        </div>

        {loadoutsQuery.isLoading && <div className="notice">Loading trips…</div>}

        {loadoutsQuery.isError && (
          <div className="notice notice-error">
            {loadoutsQuery.error instanceof Error
              ? loadoutsQuery.error.message
              : 'Failed to load trips'}
          </div>
        )}

        {!loadoutsQuery.isLoading && !loadoutsQuery.isError && recentLoadouts.length === 0 && (
          <div className="basecamp-empty">
            No trips yet. <Link to="/loadouts/new">Plan your first adventure</Link>.
          </div>
        )}

        {recentLoadouts.length > 0 && (
          <div className="basecamp-trip-grid">
            {recentLoadouts.map((loadout) => (
              <Link
                key={loadout.loadout_id}
                to={`/loadouts/${loadout.loadout_id}`}
                className="basecamp-trip-card"
              >
                <div className="basecamp-trip-card-icon">
                  <IconPack style={{ width: 20, height: 20 }} />
                </div>
                <div className="basecamp-trip-card-body">
                  <strong className="basecamp-trip-card-name">{loadout.loadout_name}</strong>
                  <span className="basecamp-trip-card-meta">
                    {formatDate(loadout.created_at)} · {loadout.total_weight}g
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {loadouts.length > 4 && (
          <Link to="/loadouts" className="basecamp-view-all">
            View all trips →
          </Link>
        )}
      </section>

      {/* ── Quick Stats ── */}
      <section className="section">
        <h3>Quick Stats</h3>
        <div className="basecamp-stats">
          <div className="basecamp-stat">
            <span className="basecamp-stat-value">{gearCount}</span>
            <span className="basecamp-stat-label">Gear items</span>
          </div>
          <div className="basecamp-stat">
            <span className="basecamp-stat-value">{loadouts.length}</span>
            <span className="basecamp-stat-label">Trips planned</span>
          </div>
          <div className="basecamp-stat">
            <span className="basecamp-stat-value">
              {loadouts.length > 0 ? formatDate(loadouts[0]?.updated_at) : '—'}
            </span>
            <span className="basecamp-stat-label">Last updated</span>
          </div>
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section className="section">
        <h3>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="basecamp-empty-activity">No recent activity.</p>
        ) : (
          <ul className="basecamp-activity">
            {recentActivity.map((entry) => (
              <li key={`${entry.id}-${entry.date}`}>
                <span className="basecamp-activity-text">{entry.text}</span>
                <span className="basecamp-activity-date">{formatDate(entry.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Quick Links ── */}
      <section className="section">
        <h3>Quick Links</h3>
        <div className="basecamp-quick-links">
          {topCategories.slice(0, 8).map((cat) => (
            <Link
              key={cat.top_category_id ?? cat.top_category_name}
              to={`/gear?category=${cat.top_category_id ?? ''}`}
              className="basecamp-chip"
            >
              {cat.top_category_name ?? 'Category'}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
