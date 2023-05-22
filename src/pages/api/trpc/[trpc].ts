import { createNextApiHandler } from '@trpc/server/adapters/next';
import { env } from '../../../env/server.mjs';
import type { WebsocketsRouter } from '../../../server/api/root';
import { websocketsRouter } from '../../../server/api/root';
import { log } from 'src/utility/logger';
import { createContext } from 'src/server/websockets/context';

const websocketHandler = createNextApiHandler<WebsocketsRouter>({
	router: websocketsRouter,
	/**
	 * @link https://trpc.io/docs/context
	 */
	createContext: createContext,
	/**
	 * @link https://trpc.io/docs/error-handling
	 */
	onError:
		env.NODE_ENV === 'development'
			? ({ path, error }) => {
					log.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
			  }
			: undefined,
	/**
	 * Enable query batching
	 */
	batching: {
		enabled: true,
	},
});

export default websocketHandler;
