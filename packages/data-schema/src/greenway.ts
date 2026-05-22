import { z } from "zod";

const PointPos = z.tuple([z.number(), z.number()]);
const LineStringGeo = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(PointPos).min(2),
});
const MultiLineStringGeo = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(PointPos).min(2)).min(1),
});
export const GreenwayGeometry = z.union([LineStringGeo, MultiLineStringGeo]);

const LatLng = z.object({ lat: z.number(), lng: z.number() });
const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const POIKindSchema = z.enum(["restroom", "water", "bench", "viewpoint", "art", "other"]);

export const GreenwaySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  lengthMiles: z.number().positive(),
  surface: z.enum(["paved", "natural", "mixed"]),
  trailheads: z
    .array(LatLng.extend({ name: z.string(), parkingNotes: z.string().optional() }))
    .min(1, "at least one trailhead required"),
  geometry: GreenwayGeometry,
  pointsOfInterest: z.array(LatLng.extend({ name: z.string(), kind: POIKindSchema })),
  photos: z.array(z.object({ url: z.string().url(), caption: z.string(), attribution: z.string() })),
  lastVerified: ISODate,
});

export const GreenwayPatchSchema = GreenwaySchema.partial().extend({
  slug: GreenwaySchema.shape.slug,
});

export type Greenway = z.infer<typeof GreenwaySchema>;
export type GreenwayPatch = z.infer<typeof GreenwayPatchSchema>;
