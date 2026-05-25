/**
 * Tailwind config (build-time). Mirrors the runtime config that
 * public/js/theme.js used to set on window.tailwind.config — same color
 * tokens (still backed by CSS variables so light/dark theme toggling
 * keeps working), same spacing, same font scale.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './public/**/*.html',
    './public/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        'background':                 'var(--ged-background)',
        'surface':                    'var(--ged-surface)',
        'surface-container-lowest':   'var(--ged-surface-container-lowest)',
        'surface-container-low':      'var(--ged-surface-container-low)',
        'surface-container':          'var(--ged-surface-container)',
        'surface-container-high':     'var(--ged-surface-container-high)',
        'surface-container-highest':  'var(--ged-surface-container-highest)',
        'surface-variant':            'var(--ged-surface-variant)',
        'on-background':              'var(--ged-on-background)',
        'on-surface':                 'var(--ged-on-surface)',
        'on-surface-variant':         'var(--ged-on-surface-variant)',
        'outline':                    'var(--ged-outline)',
        'outline-variant':            'var(--ged-outline-variant)',
        'primary':                    'var(--ged-primary)',
        'primary-container':          'var(--ged-primary-container)',
        'on-primary':                 'var(--ged-on-primary)',
        'on-primary-container':       'var(--ged-on-primary-container)',
        'secondary':                  'var(--ged-secondary)',
        'secondary-container':        'var(--ged-secondary-container)',
        'on-secondary-container':     'var(--ged-on-secondary-container)',
        'error':                      'var(--ged-error)',
        'error-container':            'var(--ged-error-container)',
        'on-error-container':         'var(--ged-on-error-container)',
        'surface-tint':               'var(--ged-surface-tint)',
        'primary-fixed-dim':          'var(--ged-primary-fixed-dim)',
        'inverse-surface':            'var(--ged-inverse-surface)',
        'inverse-on-surface':         'var(--ged-inverse-on-surface)'
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: { 'margin-mobile': '16px', 'margin-desktop': '40px', 'gutter': '24px' },
      fontFamily: {
        'label-md': ['Inter'], 'headline-lg': ['Inter'], 'body-md': ['Inter'],
        'headline-md': ['Inter'], 'headline-sm': ['Inter'], 'body-lg': ['Inter'],
        'metric-display': ['Inter']
      },
      fontSize: {
        'label-md':       ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'headline-lg':    ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md':        ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md':    ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm':    ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg':        ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'metric-display': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg':     ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md':     ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
};
