import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { GearApi, LoadoutApi } from '../api/endpoints';
import type { GearListItem } from '../api/types';
import { ProgressBar } from '../components/ProgressBar';
import { ContainerAccordion } from '../components/ContainerAccordion';
import { type ChecklistItemRowData } from '../components/ChecklistItemRow';
import { AddGearSheet } from '../components/AddGearSheet';
import { IconPlus } from '../components/icons';

import './MobileChecklistPage.css';

/* ─── Internal types ─── */

interface PackedState {
  [loadoutItemId: number]: boolean;
}

/* ─── Helpers ─── */

function buildGearMap(gearData: GearListItem[] | undefined): Map<number, GearListItem> {
  const map = new Map<number, GearListItem>();
  if (!gearData) return map;
  for (const g of gearData) {
    if (g.gear_id != null) map.set(g.gear_id, g);
  }
  return map;
}

interface GroupInfo {
  name: string;
  items: ChecklistItemRowData[];
  subTotalWeight: number;
}

function groupByCategory(items: ChecklistItemRowData[]): GroupInfo[] {
  const groups = new Map<string, ChecklistItemRowData[]>();
  for (const item of items) {
    const key = item.topCategory || 'Uncategorized';
    const list = groups.get(key);
    if (list) {
      list.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return Array.from(groups.entries())
    .map(([name, groupItems]) => ({
      name,
      items: groupItems,
      subTotalWeight: groupItems.reduce((acc, i) => acc + i.totalWeight, 0)
    }))
    .sort((a, b) => b.subTotalWeight - a.subTotalWeight);
}

/* ─── Quick-Edit Popover ─── */

interface QuickEditProps {
  item: ChecklistItemRowData;
  onSave: (qty: number, notes: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

function QuickEditPopover({ item, onSave, onRemove, onClose }: QuickEditProps) {
  const [qty, setQty] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes ?? '');

  return (
    <div className="checklist-quick-edit-overlay" onClick={onClose}>
      <div
        className="checklist-quick-edit"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Edit item"
      >
        <h4 className="checklist-quick-edit-title">{item.name}</h4>

        <div className="checklist-quick-edit-field">
          <label>Quantity</label>
          <div className="checklist-quick-edit-qty-row">
            <button
              type="button"
              className="checklist-quick-edit-qty-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="checklist-quick-edit-qty-value">{qty}</span>
            <button
              type="button"
              className="checklist-quick-edit-qty-btn"
              onClick={() => setQty(Math.min(99, qty + 1))}
              disabled={qty >= 99}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="checklist-quick-edit-field">
          <label>Notes</label>
          <input
            className="checklist-quick-edit-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
          />
        </div>

        <div className="checklist-quick-edit-actions">
          <button
            type="button"
            className="checklist-quick-edit-btn danger"
            onClick={onRemove}
          >
            Remove
          </button>
          <button
            type="button"
            className="checklist-quick-edit-btn primary"
            onClick={() => onSave(qty, notes)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export function MobileChecklistPage() {
  const { loadoutId } = useParams<{ loadoutId: string }>();
  const numericId = Number(loadoutId);
  const queryClient = useQueryClient();

  /* ── Local state ── */
  const [packedState, setPackedState] = useState<PackedState>(() => {
    try {
      const saved = sessionStorage.getItem(`mob-checklist-packed-${loadoutId}`);
      return saved ? (JSON.parse(saved) as PackedState) : {};
    } catch {
      return {};
    }
  });
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItemRowData | null>(null);

  const persistPacked = useCallback(
    (state: PackedState) => {
      try {
        sessionStorage.setItem(`mob-checklist-packed-${loadoutId}`, JSON.stringify(state));
      } catch {
        /* sessionStorage may be full — silently fail */
      }
    },
    [loadoutId]
  );

  const updatePacked = useCallback(
    (updater: (prev: PackedState) => PackedState) => {
      setPackedState((prev) => {
        const next = updater(prev);
        persistPacked(next);
        return next;
      });
    },
    [persistPacked]
  );

  /* ── Data fetching ── */

  const loadoutQuery = useQuery({
    queryKey: ['loadout', numericId],
    queryFn: () => LoadoutApi.get(numericId),
    enabled: !Number.isNaN(numericId)
  });

  const itemsQuery = useQuery({
    queryKey: ['loadout', numericId, 'items'],
    queryFn: () => LoadoutApi.itemList(numericId),
    enabled: !Number.isNaN(numericId)
  });

  const gearQuery = useQuery({
    queryKey: ['gear', 'list', { limit: 200 }],
    queryFn: () => GearApi.list({ limit: 200 }),
    staleTime: 30_000
  });

  /* ── Build joined items ── */

  const gearMap = useMemo(() => buildGearMap(gearQuery.data?.items), [gearQuery.data]);

  const joinedItems: ChecklistItemRowData[] = useMemo(() => {
    const items = itemsQuery.data ?? [];
    return items.map((item) => {
      const gear = gearMap.get(item.gear_id);
      const w = gear?.gear_weight ?? 0;
      return {
        loadout_item_id: item.loadout_item_id,
        gear_id: item.gear_id,
        notes: item.notes,
        name: gear?.gear_name ?? `Gear #${item.gear_id}`,
        quantity: item.quantity,
        weight: w,
        totalWeight: w * item.quantity,
        packed: packedState[item.loadout_item_id] ?? false,
        category: gear?.category_name ?? '',
        topCategory: gear?.top_category_name ?? '',
        depth: 0
      };
    });
  }, [itemsQuery.data, gearMap, packedState]);

  /* ── Stats ── */

  const stats = useMemo(() => {
    let packedCount = 0;
    let totalCount = 0;
    let packedWeight = 0;
    let totalWeight = 0;
    for (const item of joinedItems) {
      totalCount += item.quantity;
      totalWeight += item.totalWeight;
      if (item.packed) {
        packedCount += item.quantity;
        packedWeight += item.totalWeight;
      }
    }
    return { packedCount, totalCount, packedWeight, totalWeight };
  }, [joinedItems]);

  /* ── Group by top category ── */

  const groups = useMemo(() => groupByCategory(joinedItems), [joinedItems]);

  /* ── Mutations ── */

  const insertMutation = useMutation({
    mutationFn: (gearId: number) =>
      LoadoutApi.itemInsert(numericId, {
        loadout_id: numericId,
        gear_id: gearId,
        quantity: 1,
        notes: ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', numericId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['loadout', numericId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      quantity,
      notes
    }: {
      itemId: number;
      quantity: number;
      notes: string;
    }) =>
      LoadoutApi.itemUpdate(numericId, itemId, {
        loadout_item_id: itemId,
        quantity,
        notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', numericId, 'items'] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => LoadoutApi.itemRemove(numericId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', numericId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['loadout', numericId] });
    }
  });

  /* ── Handlers ── */

  const handleTogglePack = useCallback(
    (itemId: number, packed: boolean) => {
      updatePacked((prev) => ({ ...prev, [itemId]: packed }));
    },
    [updatePacked]
  );

  const handleLongPress = useCallback((item: ChecklistItemRowData) => {
    setEditingItem(item);
  }, []);

  const handleQuickEditSave = useCallback(
    (qty: number, notes: string) => {
      if (!editingItem) return;
      updateMutation.mutate({
        itemId: editingItem.loadout_item_id,
        quantity: qty,
        notes
      });
      setEditingItem(null);
    },
    [editingItem, updateMutation]
  );

  const handleQuickEditRemove = useCallback(() => {
    if (!editingItem) return;
    removeMutation.mutate(editingItem.loadout_item_id);
    setEditingItem(null);
  }, [editingItem, removeMutation]);

  const handleAddGear = useCallback(
    (gearId: number) => {
      insertMutation.mutate(gearId);
    },
    [insertMutation]
  );

  const handleMarkAllPacked = useCallback(
    (groupItems: ChecklistItemRowData[]) => {
      updatePacked((prev) => {
        const next = { ...prev };
        for (const item of groupItems) {
          next[item.loadout_item_id] = true;
        }
        return next;
      });
    },
    [updatePacked]
  );

  const handleClearPacked = useCallback(
    (groupItems: ChecklistItemRowData[]) => {
      updatePacked((prev) => {
        const next = { ...prev };
        for (const item of groupItems) {
          next[item.loadout_item_id] = false;
        }
        return next;
      });
    },
    [updatePacked]
  );

  /* ── Loading / Error ── */

  if (Number.isNaN(numericId)) {
    return (
      <div className="mobile-checklist">
        <div className="notice notice-error">Invalid loadout ID.</div>
      </div>
    );
  }

  return (
    <div className="mobile-checklist">
      {/* Top bar */}
      <div className="mobile-checklist-topbar">
        <Link to={`/loadouts/${numericId}`} className="mobile-checklist-back" aria-label="Back to loadout">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9.293 4.293a1 1 0 0 0 0 1.414L14.586 11l-5.293 5.293a1 1 0 1 0 1.414 1.414l6-6a1 1 0 0 0 0-1.414l-6-6a1 1 0 0 0-1.414 0Z" />
          </svg>
        </Link>
        <h1 className="mobile-checklist-title">
          {loadoutQuery.data?.loadout_name ?? 'Checklist'}
        </h1>
        <div className="mobile-checklist-topbar-spacer" />
      </div>

      {/* Progress */}
      <ProgressBar
        packed={stats.packedCount}
        total={stats.totalCount}
        packedWeight={stats.packedWeight}
        totalWeight={stats.totalWeight}
      />

      {/* Groups */}
      <div className="mobile-checklist-groups">
        {itemsQuery.isLoading && (
          <div className="mobile-checklist-status">Loading items...</div>
        )}

        {itemsQuery.isError && (
          <div className="mobile-checklist-status error">
            Failed to load items.
          </div>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && joinedItems.length === 0 && (
          <div className="mobile-checklist-empty">
            <p>No items in this loadout yet.</p>
            <p className="mobile-checklist-empty-hint">
              Tap the + button below to add gear from the catalog.
            </p>
          </div>
        )}

        {!itemsQuery.isLoading &&
          !itemsQuery.isError &&
          groups.map((group) => (
            <ContainerAccordion
              key={group.name}
              name={group.name}
              items={group.items}
              subTotalWeight={group.subTotalWeight}
              onTogglePack={handleTogglePack}
              onLongPress={handleLongPress}
              onMarkAllPacked={() => handleMarkAllPacked(group.items)}
              onClearPacked={() => handleClearPacked(group.items)}
              defaultExpanded={true}
            />
          ))}
      </div>

      {/* Bottom bar */}
      <div className="mobile-checklist-bottom">
        <div className="mobile-checklist-bottom-stats">
          <span className="mobile-checklist-bottom-total">
            Total: {stats.totalWeight}g
          </span>
          <span className="mobile-checklist-bottom-base">
            Base: {stats.totalWeight}g
          </span>
        </div>
        <button
          className="mobile-checklist-add-btn"
          type="button"
          onClick={() => setShowAddSheet(true)}
          aria-label="Add gear"
        >
          <IconPlus width="18" height="18" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Add Gear Sheet */}
      {showAddSheet && (
        <AddGearSheet
          gearItems={gearQuery.data?.items ?? []}
          onAdd={handleAddGear}
          onClose={() => setShowAddSheet(false)}
          isLoading={gearQuery.isLoading}
        />
      )}

      {/* Quick Edit Popover */}
      {editingItem && (
        <QuickEditPopover
          item={editingItem}
          onSave={handleQuickEditSave}
          onRemove={handleQuickEditRemove}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
