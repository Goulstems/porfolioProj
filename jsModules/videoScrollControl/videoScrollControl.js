

import { handleVideoScrollAnimation } from './videoAnimationHelper.js';
import { handleArrowScrollAnimation } from './arrowAnimationHelper.js';

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
    const reverseRatio = 1 - scrollRatio;
    console.log('scrollRatio:', scrollRatio, 'reverseRatio:', reverseRatio);

    handleVideoScrollAnimation(video, blurOverlay, scrollRatio, reverseRatio);
    handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio);

  // ...existing code...

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