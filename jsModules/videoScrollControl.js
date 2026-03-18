window.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.bg-local-wrapper video');
  const hero = document.querySelector('.hero');

  function updateVideoPlayback() {
    const rect = hero.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // New threshold: when bottom of hero is at halfway point of viewport
    const halfway = windowHeight / 2;
    let visibleRatio = 1;

    if (rect.bottom <= halfway) {
      visibleRatio = 0;
    } else if (rect.top >= 0) {
      visibleRatio = 1;
    } else {
      // Interpolate between 1 and 0 as bottom goes from windowHeight to halfway
      visibleRatio = Math.max(0, Math.min(1, (rect.bottom - halfway) / (windowHeight - halfway)));
    }

    video.playbackRate = visibleRatio;

    if (visibleRatio === 0 && !video.paused) {
      video.pause();
    } else if (visibleRatio > 0 && video.paused) {
      video.play();
    }
  }

  window.addEventListener('scroll', updateVideoPlayback);
  window.addEventListener('resize', updateVideoPlayback);
  updateVideoPlayback();
});