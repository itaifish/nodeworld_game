import Phaser from 'phaser';
import type { Position } from 'src/game/interfaces/general';
import { log } from 'src/utility/logger';

export default class Button {
	scene: Phaser.Scene;
	buttonImage: Phaser.GameObjects.Image;

	constructor(scene: Phaser.Scene, position: Position, onClick: () => void) {
		this.scene = scene;
		this.buttonImage = scene.add.image(position.x, position.y, 'NormalButton');
		this.buttonImage.setInteractive();

		this.buttonImage.on(Phaser.Input.Events.POINTER_OVER, () => {
			this.buttonImage.setTexture('HoverButton');
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_OUT, () => {
			this.buttonImage.setTexture('NormalButton');
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => {
			this.buttonImage.setTexture('NormalButton');
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_UP, (_pointer: Phaser.Input.Pointer) => {
			this.buttonImage.setTexture('NormalButton');
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_DOWN, () => {
			this.buttonImage.setTexture('PressedButton');
			onClick();
		});
	}
}
