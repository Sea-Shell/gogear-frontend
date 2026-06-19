import { useState } from 'react';
import type { LoadoutTreeNode } from '../api/types';
import { WeightChart } from './WeightChart';
import { getCategoryColor } from '../utils/colors';

import './InspectorPanel.css';

type InspectorTab = 'details' | 'weight' | 'notes';

interface InspectorPanelProps {
  node: LoadoutTreeNode | null;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onUpdateNotes: (itemId: number, notes: string) => void;
  onRemove: (itemId: number) => void;
}

export function InspectorPanel({
  node,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('details');

  if (!node) {
    return (
      <div className="inspector-panel">
        <div className="inspector-panel-header">
          <h3>Inspector</h3>
        </div>
        <div className="inspector-panel-empty">
          Select an item to inspect
        </div>
      </div>
    );
  }

  const totalWeight = node.gear_weight * node.quantity;
  const dotColor = getCategoryColor(node.category_name ?? node.top_category_name);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
    onUpdateQuantity(node.loadout_item_id, qty);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNotes(node.loadout_item_id, e.target.value);
  };

  const weightSegments = [
    {
      label: node.category_name || 'Uncategorized',
      weight: totalWeight,
      color: dotColor
    }
  ];

  return (
    <div className="inspector-panel">
      <div className="inspector-panel-header">
        <h3>{node.gear_name}</h3>
      </div>

      <div className="inspector-panel-tabs">
        {(['details', 'weight', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            className={`inspector-panel-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === 'details' ? 'Details' : tab === 'weight' ? 'Weight' : 'Notes'}
          </button>
        ))}
      </div>

      <div className="inspector-panel-body">
        {activeTab === 'details' && (
          <>
            <div className="inspector-field">
              <span className="inspector-field-label">Category</span>
              <span className="inspector-field-value">
                {node.category_name || node.top_category_name || 'Uncategorized'}
              </span>
            </div>

            <div className="inspector-field">
              <span className="inspector-field-label">Quantity</span>
              <div className="inspector-qty">
                <input
                  type="number"
                  className="inspector-qty-input"
                  value={node.quantity}
                  onChange={handleQuantityChange}
                  min={1}
                />
                <span className="inspector-field-value">
                  &times; {node.gear_weight}g = {totalWeight}g
                </span>
              </div>
            </div>

            <div className="inspector-field">
              <label className="inspector-toggle">
                <input
                  type="checkbox"
                  checked={node.packed}
                  onChange={() => {}}
                />
                Packed
              </label>
            </div>
          </>
        )}

        {activeTab === 'weight' && (
          <>
            <WeightChart
              segments={weightSegments}
              totalWeight={totalWeight}
            />

            <div className="inspector-weight-row">
              <span className="inspector-weight-label">Item weight</span>
              <span className="inspector-weight-value">{node.gear_weight}g</span>
            </div>
            <div className="inspector-weight-row">
              <span className="inspector-weight-label">Quantity</span>
              <span className="inspector-weight-value">&times;{node.quantity}</span>
            </div>
            <div className="inspector-weight-row">
              <span className="inspector-weight-label">Total</span>
              <span className="inspector-weight-value inspector-weight-total">
                {totalWeight}g
              </span>
            </div>
          </>
        )}

        {activeTab === 'notes' && (
          <div className="inspector-field">
            <span className="inspector-field-label">Notes</span>
            <textarea
              className="inspector-notes"
              value={node.notes ?? ''}
              onChange={handleNotesChange}
              placeholder="Add notes for this item..."
            />
          </div>
        )}

        <button
          className="inspector-remove"
          type="button"
          onClick={() => onRemove(node.loadout_item_id)}
        >
          Remove from loadout
        </button>
      </div>
    </div>
  );
}
