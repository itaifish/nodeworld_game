import { applyWSSHandler } from '@trpc/server/adapters/ws';
import http from 'http';
import next from 'next';
import { log } from '../utility/logger';
import { parse } from 'url';
import { WebSocketServer } from 'ws';
import { websocketsRouter } from './api/root';
import { createContext } from './websockets/context';

const port = parseInt(process.env.PORT || '3001', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
log.level = 'info';

void app.prepare().then(() => {
	const server = http.createServer((req, res) => {
		const proto = req.headers['x-forwarded-proto'];
		if (proto && proto === 'http') {
			// redirect to ssl
			res.writeHead(303, {
				location: `https://` + req.headers.host + (req.headers.url ?? ''),
			});
			res.end();
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const parsedUrl = parse(req.url!, true);
		void handle(req, res, parsedUrl);
	});
	const wss = new WebSocketServer({ server });
	const handler = applyWSSHandler({ wss, router: websocketsRouter, createContext });

	process.on('SIGTERM', () => {
		log.warn('SIGTERM');
		handler.broadcastReconnectNotification();
	});
	server.listen(port);

	log.info(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
});
