import { log } from 'src/utility/logger';
import type GameSyncManager from './manager/GameSyncManager';
import BackgroundScene from './scene/BackgroundScene';
import MainScene from './scene/MainScene';
import UIScene from './scene/UIScene';

export default class NodeworldGame extends Phaser.Game {
	readonly gameSyncManager: GameSyncManager;

	constructor(config: Phaser.Types.Core.GameConfig | undefined, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.scene.add('BackgroundScene', new BackgroundScene({}), true);
		const mainScene = new MainScene({}, gameSyncManager);
		this.scene.add('MainScene', mainScene, true);
		this.scene.add('UIScene', new UIScene({}, gameSyncManager, mainScene), true);
		// Disable right click menu
		this.canvas.oncontextmenu = (e: MouseEvent) => {
			e.preventDefault();
		};
	}
}
