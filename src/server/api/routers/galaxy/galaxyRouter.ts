import { z } from 'zod';
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../trpc';
import BaseManager from '../../../../game/logic/base/BaseManager';
import { Galaxy } from '../../../galaxy/Galaxy';

export const galaxyRouter = createTRPCRouter({
	listAvailableGalaxiesAndUserCurrentGalaxy: protectedProcedure
		.input(z.object({ cursor: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const cursorObj = input.cursor != undefined ? { cursor: { id: input.cursor } } : undefined;
			const existingGalaxiesTask = ctx.prisma.galaxy.findMany({
				include: { linkedUsers: true },
				take: 10,
				orderBy: { id: 'desc' },
				...cursorObj,
			});
			const currentUserInfoTask = ctx.prisma.user.findUnique({
				where: { id: userId },
				include: { currentGalaxy: true },
			});
			const existingGalaxies = await existingGalaxiesTask;
			const currentUserInfo = await currentUserInfoTask;
			return {
				galaxies: existingGalaxies,
				userCurrentGalaxy: currentUserInfo?.currentGalaxy ?? null,
			};
		}),
	userJoinGalaxy: protectedProcedure.input(z.object({ galaxyId: z.string() })).mutation(async ({ ctx, input }) => {
		const userId = ctx.session.user.id;
		const { galaxyId } = input;
		return ctx.prisma.$transaction([
			// create userGalaxyInfo if not exists
			ctx.prisma.userGalaxyInfo.upsert({
				where: { userId_galaxyId: { userId, galaxyId } },
				create: {
					userId,
					galaxyId,
					base: { create: { resources: { createMany: { data: BaseManager.STARTING_RESOURCES } } } },
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
	createNewGalaxy: adminProcedure
		.input(
			z.object({
				galaxyName: z.string().min(2).max(15),
				size: z.object({ width: z.number().min(5), height: z.number().min(5) }),
				maxPlayers: z.number().min(2),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const newGalaxy = new Galaxy(input.size.width, input.size.height);
			return ctx.prisma.galaxy.create({
				data: {
					name: input.galaxyName,
					maxSize: input.maxPlayers,
					nodes: {
						createMany: {
							data: newGalaxy.getNodes(),
						},
					},
				},
			});
		}),
});
