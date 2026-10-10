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
        dark: {
          950: '#080C14', // Canvas background
          900: '#0B0F19', // Main background
          850: '#111827', // Card surface primary
          800: '#161F30', // Elevated container
          750: '#1E293B', // Secondary surface
          700: '#334155', // Subtle divider
          600: '#475569', // Border
          500: '#64748B', // Muted text
          400: '#94A3B8', // Subtext
        },
        nexus: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          electric: '#38BDF8',
          violet: '#8B5CF6',
          purple: '#A855F7',
          amber: '#F59E0B',
          red: '#EF4444',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'clean': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'clean-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'clean-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
