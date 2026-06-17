"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Scoped GSAP timeline for an infocard's narrative reveal.
 *
 * - `build` receives the timeline + the card root; use root-scoped selectors
 *   (gsap.context scopes selector text to the root).
 * - Honors prefers-reduced-motion: the timeline is built paused and snapped to
 *   its final state, so the content is fully visible with NO animation.
 * - Fully reverted on unmount (gsap.context.revert restores inline styles), so
 *   nothing leaks between cards.
 *
 * Returns a ref to attach to the card root element.
 */
export function useGsapReveal(
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void,
) {
  const ref = useRef<HTMLDivElement>(null);

  // useLayoutEffect so GSAP's `from` start-state applies before the first paint
  // (no flash of fully-rendered content). Safe: cards are ssr:false dynamic.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.5 },
      });
      build(tl, root);
      if (reduce) tl.progress(1); // snap to final state, no motion
      else tl.play();
    }, root);

    return () => ctx.revert();
    // The reveal runs once on mount; the card supplies a stable builder closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
