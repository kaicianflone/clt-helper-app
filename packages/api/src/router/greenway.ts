import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "../trpc";
import { fetchGreenways } from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Resolve the data origin. Empty / undefined → data-client falls back to
// reading bundles from local disk (`dist/data/v1/`). That makes the API
// work in dev and in any deployment that ships data as a build artifact
// instead of via a CDN.
const getBaseUrl = (ctx: Context): string | undefined =>
  ctx.baseUrl ?? process.env.DATA_BASE_URL ?? undefined;

export const greenwayRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const bundle = await fetchGreenways({
      baseUrl: getBaseUrl(ctx),
      fetchImpl: ctx.fetchImpl,
    });
    return bundle.entries.map((g) => ({
      slug: g.slug,
      name: g.name,
      lengthMiles: g.lengthMiles,
      surface: g.surface,
    }));
  }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const bundle = await fetchGreenways({
        baseUrl: getBaseUrl(ctx),
        fetchImpl: ctx.fetchImpl,
      });
      const found = bundle.entries.find((g) => g.slug === input.slug);
      if (!found)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Greenway not found: ${input.slug}`,
        });
      return found;
    }),

  listWithGeometry: publicProcedure.query(async ({ ctx }) => {
    const bundle = await fetchGreenways({
      baseUrl: getBaseUrl(ctx),
      fetchImpl: ctx.fetchImpl,
    });
    return bundle.entries.map((g) => ({
      slug: g.slug,
      name: g.name,
      geometry: g.geometry,
    }));
  }),
});
