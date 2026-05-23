// Applies the Academic Clarity Tailwind config used by every page.
// Loaded via <script src="/js/theme.js"></script> BEFORE the page renders.
// Requires tailwindcss CDN to have already loaded (which exposes `tailwind`).
(function () {
  if (typeof window === 'undefined' || !window.tailwind) {
    console.warn('Tailwind CDN must load before theme.js');
    return;
  }
  window.tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'on-background': '#181c20',
          'surface-dim': '#d7dae0',
          'surface-container-low': '#f1f4fa',
          'outline-variant': '#c1c6d6',
          'on-surface-variant': '#414754',
          'surface-container-lowest': '#ffffff',
          'background': '#f7f9ff',
          'on-secondary-container': '#217128',
          'error-container': '#ffdad6',
          'on-error': '#ffffff',
          'on-primary': '#ffffff',
          'primary-fixed': '#d8e2ff',
          'primary-fixed-dim': '#adc7ff',
          'surface': '#f7f9ff',
          'secondary-container': '#a0f399',
          'surface-variant': '#dfe3e8',
          'surface-container': '#ebeef4',
          'on-primary-container': '#ffffff',
          'surface-container-high': '#e5e8ee',
          'secondary': '#1b6d24',
          'outline': '#727785',
          'inverse-primary': '#adc7ff',
          'surface-tint': '#005bc0',
          'tertiary': '#805600',
          'primary': '#005bbf',
          'primary-container': '#1a73e8',
          'on-error-container': '#93000a',
          'error': '#ba1a1a',
          'surface-bright': '#f7f9ff',
          'on-surface': '#181c20',
          'surface-container-highest': '#dfe3e8',
          'inverse-surface': '#2d3135',
          'inverse-on-surface': '#eef1f7'
        },
        borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
        spacing: { 'margin-mobile': '16px', 'margin-desktop': '40px', 'gutter': '24px' },
        fontFamily: {
          'label-md': ['Inter'], 'headline-lg': ['Inter'], 'body-md': ['Inter'],
          'headline-md': ['Inter'], 'headline-sm': ['Inter'], 'body-lg': ['Inter'],
          'metric-display': ['Inter']
        },
        fontSize: {
          'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
          'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
          'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
          'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
          'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
          'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
          'metric-display': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '800' }]
        }
      }
    }
  };
})();
