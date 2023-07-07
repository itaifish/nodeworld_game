/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Phaser from 'phaser';
import GameSyncManager from '../manager/GameSyncManager';
import { TEXTURE_KEYS } from '../manager/keys/TextureKeyManager';
import BrickTileBG from '../resources/images/backgrounds/brick_tile_bg.png';
import CloseButton from '../ui/button/CloseButton';
import CapitalBuilding from '../resources/images/buildings/capital_building.png';
import Harvester from '../resources/images/buildings/isometric/harvester/Harvester_Sprite_Sheet/spritesheet.png';
import Extractor from '../resources/images/buildings/isometric/extractor/spritesheet.png';
import DefaultBuilding2_2 from '../resources/images/buildings/isometric/default_building_2x2.png';
import DefaultBuilding1_1 from '../resources/images/buildings/isometric/default_building_1x1.png';
import ResearchLab from '../resources/images/buildings/isometric/ResearchLab.png';
import UIScene from './UIScene';
import type { Building_Type, Resource_Type } from '@prisma/client';
import type MainScene from './MainScene';
import { cellSize } from './MainScene';
import BuildingManager from '../logic/buildings/BuildingManager';
import type { Rect, Size } from '../interfaces/general';
import { UIConstants } from '../ui/constants';
import DragNDropBuilding from '../board/DragNDropBuilding';
import { log } from 'src/utility/logger';
import SceneManager from '../manager/SceneManager';
import BaseManager from '../logic/base/BaseManager';
import { ANIMATION_KEYS } from '../manager/keys/AnimationKeyManager';

type BuildingInfo = {
	textureKey: string;
	src: string;
	spriteSheetData?: Size;
};

export default class ConstructBuildingUIScene extends Phaser.Scene {
	readonly gameSyncManager: GameSyncManager;
	constructRectangle: Rect;
	textAndImages: Record<
		Building_Type,
		| {
				text: Phaser.GameObjects.Text;
				image: Phaser.GameObjects.Image;
		  }
		| undefined
	>;
	readonly mainScene: MainScene;

