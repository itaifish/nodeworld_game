import { Building_Type } from '@prisma/client';
import BaseBuilding from './BaseBuilding';
import { ExtractorBuilding } from './ExtractorBuilding';
import { HarvesterBuilding } from './HarvesterBuilding';

export function buildingTypeToBuilding(
	buildingType: Building_Type,
	...args: ConstructorParameters<typeof HarvesterBuilding>
) {
	switch (buildingType) {
		case Building_Type.HARVESTOR:
			return new HarvesterBuilding(...args);
		case Building_Type.EXTRACTOR:
			return new ExtractorBuilding(...args);
		default:
			return new BaseBuilding(...args);
	}
}
