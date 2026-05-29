import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const AmenityCategorySchema = z.enum([
  "tennis",
  "pickleball",
  "disc-golf",
  "skatepark",
  "dog-park",
  "basketball",
  "farmers-market",
]);

export const AmenitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  category: AmenityCategorySchema,
  address: z.string().optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const AmenityPatchSchema = AmenitySchema.partial().extend({
  slug: AmenitySchema.shape.slug,
});

export type AmenityCategory = z.infer<typeof AmenityCategorySchema>;
export type Amenity = z.infer<typeof AmenitySchema>;
export type AmenityPatch = z.infer<typeof AmenityPatchSchema>;
