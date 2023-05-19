import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { baseWebsocketsRouter } from '../api/routers/websocketsRouter';
import { createWssContext } from '../api/trpc';
import { log } from 'src/utility/logger';

const PORT = 3111;

const wss = new ws.Server({
	port: PORT,
});
const handler = applyWSSHandler({ wss, router: baseWebsocketsRouter, createContext: createWssContext });

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
