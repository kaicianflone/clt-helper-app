import { z } from "zod";

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "must be HH:MM (24h)");
const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Day = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const DealSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  restaurantName: z.string().min(1),
  restaurantAddress: z.string().min(1),
  restaurantLatLng: z.tuple([z.number(), z.number()]),
  daysOfWeek: z.array(Day).min(1),
  timeWindow: z.union([z.object({ start: HHMM, end: HHMM }), z.literal("all-day")]),
  dealDescription: z.string().min(1),
  link: z.string().url().optional(),
  lastVerified: ISODate,
});

export const DealPatchSchema = DealSchema.partial().extend({
  slug: DealSchema.shape.slug,
});

export type Deal = z.infer<typeof DealSchema>;
export type DealPatch = z.infer<typeof DealPatchSchema>;
