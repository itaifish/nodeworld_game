import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/api/root';
import superjson from 'superjson';
import type { BaseDetails } from '../interfaces/base';
import EventEmitter from 'events';
import { clientEnv } from '../../env/schema.mjs';
import { log } from '../../utility/logger';
import type { Building_Type } from '@prisma/client';
import type { Position } from '../interfaces/general';

export default class GameSyncManager extends EventEmitter {
	private baseGameState: BaseDetails | null;
	private client;

	static EVENTS = {
		BASE_GAME_STATE_UPDATED: 'BASE_GAME_STATE_UPDATED',
	};

	constructor() {
		super();
		this.baseGameState = null;
		this.client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${clientEnv.NEXT_PUBLIC_TRPC_URL}`,
				}),
			],
			transformer: superjson,
		});
		// this.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => {
		// 	log.trace('Base Game State Updated');
		// });
	}

	async updateBaseGameState() {
		const baseData = await this.client.base.getBaseData.query();
		this.baseGameState = baseData;
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
	}

	async createBaseIfNotExists(): Promise<BaseDetails> {
		const newBase = await this.client.base.createBaseIfNotExists.mutate();
		this.baseGameState = newBase;
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
		return newBase;
	}

	async constructBuilding(building: Building_Type, position: Position) {
		const newBase = await this.client.base.constructBuilding.mutate({ building, position });
		if (newBase == null) {
			log.info(`Failed to construct ${building} at {${position.x}, ${position.y}}`);
			return null;
		}
		this.baseGameState = newBase;
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
		return newBase;
	}

	getBaseData() {
		return this.baseGameState;
	}
}
