// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema, serverEnv } from './schema.mjs';
import { env as clientEnv, formatErrors } from './client.mjs';

const run = () => {
	const _serverEnv = serverSchema.safeParse(serverEnv);

	if (!_serverEnv.success) {
		console.error('❌ Invalid environment variables:\n', ...formatErrors(_serverEnv.error.format()));
		throw new Error('Invalid environment variables');
	}

	for (let key of Object.keys(_serverEnv.data)) {
		if (key.startsWith('NEXT_PUBLIC_')) {
			console.warn('❌ You are exposing a server-side env-variable:', key);

			throw new Error('You are exposing a server-side env-variable');
		}
	}

	return { ..._serverEnv.data, ...clientEnv };
};
let _env;
if (!process.env.SKIP_ENV_VALIDATION) {
	_env = run();
} else {
	_env = process.env;
}
export const env = _env;
