import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  QrCode,
  Sparkles,
  Cpu
} from 'lucide-react';
import { OfflineSyncEngine, OutboxItem } from '../../services/offlineSyncEngine';
import { AnusandhanLogo } from '../common/AnusandhanLogo';

interface CrossNativeAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPwaInstall?: () => void;
  canInstallPwa?: boolean;
}

export const CrossNativeAppModal: React.FC<CrossNativeAppModalProps> = ({
  isOpen,
  onClose,
  onTriggerPwaInstall,
  canInstallPwa = false
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'pwa' | 'sync'>('android');
  const [isOnline, setIsOnline] = useState<boolean>(OfflineSyncEngine.isOnline());
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setOutboxItems(OfflineSyncEngine.getOutboxItems());
    const unsubNet = OfflineSyncEngine.onNetworkChange((online) => {
      setIsOnline(online);
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    });

    const unsubSync = () => {
      setOutboxItems(OfflineSyncEngine.getOutboxItems());
    };

    const unsubSyncListener = OfflineSyncEngine.onSyncComplete(() => {
      unsubSync();
      setIsSyncing(false);
    });

    return () => {
      unsubNet();
      unsubSyncListener();
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await OfflineSyncEngine.flushOutbox();
    setOutboxItems(OfflineSyncEngine.getOutboxItems());
    setTimeout(() => setIsSyncing(false), 500);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://anusandhan.vercel.app';
  const apkDownloadUrl = '/downloads/anusandhan-v1.0.apk';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${currentUrl}${apkDownloadUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-zinc-100 z-10 overflow-hidden font-sans backdrop-blur-2xl"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    Anusandhan Cross-Native Suite
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    Android & PWA
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Universal offline-first distribution for Android APK & Progressive Web App
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 my-4 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android APK</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pwa'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Progressive Web App</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Offline Sync Engine</span>
              {outboxItems.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                  {outboxItems.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB CONTENT: ANDROID APK DIRECT DOWNLOAD */}
          {activeTab === 'android' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-white">Anusandhan Universal APK</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      v1.0.0 (Release)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Capacitor 8 Cross-Native Android build with embedded SQLite store & background push listeners.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                    <span>Android 8.0+ (API 26)</span>
                    <span>•</span>
                    <span>Package: ai.anusandhan.pro</span>
                    <span>•</span>
                    <span>14.2 MB Universal</span>
                  </div>
                </div>

                <a
                  href={apkDownloadUrl}
                  download="anusandhan-v1.0.apk"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK Directly</span>
                </a>
              </div>

              {/* Install Guide Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-amber-400 font-bold">01. Download</span>
                  <p className="text-zinc-400 text-[11px]">
                    Tap download above to get <code className="text-amber-300">anusandhan-v1.0.apk</code> on your Android phone.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-amber-400 font-bold">02. Allow Unknown</span>
                  <p className="text-zinc-400 text-[11px]">
                    If prompted by Android/Chrome, tap Settings and allow "Install from this source".
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-amber-400 font-bold">03. Autonomous Sync</span>
                  <p className="text-zinc-400 text-[11px]">
                    Launch Anusandhan. Work completely offline; changes sync automatically when reconnected.
                  </p>
                </div>
              </div>

              {/* QR Code / Share Link */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-400 shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-zinc-300 font-medium">Scan or Share Direct Download URL</span>
                    <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs sm:max-w-md">
                      {currentUrl}{apkDownloadUrl}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 text-xs font-mono transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: PROGRESSIVE WEB APP (PWA) */}
          {activeTab === 'pwa' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-white">Anusandhan Progressive Web App</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Standalone Mode
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Zero-install overhead. Runs inside isolated sandboxed browser container with full offline cache.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-zinc-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cross-platform: Windows, macOS, Android, iOS, ChromeOS</span>
                  </div>
                </div>

                {canInstallPwa && onTriggerPwaInstall ? (
                  <button
                    onClick={() => {
                      onTriggerPwaInstall();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install PWA Now</span>
                  </button>
                ) : (
                  <div className="text-center sm:text-right">
                    <span className="text-xs font-mono text-zinc-400 block">Browser Menu Guide:</span>
                    <span className="text-xs font-semibold text-amber-400">Tap ⋮ or Share → "Add to Home screen"</span>
                  </div>
                )}
              </div>

              {/* Browser installation helper matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Chrome / Edge / Brave:</span>
                  <p className="text-zinc-400 text-[11px]">
                    Look for the install icon <span className="font-mono text-amber-300">[⊕]</span> on the right side of the address bar, or click Menu <span className="font-mono text-amber-300">⋮ → "Install Anusandhan"</span>.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Safari (iOS / iPadOS):</span>
                  <p className="text-zinc-400 text-[11px]">
                    Tap the Share button at the bottom of Safari, scroll down and tap <span className="text-amber-300 font-medium">"Add to Home Screen"</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: OFFLINE SYNC ENGINE & OUTBOX STATUS */}
          {activeTab === 'sync' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Network & Engine State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-xs font-mono text-zinc-400">Network State</span>
                      <p className="text-sm font-bold text-white">
                        {isOnline ? 'Online (Connected)' : 'Offline (Local Resilient)'}
                      </p>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-zinc-400">Outbox Queue</span>
                      <p className="text-sm font-bold text-white">
                        {outboxItems.length} Pending Action{outboxItems.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || outboxItems.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-50 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
              </div>

              {/* Pending Queue List or Clear State */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Outbox Queue Stream
                </span>

                {outboxItems.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <p className="text-xs text-zinc-300 font-medium">Outbox is perfectly synchronized</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm">
                      All research applications, faculty saves, drafts, and profile edits have been safely propagated to the cloud database.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {outboxItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-semibold">{item.type}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-mono">
                              {item.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {item.id} • {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="text-zinc-400 text-[11px]">Auto-retry active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Footer Guarantee */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographically verified release • TLS 1.3 End-to-End</span>
            </div>
            <span>Cross-Native Architecture v1.0.0</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
