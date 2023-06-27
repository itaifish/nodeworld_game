import type { ValuesOf } from 'src/utility/type-utils.ts/type-utils';
import { TextureKey } from './TextureKeyManager';
import { Building_Type } from '@prisma/client';

export type AnimationActions = 'harvest';

export const ANIMATION_KEYS = {
	[Building_Type.HARVESTOR]: {
		harvest: 'Harvester_Harvest',
	},
} as const satisfies Partial<Record<Building_Type, Record<AnimationActions, string>>>;

export type AnimationKey = ValuesOf<ValuesOf<typeof ANIMATION_KEYS>>;
