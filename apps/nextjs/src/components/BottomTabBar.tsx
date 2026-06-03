"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CrownIcon } from "~/components/CrownIcon";

const tabs = [
  {
    label: "Greenways",
    href: "/greenways",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Tree / leaf icon */}
        <path d="M12 22V12" />
        <path d="M5 12h14" />
        <path d="M12 12C12 7 7 4 7 4s5 1 5 8z" />
        <path d="M12 12C12 7 17 4 17 4s-5 1-5 8z" />
        <path d="M12 12C12 17 7 20 7 20s5-1 5-8z" />
        <path d="M12 12C12 17 17 20 17 20s-5-1-5-8z" />
      </svg>
    ),
  },
  {
    label: "Deals",
    href: "/deals",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Tag / percent icon */}
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: "Map",
    href: "/map",
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Map pin icon */}
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 flex min-h-16 w-full items-stretch border-t border-[color:var(--border-soft)] bg-[color:var(--bg-cream)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <Link
        href="/today"
        aria-label="Home"
        className="flex w-12 items-center justify-center text-[color:var(--fg-ink-muted)]"
      >
        <CrownIcon size={18} color="currentColor" />
      </Link>
      {tabs.map(({ label, href, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
              isActive
                ? "text-[color:var(--brick)]"
                : "text-[color:var(--fg-ink-muted)] hover:text-[color:var(--fg-ink)]",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
