/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { Building_Type } from '@prisma/client';
import BuildingManager from '../../../game/logic/buildings/BuildingManager';
import { Constants } from '../../../utils/constants';
import type { BaseDetails } from '../../../game/interfaces/base';
import BaseManager from '../../../game/logic/base/BaseManager';

type tRPCContext = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]['ctx'];

const baseInclude = { buildings: true, owner: false, resources: true, military: true, inventory: true };

async function getBaseDataFromUser(ctx: tRPCContext) {
	const id = ctx.session.user.id;
	return ctx.prisma.base.findUnique({
		where: { userId: id },
		include: baseInclude,
	});
}

export const baseRouter = createTRPCRouter({
	hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
		return {
			greeting: `Hello ${input.text}`,
		};
	}),
	createBaseIfNotExists: protectedProcedure.mutation(async ({ ctx }) => {
		const id = ctx.session.user.id;
		return ctx.prisma.base.create({ data: { userId: id } });
	}),

	//scrapBuilding: protectedProcedure.input

	harvestAllBuildings: protectedProcedure.mutation(async ({ ctx, input }) => {
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

	harvestBuilding: protectedProcedure.input(z.object({ buildingId: z.string() })).mutation(async ({ ctx, input }) => {
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
			const userBase = await getBaseDataFromUser(ctx);
			const newBuilding = input.building as Building_Type;
			if (userBase == null) {
				return null;
			}
			const resourcesAfter = BuildingManager.getResourcesAfterPurchase(userBase.resources, newBuilding);
			if (resourcesAfter == null) {
				return null;
			}
			const now = new Date();
			const finishedAt = new Date(now.getTime() + BuildingManager.buildTimeSeconds[newBuilding] * 1_000);
			// TODO: Verify this works as intended, could create a memory leak in DB
			// TODO Collision Detection
			const baseAfter = await ctx.prisma.base.update({
				where: { id: userBase.id },
				data: {
					resources: { set: resourcesAfter },
					buildings: {
						create: {
							type: newBuilding,
							x: input.position.x,
							y: input.position.y,
							hp: BuildingManager.maxHP[newBuilding],
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
