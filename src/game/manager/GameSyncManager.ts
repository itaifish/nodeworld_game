import type { Base } from '@prisma/client';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/api/root';
import superjson from 'superjson';

export default class GameSyncManager {
	baseGameState: Base | null;
	client;

	constructor() {
		this.baseGameState = null;
		this.client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: 'http://localhost:3000/trpc',
				}),
			],
			transformer: superjson,
		});
	}

	async updateBaseGameState() {
		const baseData = await this.client.base.getBaseData.query();
		this.baseGameState = baseData;
	}
}
