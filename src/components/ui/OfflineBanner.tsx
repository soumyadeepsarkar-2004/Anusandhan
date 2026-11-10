import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { OfflineSyncEngine, OutboxItem } from '../../services/offlineSyncEngine';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(OfflineSyncEngine.isOnline());
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);

  useEffect(() => {
    const unsubNet = OfflineSyncEngine.onNetworkChange((online) => {
      setIsOnline(online);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    const unsubSync = OfflineSyncEngine.onSyncComplete(() => {
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    setOutboxItems(OfflineSyncEngine.getOutboxItems());

    return () => {
      unsubNet();
      unsubSync();
    };
  }, []);

  // When connected, remain completely silent and out of the way
  if (isOnline) {
    return null;
  }

  // Quiet, elegant floating indicator when completely offline
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/95 border border-white/10 text-zinc-300 text-xs font-mono shadow-lg backdrop-blur-md animate-fadeIn">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Offline mode</span>
      {outboxItems.length > 0 && (
        <span className="text-zinc-500">· {outboxItems.length} saved</span>
      )}
    </div>
  );
};
