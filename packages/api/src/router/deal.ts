import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { fetchDeals } from "../data-client";
import type { Context } from "../trpc";

type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const getBaseUrl = (ctx: Context): string => {
  const url = ctx.baseUrl ?? process.env.R2_PUBLIC_BASE_URL;
  if (!url)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "R2_PUBLIC_BASE_URL is not configured",
    });
  return url;
};

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
      return bundle.entries.filter((d) =>
        d.daysOfWeek.includes(input.day as Day),
      );
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
