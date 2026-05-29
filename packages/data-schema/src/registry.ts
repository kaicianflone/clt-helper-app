import { GreenwaySchema, GreenwayPatchSchema, type Greenway } from "./greenway";
import { DealSchema, DealPatchSchema, type Deal } from "./deal";
import { ParkingLotSchema, ParkingLotPatchSchema, type ParkingLot } from "./parking";
import { ParkSchema, ParkPatchSchema, type Park } from "./park";
import { RecyclingSchema, RecyclingPatchSchema, type Recycling } from "./recycling";
import { TransitParkingSchema, TransitParkingPatchSchema, type TransitParking } from "./transit-parking";
import { EvChargingSchema, EvChargingPatchSchema, type EvCharging } from "./ev-charging";
import { LandfillSchema, LandfillPatchSchema, type Landfill } from "./landfill";
import { AmenitySchema, AmenityPatchSchema, type Amenity } from "./amenity";
import { z } from "zod";

export type EntityKind =
  | "greenway"
  | "deal"
  | "parking"
  | "park"
  | "recycling"
  | "transit-parking"
  | "ev-charging"
  | "landfill"
  | "amenity";

export interface EntityConfig<TSchema extends z.ZodTypeAny, TPatch extends z.ZodTypeAny> {
  kind: EntityKind;
  schema: TSchema;
  patchSchema: TPatch;
  dataPath: (slug: string) => string;
  displayLabel: (entity: z.infer<TSchema>) => string;
  branchPrefix: (slug: string) => string;
}

export const GreenwayEntity: EntityConfig<typeof GreenwaySchema, typeof GreenwayPatchSchema> = {
  kind: "greenway",
  schema: GreenwaySchema,
  patchSchema: GreenwayPatchSchema,
  dataPath: (slug) => `data/greenways/${slug}.json`,
  displayLabel: (g: Greenway) => g.name,
  branchPrefix: (slug) => `community/greenway-${slug}`,
};

export const DealEntity: EntityConfig<typeof DealSchema, typeof DealPatchSchema> = {
  kind: "deal",
  schema: DealSchema,
  patchSchema: DealPatchSchema,
  dataPath: (slug) => `data/deals/${slug}.json`,
  displayLabel: (d: Deal) => `${d.restaurantName} deal`,
  branchPrefix: (slug) => `community/deal-${slug}`,
};

export const ParkingEntity: EntityConfig<typeof ParkingLotSchema, typeof ParkingLotPatchSchema> = {
  kind: "parking",
  schema: ParkingLotSchema,
  patchSchema: ParkingLotPatchSchema,
  dataPath: (slug) => `data/parking/${slug}.json`,
  displayLabel: (p: ParkingLot) => p.name,
  branchPrefix: (slug) => `community/parking-${slug}`,
};

export const ParkEntity: EntityConfig<typeof ParkSchema, typeof ParkPatchSchema> = {
  kind: "park",
  schema: ParkSchema,
  patchSchema: ParkPatchSchema,
  dataPath: (slug) => `data/parks/${slug}.json`,
  displayLabel: (p: Park) => p.name,
  branchPrefix: (slug) => `community/park-${slug}`,
};

export const RecyclingEntity: EntityConfig<typeof RecyclingSchema, typeof RecyclingPatchSchema> = {
  kind: "recycling",
  schema: RecyclingSchema,
  patchSchema: RecyclingPatchSchema,
  dataPath: (slug) => `data/recycling/${slug}.json`,
  displayLabel: (r: Recycling) => r.name,
  branchPrefix: (slug) => `community/recycling-${slug}`,
};

export const TransitParkingEntity: EntityConfig<
  typeof TransitParkingSchema,
  typeof TransitParkingPatchSchema
> = {
  kind: "transit-parking",
  schema: TransitParkingSchema,
  patchSchema: TransitParkingPatchSchema,
  dataPath: (slug) => `data/transit-parking/${slug}.json`,
  displayLabel: (t: TransitParking) => t.name,
  branchPrefix: (slug) => `community/transit-parking-${slug}`,
};

export const EvChargingEntity: EntityConfig<typeof EvChargingSchema, typeof EvChargingPatchSchema> = {
  kind: "ev-charging",
  schema: EvChargingSchema,
  patchSchema: EvChargingPatchSchema,
  dataPath: (slug) => `data/ev-charging/${slug}.json`,
  displayLabel: (e: EvCharging) => e.name,
  branchPrefix: (slug) => `community/ev-charging-${slug}`,
};

export const LandfillEntity: EntityConfig<typeof LandfillSchema, typeof LandfillPatchSchema> = {
  kind: "landfill",
  schema: LandfillSchema,
  patchSchema: LandfillPatchSchema,
  dataPath: (slug) => `data/landfills/${slug}.json`,
  displayLabel: (l: Landfill) => l.name,
  branchPrefix: (slug) => `community/landfill-${slug}`,
};

export const AmenityEntity: EntityConfig<typeof AmenitySchema, typeof AmenityPatchSchema> = {
  kind: "amenity",
  schema: AmenitySchema,
  patchSchema: AmenityPatchSchema,
  dataPath: (slug) => `data/amenities/${slug}.json`,
  displayLabel: (a: Amenity) => a.name,
  branchPrefix: (slug) => `community/amenity-${slug}`,
};

export const ENTITY_REGISTRY = {
  greenway: GreenwayEntity,
  deal: DealEntity,
  parking: ParkingEntity,
  park: ParkEntity,
  recycling: RecyclingEntity,
  "transit-parking": TransitParkingEntity,
  "ev-charging": EvChargingEntity,
  landfill: LandfillEntity,
  amenity: AmenityEntity,
} as const;
