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
  // Default is LIGHT mode. We only switch to dark if the user has explicitly
  // toggled to dark (saved in localStorage). We intentionally do NOT follow
  // prefers-color-scheme by default — many users on macOS run system-dark and
  // wouldn't expect their study app to pick that up unprompted.
  const stored = (() => { try { return localStorage.getItem('ged_theme'); } catch { return null; } })();
  if (stored === 'dark') document.documentElement.classList.add('dark');

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
    /* Dark mode — designed as its own palette, not a literal inversion.
       Deep midnight-navy backgrounds give the app a "library at night"
       feel; surfaces step up in luminance with a subtle warm cast so the
       hierarchy reads even at low brightness. Primary is a vibrant
       sky-blue tuned for AAA contrast on the navy background. */
    html.dark {
      /* Page + surface stack — true navy with a touch of warmth */
      --ged-background:                  #0d1320;
      --ged-surface:                     #0d1320;
      --ged-surface-container-lowest:    #131a2a;
      --ged-surface-container-low:       #182033;
      --ged-surface-container:           #1d2640;
      --ged-surface-container-high:      #242e4a;
      --ged-surface-container-highest:   #2c3656;
      --ged-surface-variant:             #1d2640;

      /* Text — high-contrast off-white, then muted variants */
      --ged-on-background:               #e8edf7;
      --ged-on-surface:                  #e8edf7;
      --ged-on-surface-variant:          #a7b3cf;

      /* Lines — visible but never harsh */
      --ged-outline:                     #5b6789;
      --ged-outline-variant:             #2a3354;

      /* Primary — sky-blue accent that pops against navy. Stays readable
         when used as a fill (bg-primary text-on-primary) AND when used
         as text on backgrounds (text-primary). */
      --ged-primary:                     #8ab4ff;
      --ged-primary-container:           #3a5fa5;
      --ged-on-primary:                  #0a1530;
      --ged-on-primary-container:        #e1ecff;

      /* Secondary — muted teal/green for "correct" pills and accents */
      --ged-secondary:                   #9bdc8f;
      --ged-secondary-container:         #1f3b27;
      --ged-on-secondary-container:      #b7e8a9;

      /* Errors — soft coral, never neon */
      --ged-error:                       #ff9d97;
      --ged-error-container:             #4a1719;
      --ged-on-error-container:          #ffd5d1;

      /* Tint + fixed dims used in gradients on landing pages */
      --ged-surface-tint:                #8ab4ff;
      --ged-primary-fixed-dim:           #1a2945;

      /* Inverse used for tooltips/snackbars */
      --ged-inverse-surface:             #e8edf7;
      --ged-inverse-on-surface:          #1d2640;
    }
    /* Dark mode polish — softer shadows + form controls */
    html.dark .shadow-sm,
    html.dark .shadow,
    html.dark .shadow-md,
    html.dark .shadow-lg {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    html.dark input,
    html.dark textarea,
    html.dark select { background-color: var(--ged-surface-container-low); }
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
          'metric-display': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '800' }],
          // Display sizes for the dashboard's welcome banner.
          'display-lg':     ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
          'display-md':     ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }]
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
