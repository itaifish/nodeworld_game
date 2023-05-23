/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../../trpc';
import { Resource_Type } from '@prisma/client';
import { Building_Type } from '@prisma/client';
import BuildingManager from '../../../../game/logic/buildings/BuildingManager';
import type { BaseDetails } from '../../../../game/interfaces/base';
import BaseManager from '../../../../game/logic/base/BaseManager';
import type { AtLeastOne } from '../../../../utility/type-utils.ts/type-utils';
import { WS_EVENT_EMITTER, WS_EVENTS } from '../../events/websocketServerEvents';

type tRPCContext = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]['ctx'];

const baseInclude = { buildings: true, owner: false, resources: true, military: true, inventory: true };

const BUILDING_ID_INPUT = z.object({ buildingId: z.string() });

const RESOURCES_INPUT = z.record(z.enum(Object.keys(Resource_Type) as AtLeastOne<Resource_Type>), z.number().int());

async function getBaseDataFromUser(ctx: tRPCContext) {
	const id = ctx.session.user.id;
	return ctx.prisma.base.findUnique({
		where: { userId: id },
		include: baseInclude,
	});
}

export const baseRouter = createTRPCRouter({
	// User Resources
	onUserResourcesChanged: protectedProcedure.subscription(({ ctx }) => {
		const id = ctx.session.user.id;
		return WS_EVENT_EMITTER.getObservable(`${WS_EVENTS.UserResourceUpdate}${id}`);
	}),
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
			const update = await ctx.prisma.base.update({
				where: { id: currentResources.id },
				data: { resources: { set: currentResources.resources } },
			});
			WS_EVENT_EMITTER.emit(`${WS_EVENTS.UserResourceUpdate}${userId}`, currentResources.resources);
			return update;
		}),
	// End User Resources
	// Base
	onBaseUpdated: protectedProcedure.subscription(({ ctx }) => {
		const id = ctx.session.user.id;
		return WS_EVENT_EMITTER.getObservable(`${WS_EVENTS.BaseUpdate}${id}`);
	}),
	createBaseIfNotExists: protectedProcedure.mutation(async ({ ctx }) => {
		const id = ctx.session.user.id;
		const upsert = await ctx.prisma.base.upsert({
			where: { userId: id },
			create: { userId: id, resources: { createMany: { data: BaseManager.STARTING_RESOURCES } } },
			update: {},
			include: baseInclude,
		});
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${id}`, { ...upsert, action: 'created' });
	}),

	deleteBase: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const baseUser: BaseDetails | null = await getBaseDataFromUser(ctx);
		if (baseUser == null) {
			return null;
		}
		// TODO add cascading deletes
		const deletedBase = await ctx.prisma.base.delete({ where: { id: baseUser.id } });
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { ...deletedBase, action: 'destroyed' });
	}),
	// End Base
	// Buildings
	onBuildingUpdated: protectedProcedure.subscription(({ ctx }) => {
		const id = ctx.session.user.id;
		return WS_EVENT_EMITTER.getObservable(`${WS_EVENTS.BuildingUpdate}${id}`);
	}),
	scrapBuilding: protectedProcedure.input(BUILDING_ID_INPUT).mutation(async ({ ctx, input }) => {
		const baseUser: BaseDetails | null = await getBaseDataFromUser(ctx);
		const userId = ctx.session.user.id;
		const building = baseUser?.buildings.find((building) => building.id == input.buildingId);
		if (baseUser == null || building == null) {
			return null;
		}
		const deletedBuilding = await ctx.prisma.building.delete({ where: { id: input.buildingId } });
		const now = new Date().getTime();
		const returnedResources = { ...BuildingManager.BUILDING_DATA[building.type].costs };
		if (building.finishedAt.getTime() >= now) {
			for (const key in returnedResources) {
				returnedResources[key as Resource_Type] = Math.floor(returnedResources[key as Resource_Type]! / 2);
			}
		}
		const newResources = BaseManager.modifyResources(baseUser.resources, returnedResources);
		const update = await ctx.prisma.base.update({
			where: { id: baseUser.id },
			data: { resources: { set: baseUser.resources } },
			include: baseInclude,
		});
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BuildingUpdate}${userId}`, {
			action: 'destroyed',
			id: deletedBuilding?.id,
		});
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.UserResourceUpdate}${userId}`, [...newResources]);
		return update;
	}),

	harvestAllBuildings: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;
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
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'updated', ...update });
		return update;
	}),

	harvestBuilding: protectedProcedure.input(BUILDING_ID_INPUT).mutation(async ({ ctx, input }) => {
		const userId = ctx.session.user.id;
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
		const updated = await ctx.prisma.building.update({
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
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { ...updated, action: 'updated' });
		return updated;
	}),

	constructBuilding: protectedProcedure
		.input(
			z.object({
				building: z.enum(Object.keys(Building_Type) as [string, ...string[]]),
				position: z.object({ x: z.number().min(0), y: z.number().min(0) }),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
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

			const finishedAt = BuildingManager.getBuildingFinishedTime(newBuilding);

			const _resourceUpdate = await ctx.prisma.$transaction(
				resourcesAfter.map((resource) =>
					ctx.prisma.resource.update({ where: { id: resource.id }, data: { amount: resource.amount } }),
				),
			);
			const baseAfter = await ctx.prisma.base.update({
				where: { id: userBase.id },
				data: {
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
			WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'updated', ...baseAfter });
			return baseAfter;
		}),

	getBaseData: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const data = await getBaseDataFromUser(ctx);
		if (data != null) {
			WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...data });
		}
		return data;
	}),
});
