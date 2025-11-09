import { ReactNode } from 'react';

import './PageHero.css';

export interface PageHeroMetric {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}

interface PageHeroProps {
  title: string;
  subtitle: string;
  badge?: string;
  metrics?: PageHeroMetric[];
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHero({ title, subtitle, badge, metrics, actions, children }: PageHeroProps) {
  return (
    <section className="page-hero" aria-labelledby="page-hero-title">
      <div className="page-hero-copy">
        {badge && <span className="page-hero-badge">{badge}</span>}
        <h2 id="page-hero-title">{title}</h2>
        <p>{subtitle}</p>
        {children && <div className="page-hero-extra">{children}</div>}
      </div>
      <div className="page-hero-aside">
        {actions && <div className="page-hero-actions">{actions}</div>}
        {metrics && metrics.length > 0 && (
          <div className="page-hero-metrics" role="list">
            {metrics.map((metric) => (
              <article key={metric.label} className={`page-hero-metric metric-${metric.tone ?? 'default'}`} role="listitem">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">{metric.value}</span>
                {metric.hint && <span className="metric-hint">{metric.hint}</span>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
