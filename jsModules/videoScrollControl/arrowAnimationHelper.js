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

function setCarouselDotsFade(carouselDots, fade) {
  if (carouselDots) carouselDots.style.opacity = fade;
}

function setTitleUnderlineProgress(contentTitle, progress) {
  if (!contentTitle) return;
  contentTitle.style.setProperty('--title-underline-scale', String(progress));
  contentTitle.style.setProperty('--title-underline-opacity', String(Math.max(0.2, progress)));
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
  const carouselDots = document.querySelector('.carousel-dots');
  const contentTitle = document.getElementById('contentTitle');
  if (!arrowNav) return;

  // Reveal range tuned for mobile so state can still reach full visibility.
  const revealStart = 0.78;
  const revealEnd = 0.96;

  // Fade for nav arrows as we approach the lowered state.
  let fade = 0;
  if (scrollRatio >= revealStart) {
    fade = (scrollRatio - revealStart) / (revealEnd - revealStart);
    fade = Math.max(0, Math.min(1, fade));
  }

  // Underline grows outwards on scroll up and shrinks inwards on scroll down.
  const underlineProgress = 1 - fade;

  // Dots appear after underline has mostly shrunk.
  const dotsFadeDelay = 0.65;
  const dotsFade = fade <= dotsFadeDelay ? 0 : Math.max(0, Math.min(1, (fade - dotsFadeDelay) / (1 - dotsFadeDelay)));

  setNavArrowFade(left, right, fade);
  setCarouselDotsFade(carouselDots, dotsFade);
  setTitleUnderlineProgress(contentTitle, underlineProgress);

  if (fade > 0) {
    showNavArrows(arrowNav);
  } else {
    hideNavArrows(arrowNav);
  }
}

// Main exported function
export function handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio) {
  arrows.forEach(arrow => animateArrowDot(arrow, scrollRatio, reverseRatio));
  handleNavArrowAnimation(scrollRatio);
}
