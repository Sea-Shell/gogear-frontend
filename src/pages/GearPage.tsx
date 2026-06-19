import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GearApi, TopCategoryApi } from '../api/endpoints';
import type { GearListItem } from '../api/types';
import { GearCard } from '../components/GearCard';
import { FilterBar } from '../components/FilterBar';

import './GearPage.css';

export function GearPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopCategory, setSelectedTopCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailGear, setDetailGear] = useState<GearListItem | null>(null);

  /* ── Fetch top categories for filter ── */
  const topCatsQuery = useQuery({
    queryKey: ['gear', 'top-categories'],
    queryFn: () => TopCategoryApi.list({ limit: 100 }),
    staleTime: 60_000
  });
  const topCategories = topCatsQuery.data?.items ?? [];

  /* ── Fetch gear list (with optional top-category filter) ── */
  const gearListParams = useMemo(() => {
    const params: Record<string, unknown> = { limit: 200 };
    if (selectedTopCategory) {
      params.topCategory = selectedTopCategory;
    }
    return params;
  }, [selectedTopCategory]);

  const gearQuery = useQuery({
    queryKey: ['gear', 'list', gearListParams],
    queryFn: () => GearApi.list(gearListParams)
  });

  const allGear = gearQuery.data?.items ?? [];

  /* ── Client-side search filter ── */
  const filteredGear = useMemo(() => {
    if (!searchTerm.trim()) return allGear;
    const lower = searchTerm.toLowerCase().trim();
    return allGear.filter(
      (g) =>
        (g.gear_name ?? '').toLowerCase().includes(lower) ||
        (g.category_name ?? '').toLowerCase().includes(lower) ||
        (g.manufacture_name ?? '').toLowerCase().includes(lower)
    );
  }, [allGear, searchTerm]);

  /* ── Delete mutation (admin) ── */
  const deleteMutation = useMutation({
    mutationFn: (gearId: number) => GearApi.remove(gearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gear', 'list'] });
    }
  });

  const handleDelete = (gear: GearListItem) => {
    if (!gear.gear_id) return;
    if (!window.confirm(`Delete "${gear.gear_name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(gear.gear_id);
  };

  /* ── Render ── */
  return (
    <div className="gear-page">
      {/* ── Filter Bar ── */}
      <div className="gear-page-filter-sticky">
        <FilterBar>
          <div className="filter-chip">
            <label htmlFor="gear-search">Search</label>
            <input
              id="gear-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, category…"
            />
          </div>

          <div className="filter-chip">
            <label htmlFor="gear-category">Category</label>
            <select
              id="gear-category"
              value={selectedTopCategory}
              onChange={(e) => setSelectedTopCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {topCategories.map((cat) => (
                <option
                  key={cat.top_category_id ?? cat.top_category_name}
                  value={cat.top_category_id ?? ''}
                >
                  {cat.top_category_name ?? 'Untitled'}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-chip">
            <label>View</label>
            <div className="gear-page-view-toggles">
              <button
                type="button"
                className={`gear-page-view-toggle${viewMode === 'grid' ? ' is-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z" />
                </svg>
              </button>
              <button
                type="button"
                className={`gear-page-view-toggle${viewMode === 'list' ? ' is-active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 4h18v2H3V4Zm0 7h18v2H3v-2Zm0 7h18v2H3v-2Z" />
                </svg>
              </button>
            </div>
          </div>
        </FilterBar>
      </div>

      {/* ── Status / Meta ── */}
      <div className="gear-page-meta">
        {gearQuery.isLoading && <span className="notice">Loading gear…</span>}
        {gearQuery.isError && (
          <span className="notice notice-error">
            {gearQuery.error instanceof Error ? gearQuery.error.message : 'Failed to load gear'}
          </span>
        )}
        {!gearQuery.isLoading && !gearQuery.isError && (
          <span className="gear-page-count">
            {filteredGear.length} gear item{filteredGear.length !== 1 ? 's' : ''}
            {searchTerm.trim() && allGear.length !== filteredGear.length
              ? ` (filtered from ${allGear.length})`
              : ''}
          </span>
        )}
      </div>

      {/* ── Card Grid / List ── */}
      {!gearQuery.isLoading && !gearQuery.isError && filteredGear.length === 0 && (
        <div className="gear-page-empty">
          {searchTerm.trim() || selectedTopCategory
            ? 'No gear matches the current filters.'
            : 'No gear items yet.'}
        </div>
      )}

      {filteredGear.length > 0 && (
        <div className={`gear-page-list ${viewMode === 'list' ? 'gear-list-view' : ''}`}>
          {filteredGear.map((gear) => (
            <GearCard
              key={gear.gear_id ?? `${gear.gear_name}-${gear.manufacture_name}`}
              gear={gear}
              onEdit={() => setDetailGear(gear)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Detail side sheet ── */}
      {detailGear && (
        <div className="gear-page-overlay" onClick={() => setDetailGear(null)}>
          <div className="gear-page-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="gear-page-sheet-header">
              <h3>{detailGear.gear_name ?? 'Unnamed gear'}</h3>
              <button
                className="gear-page-sheet-close"
                type="button"
                onClick={() => setDetailGear(null)}
              >
                ✕
              </button>
            </div>
            <dl className="gear-page-sheet-details">
              {detailGear.gear_id != null && (
                <div>
                  <dt>ID</dt>
                  <dd>#{detailGear.gear_id}</dd>
                </div>
              )}
              {detailGear.category_name && (
                <div>
                  <dt>Category</dt>
                  <dd>{detailGear.category_name}</dd>
                </div>
              )}
              {detailGear.top_category_name && (
                <div>
                  <dt>Top Category</dt>
                  <dd>{detailGear.top_category_name}</dd>
                </div>
              )}
              {detailGear.manufacture_name && (
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{detailGear.manufacture_name}</dd>
                </div>
              )}
              {detailGear.gear_weight != null && (
                <div>
                  <dt>Weight</dt>
                  <dd>{detailGear.gear_weight}g</dd>
                </div>
              )}
              {detailGear.gear_status != null && (
                <div>
                  <dt>Status</dt>
                  <dd>{detailGear.gear_status ? 'Active' : 'Archived'}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
