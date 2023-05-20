import { createTRPCRouter } from './trpc';
import { baseRouter } from './routers/baseRouter';
import { mainWebsocketsRouter } from './routers/websocketsRouter';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
	base: baseRouter,
});

export const websocketsRouter = createTRPCRouter({
	api: mainWebsocketsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type WebsocketsRouter = typeof websocketsRouter;
