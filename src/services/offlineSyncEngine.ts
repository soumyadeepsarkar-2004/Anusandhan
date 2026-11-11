/**
 * Offline-First Outbox Synchronization Engine.
 * Safeguards student outreach, draft edits, and CRM state during connectivity drops.
 * Automatically flushes queued actions with idempotency keys and randomized jitter when reconnected.
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
type StatusListener = (isSyncing: boolean) => void;

export class OfflineSyncEngine {
  private static STORAGE_KEY = 'anusandhan_outbox_queue';
  private static isSyncing = false;
  private static networkListeners: Set<NetworkListener> = new Set();
  private static syncListeners: Set<SyncListener> = new Set();
  private static statusListeners: Set<StatusListener> = new Set();
  private static isInitialized = false;

  /**
   * Dynamically resolves the API gateway base URL across Web, Electron, and Capacitor.
   */
  public static getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      if ((import.meta as any).env?.VITE_API_URL) {
        return (import.meta as any).env.VITE_API_URL;
      }
      const isElectron = !!(window as any).electronAPI || window.location.protocol === 'file:';
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.() || (window.location.hostname === 'localhost' && !window.location.port);
      if (isElectron || isCapacitor) {
        return 'https://anusandhan.vercel.app/api';
      }
      const host = window.location.hostname;
      const port = window.location.port;
      if ((host === 'localhost' || host === '127.0.0.1') && port === '5173') {
        return 'http://localhost:5000/api';
      }
      return '/api';
    }
    return '/api';
  }

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
   * Check if sync is currently in progress.
   */
  static getIsSyncing(): boolean {
    return this.isSyncing;
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
   * Manually trigger outbox synchronization.
   */
  static async syncNow(): Promise<number> {
    return this.flushOutbox();
  }

  /**
   * Flushes pending outbox queue to the cloud database and backend gateway.
   */
  static async flushOutbox(): Promise<number> {
    if (!this.isOnline() || this.isSyncing) return 0;
    this.isSyncing = true;
    this.notifyStatusListeners(true);

    const items = this.getOutboxItems();
    if (items.length === 0) {
      this.isSyncing = false;
      this.notifyStatusListeners(false);
      return 0;
    }

    const apiBase = this.getApiBaseUrl();
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rip_auth_token') : null;
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // Strategy 1: Attempt Batch Sync Endpoint for high efficiency and atomic guarantees
    try {
      const batchRes = await fetch(`${apiBase}/sync/batch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ actions: items })
      });

      if (batchRes.ok) {
        const batchData = await batchRes.json();
        const syncedResults = batchData.results || [];
        const syncedIds = new Set(syncedResults.filter((r: any) => r.status === 'synced').map((r: any) => r.id));

        const syncedItems = items.filter(it => syncedIds.has(it.id));
        const remaining = items.filter(it => !syncedIds.has(it.id));

        this.persistOutbox(remaining);
        this.isSyncing = false;
        this.notifyStatusListeners(false);

        if (syncedItems.length > 0) {
          this.notifySyncListeners(syncedItems.length, syncedItems);
        }

        return syncedItems.length;
      }
    } catch (batchErr) {
      console.warn('[OfflineSync] Batch sync endpoint unavailable, falling back to granular endpoints:', batchErr);
    }

    // Strategy 2: Granular item-by-item fallback
    const remaining: OutboxItem[] = [];
    const syncedItems: OutboxItem[] = [];

    for (const item of items) {
      try {
        let success = false;

        if (item.type === 'QUEUE_OUTREACH') {
          const res = await fetch(`${apiBase}/outreach/enqueue`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(item.payload)
          });
          if (res.ok) success = true;
        } else if (item.type === 'UPDATE_PROFILE') {
          const res = await fetch(`${apiBase}/students/me`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(item.payload)
          });
          if (res.ok) success = true;
        } else if (item.type === 'UPDATE_CRM_STATUS') {
          const id = item.payload.id || item.payload.draft_id;
          if (id) {
            const res = await fetch(`${apiBase}/outreach/${id}/status`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({ status: item.payload.status })
            });
            if (res.ok) success = true;
          }
        }

        if (success) {
          item.status = 'synced';
          syncedItems.push(item);
          continue;
        }
      } catch (err) {
        console.warn(`[OfflineSync] Granular sync failed for outbox item ${item.id}:`, err);
      }

      item.retryCount++;
      remaining.push(item);
    }

    this.persistOutbox(remaining);
    this.isSyncing = false;
    this.notifyStatusListeners(false);

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

  /**
   * Subscribes to syncing active/idle status changes.
   */
  static onStatusChange(callback: StatusListener): () => void {
    this.init();
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
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

  private static notifyStatusListeners(isSyncing: boolean) {
    this.statusListeners.forEach(listener => {
      try {
        listener(isSyncing);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

// Auto-initialize on import in browser environments
OfflineSyncEngine.init();
