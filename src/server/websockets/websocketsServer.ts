import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { createWssContext } from '../api/trpc';
import { log } from 'src/utility/logger';
import { websocketsRouter } from '../api/root';

const run = async () => {
	const dotenv = await import('dotenv');
	dotenv.config();

	const PORT = 3111;

	const wss = new ws.Server({
		port: PORT,
	});
	const handler = applyWSSHandler({ wss, router: websocketsRouter, createContext: createWssContext });

	wss.on('connection', (ws) => {
		log.info(`➕➕ Connection (${wss.clients.size})`);
		ws.once('close', () => {
			log.info(`➖➖ Connection (${wss.clients.size})`);
		});
	});
	log.info(`✅ WebSocket Server listening on ws://localhost:${PORT}`);

	process.on('SIGTERM', () => {
		log.info('SIGTERM');
		handler.broadcastReconnectNotification();
		wss.close();
	});
	wss.on('message', (data) => {
		log.info(`WS recieved data: ${JSON.stringify(data)}`);
	});
};

run();
