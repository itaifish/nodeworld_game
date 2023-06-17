import fetch, { Headers, Request, Response } from 'node-fetch';
import type { createContext } from '../websockets/context';

if (!globalThis.fetch) {
	globalThis.fetch = fetch as any;
	globalThis.Headers = Headers as any;
	globalThis.Request = Request as any;
	globalThis.Response = Response as any;
}
/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

/**
 * 1. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { log } from '../../utility/logger';

const t = initTRPC.context<typeof createContext>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	},
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.session || !ctx.session.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			// infers the `session` as non-nullable
			session: { ...ctx.session, user: ctx.session.user },
		},
	});
});

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
	if (!ctx.session || !ctx.session.user || !ctx.session.user.isAdmin) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			// infers the `session` as non-nullable
			session: { ...ctx.session, user: ctx.session.user },
		},
	});
});

const loggerMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
	if (!ctx.session || !ctx.session.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	const start = Date.now();
	const result = await next({
		ctx: {
			// infers the `session` as non-nullable
			session: { ...ctx.session, user: ctx.session.user },
		},
	});
	const durationMs = Date.now() - start;
	const meta = { path, type, durationMs };
	result.ok ? log.info(meta, '[OK Request]') : log.warn(meta, '[Non-OK request]');

	return result;
});

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed).use(loggerMiddleware);

export const adminProcedure = t.procedure.use(enforceUserIsAdmin).use(loggerMiddleware);
