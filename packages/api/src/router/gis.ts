import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Bundle, DataClientOptions } from "../data-client";
import type { Context } from "../trpc";
import {
  fetchAmenity,
  fetchEvCharging,
  fetchLandfill,
  fetchParks,
  fetchRecycling,
  fetchTransitParking,
} from "../data-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Empty baseUrl → data-client reads from local disk. See greenway.ts / parking.ts.
const getBaseUrl = (ctx: Context): string | undefined =>
  ctx.baseUrl ??
  process.env.DATA_BASE_URL ??
  process.env.R2_PUBLIC_BASE_URL ??
  undefined;

type GisFetcher<T> = (opts: DataClientOptions<T>) => Promise<Bundle<T>>;

/**
 * Builds a list/get router for a point-entity GIS kind, mirroring parkingRouter.
 * Keeps the new map kinds DRY while matching the existing per-router contract.
 */
function makeGisRouter<T extends { slug: string }>(
  fetcher: GisFetcher<T>,
  label: string,
) {
  return createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
      const bundle = await fetcher({
        baseUrl: getBaseUrl(ctx),
        fetchImpl: ctx.fetchImpl,
      });
      return bundle.entries;
    }),

    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const bundle = await fetcher({
          baseUrl: getBaseUrl(ctx),
          fetchImpl: ctx.fetchImpl,
        });
        const found = bundle.entries.find((e) => e.slug === input.slug);
        if (!found)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `${label} not found: ${input.slug}`,
          });
        return found;
      }),
  });
}

export const parkRouter = makeGisRouter(fetchParks, "Park");
export const recyclingRouter = makeGisRouter(
  fetchRecycling,
  "Recycling facility",
);
export const transitParkingRouter = makeGisRouter(
  fetchTransitParking,
  "Transit parking lot",
);
export const evChargingRouter = makeGisRouter(
  fetchEvCharging,
  "EV charging station",
);
export const landfillRouter = makeGisRouter(fetchLandfill, "Landfill");
export const amenityRouter = makeGisRouter(fetchAmenity, "Amenity");
