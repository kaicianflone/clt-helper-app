import type { Metadata, Viewport } from "next";

import { cn } from "@clt/ui";

import { fontDisplay, fontSans } from "~/styles/fonts";

import "~/styles/tokens.css";
import "~/app/styles.css";

export const metadata: Metadata = {
  title: {
    default: "CLT Greenways — greenways and restaurant deals for Charlotte",
    template: "%s | clt",
  },
  description:
    "CLT Greenways is a free iPhone app for Charlotte greenways and daily restaurant deals. Independent; not affiliated with the City of Charlotte or Mecklenburg County.",
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
        {props.children}
      </body>
    </html>
  );
}
