// @ts-check
import { clientEnv, clientSchema } from './schema.mjs';

export const formatErrors = (
	/** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
	errors,
) =>
	Object.entries(errors)
		.map(([name, value]) => {
			if (value && '_errors' in value) return `${name}: ${value._errors.join(', ')}\n`;
		})
		.filter(Boolean);

const run = () => {
	const _clientEnv = clientSchema.safeParse(clientEnv);

	if (!_clientEnv.success) {
		console.error('❌ Invalid environment variables:\n', ...formatErrors(_clientEnv.error.format()));
		throw new Error('Invalid environment variables');
	}

	for (let key of Object.keys(_clientEnv.data)) {
		if (!key.startsWith('NEXT_PUBLIC_')) {
			console.warn(`❌ Invalid public environment variable name: ${key}. It must begin with 'NEXT_PUBLIC_'`);

			throw new Error('Invalid public environment variable name');
		}
	}
	return _clientEnv.data;
};
let _env;
if (!process.env.SKIP_ENV_VALIDATION) {
	_env = run();
}
export const env = _env;
