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
  { href: '/dashboard',        label: 'Dashboard',         icon: 'dashboard',     mobile: 'Home',     mobileIcon: 'home' },
  { href: '/study_notes',      label: 'Study Notes',       icon: 'menu_book',     mobile: 'Notes',    mobileIcon: 'menu_book' },
  { href: '/study_guide',      label: 'Study Guide',       icon: 'auto_stories',  mobile: 'Guide',    mobileIcon: 'auto_stories' },
  { href: '/practice_session', label: 'Practice Sessions', icon: 'edit_square',   mobile: 'Practice', mobileIcon: 'edit_square' },
  { href: '/growth_history',   label: 'History',           icon: 'history',       mobile: 'History',  mobileIcon: 'history' }
];

const FOOTER_ITEMS = [
  { href: '/account_settings', label: 'Settings', icon: 'settings' },
  { href: '#',                 label: 'Help',     icon: 'help_outline' }
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
        <div class="w-9 h-9 shrink-0 rounded-full bg-primary-container/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary" style="font-size:20px">menu_book</span>
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
      ${FOOTER_ITEMS.map(n => `<a href="${n.href}" ${n.external ? 'target="_blank" rel="noopener"' : ''} class="flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low" title="${n.label}">
        <span class="material-symbols-outlined shrink-0" style="font-size:20px">${n.icon}</span>
        <span class="text-label-md font-label-md sidebar-label whitespace-nowrap">${n.label}</span>
      </a>`).join('')}
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
  collapseBtn.className = 'hidden md:flex fixed top-6 z-40 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant items-center justify-center text-on-surface-variant hover:bg-surface-container shadow-sm';
  collapseBtn.style.transform = 'translateX(-50%)';
  collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  collapseBtn.innerHTML = `<span class="material-symbols-outlined" id="ged-collapse-icon" style="font-size:18px">${collapsed ? 'chevron_right' : 'chevron_left'}</span>`;

  document.body.prepend(sideNav, topBar, bottomNav);
  document.body.appendChild(collapseBtn);
  document.getElementById('ged-logout-btn').addEventListener('click', logout);

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
}
