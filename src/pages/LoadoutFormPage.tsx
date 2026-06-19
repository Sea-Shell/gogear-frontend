import { useMutation, useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { LoadoutApi } from '../api/endpoints';
import type { LoadoutNoID, LoadoutUpdate } from '../api/types';
import { useConfigStore } from '../store/configStore';

import './LoadoutFormPage.css';

function resolveNumericUserId(user: { id?: number | string } | undefined): number | undefined {
  if (!user?.id) return undefined;
  const raw = user.id;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function LoadoutFormPage() {
  const { loadoutId } = useParams<{ loadoutId: string }>();
  const navigate = useNavigate();
  const numericId = loadoutId ? Number(loadoutId) : undefined;
  const isEditMode = !Number.isNaN(numericId) && numericId !== undefined;

  const authUser = useConfigStore((state) => state.user);
  const userId = resolveNumericUserId(authUser);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState('');

  const loadoutQuery = useQuery({
    queryKey: ['loadout', numericId],
    queryFn: () => LoadoutApi.get(numericId!),
    enabled: isEditMode
  });

  useEffect(() => {
    if (!isEditMode) return;
    const data = loadoutQuery.data;
    if (!data) return;
    setName(data.loadout_name ?? '');
    setDescription(data.loadout_description ?? '');
    setIsPublic(data.loadout_is_public ?? false);
    setSlug(data.loadout_slug ?? '');
  }, [loadoutQuery.data, isEditMode]);

  const insertMutation = useMutation({
    mutationFn: (payload: LoadoutNoID) => LoadoutApi.insert(payload),
    onSuccess: (data) => {
      navigate(`/loadouts/${data.loadout_id}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LoadoutUpdate }) =>
      LoadoutApi.update(id, payload),
    onSuccess: () => {
      navigate(`/loadouts/${numericId}`);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) return;

    if (isEditMode && numericId !== undefined) {
      updateMutation.mutate({
        id: numericId,
        payload: {
          loadout_id: numericId,
          loadout_name: name.trim(),
          loadout_description: description.trim(),
          loadout_is_public: isPublic,
          loadout_slug: slug.trim()
        }
      });
    } else {
      insertMutation.mutate({
        loadout_name: name.trim(),
        loadout_description: description.trim(),
        loadout_is_public: isPublic,
        loadout_slug: slug.trim(),
        user_id: userId ?? 0
      });
    }
  };

  const isPending = insertMutation.isPending || updateMutation.isPending;

  if (isEditMode && loadoutQuery.isLoading) {
    return (
      <div className="loadout-form-page">
        <div className="notice">Loading loadout...</div>
      </div>
    );
  }

  if (isEditMode && loadoutQuery.isError) {
    return (
      <div className="loadout-form-page">
        <div className="notice notice-error">
          {loadoutQuery.error instanceof Error
            ? loadoutQuery.error.message
            : 'Failed to load loadout'}
        </div>
        <button className="button ghost" type="button" onClick={() => navigate('/loadouts')}>
          Back to loadouts
        </button>
      </div>
    );
  }

  return (
    <div className="loadout-form-page">
      <section className="section">
        <h3>{isEditMode ? 'Edit Loadout' : 'New Loadout'}</h3>
        <p>{isEditMode ? 'Update the loadout details below.' : 'Create a new loadout for your trip planning.'}</p>

        <form className="loadout-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="loadout-name">Name *</label>
              <input
                id="loadout-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Weekend Backpacking Trip"
              />
            </div>

            <div className="field">
              <label htmlFor="loadout-slug">Slug</label>
              <input
                id="loadout-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. weekend-backpacking"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="loadout-description">Description</label>
            <textarea
              id="loadout-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this loadout..."
              rows={3}
            />
          </div>

          <label className="loadout-form-checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>Make this loadout publicly visible</span>
          </label>

          <div className="form-actions">
            <button className="button" type="submit" disabled={isPending || !name.trim()}>
              {isPending
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Loadout'}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => navigate(isEditMode ? `/loadouts/${numericId}` : '/loadouts')}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
