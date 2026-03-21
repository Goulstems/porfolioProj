import {
  clampPanelIndex,
  getPanelWidth,
  updateCarouselDots,
  updateContentTitle
} from './contentDomHelper.js';

export function animateTitleToIndex(elements, state, options, nextIndex, direction) {
  const { contentTitle, contentPanels } = elements;
  const { prefersReducedMotion, carouselDurationMs } = options;
  if (!contentTitle) return;

  const nextTitle = contentPanels[nextIndex]?.dataset.title;
  if (!nextTitle || contentTitle.textContent === nextTitle) return;

  if (state.titleSwapTimeoutId) {
    window.clearTimeout(state.titleSwapTimeoutId);
    state.titleSwapTimeoutId = null;
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
      duration: carouselDurationMs / 2,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    }
  );

  state.titleSwapTimeoutId = window.setTimeout(() => {
    contentTitle.textContent = nextTitle;
    contentTitle.animate(
      [
        { opacity: 0, transform: `translateX(${inOffset}px)` },
        { opacity: 1, transform: 'translateX(0px)' }
      ],
      {
        duration: carouselDurationMs / 2,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      }
    );
    state.titleSwapTimeoutId = null;
  }, carouselDurationMs / 2);
}

export function jumpToPanel(elements, state, index) {
  const { contentArea, contentPanels, contentTitle, carouselDots } = elements;
  const nextIndex = clampPanelIndex(index, contentPanels.length);
  const panelWidth = getPanelWidth(contentArea);

  contentArea.scrollTo({ left: nextIndex * panelWidth, behavior: 'auto' });
  state.activePanelIndex = nextIndex;
  updateContentTitle(contentTitle, contentPanels, state.activePanelIndex);
  updateCarouselDots(carouselDots, state.activePanelIndex);
}

export function animateToPanel(elements, state, options, index, onComplete) {
  const { contentArea, contentPanels, carouselDots } = elements;
  const { prefersReducedMotion, carouselDurationMs } = options;
  const nextIndex = clampPanelIndex(index, contentPanels.length);

  if (nextIndex === state.activePanelIndex) {
    jumpToPanel(elements, state, nextIndex);
    return;
  }

  if (prefersReducedMotion) {
    jumpToPanel(elements, state, nextIndex);
    return;
  }

  if (state.animationFrameId) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  const direction = nextIndex > state.activePanelIndex ? 1 : -1;
  const panelWidth = getPanelWidth(contentArea);
  const startLeft = contentArea.scrollLeft;
  const targetLeft = nextIndex * panelWidth;
  const startTime = performance.now();

  animateTitleToIndex(elements, state, options, nextIndex, direction);
  state.isProgrammaticScroll = true;

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.max(0, Math.min(1, elapsed / carouselDurationMs));
    const eased = 1 - Math.pow(1 - t, 3);
    contentArea.scrollLeft = startLeft + (targetLeft - startLeft) * eased;

    if (t < 1) {
      state.animationFrameId = window.requestAnimationFrame(step);
      return;
    }

    contentArea.scrollLeft = targetLeft;
    state.animationFrameId = null;
    state.isProgrammaticScroll = false;
    state.activePanelIndex = nextIndex;
    if (onComplete) {
      onComplete();
    }
  }

  state.animationFrameId = window.requestAnimationFrame(step);
  state.activePanelIndex = nextIndex;
  updateCarouselDots(carouselDots, state.activePanelIndex);
}

export function syncPanelFromScroll(elements, state, options) {
  const { contentArea, contentPanels, carouselDots } = elements;
  if (state.isProgrammaticScroll) return;

  const panelWidth = getPanelWidth(contentArea);
  if (panelWidth === 0) return;

  const nextIndex = clampPanelIndex(
    Math.round(contentArea.scrollLeft / panelWidth),
    contentPanels.length
  );

  if (nextIndex !== state.activePanelIndex) {
    const direction = nextIndex > state.activePanelIndex ? 1 : -1;
    animateTitleToIndex(elements, state, options, nextIndex, direction);
    state.activePanelIndex = nextIndex;
    updateCarouselDots(carouselDots, state.activePanelIndex);
  }
}

export function scrollToPanel(elements, state, options, index, behavior = 'smooth') {
  if (behavior === 'auto') {
    jumpToPanel(elements, state, index);
    return;
  }

  animateToPanel(elements, state, options, index);
}
