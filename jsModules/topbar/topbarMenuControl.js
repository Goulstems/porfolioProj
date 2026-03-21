window.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const topbarMenu = document.getElementById('topbarMenu');
  const topbarIcon = document.querySelector('.topbar-icon');
  if (!menuToggle || !topbarMenu) return;

  function runTopbarIconSplash() {
    if (!topbarIcon) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const iconSrc = topbarIcon.getAttribute('src');
    if (!iconSrc) return;

    const SPLASH_HOLD_MS = 380;

    const overlay = document.createElement('div');
    overlay.className = 'topbar-splash-overlay';

    const splashIcon = document.createElement('img');
    splashIcon.className = 'topbar-splash-icon';
    splashIcon.src = iconSrc;
    splashIcon.alt = '';
    splashIcon.setAttribute('aria-hidden', 'true');

    const splashSize = Math.min(window.innerWidth, window.innerHeight) * 0.4;
    splashIcon.style.width = `${splashSize}px`;
    splashIcon.style.height = `${splashSize}px`;
    splashIcon.style.left = '50%';
    splashIcon.style.top = '50%';
    splashIcon.style.transform = 'translate(-50%, -50%)';
    splashIcon.style.borderRadius = '50%';

    document.body.appendChild(overlay);
    document.body.appendChild(splashIcon);
    topbarIcon.classList.add('topbar-icon--hidden');
    let hasStarted = false;

    function startAnimation() {
      const iconRect = topbarIcon.getBoundingClientRect();
      if (iconRect.width === 0 || iconRect.height === 0) {
        cleanup();
        return;
      }

      const splashSize = Math.min(window.innerWidth, window.innerHeight) * 0.4;
      const targetCenterX = iconRect.left + iconRect.width / 2;
      const targetCenterY = iconRect.top + iconRect.height / 2;

      const iconAnim = splashIcon.animate(
        [
          {
            left: '50%',
            top: '50%',
            width: `${splashSize}px`,
            height: `${splashSize}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            opacity: 1
          },
          {
            left: `${targetCenterX}px`,
            top: `${targetCenterY}px`,
            width: `${iconRect.width}px`,
            height: `${iconRect.height}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            opacity: 1
          }
        ],
        {
          duration: 820,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        }
      );

      overlay.animate(
        [
          { opacity: 1 },
          { opacity: 0 }
        ],
        {
          duration: 860,
          easing: 'ease',
          fill: 'forwards'
        }
      );

      iconAnim.addEventListener('finish', cleanup, { once: true });
    }

    function cleanup() {
      topbarIcon.classList.remove('topbar-icon--hidden');
      overlay.remove();
      splashIcon.remove();
    }

    const kickoff = () => {
      if (hasStarted) return;
      hasStarted = true;
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(startAnimation);
        });
      }, SPLASH_HOLD_MS);
    };

    if (topbarIcon.complete) {
      kickoff();
      return;
    }

    topbarIcon.addEventListener('load', kickoff, { once: true });
    window.setTimeout(kickoff, 500);
  }

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
  runTopbarIconSplash();
});
