import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { Building_Type } from '@prisma/client';
import BuildingManager from '../../../game/logic/buildings/BuildingManager';

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
