import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/api/root';
import superjson from 'superjson';
import type { BaseDetails } from '../interfaces/base';

export default class GameSyncManager {
	private baseGameState: BaseDetails | null;
	private client;

	constructor() {
		this.baseGameState = null;
		this.client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: 'http://localhost:3000/api/trpc',
				}),
			],
			transformer: superjson,
		});
		this.updateBaseGameState();
	}

	async updateBaseGameState() {
		const baseData = await this.client.base.getBaseData.query();
		this.baseGameState = baseData;
	}

	async createBaseIfNotExists(): Promise<BaseDetails> {
		const newBase = await this.client.base.createBaseIfNotExists.mutate();
		this.baseGameState = newBase;
		return newBase;
	}

	getBaseData() {
		return this.baseGameState;
	}
}
