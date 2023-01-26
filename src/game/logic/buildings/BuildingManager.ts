import type { Building, Building_Type, Resource, Resource_Type } from '@prisma/client';
import { Constants } from '../../../utils/constants';
import type { Size } from '../../interfaces/general';

type BuildingStats = {
	maxHP: number;
	buildTimeSeconds: number;
	generatedResourcesPerInterval: Partial<Record<Resource_Type, number>>;
	energyDraw: number;
	costs: Partial<Record<Resource_Type, number>>;
	size: Size;
};

export default class BuildingManager {
	static readonly BUILDING_DATA: Record<Building_Type, BuildingStats> = {
		CAPITAL_BUILDING: {
			maxHP: 100,
			buildTimeSeconds: 10,
			energyDraw: 10,
			generatedResourcesPerInterval: {
				FOOD: 10,
				GOLD: 10,
			},
			costs: {
				FOOD: 150,
				IRON: 80,
				GOLD: 90,
			},
			size: { width: 3, height: 3 },
		},
		DWELLING: {
			maxHP: 100,
			buildTimeSeconds: 3,
			energyDraw: 3,
			generatedResourcesPerInterval: {},
			costs: {
				FOOD: 10,
				IRON: 30,
				GOLD: 30,
				ALUMNINUM: 10,
			},
			size: { width: 1, height: 1 },
		},
		HARVESTOR: {
			maxHP: 100,
			buildTimeSeconds: 7,
			energyDraw: 7,
			generatedResourcesPerInterval: {
				FOOD: 15,
			},
			costs: {
				FOOD: 100,
				GOLD: 100,
				ALUMNINUM: 10,
			},
			size: { width: 2, height: 2 },
		},
		BARRACKS: {
			maxHP: 100,
			buildTimeSeconds: 9,
			energyDraw: 9,
			generatedResourcesPerInterval: {},
			costs: {
				IRON: 150,
				ALUMNINUM: 80,
				FOOD: 100,
				PLUTONIUM: 5,
			},
			size: { width: 2, height: 1 },
		},
		POWER_STATION: {
			maxHP: 100,
			buildTimeSeconds: 20,
			energyDraw: -20,
			generatedResourcesPerInterval: {},
			costs: {
				PLUTONIUM: 250,
				IRON: 30,
				ALUMNINUM: 50,
			},
			size: { width: 1, height: 1 },
		},
		EXTRACTOR: {
			maxHP: 100,
			buildTimeSeconds: 15,
			energyDraw: 15,
			generatedResourcesPerInterval: {
				IRON: 50,
				ALUMNINUM: 20,
				PLUTONIUM: 5,
			},
			costs: {
				IRON: 300,
			},
			size: { width: 2, height: 2 },
		},
	};

	/** Interval is 20 minutes by default - plan to mess with it */
	static readonly HARVEST_INTERVAL_MINS = 20;

	/**
	 * Returns the resources remaining for a user after a purchase, or null if user does not have enough resources
	 * @param resourcePool Client's resource pool
	 * @param building building to purchase
	 */
	static getResourcesAfterPurchase(resourcePool: Resource[], building: Building_Type) {
		const cost = this.BUILDING_DATA[building].costs;
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

	static getHarvestAmountAndTimeForBuilding(building: Building) {
		const now = new Date().getTime();
		const timeDifferenceMs = now - building.lastHarvest.getTime();
		const harvestMs = Constants.MS_IN_A_MINUTE * BuildingManager.HARVEST_INTERVAL_MINS;
		const amountOfHarvests = Math.floor(timeDifferenceMs / harvestMs);
		if (amountOfHarvests <= 0) {
			return null;
		}
		const newLastHarvestDate = new Date(building.lastHarvest.getTime() + amountOfHarvests * harvestMs);
		const harvestYieldPerInterval = this.BUILDING_DATA[building.type].generatedResourcesPerInterval;
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
}
