import { createTRPCProxyClient, createWSClient, httpBatchLink, httpLink, splitLink, wsLink } from '@trpc/client';
import type { WebsocketsRouter } from '../../server/api/root';
import superjson from 'superjson';
import type { BaseDetails } from '../interfaces/base';
import EventEmitter from 'events';
import { clientEnv } from '../../env/schema.mjs';
import { log } from '../../utility/logger';
import type { Building, Building_Type } from '@prisma/client';
import type { Position } from '../interfaces/general';
import { v4 as uuidv4 } from 'uuid';
import BuildingManager from '../logic/buildings/BuildingManager';
export default class GameSyncManager extends EventEmitter {
	private baseGameState: BaseDetails | null;
	private client;

	static EVENTS = {
		BASE_GAME_STATE_UPDATED: 'BASE_GAME_STATE_UPDATED',
	};

	constructor() {
		super();
		this.baseGameState = null;
		const url = clientEnv.NEXT_PUBLIC_TRPC_URL ?? 'http://localhost:3001';
		const wsClient = createWSClient({
			url: `ws://${url}`,
		});
		this.client = createTRPCProxyClient<WebsocketsRouter>({
			links: [
				splitLink({
					condition(op) {
						return op.type === 'subscription';
					},
					true: wsLink({
						client: wsClient,
					}),
					false: httpLink({
						url,
					}),
				}),
			],
			transformer: superjson,
		});

		// this.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => {
		// 	log.trace('Base Game State Updated');
		// });

		this.client.base.onBaseUpdated.subscribe(undefined, {
			onData(data) {},
			onError(err) {},
		});
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
		const newBaseTask = this.client.base.constructBuilding.mutate({ building, position });
		const now = new Date();
		const networkDelayOffsetSecondsNow = new Date(now.getTime() + 3_500);
		// Create temporary Building
		const tempBuilding: Building = {
			id: uuidv4(),
			baseId: this.baseGameState?.id ?? null,
			finishedAt: BuildingManager.getBuildingFinishedTime(building, networkDelayOffsetSecondsNow),
			lastHarvest: now,
			createdAt: now,
			type: building,
			hp: BuildingManager.BUILDING_DATA[building].maxHP,
			level: 1,
			...position,
		};
		this.baseGameState?.buildings?.push(tempBuilding);
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
		const newBase = await newBaseTask;
		// Destroy temporary building
		if (newBase == null) {
			log.info(`Failed to construct ${building} at {${position.x}, ${position.y}}`);
			if (this.baseGameState) {
				this.baseGameState.buildings =
					this.baseGameState?.buildings.filter((building) => building.id != tempBuilding.id) ?? [];
			}
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
