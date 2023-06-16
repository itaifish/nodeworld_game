import type Phaser from 'phaser';
import type { Building_Type } from '@prisma/client';
import type MainScene from '../scene/MainScene';
import { cellSize } from '../scene/MainScene';
import BuildingManager from '../logic/buildings/BuildingManager';
import type { Position, Size } from '../interfaces/general';

export default class DragNDropBuilding {
	isRotated;
	readonly buildingType;
	readonly image;

	constructor(scene: MainScene, buildingType: Building_Type, textureKey: string) {
		this.image = scene.add.image(scene.input.mousePointer.x, scene.input.mousePointer.y, textureKey);
		this.buildingType = buildingType;
		this.isRotated = false;
		const size = this.getDisplaySize();
		const scale = size.width / this.image.width;
		this.image.setScale(scale);
		this.image.setInteractive();
		this.image.setDepth(1000);
		this.image.setAlpha(0.4);
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
		const size = BuildingManager.getBuildingData(this.buildingType, 1, this.isRotated).size;
		return {
			width: size.width,
			height: size.height,
		};
	}

	setPosition(position: Position) {
		this.image.setPosition(position.x, position.y);
	}

	rotate() {
		this.isRotated = !this.isRotated;
		this.image.setFlipX(this.isRotated);
	}

	delete() {
		this.image.destroy();
	}
}
