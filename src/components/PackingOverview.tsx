import './PackingOverview.css';

export interface PackingMetric {
  label: string;
  value: string | number;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  hint?: string;
  extra?: string;
}

interface PackingOverviewProps {
  metrics: PackingMetric[];
}

export function PackingOverview({ metrics }: PackingOverviewProps) {
  if (!metrics.length) return null;

  return (
    <section className="packing-overview">
      {metrics.map((m) => (
        <article key={m.label} className={`packing-overview-card tone-${m.tone ?? 'default'}`}>
          <span className="packing-overview-value">{m.value}</span>
          <span className="packing-overview-label">{m.label}</span>
          {m.hint && <span className="packing-overview-hint">{m.hint}</span>}
          {m.extra && <span className="packing-overview-extra">{m.extra}</span>}
        </article>
      ))}
    </section>
  );
}