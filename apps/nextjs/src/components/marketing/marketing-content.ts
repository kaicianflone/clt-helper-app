// apps/nextjs/src/components/marketing/marketing-content.ts

export interface MarketingDomain {
  name: string;
  /** CSS custom property used to color the domain heading. */
  colorVar: string;
  blurb: string;
  items: [string, string, string];
}

export const MARKETING_DOMAINS: MarketingDomain[] = [
  {
    name: "Greenways",
    colorVar: "--map-trail",
    blurb: "63 trails, mapped and verified.",
    items: [
      "Length, surface, and trailheads",
      "Points of interest along the way",
      "Directions to the nearest entrance",
    ],
  },
  {
    name: "Deals",
    colorVar: "--gold",
    blurb: "Restaurant specials, by the day.",
    items: [
      "Browse whatever's on today",
      "Times, addresses, the fine print",
      "Checked often so it isn't stale",
    ],
  },
];

export const MARKETING_COPY = {
  heroTitle: ["Your city,", "worth", "walking."],
  heroSubhead:
    "CLT Greenways is a free iPhone app for exploring Charlotte's greenways and finding today's restaurant deals. English only, no sign-up.",
  comingSoon: "Coming soon to the App Store",
  domainsLabel: "What's inside",
  domainsHeading: ["Trails and deals,", "in your pocket"],
  communityLabel: "Independent and local",
  communityHeading: ["Made in", "Charlotte"],
  communityBody:
    "CLT Greenways is an independent project. It is not affiliated with, endorsed by, or sponsored by the City of Charlotte or Mecklenburg County.",
  footerHeading: ["Take Charlotte", "with you"],
  signoff: "CLT Greenways · made in the Queen City",
} as const;
