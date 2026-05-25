// Renders the shared side nav, mobile top bar, and bottom nav.
//
// Collapsible sidebar:
//   - Persistent collapsed/expanded state lives in localStorage.ged_sidebar.
//   - When collapsed, the sidebar is 64px wide and main content is pushed
//     accordingly (md:pl-16 instead of md:pl-64).
//   - Hovering a collapsed sidebar temporarily expands it as an OVERLAY
//     (content does not shift) so labels become readable without a click.
//   - Toggle button in the header switches the persisted state.
import { getUser, logout, requireLogin } from './auth.js';

const NAV_ITEMS = [
  // Home links back out to the public landing page. Sits at the top so the
  // user can always get to the marketing/about view without signing out.
  { href: '/',                 label: 'Home',              icon: 'home',          mobile: 'Home',     mobileIcon: 'home' },
  { href: '/dashboard',        label: 'Dashboard',         icon: 'dashboard',     mobile: 'Stats',    mobileIcon: 'dashboard' },
  { href: '/study_notes',      label: 'Study Notes',       icon: 'menu_book',     mobile: 'Notes',    mobileIcon: 'menu_book' },
  { href: '/study_guide',      label: 'Study Guide',       icon: 'auto_stories',  mobile: 'Guide',    mobileIcon: 'auto_stories' },
  { href: '/practice_session', label: 'Practice Sessions', icon: 'edit_square',   mobile: 'Practice', mobileIcon: 'edit_square' },
  { href: '/growth_history',   label: 'History',           icon: 'history',       mobile: 'History',  mobileIcon: 'history' }
];

// Help and Sign Out used to live here — they moved to the desktop top bar.
// Settings stays in the sidebar because it's a destination page, not an action.
const FOOTER_ITEMS = [
  { href: '/account_settings', label: 'Settings', icon: 'settings' }
];

function isActive(href) {
  return location.pathname.toLowerCase().endsWith(href.toLowerCase());
}

// ---- Sidebar collapse state ----
const COLLAPSE_KEY = 'ged_sidebar';
function isCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === 'collapsed'; } catch { return false; }
}
function setCollapsed(v) {
  try { localStorage.setItem(COLLAPSE_KEY, v ? 'collapsed' : 'expanded'); } catch {}
}

function injectCollapseStyles() {
  if (document.getElementById('ged-sidebar-styles')) return;
  const style = document.createElement('style');
  style.id = 'ged-sidebar-styles';
  style.textContent = `
    /* Smooth width transitions on the sidebar */
    aside#ged-sidebar { transition: width 0.18s ease; }

    /* Collapsed: 64px wide. Hide labels and brand text.
       On hover, expand to 256px and reveal labels (overlay — does not push content). */
    @media (min-width: 768px) {
      aside#ged-sidebar[data-collapsed="true"] { width: 4rem; }
      aside#ged-sidebar[data-collapsed="true"]:hover,
      aside#ged-sidebar[data-collapsed="true"]:focus-within { width: 16rem; }

      aside#ged-sidebar[data-collapsed="true"]:not(:hover):not(:focus-within) .sidebar-label,
      aside#ged-sidebar[data-collapsed="true"]:not(:hover):not(:focus-within) .sidebar-brand,
      aside#ged-sidebar[data-collapsed="true"]:not(:hover):not(:focus-within) .sidebar-user {
        opacity: 0;
        pointer-events: none;
      }
      aside#ged-sidebar .sidebar-label,
      aside#ged-sidebar .sidebar-brand,
      aside#ged-sidebar .sidebar-user {
        transition: opacity 0.12s ease;
      }

      /* Main content padding follows the persisted collapse state so
         content doesn't shift on hover. The override is scoped to <main>
         elements that already opted into md:pl-64. */
      html[data-sidebar="collapsed"] main.md\\:pl-64 { padding-left: 4rem; }

      /* The practice page's sticky session bar also rides the sidebar offset. */
      html[data-sidebar="collapsed"] header#sessionBar.md\\:left-64 { left: 4rem; }

      /* Collapse toggle: a small chip that "straddles" the sidebar's right
         edge, sitting just outside the sidebar so it's never obscured by the
         brand text. Centered on the border by translating -50% on x. */
      button#ged-collapse-btn { left: 16rem; transition: left 0.18s ease; }
      html[data-sidebar="collapsed"] button#ged-collapse-btn { left: 4rem; }

      /* Desktop top bar — fixed, starts to the right of the sidebar so the
         sidebar runs continuously top-to-bottom. Left offset tracks the
         sidebar's collapsed/expanded state for a clean visual seam. */
      header#ged-topbar { left: 16rem; transition: left 0.18s ease; }
      html[data-sidebar="collapsed"] header#ged-topbar { left: 4rem; }
      header#ged-topbar.tour-active { pointer-events: none; }

      /* Push page content below the top bar. Pages already use md:pt-0 so we
         can add this safely without doubling padding on mobile. */
      body { padding-top: 3.5rem; }

      /* The practice page's session bar — already sticks below the global
         top bar via its own offset, so leave it untouched here. */
    }
  `;
  document.head.appendChild(style);
}

