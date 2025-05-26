import Phaser from 'phaser';
import type { Building, Resource, Resource_Type } from '@prisma/client';
import { log } from 'src/utility/logger';
import GameSyncManager from '../manager/GameSyncManager';
import NormalButton from '../resources/images/gui/buttons/Button.png';
import HoverButton from '../resources/images/gui/buttons/ButtonHover.png';
import PressedButton from '../resources/images/gui/buttons/ButtonPressed.png';
import SquareNormalButton from '../resources/images/gui/buttons/SquareButton.png';
import SquareHoverButton from '../resources/images/gui/buttons/SquareButtonHover.png';
import SquarePressedButton from '../resources/images/gui/buttons/SquareButtonPressed.png';
import XCloseIcon from '../resources/images/gui/icons/x_icon.png';
import Button from '../ui/button/Button';
import ConstructBuildingUIScene from './ConstructBuildingUIScene';
import { TEXTURE_KEYS } from '../manager/keys/TextureKeyManager';
import { UIConstants } from '../ui/constants';
import BuildingManager from '../logic/buildings/BuildingManager';
import { titleize } from 'src/utility/function-utils/function-utils';
import SelectedBuildingManager from '../manager/SelectedBuildingManager';
import SceneManager from '../manager/SceneManager';
import BaseManager from '../logic/base/BaseManager';
import type { AnimationKey } from '../manager/keys/AnimationKeyManager';
import { ANIMATION_KEYS } from '../manager/keys/AnimationKeyManager';

const buildingStats = ['hp', 'level', 'type', 'lastHarvest', 'nextHarvest'] as const;
type BuildingStat = (typeof buildingStats)[number];

export default class UIScene extends Phaser.Scene {
	static readonly BAR_THICKNESS = 150;
	static readonly TEXT_MARGIN_TOP = 25;
	static readonly SELECTED_BUILDING_START_WIDTH = 450;

	readonly gameSyncManager: GameSyncManager;
	private statsText: Map<Resource_Type, Phaser.GameObjects.Text>;
	buildingText: Phaser.GameObjects.Text[];
	constructBuildingUIScene: Phaser.Scene;

	private selectedBuildingManager = SelectedBuildingManager.instance;

	private selectedBuilding: {
		text: Phaser.GameObjects.Text[];
		image: Phaser.GameObjects.Image | null;
		harvestData: {
			title: Phaser.GameObjects.Text | null;
			text: Partial<Record<Resource_Type, Phaser.GameObjects.Text>>;
			nextHarvest: Date | null;
		};
	};

