import NextAuth, { type NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
// import GoogleProvider from 'next-auth/providers/google';
// import RedditProvider from 'next-auth/providers/reddit';
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { env } from '../../../env/server.mjs';
import { prisma } from '../../../server/db';

export const authOptions: NextAuthOptions = {
	// Include user.id on session
	callbacks: {
		session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}
			return session;
		},
	},
	// Configure one or more authentication providers
	adapter: PrismaAdapter(prisma),
	providers: [
		DiscordProvider({
			clientId: env.DISCORD_CLIENT_ID ?? '',
			clientSecret: env.DISCORD_CLIENT_SECRET ?? '',
		}),
		// TODO: Integrate these clients
		// GoogleProvider({
		// 	clientId: process.env.GOOGLE_CLIENT_ID as string,
		// 	clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		// 	authorization: {
		// 		params: {
		// 			prompt: 'consent',
		// 			access_type: 'offline',
		// 			response_type: 'code',
		// 		},
		// 	},
		// }),
		// RedditProvider({
		// 	clientId: process.env.REDDIT_CLIENT_ID,
		// 	clientSecret: process.env.REDDIT_CLIENT_SECRET,
		// 	authorization: {
		// 		params: {
		// 			duration: 'permanent',
		// 		},
		// 	},
		// }),
		/**
		 * ...add more providers here
		 *
		 * Most other providers require a bit more work than the Discord provider.
		 * For example, the GitHub provider requires you to add the
		 * `refresh_token_expires_in` field to the Account model. Refer to the
		 * NextAuth.js docs for the provider you want to use. Example:
		 * @see https://next-auth.js.org/providers/github
		 */
	],
};

export default NextAuth(authOptions);
