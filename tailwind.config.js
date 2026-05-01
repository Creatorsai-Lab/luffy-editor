/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        editor: {
          bg:           '#0f0f0f',
          surface:      '#141414',
          panel:        '#1a1a1a',
          elevated:     '#1e1e1e',
          hover:        '#242424',
          border:       '#2a2a2a',
          'border-strong': '#404040',
          muted:        '#737373',
          secondary:    '#a3a3a3',
          text:         '#e5e5e5',
          accent:       '#6366f1',
          'accent-hover': '#4f46e5',
          'accent-dim': 'rgba(99,102,241,0.15)',
          success:      '#22c55e',
          warning:      '#f59e0b',
          error:        '#ef4444',
        }
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '16px'],
        sm:    ['12px', '18px'],
        base:  ['13px', '20px'],
      }
    }
  },
  plugins: []
}
