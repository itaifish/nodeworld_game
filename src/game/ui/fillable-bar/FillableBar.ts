import Phaser from 'phaser';
import type { Rect } from 'src/game/interfaces/general';

export default class FillableBar {
	private readonly graphicsBar;
	private readonly positionAndSize: Rect;
	private readonly color: number;
	private readonly borderSize: number;
	private percentFilled: number;

	constructor(scene: Phaser.Scene, positionAndSize: Rect, percentFilled: number, color: number, borderSize = 2) {
		this.graphicsBar = new Phaser.GameObjects.Graphics(scene);
		this.positionAndSize = positionAndSize;
		this.color = color;
		this.borderSize = borderSize;
		this.percentFilled = percentFilled;
		scene.add.existing(this.graphicsBar);
		this.render();
	}

	updatePercentFilled(percent: number) {
		this.percentFilled = percent;
		this.render();
	}

	destroy() {
		this.graphicsBar.destroy();
	}

	private render() {
		this.graphicsBar.clear();

		//  BG
		this.graphicsBar.fillStyle(0x000000);
		this.graphicsBar.fillRect(
			this.positionAndSize.x,
			this.positionAndSize.y,
			this.positionAndSize.width,
			this.positionAndSize.height,
		);

		// FG
		this.graphicsBar.fillStyle(0xffffff);
		this.graphicsBar.fillRect(
			this.positionAndSize.x + this.borderSize,
			this.positionAndSize.y + this.borderSize,
			this.positionAndSize.width - this.borderSize * 2,
			this.positionAndSize.height - this.borderSize * 2,
		);

		// Progress Bar
		this.graphicsBar.fillStyle(this.color);
		const fillWidth = (this.percentFilled / 100) * (this.positionAndSize.width - this.borderSize * 2);
		this.graphicsBar.fillRect(
			this.positionAndSize.x + this.borderSize,
			this.positionAndSize.y + this.borderSize,
			fillWidth,
			this.positionAndSize.height - this.borderSize * 2,
		);
	}
}
