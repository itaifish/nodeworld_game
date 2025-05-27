import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import BaseManager from 'src/game/logic/base/BaseManager';
import { update } from 'cypress/types/lodash';
import type { Prisma } from '@prisma/client';

export const galaxyRouter = createTRPCRouter({
	listAvailableGalaxies: protectedProcedure
		.input(z.object({ cursor: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const cursorObj = input.cursor != undefined ? { cursor: { id: input.cursor } } : undefined;
			return ctx.prisma.galaxy.findMany({ take: 10, orderBy: { id: 'desc' }, ...cursorObj });
		}),
	userJoinGalaxy: protectedProcedure.input(z.object({ galaxyId: z.string() })).mutation(async ({ ctx, input }) => {
		const userId = ctx.session.user.id;
		const { galaxyId } = input;
		const userLinkObject: Prisma.UserCreateNestedOneWithoutUserGalaxyInfoInput = { connect: { id: userId } };
		return ctx.prisma.$transaction([
			// create userGalaxyInfo if not exists
			ctx.prisma.userGalaxyInfo.upsert({
				where: { userId_galaxyId: { userId, galaxyId } },
				create: {
					userId,
					galaxyId,
					base: { create: { resources: { createMany: { data: BaseManager.STARTING_RESOURCES } } } },
					user: userLinkObject as any, // not sure if this works
				},
				update: {},
			}),
			// update user to join the galaxy
			ctx.prisma.user.update({
				where: { id: userId },
				data: { currentGalaxy: { connect: { id: galaxyId } } },
			}),
		]);
	}),
});
