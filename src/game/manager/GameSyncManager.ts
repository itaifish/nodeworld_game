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
import BaseManager from '../logic/base/BaseManager';
export default class GameSyncManager extends EventEmitter {
	private baseGameState: BaseDetails | null;
	private temporaryBuildings: Map<string, Building>;
	private client;
	private readonly unsubscribableEvents: Unsubscribable[];
	static EVENTS = {
		BASE_GAME_STATE_UPDATED: 'BASE_GAME_STATE_UPDATED',
	};

	static instance = new GameSyncManager();

	private constructor() {
		super();
		this.baseGameState = null;
		this.temporaryBuildings = new Map();
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
		setTimeout(() => {
			this.client.base.getBaseData.query();
		}, 1_000);
	}

	async createBaseIfNotExists() {
		log.info(`Creating Base if not exists`);
		this.client.base.createBaseIfNotExists.mutate();
	}

	async constructBuilding(building: Building_Type, position: Position, isRotated = false) {
		log.info(`Creating ${building} at ${position.x},${position.y} ${isRotated ? 'rotated' : ''}`);
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
			isRotated,
			...position,
		};
		this.temporaryBuildings.set(tempBuilding.id, tempBuilding);
		this.client.base.constructBuilding.mutate({ building, position, isRotated }).then(() => {
			this.temporaryBuildings.delete(tempBuilding.id);
			this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
		});
		const tempResources = BuildingManager.getResourcesAfterPurchase(this.baseGameState?.resources ?? [], building);
		if (this.baseGameState && tempResources) {
			this.baseGameState.resources = tempResources;
			this.baseGameState?.buildings?.push(tempBuilding);
		}
		this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
	}

	async harvestBuilding(building: Building) {
		log.info(`Harvesting ${building.type}[${building.id}] `);
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

	async levelUpBuilding(building: Building) {
		log.info(`Leveling up ${building.type}[${building.id}]`);
		const levelUpBuildingTask = this.client.base.levelUpBuilding.mutate({ buildingId: building.id });
		return levelUpBuildingTask;
	}

	getBaseData(): BaseDetails | null {
		if (this.baseGameState == null) {
			return null;
		}
		return {
			...this.baseGameState,
			buildings: [...(this.baseGameState?.buildings ?? []), ...this.temporaryBuildings.values()],
		};
	}

	// TODO: Since we already have incremental data updates, lets improve our emitter to have something besides BASE_GAME_STATE_UPDATED
	private initWebsocketEventListeners(): Unsubscribable[] {
		return [
			this.client.base.onBaseUpdated.subscribe(undefined, {
				onData: (data) => {
					log.info(`Recieved onBaseUpdated event: ${data.action}`);
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
					log.info(`Recieved onBuildingUpdated event: ${data.action}`);
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
					log.info(`Recieved onUserResourcesChanged event`);
					if (this.baseGameState == null) {
						return;
					}
					this.baseGameState.resources = data;
					this.emit(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED);
				},
				onError: (err) => {
					log.error(err, `Error occured with onUserResourcesChanged event`);
				},
			}),
		];
	}
}
