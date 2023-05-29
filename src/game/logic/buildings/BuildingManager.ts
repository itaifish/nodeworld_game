/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Building, Building_Type, Resource, Resource_Type } from '@prisma/client';
import { Constants } from '../../../utility/constants';
import type { Size } from '../../interfaces/general';

type BuildingStats<TData> = {
	maxHP: TData;
	buildTimeSeconds: TData;
	generatedResourcesPerInterval: Partial<Record<Resource_Type, TData>>;
	maxStorageCapacity: Partial<Record<Resource_Type, TData>>;
	energyDraw: TData;
	costs: Partial<Record<Resource_Type, TData>>;
};

type StartingPointStats = BuildingStats<number> & { size: Size };
type ScalingStats = BuildingStats<(currentLevel: number, startingPoint: number) => number>;

type LeveledBuildingStats = {
	startingPoint: StartingPointStats;
	scaling: ScalingStats;
};

const DEFAULT_SCALING: ScalingStats = {
	maxHP: (level, startingPoint) => startingPoint * level,
	buildTimeSeconds: (level, startingPoint) => startingPoint * Math.pow(level - 1, 4) + level * startingPoint,
	energyDraw: (level, startingPoint) => startingPoint * level * level,
	generatedResourcesPerInterval: {
		FOOD: (level, startingPoint) => startingPoint * level * level,
		GOLD: (level, startingPoint) => startingPoint * level * level,
	},
	costs: {
		FOOD: (level, startingPoint) => startingPoint * level * level,
		IRON: (level, startingPoint) => startingPoint * level * level,
		GOLD: (level, startingPoint) => startingPoint * level * level,
	},
	maxStorageCapacity: {
		FOOD: (level, startingPoint) => startingPoint * level * level,
		GOLD: (level, startingPoint) => startingPoint * level * level,
	},
};

