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
  /** Nombre d’éléments — défile si > 1 */
  itemCount?: number;
  /** Vitesse (px/s) */
  speed?: number;
  className?: string;
  trackClassName?: string;
};

/**
 * Bandeau défilant — durée proportionnelle à la largeur du contenu.
 */
export function MarqueeTrack({
  children,
  itemCount = 2,
  speed = 30,
  className = "",
  trackClassName = "",
}: MarqueeTrackProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [durationSec, setDurationSec] = useState(
    () => Math.max(itemCount * 10, 35),
  );

  const shouldScroll = itemCount > 1;

  useEffect(() => {
    if (!shouldScroll) return;

    const setEl = setRef.current;
    const wrapEl = wrapRef.current;
    if (!setEl || !wrapEl) return;

    const measure = () => {
      const contentW = setEl.scrollWidth || setEl.offsetWidth;
      if (contentW <= 0) return;
      setDurationSec(Math.max(contentW / speed, Math.max(itemCount * 8, 28)));
    };

    measure();
    const t1 = window.setTimeout(measure, 100);
    const t2 = window.setTimeout(measure, 500);
    const ro = new ResizeObserver(measure);
    ro.observe(setEl);
    ro.observe(wrapEl);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [children, speed, itemCount, shouldScroll]);

  if (!shouldScroll) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className={`flex justify-center whitespace-nowrap ${trackClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  const trackStyle: CSSProperties = {
    ["--marquee-duration" as string]: `${durationSec}s`,
    animation: `marquee-scroll ${durationSec}s linear infinite`,
  };

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
