/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          emerald: '#10b981',
          emeraldHover: '#059669',
          amber: '#f59e0b',
          coral: '#ef4444',
          gold: '#eab308',
          text: '#f8fafc',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        game: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.6))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.2))' },
        }
      },
      animation: {
        pop: 'pop 0.3s ease-in-out',
        shake: 'shake 0.4s ease-in-out',
        pulseGlow: 'pulseGlow 2s infinite',
      }
    },
  },
  plugins: [],
}
