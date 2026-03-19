// Handles arrow/dot and navigation arrow animation based on scroll
export function handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio) {
  // Handle arrow/dot animation for each arrow
  arrows.forEach(arrow => {
    if (scrollRatio > 0.8) {
      arrow.classList.add('arrow-dot');
      arrow.textContent = '•';
      arrow.style.animation = scrollRatio >= 0.95 ? 'none' : `bounce ${0.5 + (2.5 - 0.5) * reverseRatio}s infinite`;
      arrow.style.transform = '';
    } else {
      arrow.classList.remove('arrow-dot');
      arrow.textContent = '↓';
      const duration = 0.5 + (2.5 - 0.5) * reverseRatio;
      arrow.style.animation = `bounce ${duration}s infinite`;
    }
  });

  // Handle navigation arrows only once per scroll event
  let arrowNav = document.getElementById('arrow-nav');
  if (scrollRatio > 0.8) {
    if (!arrowNav) {
      arrowNav = document.createElement('div');
      arrowNav.id = 'arrow-nav';
      arrowNav.style.display = 'flex';
      arrowNav.style.justifyContent = 'space-between';
      arrowNav.style.width = '100vw';
      arrowNav.style.position = 'absolute';
      arrowNav.style.bottom = '0';
      arrowNav.style.left = '0';
      arrowNav.style.zIndex = '10';
      arrowNav.innerHTML = `
        <span class="nav-arrow nav-arrow-left">&lt;</span>
        <span class="nav-arrow nav-arrow-right">&gt;</span>
      `;
      const aboutMe = document.querySelector('.about-me');
      if (aboutMe && !document.getElementById('arrow-nav')) {
        aboutMe.appendChild(arrowNav);
      }
    } else {
      arrowNav.style.display = 'flex';
    }
    setTimeout(() => {
      const left = document.querySelector('.nav-arrow-left');
      const right = document.querySelector('.nav-arrow-right');
      const fade = Math.max(0, Math.min(1, (scrollRatio - 0.95) / 0.05));
      if (left) left.style.opacity = fade;
      if (right) right.style.opacity = fade;
      if (fade === 0) {
        setTimeout(() => {
          arrowNav.style.display = 'none';
        }, 400);
      } else {
        arrowNav.style.display = 'flex';
      }
    }, 10);
  } else if (arrowNav) {
    const left = document.querySelector('.nav-arrow-left');
    const right = document.querySelector('.nav-arrow-right');
    if (left) left.style.opacity = '0';
    if (right) right.style.opacity = '0';
    setTimeout(() => {
      arrowNav.style.display = 'none';
    }, 400);
  }
}
