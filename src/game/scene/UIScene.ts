import type { Resource, Resource_Type } from '@prisma/client';
import GameSyncManager from '../manager/GameSyncManager';

export default class UIScene extends Phaser.Scene {
	static readonly BAR_THICKNESS = 150;
	static readonly TEXT_MARGIN_TOP = 25;

	gameSyncManager: GameSyncManager;
	statsText: Map<Resource_Type, Phaser.GameObjects.Text>;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.statsText = new Map();
	}

	create() {
		const mainWidth = this.cameras.main.width;
		const mainHeight = this.cameras.main.height;
		//GUI BAr
		const graphics = this.add.graphics();
		graphics.fillGradientStyle(0x4444dd, 0x25247a, 0x6622aa, 0x3131ff, 1);
		graphics.fillRect(0, mainHeight - UIScene.BAR_THICKNESS, mainWidth, UIScene.BAR_THICKNESS);
		graphics.stroke();
		// TODO: Do we need to delete this event if the scene *dies* or something? Research https://gist.github.com/samme/01a33324a427f626254c1a4da7f9b6a3?permalink_comment_id=3321966#gistcomment-3321966
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.displayStats());
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
			statsText.setFont('"Press Start 2P');
			statsText.setFontSize(40);
			statsText.setTint(0xc0c0c0);
			statsText.setText(`${this.getResourceSymbol(type)} | ${amount}`);
		}
	}

	private getResourceSymbol(resourceType: Resource_Type) {
		const map: Record<Resource_Type, string> = {
			FOOD: 'Food 🍔',
			GOLD: 'Gold 🪙',
			ALUMNINUM: 'Aluminum 🧱',
			IRON: 'Iron 🧱',
			PLUTONIUM: 'Plutonium ☢️',
		};
		return map[resourceType] ?? resourceType;
	}
}
