import { type ReactNode } from 'react';
import './PackingCanvas.css';

interface PackingCanvasProps {
  children: ReactNode;
}

export function PackingCanvas({ children }: PackingCanvasProps) {
  const hasChildren = children !== null && children !== undefined;

  return (
    <section className="packing-canvas">
      <h3 className="packing-canvas-title">Packing canvas</h3>

      {!hasChildren && (
        <div className="packing-canvas-empty">
          No containers yet. Register gear as containers to get started.
        </div>
      )}

      {hasChildren && (
        <div className="packing-canvas-children">
          {children}
        </div>
      )}
    </section>
  );
}
