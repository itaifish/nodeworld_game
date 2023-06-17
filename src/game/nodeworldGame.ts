import type GameSyncManager from './manager/GameSyncManager';
import SceneManager from './manager/SceneManager';
import BackgroundScene from './scene/BackgroundScene';
import MainScene from './scene/MainScene';
import UIScene from './scene/UIScene';

export default class NodeworldGame extends Phaser.Game {
	readonly gameSyncManager: GameSyncManager;
	private readonly sceneManager: SceneManager;
	constructor(config: Phaser.Types.Core.GameConfig | undefined, gameSyncManager: GameSyncManager) {
		super(config);
		this.sceneManager = SceneManager.instance;
		this.gameSyncManager = gameSyncManager;

		const backgroundScene = new BackgroundScene({});
		this.sceneManager.backgroundScene = backgroundScene;
		this.scene.add('BackgroundScene', backgroundScene, true);

		const mainScene = new MainScene({}, gameSyncManager);
		this.sceneManager.mainScene = mainScene;
		this.scene.add('MainScene', mainScene, true);

		const userInterfaceScene = new UIScene({}, gameSyncManager);
		this.sceneManager.userInterfaceScene = userInterfaceScene;
		this.scene.add('UIScene', userInterfaceScene, true);

		// Disable right click menu
		this.canvas.oncontextmenu = (e: MouseEvent) => {
			e.preventDefault();
		};
	}
}
