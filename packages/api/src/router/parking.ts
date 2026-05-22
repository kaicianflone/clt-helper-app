import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "../trpc";
import { fetchParking } from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Empty baseUrl → data-client reads from local disk. See greenway.ts.
const getBaseUrl = (ctx: Context): string | undefined =>
  ctx.baseUrl ?? process.env.DATA_BASE_URL ?? undefined;

export const parkingRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const bundle = await fetchParking({
      baseUrl: getBaseUrl(ctx),
      fetchImpl: ctx.fetchImpl,
    });
    return bundle.entries;
  }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const bundle = await fetchParking({
        baseUrl: getBaseUrl(ctx),
        fetchImpl: ctx.fetchImpl,
      });
      const found = bundle.entries.find((p) => p.slug === input.slug);
      if (!found)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Parking lot not found: ${input.slug}`,
        });
      return found;
    }),
});
