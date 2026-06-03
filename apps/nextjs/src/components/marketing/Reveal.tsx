// apps/nextjs/src/components/marketing/Reveal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps content in a scroll-triggered fade-up. Under prefers-reduced-motion
 * the content is shown immediately and never animates.
 */
export function Reveal(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={["mkt-reveal", shown ? "mkt-reveal-in" : "", props.className ?? ""]
        .join(" ")
        .trim()}
    >
      {props.children}
    </div>
  );
}
