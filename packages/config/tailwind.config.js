/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "../../apps/web/app/**/*.{js,ts,jsx,tsx}",
    "../../apps/web/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border) / <alpha-value>)',
        
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-secondary': 'rgb(var(--accent-secondary) / <alpha-value>)',
        
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        
        'aurora-1': 'rgb(var(--aurora-1) / <alpha-value>)',
        'aurora-2': 'rgb(var(--aurora-2) / <alpha-value>)',
        'aurora-3': 'rgb(var(--aurora-3) / <alpha-value>)',

        // Legacy compatibility tokens for M1-M12 components
        // (to be removed in subsequent refactor)
        'surface-base': 'rgb(var(--background) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface) / <alpha-value>)',
        'surface-overlay': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'border-strong': 'rgb(var(--border) / <alpha-value>)',
        'text-placeholder': 'rgb(var(--text-muted) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent) / <alpha-value>)',
        'accent-active': 'rgb(var(--accent-secondary) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace']
      },
      boxShadow: {
        'elevation-flat': '0 0 0 1px rgb(var(--border))',
        'elevation-low': '0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgb(var(--border))',
        'elevation-overlay': '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgb(var(--border))',
        'focus-glow': '0 0 0 2px rgb(var(--accent)), 0 0 12px rgb(var(--accent) / 0.2)'
      }
    }
  },
  plugins: [],
};
