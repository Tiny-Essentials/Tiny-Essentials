import EventEmitter from 'events';

declare global {
  type ICustomEventEmitter<MyEvents extends Record<string | symbol, (...args: any[]) => void>> =
    Omit<
      EventEmitter, 
      'on' | 'off' | 'emit' | 'once' | 'addListener' | 'removeListener' | 'removeAllListeners' | 'listeners' | 'rawListeners' | 'listenerCount' | 'prependListener' | 'prependOnceListener'
    > & {
      on<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      once<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      off<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      addListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      removeListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      removeAllListeners<K extends keyof MyEvents>(event?: K): ICustomEventEmitter<MyEvents>;
      prependListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      prependOnceListener<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): ICustomEventEmitter<MyEvents>;
      emit<K extends keyof MyEvents>(event: K, ...args: Parameters<MyEvents[K]>): boolean;
      listeners<K extends keyof MyEvents>(event: K): MyEvents[K][];
      rawListeners<K extends keyof MyEvents>(event: K): MyEvents[K][];
      listenerCount<K extends keyof MyEvents>(event: K, listener: MyEvents[K]|undefined): number;
    };
}
