import { useMemo, useState } from 'react';

import type { GearListItem } from '../api/types';

import './AddGearSheet.css';

interface AddGearSheetProps {
  gearItems: GearListItem[];
  onAdd: (gearId: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AddGearSheet({ gearItems, onAdd, onClose, isLoading }: AddGearSheetProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return gearItems;
    const q = search.toLowerCase().trim();
    return gearItems.filter(
      (g) =>
        (g.gear_name ?? '').toLowerCase().includes(q) ||
        (g.category_name && g.category_name.toLowerCase().includes(q)) ||
        (g.top_category_name && g.top_category_name.toLowerCase().includes(q))
    );
  }, [gearItems, search]);

  const handleAdd = (gearId: number | undefined) => {
    if (gearId == null) return;
    onAdd(gearId);
    onClose();
  };

  return (
    <div className="add-gear-sheet-overlay" onClick={onClose}>
      <div
        className="add-gear-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add gear to checklist"
      >
        {/* Handle */}
        <div className="add-gear-sheet-handle" />

        {/* Header */}
        <div className="add-gear-sheet-header">
          <h3 className="add-gear-sheet-title">Add Gear</h3>
          <button
            className="add-gear-sheet-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M5.293 5.293a1 1 0 0 1 1.414 0L12 10.586l5.293-5.293a1 1 0 1 1 1.414 1.414L13.414 12l5.293 5.293a1 1 0 1 1-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L10.586 12 5.293 6.707a1 1 0 0 1 0-1.414Z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="add-gear-sheet-search">
          <svg className="add-gear-sheet-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16Zm0 2a6 6 0 1 0 0 12a6 6 0 0 0 0-12Zm8.293 10.293l3 3a1 1 0 0 1-1.414 1.414l-3-3a1 1 0 0 1 1.414-1.414Z" />
          </svg>
          <input
            className="add-gear-sheet-search-input"
            type="search"
            placeholder="Search gear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            aria-label="Search gear"
          />
        </div>

        {/* Gear list */}
        <div className="add-gear-sheet-list">
          {isLoading && (
            <div className="add-gear-sheet-empty">Loading gear...</div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="add-gear-sheet-empty">
              {search.trim() ? 'No gear found.' : 'No gear available.'}
            </div>
          )}

          {!isLoading &&
            filtered.map((gear) => {
              const gearId = gear.gear_id;
              if (gearId == null) return null;
              return (
                <button
                  key={gearId}
                  className="add-gear-sheet-item"
                  type="button"
                  onClick={() => handleAdd(gearId)}
                >
                  <span className="add-gear-sheet-item-name">{gear.gear_name ?? `Gear #${gearId}`}</span>
                  <span className="add-gear-sheet-item-category">
                    {gear.top_category_name || gear.category_name || ''}
                  </span>
                  <span className="add-gear-sheet-item-weight">{gear.gear_weight ?? 0}g</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
