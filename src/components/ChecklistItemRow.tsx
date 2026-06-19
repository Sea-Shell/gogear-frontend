import { useCallback, useRef } from 'react';
import clsx from 'clsx';

import './ChecklistItemRow.css';

export interface ChecklistItemRowData {
  loadout_item_id: number;
  gear_id: number;
  name: string;
  quantity: number;
  weight: number;
  totalWeight: number;
  packed: boolean;
  category: string;
  topCategory: string;
  depth: number;
  notes?: string;
}

interface ChecklistItemRowProps {
  item: ChecklistItemRowData;
  onTogglePack: (itemId: number, packed: boolean) => void;
  onLongPress: (item: ChecklistItemRowData) => void;
}

export function ChecklistItemRow({ item, onTogglePack, onLongPress }: ChecklistItemRowProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleTouchStart = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress(item);
    }, 600);
  }, [item, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTriggered.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (!longPressTriggered.current) {
      onTogglePack(item.loadout_item_id, !item.packed);
    }
    longPressTriggered.current = false;
  }, [item, onTogglePack]);

  return (
    <div
      className={clsx('checklist-item-row', {
        'is-packed': item.packed,
        [`depth-${Math.min(item.depth, 4)}`]: item.depth > 0
      })}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTogglePack(item.loadout_item_id, !item.packed);
        }
      }}
      aria-label={`${item.name}, ${item.packed ? 'packed' : 'not packed'}, ${item.totalWeight}g`}
    >
      {/* Checkbox */}
      <span
        className={clsx('checklist-item-checkbox', {
          'is-checked': item.packed
        })}
        aria-hidden="true"
      >
        {item.packed ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M9 16.17l-4.17-4.17a1 1 0 1 0-1.41 1.41l5.5 5.5a1 1 0 0 0 .71.29.94.94 0 0 0 .7-.29L20.7 7.7a1 1 0 0 0-1.41-1.42L9 16.17Z" />
          </svg>
        ) : null}
      </span>

      {/* Item name */}
      <span className="checklist-item-name">{item.name}</span>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <span className="checklist-item-qty" aria-label={`Quantity ${item.quantity}`}>
          &times;{item.quantity}
        </span>
      )}

      {/* Spacer */}
      <span className="checklist-item-spacer" />

      {/* Weight */}
      <span className="checklist-item-weight">{item.totalWeight}g</span>

      {/* Used-indicator dot */}
      <span
        className="checklist-item-used-dot"
        title="Coming soon — used on trip"
        aria-label="Used on trip indicator — coming soon"
      />
    </div>
  );
}
