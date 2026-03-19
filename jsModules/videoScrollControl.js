

window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('hero-video');
  const hero = document.querySelector('.hero');
  const blurOverlay = document.getElementById('video-blur-overlay');
  const arrows = document.querySelectorAll('.arrow');

  function updateVideoPlaybackAndBlurAndArrows() {
    const rect = hero.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const halfway = windowHeight / 2;
    let visibleRatio = 1;

    if (rect.bottom <= halfway) {
      visibleRatio = 0;
    } else if (rect.top >= 0) {
      visibleRatio = 1;
    } else {
      visibleRatio = Math.max(0, Math.min(1, (rect.bottom - halfway) / (windowHeight - halfway)));
    }

    video.playbackRate = visibleRatio;

    // Blur effect: 0px when fully visible, up to 16px when scrolled down
    const blurAmount = 16 * (1 - visibleRatio);
    blurOverlay.style.backdropFilter = `blur(${blurAmount}px)`;

    // Arrow to dot transition
    arrows.forEach(arrow => {
      if (visibleRatio < 0.2) {
        arrow.classList.add('arrow-dot');
        arrow.textContent = '•';
      } else {
        arrow.classList.remove('arrow-dot');
        arrow.textContent = '↓';
      }
    });

    if (visibleRatio === 0 && !video.paused) {
      video.pause();
    } else if (visibleRatio > 0 && video.paused) {
      video.play();
    }
  }

  window.addEventListener('scroll', updateVideoPlaybackAndBlurAndArrows);
  window.addEventListener('resize', updateVideoPlaybackAndBlurAndArrows);
  updateVideoPlaybackAndBlurAndArrows();
});