import GameSyncManager from '../manager/GameSyncManager';
import GoldSpaceBackground from '../resources/images/backgrounds/GoldSpaceBackground.png';

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
		// TODO: Do we need to delete this event if the scene *dies* or something? Research https://gist.github.com/samme/01a33324a427f626254c1a4da7f9b6a3?permalink_comment_id=3321966#gistcomment-3321966
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.displayStats());
	}

	update(time: number, delta: number): void {
		//
	}

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
