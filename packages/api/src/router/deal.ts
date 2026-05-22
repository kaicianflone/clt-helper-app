import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "../trpc";
import { fetchDeals } from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Empty baseUrl → data-client reads from local disk. See greenway.ts.
const getBaseUrl = (ctx: Context): string | undefined =>
  ctx.baseUrl ??
  process.env.DATA_BASE_URL ??
  process.env.R2_PUBLIC_BASE_URL ??
  undefined;

export const dealRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          day: z
            .enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const bundle = await fetchDeals({
        baseUrl: getBaseUrl(ctx),
        fetchImpl: ctx.fetchImpl,
      });
      if (!input?.day) return bundle.entries;
      const day = input.day;
      return bundle.entries.filter((d) => d.daysOfWeek.includes(day));
    }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const bundle = await fetchDeals({
        baseUrl: getBaseUrl(ctx),
        fetchImpl: ctx.fetchImpl,
      });
      const found = bundle.entries.find((d) => d.slug === input.slug);
      if (!found)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Deal not found: ${input.slug}`,
        });
      return found;
    }),
});
