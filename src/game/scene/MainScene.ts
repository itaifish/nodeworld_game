import GameSyncManager from '../manager/GameSyncManager';
import Phaser from 'phaser';
import type BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin';
import { QuadGrid } from 'phaser3-rex-plugins/plugins/board-components';
import { log } from '../../utility/logger';
import BaseManager from '../logic/base/BaseManager';

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;
	rexBoard: BoardPlugin | undefined;
	board: BoardPlugin.Board | undefined;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
	}

	create() {
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.createBoard());
	}

	private createBoard() {
		const base = this.gameSyncManager.getBaseData();
		if (this.rexBoard == null || base == null) {
			log.warn(`Unable to find ${this.rexBoard == null ? 'rexBoard' : ''} ${base == null ? 'base' : ''}`);
			return;
		}

		const quadGrid = new QuadGrid({
			x: 0,
			y: 0,
			cellWidth: 80,
			cellHeight: 80,
			type: 'isometric',
		});
		const baseSize = BaseManager.getBaseSize(base.level);
		const board = this.rexBoard.add.board({
			grid: quadGrid,
			...baseSize,
		});
		this.board = board;
	}
}
