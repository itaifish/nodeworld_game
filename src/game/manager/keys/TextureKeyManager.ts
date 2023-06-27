import type { ValuesOf } from 'src/utility/type-utils.ts/type-utils';

export const TEXTURE_KEYS = {
	// UI
	NormalButton: 'NormalButton',
	HoverButton: 'HoverButton',
	PressedButton: 'PressedButton',
	SquareNormalButton: 'SquareNormalButton',
	SquareHoverButton: 'SquareHoverButton',
	SquarePressedButton: 'SquarePressedButton',
	XCloseIcon: 'XCloseIcon',
	// Backgrounds:
	BrickTileBg: 'BrickTileBg',
	// Buildings:
	CapitalBuilding: 'CapitalBuilding',
	Dwelling: 'Dwelling',
	Extractor: 'Extractor',
	Harvestor: 'Harvestor',
	PowerStation: 'PowerStation',
	Barracks: 'Barracks',
	AntiAircraftTurret: 'AntiAircraftTurret',
	ScattergunTurret: 'ScattergunTurret',
	EnergyShieldWall: 'EnergyShieldWall',
	ResearchLab: 'ResearchLab',
	// colors:
	Tile: 'Tile',
	GreenTile: 'GreenTile',
	RedTile: 'RedTile',
} as const;

export type TextureKey = ValuesOf<typeof TEXTURE_KEYS>;
