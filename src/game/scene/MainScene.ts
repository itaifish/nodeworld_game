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
import BaseBuilding from '../board/building/BaseBuilding';
import BuildingManager from '../logic/buildings/BuildingManager';
import SelectedBuildingManager from '../manager/SelectedBuildingManager';

export const cellSize: Size = {
	width: 64,
	height: 32,
};

export default class MainScene extends Phaser.Scene {
	gameSyncManager: GameSyncManager;
	rexBoard: BoardPlugin;
	board: BaseGridBoard;
	cameraController: Phaser.Cameras.Controls.SmoothedKeyControl;
	background: Phaser.GameObjects.Image;
	bounds: Rectangle;
	dndData: {
		building: DragNDropBuilding;
		tilesOver: Set<Phaser.GameObjects.Image>;
		placementCoord: Position | null;
	} | null;
	buildings: BaseBuilding[];

	constructor(config: Phaser.Types.Scenes.SettingsConfig, gameSyncManager: GameSyncManager) {
		super(config);
		this.gameSyncManager = gameSyncManager;
		this.dndData = null;
		this.buildings = [];
	}

	preload() {
		this.load.image('tiles', tilesImage.src);
		this.load.tilemapTiledJSON('map', tileMap);
	}

	create() {
		log.info('MainScene created');
		// TODO: Investigate if this will cause a memory leak
		this.gameSyncManager.on(GameSyncManager.EVENTS.BASE_GAME_STATE_UPDATED, () => this.createBoard());
		if (this.input == null || this.input.keyboard == null) {
			log.warn(`Error: Input/keyboard is null`);
			return;
		}

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
			if (this.cameraController?.camera == null) {
				return;
			}
			if (!pointer.middleButtonDown()) {
				return;
			}

			this.cameraController.camera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameraController.camera.zoom;
			this.cameraController.camera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameraController.camera.zoom;
		});

		this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_pointer: Phaser.Input.Pointer, _gameObjects: any[]) => {
			if (this.cameraController?.camera?.zoom == null) {
				return;
			}
			this.cameraController.camera.zoom -= (this.cameraController.zoomSpeed * _pointer.deltaY) / 30;
			this.constrainCamera();
		});

		this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
			if (pointer.leftButtonDown()) {
				log.debug(JSON.stringify(this.board?.worldXYToTileXY(pointer.worldX, pointer.worldY) ?? 'Nothing Found'));
				if (this.dndData == null || this.dndData.placementCoord == null) {
					return;
				}
				const placementCoord = { ...this.dndData.placementCoord };
				const buildingType = this.dndData.building.buildingType;
				this.setDragNDropBuilding(null);
				this.gameSyncManager.constructBuilding(buildingType, placementCoord);
			} else if (pointer.rightButtonDown()) {
				this.setDragNDropBuilding(null);
			}
		});

		// tileset map
		// const map = this.make.tilemap({ key: 'map' });

		// // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
		// // Phaser's cache (i.e. the name you used in preload)
		// // TODO: Credit  www.zingot.com
		// const tileset = map.addTilesetImage('space-blks-64', 'tiles');
		// // Parameters: layer name (or index) from Tiled, tileset, x, y
		// const layers = [];
		// layers.push(map.createLayer('BackgroundLayer', tileset, -25, -25));
		// layers.push(map.createLayer('ForegroundLayer', tileset, -25, -25));
		// layers.push(map.createLayer('TopLayer', tileset, -25, -25));
		// layers.forEach((layer) => {
		// 	layer.setScale(cellSize.width / map.tileWidth);
		// });
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	}

	update(time: number, delta: number) {
		super.update(time, delta);
		const base = this.gameSyncManager.getBaseData();
		this.cameraController.update(delta);
		this.constrainCamera();
		if (this.dndData != null) {
			this.input.activePointer.updateWorldPoint(this.cameraController?.camera as any);
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
			this.dndData.placementCoord = { x: tileXY.x - 1, y: tileXY.y - 1 };
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
			const overEnoughTiles = tilesOver.size == buildingCellSize.width * buildingCellSize.height;
			const overEmptyTiles =
				!!base &&
				BaseManager.canBuildAtPosition(
					this.dndData.placementCoord,
					this.dndData.building.buildingType,
					base.buildings,
					BaseManager.getBaseSize(base.level),
				);
			if (!overEnoughTiles || !overEmptyTiles) {
				isValidPlacement = false;
				this.dndData.placementCoord = null;
			}
			const noLongerOver = setDifference(this.dndData.tilesOver, tilesOver);
			tilesOver.forEach((tile) => tile.setTexture(isValidPlacement ? TEXTURE_KEYS.GreenTile : TEXTURE_KEYS.RedTile));
			noLongerOver.forEach((tile) => tile.setTexture(TEXTURE_KEYS.Tile));
			this.dndData.tilesOver = tilesOver;
		}

		// Update buildings
		this.buildings.forEach((building) => building.update(time, delta));
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
			type: 'isometric',
		});
		const baseSize = BaseManager.getBaseSize(base.level);
		const board = new BaseGridBoard(
			this,
			{
				grid: quadGrid,
			},
			baseSize,
		);
		board.setInteractive();
		if (this.board == null) {
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.Tile, 0x000000ff, 0xffffff, 1);
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.GreenTile, 0x005511, 0xffffff, 1);
			this.rexBoard.createTileTexture(board, TEXTURE_KEYS.RedTile, 0x551100, 0xffffff, 1);
		} else {
			this.board.destroy();
		}
		board.forEachTileXY((tileXY) => {
			const tileImage = this.add.image(0, 0, TEXTURE_KEYS.Tile).setAlpha(0.5);
			tileImage.setDisplaySize(cellSize.width, cellSize.height);
			tileImage.setInteractive();
			board.addChess(tileImage, tileXY.x, tileXY.y, 0);
		});

		//draw buildings
		let selectedBuildingId: string | null = null;
		if (this.buildings.length != 0) {
			for (const buildingImage of this.buildings.values()) {
				if (buildingImage.getIsSelected()) {
					selectedBuildingId = buildingImage.building?.id;
				}
				buildingImage.delete();
			}
		}
		this.buildings = [];
		const ratio = cellSize.width / cellSize.height;
		base?.buildings.forEach((building) => {
			const size = BuildingManager.getBuildingData(building.type, building.level).size;
			const position = board.tileXYToWorldXY(building.x, building.y);
			log.debug(`position: ${position.x},${position.y} from buildingPos: ${building.x}, ${building.y}`);
			const centeredPosition = {
				x: position.x + cellSize.width * ((size.width - size.height) / 4),
				y: position.y + cellSize.height * ((size.height + size.width) / 4 - 0.5),
			};
			const newBuilding = new BaseBuilding(building, this, centeredPosition);
			if (building.id === selectedBuildingId) {
				SelectedBuildingManager.instance.setSelectedBuilding(newBuilding);
			}
			this.buildings.push(newBuilding);
		});
		this.bounds = board.getBoardBoundRect();
		this.board = board;

		this.constrainCamera();
	}

	private constrainCamera() {
		if (this.board == null || this.cameraController?.camera?.zoom == null) {
			return;
		}
		// Camera
		const maxSize = this.board.getWorldSize();
		const minXY = this.bounds;
		const extraRoom = 250 / this.cameraController.camera.zoom;
		this.cameraController.camera.setBounds(
			minXY.x - extraRoom,
			minXY.y - extraRoom,
			Math.max(maxSize.x, this.bounds.width) + extraRoom * 2,
			Math.max(maxSize.y, this.bounds.height) + extraRoom + 300 / this.cameraController.camera.zoom,
		);
		this.cameraController.camera.setZoom(clamp(this.cameraController.camera.zoom, 3, 0.75));
	}
}
