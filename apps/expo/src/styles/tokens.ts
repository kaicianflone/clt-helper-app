export const colors = {
  bg: { cream: "#F5EFE6", creamSoft: "#FAF6EF", creamDeep: "#ECE4D5" },
  fg: { ink: "#1B1614", inkSoft: "#4A413B", inkMuted: "#837A72" },
  brick: { DEFAULT: "#B23A1F", deep: "#8A2C16", soft: "#E8D2C9" },
  gold: { DEFAULT: "#B8902D", soft: "#F2E5C2" },
  green: "#2F6E3A",
  amber: "#B07810",
  rose: "#A8332E",
  border: { soft: "#D9CFC0", strong: "#1B1614" },
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export const radius = { sm: 4, md: 8, lg: 12, full: 9999 } as const;

export const fonts = {
  display: "Antonio_700Bold",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodyBold: "Inter_600SemiBold",
} as const;

export const type = {
  displayLg: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  displayMd: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  headingLg: { fontFamily: fonts.bodyBold, fontSize: 20, lineHeight: 24 },
  headingMd: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  bodyLg: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26 },
  bodyMd: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bodyXs: {
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;
