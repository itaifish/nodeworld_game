import type GameSyncManager from './manager/GameSyncManager';
import BackgroundScene from './scene/BackgroundScene';
import MainScene from './scene/MainScene';
import UIScene from './scene/UIScene';

export default class NodeworldGame extends Phaser.Game {
	private readonly gameSyncManager: GameSyncManager;

	constructor(config: Phaser.Types.Core.GameConfig | undefined, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.scene.add('BackgroundScene', new BackgroundScene({}), true);
		this.scene.add('MainScene', new MainScene({}, gameSyncManager), true);
		this.scene.add('UIScene', new UIScene({}, gameSyncManager), true);
		// Disable right click menu
		this.canvas.oncontextmenu = (e) => {
			e.preventDefault();
		};
	}
}
