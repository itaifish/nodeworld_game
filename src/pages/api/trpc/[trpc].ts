import { createNextApiHandler } from '@trpc/server/adapters/next';

import { env } from '../../../env/server.mjs';
import { createTRPCContext } from '../../../server/api/trpc';
import { appRouter } from '../../../server/api/root';
import type { NextApiRequest, NextApiResponse } from 'next';

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
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
