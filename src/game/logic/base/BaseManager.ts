/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Building, Building_Type, Resource, Resource_Type } from '@prisma/client';
import { log } from '../../../utility/logger';
import type { Position, Rect, Size } from '../../interfaces/general';
import BuildingManager from '../buildings/BuildingManager';
import { isBetween, isRectCollision, ORIGIN_POSITION } from '../general/math';
import type { BaseDetails } from 'src/game/interfaces/base';

export default class BaseManager {
	static readonly STARTING_RESOURCES: Array<{ type: Resource_Type; amount: number }> = [
		{ type: 'FOOD', amount: 500 },
		{ type: 'ALUMNINUM', amount: 500 },
		{ type: 'GOLD', amount: 500 },
		{ type: 'IRON', amount: 500 },
		{ type: 'PLUTONIUM', amount: 250 },
	];

	static getBaseSize(baseLevel: number): Size {
		return {
			width: 8 + baseLevel * 4,
			height: 8 + baseLevel * 4,
		};
	}

	/**
	 * Does an in-place modification to the current resources, and returns it
	 * @param currentResources Resources to modify
	 * @param modificationToResources Modification (Positive for addition, Negative for subtraction)
	 * @returns Changed currentResources array
	 */
	static modifyResources(
		currentResources: Resource[],
		modificationToResources: Partial<Record<Resource_Type, number>>,
	) {
		for (let i = 0; i < currentResources.length; i++) {
			if (currentResources[i] == undefined) {
				continue;
			}
			const type = currentResources[i]!.type;
			if (type == undefined || currentResources[i]?.amount == undefined) {
				continue;
			}
			currentResources[i]!.amount += modificationToResources[type] ?? 0;
		}
		return currentResources;
	}
	/**
	 * Returns an array of resources, where the amounts for those resources are the changes that `modificationToResources` would apply
	 * @param currentResources Resources to get modifications of
	 * @param modificationToResources Modification (Positive for addition, Negative for subtraction)
	 * @returns array of resource deltas
	 */
	static getModificationToResourceDelta(
		currentResources: Resource[],
		modificationToResources: Partial<Record<Resource_Type, number>>,
	) {
		const newResources: Resource[] = [];
		for (let i = 0; i < currentResources.length; i++) {
			if (currentResources[i] == undefined) {
				continue;
			}
			const type = currentResources[i]!.type;
			if (type == undefined || currentResources[i]?.amount == undefined) {
				continue;
			}
			newResources.push({
				...(currentResources[i] as Resource),
				amount: modificationToResources[type] ?? 0,
			});
		}
		return newResources;
	}

	static canBuildWithoutExceedingMaximumBuildings(building: Building_Type, existingBuildings: Building[]): boolean {
		const buildingData = BuildingManager.getBuildingData(building, 1);
		log.trace(`Checking if can build ${building} `);
		if (buildingData?.maxPerBase) {
			const numberOfExistingBuildings = existingBuildings.filter(
				(existingBuilding) => existingBuilding.type == building,
			).length;
			if (numberOfExistingBuildings >= buildingData.maxPerBase) {
				log.trace(
					`Can't build because there can only be a maximum of ${buildingData.maxPerBase} ${building}s, but there are ${numberOfExistingBuildings} ${building}s already`,
				);
				return false;
			}
		}
		return true;
	}

	static canBuildAtPosition(
		position: Position,
		building: Building_Type,
		existingBuildings: Building[],
		baseSize: Size,
		isRotated = false,
	) {
		if (!this.canBuildWithoutExceedingMaximumBuildings(building, existingBuildings)) {
			return false;
		}
		const buildingData = BuildingManager.getBuildingData(building, 1, isRotated);
		const buildingSize = buildingData.size;

		if (
			!isBetween(position, ORIGIN_POSITION, {
				x: baseSize.width - buildingSize.width,
				y: baseSize.height - buildingSize.height,
			})
		) {
			log.debug(`Can't build because of invalid position ${position.x},${position.y}`);
			return false;
		}
		const newBuildingRect: Rect = { ...position, ...buildingSize };
		for (const existingBuilding of existingBuildings) {
			const size = BuildingManager.getBuildingData(
				existingBuilding.type,
				existingBuilding.level,
				existingBuilding.isRotated,
			).size;
			if (isRectCollision(newBuildingRect, { ...existingBuilding, ...size })) {
				return false;
			}
		}
		return true;
	}

	static canUpgradeBuilding(building: Building, baseData: BaseDetails | null): boolean {
		const now = new Date().getTime();
		if (baseData == null) {
			log.trace(`Can't upgrade building ${building.type} because baseData is null`);
			return false;
		}
		if (building.finishedAt.getTime() > now) {
			log.trace(`Can't upgrade building ${building.type} because it isn't finished`);
			return false;
		}
		const capital = baseData.buildings.find((building) => building.type === 'CAPITAL_BUILDING');
		if (capital == null) {
			log.trace(`Can't upgrade building ${building.type} there is no capital`);
			return false;
		}

		const capitalLevel = capital.level - (capital.finishedAt.getTime() < now ? 1 : 0);

		if (building.level >= capitalLevel && capital.id !== building.id) {
			log.trace(
				`Can't upgrade building ${building.type} L${building.level} the capital's level [${capitalLevel}] is too low`,
			);
			return false;
		}

		const hasEnoughResources = !!BuildingManager.getResourcesAfterPurchase(
			baseData.resources,
			building.type,
			building.level + 1,
		);

		if (!hasEnoughResources) {
			log.trace(`Can't upgrade building ${building.type} becuase the user doesn't have enough resources`);
		}
		return hasEnoughResources;
	}
}
