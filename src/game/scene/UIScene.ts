import type GameSyncManager from '../manager/GameSyncManager';

export default class UIScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;

	statsText: Phaser.GameObjects.Text | null = null;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
	}

	create() {
		const mainWidth = this.cameras.main.width;
		const mainHeight = this.cameras.main.height;
		const rect = this.add.rectangle(0, mainHeight, mainWidth * 2, mainHeight / 3, 0x6666ff);
		this.statsText = this.add.text(300, rect.getTopLeft().y + 50, 'No Base Data');
		this.gameSyncManager.createBaseIfNotExists().then(() => {
			this.displayStats();
		});
	}

	update(time: number, delta: number): void {}

	private displayStats() {
		const stats = this.gameSyncManager.getBaseData();
		if (stats == null || this.statsText == null) {
			return;
		}
		let displayText = '';
		displayText += stats.resources.map((resource) => `[${resource.type}] ${resource.amount}`).join('\t');
		this.statsText.setText(displayText);
	}
}
