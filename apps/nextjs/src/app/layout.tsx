import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@clt/ui";

import { BottomTabBar } from "~/components/BottomTabBar";
import { SiteHeader } from "~/components/SiteHeader";
import { SkipToContent } from "~/components/SkipToContent";
import { fontDisplay, fontSans } from "~/styles/fonts";
import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/tokens.css";
import "~/app/styles.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Charlotte Greenways",
    default: "Charlotte Greenways",
  },
  description:
    "Charlotte's greenways, local deals, and parking — community-maintained.",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(fontDisplay.variable, fontSans.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          "bg-[color:var(--bg-cream)] text-[color:var(--fg-ink)]",
        )}
      >
        <SkipToContent />
        <SiteHeader />
        <TRPCReactProvider>
          <main id="main-content" className="pb-16 md:pb-0">
            {props.children}
          </main>
        </TRPCReactProvider>
        <footer className="py-6 text-center text-xs text-[color:var(--fg-ink-muted)]">
          <Link
            href="/privacy"
            className="underline hover:text-[color:var(--fg-ink)]"
          >
            Privacy
          </Link>
        </footer>
        <BottomTabBar />
      </body>
    </html>
  );
}
