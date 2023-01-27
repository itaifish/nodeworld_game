import GameSyncManager from '../manager/GameSyncManager';
import Phaser from 'phaser';
import type BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin';
import { QuadGrid } from 'phaser3-rex-plugins/plugins/board-components';
import { log } from '../../utility/logger';
import BaseManager from '../logic/base/BaseManager';
import BaseGridBoard from '../board/BaseGridBoard';
import { clamp } from '../logic/general/math';

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;
	rexBoard: BoardPlugin;
	board: BaseGridBoard;
	cameraController: Phaser.Cameras.Controls.SmoothedKeyControl;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
	}

	create() {
		// TODO: Investigate if this will cause a memory leak
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.createBoard());
		const cursors = this.input.keyboard.createCursorKeys();
		this.cameraController = new Phaser.Cameras.Controls.SmoothedKeyControl({
			camera: this.cameras.main,

			left: cursors.left,
			right: cursors.right,
			up: cursors.up,
			down: cursors.down,
			zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
			zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),

			acceleration: 0.09,
			drag: 0.003,
			maxSpeed: 0.5,
		});
	}

	update(time: number, delta: number) {
		super.update(time, delta);
		this.cameraController.update(delta);
		this.cameraController.camera.setZoom(clamp(this.cameraController.camera.zoom, 3, 0.5));
	}

	private createBoard() {
		const base = this.gameSyncManager.getBaseData();
		if (this.rexBoard == null || base == null) {
			log.warn(`Unable to find ${this.rexBoard == null ? 'rexBoard' : ''} ${base == null ? 'base' : ''}`);
			return;
		}

		const quadGrid = new QuadGrid({
			x: 26,
			y: 26,
			cellWidth: 100,
			cellHeight: 100,
			type: 'orthogonal',
		});
		const baseSize = BaseManager.getBaseSize(base.level);
		const board = new BaseGridBoard(
			this,
			{
				grid: quadGrid,
			},
			baseSize,
		);
		this.rexBoard.createTileTexture(board, 'tile', 0xffffff55, 0xff000088, 3);
		board.forEachTileXY((tileXY) => {
			board.addChess(this.add.image(0, 0, 'tile').setAlpha(0.5), tileXY.x, tileXY.y, 0);
		});
		this.board = board;

		// Camera
		const maxSize = this.board.getWorldSize();
		const minXY = this.board.getWorldCameraOrigin();
		this.cameraController.camera.setBounds(minXY.x, minXY.y, maxSize.x, maxSize.y + 300);
	}
}
