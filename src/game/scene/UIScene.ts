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
import { TEXTURE_KEYS } from '../manager/TextureKeyManager';
import { UIConstants } from '../ui/constants';
import type MainScene from './MainScene';
import { MainSceneEvents } from './MainScene';
import { Position } from '../interfaces/general';
import type BaseBuilding from '../board/building/BaseBuilding';
import BuildingManager from '../logic/buildings/BuildingManager';
import { titleize } from 'src/utility/function-utils/function-utils';

const buildingStats = ['hp', 'level', 'type', 'lastHarvest'] as const;
type BuildingStat = (typeof buildingStats)[number];

export default class UIScene extends Phaser.Scene {
	static readonly BAR_THICKNESS = 150;
	static readonly TEXT_MARGIN_TOP = 25;
	static readonly SELECTED_BUILDING_START_WIDTH = 450;

	readonly gameSyncManager: GameSyncManager;
	private statsText: Map<Resource_Type, Phaser.GameObjects.Text>;
	buildingText: Phaser.GameObjects.Text[];
	constructBuildingUIScene: Phaser.Scene;
	readonly mainScene;

	private selectedBuilding: {
		building: BaseBuilding | null;
		text: Phaser.GameObjects.Text[];
		image: Phaser.GameObjects.Image | null;
		harvestData: {
			title: Phaser.GameObjects.Text | null;
			text: Partial<Record<Resource_Type, Phaser.GameObjects.Text>>;
			nextHarvest: Date;
		};
	};

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager, mainScene: MainScene) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.statsText = new Map();
		this.mainScene = mainScene;
		this.selectedBuilding = {
			building: null,
			text: [],
			image: null,
			harvestData: {
				title: null,
				text: {},
				nextHarvest: new Date(),
			},
		};
		this.mainScene.on(MainSceneEvents.SELECT_BUILDING, (data) => {
			this.setSelectedBuilding(data);
		});
	}

	setSelectedBuilding(selectedBuilding: BaseBuilding | null) {
		this.selectedBuilding.building?.setSelected(false);
		this.selectedBuilding.building = selectedBuilding;
		this.selectedBuilding.building?.setSelected(true);
		this.displaySelectedBuilding();
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
		new Button(
			this,
			{ x: 330, y: mainHeight - UIScene.BAR_THICKNESS / 2 },
			() => {
				this.constructBuildingUIScene.sys.setVisible(true);
			},
			'Create Building',
		);

		// Dispatch a window resize event every half second for 10 seconds to allow for mouse input
		// Bizzare workaround to input bug
		// TODO: Investigate
		const keepResizing = setInterval(() => window.dispatchEvent(new UIEvent('resize')), 500);
		setTimeout(() => {
			clearInterval(keepResizing);
		}, 10_000);

		this.constructBuildingUIScene = this.scene.add(
			'ConstructBuildingUIScene',
			new ConstructBuildingUIScene({}, this.gameSyncManager, this.mainScene),
			true,
		);
		this.scene.bringToTop('ConstructBuildingUIScene');
		this.constructBuildingUIScene.sys.setVisible(false);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(time: number, delta: number): void {
		//
	}

	private displaySelectedBuilding() {
		const building = this.selectedBuilding.building?.building;
		this.selectedBuilding.image?.destroy(true);
		this.selectedBuilding.text.forEach((textInstance) => textInstance.destroy(true));
		this.selectedBuilding.text = [];
		this.selectedBuilding.image = null;
		this.selectedBuilding.harvestData.title?.destroy();
		this.selectedBuilding.harvestData.title = null;
		if (building == null) {
			return;
		}
		const defaultY = this.cameras.main.height - UIScene.BAR_THICKNESS;
		this.selectedBuilding.image = this.add.image(
			UIScene.SELECTED_BUILDING_START_WIDTH,
			defaultY,
			ConstructBuildingUIScene.Buildings[building.type].textureKey,
		);
		this.selectedBuilding.image.setY(this.selectedBuilding.image.y + this.selectedBuilding.image.height / 2);
		this.selectedBuilding.image.setX(this.selectedBuilding.image.x + this.selectedBuilding.image.width / 2);
		const textX = UIScene.SELECTED_BUILDING_START_WIDTH + (this.selectedBuilding.image?.width ?? 0);
		let farRight = textX;
		buildingStats.forEach((data, index) => {
			const text = this.add.text(
				textX,
				defaultY + UIScene.TEXT_MARGIN_TOP * (index + 1),
				`${titleize(data)}: \t${this.formatBuildingStatsText(building, data)}`,
			);
			this.formatText(text);
			this.selectedBuilding.text.push(text);
			farRight = Math.max(farRight, text.getRightCenter().x);
		});

		const nextHarvestDate = BuildingManager.getNextHarvest(building);
		this.selectedBuilding.harvestData.nextHarvest = nextHarvestDate;
		const harvest = BuildingManager.getHarvestAmountAndTimeForBuilding(building)?.harvest;
		for (const text of Object.values(this.selectedBuilding.harvestData.text)) {
			text.destroy();
		}
		this.selectedBuilding.harvestData.text = {};

		if (harvest && Object.keys(harvest).length > 0) {
			this.selectedBuilding.harvestData.title = this.formatText(
				this.add.text(farRight + UIScene.TEXT_MARGIN_TOP, defaultY + 10, 'Harvest Data'),
			).setStroke('#000000', 3);
			Object.keys(harvest).forEach((key, index) => {
				const resourceType = key as Resource_Type;
				const amount = harvest[resourceType];
				const statText = this.add.text(
					farRight + UIScene.TEXT_MARGIN_TOP,
					defaultY + 10 + UIScene.TEXT_MARGIN_TOP * (index + 1),
					'',
				);
				this.formatText(statText);
				const textVal = `${UIConstants.getResourceSymbol(resourceType)} | ${amount}`;
				statText.setText(textVal);
				this.selectedBuilding.harvestData.text[resourceType] = statText;
			});
		}
	}

	private formatBuildingStatsText(building: Building, statsKey: BuildingStat): string {
		const map: Record<BuildingStat, string> = {
			hp: `${building.hp} / ${BuildingManager.getBuildingData(building.type, building.level).maxHP}`,
			level: `${building.level}`,
			type: building.type,
			lastHarvest: building.lastHarvest ? `${building.lastHarvest.toLocaleString()}` : 'Never',
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
			statsText.setText(`${UIConstants.getResourceSymbol(type)} | ${amount}`);
		}
	}

	private formatText(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
		text.setFont(UIConstants.font);
		text.setFontSize(18);
		text.setTint(0xc0c0c0);
		return text;
	}
}
