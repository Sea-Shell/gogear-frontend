import { type ReactNode } from 'react';
import './StagingShelf.css';

interface StagingShelfProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  totalItems: number;
  filteredCount: number;
  searchActive: boolean;
  children: ReactNode;
}

export function StagingShelf({
  searchValue,
  onSearchChange,
  totalItems,
  filteredCount,
  searchActive,
  children
}: StagingShelfProps) {
  return (
    <section className="staging-shelf">
      <div className="staging-shelf-header">
        <h3 className="staging-shelf-title">Staging shelf</h3>
        <div className="staging-shelf-search">
          <input
            className="staging-shelf-input"
            type="text"
            placeholder="Search gear…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchValue && (
            <button
              type="button"
              className="staging-shelf-clear"
              onClick={() => onSearchChange('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {searchActive && (
        <div className="staging-shelf-meta">
          Showing {filteredCount} of {totalItems} items
        </div>
      )}

      <div className="staging-shelf-children">
        {children}
      </div>
    </section>
  );
}
