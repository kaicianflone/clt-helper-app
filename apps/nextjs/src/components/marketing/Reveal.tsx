"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps content in a scroll-triggered fade-up. Progressive enhancement: content
 * is visible by default (server render, no-JS, reduced-motion, or missing
 * IntersectionObserver all show it immediately). JS opts INTO the hide-then-reveal
 * animation only when motion is allowed and IntersectionObserver is supported.
 */
export function Reveal(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // animate=false means "no mkt-reveal class" => fully visible (CSS default).
  const [animate, setAnimate] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    // Safe + supported: enable the animation (hide now), then reveal on scroll.
    // Use queueMicrotask to avoid calling setState synchronously in the effect body.
    queueMicrotask(() => setAnimate(true));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = animate
    ? ["mkt-reveal", revealed ? "mkt-reveal-in" : "", props.className ?? ""]
    : [props.className ?? ""];

  return (
    <div ref={ref} className={cls.join(" ").trim()}>
      {props.children}
    </div>
  );
}
