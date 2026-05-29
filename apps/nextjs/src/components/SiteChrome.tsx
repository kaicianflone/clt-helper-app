"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BottomTabBar } from "~/components/BottomTabBar";
import { SiteHeader } from "~/components/SiteHeader";
import { SkipToContent } from "~/components/SkipToContent";

export function SiteChrome(props: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The /map route renders a full-viewport map and provides its own <main>.
  // Suppress all site chrome so the map fills the viewport with no page
  // scrollbar on desktop and mobile.
  if (pathname === "/map") {
    return <>{props.children}</>;
  }

  return (
    <>
      <SkipToContent />
      <SiteHeader />
      <main id="main-content" className="pb-16 md:pb-0">
        {props.children}
      </main>
      <footer className="py-6 text-center text-xs text-[color:var(--fg-ink-muted)]">
        <Link
          href="/privacy"
          className="underline hover:text-[color:var(--fg-ink)]"
        >
          Privacy
        </Link>
      </footer>
      <BottomTabBar />
    </>
  );
}
