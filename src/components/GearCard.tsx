import { useState } from 'react';
import type { GearListItem } from '../api/types';
import { IconTrash, IconPlus, IconEdit } from './icons';
import { getCategoryColor } from '../utils/colors';

import './GearCard.css';

interface GearCardProps {
  gear: GearListItem;
  onAddToLoadout?: (gear: GearListItem) => void;
  onEdit?: (gear: GearListItem) => void;
  onDelete?: (gear: GearListItem) => void;
}

export function GearCard({ gear, onAddToLoadout, onEdit, onDelete }: GearCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dotColor = getCategoryColor(gear.category_name ?? gear.top_category_name);

  return (
    <div
      className="gear-card-c"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="gear-card-c-main">
        <span className="gear-card-c-dot" style={{ backgroundColor: dotColor }} />
        <span className="gear-card-c-name">{gear.gear_name ?? 'Unnamed gear'}</span>
        {gear.gear_weight != null && (
          <span className="gear-card-c-weight">{gear.gear_weight}g</span>
        )}
      </div>
      {gear.category_name && (
        <div className="gear-card-c-category">{gear.category_name}</div>
      )}
      <div className={`gear-card-c-actions${isHovered ? ' is-visible' : ''}`}>
        {onAddToLoadout && (
          <button className="gear-card-c-action" type="button" onClick={() => onAddToLoadout(gear)} title="Add to loadout">
            <IconPlus style={{ width: 14, height: 14 }} />
            <span>Add</span>
          </button>
        )}
        {onEdit && (
          <button className="gear-card-c-action" type="button" onClick={() => onEdit(gear)} title="Edit gear">
            <IconEdit style={{ width: 14, height: 14 }} />
            <span>Edit</span>
          </button>
        )}
        {onDelete && (
          <button className="gear-card-c-action gear-card-c-action--danger" type="button" onClick={() => onDelete(gear)} title="Delete gear">
            <IconTrash style={{ width: 14, height: 14 }} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
