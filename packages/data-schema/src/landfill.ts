import { z } from "zod";
import { PhotoSchema } from "./photo";

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const LandfillSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string(),
  center: LatLng,
  address: z.string().min(1),
  status: z.enum(["open", "closed"]),
  acceptedMaterials: z.array(z.string()).optional(),
  hoursNotes: z.string().optional(),
  photos: z.array(PhotoSchema),
  lastVerified: ISODate,
});

export const LandfillPatchSchema = LandfillSchema.partial().extend({
  slug: LandfillSchema.shape.slug,
});

export type Landfill = z.infer<typeof LandfillSchema>;
export type LandfillPatch = z.infer<typeof LandfillPatchSchema>;
