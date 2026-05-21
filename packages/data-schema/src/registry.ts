import { GreenwaySchema, GreenwayPatchSchema, type Greenway } from "./greenway";
import { DealSchema, DealPatchSchema, type Deal } from "./deal";
import { ParkingLotSchema, ParkingLotPatchSchema, type ParkingLot } from "./parking";
import { z } from "zod";

export type EntityKind = "greenway" | "deal" | "parking";

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

export const ENTITY_REGISTRY = {
  greenway: GreenwayEntity,
  deal: DealEntity,
  parking: ParkingEntity,
} as const;
