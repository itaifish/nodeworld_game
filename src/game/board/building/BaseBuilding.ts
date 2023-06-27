import type { Building } from '@prisma/client';
import type { NumberRange, Position } from 'src/game/interfaces/general';
import BuildingManager from 'src/game/logic/buildings/BuildingManager';
import { clamp } from 'src/game/logic/general/math';
import SelectedBuildingManager from 'src/game/manager/SelectedBuildingManager';
import type { ANIMATION_KEYS, AnimationKey } from 'src/game/manager/keys/AnimationKeyManager';
import ConstructBuildingUIScene from 'src/game/scene/ConstructBuildingUIScene';
import FillableBar from 'src/game/ui/fillable-bar/FillableBar';
import { log } from 'src/utility/logger';

export type AnimationOptions = {
	defaultFrame: number;
	harvestAnimation?: AnimationKey;
	progressAnimation?: NumberRange;
	idleAnimation?: AnimationKey;
};

const defaultAnimation: AnimationOptions = {
	defaultFrame: 0,
};

export default class BaseBuilding {
	readonly sprite: Phaser.GameObjects.Sprite;
	readonly building: Building;
	progressBar: FillableBar | undefined;

	private readonly animationOptions: AnimationOptions;
	private isSelected: boolean;
	private isInAnimation: boolean;

	constructor(building: Building, scene: Phaser.Scene, position: Position, animationOptions = defaultAnimation) {
		this.isSelected = false;
		this.building = building;
		this.sprite = scene.add.sprite(
			position.x,
			position.y,
			ConstructBuildingUIScene.Buildings[building.type].textureKey,
			0,
		);
		this.animationOptions = animationOptions;
		this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 0.4 });
		this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
			this.isInAnimation = false;
		});
		this.sprite.on(Phaser.Animations.Events.ANIMATION_START, () => {
			this.isInAnimation = true;
		});
		this.sprite.on(
			Phaser.Input.Events.POINTER_DOWN,

			(pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonDown()) {
					SelectedBuildingManager.instance.setSelectedBuilding(this);
				}
			},
		);
		const size = BuildingManager.getBuildingData(building).size;
		// Removing this code for now - we don't need to scale the images as they are all the exact right size anyways
		// const scale = (cellSize.width * size.width) / this.image.width;
		// this.image.setScale(scale);
		this.sprite.setFlipX(building.isRotated);
		this.sprite.setOrigin(0.5, 0.75);
		const depth = building.x + building.y + size.width + size.height;
		this.sprite.setDepth(depth);
		this.progressBar = new FillableBar(
			scene,
			{
				x: position.x - this.sprite.displayWidth / 2,
				y: position.y - this.sprite.displayHeight / 2 - 10,
				width: this.sprite.displayWidth,
				height: 10,
			},
			0,
			0x1122ff,
			depth,
		);
	}

	playAnimation(animation: AnimationKey): Promise<void> {
		this.sprite.play(animation);
		return new Promise((resolve, _reject) => {
			this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + animation, () => {
				resolve();
			});
		});
	}

	setSelected(isSelected: boolean) {
		this.isSelected = isSelected;
		if (this.isSelected) {
			this.sprite.setTint(0x1122ff, 0x3322aa, 0x3322aa, 0x1122ff);
		} else {
			this.sprite.clearTint();
		}
	}

	getIsSelected() {
		return this.isSelected;
	}

	delete() {
		this.sprite.destroy();
		if (this.progressBar) {
			this.progressBar.destroy();
		}
	}

	update(_time: number, _delta: number) {
		const now = new Date().getTime();
		// Progress Bar
		if (this.progressBar) {
			let rawProgress;
			if (this.building.level === 1) {
				rawProgress =
					(this.building.finishedAt.getTime() - now) /
					(this.building.finishedAt.getTime() - this.building.createdAt.getTime());
			} else {
				rawProgress =
					(this.building.finishedAt.getTime() - now) /
					(BuildingManager.getBuildingData(this.building).buildTimeSeconds * 1_000);
			}
			const finishedProgress = 1 - clamp(rawProgress, 1, 0);
			// if (Math.random() * 10 <= 1) {
			// 	log.debug(`Building Progress: ${finishedProgress} [Raw progress: ${rawProgress}]`);
			// }
			if (finishedProgress != 1) {
				this.sprite.setAlpha(0.25 + finishedProgress * 0.65);
				this.sprite.setTint(0xffffff);
				this.progressBar.updatePercentFilled(finishedProgress * 100);
			} else {
				this.progressBar.destroy();
				this.progressBar = undefined;
				this.sprite.setAlpha(1);
			}
		}
		// Harvest Progress
		if (this.animationOptions.progressAnimation && !this.isInAnimation) {
			const alreadyFull = BuildingManager.getHarvestAmountAndTimeForBuilding(this.building);
			if (alreadyFull) {
				this.sprite.setFrame(this.animationOptions.progressAnimation.end);
			} else {
				const nextHarvest = BuildingManager.getNextHarvest(this.building)?.getTime();
				if (!nextHarvest) {
					return;
				}
				const lastHarvest = this.building.lastHarvest?.getTime() ?? this.building.createdAt.getTime();
				const harvestProgress = (now - lastHarvest) / (BuildingManager.HARVEST_INTERVAL_MINS * 60_000);

				const currSpriteFrame =
					this.animationOptions.progressAnimation.start +
					Math.round(
						(this.animationOptions.progressAnimation.end - this.animationOptions.progressAnimation.start) *
							harvestProgress,
					);
				this.sprite.setFrame(currSpriteFrame);
			}
		}
	}
}
