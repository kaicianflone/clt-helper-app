// apps/nextjs/src/app/page.tsx
import type { Metadata } from "next";

import { CommunityStory } from "~/components/marketing/CommunityStory";
import { DomainColumns } from "~/components/marketing/DomainColumns";
import { DownloadFooter } from "~/components/marketing/DownloadFooter";
import { GlyphDivider } from "~/components/marketing/GlyphDivider";
import { Hero } from "~/components/marketing/Hero";
import { MarketingHeader } from "~/components/marketing/MarketingHeader";
import { Reveal } from "~/components/marketing/Reveal";
import { SkipToContent } from "~/components/SkipToContent";

import "~/styles/marketing.css";

export const metadata: Metadata = {
  title: {
    absolute: "CLT Greenways — greenways and restaurant deals for Charlotte",
  },
  description:
    "CLT Greenways is a free iPhone app for Charlotte greenways and daily restaurant deals. Independent; not affiliated with the City of Charlotte or Mecklenburg County.",
};

export default function MarketingPage() {
  return (
    <>
      <SkipToContent />
      <MarketingHeader />
      <main id="main-content">
        <Hero />
        <Reveal>
          <GlyphDivider glyph="⟡" />
        </Reveal>
        <Reveal>
          <DomainColumns />
        </Reveal>
        <Reveal>
          <GlyphDivider glyph="✦" />
        </Reveal>
        <Reveal>
          <CommunityStory />
        </Reveal>
        <Reveal>
          <DownloadFooter />
        </Reveal>
      </main>
    </>
  );
}
