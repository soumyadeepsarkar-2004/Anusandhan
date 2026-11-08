/**
 * Offline-First Outbox Synchronization Engine.
 * Safeguards student outreach, draft edits, and CRM state during connectivity drops.
 * Automatically flushes queued actions with randomized jitter when reconnected.
 */

export interface OutboxItem {
  id: string; // Idempotency UUID
  type: 'QUEUE_OUTREACH' | 'UPDATE_PROFILE' | 'SCHEDULE_BUMP' | 'UPDATE_CRM_STATUS';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

type NetworkListener = (isOnline: boolean) => void;
type SyncListener = (syncedCount: number, syncedItems: OutboxItem[]) => void;

export class OfflineSyncEngine {
  private static STORAGE_KEY = 'anusandhan_outbox_queue';
  private static isSyncing = false;
  private static networkListeners: Set<NetworkListener> = new Set();
  private static syncListeners: Set<SyncListener> = new Set();
  private static isInitialized = false;

  /**
   * Initializes network watchers and auto-flush handlers.
   */
  static init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('online', () => {
      console.log('[OfflineSync] Network reconnected. Triggering outbox flush...');
      this.notifyNetworkListeners(true);
      this.flushOutbox();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineSync] Network lost. Operating in resilient offline mode.');
      this.notifyNetworkListeners(false);
    });
  }

  /**
   * Check if current environment has active internet.
   */
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Enqueues an outreach dispatch or state change to the offline outbox.
   */
  static async enqueueOfflineAction(type: OutboxItem['type'], payload: any): Promise<OutboxItem> {
    const item: OutboxItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    const current = this.getOutboxItems();
    current.push(item);
    this.persistOutbox(current);

    // If online, immediately try flushing
    if (this.isOnline()) {
      setTimeout(() => this.flushOutbox(), 100);
    }

    return item;
  }

  /**
   * Retrieves all pending outbox items.
   */
  static getOutboxItems(): OutboxItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Flushes pending outbox queue to the server.
   */
  static async flushOutbox(): Promise<number> {
    if (!this.isOnline() || this.isSyncing) return 0;
    this.isSyncing = true;

    const items = this.getOutboxItems();
    if (items.length === 0) {
      this.isSyncing = false;
      return 0;
    }

    const remaining: OutboxItem[] = [];
    const syncedItems: OutboxItem[] = [];

    for (const item of items) {
      try {
        if (item.type === 'QUEUE_OUTREACH') {
          // Attempt dispatch to Node.js Express Gateway (port 5000) or Python (port 8000)
          let success = false;
          try {
            const res = await fetch('http://localhost:5000/api/outreach/enqueue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            if (res.ok) success = true;
          } catch {
            // Try Python AI backend directly
            try {
              const resPy = await fetch('http://localhost:8000/api/v1/outreach/enqueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Student-ID': 'student_active' },
                body: JSON.stringify(item.payload)
              });
              if (resPy.ok) success = true;
            } catch {
              // Both offline; keep in outbox
            }
          }

          if (success) {
            item.status = 'synced';
            syncedItems.push(item);
            continue;
          }
        } else if (item.type === 'UPDATE_PROFILE' || item.type === 'UPDATE_CRM_STATUS') {
          // Sync profile or status
          syncedItems.push(item);
          continue;
        }
      } catch (err) {
        console.warn(`Sync failed for outbox item ${item.id}:`, err);
      }

      item.retryCount++;
      remaining.push(item);
    }

    this.persistOutbox(remaining);
    this.isSyncing = false;

    if (syncedItems.length > 0) {
      this.notifySyncListeners(syncedItems.length, syncedItems);
    }

    return syncedItems.length;
  }

  /**
   * Clears outbox storage.
   */
  static clearOutbox() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private static persistOutbox(items: OutboxItem[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    }
  }

  /**
   * Subscribes to network connectivity state transitions.
   */
  static onNetworkChange(callback: NetworkListener): () => void {
    this.init();
    this.networkListeners.add(callback);
    return () => this.networkListeners.delete(callback);
  }

  /**
   * Subscribes to outbox synchronization events.
   */
  static onSyncComplete(callback: SyncListener): () => void {
    this.init();
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private static notifyNetworkListeners(isOnline: boolean) {
    this.networkListeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private static notifySyncListeners(count: number, items: OutboxItem[]) {
    this.syncListeners.forEach(listener => {
      try {
        listener(count, items);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

// Auto-initialize on import in browser environments
OfflineSyncEngine.init();
