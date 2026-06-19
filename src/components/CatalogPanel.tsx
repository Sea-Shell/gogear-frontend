import { useMemo } from 'react';

import type { GearListItem } from '../api/types';
import { GearCard } from './GearCard';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useGearList } from '../hooks/useGearList';

import './CatalogPanel.css';

interface CatalogPanelProps {
  loadoutId: number;
  onAddItem: (gear: GearListItem) => void;
}

export function CatalogPanel({ loadoutId, onAddItem }: CatalogPanelProps) {
  void loadoutId; /* Reserved for "my gear" filtering */
  const catalogTab = useWorkspaceStore((s) => s.catalogTab);
  const setCatalogTab = useWorkspaceStore((s) => s.setCatalogTab);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useWorkspaceStore((s) => s.setSearchQuery);

  /* ── Fetch catalog gear ── */
  const gearQuery = useGearList();

  const catalogGear: GearListItem[] = gearQuery.data?.items ?? [];

  /* ── Search filter ── */
  const filteredGear = useMemo(() => {
    if (!searchQuery.trim()) return catalogGear;
    const lower = searchQuery.toLowerCase().trim();
    return catalogGear.filter(
      (g) =>
        (g.gear_name ?? '').toLowerCase().includes(lower) ||
        (g.category_name ?? '').toLowerCase().includes(lower) ||
        (g.manufacture_name ?? '').toLowerCase().includes(lower)
    );
  }, [catalogGear, searchQuery]);

  const handleDragStart = (e: React.DragEvent, gear: GearListItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      gear_id: gear.gear_id,
      gear_name: gear.gear_name,
      gear_weight: gear.gear_weight,
      category_name: gear.category_name,
      top_category_name: gear.top_category_name
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="catalog-panel">
      {/* Search */}
      <div className="catalog-panel-search">
        <input
          type="search"
          placeholder="Search gear..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="catalog-panel-tabs">
        <button
          className={`catalog-panel-tab${catalogTab === 'catalog' ? ' active' : ''}`}
          onClick={() => setCatalogTab('catalog')}
          type="button"
        >
          Catalog
        </button>
        <button
          className={`catalog-panel-tab${catalogTab === 'my-gear' ? ' active' : ''}`}
          onClick={() => setCatalogTab('my-gear')}
          type="button"
        >
          My Gear
        </button>
      </div>

      {/* Gear grid */}
      <div className="catalog-panel-grid">
        {gearQuery.isLoading && (
          <div className="catalog-panel-loading">Loading gear...</div>
        )}

        {gearQuery.isError && (
          <div className="catalog-panel-empty">
            Failed to load gear catalog.
          </div>
        )}

        {!gearQuery.isLoading && !gearQuery.isError && filteredGear.length === 0 && (
          <div className="catalog-panel-empty">
            {searchQuery.trim()
              ? 'No gear matches your search.'
              : 'No gear items in catalog.'}
          </div>
        )}

        {!gearQuery.isLoading &&
          !gearQuery.isError &&
          filteredGear.map((gear) => (
            <div
              key={gear.gear_id}
              draggable
              onDragStart={(e) => handleDragStart(e, gear)}
            >
              <GearCard
                gear={gear}
                onAddToLoadout={() => onAddItem(gear)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
