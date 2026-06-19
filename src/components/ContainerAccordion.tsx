import { useCallback, useState } from 'react';
import clsx from 'clsx';

import { ChecklistItemRow, type ChecklistItemRowData } from './ChecklistItemRow';
import { IconChevronDown, IconChevronRight } from './icons';

import './ContainerAccordion.css';

interface ContainerAccordionProps {
  name: string;
  items: ChecklistItemRowData[];
  subTotalWeight: number;
  onTogglePack: (itemId: number, packed: boolean) => void;
  onLongPress: (item: ChecklistItemRowData) => void;
  onMarkAllPacked: () => void;
  onClearPacked: () => void;
  defaultExpanded?: boolean;
}

export function ContainerAccordion({
  name,
  items,
  subTotalWeight,
  onTogglePack,
  onLongPress,
  onMarkAllPacked,
  onClearPacked,
  defaultExpanded = true
}: ContainerAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  if (items.length === 0) return null;

  const packedCount = items.filter((i) => i.packed).length;

  return (
    <div className="container-accordion">
      {/* Header */}
      <button
        className="container-accordion-header"
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
      >
        <span className="container-accordion-chevron">
          {expanded ? <IconChevronDown width={14} height={14} /> : <IconChevronRight width={14} height={14} />}
        </span>
        <span className="container-accordion-name">{name}</span>
        <span className="container-accordion-meta">
          <span className="container-accordion-count">{packedCount}/{items.length}</span>
          <span className="container-accordion-weight">{subTotalWeight}g</span>
        </span>
      </button>

      {/* Bulk actions */}
      <div className="container-accordion-actions">
        <button
          className="container-accordion-action-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAllPacked();
          }}
        >
          Mark all packed
        </button>
        <button
          className="container-accordion-action-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClearPacked();
          }}
        >
          Clear packed
        </button>
      </div>

      {/* Children */}
      <div
        className={clsx('container-accordion-content', {
          'is-collapsed': !expanded
        })}
      >
        {items.map((item) => (
          <ChecklistItemRow
            key={item.loadout_item_id}
            item={item}
            onTogglePack={onTogglePack}
            onLongPress={onLongPress}
          />
        ))}
      </div>
    </div>
  );
}
