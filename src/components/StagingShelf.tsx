import type { UserGear } from '../api/types';
import './StagingShelf.css';

interface StagingShelfProps {
  items: UserGear[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRemove: (registrationId: number) => void;
  loading?: boolean;
}

export function StagingShelf({ items, searchQuery, onSearchChange, onRemove, loading }: StagingShelfProps) {
  return (
    <section className="staging-shelf">
      <div className="staging-shelf-header">
        <h3 className="staging-shelf-title">Staging shelf</h3>
        <div className="staging-shelf-search">
          <input
            className="staging-shelf-input"
            type="text"
            placeholder="Search gear…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="staging-shelf-loading">Loading gear…</div>}

      {!loading && items.length === 0 && (
        <div className="staging-shelf-empty">
          {searchQuery ? 'No gear matches your search.' : 'No uncontained gear.'}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="staging-shelf-list">
          {items.map((item) => (
            <div key={item.usergear_registration_id} className="staging-shelf-item">
              <div className="staging-shelf-item-info">
                <span className="staging-shelf-item-name">{item.gear_name}</span>
                {item.manufacture_name && (
                  <span className="staging-shelf-item-meta">{item.manufacture_name}</span>
                )}
                {item.gear_weight && (
                  <span className="staging-shelf-item-meta">{item.gear_weight}g</span>
                )}
              </div>
              <button
                className="staging-shelf-item-remove"
                type="button"
                onClick={() => onRemove(item.usergear_registration_id!)}
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}