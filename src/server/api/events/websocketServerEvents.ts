import type { Resource } from '@prisma/client';
import { EventEmitter } from 'events';
import type { BaseDetails } from 'src/game/interfaces/base';
import type { AppendString, ValuesOf } from 'src/utility/type-utils.ts/type-utils';

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

	emit<TEvent extends WSEvent>(eventName: TEvent, data: EventDataMap[TEvent]): boolean {
		return super.emit(eventName, data);
	}
}

export const WS_EVENT_EMITTER = new WebsocketEventEmitter();

export const WS_EVENTS = {
	// Base Events
	UserResourceUpdate: 'userResourceUpdate',
	BaseUpdate: 'baseUpdate',
	// Chat Events
	Message: 'message',
} as const;

export type EventDataMap = {
	[key: AppendString<typeof WS_EVENTS.UserResourceUpdate>]: Resource[];
	[key: AppendString<typeof WS_EVENTS.BaseUpdate>]: BaseDetails;
	[key: AppendString<typeof WS_EVENTS.Message>]: any;
};

export type WSEventBase = ValuesOf<typeof WS_EVENTS>;
export type WSEvent = AppendString<WSEventBase>;
