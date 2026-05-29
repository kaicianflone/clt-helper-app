import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

const PointPos = z.tuple([z.number(), z.number()]);
const LinearRing = z.array(PointPos).min(4);
const PolygonGeo = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(LinearRing).min(1),
});
const MultiPolygonGeo = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(LinearRing).min(1)).min(1),
});
export const ParkBoundary = z.union([PolygonGeo, MultiPolygonGeo]);

export const ParkSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  boundary: ParkBoundary.optional(),
  numParking: z.number().int().nonnegative().optional(),
  parkUrl: z.string().url().optional(),
  amenities: z
    .object({
      tennis: z.boolean(),
      pickleball: z.boolean(),
      discGolf: z.boolean(),
      skatepark: z.boolean(),
      dogPark: z.boolean(),
      basketball: z.boolean(),
    })
    .optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const ParkPatchSchema = ParkSchema.partial().extend({
  slug: ParkSchema.shape.slug,
});

export type Park = z.infer<typeof ParkSchema>;
export type ParkPatch = z.infer<typeof ParkPatchSchema>;
