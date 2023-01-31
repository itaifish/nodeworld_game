import type { Resource_Type } from '@prisma/client';

const map: Record<Resource_Type, string> = {
	FOOD: 'Food 🍞',
	GOLD: 'Gold 🪙',
	ALUMNINUM: 'Aluminum 🧱',
	IRON: 'Iron 🪨',
	PLUTONIUM: 'Plutonium ☢️',
};

export const UIConstants = {
	font: 'Consolas',
	getResourceSymbol(resourceType: Resource_Type) {
		return map[resourceType] ?? resourceType;
	},
};
