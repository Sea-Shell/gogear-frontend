import { ReactNode } from 'react';

import './FilterBar.css';

interface FilterBarProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'highlight';
}

export function FilterBar({ title, subtitle, children, actions, tone = 'default' }: FilterBarProps) {
  return (
    <section className={`filter-bar tone-${tone}`}>
      <header className="filter-bar-header">
        <div>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="filter-bar-actions">{actions}</div>}
      </header>
      <div className="filter-bar-grid">{children}</div>
    </section>
  );
}
