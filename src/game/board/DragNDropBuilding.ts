import type Phaser from 'phaser';
import type { Building_Type } from '@prisma/client';
import type MainScene from '../scene/MainScene';
import { cellSize } from '../scene/MainScene';
import BuildingManager from '../logic/buildings/BuildingManager';
import type { Position } from '../interfaces/general';
import { clamp } from '../logic/general/math';

export default class DragNDropBuilding {
	readonly buildingType;
	readonly image;

	constructor(scene: MainScene, buildingType: Building_Type, textureKey: string) {
		this.image = scene.add.image(scene.input.mousePointer.x, scene.input.mousePointer.y, textureKey);
		const scale = Math.min(
			(BuildingManager.BUILDING_DATA[buildingType].size.height * cellSize.height) / this.image.displayHeight,
			(BuildingManager.BUILDING_DATA[buildingType].size.width * cellSize.width) / this.image.displayWidth,
		);
		this.image.setScale(scale);
		this.buildingType = buildingType;
		this.image.setInteractive();
		scene.setDragNDropBuilding(this);
	}

	setPosition(position: Position) {
		this.image.setPosition(position.x, position.y);
	}
}
