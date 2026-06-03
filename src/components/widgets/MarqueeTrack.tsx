"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type MarqueeTrackProps = {
  children: ReactNode;
  /** Vitesse de défilement (px/s) — plus bas = plus lent et lisible */
  speed?: number;
  className?: string;
  trackClassName?: string;
};

/**
 * Bandeau défilant : durée calculée sur la largeur réelle du contenu
 * pour laisser le temps de lire toutes les annonces avant la boucle.
 */
export function MarqueeTrack({
  children,
  speed = 32,
  className = "",
  trackClassName = "",
}: MarqueeTrackProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [staticView, setStaticView] = useState(false);

  useEffect(() => {
    const setEl = setRef.current;
    const wrapEl = wrapRef.current;
    if (!setEl || !wrapEl) return;

    const measure = () => {
      const contentW = setEl.offsetWidth;
      const viewW = wrapEl.clientWidth;
      if (contentW <= 0) return;

      if (contentW <= viewW + 8) {
        setStaticView(true);
        setDurationSec(null);
        return;
      }

      setStaticView(false);
      const sec = Math.max(contentW / speed, 20);
      setDurationSec(sec);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(setEl);
    ro.observe(wrapEl);
    return () => ro.disconnect();
  }, [children, speed]);

  const trackStyle: CSSProperties | undefined = durationSec
    ? ({ "--marquee-duration": `${durationSec}s` } as CSSProperties)
    : undefined;

  if (staticView) {
    return (
      <div ref={wrapRef} className={`overflow-hidden ${className}`}>
        <div className={`flex justify-center whitespace-nowrap ${trackClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <div
        className={`marquee-track flex w-max whitespace-nowrap ${trackClassName}`}
        style={trackStyle}
      >
        <div ref={setRef} className="flex shrink-0">
          {children}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
