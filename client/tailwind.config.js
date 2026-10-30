/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nature & Environmental Light Theme Palette
        earth: {
          950: '#F8FAF8', // Page body canvas (warm natural off-white)
          900: '#FFFFFF', // Primary card/panel surface (pure white)
          850: '#F3F4F1', // Secondary container / recessed surface
          800: '#E5E7EB', // Card borders & horizontal dividers
          750: '#D1D5DB', // Form input borders & elevated separators
          700: '#CBD5E1', // Subdued borders & hover borders
          600: '#64748B', // Muted slate secondary text
          500: '#475569', // Body text (slate-600)
          400: '#334155', // Readable slate body text (slate-700)
          300: '#1E293B', // High contrast slate heading (slate-800)
          200: '#0F172A', // Deep slate emphasis (slate-900)
          100: '#020617', // Pitch slate text
          50: '#FBFBFA',  // Clean light tint
        },
        risk: {
          low: '#059669',        // Forest emerald
          'low-bg': '#ECFDF5',   // Warm mint surface
          moderate: '#D97706',   // Ocher amber
          'moderate-bg': '#FFFBEB',
          high: '#EA580C',       // Terracotta orange
          'high-bg': '#FFF7ED',
          critical: '#DC2626',   // Restrained crimson
          'critical-bg': '#FEF2F2',
        },
        water: {
          DEFAULT: '#0284C7',
          50: '#F0F9FF',
          100: '#E0F2FE',
          600: '#0284C7',
          700: '#0369A1'
        },
        flora: {
          DEFAULT: '#059669',
          50: '#ECFDF5',
          600: '#059669',
          700: '#047857'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        'glow-critical': '0 0 12px -2px rgba(220, 38, 38, 0.25)',
        'glow-high': '0 0 10px -2px rgba(234, 88, 12, 0.2)',
        'glow-moderate': '0 0 8px -2px rgba(217, 119, 6, 0.15)',
        'glow-low': '0 0 8px -2px rgba(5, 150, 105, 0.15)',
      }
    },
  },
  plugins: [],
}
