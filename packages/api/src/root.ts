import { dealRouter } from "./router/deal";
import { greenwayRouter } from "./router/greenway";
import { parkingRouter } from "./router/parking";
import { submitRouter } from "./router/submit";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  greenway: greenwayRouter,
  deal: dealRouter,
  parking: parkingRouter,
  submit: submitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
