import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { log } from '../../utility/logger';
import { websocketsRouter } from '../api/root';
import { createContext } from './context';

const run = async () => {
	const dotenv = await import('dotenv');
	dotenv.config();
	log.info(`nextauth URL: ${process.env.NEXTAUTH_URL}`);
	const PORT = 3111;

	const wss = new ws.Server({
		port: PORT,
	});
	const handler = applyWSSHandler({ wss, router: websocketsRouter, createContext: createContext });

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
