import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  QrCode,
  Monitor,
  Apple,
  ShieldCheck
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'android' | 'windows' | 'mac' | 'pwa'>('android');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://anusandhan.vercel.app';
  const apkDownloadUrl = '/downloads/anusandhan-v1.0.apk';
  const winDownloadUrl = '/downloads/anusandhan-setup-1.0.0.exe';
  const macDownloadUrl = '/downloads/anusandhan-1.0.0-universal.dmg';

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(`${currentUrl}${url}`);
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
          className="relative w-full max-w-2xl aceternity-glass rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.48)] p-5 sm:p-7 text-zinc-100 z-10 overflow-hidden font-sans backdrop-blur-2xl bg-zinc-950/85"
        >
          {/* Ambient Glowing Orbs */}
          <div className="ambient-orb -top-20 -right-20 w-80 h-80 bg-amber-500/15" />
          <div className="ambient-orb -bottom-20 -left-20 w-80 h-80 bg-indigo-500/15" />

          {/* Specular Top Sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-1.5">
                    Download Anusandhan
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-white/5 border border-white/10 text-zinc-300">
                    Universal
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Available natively for Android, Windows, macOS, and Web
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
          <div className="flex items-center gap-1.5 my-4 p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>

            <button
              onClick={() => setActiveTab('windows')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'windows'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Windows</span>
            </button>

            <button
              onClick={() => setActiveTab('mac')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mac'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>macOS</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'pwa'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web PWA</span>
            </button>
          </div>

          {/* TAB CONTENT: ANDROID APK DIRECT DOWNLOAD */}
          {activeTab === 'android' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-semibold text-white">Anusandhan for Android</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    High-performance mobile client with instant lab alerts, voice viva prep, and fast response times.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                    <span>Android 8.0+</span>
                    <span>•</span>
                    <span>Universal APK</span>
                  </div>
                </div>

                <a
                  href={apkDownloadUrl}
                  download="anusandhan-v1.0.apk"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK</span>
                </a>
              </div>

              {/* Install Guide Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-zinc-300 font-semibold">1. Download</span>
                  <p className="text-zinc-400 text-[11px]">
                    Tap download to save the APK to your device.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-zinc-300 font-semibold">2. Open & Install</span>
                  <p className="text-zinc-400 text-[11px]">
                    Tap the downloaded file. Confirm installation when prompted.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-mono text-zinc-300 font-semibold">3. Launch</span>
                  <p className="text-zinc-400 text-[11px]">
                    Open Anusandhan and access your research workspace anywhere.
                  </p>
                </div>
              </div>

              {/* QR Code / Share Link */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-zinc-300 font-medium">Direct Download Link</span>
                    <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs sm:max-w-md">
                      {currentUrl}{apkDownloadUrl}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyLink(apkDownloadUrl)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer shrink-0 ml-2"
                >
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: WINDOWS DESKTOP */}
          {activeTab === 'windows' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-semibold text-white">Anusandhan for Windows</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      Windows 10 / 11
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Native desktop client with system keyboard shortcuts, local workspace caching, and automatic updates.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                    <span>Architecture: x64</span>
                    <span>•</span>
                    <span>Installer (.exe)</span>
                  </div>
                </div>

                <a
                  href={winDownloadUrl}
                  download="anusandhan-setup-1.0.0.exe"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows (.exe)</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Native Windows Features:</span>
                  <ul className="text-zinc-400 text-[11px] space-y-1 list-disc list-inside">
                    <li>Embedded SQLite local database for fast querying</li>
                    <li>Windows Toast notifications for fellowship deadlines</li>
                    <li>Global shortcut <code>Ctrl+Shift+A</code> for instant voice access</li>
                  </ul>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Installation Notes:</span>
                  <p className="text-zinc-400 text-[11px]">
                    Run <code>anusandhan-setup-1.0.0.exe</code>. If Windows SmartScreen appears, click "More info" and then "Run anyway" to complete installation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: MACOS DESKTOP */}
          {activeTab === 'mac' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-zinc-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-semibold text-white">Anusandhan for macOS</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-200 border border-zinc-600/50">
                      Apple Silicon & Intel
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Universal binary optimized for macOS with native menu bar and keyboard shortcut integration.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                    <span>M1/M2/M3/M4 + x86_64</span>
                    <span>•</span>
                    <span>Universal DMG</span>
                  </div>
                </div>

                <a
                  href={macDownloadUrl}
                  download="anusandhan-1.0.0-universal.dmg"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-200 hover:bg-white text-zinc-950 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download DMG</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">macOS Native Features:</span>
                  <ul className="text-zinc-400 text-[11px] space-y-1 list-disc list-inside">
                    <li>Optimized for Apple Silicon (M-series)</li>
                    <li>Quick Command Palette (⌘K) support</li>
                    <li>Fast local caching and instant launch</li>
                  </ul>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Installation:</span>
                  <p className="text-zinc-400 text-[11px]">
                    Open the downloaded <code className="text-zinc-300">.dmg</code> and drag Anusandhan into Applications.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: PROGRESSIVE WEB APP (PWA) & IOS */}
          {activeTab === 'pwa' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-semibold text-white">Anusandhan Web Application</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      PWA
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Zero-install web experience. Add to Home Screen or Desktop Dock directly from your browser.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-zinc-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Works on iOS, iPadOS, Android, Windows, Mac, and Linux</span>
                  </div>
                </div>

                {canInstallPwa && onTriggerPwaInstall ? (
                  <button
                    onClick={() => {
                      onTriggerPwaInstall();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install PWA</span>
                  </button>
                ) : (
                  <div className="text-center sm:text-right">
                    <span className="text-xs text-zinc-400 block">Browser Installation:</span>
                    <span className="text-xs font-semibold text-zinc-200">Tap Share or Menu → "Add to Home Screen"</span>
                  </div>
                )}
              </div>

              {/* Browser installation helper matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Chrome / Edge / Brave:</span>
                  <p className="text-zinc-400 text-[11px]">
                    Click the install icon in your address bar or select <span className="font-medium text-zinc-300">Menu → "Install Anusandhan"</span>.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-semibold text-zinc-200">Safari (iOS / macOS):</span>
                  <p className="text-zinc-400 text-[11px]">
                    Tap the Share button and select <span className="font-medium text-zinc-300">"Add to Home Screen"</span> or Dock.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Guarantee */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 Verified • Local SQLite / Outbox Cache • Zero Tracking</span>
            </div>
            <span>Cross-Platform Release v1.0.0</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
