import type { Position, Rect } from '../../interfaces/general';

export const ORIGIN_POSITION = { x: 0, y: 0 };

export function isBetween(point: Position, min: Position, max: Position) {
	return point.x >= min.x && point.y >= min.y && point.x <= max.x && point.y <= max.y;
}

export function isRectCollision(rect1: Rect, rect2: Rect) {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.height + rect1.y > rect2.y
	);
}

export function clamp(num: number, max: number, min: number): number {
	return Math.min(Math.max(num, min), max);
}

export function getRandomElementInList<T>(list: Array<T>): T {
	return list[Math.floor(Math.random() * list.length)] as T;
}

export function setDifference<T>(a: Set<T>, b: Set<T>): T[] {
	return [...a].filter((x) => !b.has(x));
}
