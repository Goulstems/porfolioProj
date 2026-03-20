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

  if (scrollRatio > 0.8) {
    // Always show nav arrows before fading in
    showNavArrows(arrowNav);
    setTimeout(() => {
      const fade = Math.max(0, Math.min(1, (scrollRatio - 0.95) / 0.05));
      setNavArrowFade(left, right, fade);
      // Only hide after fade-out completes
      if (fade === 0) {
        setTimeout(() => {
          hideNavArrows(arrowNav);
        }, 400);
      }
    }, 10);
  } else {
    // Fade out arrows, then hide nav container after transition
    setNavArrowFade(left, right, '0');
    setTimeout(() => {
      hideNavArrows(arrowNav);
    }, 400);
  }
}

// Main exported function
export function handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio) {
  arrows.forEach(arrow => animateArrowDot(arrow, scrollRatio, reverseRatio));
  handleNavArrowAnimation(scrollRatio);
}
