import type GameSyncManager from '../manager/GameSyncManager';
import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
	}
}
