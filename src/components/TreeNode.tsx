import { useRef, useState } from 'react';
import type { LoadoutTreeNode } from '../api/types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { IconChevronDown, IconChevronRight } from './icons';
import { getCategoryColor } from '../utils/colors';

import './TreeNode.css';

interface TreeNodeProps {
  node: LoadoutTreeNode;
  depth: number;
  onToggleExpand: (id: number) => void;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
  onPackToggle: (id: number, packed: boolean) => void;
}

export function TreeNode({
  node,
  depth,
  onToggleExpand,
  onSelect,
  onRemove,
  onPackToggle
}: TreeNodeProps) {
  const mode = useWorkspaceStore((s) => s.mode);
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId);
  const [isDragOver, setIsDragOver] = useState<'before' | 'after' | 'inside' | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === node.loadout_item_id;
  const isExpanded = node.children && node.children.length > 0;
  const hasChildren = isExpanded && node.children!.length > 0;
  const isContainer = node.is_container;
  const showExpand = hasChildren || isContainer;

  const dotColor = getCategoryColor(node.category_name ?? node.top_category_name);

  /* ─── Drag & Drop handlers (HTML5) ─── */
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(node.loadout_item_id));
    e.dataTransfer.effectAllowed = 'move';
    rowRef.current?.classList.add('dragging');
  };

  const handleDragEnd = () => {
    rowRef.current?.classList.remove('dragging');
    setIsDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rowRef.current) return;

    const rect = rowRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (y < height * 0.25) {
      setIsDragOver('before');
    } else if (y > height * 0.75) {
      setIsDragOver('after');
    } else {
      setIsDragOver(hasChildren ? 'inside' : 'after');
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
    rowRef.current?.classList.remove('drag-over');
  };

  const handleClick = () => {
    onSelect(node.loadout_item_id);
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onPackToggle(node.loadout_item_id, e.target.checked);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Remove "${node.gear_name}" from loadout?`)) {
      onRemove(node.loadout_item_id);
    }
  };

  const totalWeight = node.gear_weight * node.quantity;

  return (
    <li className="tree-node">
      <div
        ref={rowRef}
        className={`tree-node-row${isSelected ? ' selected' : ''}`}
        style={{ '--node-depth': depth } as React.CSSProperties}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop zone indicators */}
        <div className={`tree-node-drop-before${isDragOver === 'before' ? ' active' : ''}`} />
        <div className={`tree-node-drop-after${isDragOver === 'after' ? ' active' : ''}`} />
        {isDragOver === 'inside' && (
          <div className="tree-node-drop-inside active" />
        )}

        {/* Drag handle */}
        <span className="tree-node-grip" title="Drag to reorder">
          &#x283F;
        </span>

        {/* Expand/Collapse */}
        {showExpand ? (
          <button
            className={`tree-node-expand${node.children && node.children.length > 0 ? ' expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.loadout_item_id);
            }}
            type="button"
            aria-label={node.children && node.children.length > 0 ? 'Collapse' : 'Expand'}
          >
            {mode === 'plan' ? (
              <IconChevronRight style={{ width: 14, height: 14 }} />
            ) : (
              <IconChevronDown style={{ width: 14, height: 14 }} />
            )}
          </button>
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} />
        )}

        {/* Category dot */}
        <span className="tree-node-dot" style={{ backgroundColor: dotColor }} />

        {/* Name */}
        <span className={`tree-node-name${node.packed ? ' packed' : ''}`}>
          {node.gear_name}
        </span>

        {/* Quantity badge (hide if 1) */}
        {node.quantity > 1 && (
          <span className="tree-node-qty">&times;{node.quantity}</span>
        )}

        {/* Weight */}
        <span className="tree-node-weight">
          {totalWeight}g
        </span>

        {/* Used-on-trip indicator */}
        <span
          className="tree-node-used idle"
          title="Mark as used — coming soon"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Packed checkbox */}
        <input
          type="checkbox"
          className="tree-node-check"
          checked={node.packed}
          onChange={handleCheckChange}
          onClick={(e) => e.stopPropagation()}
          title={node.packed ? 'Mark as unpacked' : 'Mark as packed'}
        />

        {/* Hover actions */}
        <div className="tree-node-actions">
          <button
            className="tree-node-action-btn danger"
            type="button"
            onClick={handleRemove}
            title="Remove from loadout"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && node.children && (
        <ul className="tree-node-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.loadout_item_id}
              node={child}
              depth={depth + 1}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onRemove={onRemove}
              onPackToggle={onPackToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
