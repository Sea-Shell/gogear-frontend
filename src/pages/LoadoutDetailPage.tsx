import { useParams } from 'react-router-dom';

import { LoadoutWorkspace } from '../components/LoadoutWorkspace';

import './LoadoutDetailPage.css';

export function LoadoutDetailPage() {
  const { loadoutId } = useParams<{ loadoutId: string }>();
  const numericId = Number(loadoutId);

  if (Number.isNaN(numericId)) {
    return (
      <div className="loadout-detail-page">
        <div className="notice notice-error">Invalid loadout ID.</div>
      </div>
    );
  }

  return (
    <div className="loadout-detail-page">
      <LoadoutWorkspace loadoutId={numericId} />
    </div>
  );
}
