import type { Base, Building, InventoryItem, Resource, Unit, User } from '@prisma/client';

export type BaseDetails = Base & {
	buildings: Building[];
	resources: Resource[];
	military: Unit[];
	owner: User;
	inventory: InventoryItem[];
};
