import Phaser from 'phaser';
import type { Position } from 'src/game/interfaces/general';
import { TEXTURE_KEYS } from 'src/game/manager/TextureKeyManager';
import { log } from 'src/utility/logger';

type ButtonType = 'rectangle' | 'square';
type ButtonAction = 'pressed' | 'normal' | 'hover';

export default class Button {
	scene: Phaser.Scene;
	buttonImage: Phaser.GameObjects.Image;
	buttonType: ButtonType;
	private buttonText: Phaser.GameObjects.Text;
	private isHidden = false;
	static readonly buttonTextures: Record<ButtonType, Record<ButtonAction, string>> = {
		square: {
			normal: TEXTURE_KEYS.SquareNormalButton,
			pressed: TEXTURE_KEYS.SquarePressedButton,
			hover: TEXTURE_KEYS.SquareHoverButton,
		},
		rectangle: {
			normal: TEXTURE_KEYS.NormalButton,
			pressed: TEXTURE_KEYS.PressedButton,
			hover: TEXTURE_KEYS.HoverButton,
		},
	};

	constructor(
		scene: Phaser.Scene,
		position: Position,
		onClick: () => void,
		buttonName: string,
		type: ButtonType = 'rectangle',
	) {
		this.isHidden = false;
		this.buttonType = type;
		this.scene = scene;
		this.buttonImage = scene.add.image(position.x, position.y, Button.buttonTextures[this.buttonType].normal);
		const text = scene.add.text(position.x, position.y, buttonName);
		text.setFont('Consolas');
		text.setFontSize(17);
		text.setStyle({
			color: 'white',
		});
		text.setShadow(1, 1);

		text.setOrigin(0.5, 0.5);
		this.buttonText = text;
		this.buttonImage.setInteractive();

		this.buttonImage.on(Phaser.Input.Events.POINTER_OVER, () => {
			this.buttonImage.setTexture(Button.buttonTextures[this.buttonType].hover);
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_OUT, () => {
			this.buttonImage.setTexture(Button.buttonTextures[this.buttonType].normal);
			text.setShadow(1, 1);
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => {
			this.buttonImage.setTexture(Button.buttonTextures[this.buttonType].normal);
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_UP, (_pointer: Phaser.Input.Pointer) => {
			this.buttonImage.setTexture(Button.buttonTextures[this.buttonType].normal);
			text.setShadow(1, 1);
		});
		this.buttonImage.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
			if (!this.isHidden && pointer.leftButtonDown()) {
				this.buttonImage.setTexture(Button.buttonTextures[this.buttonType].pressed);
				text.setShadow(1, 0);
				onClick();
			}
		});
	}

	setPosition(position: Position) {
		this.buttonImage.setPosition(position.x, position.y);
		this.buttonText.setPosition(position.x, position.y);
	}

	hide() {
		this.isHidden = true;
		this.buttonImage.setAlpha(0);
		this.buttonText.setAlpha(0);
	}

	show() {
		this.isHidden = false;
		this.buttonImage.setAlpha(1);
		this.buttonText.setAlpha(1);
	}
}
