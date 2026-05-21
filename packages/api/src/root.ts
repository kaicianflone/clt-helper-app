import { createTRPCRouter } from "./trpc";
import { greenwayRouter } from "./router/greenway";
import { dealRouter } from "./router/deal";
import { parkingRouter } from "./router/parking";
import { submitRouter } from "./router/submit";

export const appRouter = createTRPCRouter({
  greenway: greenwayRouter,
  deal: dealRouter,
  parking: parkingRouter,
  submit: submitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
