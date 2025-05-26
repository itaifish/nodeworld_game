import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BaseBuilding from './BaseBuilding';
import { ANIMATION_KEYS } from 'src/game/manager/keys/AnimationKeyManager';

export class ExtractorBuilding extends BaseBuilding {
	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		super(building, scene, position, {
			defaultFrame: 12,
			idleAnimation: ANIMATION_KEYS.EXTRACTOR.idle,
		});
	}
}
