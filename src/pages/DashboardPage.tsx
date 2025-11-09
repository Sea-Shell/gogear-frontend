import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { CategoryApi, GearApi, HealthApi, UsersApi } from '../api/endpoints';
import { PageHero, type PageHeroMetric } from '../components/PageHero';
import { useConfigStore, type ConfigState } from '../store/configStore';

import './DashboardPage.css';

export function DashboardPage() {
  const baseUrl = useConfigStore((state: ConfigState) => state.baseUrl);
  const healthQuery = useQuery({ queryKey: ['health', baseUrl], queryFn: HealthApi.get });
  const categoriesQuery = useQuery({
    queryKey: ['dashboard', 'categories', baseUrl],
    queryFn: () => CategoryApi.list({ limit: 1 }),
    staleTime: 60_000
  });
  const gearQuery = useQuery({
    queryKey: ['dashboard', 'gear', baseUrl],
    queryFn: () => GearApi.list({ limit: 1 }),
    staleTime: 60_000
  });
  const usersQuery = useQuery({
    queryKey: ['dashboard', 'users', baseUrl],
    queryFn: () => UsersApi.list({ limit: 1 }),
    staleTime: 60_000
  });

  const categoryCount = categoriesQuery.data?.total_item_count ?? categoriesQuery.data?.items?.length ?? 0;
  const gearCount = gearQuery.data?.total_item_count ?? gearQuery.data?.items?.length ?? 0;
  const userCount = usersQuery.data?.total_item_count ?? usersQuery.data?.items?.length ?? 0;

  const heroMetrics: PageHeroMetric[] = [
    {
      label: 'Health channel',
      value: healthQuery.isLoading
        ? 'Checking…'
        : healthQuery.isError
          ? 'Unreachable'
          : (healthQuery.data?.status ?? 'Unknown').toUpperCase(),
      hint: healthQuery.data?.updated ? `Last updated ${healthQuery.data.updated}` : 'Ping /health endpoint',
      tone: healthQuery.isError ? 'critical' : healthQuery.data?.status === 'ok' ? 'positive' : 'warning'
    },
    {
      label: 'Tracked categories',
      value: categoryCount,
      hint: categoriesQuery.isFetching ? 'Refreshing…' : 'Total rows available',
      tone: categoryCount > 0 ? 'positive' : 'default'
    },
    {
      label: 'Gear entries',
      value: gearCount,
      hint: gearQuery.isFetching ? 'Refreshing…' : 'Across all collections',
      tone: gearCount > 0 ? 'positive' : 'default'
    },
    {
      label: 'Members onboard',
      value: userCount,
      hint: usersQuery.isFetching ? 'Refreshing…' : 'User registry total',
      tone: userCount > 0 ? 'positive' : 'default'
    }
  ];

  return (
    <>
      <PageHero
        title="GoGear operations command center"
        subtitle="Skim the pulse of the platform, then dive straight into the cockpit that needs your attention."
        badge="Live overview"
        metrics={heroMetrics}
        actions={
          <button className="button ghost" type="button" onClick={() => healthQuery.refetch()}>
            Re-run health check
          </button>
        }
      >
        <span className="hero-chip">Current base URL: {baseUrl}</span>
      </PageHero>

      <section className="section">
        <h3>Navigator</h3>
        <p style={{ margin: '4px 0 18px', color: '#475569' }}>
          Pick a destination to continue your journey. Each module keeps its filters and insights ready so switching is
          delightfully fast.
        </p>
        <div className="dashboard-grid">
          <Link className="dashboard-card" to="/categories">
            <span className="dashboard-card-kicker">Taxonomy</span>
            <strong>Fine-tune gear categories</strong>
            <p>Organise hierarchies, connect top categories, and keep the catalog vocabulary tight.</p>
          </Link>
          <Link className="dashboard-card" to="/gear">
            <span className="dashboard-card-kicker">Inventory</span>
            <strong>Maintain gear details</strong>
            <p>Update dimensions, toggle availability, and craft dazzling descriptions for every piece.</p>
          </Link>
          <Link className="dashboard-card" to="/manufacturers">
            <span className="dashboard-card-kicker">Partners</span>
            <strong>Sync manufacturers</strong>
            <p>Keep producers in lockstep so procurement and collections stay aligned.</p>
          </Link>
          <Link className="dashboard-card" to="/users">
            <span className="dashboard-card-kicker">Community</span>
            <strong>Empower explorers</strong>
            <p>Onboard administrators, reset credentials, and keep the crew roster fresh.</p>
          </Link>
          <Link className="dashboard-card" to="/user-gear">
            <span className="dashboard-card-kicker">Ownership</span>
            <strong>Track registrations</strong>
            <p>Map gear and users together to audit who wields each item in the wild.</p>
          </Link>
        </div>
      </section>

      <section className="section">
        <h3>Mission tips</h3>
        <ul className="dashboard-tips">
          <li>Connection settings persist per session—flip between environments in a single click.</li>
          <li>Every list endpoint supports pagination; nudge the limit for wide sweeps or focus on a single record.</li>
          <li>Use the action decks to run inserts, updates, and deletes without losing context of the table.</li>
          <li>Toggle the JSON inspector on each page to peek at raw payloads when debugging.</li>
        </ul>
      </section>
    </>
  );
}
