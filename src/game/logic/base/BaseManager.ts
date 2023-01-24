/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Resource, Resource_Type } from '@prisma/client';

export default class BaseManager {
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
}
