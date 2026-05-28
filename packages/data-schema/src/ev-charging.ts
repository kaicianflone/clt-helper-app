import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const EvChargingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  address: z.string().min(1),
  numLevel2Ports: z.number().int().nonnegative().optional(),
  numDcFastPorts: z.number().int().nonnegative().optional(),
  networks: z.array(z.string()).optional(),
  freeCharging: z.boolean().optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const EvChargingPatchSchema = EvChargingSchema.partial().extend({
  slug: EvChargingSchema.shape.slug,
});

export type EvCharging = z.infer<typeof EvChargingSchema>;
export type EvChargingPatch = z.infer<typeof EvChargingPatchSchema>;
