/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../../trpc';
import type { Base, Building, Resource } from '@prisma/client';
import { Resource_Type } from '@prisma/client';
import { Building_Type } from '@prisma/client';
import BuildingManager from '../../../../game/logic/buildings/BuildingManager';
import type { BaseDetails } from '../../../../game/interfaces/base';
import BaseManager from '../../../../game/logic/base/BaseManager';
import type { AtLeastOne } from '../../../../utility/type-utils.ts/type-utils';
import { WS_EVENT_EMITTER, WS_EVENTS } from '../../events/websocketServerEvents';
import { log } from '../../../../utility/logger';

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
		const returnedResources = { ...BuildingManager.getBuildingData(building).costs };
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
		const resourcesAfter = BaseManager.getModificationToResourceDelta(baseUser.resources, harvest);
		const transactions = await ctx.prisma.$transaction([
			...resourcesAfter.map((resource) =>
				ctx.prisma.resource.update({ where: { id: resource.id }, data: { amount: { increment: resource.amount } } }),
			),
			ctx.prisma.building.update({
				where: { id: input.buildingId },
				data: {
					lastHarvest: lastHarvested,
				},
			}),
		]);

		const newBuilding = transactions[transactions.length - 1] as Building;
		const newResources = transactions.slice(0, -1) as Resource[];

		WS_EVENT_EMITTER.emit(`${WS_EVENTS.UserResourceUpdate}${userId}`, newResources);
		WS_EVENT_EMITTER.emit(`${WS_EVENTS.BuildingUpdate}${userId}`, { ...newBuilding, action: 'updated' });
		return transactions;
	}),

	constructBuilding: protectedProcedure
		.input(
			z.object({
				building: z.enum(Object.keys(Building_Type) as [string, ...string[]]),
				position: z.object({ x: z.number().min(0), y: z.number().min(0) }),
				isRotated: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const userBase: BaseDetails | null = await getBaseDataFromUser(ctx);
			const newBuilding = input.building as Building_Type;
			if (userBase == null) {
				return null;
			}
			const isRotated = input.isRotated ?? false;
			// TODO: Replace with structuredClone when the bug gets solved
			const resourcesCopy: Resource[] = JSON.parse(JSON.stringify(userBase.resources));
			log.info(`creating structured clone of ${JSON.stringify(resourcesCopy)}`);
			const resourcesAfter = BuildingManager.getResourcesAfterPurchase(resourcesCopy, newBuilding);
			if (resourcesAfter == null) {
				WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...userBase });
				return null;
			}
			if (
				!BaseManager.canBuildAtPosition(
					input.position,
					newBuilding,
					userBase.buildings,
					BaseManager.getBaseSize(userBase.level),
					isRotated,
				)
			) {
				WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...userBase });
				return null;
			}

			const finishedAt = BuildingManager.getBuildingFinishedTime(newBuilding, 1);
			let transaction: BaseDetails | null | undefined = null;
			try {
				transaction = await ctx.prisma.$transaction(async (prismaTx) => {
					const costs = BuildingManager.getCostsForPurchase(userBase.resources, newBuilding);
					const resourcesUpdate = await Promise.all(
						costs.map((resource) =>
							prismaTx.resource.update({
								where: { id: resource.id },
								data: { amount: { decrement: resource.amount } },
							}),
						),
					);
					const negativeResources = resourcesUpdate.filter((resource) => resource.amount < 0);
					if (negativeResources.length > 0) {
						throw new Error(
							`${JSON.stringify(
								negativeResources.map((resource) => resource.type),
							)} are negative after this update, cancelling`,
						);
					}
					const baseUpdate = prismaTx.base.update({
						where: { id: userBase.id },
						data: {
							buildings: {
								create: {
									type: newBuilding,
									x: input.position.x,
									y: input.position.y,
									hp: BuildingManager.getBuildingData(newBuilding, 1).maxHP,
									finishedAt,
									isRotated,
								},
							},
						},
						include: baseInclude,
					});

					return baseUpdate;
				});
			} catch (e) {
				log.warn((e as Error)?.message);
			}
			if (transaction) {
				WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...transaction });
			} else {
				WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...userBase });
			}
			return transaction;
		}),
	levelUpBuilding: protectedProcedure.input(BUILDING_ID_INPUT).mutation(async ({ ctx, input }) => {
		const userId = ctx.session.user.id;
		let transaction: Building | null | undefined = null;
		try {
			transaction = await ctx.prisma.$transaction(async (prismaTx) => {
				const userBase: BaseDetails | null = await getBaseDataFromUser({ ...ctx, prisma: prismaTx as any });
				const buildingToLevelUp = userBase?.buildings.find((building) => building.id === input.buildingId);
				if (!userBase || !buildingToLevelUp) {
					throw new Error(`Building ${input.buildingId} doesn't exist`);
				}

				// check if building can be leveled up
				if (!BaseManager.canUpgradeBuilding(buildingToLevelUp, userBase)) {
					throw new Error(`Can't level up building ${buildingToLevelUp.id}[${buildingToLevelUp.type}]`);
				}

				const costs = BuildingManager.getCostsForPurchase(
					userBase.resources,
					buildingToLevelUp.type,
					buildingToLevelUp.level + 1,
				);
				const resourcesUpdate = await Promise.all(
					costs.map((resource) =>
						prismaTx.resource.update({
							where: { id: resource.id },
							data: { amount: { decrement: resource.amount } },
						}),
					),
				);
				const negativeResources = resourcesUpdate.filter((resource) => resource.amount < 0);
				if (negativeResources.length > 0) {
					throw new Error(
						`${JSON.stringify(negativeResources.map((resource) => resource.type))} ${
							negativeResources.length > 0 ? 'are' : 'is'
						} negative after this update, cancelling`,
					);
				}
				const finishedAt = BuildingManager.getBuildingFinishedTime(buildingToLevelUp.type, buildingToLevelUp.level + 1);
				const newMaxHP = BuildingManager.getBuildingData(buildingToLevelUp.type, buildingToLevelUp.level + 1).maxHP;
				const buildingUpdate = prismaTx.building.update({
					where: { id: buildingToLevelUp.id },
					data: { level: { increment: 1 }, finishedAt, hp: newMaxHP, lastHarvest: new Date() },
				});
				return buildingUpdate;
			});
		} catch (e) {
			log.warn((e as Error)?.message);
		}

		if (transaction) {
			WS_EVENT_EMITTER.emit(`${WS_EVENTS.BuildingUpdate}${userId}`, {
				action: 'updated',
				...{
					id: transaction.id,
					level: transaction.level,
					finishedAt: transaction.finishedAt,
					hp: transaction.hp,
					lastHarvest: transaction.lastHarvest,
				},
			});
		}
		return transaction;
	}),
	// Data getters
	getBaseData: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const data = await getBaseDataFromUser(ctx);
		if (data != null) {
			WS_EVENT_EMITTER.emit(`${WS_EVENTS.BaseUpdate}${userId}`, { action: 'created', ...data });
		}
		return data;
	}),
});
