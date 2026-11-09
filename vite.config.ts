import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['canvas-confetti']
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://anusandhan.vercel.app',
        changeOrigin: true
      }
    },
    watch: {
      ignored: [
        '**/android/**',
        '**/backend/**',
        '**/server/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/.venv/**'
      ]
    }
  }
});
