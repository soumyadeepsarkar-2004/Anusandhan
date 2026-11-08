/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--canvas-bg)',
          surface: 'var(--surface-bg)',
          elevated: 'var(--elevated-bg)',
          card: 'var(--surface-bg)',
          subtle: 'var(--elevated-bg)',
          border: 'var(--border-subtle)',
          'border-hover': 'var(--border-hover)',
        },
        brand: {
          amber: {
            DEFAULT: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
            subtle: 'rgba(245, 158, 11, 0.12)',
            border: 'rgba(245, 158, 11, 0.35)',
          },
          emerald: {
            DEFAULT: '#10B981',
            light: '#34D399',
            dark: '#059669',
            subtle: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.35)',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 28s linear infinite',
        'soundwave': 'soundwave 1.2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        soundwave: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '16px' },
        }
      }
    },
  },
  plugins: [],
}