// Apply / unapply the html attribute that drives main's padding.
function syncMainPadding(collapsed) {
  document.documentElement.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded');
}

export function renderShell({ active } = {}) {
  if (!requireLogin()) return;
  injectCollapseStyles();

  const user = getUser() || { firstName: 'Student', lastName: '', email: '' };
  const initials = (user.firstName?.[0] || 'S') + (user.lastName?.[0] || '');
  const collapsed = isCollapsed();
  syncMainPadding(collapsed);

  // SIDE NAV (desktop)
  const sideNav = document.createElement('aside');
  sideNav.id = 'ged-sidebar';
  sideNav.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
  sideNav.className = 'hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface-container-lowest border-r border-outline-variant z-30 overflow-hidden';
  sideNav.innerHTML = `
    <div class="px-5 pt-6 pb-5 border-b border-outline-variant">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center overflow-hidden bg-primary-container/10">
          <!-- Site logo. If /logo.png is missing the onerror swaps the img for
               the original menu_book icon so the header never shows a broken
               image. -->
          <img src="/logo.png" alt="GED Study Guide logo" class="w-full h-full object-contain"
               onerror="this.outerHTML='&lt;span class=\'material-symbols-outlined text-primary\' style=\'font-size:20px\'&gt;menu_book&lt;/span&gt;'">
        </div>
        <div class="min-w-0 flex-1 sidebar-brand">
          <p class="text-[17px] font-bold text-primary leading-tight whitespace-nowrap">GED Study Guide</p>
          <p class="text-label-md font-label-md text-on-surface-variant whitespace-nowrap">Academic Confidence</p>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3 sidebar-user">
        <div class="w-9 h-9 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">${initials.toUpperCase()}</div>
        <div class="min-w-0">
          <p class="text-label-md font-label-md text-on-surface truncate">${user.firstName || ''} ${user.lastName || ''}</p>
          <p class="text-[12px] text-on-surface-variant truncate">${user.email || ''}</p>
        </div>
      </div>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
      ${NAV_ITEMS.map(n => {
        const a = active ? n.href.includes(active) : isActive(n.href);
        const ext = n.external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${n.href}"${ext} class="flex items-center gap-3 h-11 px-4 rounded-full ${a ? 'text-primary font-bold bg-primary-container/15' : 'text-on-surface-variant hover:bg-surface-container-low'}" title="${n.label}">
          <span class="material-symbols-outlined shrink-0" style="font-size:22px; font-variation-settings: 'FILL' ${a ? 1 : 0}">${n.icon}</span>
          <span class="text-label-md font-label-md sidebar-label whitespace-nowrap">${n.label}</span>
        </a>`;
      }).join('')}
    </nav>
    <div class="px-3 py-4 border-t border-outline-variant space-y-1">
      ${FOOTER_ITEMS.map(n => {
        const common = `${n.id ? ` id="${n.id}"` : ''}${n.action ? ` data-action="${n.action}"` : ''} class="flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-left w-full" title="${n.label}"`;
        const inner  = `<span class="material-symbols-outlined shrink-0" style="font-size:20px">${n.icon}</span><span class="text-label-md font-label-md sidebar-label whitespace-nowrap">${n.label}</span>`;
        // action-based items render as <button> so href="#" can't mis-route
        if (n.action) return `<button type="button"${common}>${inner}</button>`;
        return `<a href="${n.href}"${n.external ? ' target="_blank" rel="noopener"' : ''}${common}>${inner}</a>`;
      }).join('')}
      <button id="ged-theme-btn" class="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-left" title="Toggle theme">
        <span class="material-symbols-outlined shrink-0" style="font-size:20px" id="ged-theme-icon">dark_mode</span>
        <span class="text-label-md font-label-md sidebar-label whitespace-nowrap" id="ged-theme-label">Dark mode</span>
      </button>
      <button id="ged-logout-btn" class="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-left" title="Sign Out">
        <span class="material-symbols-outlined shrink-0" style="font-size:20px">logout</span>
        <span class="text-label-md font-label-md sidebar-label whitespace-nowrap">Sign Out</span>
      </button>
      <a href="/practice_session" class="mt-3 w-full h-12 bg-primary text-on-primary rounded-lg font-bold text-label-md flex items-center justify-center gap-2 hover:opacity-90" title="Start Practice">
        <span class="material-symbols-outlined shrink-0" style="font-size:20px">play_arrow</span>
        <span class="sidebar-label whitespace-nowrap">Start Practice</span>
      </a>
    </div>
  `;

  // MOBILE TOP BAR
  const topBar = document.createElement('header');
  topBar.className = 'md:hidden fixed top-0 inset-x-0 h-16 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-margin-mobile z-30';
  topBar.innerHTML = `
    <p class="text-headline-sm font-headline-sm text-primary">GED Study Guide</p>
    <div class="flex items-center gap-2">
      <button class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></button>
      <a href="/account_settings" class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">${initials.toUpperCase()}</a>
    </div>
  `;

  // DESKTOP TOP BAR — sits to the right of the sidebar.
  // Layout: <left spacer> <search (slightly right of center)> <help> <sign-out> <profile w/ hover-expand panel>
  // The spacer columns aren't equal — left is 1fr and right is auto, which
  // shifts the search bar visually to the right of dead-center, matching the
  // mock.
  const desktopTopBar = document.createElement('header');
  desktopTopBar.id = 'ged-topbar';
  desktopTopBar.className = 'hidden md:flex fixed top-0 right-0 h-14 bg-surface-container-lowest border-b border-outline-variant items-center px-6 z-30 gap-3';
  desktopTopBar.innerHTML = `
    <!-- Left spacer: bigger than the right side, so the centered search lands right of dead-center. -->
    <div class="flex-[1.4]"></div>

    <!-- Search -->
    <div class="flex-[1.6] max-w-md">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style="font-size:18px">search</span>
        <input id="ged-topbar-search" type="search" placeholder="Search topics, notes, sessions…"
               class="w-full h-9 pl-10 pr-3 rounded-lg bg-surface-container text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary/40 transition" />
      </div>
    </div>

    <!-- Right cluster: help, sign-out, profile (in that order, just left of profile) -->
    <div class="flex items-center gap-1">
      <button type="button" data-action="help" id="ged-topbar-help"
              class="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition" title="Help &amp; tour" aria-label="Help">
        <span class="material-symbols-outlined" style="font-size:20px">help_outline</span>
      </button>
      <button type="button" id="ged-topbar-logout"
              class="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition" title="Sign out" aria-label="Sign out">
        <span class="material-symbols-outlined" style="font-size:20px">logout</span>
      </button>

      <!-- Profile chip + hover-expand panel. The pt-2 inner wrapper bridges
           the visual gap so moving the cursor from the chip to the panel
           doesn't trip the :hover state. -->
      <div class="relative group ml-2">
        <button class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Profile">
          ${initials.toUpperCase()}
        </button>
        <div class="absolute right-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
          <div class="w-64 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold shrink-0">${initials.toUpperCase()}</div>
              <div class="min-w-0">
                <p class="font-bold text-on-surface truncate">${user.firstName || ''} ${user.lastName || ''}</p>
                <p class="text-label-md text-on-surface-variant truncate">${user.email || ''}</p>
              </div>
            </div>
            <a href="/account_settings" class="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-surface-container-low text-label-md text-on-surface">
              <span class="material-symbols-outlined" style="font-size:18px">settings</span>Account settings
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // MOBILE BOTTOM NAV
  const bottomNav = document.createElement('nav');
  const MOBILE_BOTTOM = NAV_ITEMS.filter(n => n.label !== 'History');
  bottomNav.className = 'md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-outline-variant grid grid-cols-5 z-30';
  bottomNav.innerHTML = MOBILE_BOTTOM.map(n => {
    const a = active ? n.href.includes(active) : isActive(n.href);
    const ext = n.external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${n.href}"${ext} class="flex flex-col items-center justify-center gap-0.5 ${a ? 'text-primary font-bold' : 'text-on-surface-variant'}">
      <span class="material-symbols-outlined" style="font-size:22px; font-variation-settings: 'FILL' ${a ? 1 : 0}">${n.mobileIcon}</span>
      <span class="text-[11px]">${n.mobile}</span>
    </a>`;
  }).join('');

  // Collapse toggle — floats outside the sidebar so it can't be covered
  // by the brand text or labels. Sits at the sidebar's right edge,
  // translated -50% on x so it visually straddles the border.
  const collapseBtn = document.createElement('button');
  collapseBtn.id = 'ged-collapse-btn';
  collapseBtn.className = 'hidden md:flex fixed top-3 z-40 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant items-center justify-center text-on-surface-variant hover:bg-surface-container shadow-sm';
  collapseBtn.style.transform = 'translateX(-50%)';
  collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  collapseBtn.innerHTML = `<span class="material-symbols-outlined" id="ged-collapse-icon" style="font-size:18px">${collapsed ? 'chevron_right' : 'chevron_left'}</span>`;

  document.body.prepend(sideNav, topBar, desktopTopBar, bottomNav);
  document.body.appendChild(collapseBtn);
  document.getElementById('ged-logout-btn').addEventListener('click', logout);
  document.getElementById('ged-topbar-logout')?.addEventListener('click', logout);

  // Search: stub navigation — Enter takes the user to a search page if one
  // exists, otherwise scrolls to the in-page topic the query matches.
  const searchInput = document.getElementById('ged-topbar-search');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = searchInput.value.trim();
    if (!q) return;
    location.href = `/study_notes?topic=${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}`;
  });

  const collapseIcon = document.getElementById('ged-collapse-icon');
  collapseBtn.addEventListener('click', () => {
    const next = sideNav.getAttribute('data-collapsed') !== 'true';
    sideNav.setAttribute('data-collapsed', next ? 'true' : 'false');
    setCollapsed(next);
    syncMainPadding(next);
    collapseIcon.textContent = next ? 'chevron_right' : 'chevron_left';
    collapseBtn.setAttribute('aria-label', next ? 'Expand sidebar' : 'Collapse sidebar');
  });

  // Dark mode toggle
  const themeBtn = document.getElementById('ged-theme-btn');
  const themeIcon = document.getElementById('ged-theme-icon');
  const themeLabel = document.getElementById('ged-theme-label');
  function syncThemeBtn() {
    const dark = window.GedTheme?.isDark();
    themeIcon.textContent = dark ? 'light_mode' : 'dark_mode';
    themeLabel.textContent = dark ? 'Light mode' : 'Dark mode';
  }
  syncThemeBtn();
  themeBtn.addEventListener('click', () => { window.GedTheme?.toggle(); });
  window.addEventListener('ged-theme-change', syncThemeBtn);

  // Help button → launch the guided product tour. Uses document-level event
  // delegation instead of attaching directly to the button, so it works even
  // if the button gets re-rendered or moved by something else later. A
  // module-level _helpWired guard prevents double-binding across multiple
  // renderShell calls (e.g. if a page re-mounts the layout).
  console.log('[tour] renderShell ran, Help button present:', !!document.querySelector('[data-action="help"]'));
  if (!window.__gedHelpWired) {
    window.__gedHelpWired = true;
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action="help"]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      console.log('[tour] Help clicked, loading module…');
      try {
        const mod = await import('/js/site-tour.js');
        console.log('[tour] module loaded, calling startSiteTour');
        await mod.startSiteTour();
        console.log('[tour] tour started');
      } catch (err) {
        console.error('[tour] failed:', err);
        alert('Could not start the tour: ' + (err?.message || err));
      }
    });
    console.log('[tour] click delegate attached');
  }
}
