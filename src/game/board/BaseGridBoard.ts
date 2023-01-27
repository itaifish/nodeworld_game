import type Phaser from 'phaser';
import { Board } from 'phaser3-rex-plugins/plugins/board-components';
import type { Size } from '../interfaces/general';

export default class BaseGridBoard extends Board {
	readonly scene: Phaser.Scene;
	readonly size: Size;

	constructor(scene: Phaser.Scene, config: Board.IConfig, size: Size) {
		super(scene, { ...config, ...size });
		this.scene = scene;
		this.size = size;
		this.init();
	}

	init() {
		this.once('destroy', () => {
			// cleanup
		});
	}

	getWorldCameraOrigin(): { x: number; y: number } {
		return this.tileXYToWorldXY(-1, -1);
	}
	getWorldSize(): { x: number; y: number } {
		return this.tileXYToWorldXY(this.size.width, this.size.height);
	}
}
