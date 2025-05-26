import type { Resource_Type } from '@prisma/client';
import { titleize } from 'src/utility/function-utils/function-utils';

const resourceSymbolMap: Record<Resource_Type, string> = {
	FOOD: '🍞',
	GOLD: '🪙',
	ALUMNINUM: '🧱',
	IRON: '🪨',
	PLUTONIUM: '☢️',
};

export const UIConstants = {
	font: 'Consolas',
	getResourceSymbol(resourceType: Resource_Type) {
		return resourceSymbolMap[resourceType] ?? resourceType;
	},
	getResourceDisplay(resourceType: Resource_Type) {
		return `${titleize(resourceType.toLocaleLowerCase())} ${this.getResourceSymbol(resourceType)}`;
	},
};
