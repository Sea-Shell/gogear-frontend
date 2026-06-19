import './ProgressBar.css';

interface ProgressBarProps {
  packed: number;
  total: number;
  packedWeight: number;
  totalWeight: number;
}

export function ProgressBar({ packed, total, packedWeight, totalWeight }: ProgressBarProps) {
  const countPct = total > 0 ? (packed / total) * 100 : 0;
  const weightPct = totalWeight > 0 ? (packedWeight / totalWeight) * 100 : 0;

  return (
    <div className="progress-bar">
      <div className="progress-bar-bars">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(countPct, 100)}%` }}
            role="progressbar"
            aria-valuenow={packed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${packed} of ${total} items packed`}
          />
        </div>
        <div className="progress-bar-track weight">
          <div
            className="progress-bar-fill weight"
            style={{ width: `${Math.min(weightPct, 100)}%` }}
            role="progressbar"
            aria-valuenow={packedWeight}
            aria-valuemin={0}
            aria-valuemax={totalWeight}
            aria-label={`${packedWeight}g of ${totalWeight}g packed`}
          />
        </div>
      </div>

      <div className="progress-bar-labels">
        <span className="progress-bar-label count">
          {packed}/{total} items packed
        </span>
        <span className="progress-bar-label weight">
          {packedWeight}g / {totalWeight}g packed
        </span>
      </div>
    </div>
  );
}
