import type { Building } from '@prisma/client';
import type { Position } from 'src/game/interfaces/general';
import BuildingManager from 'src/game/logic/buildings/BuildingManager';
import { clamp } from 'src/game/logic/general/math';
import SelectedBuildingManager from 'src/game/manager/SelectedBuildingManager';
import ConstructBuildingUIScene from 'src/game/scene/ConstructBuildingUIScene';
import { cellSize } from 'src/game/scene/MainScene';
import FillableBar from 'src/game/ui/fillable-bar/FillableBar';
import { log } from 'src/utility/logger';

export default class BaseBuilding {
	readonly image: Phaser.GameObjects.Image;
	readonly building: Building;
	progressBar: FillableBar | undefined;

	private isSelected: boolean;

	constructor(building: Building, scene: Phaser.Scene, position: Position) {
		this.isSelected = false;
		this.building = building;
		this.image = scene.add.image(position.x, position.y, ConstructBuildingUIScene.Buildings[building.type].textureKey);
		this.image.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 0.4 });
		this.image.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
			if (pointer.leftButtonDown()) {
				SelectedBuildingManager.instance.setSelectedBuilding(this);
			}
		});
		const size = BuildingManager.getBuildingData(building.type, building.level, building.isRotated).size;
		// Removing this code for now - we don't need to scale the images as they are all the exact right size anyways
		// const scale = (cellSize.width * size.width) / this.image.width;
		// this.image.setScale(scale);
		this.image.setFlipX(building.isRotated);
		this.image.setOrigin(0.5, 0.75);
		const depth = building.x + building.y + size.width + size.height;
		this.image.setDepth(depth);
		this.progressBar = new FillableBar(
			scene,
			{
				x: position.x - this.image.displayWidth / 2,
				y: position.y - this.image.displayHeight / 2 - 10,
				width: this.image.displayWidth,
				height: 10,
			},
			0,
			0x1122ff,
			depth,
		);
	}

	setSelected(isSelected: boolean) {
		this.isSelected = isSelected;
		if (this.isSelected) {
			this.image.setTint(0x1122ff, 0x3322aa, 0x3322aa, 0x1122ff);
		} else {
			this.image.clearTint();
		}
	}

	getIsSelected() {
		return this.isSelected;
	}

	delete() {
		this.image.destroy();
		if (this.progressBar) {
			this.progressBar.destroy();
		}
	}

	update(_time: number, _delta: number) {
		const now = new Date().getTime();
		if (this.progressBar) {
			const rawProgress =
				(this.building.finishedAt.getTime() - now) /
				(BuildingManager.getBuildingData(this.building.type, this.building.level).buildTimeSeconds * 1_000);
			const finishedProgress = 1 - clamp(rawProgress, 1, 0);
			log.trace(`Building Progress: ${finishedProgress} [Raw progress: ${rawProgress}]`);
			if (finishedProgress != 1) {
				this.image.setAlpha(0.25 + finishedProgress * 0.65);
				this.image.setTint(0xffffff);
				this.progressBar.updatePercentFilled(finishedProgress * 100);
			} else {
				this.progressBar.destroy();
				this.progressBar = undefined;
				this.image.setAlpha(1);
			}
		}
	}
}
