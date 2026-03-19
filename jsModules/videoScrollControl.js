

window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('hero-video');
  const hero = document.querySelector('.hero');
  const blurOverlay = document.getElementById('video-blur-overlay');
  const arrows = document.querySelectorAll('.arrow');
  const arrowDots = document.querySelectorAll('.arrow-dot');

  function updateVideoPlaybackAndBlurAndArrows() {
    // Calculate scroll ratio
    const scrollY = window.scrollY;
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const scrollRatio = scrollHeight > 0 ? scrollY / scrollHeight : 0;

    // Reverse scroll ratio for logic
    const reverseRatio = 1 - scrollRatio;

  // Video playback rate: minimum 0.2, maximum 1.0 (plays at top, stops at bottom)
  let playbackRate = 0.2 + reverseRatio * 0.8;
  playbackRate = Math.min(playbackRate, 1.0);
  if (video) video.playbackRate = playbackRate;

    // Blur effect: 0px when at top, up to 16px when scrolled down
    const blurAmount = 16 * scrollRatio;
    if (blurOverlay) blurOverlay.style.backdropFilter = `blur(${blurAmount}px)`;

    // Arrow to dot transition (arrows at top, circles at bottom)
    arrows.forEach(arrow => {
      if (scrollRatio > 0.8) {
        arrow.classList.add('arrow-dot');
        arrow.textContent = '•';
        // Stop bounce animation if at bottom
        if (scrollRatio >= 1) {
          // arrow.style.animation = 'none';
          // arrow.style.transform = '';
        } else {
          // Animation speed: duration from 0.5s (fast) to 2.5s (slow)
          const duration = 0.5 + (2.5 - 0.5) * reverseRatio;
          arrow.style.animation = `bounce ${duration}s infinite`;
        }
      } else {
        arrow.classList.remove('arrow-dot');
        arrow.textContent = '↓';
        // Animation speed: duration from 0.5s (fast) to 2.5s (slow)
        const duration = 0.5 + (2.5 - 0.5) * reverseRatio;
        arrow.style.animation = `bounce ${duration}s infinite`;
      }
    });

    // Pause/play video based on scroll (playing at top, stopped at bottom)
    if (video) {
      if (scrollRatio >= 1 && !video.paused) {
        video.pause();
      } else if (scrollRatio < 1 && video.paused) {
        video.play();
      }
    }
  }

  window.addEventListener('scroll', updateVideoPlaybackAndBlurAndArrows);
  window.addEventListener('resize', updateVideoPlaybackAndBlurAndArrows);
  updateVideoPlaybackAndBlurAndArrows();
});