import { EventEmitter } from 'events';

export const WS_EVENT_EMITTER = new EventEmitter();

export const WS_EVENTS = {
	Message: 'message',
	UserResourceUpdate: 'userResourceUpdate',
} as const;
