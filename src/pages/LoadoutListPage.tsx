import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { LoadoutApi } from '../api/endpoints';
import type { Loadout } from '../api/types';

import './LoadoutListPage.css';

interface LoadoutCardProps {
  loadout: Loadout;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function LoadoutCard({ loadout, onView, onEdit, onDelete, isDeleting }: LoadoutCardProps) {
  const createdDate = new Date(loadout.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="loadout-card" onClick={onView}>
      <div className="loadout-card-header">
        <h3 className="loadout-card-name">{loadout.loadout_name}</h3>
        <span className={`status-badge ${loadout.loadout_is_public ? 'ok' : 'error'}`}>
          {loadout.loadout_is_public ? 'Public' : 'Private'}
        </span>
      </div>

      {loadout.loadout_description && (
        <p className="loadout-card-desc">{loadout.loadout_description}</p>
      )}

      <div className="loadout-card-meta">
        <div className="loadout-card-stat">
          <span className="loadout-card-stat-label">Weight</span>
          <span className="loadout-card-stat-value">{loadout.total_weight}g</span>
        </div>
        <div className="loadout-card-stat">
          <span className="loadout-card-stat-label">Created</span>
          <span className="loadout-card-stat-value">{createdDate}</span>
        </div>
        <div className="loadout-card-stat">
          <span className="loadout-card-stat-label">Slug</span>
          <span className="loadout-card-stat-value"><code>{loadout.loadout_slug}</code></span>
        </div>
      </div>

      <div className="loadout-card-actions">
        <button
          className="button ghost"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          Open
        </button>
        <button
          className="button ghost"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </button>
        <button
          className="button ghost loadout-card-delete"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

export function LoadoutListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: loadouts, isLoading, isError, error } = useQuery({
    queryKey: ['loadouts'],
    queryFn: () => LoadoutApi.list()
  });

  const removeMutation = useMutation({
    mutationFn: (loadoutId: number) => LoadoutApi.remove(loadoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadouts'] });
    }
  });

  const handleDelete = (loadout: Loadout) => {
    const confirmed = window.confirm(
      `Delete loadout "${loadout.loadout_name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    removeMutation.mutate(loadout.loadout_id);
  };

  return (
    <div className="loadout-list-page">
      <div className="loadout-list-header">
        <div>
          <h2 className="loadout-list-title">Loadouts</h2>
          <p className="loadout-list-subtitle">Plan trips &amp; pack gear.</p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => navigate('/loadouts/new')}
        >
          New Loadout
        </button>
      </div>

      {isLoading && <div className="notice">Loading loadouts...</div>}

      {isError && (
        <div className="notice notice-error">
          {error instanceof Error ? error.message : 'Failed to load loadouts'}
        </div>
      )}

      {!isLoading && !isError && (!loadouts || loadouts.length === 0) && (
        <div className="loadout-list-empty">
          No loadouts yet. Create your first loadout to start planning trips.
        </div>
      )}

      {!isLoading && !isError && loadouts && loadouts.length > 0 && (
        <div className="loadout-card-grid">
          {loadouts.map((loadout) => (
            <LoadoutCard
              key={loadout.loadout_id}
              loadout={loadout}
              onView={() => navigate(`/loadouts/${loadout.loadout_id}`)}
              onEdit={() => navigate(`/loadouts/${loadout.loadout_id}/edit`)}
              onDelete={() => handleDelete(loadout)}
              isDeleting={removeMutation.isPending && removeMutation.variables === loadout.loadout_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
