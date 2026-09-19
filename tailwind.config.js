/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120',
        surface: {
          dark: '#0F172A',
          card: 'rgba(15, 23, 42, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        primary: {
          DEFAULT: '#10B981', // Clinical Emerald
          hover: '#059669',
          light: '#34D399',
          dark: '#064E3B',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        accent: {
          DEFAULT: '#06B6D4', // Medical Teal / Cyan
          light: '#38BDF8',
          glow: 'rgba(6, 182, 212, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'scan-laser': 'scanLaser 2.8s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-gentle': 'floatGentle 4s ease-in-out infinite',
      },
      keyframes: {
        scanLaser: {
          '0%': { top: '0%', opacity: '0.8' },
          '50%': { opacity: '1' },
          '100%': { top: '95%', opacity: '0.8' },
        },
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
