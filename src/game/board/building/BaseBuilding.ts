import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BuildingManager from 'src/game/logic/buildings/BuildingManager';
import { clamp } from 'src/game/logic/general/math';
import ConstructBuildingUIScene from 'src/game/scene/ConstructBuildingUIScene';
import { cellSize } from 'src/game/scene/MainScene';
import FillableBar from 'src/game/ui/fillable-bar/FillableBar';

export default class BaseBuilding {
	readonly image: Phaser.GameObjects.Image;
	readonly building: Building;
	progressBar: FillableBar | undefined;

	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		this.building = building;
		this.image = scene.add.image(position.x, position.y, ConstructBuildingUIScene.Buildings[building.type].textureKey);
		const size = BuildingManager.BUILDING_DATA[building.type].size;
		const scale = Math.min(
			(cellSize.height * size.height) / this.image.displayHeight,
			(cellSize.width * size.width) / this.image.displayWidth,
		);
		this.image.setScale(scale);
		this.image.setOrigin(0.5, 0.5);
		this.progressBar = new FillableBar(
			scene,
			{
				x: position.x - this.image.displayWidth / 2,
				y: position.y - this.image.displayHeight / 2 - 10,
				width: this.image.displayWidth,
				height: 20,
			},
			0,
			0x1122ff,
		);
	}

	delete() {
		this.image.destroy();
		if (this.progressBar) {
			this.progressBar.destroy();
		}
	}

	update(time: number, delta: number) {
		const now = new Date().getTime();
		if (this.progressBar) {
			const rawProgress =
				(this.building.finishedAt.getTime() - now) /
				(BuildingManager.BUILDING_DATA[this.building.type].buildTimeSeconds * 1_000);
			const finishedProgress = 1 - clamp(rawProgress, 1, 0);
			console.log(`${finishedProgress} ${rawProgress}`);
			if (finishedProgress != 1) {
				this.image.setAlpha(0.25 + finishedProgress * 0.65);
				this.image.setTint(0xffffff);
				this.progressBar.updatePercentFilled(finishedProgress * 100);
			} else {
				this.progressBar.destroy();
				this.progressBar = undefined;
			}
		}
	}
}
