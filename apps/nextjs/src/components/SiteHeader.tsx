"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CrownIcon } from "~/components/CrownIcon";

const navLinks = [
  { label: "Greenways", href: "/greenways" },
  { label: "Deals", href: "/deals" },
  { label: "Parking", href: "/parking" },
  { label: "Map", href: "/map" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className="hidden h-12 w-full items-center border-b border-[color:var(--border-soft)] bg-[color:var(--bg-cream)] px-6 pt-[env(safe-area-inset-top)] md:flex"
      role="banner"
    >
      <Link
        href="/"
        className="flex items-center gap-1.5 font-display text-2xl font-bold uppercase tracking-wider text-[color:var(--brick)] hover:opacity-80"
        aria-label="clt — home"
      >
        <CrownIcon size={14} />
        clt
      </Link>
      <nav
        className="ml-8 flex items-center gap-6"
        aria-label="Main navigation"
      >
        {navLinks.map(({ label, href }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "border-b-2 pb-px text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                isActive
                  ? "border-[color:var(--brick)] text-[color:var(--brick)]"
                  : "border-transparent text-[color:var(--fg-ink-soft)] hover:text-[color:var(--fg-ink)]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
