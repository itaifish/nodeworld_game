import { log } from '../../utility/logger';
import GoldSpaceBackground from '../resources/images/backgrounds/GoldSpaceBackground.png';

export default class BackgroundScene extends Phaser.Scene {
	preload() {
		this.load.image('background', GoldSpaceBackground.src);
	}

	create() {
		const { centerX, centerY } = this.cameras.main;
		const { width, height } = this.sys.game.canvas;
		const background = this.add.image(centerX, centerY, 'background');
		const bestScale = Math.max(width / background.width, height / background.height);
		background.setScale(bestScale);
		background.setPosition((background.width / 2) * bestScale, (bestScale * background.height) / 2, -100);
		// this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
		// 	log.info(pointer.worldX, pointer.worldY);
		// });
	}
}
