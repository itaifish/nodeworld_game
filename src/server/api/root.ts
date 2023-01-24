import { createTRPCRouter } from './trpc';
import { baseRouter } from './routers/baseRouter';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
	base: baseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
