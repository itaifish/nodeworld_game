import type * as trpc from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import type { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import type { IncomingMessage } from 'http';
import { getSession } from 'next-auth/react';
import { log } from '../../utility/logger';
import type ws from 'ws';
import { prisma } from '../db';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (
	opts: trpcNext.CreateNextContextOptions | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>,
) => {
	const session = await getSession(opts);

	log.info(`createContext for ${session?.user?.id ?? 'nullID'} ${session?.user?.name ?? 'unknown user'}`);

	return {
		session,
		prisma,
	};
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
