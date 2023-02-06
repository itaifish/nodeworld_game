import GameSyncManager from '../manager/GameSyncManager';
import Phaser from 'phaser';
import type BoardPlugin from 'phaser3-rex-plugins/plugins/board-plugin';
import { QuadGrid } from 'phaser3-rex-plugins/plugins/board-components';
import { log } from '../../utility/logger';
import BaseManager from '../logic/base/BaseManager';
import BaseGridBoard from '../board/BaseGridBoard';
import { clamp, setDifference } from '../logic/general/math';
import tileMap from '../resources/tileProjects/gameMap.json';
import tilesImage from '../resources/images/tilemaps/space-blks-1.034.png';
import type { Position, Size } from '../interfaces/general';
import type DragNDropBuilding from '../board/DragNDropBuilding';
import Rectangle from 'phaser3-rex-plugins/plugins/utils/geom/rectangle/Rectangle';
import { TEXTURE_KEYS } from '../manager/TextureKeyManager';

export const cellSize: Size = {
	width: 100,
	height: 100,
};

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;
	rexBoard: BoardPlugin;
	board: BaseGridBoard;
	cameraController: Phaser.Cameras.Controls.SmoothedKeyControl;
	background: Phaser.GameObjects.Image;
	bounds: Size;
	dndData: {
		building: DragNDropBuilding;
		tilesOver: Set<Phaser.GameObjects.Image>;
		placementCoord: Position | null;
	} | null;

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.dndData = null;
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
			zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
			zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
			zoomSpeed: 0.02,
			acceleration: 0.09,
			drag: 0.003,
			maxSpeed: 0.8,
		});

		this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
			if (!pointer.middleButtonDown()) {
				return;
			}

			this.cameraController.camera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameraController.camera.zoom;
			this.cameraController.camera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameraController.camera.zoom;
		});

		this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_pointer: Phaser.Input.Pointer, _gameObjects: any[]) => {
			this.cameraController.camera.zoom -= (this.cameraController.zoomSpeed * _pointer.deltaY) / 30;
			this.constrainCamera();
		});

		this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
			log.info('pointerdown');
			if (pointer.leftButtonDown()) {
				if (this.dndData == null || this.dndData.placementCoord == null) {
					return;
				}
				this.gameSyncManager.constructBuilding(this.dndData.building.buildingType, this.dndData.placementCoord);
				this.setDragNDropBuilding(null);
			} else if (pointer.rightButtonDown()) {
				this.setDragNDropBuilding(null);
			}
		});

		// tileset map
		const map = this.make.tilemap({ key: 'map' });

		// Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
		// Phaser's cache (i.e. the name you used in preload)
		// TODO: Credit  www.zingot.com
		const tileset = map.addTilesetImage('space-blks-64', 'tiles');
		// Parameters: layer name (or index) from Tiled, tileset, x, y
		const layers = [];
		layers.push(map.createLayer('BackgroundLayer', tileset, -25, -25));
		layers.push(map.createLayer('ForegroundLayer', tileset, -25, -25));
		layers.push(map.createLayer('TopLayer', tileset, -25, -25));
		layers.forEach((layer) => {
			layer.setScale(cellSize.width / map.tileWidth);
		});
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.bounds = { width: layers[0]!.displayWidth, height: layers[0]!.displayHeight };
	}

	update(time: number, delta: number) {
		super.update(time, delta);

		this.cameraController.update(delta);
		this.constrainCamera();
		if (this.dndData != null) {
			this.input.activePointer.updateWorldPoint(this.cameraController.camera);
			const mousePos = {
				x: this.input.activePointer.worldX,
				y: this.input.activePointer.worldY,
			};
			const boardSize = this.board.getWorldSize();
			const newPosition = {
				x: clamp(mousePos.x, boardSize.x, 0),
				y: clamp(mousePos.y, boardSize.y, 0),
			};
			this.dndData.building.setPosition(newPosition);
			// DragNDrop box highlighting
			const tileXY: Position = this.board.worldXYToTileXY(newPosition.x, newPosition.y);
			this.dndData.placementCoord = tileXY;
			const buildingCellSize = this.dndData.building.getCellSize();
			const tilesWorldXY: Position = this.board.tileXYToWorldXY(
				tileXY.x - Math.floor(buildingCellSize.width / 2),
				tileXY.y - Math.floor(buildingCellSize.height / 2),
			);
			const { width, height } = this.dndData.building.getDisplaySize();
			const buildingPosRectangle = new Rectangle(tilesWorldXY.x, tilesWorldXY.y, width - 1, height - 1);
			const tilesOverCords = this.board.rectangleToTileXYArray(buildingPosRectangle);
			const tilesOver = new Set(this.board.tileXYArrayToChessArray(tilesOverCords) as Phaser.GameObjects.Image[]);
			let isValidPlacement = true;
			// check placement validity
			if (tilesOver.size != buildingCellSize.width * buildingCellSize.height) {
				isValidPlacement = false;
				this.dndData.placementCoord = null;
			}
			//
			const noLongerOver = setDifference(this.dndData.tilesOver, tilesOver);
			tilesOver.forEach((tile) => tile.setTexture(isValidPlacement ? TEXTURE_KEYS.GreenTile : TEXTURE_KEYS.RedTile));
			noLongerOver.forEach((tile) => tile.setTexture(TEXTURE_KEYS.Tile));
			this.dndData.tilesOver = tilesOver;
		}
	}

	setDragNDropBuilding(dragNDropBuilding: DragNDropBuilding | null) {
		if (dragNDropBuilding == null) {
			this.dndData?.tilesOver.forEach((tile) => tile.setTexture(TEXTURE_KEYS.Tile));
			this.dndData?.building.delete();
			this.dndData = null;
		} else {
			this.dndData = { building: dragNDropBuilding, tilesOver: new Set(), placementCoord: null };
		}
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
		// board.setInteractive();
		if (this.board == null) {
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.Tile, 0xffffff00, 0xffffff, 1);
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.GreenTile, 0x005511, 0xffffff, 1);
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.RedTile, 0x551100, 0xffffff, 1);
		} else {
			this.board.destroy();
		}
		const buildingPosMap = new Map(base.buildings.map((building) => [`${building.x},${building.y}`, building]));
		board.forEachTileXY((tileXY) => {
			const tileImage = this.add.image(0, 0, TEXTURE_KEYS.Tile).setAlpha(0.5);
			tileImage.setDisplaySize(cellSize.width, cellSize.height);
			board.addChess(tileImage, tileXY.x, tileXY.y, 0);
			const currentBuilding = buildingPosMap.get(`${tileXY.x},${tileXY.y}`);
			if (currentBuilding != undefined) {
				// draw building here
			}
		});

		this.board = board;

		this.constrainCamera();
	}

	private constrainCamera() {
		if (this.board == null) {
			return;
		}
		// Camera
		const maxSize = this.board.getWorldSize();
		const minXY = this.board.getWorldCameraOrigin();
		const extraRoom = 250 / this.cameraController.camera.zoom;
		this.cameraController.camera.setBounds(
			minXY.x - extraRoom,
			minXY.y - extraRoom,
			Math.max(maxSize.x, this.bounds.width) + extraRoom * 2,
			Math.max(maxSize.y, this.bounds.height) + extraRoom + 300 / this.cameraController.camera.zoom,
		);
		this.cameraController.camera.setZoom(clamp(this.cameraController.camera.zoom, 3, 0.4));
	}
}
