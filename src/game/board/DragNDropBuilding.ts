import type Phaser from 'phaser';
import type { Building_Type } from '@prisma/client';
import type MainScene from '../scene/MainScene';
import { cellSize } from '../scene/MainScene';
import BuildingManager from '../logic/buildings/BuildingManager';
import type { Position, Size } from '../interfaces/general';

export default class DragNDropBuilding {
	readonly buildingType;
	readonly image;

	constructor(scene: MainScene, buildingType: Building_Type, textureKey: string) {
		this.image = scene.add.image(scene.input.mousePointer.x, scene.input.mousePointer.y, textureKey);
		this.buildingType = buildingType;
		const size = this.getDisplaySize();
		const scale = Math.min(size.height / this.image.displayHeight, size.width / this.image.displayWidth);
		this.image.setScale(scale);
		this.image.setInteractive();
		this.image.setDepth(1);
		scene.setDragNDropBuilding(this);
	}

	getDisplaySize(): Size {
		const myCellSize = this.getCellSize();
		return {
			width: myCellSize.width * cellSize.width,
			height: myCellSize.height * cellSize.height,
		};
	}

	getCellSize(): Size {
		return {
			width: BuildingManager.BUILDING_DATA[this.buildingType].size.width,
			height: BuildingManager.BUILDING_DATA[this.buildingType].size.height,
		};
	}

	setPosition(position: Position) {
		this.image.setPosition(position.x, position.y);
	}

	delete() {
		this.image.destroy();
	}
}
