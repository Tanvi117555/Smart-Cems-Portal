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
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        navy: {
          800: '#111827',
          900: '#0b1329',
          950: '#070c1a',
        },
        primary: {
          blue: '#2563eb',
          royal: '#1d4ed8',
          indigo: '#4f46e5',
          purple: '#7c3aed',
          violet: '#8b5cf6',
          deep: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15), rgba(124, 58, 237, 0.05) 50%, transparent 80%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glow-primary': '0 0 25px -5px rgba(79, 70, 229, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
      }
    },
  },
  plugins: [],
}
