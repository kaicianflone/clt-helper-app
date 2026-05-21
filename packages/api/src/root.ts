import { createTRPCRouter } from "./trpc";
import { greenwayRouter } from "./router/greenway";
import { dealRouter } from "./router/deal";

export const appRouter = createTRPCRouter({
  greenway: greenwayRouter,
  deal: dealRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
