import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './services/telemetryService';
import { OfflineSyncEngine } from './services/offlineSyncEngine';

// Auto-recover from dynamic import chunk errors caused by new deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload error detected for chunk. Auto-refreshing to load latest build assets...', event);
    window.location.reload();
  });
}

// Initialize Offline Outbox Synchronization Engine
OfflineSyncEngine.init();

// Register Progressive Web App Service Worker with active update checking
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.location.host.includes('localhost:5173')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        // If an update is waiting, prompt it to activate immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed. Activating immediately.');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      },
      (error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error);
      }
    );
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
