/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        alpine: {
          bg: '#090d11',
          card: '#11161d',
          surface: '#161c24',
          surfaceHigh: '#1e2631',
          surfaceHighest: '#273240',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.16)',
          emerald: '#10b981',
          emeraldHover: '#059669',
          emeraldDark: '#047857',
          amber: '#f59e0b',
          amberLight: '#fef3c7',
          sky: '#38bdf8',
          skyLight: '#e0f2fe',
          rose: '#f87171',
          text: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.22s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%':   { boxShadow: '0 0 0 0 var(--action-glow)' },
          '50%':  { boxShadow: '0 0 14px 5px var(--action-glow)' },
          '100%': { boxShadow: '0 0 0 0 var(--action-glow)' },
        },
      }
    },
  },
  plugins: [],
}
