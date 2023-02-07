import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BuildingManager from 'src/game/logic/buildings/BuildingManager';
import ConstructBuildingUIScene from 'src/game/scene/ConstructBuildingUIScene';
import { cellSize } from 'src/game/scene/MainScene';

export default class BaseBuilding {
	readonly image: Phaser.GameObjects.Image;
	readonly building: Building;

	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		this.building = building;
		this.image = scene.add.image(position.x, position.y, ConstructBuildingUIScene.Buildings[building.type].textureKey);
		const size = BuildingManager.BUILDING_DATA[building.type].size;
		const scale = (cellSize.height * size.height) / this.image.displayHeight;
		this.image.setScale(scale);
		this.image.setOrigin(0.5, 0.5);
		//
	}

	delete() {
		this.image.destroy();
	}
}
