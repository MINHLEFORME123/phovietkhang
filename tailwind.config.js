/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b0000',
        'primary-dim': '#6a0000',
        secondary: '#c8a97e',
        'secondary-dim': '#b09268',
        tertiary: '#1c1c1c',
        'tertiary-fixed-dim': '#a0a0a0',
        'on-tertiary': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f5f5',
        'surface-container': '#ebebeb',
        'surface-container-high': '#e0e0e0',
        'surface-container-highest': '#d6d6d6',
        'on-surface': '#1f1f1f',
        'on-surface-variant': '#4a4a4a',
        'outline': '#79747e',
        'outline-variant': '#cac4d0',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        success: '#146c2e',
        'on-success': '#ffffff',
      },
      fontFamily: {
        'headline-lg': ['"Playfair Display"', 'serif'],
        'headline-md': ['"Playfair Display"', 'serif'],
        'body-lg': ['"Inter"', 'sans-serif'],
        'body-md': ['"Inter"', 'sans-serif'],
        'body-sm': ['"Inter"', 'sans-serif'],
        'label-caps': ['"Inter"', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'headline-md': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'label-caps': ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
      },
      spacing: {
        'margin-desktop': '2rem',
        'margin-mobile': '1rem',
        'gutter': '1.5rem',
      },
      maxWidth: {
        'max-width': '1200px',
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
        'standard': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
      },
      transitionDuration: {
        'short': '200ms',
        'medium': '400ms',
        'long': '600ms',
      },
      boxShadow: {
        'elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-3': '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
