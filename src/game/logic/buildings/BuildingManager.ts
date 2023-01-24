import type { Building_Type, Resource, Resource_Type } from '@prisma/client';

export default class BuildingManager {
	static readonly maxHP: Record<Building_Type, number> = {
		CAPITAL_BUILDING: 100,
		DWELLING: 100,
		HARVESTOR: 100,
		BARRACKS: 100,
		POWER_STATION: 100,
		EXTRACTOR: 100,
	};

	static readonly buildTimeSeconds: Record<Building_Type, number> = {
		CAPITAL_BUILDING: 10,
		DWELLING: 3,
		HARVESTOR: 7,
		BARRACKS: 9,
		POWER_STATION: 20,
		EXTRACTOR: 15,
	};

	/** Interval is 20 minutes by default - plan to mess with it */
	static readonly generatedResourcesPerInterval: Record<Building_Type, Partial<Record<Resource_Type, number>>> = {
		CAPITAL_BUILDING: {
			FOOD: 10,
			GOLD: 10,
		},
		DWELLING: {},
		HARVESTOR: {
			FOOD: 15,
		},
		BARRACKS: {},
		POWER_STATION: {},
		EXTRACTOR: {
			IRON: 50,
			ALUMNINUM: 20,
			PLUTONIUM: 5,
		},
	};

	static readonly energyDraw: Record<Building_Type, number> = {
		CAPITAL_BUILDING: 10,
		DWELLING: 3,
		HARVESTOR: 7,
		BARRACKS: 9,
		POWER_STATION: -20,
		EXTRACTOR: 15,
	};

	static readonly costs: Record<Building_Type, Partial<Record<Resource_Type, number>>> = {
		CAPITAL_BUILDING: {
			FOOD: 150,
			IRON: 80,
			GOLD: 90,
		},
		DWELLING: {
			FOOD: 10,
			IRON: 30,
			GOLD: 30,
			ALUMNINUM: 10,
		},
		HARVESTOR: {
			FOOD: 100,
			GOLD: 100,
			ALUMNINUM: 10,
		},
		BARRACKS: {
			IRON: 150,
			ALUMNINUM: 80,
			FOOD: 100,
			PLUTONIUM: 5,
		},
		POWER_STATION: {
			PLUTONIUM: 250,
			IRON: 30,
			ALUMNINUM: 50,
		},
		EXTRACTOR: {
			IRON: 300,
		},
	};

	/**
	 * Returns the resources remaining for a user after a purchase, or null if user does not have enough resources
	 * @param resourcePool Client's resource pool
	 * @param building building to purchase
	 */
	static getResourcesAfterPurchase(resourcePool: Resource[], building: Building_Type) {
		const cost = this.costs[building];
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
}
