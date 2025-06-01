import { Galaxy } from '../../../src/server/galaxy/Galaxy';

describe('Test that nodes created are valid for Galaxies', () => {
	const galaxy = new Galaxy(50, 50);
	it('Should create nodes that all have some terrain', () => {
		expect(galaxy.getNodes().every((node) => node.terrain.length > 0)).toBe(true);
	});
	it('Should create nodes that all have a resource availability', () => {
		expect(galaxy.getNodes().every((node) => node.resourceAvailability != null)).toBe(true);
	});
	it('Should create nodes that all have a unique position', () => {
		const positions = new Map<number, Set<number>>();
		const nodes = galaxy.getNodes();
		for (const node of nodes) {
			if (!positions.has(node.q)) {
				positions.set(node.q, new Set());
			}
			const qSet = positions.get(node.q)!;
			expect(qSet.has(node.r)).toBe(false);
			qSet.add(node.r);
		}
	});
});
