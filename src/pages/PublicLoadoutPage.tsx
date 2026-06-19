import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { LoadoutApi } from '../api/endpoints';

import './PublicLoadoutPage.css';

export function PublicLoadoutPage() {
  const { slug } = useParams<{ slug: string }>();

  const loadoutQuery = useQuery({
    queryKey: ['public-loadout', slug],
    queryFn: () => LoadoutApi.getPublic(slug!),
    enabled: Boolean(slug)
  });

  const itemsQuery = useQuery({
    queryKey: ['public-loadout', slug, 'items'],
    queryFn: () => LoadoutApi.itemsPublic(slug!),
    enabled: Boolean(slug)
  });

  const loadout = loadoutQuery.data;
  const items = itemsQuery.data ?? [];

  return (
    <div className="public-loadout-page">
      <div className="public-loadout-card">
        {loadoutQuery.isLoading && (
          <div className="public-loadout-status">Loading loadout...</div>
        )}

        {loadoutQuery.isError && (
          <div className="public-loadout-status public-loadout-status-error">
            {loadoutQuery.error instanceof Error
              ? loadoutQuery.error.message
              : 'Failed to load loadout'}
          </div>
        )}

        {loadout && (
          <>
            <div className="public-loadout-header">
              <h1>{loadout.loadout_name}</h1>
              {loadout.loadout_description && (
                <p className="public-loadout-description">{loadout.loadout_description}</p>
              )}
            </div>

            <div className="public-loadout-meta">
              <div className="public-loadout-meta-item">
                <span className="public-loadout-meta-label">Total Weight</span>
                <span className="public-loadout-meta-value">{loadout.total_weight} g</span>
              </div>
              <div className="public-loadout-meta-item">
                <span className="public-loadout-meta-label">Created</span>
                <span className="public-loadout-meta-value">
                  {new Date(loadout.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {loadout.updated_at && (
                <div className="public-loadout-meta-item">
                  <span className="public-loadout-meta-label">Updated</span>
                  <span className="public-loadout-meta-value">
                    {new Date(loadout.updated_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="public-loadout-section">
              <h2>Items</h2>

              {itemsQuery.isLoading && (
                <div className="public-loadout-status">Loading items...</div>
              )}

              {itemsQuery.isError && (
                <div className="public-loadout-status public-loadout-status-error">
                  {itemsQuery.error instanceof Error
                    ? itemsQuery.error.message
                    : 'Failed to load items'}
                </div>
              )}

              {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
                <div className="public-loadout-empty">No items in this loadout.</div>
              )}

              {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 && (
                <table className="public-loadout-table">
                  <thead>
                    <tr>
                      <th>Gear ID</th>
                      <th>Quantity</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.loadout_item_id}>
                        <td><code>{item.gear_id}</code></td>
                        <td>{item.quantity}</td>
                        <td>{item.notes || <span className="public-loadout-no-notes">&mdash;</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
