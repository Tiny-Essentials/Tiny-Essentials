import { EventEmitter } from 'events';

/**
 * @template {Record<string | symbol, (...args: any[]) => any>} MyEvents
 * @typedef {Omit<EventEmitter, 'on' | 'off' | 'emit' | 'once' | 'addListener' | 'removeListener' | 'removeAllListeners' | 'listeners' | 'rawListeners' | 'listenerCount' | 'prependListener' | 'prependOnceListener'> & {
 *   on<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   once<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   off<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   addListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   removeListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   removeAllListeners<K extends keyof MyEvents>(event?: K): ICustomEventEmitter<MyEvents>;
 *   prependListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   prependOnceListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
 *   emit<K extends keyof MyEvents>(event: K, ...args: Parameters<MyEvents[K]>): boolean;
 *   listeners<K extends keyof MyEvents>(event: K): MyEvents[K][];
 *   rawListeners<K extends keyof MyEvents>(event: K): MyEvents[K][];
 *   listenerCount<K extends keyof MyEvents>(event: K, listener?: MyEvents[K]): number;
 * }} ICustomEventEmitter
 */

/**
 * A constructor whose instances are `T` with the event API narrowed to `Events`.
 *
 * The constructor parameter list is projected from `T` through
 * `ConstructorParameters`, so `super(...)` inside a subclass keeps full type
 * checking. Using `...args: any[]` here would silently widen every `super()`
 * call to `any`.
 *
 * The instance type is an intersection instead of `Omit<InstanceType<T>, ...>`
 * because `Omit` strips the private fields, which are nominal in TypeScript and
 * would break assignability back to `T` (and therefore every
 * `@template {SomeClass} T` constraint downstream).
 *
 * @template {Record<string | symbol, (...args: any[]) => any>} Events
 * @template {abstract new (...args: any[]) => any} T
 * @typedef {Omit<T, 'prototype'> & (new (
 *   ...args: ConstructorParameters<T>
 * ) => ICustomEventEmitter<Events> & InstanceType<T>)} ITypedEventEmitter
 */
