import type Phaser from 'phaser';
import type { Position } from 'src/game/interfaces/general';
import { TEXTURE_KEYS } from 'src/game/manager/TextureKeyManager';
import Button from './Button';

export default class CloseButton extends Button {
	constructor(scene: Phaser.Scene, position: Position, onClick: () => void) {
		super(scene, position, onClick, ' ', 'square');
		scene.add.image(position.x, position.y, TEXTURE_KEYS.XCloseIcon);
	}
}
