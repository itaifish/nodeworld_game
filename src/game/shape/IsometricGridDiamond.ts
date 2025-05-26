import { cellSize } from '../scene/MainScene';

export default class IsometricGridDiamond extends Phaser.Geom.Polygon {
	constructor(x: number, y: number, width: number, height: number) {
		const dimensions = [
			{ x: x, y: y },
			{ x: x - (cellSize.width * height) / 2, y: y + (cellSize.height * height) / 2 },
			{ x: x, y: y + height * cellSize.height + 1 },
			{ x: x + (cellSize.width * width) / 2, y: y + (cellSize.height * width) / 2 },
			{ x: x, y: y },
		];
		super(dimensions);
	}
}
