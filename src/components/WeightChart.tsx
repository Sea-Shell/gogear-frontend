import './WeightChart.css';

interface WeightSegment {
  label: string;
  weight: number;
  color: string;
}

interface WeightChartProps {
  segments: WeightSegment[];
  totalWeight: number;
}

const CHART_COLORS = [
  '#7d9b76', /* sage */
  '#8baec4', /* sky */
  '#c4943e', /* amber */
  '#b85c4a', /* ember */
  '#adaba7', /* faint */
  '#2c2e33', /* ink */
  '#8b9a7e',
  '#a4b8a7',
  '#d4b87a',
  '#c9a094',
];

export function WeightChart({ segments, totalWeight }: WeightChartProps) {
  if (totalWeight === 0) return null;

  const filtered = segments.filter((s) => s.weight > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="weight-chart">
      <div className="weight-chart-bar">
        {filtered.map((seg, i) => {
          const pct = (seg.weight / totalWeight) * 100;
          return (
            <div
              key={seg.label}
              className="weight-chart-segment"
              style={{
                width: `${pct}%`,
                backgroundColor: seg.color || CHART_COLORS[i % CHART_COLORS.length]
              }}
              title={`${seg.label}: ${seg.weight}g (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="weight-chart-legend">
        {filtered.map((seg, i) => (
          <div key={seg.label} className="weight-chart-legend-item">
            <span
              className="weight-chart-legend-dot"
              style={{ backgroundColor: seg.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span>{seg.label}</span>
            <span>{seg.weight}g</span>
          </div>
        ))}
      </div>
      <div className="weight-chart-total">
        Total: {totalWeight}g
      </div>
    </div>
  );
}
