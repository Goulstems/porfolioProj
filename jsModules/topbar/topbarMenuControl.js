window.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const topbarMenu = document.getElementById('topbarMenu');
  if (!menuToggle || !topbarMenu) return;

  function setMenuOpen(nextOpen) {
    menuToggle.classList.toggle('is-open', nextOpen);
    topbarMenu.classList.toggle('is-open', nextOpen);
    menuToggle.setAttribute('aria-expanded', String(nextOpen));
    menuToggle.setAttribute('aria-label', nextOpen ? 'Close menu' : 'Open menu');
    topbarMenu.setAttribute('aria-hidden', String(!nextOpen));
  }

  menuToggle.addEventListener('click', () => {
    const currentlyOpen = menuToggle.classList.contains('is-open');
    setMenuOpen(!currentlyOpen);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!topbarMenu.contains(target) && !menuToggle.contains(target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
    }
  });

  topbarMenu.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const menuItem = target.closest('.topbar-menu-link');
    if (!(menuItem instanceof HTMLElement)) return;

    const panelIndex = Number.parseInt(menuItem.dataset.panelIndex || '', 10);
    if (Number.isNaN(panelIndex)) return;

    window.dispatchEvent(
      new CustomEvent('topbar:navigate-panel', {
        detail: { panelIndex }
      })
    );
    setMenuOpen(false);
  });

  setMenuOpen(false);
});
