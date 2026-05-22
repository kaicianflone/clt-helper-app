import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "../trpc";
import { fetchParking } from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

const getBaseUrl = (ctx: Context): string => {
  const url = ctx.baseUrl ?? process.env.R2_PUBLIC_BASE_URL;
  if (!url)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "R2_PUBLIC_BASE_URL is not configured",
    });
  return url;
};

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
