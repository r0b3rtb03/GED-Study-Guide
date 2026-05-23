// Tiny floating theme toggle for standalone public pages (landing, auth pages).
// Authenticated pages already get a toggle from layout.js, so they skip this.
(function () {
  if (typeof window === 'undefined') return;
  const btn = document.createElement('button');
  btn.id = 'ged-floating-theme';
  btn.setAttribute('aria-label', 'Toggle theme');
  btn.className = 'fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container shadow-sm';
  btn.innerHTML = `<span class="material-symbols-outlined" id="ged-floating-theme-icon" style="font-size:20px">dark_mode</span>`;
  const sync = () => {
    document.getElementById('ged-floating-theme-icon').textContent =
      window.GedTheme?.isDark() ? 'light_mode' : 'dark_mode';
  };
  btn.addEventListener('click', () => window.GedTheme?.toggle());
  window.addEventListener('ged-theme-change', sync);
  function mount() { document.body.appendChild(btn); sync(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
