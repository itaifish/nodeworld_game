import { createTRPCRouter } from './trpc';
import { baseRouter as wsBaseRouter } from './routers/base/baseRouter';
import { galaxyRouter } from './routers/galaxy/galaxyRouter';
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const websocketsRouter = createTRPCRouter({
	base: wsBaseRouter,
	galaxy: galaxyRouter,
});

// export type definition of API
export type WebsocketsRouter = typeof websocketsRouter;
