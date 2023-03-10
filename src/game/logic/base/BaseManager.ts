/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Building, Building_Type, Resource, Resource_Type } from '@prisma/client';
import type { Position, Rect, Size } from '../../interfaces/general';
import BuildingManager from '../buildings/BuildingManager';
import { isBetween, isRectCollision, ORIGIN_POSITION } from '../general/math';

export default class BaseManager {
	static readonly STARTING_RESOURCES: Array<{ type: Resource_Type; amount: number }> = [
		{ type: 'FOOD', amount: 200 },
		{ type: 'ALUMNINUM', amount: 200 },
		{ type: 'GOLD', amount: 200 },
		{ type: 'IRON', amount: 200 },
		{ type: 'PLUTONIUM', amount: 200 },
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

	static canBuildAtPosition(
		position: Position,
		building: Building_Type,
		existingBuildings: Building[],
		baseSize: Size,
	) {
		const buildingSize = BuildingManager.BUILDING_DATA[building].size;
		if (
			!isBetween(position, ORIGIN_POSITION, {
				x: baseSize.width - buildingSize.width,
				y: baseSize.height - buildingSize.height,
			})
		) {
			return false;
		}
		const newBuildingRect: Rect = { ...position, ...baseSize };
		for (const existingBuilding of existingBuildings) {
			const size = BuildingManager.BUILDING_DATA[existingBuilding.type].size;
			const position = { x: existingBuilding.x, y: existingBuilding.y };
			if (isRectCollision(newBuildingRect, { ...size, ...position })) {
				return false;
			}
		}
		return true;
	}
}
