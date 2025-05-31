import type { Position, Rect } from '../../interfaces/general';

export const ORIGIN_POSITION = { x: 0, y: 0 } as const;

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

export function getDifferenceBetweenSets<T>(a: Set<T>, b: Set<T>): T[] {
	return [...a].filter((x) => !b.has(x));
}
/**
 * Standard Normal variate using Box-Muller transform. Copied from
 * https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
 * @param mean
 * @param stdev
 * @returns
 */
export function gaussianRandom(mean = 0, stdev = 1) {
	const u = 1 - Math.random(); // Converting [0,1) to (0,1]
	const v = Math.random();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	// Transform to the desired mean and standard deviation:
	return z * stdev + mean;
}

export function gaussianRandomInRange(mean = 0, stdev = 1, max: number, min: number) {
	let res;
	do {
		res = gaussianRandom(mean, stdev);
	} while (res < min && res > max);
	return res;
}

export function randomIntBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
