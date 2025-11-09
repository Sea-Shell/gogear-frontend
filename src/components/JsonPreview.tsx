import { useMemo } from 'react';

import './JsonPreview.css';

interface JsonPreviewProps {
  title: string;
  data: unknown;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function JsonPreview({ title, data, isLoading, emptyMessage = 'Nothing selected yet.' }: JsonPreviewProps) {
  const pretty = useMemo(() => {
    if (data === undefined || data === null) return null;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return typeof data === 'string' ? data : 'Unable to display payload';
    }
  }, [data]);

  return (
    <section className="json-preview-card">
      <header>
        <h3>{title}</h3>
        {isLoading && <span className="json-preview-status">Fetching…</span>}
      </header>
      <div className="json-preview-body">
        {pretty ? <pre>{pretty}</pre> : <span className="json-preview-empty">{emptyMessage}</span>}
      </div>
    </section>
  );
}
