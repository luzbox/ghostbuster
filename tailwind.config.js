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
        // Custom dark theme colors for ghostbuster app
        'ghost': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        'haunted': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        }
      },
      animation: {
        'ghost-float': 'ghostFloat 3s ease-in-out infinite',
        'ghost-fade': 'ghostFade 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        ghostFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        ghostFade: {
          '0%': { opacity: '0.3' },
          '100%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}