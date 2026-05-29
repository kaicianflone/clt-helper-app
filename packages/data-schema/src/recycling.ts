import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const RecyclingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  address: z.string().min(1),
  acceptedMaterials: z.array(z.string()).min(1),
  hoursNotes: z.string().optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const RecyclingPatchSchema = RecyclingSchema.partial().extend({
  slug: RecyclingSchema.shape.slug,
});

export type Recycling = z.infer<typeof RecyclingSchema>;
export type RecyclingPatch = z.infer<typeof RecyclingPatchSchema>;
