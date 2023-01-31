import Phaser from 'phaser';
import type { Resource, Resource_Type } from '@prisma/client';
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

export default class UIScene extends Phaser.Scene {
	static readonly BAR_THICKNESS = 150;
	static readonly TEXT_MARGIN_TOP = 25;

	gameSyncManager: GameSyncManager;
	statsText: Map<Resource_Type, Phaser.GameObjects.Text>;
	constructBuildingUIScene: Phaser.Scene;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.statsText = new Map();
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
			new ConstructBuildingUIScene({}, this.gameSyncManager),
			true,
		);
		this.scene.bringToTop('ConstructBuildingUIScene');
		this.constructBuildingUIScene.sys.setVisible(false);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(time: number, delta: number): void {
		//
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
			statsText.setFont(UIConstants.font);
			statsText.setFontSize(18);
			statsText.setTint(0xc0c0c0);
			statsText.setText(`${UIConstants.getResourceSymbol(type)} | ${amount}`);
		}
	}
}
