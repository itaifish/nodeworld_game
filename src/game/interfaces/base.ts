import type { Base, Building, InventoryItem, Resource, Unit } from '@prisma/client';

export type BaseDetails = Base & {
	buildings: Building[];
	resources: Resource[];
	military: Unit[];
	inventory: InventoryItem[];
};
