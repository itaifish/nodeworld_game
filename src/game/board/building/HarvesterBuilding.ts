import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BaseBuilding from './BaseBuilding';

export class HarvesterBuilding extends BaseBuilding {
	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		super(building, scene, position);
	}
}
