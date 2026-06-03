// apps/nextjs/src/components/marketing/marketing-content.ts

export interface MarketingNavLink {
  label: string;
  href: string;
}

export const MARKETING_NAV: MarketingNavLink[] = [
  { label: "Greenways", href: "/greenways" },
  { label: "Deals", href: "/deals" },
  { label: "Parking", href: "/parking" },
  { label: "Map", href: "/map" },
];

export interface MarketingDomain {
  name: string;
  /** CSS custom property tying the domain to its map-marker color. */
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
  {
    name: "Parking",
    colorVar: "--brick",
    blurb: "Where to park, and what it runs.",
    items: [
      "Hourly rates and daily max",
      "Hours, covered or not, how to pay",
      "Lots across the city",
    ],
  },
];

export const MARKETING_COPY = {
  heroTitle: ["Your city,", "worth", "walking."],
  heroSubhead:
    "Find a greenway, grab today's restaurant deals, or track down parking. It's free, there's no sign-up, and the people who use it keep the details honest.",
  comingSoon: "Coming soon on iOS and Android",
  domainsLabel: "What's inside",
  domainsHeading: ["Everything local,", "on one map"],
  communityLabel: "Why it stays accurate",
  communityHeading: ["Charlotte keeps", "it honest"],
  communityBody:
    "Notice a rate that's gone up or a trail that's closed? Suggest a fix right from the app. Your edit goes into our open data, so the next person sees the correction too.",
  footerHeading: ["Take Charlotte", "with you"],
  signoff: "clt-app · open source · made in the Queen City",
} as const;
