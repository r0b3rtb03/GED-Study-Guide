// Academic Clarity design tokens — now exposed as CSS variables so a single
// `class="dark"` on <html> flips the entire UI from light to dark.
//
// This file runs in the <head> on every page, before <body> is parsed, so:
//   1) the early stored-preference check applies the .dark class with no FOUC
//   2) CSS vars are injected into <head>
//   3) Tailwind colors are configured to read from those vars
(function () {
  if (typeof window === 'undefined' || !window.tailwind) {
    console.warn('Tailwind CDN must load before theme.js');
    return;
  }

  // ---- Step 1: apply stored theme preference BEFORE body paints ----
  const stored = (() => { try { return localStorage.getItem('ged_theme'); } catch { return null; } })();
  const prefersDark = stored
    ? stored === 'dark'
    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (prefersDark) document.documentElement.classList.add('dark');

  // ---- Step 2: inject CSS variables ----
  const style = document.createElement('style');
  style.id = 'ged-theme-vars';
  style.textContent = `
    :root {
      --ged-background: #f7f9ff;
      --ged-surface: #f7f9ff;
      --ged-surface-container-lowest: #ffffff;
      --ged-surface-container-low: #f1f4fa;
      --ged-surface-container: #ebeef4;
      --ged-surface-container-high: #e5e8ee;
      --ged-surface-container-highest: #dfe3e8;
      --ged-surface-variant: #dfe3e8;
      --ged-on-background: #181c20;
      --ged-on-surface: #181c20;
      --ged-on-surface-variant: #414754;
      --ged-outline: #727785;
      --ged-outline-variant: #c1c6d6;
      --ged-primary: #005bbf;
      --ged-primary-container: #1a73e8;
      --ged-on-primary: #ffffff;
      --ged-on-primary-container: #ffffff;
      --ged-secondary: #1b6d24;
      --ged-secondary-container: #a0f399;
      --ged-on-secondary-container: #217128;
      --ged-error: #ba1a1a;
      --ged-error-container: #ffdad6;
      --ged-on-error-container: #93000a;
      --ged-surface-tint: #005bc0;
      --ged-primary-fixed-dim: #adc7ff;
      --ged-inverse-surface: #2d3135;
      --ged-inverse-on-surface: #eef1f7;
    }
    html.dark {
      --ged-background: #111418;
      --ged-surface: #111418;
      --ged-surface-container-lowest: #1a1d22;
      --ged-surface-container-low: #1d2026;
      --ged-surface-container: #22262d;
      --ged-surface-container-high: #2c3038;
      --ged-surface-container-highest: #373c44;
      --ged-surface-variant: #2c3038;
      --ged-on-background: #e1e2e8;
      --ged-on-surface: #e1e2e8;
      --ged-on-surface-variant: #c0c5d5;
      --ged-outline: #8c919c;
      --ged-outline-variant: #414754;
      --ged-primary: #a6c8ff;
      --ged-primary-container: #1a73e8;
      --ged-on-primary: #002f63;
      --ged-on-primary-container: #ffffff;
      --ged-secondary: #88d982;
      --ged-secondary-container: #1d4d2a;
      --ged-on-secondary-container: #a3f69c;
      --ged-error: #ffb4ab;
      --ged-error-container: #5b1413;
      --ged-on-error-container: #ffdad6;
      --ged-surface-tint: #a6c8ff;
      --ged-primary-fixed-dim: #002f63;
      --ged-inverse-surface: #e1e2e8;
      --ged-inverse-on-surface: #2d3135;
    }
    /* Form controls auto-adjust */
    html.dark input, html.dark select, html.dark textarea { color-scheme: dark; }
    /* Smooth color transitions when toggling */
    html, body, *, *::before, *::after {
      transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    }
  `;
  document.head.appendChild(style);

  // ---- Step 3: configure Tailwind to read from the CSS vars ----
  window.tailwind.config = {
    darkMode: 'class',
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
          'metric-display': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '800' }]
        }
      }
    }
  };

  // ---- Step 4: expose a toggle helper used by the UI ----
  window.GedTheme = {
    isDark() { return document.documentElement.classList.contains('dark'); },
    set(mode /* 'dark' | 'light' */) {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      try { localStorage.setItem('ged_theme', mode); } catch {}
      window.dispatchEvent(new CustomEvent('ged-theme-change', { detail: { mode } }));
    },
    toggle() { this.set(this.isDark() ? 'light' : 'dark'); }
  };
})();
