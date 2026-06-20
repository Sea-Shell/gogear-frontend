import { type ReactNode, useEffect, useRef, useState } from 'react';

import './SlideOver.css';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Width in px, default 420 */
  width?: number;
}

export function SlideOver({ open, onClose, title, children, width = 420 }: SlideOverProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    if (dirty && !window.confirm('Discard changes?')) return;
    setDirty(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={`slideover-backdrop${animating ? ' visible' : ''}`} onClick={handleClose}>
      <div
        className={`slideover-panel${animating ? ' open' : ''}`}
        style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : width }}
        onClick={(e) => e.stopPropagation()}
        ref={contentRef}
      >
        <div className="slideover-header">
          <h2 className="slideover-title">{title}</h2>
          <button className="slideover-close" type="button" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="slideover-body">
          {children}
        </div>
      </div>
    </div>
  );
}