export default class BuildingManager {
	private static readonly BUILDING_DATA: Record<Building_Type, LeveledBuildingStats> = {
		CAPITAL_BUILDING: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 55,
				energyDraw: 10,
				generatedResourcesPerInterval: {
					FOOD: 10,
					GOLD: 10,
				},
				maxStorageCapacity: {
					FOOD: 200,
					GOLD: 200,
				},
				costs: {
					FOOD: 150,
					IRON: 80,
					GOLD: 90,
				},
				size: { width: 3, height: 3 },
			},
			scaling: {
				maxHP: (level, startingPoint) => startingPoint * level,
				buildTimeSeconds: (level, startingPoint) => startingPoint * Math.pow(level - 1, 4) + level * startingPoint,
				energyDraw: (level, startingPoint) => startingPoint * level * level,
				generatedResourcesPerInterval: {
					FOOD: (level, startingPoint) => startingPoint * level * level,
					GOLD: (level, startingPoint) => startingPoint * level * level,
				},
				costs: {
					FOOD: (level, startingPoint) => startingPoint * level * level,
					IRON: (level, startingPoint) => startingPoint * level * level,
					GOLD: (level, startingPoint) => startingPoint * level * level,
				},
				maxStorageCapacity: {
					FOOD: (level, startingPoint) => startingPoint * level * level,
					GOLD: (level, startingPoint) => startingPoint * level * level,
				},
			},
		},
		DWELLING: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 10,
				energyDraw: 3,
				generatedResourcesPerInterval: {},
				maxStorageCapacity: {},
				costs: {
					FOOD: 10,
					IRON: 30,
					GOLD: 30,
					ALUMNINUM: 10,
				},
				size: { width: 2, height: 2 },
			},
			scaling: DEFAULT_SCALING,
		},
		HARVESTOR: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 21,
				energyDraw: 7,
				generatedResourcesPerInterval: {
					FOOD: 15,
				},
				maxStorageCapacity: {
					FOOD: 150,
				},
				costs: {
					FOOD: 100,
					GOLD: 100,
					ALUMNINUM: 10,
				},
				size: { width: 2, height: 2 },
			},
			scaling: DEFAULT_SCALING,
		},
		BARRACKS: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 19,
				energyDraw: 9,
				generatedResourcesPerInterval: {},
				maxStorageCapacity: {},
				costs: {
					IRON: 150,
					ALUMNINUM: 80,
					FOOD: 100,
					PLUTONIUM: 5,
				},
				size: { width: 2, height: 1 },
			},
			scaling: DEFAULT_SCALING,
		},
		POWER_STATION: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 22,
				energyDraw: -20,
				generatedResourcesPerInterval: {},
				maxStorageCapacity: {},
				costs: {
					PLUTONIUM: 250,
					IRON: 30,
					ALUMNINUM: 50,
				},
				size: { width: 1, height: 2 },
			},
			scaling: DEFAULT_SCALING,
		},
		EXTRACTOR: {
			startingPoint: {
				maxHP: 100,
				buildTimeSeconds: 25,
				energyDraw: 15,
				generatedResourcesPerInterval: {
					IRON: 50,
					ALUMNINUM: 20,
					PLUTONIUM: 5,
				},
				maxStorageCapacity: {
					IRON: 500,
					ALUMNINUM: 200,
					PLUTONIUM: 50,
				},
				costs: {
					IRON: 300,
				},
				size: { width: 2, height: 2 },
			},
			scaling: DEFAULT_SCALING,
		},
	};

	/** Interval is 20 minutes by default - plan to mess with it */
	static readonly HARVEST_INTERVAL_MINS = 20;

	static getBuildingData(building: Building_Type, level: number) {
		const calculatedBuildingData: Partial<StartingPointStats> = {};
		const knownBuildingData = this.BUILDING_DATA[building];
		const keys = Object.keys(knownBuildingData.startingPoint) as Array<keyof StartingPointStats>;
		keys.forEach((key) => {
			if (key == 'size') {
				calculatedBuildingData[key] = knownBuildingData.startingPoint[key];
				return;
			}
			const resourceMapKeys = ['generatedResourcesPerInterval', 'maxStorageCapacity', 'costs'] as const;
			if (resourceMapKeys.includes(key as any)) {
				const resourceKeys = Object.keys(knownBuildingData.startingPoint[key]) as Resource_Type[];
				const typedKey = key as (typeof resourceMapKeys)[number];
				calculatedBuildingData[typedKey] = {};
				resourceKeys.forEach((resourceKey) => {
					calculatedBuildingData[typedKey]![resourceKey] = knownBuildingData.scaling[typedKey]![resourceKey]!(
						level,
						knownBuildingData.startingPoint[typedKey]![resourceKey]!,
					);
				});
				return;
			}
			const typedKey = key as Exclude<keyof BuildingStats<number>, (typeof resourceMapKeys)[number]>;
			calculatedBuildingData[key] = knownBuildingData.scaling[typedKey](
				level,
				knownBuildingData.startingPoint[typedKey],
			);
		});
		return calculatedBuildingData as StartingPointStats;
	}

	/**
	 * Returns the resources remaining for a user after a purchase, or null if user does not have enough resources
	 * @param resourcePool Client's resource pool
	 * @param building building to purchase
	 */
	static getResourcesAfterPurchase(resourcePool: Resource[], building: Building_Type, buildingLevel = 1) {
		const cost = this.getBuildingData(building, buildingLevel).costs;
		const newResourcePool: Resource[] = [];
		for (const resource of resourcePool) {
			const newAmount = resource.amount - (cost[resource.type] ?? 0);
			if (newAmount < 0) {
				return null;
			}
			newResourcePool.push({ ...resource, amount: newAmount });
		}
		return newResourcePool;
	}

	static getHarvestAmountAndTimeForBuilding(building: Building | null) {
		if (building == null) {
			return null;
		}
		const now = new Date().getTime();
		const lastHarvest = building.lastHarvest ?? building.finishedAt;
		const timeDifferenceMs = now - lastHarvest.getTime();
		const harvestMs = Constants.MS_IN_A_MINUTE * BuildingManager.HARVEST_INTERVAL_MINS;
		const amountOfHarvests = Math.floor(timeDifferenceMs / harvestMs);
		if (amountOfHarvests <= 0) {
			return null;
		}
		const newLastHarvestDate = new Date(lastHarvest.getTime() + amountOfHarvests * harvestMs);
		const harvestYieldPerInterval = this.getBuildingData(building.type, building.level).generatedResourcesPerInterval;
		const totalHarvest: Partial<Record<Resource_Type, number>> = {};
		for (const harvestKey in harvestYieldPerInterval) {
			totalHarvest[harvestKey as Resource_Type] =
				(harvestYieldPerInterval[harvestKey as Resource_Type] ?? 0) * amountOfHarvests;
		}
		return {
			harvest: totalHarvest,
			lastHarvested: newLastHarvestDate,
		};
	}

	static getNextHarvest(building: Building): Date {
		const now = new Date().getTime();
		const lastHarvest = building.lastHarvest ?? building.finishedAt;
		const timeDifferenceMs = now - lastHarvest.getTime();
		const harvestMs = Constants.MS_IN_A_MINUTE * BuildingManager.HARVEST_INTERVAL_MINS;
		const amountOfHarvests = Math.floor(timeDifferenceMs / harvestMs);
		return new Date(lastHarvest.getTime() + (amountOfHarvests + 1) * harvestMs);
	}

	static getBuildingFinishedTime(building: Building_Type, buildingLevel: number, startTime?: Date) {
		const now = startTime ?? new Date();
		const finishedAt = new Date(now.getTime() + this.getBuildingData(building, buildingLevel).buildTimeSeconds * 1_000);
		return finishedAt;
	}
}
