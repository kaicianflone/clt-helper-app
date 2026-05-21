import { createTRPCRouter } from "./trpc";
import { greenwayRouter } from "./router/greenway";
import { dealRouter } from "./router/deal";
import { parkingRouter } from "./router/parking";

export const appRouter = createTRPCRouter({
  greenway: greenwayRouter,
  deal: dealRouter,
  parking: parkingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
