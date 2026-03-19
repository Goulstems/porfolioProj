// Handles video playback rate and blur animation based on scroll
export function handleVideoScrollAnimation(video, blurOverlay, scrollRatio, reverseRatio) {
  let playbackRate = 0.2 + reverseRatio * 0.8;
  playbackRate = Math.min(playbackRate, 1.0);
  if (video) video.playbackRate = playbackRate;

  const blurAmount = 16 * scrollRatio;
  if (blurOverlay) blurOverlay.style.backdropFilter = `blur(${blurAmount}px)`;
}
