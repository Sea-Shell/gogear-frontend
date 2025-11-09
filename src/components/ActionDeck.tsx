import { ReactNode, useMemo, useState } from 'react';

import './ActionDeck.css';

export interface ActionDeckItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'create' | 'update' | 'delete' | 'neutral';
  icon?: ReactNode;
  content: ReactNode;
}

interface ActionDeckProps {
  title: string;
  subtitle?: string;
  items: ActionDeckItem[];
}

export function ActionDeck({ title, subtitle, items }: ActionDeckProps) {
  const initialId = useMemo(() => items[0]?.id, [items]);
  const [activeId, setActiveId] = useState<string | undefined>(initialId);

  const activeItem = useMemo(() => items.find((item) => item.id === activeId) ?? items[0], [items, activeId]);

  if (!items.length) {
    return null;
  }

  return (
    <section className="action-deck">
      <header className="action-deck-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <nav className="action-deck-tabs" aria-label={`${title} actions`}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`action-tab${item.id === activeItem?.id ? ' is-active' : ''} tone-${item.tone ?? 'neutral'}`}
              onClick={() => setActiveId(item.id)}
            >
              {item.icon && <span className="action-tab-icon">{item.icon}</span>}
              <span className="action-tab-copy">
                <strong>{item.title}</strong>
                {item.description && <small>{item.description}</small>}
              </span>
            </button>
          ))}
        </nav>
      </header>
      <div className="action-deck-body">{activeItem?.content}</div>
    </section>
  );
}
