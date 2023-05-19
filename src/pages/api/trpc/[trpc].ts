import { createNextApiHandler } from '@trpc/server/adapters/next';
import { env } from '../../../env/server.mjs';
import { createTRPCContext } from '../../../server/api/trpc';
import type { WebsocketsRouter } from '../../../server/api/root';
import { appRouter, websocketsRouter } from '../../../server/api/root';
import type { NextApiRequest, NextApiResponse } from 'next';
import { log } from 'src/utility/logger.js';

// export API handler
const nextApiHandler = createNextApiHandler({
	router: appRouter,
	createContext: createTRPCContext,
	onError:
		env.NODE_ENV === 'development'
			? ({ path, error }) => {
					console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
			  }
			: undefined,
});

// @see https://nextjs.org/docs/api-routes/introduction
export async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Modify `req` and `res` objects here
	// In this case, we are enabling CORS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		return res.end();
	}
	// pass the (modified) req/res to the handler
	return nextApiHandler(req, res);
}

const websocketsHandler = createNextApiHandler<WebsocketsRouter>({
	router: websocketsRouter,
	/**
	 * @link https://trpc.io/docs/context
	 */
	createContext: createTRPCContext,
	/**
	 * @link https://trpc.io/docs/error-handling
	 */
	onError({ error }) {
		if (error.code === 'INTERNAL_SERVER_ERROR') {
			// send to bug reporting
			log.error('Something went wrong', error);
		}
	},
	/**
	 * Enable query batching
	 */
	batching: {
		enabled: true,
	},
});

export default websocketsHandler;
