import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const TransitParkingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  address: z.string().min(1),
  totalSpaces: z.number().int().nonnegative().optional(),
  freeParking: z.boolean(),
  permitRequired: z.boolean().optional(),
  transitLines: z.array(z.string()).optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const TransitParkingPatchSchema = TransitParkingSchema.partial().extend({
  slug: TransitParkingSchema.shape.slug,
});

export type TransitParking = z.infer<typeof TransitParkingSchema>;
export type TransitParkingPatch = z.infer<typeof TransitParkingPatchSchema>;
