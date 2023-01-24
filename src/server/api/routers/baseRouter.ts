import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { Building_Type } from '@prisma/client';

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
		.input(z.object({ building: z.enum(Object.keys(Building_Type) as [string, ...string[]]) }))
		.mutation(async ({ ctx, input }) => {
			// input.building
		}),
	getBaseData: protectedProcedure.query(async ({ ctx }) => {
		const id = ctx.session.user.id;
		return ctx.prisma.base.findUnique({
			where: { userId: id },
			include: { buildings: true, owner: false, resources: true, military: true, inventory: true },
		});
	}),
});
