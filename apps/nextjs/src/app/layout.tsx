import type { Metadata, Viewport } from "next";

import { cn } from "@clt/ui";

import { SiteChrome } from "~/components/SiteChrome";
import { fontDisplay, fontSans } from "~/styles/fonts";
import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/tokens.css";
import "~/app/styles.css";

export const metadata: Metadata = {
  title: {
    default: "Today in Charlotte | clt",
    template: "%s | clt",
  },
  description:
    "Charlotte's greenways, local deals, and parking — community-maintained.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <TRPCReactProvider>
          <SiteChrome>{props.children}</SiteChrome>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