	private levelUpBuildingButton: Button | null;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.statsText = new Map();
		this.selectedBuilding = {
			text: [],
			image: null,
			harvestData: {
				title: null,
				text: {},
				nextHarvest: new Date(),
			},
		};
		this.levelUpBuildingButton = null;
		this.selectedBuildingManager.on(SelectedBuildingManager.SELECT_EVENT, (_data) => {
			this.displaySelectedBuilding();
		});
	}

	getSelectedBuilding() {
		return SelectedBuildingManager.instance.getSelectedBuilding();
	}

	preload() {
		this.load.image(TEXTURE_KEYS.NormalButton, NormalButton.src);
		this.load.image(TEXTURE_KEYS.HoverButton, HoverButton.src);
		this.load.image(TEXTURE_KEYS.PressedButton, PressedButton.src);
		this.load.image(TEXTURE_KEYS.SquareNormalButton, SquareNormalButton.src);
		this.load.image(TEXTURE_KEYS.SquareHoverButton, SquareHoverButton.src);
		this.load.image(TEXTURE_KEYS.SquarePressedButton, SquarePressedButton.src);
		this.load.image(TEXTURE_KEYS.XCloseIcon, XCloseIcon.src);
	}

	create() {
		this.input.enabled = true;

		const mainWidth = this.cameras.main.width;
		const mainHeight = this.cameras.main.height;
		//GUI BAr
		const graphics = this.add.graphics();
		graphics.fillGradientStyle(0x4444dd, 0x25247a, 0x6622aa, 0x3131ff, 1);
		graphics.fillRect(0, mainHeight - UIScene.BAR_THICKNESS, mainWidth, UIScene.BAR_THICKNESS);
		graphics.stroke();
		// TODO: Do we need to delete this event if the scene *dies* or something? Research https://gist.github.com/samme/01a33324a427f626254c1a4da7f9b6a3?permalink_comment_id=3321966#gistcomment-3321966
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.displayStats());
		const buttonHeight = mainHeight - UIScene.BAR_THICKNESS / 2;
		const shopButton = new Button(
			this,
			{ x: 330, y: buttonHeight },
			() => {
				this.constructBuildingUIScene.sys.setVisible(true);
			},
			'Create Building',
		);

		this.levelUpBuildingButton = new Button(
			this,
			{ x: 330 + shopButton.buttonImage.displayWidth * 5, y: buttonHeight },
			() => {
				const building = this.getSelectedBuilding()?.building;
				// Logic for leveling up building
				if (building && BaseManager.canUpgradeBuilding(building, this.gameSyncManager.getBaseData())) {
					this.gameSyncManager.levelUpBuilding(building);
				}
			},
			'Upgrade Building',
		);
		this.levelUpBuildingButton.hide();

		// Dispatch a window resize event every half second for 10 seconds to allow for mouse input
		// Bizzare workaround to input bug
		// TODO: Investigate
		const keepResizing = setInterval(() => window.dispatchEvent(new UIEvent('resize')), 500);
		setTimeout(() => {
			clearInterval(keepResizing);
		}, 10_000);

		const constructBuildingUIScene = new ConstructBuildingUIScene({}, this.gameSyncManager);
		SceneManager.instance.constructBuildingUIScene = constructBuildingUIScene;
		this.constructBuildingUIScene = this.scene.add(
			'ConstructBuildingUIScene',
			constructBuildingUIScene,
			true,
		) as ConstructBuildingUIScene;
		this.scene.bringToTop('ConstructBuildingUIScene');
		this.constructBuildingUIScene.sys.setVisible(false);
	}

	update(_time: number, _delta: number): void {
		if (this.getSelectedBuilding() != null) {
			const now = new Date().getTime();
			const nextHarvest = this.selectedBuilding.harvestData.nextHarvest?.getTime();
			if (nextHarvest && nextHarvest < now) {
				this.displaySelectedBuilding();
			}
		}
	}

	private displaySelectedBuilding() {
		const building = this.getSelectedBuilding()?.building;
		log.trace(`Displaying Selected Building: ${building?.type || 'null'}`);
		this.selectedBuilding.image?.destroy(true);
		this.selectedBuilding.text.forEach((textInstance) => textInstance.destroy(true));
		this.selectedBuilding.text = [];
		this.selectedBuilding.image = null;
		this.selectedBuilding.harvestData.title?.destroy();
		this.selectedBuilding.harvestData.title = null;
		this.levelUpBuildingButton?.hide();
		if (building == null) {
			return;
		}
		// check if building can be upgraded
		if (BaseManager.canUpgradeBuilding(building, this.gameSyncManager.getBaseData())) {
			this.levelUpBuildingButton?.show();
		}
		const nextHarvestDate = BuildingManager.getNextHarvest(building);
		this.selectedBuilding.harvestData.nextHarvest = nextHarvestDate;

		const defaultY = this.cameras.main.height - UIScene.BAR_THICKNESS;
		this.selectedBuilding.image = this.add.image(
			UIScene.SELECTED_BUILDING_START_WIDTH,
			defaultY,
			ConstructBuildingUIScene.Buildings[building.type].textureKey,
		);
		this.selectedBuilding.image.setScale(UIScene.BAR_THICKNESS / this.selectedBuilding.image.width);
		this.selectedBuilding.image.setY(this.selectedBuilding.image.y + UIScene.BAR_THICKNESS / 2);
		this.selectedBuilding.image.setX(this.selectedBuilding.image.x + this.selectedBuilding.image.displayWidth / 2);
		const textX = UIScene.SELECTED_BUILDING_START_WIDTH + (this.selectedBuilding.image?.displayWidth ?? 0);
		let farRight = textX;

		buildingStats.forEach((data, index) => {
			const text = this.add.text(
				textX,
				defaultY + UIScene.TEXT_MARGIN_TOP * (index + 1),
				`${titleize(data)}: \t${this.formatBuildingStatsText(building, data)}`,
			);
			this.formatText(text);
			this.selectedBuilding.text.push(text);
			farRight = Math.max(farRight, text.getRightCenter().x ?? 0);
		});

		const harvest = BuildingManager.getHarvestAmountAndTimeForBuilding(building)?.harvest;
		for (const text of Object.values(this.selectedBuilding.harvestData.text)) {
			text.destroy();
		}
		this.selectedBuilding.harvestData.text = {};
		const currentFarRight = farRight;
		if (harvest && Object.keys(harvest).length > 0) {
			this.selectedBuilding.harvestData.title = this.formatText(
				this.add.text(currentFarRight + UIScene.TEXT_MARGIN_TOP, defaultY + 10, 'Harvest Data'),
			).setStroke('#000000', 3);
			Object.keys(harvest).forEach((key, index) => {
				const resourceType = key as Resource_Type;
				const amount = harvest[resourceType];
				const statText = this.add.text(
					currentFarRight + UIScene.TEXT_MARGIN_TOP,
					defaultY + 10 + UIScene.TEXT_MARGIN_TOP * (index + 1),
					'',
				);
				this.formatText(statText);
				const textVal = `${UIConstants.getResourceDisplay(resourceType)} | ${amount}`;
				statText.setText(textVal);
				this.selectedBuilding.harvestData.text[resourceType] = statText;
				farRight = Math.max(farRight, statText.getRightCenter().x ?? 0);
			});

			this.selectedBuilding.image
				.setInteractive()
				.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
					if (pointer.leftButtonDown()) {
						const animationKey: AnimationKey | null = (ANIMATION_KEYS as any)[building.type]?.harvest;
						if (animationKey) {
							this.selectedBuildingManager.runAnimationForSelectedBuilding(animationKey).then(() => {
								this.gameSyncManager.harvestBuilding(building);
							});
						} else {
							this.gameSyncManager.harvestBuilding(building);
						}
					}
				});
		}
		this.levelUpBuildingButton?.setPosition({
			x: farRight + this.levelUpBuildingButton.buttonImage.displayWidth,
			y: this.levelUpBuildingButton.buttonImage.y,
		});
	}

	private formatBuildingStatsText(building: Building, statsKey: BuildingStat | 'nextHarvest'): string {
		const map: Record<BuildingStat | 'nextHarvest', string> = {
			hp: `${building.hp} / ${BuildingManager.getBuildingData(building).maxHP}`,
			level: `${building.level}`,
			type: building.type,
			lastHarvest: building.lastHarvest ? `${building.lastHarvest.toLocaleString()}` : 'Never',
			nextHarvest: this.selectedBuilding?.harvestData?.nextHarvest?.toLocaleString() ?? 'Never',
		};
		return map[statsKey] ?? '';
	}

	private displayStats() {
		const stats = this.gameSyncManager.getBaseData();
		if (stats == null || this.statsText == null) {
			return;
		}

		for (let i = 0; i < stats.resources.length; i++) {
			const { type, amount } = stats.resources[i] as Resource;
			let statsText = this.statsText.get(type);
			if (statsText == undefined) {
				statsText = this.add.text(
					UIScene.TEXT_MARGIN_TOP,
					this.cameras.main.height - UIScene.BAR_THICKNESS + UIScene.TEXT_MARGIN_TOP * (i + 1),
					'',
				);
				this.statsText.set(type, statsText);
			}
			this.formatText(statsText);
			statsText.setText(`${UIConstants.getResourceDisplay(type)} | ${amount}`);
		}
	}

	private formatText(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
		text.setFont(UIConstants.font);
		text.setFontSize(18);
		text.setTint(0xc0c0c0);
		return text;
	}
}
