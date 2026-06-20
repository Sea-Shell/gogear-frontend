import { useState } from 'react';
import type { UserGear } from '../api/types';
import './PackingCanvas.css';

interface PackingCanvasProps {
  containers: UserGear[];
  containedItems: Map<number, UserGear[]>;
  onDropInContainer: (containerId: number, gearId: number) => void;
  onRemoveFromContainer: (linkId: number) => void;
  onTogglePin: (containerId: number) => void;
  pinnedContainers: Set<number>;
  limitDrafts: Record<number, string>;
  onLimitChange: (containerId: number, value: string) => void;
  onLimitSave: (containerId: number) => void;
  busyMap: Record<number, boolean>;
}

export function PackingCanvas({
  containers,
  containedItems,
  onDropInContainer,
  onRemoveFromContainer,
  onTogglePin,
  pinnedContainers,
  limitDrafts,
  onLimitChange,
  onLimitSave,
  busyMap
}: PackingCanvasProps) {
  const [dragOverContainer, setDragOverContainer] = useState<number | null>(null);

  const sorted = [...containers].sort((a, b) => {
    const aPinned = pinnedContainers.has(a.usergear_registration_id!);
    const bPinned = pinnedContainers.has(b.usergear_registration_id!);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <section className="packing-canvas">
      <h3 className="packing-canvas-title">Packing canvas</h3>

      {sorted.length === 0 && (
        <div className="packing-canvas-empty">
          No containers yet. Register gear as containers to get started.
        </div>
      )}

      <div className="packing-canvas-grid">
        {sorted.map((container) => {
          const isPinned = pinnedContainers.has(container.usergear_registration_id!);
          const children = containedItems.get(container.usergear_registration_id!) ?? [];
          const totalWeight = children.reduce((sum, c) => sum + (c.gear_weight ?? 0), 0);
          const maxWeight = container.max_container_weight;
          const weightPct = maxWeight && maxWeight > 0 ? Math.min(100, (totalWeight / maxWeight) * 100) : 0;

          return (
            <div
              key={container.usergear_registration_id}
              className={`packing-canvas-container${dragOverContainer === container.usergear_registration_id ? ' drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverContainer(container.usergear_registration_id!); }}
              onDragLeave={() => setDragOverContainer(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverContainer(null);
                const gearId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (gearId) onDropInContainer(container.usergear_registration_id!, gearId);
              }}
            >
              <div className="packing-canvas-container-header">
                <span className="packing-canvas-container-name">{container.gear_name}</span>
                <div className="packing-canvas-container-actions">
                  <button
                    className={`packing-canvas-pin${isPinned ? ' pinned' : ''}`}
                    type="button"
                    onClick={() => onTogglePin(container.usergear_registration_id!)}
                    title={isPinned ? 'Unpin' : 'Pin to top'}
                    aria-label={isPinned ? 'Unpin container' : 'Pin container to top'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Weight meter */}
              {maxWeight != null && (
                <div className="packing-canvas-meter">
                  <div
                    className={`packing-canvas-meter-fill${weightPct > 90 ? ' danger' : weightPct > 70 ? ' warn' : ''}`}
                    style={{ width: `${weightPct}%` }}
                  />
                  <span className="packing-canvas-meter-label">
                    {totalWeight}g / {maxWeight}g
                  </span>
                </div>
              )}

              {/* Weight limit inline editor */}
              {maxWeight != null && (
                <div className="packing-canvas-limit">
                  <label>Weight limit (g):</label>
                  <input
                    type="number"
                    className="packing-canvas-limit-input"
                    value={limitDrafts[container.usergear_registration_id!] ?? maxWeight ?? ''}
                    onChange={(e) => onLimitChange(container.usergear_registration_id!, e.target.value)}
                  />
                  <button
                    className="packing-canvas-limit-save"
                    type="button"
                    onClick={() => onLimitSave(container.usergear_registration_id!)}
                    disabled={busyMap[container.usergear_registration_id!]}
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Contained items */}
              {children.length > 0 && (
                <div className="packing-canvas-items">
                  {children.map((child) => (
                    <div key={child.container_link_id ?? child.usergear_registration_id} className="packing-canvas-item">
                      <span className="packing-canvas-item-name">{child.gear_name}</span>
                      <span className="packing-canvas-item-weight">{child.gear_weight}g</span>
                      <button
                        className="packing-canvas-item-remove"
                        type="button"
                        onClick={() => onRemoveFromContainer(child.container_link_id!)}
                        aria-label="Remove from container"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {children.length === 0 && (
                <div className="packing-canvas-container-empty">
                  Drag gear here to pack
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
