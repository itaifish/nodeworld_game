import type { ValuesOf } from 'src/utility/type-utils.ts/type-utils';
import { Building_Type } from '@prisma/client';

export type AnimationActions = 'harvest' | 'idle';

export const ANIMATION_KEYS = {
	[Building_Type.HARVESTOR]: {
		idle: undefined,
		harvest: 'Harvester_Harvest',
	},
	[Building_Type.EXTRACTOR]: {
		harvest: undefined,
		idle: 'Extractor_Idle',
	},
} as const satisfies Partial<Record<Building_Type, Partial<Record<AnimationActions, string>>>>;

export type Animations = ValuesOf<typeof ANIMATION_KEYS>;
export type AnimationKey = Exclude<ValuesOf<Animations>, undefined>;
