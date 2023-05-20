import { EventEmitter } from 'events';
import type { ValuesOf } from 'src/utility/type-utils.ts/type-utils';

type Listener = (...args: any[]) => void;

class WebsocketEventEmitter extends EventEmitter {
	on(event: WSEvent, listener: Listener): this {
		return super.on(event, listener);
	}

	once(event: WSEvent, listener: Listener): this {
		return super.once(event, listener);
	}

	off(event: WSEvent, listener: Listener): this {
		return super.off(event, listener);
	}

	removeListener(event: WSEvent, listener: Listener): this {
		return super.removeListener(event, listener);
	}

	prependListener(eventName: WSEvent, listener: Listener): this {
		return super.prependListener(eventName, listener);
	}

	prependOnceListener(eventName: WSEvent, listener: Listener): this {
		return super.prependOnceListener(eventName, listener);
	}
}

export const WS_EVENT_EMITTER = new WebsocketEventEmitter();

export const WS_EVENTS = {
	// Base Events
	UserResourceUpdate: 'userResourceUpdate',
	// Chat Events
	Message: 'message',
} as const;

export type WSEventBase = ValuesOf<typeof WS_EVENTS>;
export type WSEvent = WSEventBase | `${WSEventBase}${string}`;
