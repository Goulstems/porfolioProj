import { handleVideoScrollAnimation } from './videoAnimationHelper.js';
import { handleArrowScrollAnimation } from './arrowAnimationHelper.js';

let loweredState = false;
const CAROUSEL_DURATION_MS = 450;
const WHEEL_STEP_COOLDOWN_MS = 280;
const SWIPE_THRESHOLD_PX = 40;

window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('hero-video');
  const blurOverlay = document.getElementById('video-blur-overlay');
  const arrows = document.querySelectorAll('.arrow');
  const contentTitle = document.getElementById('contentTitle');
  const contentArea = document.getElementById('contentArea');
  const contentPanels = contentArea ? Array.from(contentArea.querySelectorAll('.content-panel')) : [];
  const navArrowLeft = document.querySelector('.nav-arrow-left');
  const navArrowRight = document.querySelector('.nav-arrow-right');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activePanelIndex = 0;
  let isProgrammaticScroll = false;
  let animationFrameId = null;
  let titleSwapTimeoutId = null;
  let lastWheelStepTs = 0;
  let touchStartX = 0;
  let touchStartIndex = 0;
  const clickFeedbackTimers = new WeakMap();

  function getPanelWidth() {
    return contentArea ? contentArea.clientWidth : window.innerWidth;
  }

  function clampPanelIndex(index) {
    return Math.max(0, Math.min(index, contentPanels.length - 1));
  }

  function updateContentTitle(index) {
    if (!contentTitle || contentPanels.length === 0) return;
    const title = contentPanels[index]?.dataset.title;
    if (title) {
      contentTitle.textContent = title;
    }
  }

  function animateTitleToIndex(nextIndex, direction) {
    if (!contentTitle || contentPanels.length === 0) return;
    const nextTitle = contentPanels[nextIndex]?.dataset.title;
    if (!nextTitle || contentTitle.textContent === nextTitle) return;

    if (titleSwapTimeoutId) {
      window.clearTimeout(titleSwapTimeoutId);
      titleSwapTimeoutId = null;
    }

    if (prefersReducedMotion) {
      contentTitle.textContent = nextTitle;
      return;
    }

    const outOffset = direction >= 0 ? -16 : 16;
    const inOffset = direction >= 0 ? 16 : -16;
    contentTitle.animate(
      [
        { opacity: 1, transform: 'translateX(0px)' },
        { opacity: 0, transform: `translateX(${outOffset}px)` }
      ],
      {
        duration: CAROUSEL_DURATION_MS / 2,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      }
    );

    titleSwapTimeoutId = window.setTimeout(() => {
      contentTitle.textContent = nextTitle;
      contentTitle.animate(
        [
          { opacity: 0, transform: `translateX(${inOffset}px)` },
          { opacity: 1, transform: 'translateX(0px)' }
        ],
        {
          duration: CAROUSEL_DURATION_MS / 2,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        }
      );
      titleSwapTimeoutId = null;
    }, CAROUSEL_DURATION_MS / 2);
  }

  function jumpToPanel(index) {
    if (!contentArea || contentPanels.length === 0) return;
    const nextIndex = clampPanelIndex(index);
    const panelWidth = getPanelWidth();
    contentArea.scrollTo({ left: nextIndex * panelWidth, behavior: 'auto' });
    activePanelIndex = nextIndex;
    updateContentTitle(activePanelIndex);
  }

  function animateToPanel(index) {
    if (!contentArea || contentPanels.length === 0) return;
    const nextIndex = clampPanelIndex(index);
    if (nextIndex === activePanelIndex) {
      jumpToPanel(nextIndex);
      return;
    }

    if (prefersReducedMotion) {
      jumpToPanel(nextIndex);
      return;
    }

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    const direction = nextIndex > activePanelIndex ? 1 : -1;
    const panelWidth = getPanelWidth();
    const startLeft = contentArea.scrollLeft;
    const targetLeft = nextIndex * panelWidth;
    const startTime = performance.now();

    animateTitleToIndex(nextIndex, direction);
    isProgrammaticScroll = true;

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.max(0, Math.min(1, elapsed / CAROUSEL_DURATION_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      contentArea.scrollLeft = startLeft + (targetLeft - startLeft) * eased;

      if (t < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        contentArea.scrollLeft = targetLeft;
        animationFrameId = null;
        isProgrammaticScroll = false;
        activePanelIndex = nextIndex;
        clearArrowStates(navArrowLeft, navArrowRight);
      }
    }

    animationFrameId = window.requestAnimationFrame(step);
    activePanelIndex = nextIndex;
  }

  function stepPanel(direction) {
    const nextIndex = clampPanelIndex(activePanelIndex + direction);
    clearArrowStates(navArrowLeft, navArrowRight);
    animateToPanel(nextIndex);
  }

  function syncPanelFromScroll() {
    if (isProgrammaticScroll || !contentArea || contentPanels.length === 0) return;
    const panelWidth = getPanelWidth();
    if (panelWidth === 0) return;
    const nextIndex = clampPanelIndex(Math.round(contentArea.scrollLeft / panelWidth));
    if (nextIndex !== activePanelIndex) {
      const direction = nextIndex > activePanelIndex ? 1 : -1;
      animateTitleToIndex(nextIndex, direction);
      activePanelIndex = nextIndex;
    }
  }

  function handleTouchStart(event) {
    if (!loweredState || !contentArea || event.touches.length === 0) return;
    touchStartX = event.touches[0].clientX;
    touchStartIndex = activePanelIndex;
  }

  function handleTouchEnd(event) {
    if (!loweredState || !contentArea || event.changedTouches.length === 0) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      animateToPanel(activePanelIndex);
      return;
    }

    const direction = deltaX < 0 ? 1 : -1;
    const targetIndex = clampPanelIndex(touchStartIndex + direction);
    animateToPanel(targetIndex);
  }

  function handleWheel(event) {
    if (!loweredState || !contentArea) return;
    const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const dominantDelta = horizontalIntent ? event.deltaX : event.deltaY;
    if (Math.abs(dominantDelta) < 8) return;

    event.preventDefault();
    const now = performance.now();
    if (now - lastWheelStepTs < WHEEL_STEP_COOLDOWN_MS) return;

    lastWheelStepTs = now;
    const direction = dominantDelta > 0 ? 1 : -1;
    stepPanel(direction);
  }

  function scrollToPanel(index, behavior = 'smooth') {
    if (behavior === 'auto') {
      jumpToPanel(index);
      return;
    }

    animateToPanel(index);
  }

  if (contentArea && contentPanels.length > 0) {
    contentArea.addEventListener('scroll', syncPanelFromScroll, { passive: true });
    contentArea.addEventListener('wheel', handleWheel, { passive: false });
    contentArea.addEventListener('touchstart', handleTouchStart, { passive: true });
    contentArea.addEventListener('touchend', handleTouchEnd, { passive: true });

    window.addEventListener('resize', () => {
      scrollToPanel(activePanelIndex, 'auto');
    });
  }

  function clearArrowStates(...arrowList) {
    arrowList.forEach(arrow => {
      if (!arrow) return;
      arrow.classList.remove('is-pressed', 'is-hovered', 'is-clicked');
      const timer = clickFeedbackTimers.get(arrow);
      if (timer) {
        window.clearTimeout(timer);
        clickFeedbackTimers.delete(arrow);
      }
    });
  }

  function flashArrowClick(arrow) {
    if (!arrow) return;
    const existingTimer = clickFeedbackTimers.get(arrow);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      clickFeedbackTimers.delete(arrow);
    }

    // Force-restart the animation cleanly
    arrow.classList.remove('is-clicked');
    void arrow.offsetWidth;
    arrow.classList.add('is-clicked');

    function onAnimEnd() {
      arrow.classList.remove('is-clicked');
      clickFeedbackTimers.delete(arrow);
    }
    arrow.addEventListener('animationend', onAnimEnd, { once: true });

    // Fallback in case animationend doesn't fire
    const timerId = window.setTimeout(() => {
      arrow.removeEventListener('animationend', onAnimEnd);
      arrow.classList.remove('is-clicked');
      clickFeedbackTimers.delete(arrow);
    }, 400);
    clickFeedbackTimers.set(arrow, timerId);
  }

  function setupArrowInteractionFeedback(arrow) {
    if (!arrow) return;
    let pointerLeftAfterDown = false;

    arrow.addEventListener('pointerenter', (event) => {
      pointerLeftAfterDown = false;
      if (event.pointerType === 'mouse') {
        arrow.classList.add('is-hovered');
      }
    });

    arrow.addEventListener('pointerleave', () => {
      pointerLeftAfterDown = true;
      arrow.classList.remove('is-hovered', 'is-pressed');
    });

    arrow.addEventListener('pointerdown', (event) => {
      pointerLeftAfterDown = false;
      arrow.classList.add('is-pressed');
      // Release implicit pointer capture so pointerleave fires normally on drag-away
      arrow.releasePointerCapture(event.pointerId);
    });

    arrow.addEventListener('pointerup', (event) => {
      arrow.classList.remove('is-pressed');
      if (event.pointerType !== 'mouse') {
        // Mobile browsers can retain sticky hover-like visuals; force clear on release
        arrow.classList.remove('is-hovered');
      }
      // Only pulse if the pointer never left (i.e. clean tap, not a drag-release)
      if (!pointerLeftAfterDown) {
        flashArrowClick(arrow);
      }
    });

    arrow.addEventListener('pointercancel', () => {
      pointerLeftAfterDown = true;
      arrow.classList.remove('is-pressed', 'is-hovered');
    });
  }

  setupArrowInteractionFeedback(navArrowLeft);
  setupArrowInteractionFeedback(navArrowRight);

  if (navArrowLeft) {
    navArrowLeft.addEventListener('click', () => {
      if (!loweredState) return;
      stepPanel(-1);
    });
  }

  if (navArrowRight) {
    navArrowRight.addEventListener('click', () => {
      if (!loweredState) return;
      stepPanel(1);
    });
  }

  updateContentTitle(activePanelIndex);


  function updateVideoPlaybackAndBlurAndArrows() {
    // Calculate scroll ratio
    const scrollY = window.scrollY;
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const scrollRatio = scrollHeight > 0 ? scrollY / scrollHeight : 0;
    const reverseRatio = 1 - scrollRatio;
    loweredState = scrollRatio >= 1;
    console.log('scrollRatio:', scrollRatio, 'reverseRatio:', reverseRatio);

    handleVideoScrollAnimation(video, blurOverlay, scrollRatio, reverseRatio);
    handleArrowScrollAnimation(arrows, scrollRatio, reverseRatio);

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
