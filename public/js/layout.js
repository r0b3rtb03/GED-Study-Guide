// Renders the shared side nav, mobile top bar, and bottom nav.
import { getUser, logout, requireLogin } from './auth.js';

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Dashboard',         icon: 'dashboard',     mobile: 'Home',     mobileIcon: 'home' },
  { href: '/study_notes',      label: 'Study Notes',       icon: 'menu_book',     mobile: 'Notes',    mobileIcon: 'menu_book' },
  { href: '/practice_session', label: 'Practice Sessions', icon: 'edit_square',   mobile: 'Practice', mobileIcon: 'edit_square' },
  { href: '/growth_history',   label: 'History',           icon: 'history',       mobile: 'History',  mobileIcon: 'history' }
];

const FOOTER_ITEMS = [
  { href: '/account_settings', label: 'Settings', icon: 'settings' },
  { href: '#',                       label: 'Help',     icon: 'help_outline' }
];

function isActive(href) {
  return location.pathname.toLowerCase().endsWith(href.toLowerCase());
}

export function renderShell({ active } = {}) {
  if (!requireLogin()) return;
  const user = getUser() || { firstName: 'Student', lastName: '', email: '' };
  const initials = (user.firstName?.[0] || 'S') + (user.lastName?.[0] || '');

  // SIDE NAV (desktop)
  const sideNav = document.createElement('aside');
  sideNav.className = 'hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface-container-lowest border-r border-outline-variant z-30';
  sideNav.innerHTML = `
    <div class="px-6 pt-6 pb-5 border-b border-outline-variant">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary" style="font-size:22px">menu_book</span>
        </div>
        <div class="min-w-0">
          <p class="text-headline-sm font-headline-sm text-primary leading-tight truncate">GED Math Master</p>
          <p class="text-label-md font-label-md text-on-surface-variant">Academic Confidence</p>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">${initials.toUpperCase()}</div>
        <div class="min-w-0">
          <p class="text-label-md font-label-md text-on-surface truncate">${user.firstName || ''} ${user.lastName || ''}</p>
          <p class="text-[12px] text-on-surface-variant truncate">${user.email || ''}</p>
        </div>
      </div>
    </div>
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      ${NAV_ITEMS.map(n => {
        const a = active ? n.href.includes(active) : isActive(n.href);
        return `<a href="${n.href}" class="flex items-center gap-3 h-11 px-3 rounded-lg ${a ? 'text-primary font-bold bg-primary-container/10 border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}">
          <span class="material-symbols-outlined" style="font-size:22px">${n.icon}</span>
          <span class="text-label-md font-label-md">${n.label}</span>
        </a>`;
      }).join('')}
    </nav>
    <div class="px-3 py-4 border-t border-outline-variant space-y-1">
      ${FOOTER_ITEMS.map(n => `<a href="${n.href}" class="flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
        <span class="material-symbols-outlined" style="font-size:20px">${n.icon}</span>
        <span class="text-label-md font-label-md">${n.label}</span>
      </a>`).join('')}
      <button id="ged-logout-btn" class="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-left">
        <span class="material-symbols-outlined" style="font-size:20px">logout</span>
        <span class="text-label-md font-label-md">Sign Out</span>
      </button>
      <a href="/practice_session" class="mt-3 w-full h-12 bg-primary text-on-primary rounded-lg font-bold text-label-md flex items-center justify-center gap-2 hover:opacity-90">
        <span class="material-symbols-outlined" style="font-size:20px">play_arrow</span>
        Start Practice
      </a>
    </div>
  `;

  // MOBILE TOP BAR
  const topBar = document.createElement('header');
  topBar.className = 'md:hidden fixed top-0 inset-x-0 h-16 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-margin-mobile z-30';
  topBar.innerHTML = `
    <p class="text-headline-sm font-headline-sm text-primary">GED Math Master</p>
    <div class="flex items-center gap-2">
      <button class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></button>
      <a href="/account_settings" class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold">${initials.toUpperCase()}</a>
    </div>
  `;

  // MOBILE BOTTOM NAV
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-outline-variant grid grid-cols-4 z-30';
  bottomNav.innerHTML = NAV_ITEMS.map(n => {
    const a = active ? n.href.includes(active) : isActive(n.href);
    return `<a href="${n.href}" class="flex flex-col items-center justify-center gap-0.5 ${a ? 'text-primary font-bold' : 'text-on-surface-variant'}">
      <span class="material-symbols-outlined" style="font-size:22px; font-variation-settings: 'FILL' ${a ? 1 : 0}">${n.mobileIcon}</span>
      <span class="text-[11px]">${n.mobile}</span>
    </a>`;
  }).join('');

  document.body.prepend(sideNav, topBar, bottomNav);
  document.getElementById('ged-logout-btn').addEventListener('click', logout);
}
