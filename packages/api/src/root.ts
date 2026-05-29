import { activityRouter } from "./router/activity";
import { dealRouter } from "./router/deal";
import {
  amenityRouter,
  evChargingRouter,
  landfillRouter,
  parkRouter,
  recyclingRouter,
  transitParkingRouter,
} from "./router/gis";
import { greenwayRouter } from "./router/greenway";
import { parkingRouter } from "./router/parking";
import { submitRouter } from "./router/submit";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  activity: activityRouter,
  greenway: greenwayRouter,
  deal: dealRouter,
  parking: parkingRouter,
  park: parkRouter,
  recycling: recyclingRouter,
  transitParking: transitParkingRouter,
  evCharging: evChargingRouter,
  landfill: landfillRouter,
  amenity: amenityRouter,
  submit: submitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
