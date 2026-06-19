import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { LoadoutApi } from '../api/endpoints';
import type { GearListItem, LoadoutTreeNode } from '../api/types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useGearList } from '../hooks/useGearList';
import { CatalogPanel } from './CatalogPanel';
import { PackTree } from './PackTree';
import { InspectorPanel } from './InspectorPanel';

import './LoadoutWorkspace.css';

interface LoadoutWorkspaceProps {
  loadoutId: number;
}

export function LoadoutWorkspace({ loadoutId }: LoadoutWorkspaceProps) {
  const queryClient = useQueryClient();

  const mode = useWorkspaceStore((s) => s.mode);
  const catalogOpen = useWorkspaceStore((s) => s.catalogOpen);
  const inspectorOpen = useWorkspaceStore((s) => s.inspectorOpen);
  const toggleCatalog = useWorkspaceStore((s) => s.toggleCatalog);
  const toggleInspector = useWorkspaceStore((s) => s.toggleInspector);
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId);
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode);

  /* ── Items query (needed by InspectorPanel) ── */
  const itemsQuery = useQuery({
    queryKey: ['loadout', loadoutId, 'items'],
    queryFn: () => LoadoutApi.itemList(loadoutId),
    enabled: !Number.isNaN(loadoutId)
  });

  const gearQuery = useGearList();

  /* ── Build gear lookup for inspector ── */
  const gearMap = new Map<number, GearListItem>();
  const gearItems = gearQuery.data?.items ?? [];
  for (const g of gearItems) {
    if (g.gear_id != null) gearMap.set(g.gear_id, g);
  }

  /* ── Transform item helper ── */
  function transformItem(
    item: import('../api/types').LoadoutItem
  ): LoadoutTreeNode {
    const gear = gearMap.get(item.gear_id);
    return {
      ...item,
      gear_name: gear?.gear_name ?? `Gear #${item.gear_id}`,
      gear_weight: gear?.gear_weight ?? 0,
      category_name: gear?.category_name,
      top_category_name: gear?.top_category_name,
      packed: false
    };
  }

  /* ── Find selected node ── */
  const rawItem =
    (itemsQuery.data ?? []).find(
      (n) => n.loadout_item_id === selectedNodeId
    ) ?? null;
  const selectedNode = rawItem ? transformItem(rawItem) : null;

  /* ── Mutations ── */
  const insertMutation = useMutation({
    mutationFn: (payload: { gear_id: number; quantity: number; notes: string }) =>
      LoadoutApi.itemInsert(loadoutId, {
        loadout_id: loadoutId,
        gear_id: payload.gear_id,
        quantity: payload.quantity,
        notes: payload.notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      payload
    }: {
      itemId: number;
      payload: { quantity: number; notes: string };
    }) => LoadoutApi.itemUpdate(loadoutId, itemId, {
      loadout_item_id: itemId,
      quantity: payload.quantity,
      notes: payload.notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId, 'items'] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => LoadoutApi.itemRemove(loadoutId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId] });
      if (selectedNodeId != null) setSelectedNode(null);
    }
  });

  const handleAddItem = useCallback(
    (gear: GearListItem) => {
      if (gear.gear_id == null) return;
      insertMutation.mutate({
        gear_id: gear.gear_id,
        quantity: 1,
        notes: ''
      });
    },
    [insertMutation]
  );

  const handleUpdateQuantity = useCallback(
    (itemId: number, quantity: number) => {
      const item = itemsQuery.data?.find((i) => i.loadout_item_id === itemId);
      updateMutation.mutate({
        itemId,
        payload: { quantity, notes: item?.notes ?? '' }
      });
    },
    [updateMutation, itemsQuery.data]
  );

  const handleUpdateNotes = useCallback(
    (itemId: number, notes: string) => {
      const item = itemsQuery.data?.find((i) => i.loadout_item_id === itemId);
      updateMutation.mutate({
        itemId,
        payload: { quantity: item?.quantity ?? 1, notes }
      });
    },
    [updateMutation, itemsQuery.data]
  );

  const handleRemove = useCallback(
    (itemId: number) => {
      removeMutation.mutate(itemId);
    },
    [removeMutation]
  );

  /* Catalog toggle button rendered in toolbar area */
  const showCatalog = catalogOpen && mode !== 'review';
  const showInspector = inspectorOpen && mode !== 'review';

  return (
    <div className="workspace">
      {/* Catalog panel (left) */}
      {showCatalog && (
        <div className="workspace-catalog">
          <CatalogPanel loadoutId={loadoutId} onAddItem={handleAddItem} />
        </div>
      )}

      {/* Pack Tree (center) */}
      <div className="workspace-tree">
        {/* Panel toggle buttons (floating above tree) */}
        {mode === 'plan' && (
          <div style={{
            display: 'flex',
            gap: 'var(--space-xs, 4px)',
            padding: '4px 8px',
            borderBottom: '1px solid var(--border-subtle, rgba(44,46,51,0.08))'
          }}>
            <button
              className="pack-tree-action-btn"
              type="button"
              onClick={toggleCatalog}
              title={catalogOpen ? 'Close catalog' : 'Open catalog'}
            >
              {catalogOpen ? '◀ Catalog' : '▶ Catalog'}
            </button>
            <button
              className="pack-tree-action-btn"
              type="button"
              onClick={toggleInspector}
              title={inspectorOpen ? 'Close inspector' : 'Open inspector'}
            >
              {inspectorOpen ? 'Inspector ▶' : 'Inspector ◀'}
            </button>
          </div>
        )}

        <PackTree loadoutId={loadoutId} />
      </div>

      {/* Inspector panel (right) */}
      {showInspector && (
        <div className="workspace-inspector">
          <InspectorPanel
            node={selectedNode}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateNotes={handleUpdateNotes}
            onRemove={handleRemove}
          />
        </div>
      )}
    </div>
  );
}
