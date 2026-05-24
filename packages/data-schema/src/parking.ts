import { z } from "zod";

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DayHours = z.union([
  z.object({ open: HHMM, close: HHMM }),
  z.literal("closed"),
  z.literal("24h"),
]);

export const ParkingLotSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  address: z.string().min(1),
  latLng: z.tuple([z.number(), z.number()]),
  hourlyRate: z.number().nullable(),
  dailyMax: z.number().nullable(),
  hours: z.object({
    mon: DayHours,
    tue: DayHours,
    wed: DayHours,
    thu: DayHours,
    fri: DayHours,
    sat: DayHours,
    sun: DayHours,
  }),
  paymentMethods: z.array(z.enum(["cash", "card", "app", "meter"])).min(1),
  covered: z.boolean(),
  totalSpaces: z.number().int().nonnegative().optional(),
  zoneNumbers: z.array(z.string()).optional(),
  operator: z.string().optional(),
  lastVerified: ISODate,
});

export const ParkingLotPatchSchema = ParkingLotSchema.partial().extend({
  slug: ParkingLotSchema.shape.slug,
});

export type ParkingLot = z.infer<typeof ParkingLotSchema>;
export type ParkingLotPatch = z.infer<typeof ParkingLotPatchSchema>;
