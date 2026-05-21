import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  // Routers will be added here as the app grows
});

// export type definition of API
export type AppRouter = typeof appRouter;
