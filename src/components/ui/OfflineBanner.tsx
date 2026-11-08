import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { OfflineSyncEngine, OutboxItem } from '../../services/offlineSyncEngine';
import { NotificationService } from '../../services/notificationService';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(OfflineSyncEngine.isOnline());
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>(OfflineSyncEngine.getOutboxItems());
  const [justSyncedCount, setJustSyncedCount] = useState<number>(0);

  useEffect(() => {
    // Listen for network changes
    const unsubNet = OfflineSyncEngine.onNetworkChange((online) => {
      setIsOnline(online);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    // Listen for sync completions
    const unsubSync = OfflineSyncEngine.onSyncComplete((count) => {
      setJustSyncedCount(count);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
      NotificationService.notifyOutboxSynced(count);

      setTimeout(() => setJustSyncedCount(0), 4000);
    });

    // Initial check
    setOutboxItems(OfflineSyncEngine.getOutboxItems());

    return () => {
      unsubNet();
      unsubSync();
    };
  }, []);

  const handleManualSync = async () => {
    const synced = await OfflineSyncEngine.flushOutbox();
    setOutboxItems(OfflineSyncEngine.getOutboxItems());
    if (synced > 0) {
      setJustSyncedCount(synced);
      NotificationService.notifyOutboxSynced(synced);
      setTimeout(() => setJustSyncedCount(0), 4000);
    }
  };

  // If online and no recent sync, do not render banner
  if (isOnline && justSyncedCount === 0 && outboxItems.length === 0) {
    return null;
  }

  // If just synced, show temporary success pill
  if (justSyncedCount > 0) {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between sticky top-0 z-50 animate-fadeIn font-mono">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Sync Complete: {justSyncedCount} offline action(s) successfully dispatched with jitter queue.</span>
        </div>
      </div>
    );
  }

  // If offline
  return (
    <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 animate-fadeIn font-mono">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Offline Mode Active:</strong> You can continue exploring faculty and drafting.
          {outboxItems.length > 0 && ` (${outboxItems.length} action${outboxItems.length > 1 ? 's' : ''} queued in outbox)`}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleManualSync}
          className="px-2 py-0.5 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700/60 text-[11px] flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Sync</span>
        </button>
      </div>
    </div>
  );
};
