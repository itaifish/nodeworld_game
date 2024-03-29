/**
 * This is the client-side entrypoint for your tRPC API.
 * It's used to create the `api` object which contains the Next.js App-wrapper
 * as well as your typesafe react-query hooks.
 *
 * We also create a few inference helpers for input and output types
 */
import { createWSClient, httpBatchLink, wsLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';
import { type WebsocketsRouter } from '../server/api/root';
import type { NextPageContext } from 'next';
import { clientEnv } from '../env/schema.mjs';

function getEndingLink(ctx: NextPageContext | undefined) {
	if (typeof window === 'undefined') {
		return httpBatchLink({
			url: `http://${clientEnv.NEXT_PUBLIC_TRPC_BASEURL}/api/trpc`,
			headers() {
				if (!ctx?.req?.headers) {
					return {};
				}
				// on ssr, forward client's headers to the server
				return {
					...ctx.req.headers,
					'x-ssr': '1',
				};
			},
		});
	}
	const client = createWSClient({
		url: `${clientEnv.NEXT_PUBLIC_TRPC_WS_BASEURL ?? 'ws://localhost:3000'}`,
	});
	return wsLink<WebsocketsRouter>({
		client,
	});
}

/**
 * A set of typesafe react-query hooks for your tRPC API
 */
export const api = createTRPCNext<WebsocketsRouter>({
	config({ ctx }) {
		return {
			/**
			 * Transformer used for data de-serialization from the server
			 * @see https://trpc.io/docs/data-transformers
			 **/
			transformer: superjson,

			/**
			 * Links used to determine request flow from client to server
			 * @see https://trpc.io/docs/links
			 * */
			links: [getEndingLink(ctx)],
		};
	},
	/**
	 * Whether tRPC should await queries when server rendering pages
	 * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
	 */
	ssr: false,
});

/**
 * Inference helper for inputs
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<WebsocketsRouter>;
/**
 * Inference helper for outputs
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<WebsocketsRouter>;
