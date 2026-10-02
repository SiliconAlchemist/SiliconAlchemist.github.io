'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';

// Keep the portfolio accessible if the scene bundle or WebGL setup fails.
export class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SceneLoader({ ready }: { ready: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (ready) {
      const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
      const timer = setTimeout(() => setDismissed(true), duration);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  useEffect(() => {
    if (dismissed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`scene-loader${ready ? ' is-ready' : ''}`}
      role="status"
      aria-label={ready ? 'Ready to explore' : 'Loading'}
    >
      <span className="scene-loader-spinner" aria-hidden="true" />
    </div>
  );
}
