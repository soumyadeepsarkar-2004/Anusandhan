import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Globe, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { AnusandhanLogo } from '../common/AnusandhanLogo';

interface PwaInstallPromptProps {
  onOpenCrossNativeModal: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  onOpenCrossNativeModal
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  const onOpenRef = useRef(onOpenCrossNativeModal);
  onOpenRef.current = onOpenCrossNativeModal;

  const deferredPromptRef = useRef(deferredPrompt);
  deferredPromptRef.current = deferredPrompt;

  useEffect(() => {
    // Check if running in standalone mode (already installed PWA)
    const isStandalone = 
      typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently this session
    const dismissedThisSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('anusandhan_pwa_dismissed');

    let timerId: any = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissedThisSession) {
        timerId = setTimeout(() => setIsVisible(true), 4000);
      }
    };

    const handleCustomTrigger = () => {
      if (deferredPromptRef.current) {
        deferredPromptRef.current.prompt();
      } else {
        onOpenRef.current();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('trigger-pwa-install', handleCustomTrigger);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('[PWA] Anusandhan was installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: Open cross native modal with guided instructions
      onOpenCrossNativeModal();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('anusandhan_pwa_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[92vw] sm:w-[380px] bg-zinc-950/95 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-zinc-100 font-sans"
      >
        {/* Ambient Top Indicator */}
        <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">Install Anusandhan</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  App Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                Install as a standalone application for fast, distraction-free research access.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Dismiss prompt"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Web App</span>
          </button>

          <button
            onClick={() => {
              setIsVisible(false);
              onOpenCrossNativeModal();
            }}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Android APK</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
