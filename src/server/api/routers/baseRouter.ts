/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { Resource_Type } from '@prisma/client';
import { Building_Type } from '@prisma/client';
import BuildingManager from '../../../game/logic/buildings/BuildingManager';
import type { BaseDetails } from '../../../game/interfaces/base';
import BaseManager from '../../../game/logic/base/BaseManager';

type tRPCContext = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]['ctx'];

const baseInclude = { buildings: true, owner: false, resources: true, military: true, inventory: true };

const BUILDING_ID_INPUT = z.object({ buildingId: z.string() });

const RESOURCES_INPUT = z.record(
	z.enum(Object.keys(Resource_Type) as [Resource_Type, ...Resource_Type[]]),
	z.number().int(),
);

async function getBaseDataFromUser(ctx: tRPCContext) {
	const id = ctx.session.user.id;
	return ctx.prisma.base.findUnique({
		where: { userId: id },
		include: baseInclude,
	});
}

export const baseRouter = createTRPCRouter({
	giveUserResources: adminProcedure
		.input(
			z.object({
				userId: z.string().optional(),
				resources: RESOURCES_INPUT,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = input.userId ?? ctx.session.user.id;
			const currentResources = await ctx.prisma.base.findUnique({
				where: { userId },
				include: baseInclude,
			});
			if (currentResources == null) {
				return null;
			}
			BaseManager.modifyResources(currentResources.resources, input.resources);
			return ctx.prisma.base.update({
				where: { id: currentResources.id },
				data: { resources: { set: currentResources.resources } },
			});
		}),

	createBaseIfNotExists: protectedProcedure.mutation(async ({ ctx }) => {
		const id = ctx.session.user.id;
		return ctx.prisma.base.upsert({
			where: { userId: id },
			create: { userId: id, resources: { createMany: { data: BaseManager.STARTING_RESOURCES } } },
			update: {},
			include: baseInclude,
		});
	}),

	deleteBase: protectedProcedure.mutation(async ({ ctx }) => {
		const baseUser: BaseDetails | null = await getBaseDataFromUser(ctx);
		if (baseUser == null) {
			return null;
		}
		return ctx.prisma.base.delete({ where: { id: baseUser.id } });
	}),

	scrapBuilding: protectedProcedure.input(BUILDING_ID_INPUT).mutation(async ({ ctx, input }) => {
		const baseUser: BaseDetails | null = await getBaseDataFromUser(ctx);
		const building = baseUser?.buildings.find((building) => building.id == input.buildingId);
		if (baseUser == null || building == null) {
			return null;
		}
		await ctx.prisma.building.delete({ where: { id: input.buildingId } });
		const now = new Date().getTime();
		const returnedResources = { ...BuildingManager.BUILDING_DATA[building.type].costs };
		if (building.finishedAt.getTime() >= now) {
			for (const key in returnedResources) {
				returnedResources[key as Resource_Type] = Math.floor(returnedResources[key as Resource_Type]! / 2);
			}
		}
		BaseManager.modifyResources(baseUser.resources, returnedResources);
		const update = await ctx.prisma.base.update({
			where: { id: baseUser.id },
			data: { resources: { set: baseUser.resources } },
			include: baseInclude,
		});
		return update;
	}),

	harvestAllBuildings: protectedProcedure.mutation(async ({ ctx }) => {
		const baseUser = await getBaseDataFromUser(ctx);
		if (baseUser == null) {
			return;
		}
		baseUser.buildings.forEach((building) => {
			const res = BuildingManager.getHarvestAmountAndTimeForBuilding(building);
			if (res == null) {
				return;
			}
			const { harvest, lastHarvested } = res;
			building.lastHarvest = lastHarvested;
			BaseManager.modifyResources(baseUser.resources, harvest);
		});
		const update = await ctx.prisma.base.update({
			where: { id: baseUser.id },
			data: {
				resources: { set: baseUser.resources },
				buildings: { set: baseUser.buildings },
			},
			include: baseInclude,
		});
		return update;
	}),

	harvestBuilding: protectedProcedure.input(BUILDING_ID_INPUT).mutation(async ({ ctx, input }) => {
		const baseUser: BaseDetails | null = await getBaseDataFromUser(ctx);
		const building = baseUser?.buildings.find((building) => building.id == input.buildingId);
		if (baseUser == null || building == null) {
			return null;
		}
		const res = BuildingManager.getHarvestAmountAndTimeForBuilding(building);
		if (res == null) {
			return null;
		}
		const { harvest, lastHarvested } = res;
		BaseManager.modifyResources(baseUser.resources, harvest);
		const update = await ctx.prisma.building.update({
			where: { id: input.buildingId },
			data: {
				lastHarvest: lastHarvested,
				Base: {
					update: {
						resources: {
							set: baseUser.resources,
						},
					},
				},
			},
			include: { Base: true },
		});
		return update;
	}),

	constructBuilding: protectedProcedure
		.input(
			z.object({
				building: z.enum(Object.keys(Building_Type) as [string, ...string[]]),
				position: z.object({ x: z.number().min(0), y: z.number().min(0) }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userBase: BaseDetails | null = await getBaseDataFromUser(ctx);
			const newBuilding = input.building as Building_Type;
			if (userBase == null) {
				return null;
			}
			const resourcesAfter = BuildingManager.getResourcesAfterPurchase(userBase.resources, newBuilding);
			if (resourcesAfter == null) {
				return null;
			}
			if (
				!BaseManager.canBuildAtPosition(
					input.position,
					newBuilding,
					userBase.buildings,
					BaseManager.getBaseSize(userBase.level),
				)
			) {
				return null;
			}

			const now = new Date();
			const finishedAt = new Date(now.getTime() + BuildingManager.BUILDING_DATA[newBuilding].buildTimeSeconds * 1_000);
			// TODO: Verify this works as intended, could create a memory leak in DB
			const baseAfter = await ctx.prisma.base.update({
				where: { id: userBase.id },
				data: {
					resources: { set: resourcesAfter },
					buildings: {
						create: {
							type: newBuilding,
							x: input.position.x,
							y: input.position.y,
							hp: BuildingManager.BUILDING_DATA[newBuilding].maxHP,
							finishedAt,
						},
					},
				},
				include: baseInclude,
			});
			return baseAfter;
		}),

	getBaseData: protectedProcedure.query(async ({ ctx }) => {
		return getBaseDataFromUser(ctx);
	}),
});
