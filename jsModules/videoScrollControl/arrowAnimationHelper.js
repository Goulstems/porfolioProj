// Arrow animation helper functions

function animateArrowDot(arrow, scrollRatio, reverseRatio) {
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
}

function setNavArrowFade(left, right, fade) {
  if (left) left.style.opacity = fade;
  if (right) right.style.opacity = fade;
}

function showNavArrows(arrowNav) {
  arrowNav.style.display = 'flex';
}

function hideNavArrows(arrowNav) {
  arrowNav.style.display = 'none';
}

function handleNavArrowAnimation(scrollRatio) {
  const arrowNav = document.getElementById('arrow-nav');
  const left = document.querySelector('.nav-arrow-left');
  const right = document.querySelector('.nav-arrow-right');
  if (!arrowNav) return;

  // Calculate fade directly from scroll ratio between 0.8 and 1
  let fade = 0;
  if (scrollRatio >= 0.8 /*&& scrollRatio <= 1*/) {
    fade = (scrollRatio - 0.8) / 0.2;
    fade = Math.max(0, Math.min(1, fade));
  }

  setNavArrowFade(left, right, fade);

  if (fade > 0) {
    showNavArrows(arrowNav);
  } else {
    hideNavArrows(arrowNav);
  }
}

// Main exported function
export function handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio) {
  console.log('scrollRatio:', scrollRatio);
  arrows.forEach(arrow => animateArrowDot(arrow, scrollRatio, reverseRatio));
  handleNavArrowAnimation(scrollRatio);
}
