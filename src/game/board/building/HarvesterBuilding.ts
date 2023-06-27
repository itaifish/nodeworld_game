import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BaseBuilding from './BaseBuilding';
import { ANIMATION_KEYS } from 'src/game/manager/keys/AnimationKeyManager';

export class HarvesterBuilding extends BaseBuilding {
	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		super(building, scene, position, {
			harvestAnimation: ANIMATION_KEYS.HARVESTOR.harvest,
			defaultFrame: 0,
			progressAnimation: { start: 0, end: 6 },
		});
	}
}
