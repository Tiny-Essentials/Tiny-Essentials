interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}
