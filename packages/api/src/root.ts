import { createTRPCRouter } from "./trpc";
import { greenwayRouter } from "./router/greenway";

export const appRouter = createTRPCRouter({
  greenway: greenwayRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
