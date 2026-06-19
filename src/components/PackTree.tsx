import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoadoutApi } from '../api/endpoints';
import type { GearListItem, LoadoutTreeNode } from '../api/types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useGearList } from '../hooks/useGearList';
import { getCategoryColor } from '../utils/colors';
import { WeightChart } from './WeightChart';
import { TreeNode } from './TreeNode';
import { IconTrash } from './icons';

import './PackTree.css';
import '../styles/contour.css';

interface PackTreeProps {
  loadoutId: number;
}

/* ─── Join items with gear data ─── */
function joinItemsWithGear(
  items: LoadoutTreeNode[],
  gearMap: Map<number, GearListItem>
): LoadoutTreeNode[] {
  return items.map((item) => {
    const gear = gearMap.get(item.gear_id);
    return {
      ...item,
      gear_name: gear?.gear_name ?? `Gear #${item.gear_id}`,
      gear_weight: gear?.gear_weight ?? 0,
      category_name: gear?.category_name,
      top_category_name: gear?.top_category_name,
      packed: false
    };
  });
}

/* ─── Build weight segments ─── */
function buildWeightSegments(
  nodes: LoadoutTreeNode[]
): { label: string; weight: number; color: string }[] {
  const byCategory = new Map<string, number>();
  for (const n of nodes) {
    const cat = n.category_name || n.top_category_name || 'Uncategorized';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + n.gear_weight * n.quantity);
  }
  return Array.from(byCategory.entries())
    .map(([label, weight]) => ({
      label,
      weight,
      color: getCategoryColor(label)
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function PackTree({ loadoutId }: PackTreeProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mode = useWorkspaceStore((s) => s.mode);
  const setMode = useWorkspaceStore((s) => s.setMode);
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode);

  /* ── Fetch loadout ── */
  const loadoutQuery = useQuery({
    queryKey: ['loadout', loadoutId],
    queryFn: () => LoadoutApi.get(loadoutId),
    enabled: !Number.isNaN(loadoutId)
  });

  /* ── Fetch items ── */
  const itemsQuery = useQuery({
    queryKey: ['loadout', loadoutId, 'items'],
    queryFn: () => LoadoutApi.itemList(loadoutId),
    enabled: !Number.isNaN(loadoutId)
  });

  /* ── Fetch gear catalog for joins ── */
  const gearQuery = useGearList();

  /* ── Build gear lookup ── */
  const gearMap = useMemo(() => {
    const map = new Map<number, GearListItem>();
    const items = gearQuery.data?.items ?? [];
    for (const g of items) {
      if (g.gear_id != null) map.set(g.gear_id, g);
    }
    return map;
  }, [gearQuery.data]);

  /* ── Join items with gear data ── */
  const treeData: LoadoutTreeNode[] = useMemo(() => {
    if (!itemsQuery.data) return [];
    const rawItems = itemsQuery.data.map((item) => ({
      ...item,
      gear_name: '',
      gear_weight: 0,
      packed: false
    }));
    return joinItemsWithGear(rawItems, gearMap);
  }, [itemsQuery.data, gearMap]);

  /* ── Computed totals ── */
  const { totalWeight, baseWeight } = useMemo(() => {
    let total = 0;
    for (const n of treeData) {
      total += n.gear_weight * n.quantity;
    }
    return { totalWeight: total, baseWeight: total };
  }, [treeData]);

  /* ── Weight segments ── */
  const weightSegments = useMemo(() => buildWeightSegments(treeData), [treeData]);

  /* ── Mutations ── */
  const removeMutation = useMutation({
    mutationFn: (itemId: number) => LoadoutApi.itemRemove(loadoutId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['loadout', loadoutId] });
    }
  });

  const deleteLoadoutMutation = useMutation({
    mutationFn: () => LoadoutApi.remove(loadoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loadouts'] });
      navigate('/loadouts');
    }
  });

  const handleRemove = useCallback(
    (itemId: number) => {
      removeMutation.mutate(itemId);
    },
    [removeMutation]
  );

  const handleToggleExpand = useCallback((_id: number) => {
    void _id;
    /* Placeholder — expand/collapse logic for container groups */
  }, []);

  const handleSelect = useCallback(
    (id: number) => {
      setSelectedNode(id);
    },
    [setSelectedNode]
  );

  const handlePackToggle = useCallback(
    (_itemId: number, _packed: boolean) => {
      void _itemId;
      void _packed;
      /* Optimistic local state — API integration placeholder */
    },
    []
  );

  const handleMarkAllPacked = () => {
    /* Placeholder — would iterate all items and call API */
  };

  const handleClearPacked = () => {
    /* Placeholder */
  };

  const handleDeleteLoadout = () => {
    const name = loadoutQuery.data?.loadout_name ?? 'this loadout';
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteLoadoutMutation.mutate();
    }
  };

  const loadout = loadoutQuery.data;

  return (
    <div className={`pack-tree ${mode}-mode`}>
      {/* Tree Toolbar */}
      <div className="pack-tree-toolbar">
        <h2>{loadout?.loadout_name ?? 'Loading...'}</h2>

        {/* Mode switcher */}
        <div className="pack-tree-mode-group">
          {(['plan', 'pack', 'review'] as const).map((m) => (
            <button
              key={m}
              className={`pack-tree-mode-btn${mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
              type="button"
            >
              {m === 'plan' ? 'Plan' : m === 'pack' ? 'Pack' : 'Review'}
            </button>
          ))}
        </div>

        {/* Weight display */}
        <div className="pack-tree-weights">
          <span className="pack-tree-weight total">
            <span className="pack-tree-weight-label">Total</span>
            {totalWeight}g
          </span>
          <span className="pack-tree-weight base">
            <span className="pack-tree-weight-label">Base</span>
            {baseWeight}g
          </span>
        </div>

        {/* Bulk actions */}
        {mode === 'pack' && (
          <div className="pack-tree-actions">
            <button
              className="pack-tree-action-btn"
              type="button"
              onClick={handleMarkAllPacked}
            >
              Mark all packed
            </button>
            <button
              className="pack-tree-action-btn"
              type="button"
              onClick={handleClearPacked}
            >
              Clear packed
            </button>
          </div>
        )}
      </div>

      {/* Weight Chart (review mode) */}
      {mode === 'review' && weightSegments.length > 0 && (
        <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <WeightChart segments={weightSegments} totalWeight={totalWeight} />
        </div>
      )}

      {/* Tree content */}
      <div className={`pack-tree-content ${mode === 'review' ? 'review-mode' : ''}`}>
        {itemsQuery.isLoading && (
          <div className="pack-tree-loading">Loading items...</div>
        )}

        {itemsQuery.isError && (
          <div className="pack-tree-empty">
            <p>Failed to load items.</p>
          </div>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && treeData.length === 0 && (
          <div className="pack-tree-empty">
            <p>No items yet. Browse the catalog and add gear to start packing.</p>
          </div>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && treeData.length > 0 && (
          <ul className="pack-tree-list">
            {treeData.map((node) => (
              <TreeNode
                key={node.loadout_item_id}
                node={node}
                depth={0}
                onToggleExpand={handleToggleExpand}
                onSelect={handleSelect}
                onRemove={handleRemove}
                onPackToggle={handlePackToggle}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Delete loadout (small, bottom-left) */}
      <div style={{ padding: '4px 24px 8px', borderTop: '1px solid var(--border-subtle, rgba(44,46,51,0.08))' }}>
        <button
          className="pack-tree-action-btn"
          type="button"
          onClick={handleDeleteLoadout}
          disabled={deleteLoadoutMutation.isPending}
          title="Delete loadout"
        >
          <IconTrash style={{ width: 12, height: 12 }} />
          <span style={{ marginLeft: 4 }}>
            {deleteLoadoutMutation.isPending ? 'Deleting...' : 'Delete'}
          </span>
        </button>
      </div>
    </div>
  );
}
