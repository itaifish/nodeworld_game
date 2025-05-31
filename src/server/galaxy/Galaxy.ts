import type { Hex } from 'honeycomb-grid';
import { defineHex, Grid, rectangle, spiral } from 'honeycomb-grid';
import type { Node } from '@prisma/client';
import { ResourceAvailability, WorldTerrain } from '@prisma/client';
import { gaussianRandomInRange, randomIntBetween } from '../../game/logic/general/math';
import { log } from '../../utility/logger';
type HexNode = Omit<Node, 'galaxyId' | 'guildId' | 'baseId' | 'takenOverAt' | 'underAttackById'>;

const validTerrains = Object.values(WorldTerrain);
const validResourceAvailabilities = Object.values(ResourceAvailability);

export class Galaxy {
	private size: {
		width: number;
		height: number;
	};
	private grid: Grid<Hex>;
	private nodes: Map<Hex, HexNode>;

	constructor(width: number, height: number) {
		this.size = { width, height };
		this.grid = new Grid(defineHex(), rectangle(this.size));
		this.nodes = new Map();
		const spiralTraverser = spiral({ start: { q: 0, r: 0 }, radius: width + height });

		for (const hex of this.grid.traverse(spiralTraverser)) {
			if (this.nodes.has(hex)) {
				log.warn(`Something went wrong ${hex.q} , ${hex.r}`);
				continue;
			}
			const neighborsTerrains = this.grid
				.traverse(spiral({ start: { q: hex.q, r: hex.r }, radius: 1 }))
				.reduce<WorldTerrain[]>((acc, curr) => [...acc, ...(this.nodes.get(curr)?.terrain ?? [])], []);
			this.nodes.set(hex, Galaxy.CreateNode(hex.q, hex.r, neighborsTerrains));
		}
	}

	public getNodes() {
		return [...this.nodes.values()];
	}
	/**
	 * See https://www.redblobgames.com/grids/hexagons/ for explanation of axial coords
	 * @param q Axial Q coordinate
	 * @param r Axial R coordinate
	 * @param terrainTypes Terrain for the surrounding nodes
	 */
	private static CreateNode(q: number, r: number, terrainTypes: WorldTerrain[]): HexNode {
		let terrainsToPickFrom = [...validTerrains, ...terrainTypes];
		const terrainsChosen: WorldTerrain[] = [];
		const numberOfPossibleTerrains = Math.round(gaussianRandomInRange(1.6, 1.1, validTerrains.length - 0.01, 1));
		for (let i = 0; i < numberOfPossibleTerrains; i++) {
			const terrainToAdd = terrainsToPickFrom[randomIntBetween(0, terrainsToPickFrom.length - 1)] as WorldTerrain;
			terrainsChosen.push(terrainToAdd);
			terrainsToPickFrom = terrainsToPickFrom.filter((x) => x != terrainToAdd);
		}
		const resourceRichness =
			validResourceAvailabilities[
				Math.trunc(gaussianRandomInRange(2, 1, validResourceAvailabilities.length + 0.99, -0.99))
			] ?? ResourceAvailability.STANDARD;

		return {
			q,
			r,
			terrain: terrainsChosen,
			resourceAvailability: resourceRichness,
			level: 1,
		};
	}
}
