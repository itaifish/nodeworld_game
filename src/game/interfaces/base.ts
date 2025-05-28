import type { Base, Building, InventoryItem, Resource, Unit, UserGalaxyInfo } from '@prisma/client';

export type BaseDetails = Base & {
	buildings: Building[];
	resources: Resource[];
	military: Unit[];
	owner: UserGalaxyInfo;
	inventory: InventoryItem[];
};
