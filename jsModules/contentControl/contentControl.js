import { animateToPanel, scrollToPanel, syncPanelFromScroll } from './contentAnimationHelper.js';
import { isArrowNavVisible, clampPanelIndex, updateCarouselDots, updateContentTitle } from './contentDomHelper.js';
import { createNavArrowFeedback } from './navArrowFeedbackHelper.js';

const CAROUSEL_DURATION_MS = 450;
const WHEEL_STEP_COOLDOWN_MS = 280;
const SWIPE_THRESHOLD_PX = 40;
const NAV_INTERACTION_COOLDOWN_MS = 250;
const NAV_PULSE_DURATION_MS = 600;

window.addEventListener('DOMContentLoaded', () => {
  const arrowNav = document.getElementById('arrow-nav');
  const contentTitle = document.getElementById('contentTitle');
  const contentArea = document.getElementById('contentArea');
  const contentPanels = contentArea ? Array.from(contentArea.querySelectorAll('.content-panel')) : [];
  const carouselDots = Array.from(document.querySelectorAll('.carousel-dot'));
  const navArrowLeft = document.querySelector('.nav-arrow-left');
  const navArrowRight = document.querySelector('.nav-arrow-right');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!contentArea || contentPanels.length === 0) return;

  const elements = {
    arrowNav,
    contentTitle,
    contentArea,
    contentPanels,
    carouselDots,
    navArrowLeft,
    navArrowRight
  };
  const state = {
    activePanelIndex: 0,
    isProgrammaticScroll: false,
    animationFrameId: null,
    titleSwapTimeoutId: null
  };
  const animationOptions = {
    prefersReducedMotion,
    carouselDurationMs: CAROUSEL_DURATION_MS
  };

  let lastWheelStepTs = 0;
  let touchStartX = 0;
  let touchStartIndex = 0;

  function canInteractWithCarousel() {
    return isArrowNavVisible(arrowNav);
  }

  const { clearArrowStates, pulseNavArrowForDirection, setupArrowInteractionFeedback } = createNavArrowFeedback({
    navArrowLeft,
    navArrowRight,
    canInteractWithCarousel,
    onNavigate: (direction) => stepPanel(direction),
    pulseDurationMs: NAV_PULSE_DURATION_MS,
    interactionCooldownMs: NAV_INTERACTION_COOLDOWN_MS
  });

  function finishPanelAnimation() {
    clearArrowStates(navArrowLeft, navArrowRight);
  }

  function stepPanel(direction) {
    const nextIndex = clampPanelIndex(state.activePanelIndex + direction, contentPanels.length);
    animateToPanel(elements, state, animationOptions, nextIndex, finishPanelAnimation);
  }

  function handleTouchStart(event) {
    if (!canInteractWithCarousel() || event.touches.length === 0) return;
    touchStartX = event.touches[0].clientX;
    touchStartIndex = state.activePanelIndex;
  }

  function handleTouchEnd(event) {
    if (!canInteractWithCarousel() || event.changedTouches.length === 0) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      animateToPanel(elements, state, animationOptions, state.activePanelIndex, finishPanelAnimation);
      return;
    }

    const direction = deltaX < 0 ? 1 : -1;
    const targetIndex = clampPanelIndex(touchStartIndex + direction, contentPanels.length);
    if (targetIndex !== touchStartIndex) {
      pulseNavArrowForDirection(direction);
    }
    animateToPanel(elements, state, animationOptions, targetIndex, finishPanelAnimation);
  }

  function handleWheel(event) {
    if (!canInteractWithCarousel()) return;
    const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const dominantDelta = horizontalIntent ? event.deltaX : event.deltaY;
    if (Math.abs(dominantDelta) < 8) return;

    event.preventDefault();
    const now = performance.now();
    if (now - lastWheelStepTs < WHEEL_STEP_COOLDOWN_MS) return;

    lastWheelStepTs = now;
    const direction = dominantDelta > 0 ? 1 : -1;
    const targetIndex = clampPanelIndex(state.activePanelIndex + direction, contentPanels.length);
    if (targetIndex !== state.activePanelIndex) {
      pulseNavArrowForDirection(direction);
    }
    stepPanel(direction);
  }

  contentArea.addEventListener('scroll', () => {
    syncPanelFromScroll(elements, state, animationOptions);
  }, { passive: true });
  contentArea.addEventListener('wheel', handleWheel, { passive: false });
  contentArea.addEventListener('touchstart', handleTouchStart, { passive: true });
  contentArea.addEventListener('touchend', handleTouchEnd, { passive: true });

  window.addEventListener('resize', () => {
    scrollToPanel(elements, state, animationOptions, state.activePanelIndex, 'auto');
  });

  setupArrowInteractionFeedback(navArrowLeft, -1);
  setupArrowInteractionFeedback(navArrowRight, 1);

  updateContentTitle(contentTitle, contentPanels, state.activePanelIndex);
  updateCarouselDots(carouselDots, state.activePanelIndex);
});