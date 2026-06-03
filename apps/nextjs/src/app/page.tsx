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
  title: { absolute: "clt-app — Charlotte's open guide" },
  description:
    "Greenways, daily restaurant deals, and parking for Charlotte — free, community-maintained, no sign-up.",
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
