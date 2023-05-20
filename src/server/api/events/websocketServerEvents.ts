import type { Building, Resource } from '@prisma/client';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import type { BaseDetails } from 'src/game/interfaces/base';
import type { AppendString, ValuesOf } from 'src/utility/type-utils.ts/type-utils';

type Listener<TData> = (data: TData) => void;

class WebsocketEventEmitter extends EventEmitter {
	static readonly instance = new WebsocketEventEmitter();
	private constructor() {
		super();
	}
	on<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.on(event, listener);
	}

	once<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.once(event, listener);
	}

	off<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.off(event, listener);
	}

	removeListener<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.removeListener(event, listener);
	}

	prependListener<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.prependListener(event, listener);
	}

	prependOnceListener<TEvent extends WSEvent>(event: TEvent, listener: Listener<EventDataMap[TEvent]>): this {
		return super.prependOnceListener(event, listener);
	}

	emit<TEvent extends WSEvent>(event: TEvent, data: EventDataMap[TEvent]): boolean {
		return super.emit(event, data);
	}

	getObservable<TEvent extends WSEvent, TData extends EventDataMap[TEvent]>(event: TEvent) {
		return observable<TData>((emit) => {
			const onObservableEvent = (data: TData) => {
				// emit data to client
				emit.next(data);
			};

			this.on(event, onObservableEvent);

			// unsubscribe function when client disconnects or stops subscribing
			return () => {
				this.off(event, onObservableEvent);
			};
		});
	}
}

export const WS_EVENT_EMITTER = WebsocketEventEmitter.instance;

export const WS_EVENTS = {
	// Base Events
	UserResourceUpdate: 'userResourceUpdate',
	BaseUpdate: 'baseUpdate',
	BuildingUpdate: 'buildingUpdate',
	// Chat Events
	Message: 'message',
} as const;

export type DataChangedEventObject<
	TDataCreated extends { id: any },
	TDataUpdated = Partial<TDataCreated> & { id: TDataCreated['id'] },
	TDataDestroyed = TDataUpdated,
> =
	| ({ action: 'created' } & TDataCreated)
	| ({ action: 'destroyed' } & TDataDestroyed)
	| ({ action: 'updated' } & TDataUpdated);

export type EventDataMap = {
	[key: AppendString<typeof WS_EVENTS.UserResourceUpdate>]: Resource[];
	[key: AppendString<typeof WS_EVENTS.BaseUpdate>]: DataChangedEventObject<BaseDetails>;
	[key: AppendString<typeof WS_EVENTS.BuildingUpdate>]: DataChangedEventObject<Building>;
	[key: AppendString<typeof WS_EVENTS.Message>]: any;
};

export type WSEventBase = ValuesOf<typeof WS_EVENTS>;
export type WSEvent = AppendString<WSEventBase>;
