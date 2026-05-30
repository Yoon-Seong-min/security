/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg: '#07080a', surface: '#0f1117', border: '#1e2330', muted: '#2a3040',
          text: '#c8d0e0', dim: '#6b7a99', accent: '#3b82f6', success: '#22c55e',
          danger: '#ef4444', warn: '#f59e0b', purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
};
