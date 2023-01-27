import GameSyncManager from '../manager/GameSyncManager';
import Phaser from 'phaser';
import type BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin';
import { QuadGrid } from 'phaser3-rex-plugins/plugins/board-components';
import { log } from '../../utility/logger';
import BaseManager from '../logic/base/BaseManager';
import BaseGridBoard from '../board/BaseGridBoard';
import { clamp } from '../logic/general/math';
import tileMap from '../resources/tileProjects/gameMap.json';
import tilesImage from '../resources/images/tilemaps/space-blks-1.034.png';
import type { Size } from '../interfaces/general';

const cellSize: Size = {
	width: 100,
	height: 100,
};

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;
	rexBoard: BoardPlugin;
	board: BaseGridBoard;
	cameraController: Phaser.Cameras.Controls.SmoothedKeyControl;
	background: Phaser.GameObjects.Image;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
	}

	preload() {
		this.load.image('tiles', tilesImage.src);
		this.load.tilemapTiledJSON('map', tileMap);
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

		// tileset map
		const map = this.make.tilemap({ key: 'map' });

		// Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
		// Phaser's cache (i.e. the name you used in preload)
		const tileset = map.addTilesetImage('space-blks-64', 'tiles');
		// Parameters: layer name (or index) from Tiled, tileset, x, y
		const layers = [];
		layers.push(map.createLayer('BackgroundLayer', tileset, 0, 0));
		layers.push(map.createLayer('ForegroundLayer', tileset, 0, 0));
		layers.push(map.createLayer('TopLayer', tileset, 0, 0));
		layers.forEach((layer) => {
			layer.setScale(cellSize.width / map.tileWidth);
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

		if (this.board != undefined) {
			this.board.destroy();
		}

		const quadGrid = new QuadGrid({
			x: 26,
			y: 26,
			cellWidth: cellSize.width,
			cellHeight: cellSize.height,
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
			const tileImage = this.add.image(0, 0, 'tile').setAlpha(0.5);
			tileImage.setDisplaySize(cellSize.width, cellSize.height);
			const tile = board.addChess(tileImage, tileXY.x, tileXY.y, 0);
		});
		this.board = board;

		// Camera
		const maxSize = this.board.getWorldSize();
		const minXY = this.board.getWorldCameraOrigin();
		this.cameraController.camera.setBounds(minXY.x, minXY.y, maxSize.x, maxSize.y + 300);
	}
}
