import type { Context } from "../trpc";
import { fetchDeals, fetchGreenways, fetchParking } from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

const getBaseUrl = (ctx: Context): string | undefined =>
  ctx.baseUrl ??
  process.env.DATA_BASE_URL ??
  process.env.R2_PUBLIC_BASE_URL ??
  undefined;

export const activityRouter = createTRPCRouter({
  recent: publicProcedure.query(async ({ ctx }) => {
    const opts = { baseUrl: getBaseUrl(ctx), fetchImpl: ctx.fetchImpl };

    const [greenways, deals, parking] = await Promise.all([
      fetchGreenways(opts),
      fetchDeals(opts),
      fetchParking(opts),
    ]);

    interface FeedItem {
      kind: "greenway" | "deal" | "parking";
      slug: string;
      label: string;
      lastVerified: string;
    }

    const items: FeedItem[] = [
      ...greenways.entries.map((g) => ({
        kind: "greenway" as const,
        slug: g.slug,
        label: g.name,
        lastVerified: g.lastVerified,
      })),
      ...deals.entries.map((d) => ({
        kind: "deal" as const,
        slug: d.slug,
        label: `${d.restaurantName} — ${d.dealDescription}`,
        lastVerified: d.lastVerified,
      })),
      ...parking.entries.map((p) => ({
        kind: "parking" as const,
        slug: p.slug,
        label: p.name,
        lastVerified: p.lastVerified,
      })),
    ];

    items.sort(
      (a, b) =>
        new Date(b.lastVerified).getTime() - new Date(a.lastVerified).getTime(),
    );

    return items.slice(0, 5);
  }),
});
