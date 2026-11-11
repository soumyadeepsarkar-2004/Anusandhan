import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { OfflineSyncEngine, OutboxItem } from '../../services/offlineSyncEngine';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(OfflineSyncEngine.isOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(OfflineSyncEngine.getIsSyncing());
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [showSyncedNotice, setShowSyncedNotice] = useState<boolean>(false);

  useEffect(() => {
    const unsubNet = OfflineSyncEngine.onNetworkChange((online) => {
      setIsOnline(online);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    const unsubSync = OfflineSyncEngine.onSyncComplete((count) => {
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
      if (count > 0) {
        setShowSyncedNotice(true);
        const timer = setTimeout(() => setShowSyncedNotice(false), 3500);
        return () => clearTimeout(timer);
      }
    });

    const unsubStatus = OfflineSyncEngine.onStatusChange((syncing) => {
      setIsSyncing(syncing);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    setOutboxItems(OfflineSyncEngine.getOutboxItems());

    return () => {
      unsubNet();
      unsubSync();
      unsubStatus();
    };
  }, []);

  const handleManualSync = () => {
    if (!isSyncing && isOnline) {
      OfflineSyncEngine.syncNow();
    }
  };

  // 1. Success Flash when newly synced to cloud
  if (showSyncedNotice) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-xl backdrop-blur-md animate-fadeIn">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Synced with Cloud Database (MongoDB & SQLite)</span>
      </div>
    );
  }

  // 2. Active Sync in progress
  if (isSyncing) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-xl backdrop-blur-md animate-fadeIn">
        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>Syncing offline records to Cloud...</span>
      </div>
    );
  }

  // 3. Online with pending outbox items awaiting dispatch
  if (isOnline && outboxItems.length > 0) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/95 border border-amber-500/30 text-zinc-200 text-xs font-mono shadow-xl backdrop-blur-md animate-fadeIn">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>{outboxItems.length} unsynced changes</span>
        <button
          onClick={handleManualSync}
          className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold cursor-pointer transition-colors text-[11px] flex items-center gap-1"
        >
          <CloudUpload className="w-3 h-3" />
          <span>Sync Now</span>
        </button>
      </div>
    );
  }

  // 4. Offline mode
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-zinc-900/95 border border-zinc-700/80 text-zinc-300 text-xs font-mono shadow-xl backdrop-blur-md animate-fadeIn">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Offline Mode</span>
        {outboxItems.length > 0 ? (
          <span className="text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
            {outboxItems.length} saved locally
          </span>
        ) : (
          <span className="text-zinc-500 text-[10px]">· Local cache ready</span>
        )}
      </div>
    );
  }

  return null;
};