	static Buildings: Record<Building_Type, BuildingInfo> = {
		CAPITAL_BUILDING: { textureKey: TEXTURE_KEYS.CapitalBuilding, src: CapitalBuilding.src },
		DWELLING: { textureKey: TEXTURE_KEYS.Dwelling, src: DefaultBuilding2_2.src },
		EXTRACTOR: { textureKey: TEXTURE_KEYS.Extractor, src: Extractor.src, spriteSheetData: { width: 64, height: 64 } },
		HARVESTOR: { textureKey: TEXTURE_KEYS.Harvestor, src: Harvester.src, spriteSheetData: { width: 64, height: 64 } },
		BARRACKS: { textureKey: TEXTURE_KEYS.Barracks, src: DefaultBuilding2_2.src },
		// TODO: Get valid textures
		RESEARCH_LAB: { textureKey: TEXTURE_KEYS.ResearchLab, src: ResearchLab.src },
		AEROSPACE_DEPOT: { textureKey: TEXTURE_KEYS.Barracks, src: DefaultBuilding2_2.src },
		ANTI_AIRCRAFT_TURRET: { textureKey: TEXTURE_KEYS.AntiAircraftTurret, src: DefaultBuilding1_1.src },
		SCATTERGUN_TURRET: { textureKey: TEXTURE_KEYS.ScattergunTurret, src: DefaultBuilding1_1.src },
		ENERGY_SHIELD_WALL: { textureKey: TEXTURE_KEYS.EnergyShieldWall, src: DefaultBuilding1_1.src },
		UNIVERSITY: { textureKey: TEXTURE_KEYS.Barracks, src: DefaultBuilding2_2.src },
	};

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.textAndImages = {
			CAPITAL_BUILDING: undefined,
			DWELLING: undefined,
			EXTRACTOR: undefined,
			HARVESTOR: undefined,
			BARRACKS: undefined,
			RESEARCH_LAB: undefined,
			AEROSPACE_DEPOT: undefined,
			ANTI_AIRCRAFT_TURRET: undefined,
			SCATTERGUN_TURRET: undefined,
			ENERGY_SHIELD_WALL: undefined,
			UNIVERSITY: undefined,
		};
		this.mainScene = SceneManager.instance.mainScene as MainScene;
	}

	preload() {
		this.load.image(TEXTURE_KEYS.BrickTileBg, BrickTileBG.src);
		Object.values(ConstructBuildingUIScene.Buildings).forEach((buildingObj) => {
			if (buildingObj.spriteSheetData) {
				this.load.spritesheet(buildingObj.textureKey, buildingObj.src, {
					frameWidth: buildingObj.spriteSheetData.width,
					frameHeight: buildingObj.spriteSheetData.height,
				});
			} else {
				this.load.image(buildingObj.textureKey, buildingObj.src);
			}
		});
	}

	create() {
		this.createAnimations();
		const cameraHeight = this.cameras.main.displayHeight - UIScene.BAR_THICKNESS;
		const height = cameraHeight * 0.75;
		const width = this.cameras.main.displayWidth * 0.85;
		const x = (this.cameras.main.displayWidth - width) / 2;
		const y = (cameraHeight - height) / 2;
		this.constructRectangle = { x, y, width, height };
		const tiledBG = this.add.tileSprite(x, y, width, height, TEXTURE_KEYS.BrickTileBg);
		tiledBG.setOrigin(0, 0);
		new CloseButton(this, { x: x + width, y }, () => {
			this.sys.setVisible(false);
		});
		this.initDrawTextAndImages();
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.updateTextAndImages());
	}

	private updateTextAndImages() {
		const baseData = this.gameSyncManager.getBaseData();
		const resources = baseData?.resources;
		const buildings = baseData?.buildings;
		Object.entries(this.textAndImages).forEach(([key, value]) => {
			if (value == undefined) {
				log.warn(`Unable to find data for ${key}`);
				return;
			}
			const buildingType = key as Building_Type;
			const resourcesAfter = resources && BuildingManager.getResourcesAfterPurchase(resources, buildingType);

			if (
				resourcesAfter == null ||
				!BaseManager.canBuildWithoutExceedingMaximumBuildings(buildingType, buildings ?? [])
			) {
				value.text.setColor('red');
				value.text.setShadow(1, 1, 'black', 1);
			} else {
				value.text.setColor('white');
				value.text.setShadow(1, 1, 'blue', 3);
			}
		});
	}

	private createAnimations() {
		this.anims.create({
			key: ANIMATION_KEYS.HARVESTOR.harvest,
			frameRate: 6,
			frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.Harvestor, { start: 6 }),
			repeat: 0,
		});
		this.anims.create({
			key: ANIMATION_KEYS.EXTRACTOR.idle,
			frameRate: 9,
			frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.Extractor, { start: 0, end: 11 }),
			repeat: -1,
		});
	}

	private initDrawTextAndImages() {
		const { x, y, width } = this.constructRectangle;
		let yOffset = 50;
		const title = this.add.text(x + width / 2, y + yOffset, 'Construct a Building');
		title.setFont(UIConstants.font);
		title.setFontSize(30);
		title.setOrigin(0.5, 0.5);

		const numCols = 3;
		const xOffset = width / numCols;
		const buildings = Object.keys(ConstructBuildingUIScene.Buildings) as Building_Type[];
		let buildingIndex = 0;
		yOffset += 80;
		while (buildingIndex < buildings.length) {
			let yIndexHeightIncrease = 0;
			for (let i = 0; i < numCols; i++) {
				if (buildingIndex >= buildings.length) {
					break;
				}
				const buildingType = buildings[buildingIndex]!;
				const imageX = x + 100 + xOffset * i;
				const image = this.add.image(imageX, y + yOffset, ConstructBuildingUIScene.Buildings[buildingType].textureKey);
				const scale = cellSize.width / image.displayWidth;
				image.setScale(scale);
				yIndexHeightIncrease = Math.max(yIndexHeightIncrease, image.displayHeight);
				image.setDepth(10);
				image.setOrigin(0.5, 0.5);
				image.setInteractive();
				image.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
					if (!pointer.leftButtonDown() || !this.sys.isVisible()) {
						return;
					}
					const baseData = this.gameSyncManager.getBaseData();
					const resources = baseData?.resources;
					const buildings = baseData?.buildings;
					const resourcesAfter = resources && BuildingManager.getResourcesAfterPurchase(resources, buildingType);
					if (
						resourcesAfter == null ||
						!BaseManager.canBuildWithoutExceedingMaximumBuildings(buildingType, buildings ?? [])
					) {
						return;
					}
					const _building = new DragNDropBuilding(
						this.mainScene,
						buildingType,
						ConstructBuildingUIScene.Buildings[buildingType].textureKey,
					);
					this.sys.setVisible(false);
				});
				const { size, buildTimeSeconds, costs } = BuildingManager.getBuildingData(buildingType, 1);
				const costsStr = Object.entries(costs)
					.map(([costKey, costValue]) => `_ ${UIConstants.getResourceSymbol(costKey as Resource_Type)}: ${costValue}`)
					.join(', ');
				const imageInfoText = `${buildingType}\n
					- ${size.width} x ${size.height}
					- ${buildTimeSeconds} seconds to build
					- Costs:
						${costsStr}`;
				const infoTextObj = this.add.text(
					imageX + cellSize.width * 0.6,
					y + yOffset - cellSize.height / 2,
					imageInfoText,
				);
				infoTextObj.setFont(UIConstants.font);
				infoTextObj.setFontSize(18);
				infoTextObj.setOrigin(0, 0);
				infoTextObj.setShadow(1, 1, 'blue', 3);

				this.textAndImages[buildingType] = {
					text: infoTextObj,
					image,
				};
				buildingIndex++;
			}
			yOffset += 100 + yIndexHeightIncrease;
		}
	}
}
