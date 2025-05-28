import { createWSClient, createTRPCProxyClient, wsLink } from '@trpc/client';
import { clientEnv } from 'src/env/schema.mjs';
import type { WebsocketsRouter } from 'src/server/api/root';
import superjson from 'superjson';

class TRPCClientManager {
	public static INSTANCE = new TRPCClientManager();

	private readonly client;

	private constructor() {
		const url = clientEnv.NEXT_PUBLIC_TRPC_WS_BASEURL ?? 'ws://localhost:3000';
		const wsClient = createWSClient({
			url: `${url}`,
		});
		this.client = createTRPCProxyClient<WebsocketsRouter>({
			links: [
				wsLink({
					client: wsClient,
				}),
			],
			transformer: superjson,
		});
	}

	public getClient() {
		return this.client;
	}
}

export const trpcClientManager = TRPCClientManager.INSTANCE;
