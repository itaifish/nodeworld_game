import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type { WebsocketsRouter } from '../../server/api/root';
import superjson from 'superjson';
import type { BaseDetails } from '../interfaces/base';
import EventEmitter from 'events';
import { log } from '../../utility/logger';
import type { Building, Building_Type } from '@prisma/client';
import type { Position } from '../interfaces/general';
import { v4 as uuidv4 } from 'uuid';
import BuildingManager from '../logic/buildings/BuildingManager';
import { mergeInto } from 'src/utility/function-utils/function-utils';
import { clientEnv } from 'src/env/schema.mjs';
import type { Unsubscribable } from '@trpc/server/observable';
import { now } from 'cypress/types/lodash';
import BaseManager from '../logic/base/BaseManager';
export default class GameSyncManager extends EventEmitter {
	private baseGameState: BaseDetails | null;
	private client;
	private readonly unsubscribableEvents: Unsubscribable[];
	static EVENTS = {
		BASE_GAME_STATE_UPDATED: 'BASE_GAME_STATE_UPDATED',
	};

	static instance = new GameSyncManager();

	private constructor() {
		super();
		this.baseGameState = null;
		log.info('Game Sync Manager created');
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

		// this.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => {
		// 	log.trace('Base Game State Updated');
		// });
		this.unsubscribableEvents = this.initWebsocketEventListeners();
		this.createBaseIfNotExists().then(() => {
			this.client.base.getBaseData.query();
		});
	}

	async createBaseIfNotExists() {
		this.client.base.createBaseIfNotExists.mutate();
	}

	async constructBuilding(building: Building_Type, position: Position) {
		const newBaseTask = this.client.base.constructBuilding.mutate({ building, position });
		const now = new Date();
		const networkDelayOffsetSecondsNow = new Date(now.getTime() + 3_500);
		// Create temporary Building
		const tempBuilding: Building = {
			id: uuidv4(),
			baseId: this.baseGameState?.id ?? null,
			finishedAt: BuildingManager.getBuildingFinishedTime(building, 1, networkDelayOffsetSecondsNow),
			lastHarvest: now,
			createdAt: now,
			type: building,
			hp: BuildingManager.getBuildingData(building, 1).maxHP,
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

	async harvestBuilding(building: Building) {
		const harvestBuildingTask = this.client.base.harvestBuilding.mutate({ buildingId: building.id });
		// temp clientside harvest to sync up with server
		const tempHarvest = BuildingManager.getHarvestAmountAndTimeForBuilding(building);
		building.lastHarvest = tempHarvest?.lastHarvested ?? building.lastHarvest;
		if (this.baseGameState?.resources && tempHarvest?.harvest) {
			BaseManager.modifyResources(this.baseGameState.resources, tempHarvest.harvest);
		}
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
		return harvestBuildingTask;
	}

	getBaseData() {
		return this.baseGameState;
	}

	// TODO: Since we already have incremental data updates, lets improve our emitter to have something besides BASE_GAME_STATE_UPDATED
	private initWebsocketEventListeners(): Unsubscribable[] {
		return [
			this.client.base.onBaseUpdated.subscribe(undefined, {
				onData: (data) => {
					if (data.action === 'updated') {
						mergeInto(this.baseGameState, data);
					} else if (data.action === 'created') {
						this.baseGameState = data;
					} else {
						this.baseGameState = null;
					}
					this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
				},
				onError: (err) => {
					log.error(err, `Error occured with onBaseUpdated event`);
				},
			}),
			this.client.base.onBuildingUpdated.subscribe(undefined, {
				onData: (data) => {
					if (data.action === 'updated') {
						const building = this.baseGameState?.buildings?.find((x) => x.id === data.id);
						if (building) {
							mergeInto(building, data);
							this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
						}
					} else if (data.action === 'created') {
						this.baseGameState?.buildings?.push(data);
						this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
					} else {
						if (this.baseGameState != null) {
							this.baseGameState.buildings = this.baseGameState?.buildings?.filter((x) => x.id !== data.id);
							this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
						}
					}
				},
				onError: (err) => {
					log.error(err, `Error occured with onBuildingUpdated event`);
				},
			}),
			this.client.base.onUserResourcesChanged.subscribe(undefined, {
				onData: (data) => {
					if (this.baseGameState == null) {
						return;
					}
					this.baseGameState.resources = data;
					this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
				},
				onError: (err) => {
					log.error(err, `Error occured with onBuildingUpdated event`);
				},
			}),
		];
	}
}
