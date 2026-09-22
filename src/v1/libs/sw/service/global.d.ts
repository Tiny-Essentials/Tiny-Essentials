interface SyncEvent extends ExtendableEvent {
  readonly lastChance: boolean;
  readonly tag: string;
}

interface ServiceWorkerGlobalScopeEventMap {
  "sync": SyncEvent;
}
