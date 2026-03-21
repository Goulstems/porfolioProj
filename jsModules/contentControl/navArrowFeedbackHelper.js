export function createNavArrowFeedback(options) {
  const {
    navArrowLeft,
    navArrowRight,
    canInteractWithCarousel,
    onNavigate,
    pulseDurationMs,
    interactionCooldownMs
  } = options;

  let lastArrowNavInteractionTs = 0;
  const clickFeedbackTimers = new WeakMap();

  function clearArrowStates(...arrowList) {
    arrowList.forEach((arrow) => {
      if (!arrow) return;
      arrow.classList.remove('is-pressed', 'is-hovered', 'is-clicked');
      const timer = clickFeedbackTimers.get(arrow);
      if (timer) {
        window.clearTimeout(timer);
        clickFeedbackTimers.delete(arrow);
      }
    });
  }

  function pulseNavArrow(arrow) {
    if (!arrow) return;
    const existingTimer = clickFeedbackTimers.get(arrow);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      clickFeedbackTimers.delete(arrow);
    }

    arrow.classList.remove('is-clicked');
    void arrow.offsetWidth;
    arrow.classList.add('is-clicked');

    function onAnimEnd() {
      arrow.classList.remove('is-clicked');
      clickFeedbackTimers.delete(arrow);
    }

    arrow.addEventListener('animationend', onAnimEnd, { once: true });

    const timerId = window.setTimeout(() => {
      arrow.removeEventListener('animationend', onAnimEnd);
      arrow.classList.remove('is-clicked');
      clickFeedbackTimers.delete(arrow);
    }, pulseDurationMs + 200);
    clickFeedbackTimers.set(arrow, timerId);
  }

  function pulseNavArrowForDirection(direction) {
    pulseNavArrow(direction > 0 ? navArrowRight : navArrowLeft);
  }

  function triggerArrowNavigation(arrow, direction) {
    const now = performance.now();
    if (now - lastArrowNavInteractionTs < interactionCooldownMs) return;

    pulseNavArrow(arrow);
    if (!canInteractWithCarousel()) return;

    lastArrowNavInteractionTs = now;
    onNavigate(direction);
  }

  function setupArrowInteractionFeedback(arrow, direction) {
    if (!arrow) return;
    let pointerLeftAfterDown = false;
    let touchStarted = false;

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
      if (arrow.hasPointerCapture && arrow.hasPointerCapture(event.pointerId)) {
        arrow.releasePointerCapture(event.pointerId);
      }
    });

    arrow.addEventListener('pointerup', (event) => {
      arrow.classList.remove('is-pressed');
      if (event.pointerType !== 'mouse') {
        arrow.classList.remove('is-hovered');
      }
      if (!pointerLeftAfterDown) {
        triggerArrowNavigation(arrow, direction);
      }
    });

    arrow.addEventListener('pointercancel', () => {
      pointerLeftAfterDown = true;
      arrow.classList.remove('is-pressed', 'is-hovered');
    });

    arrow.addEventListener('touchstart', () => {
      touchStarted = true;
      arrow.classList.add('is-pressed');
    });

    arrow.addEventListener('touchend', () => {
      arrow.classList.remove('is-pressed', 'is-hovered');
      if (touchStarted) {
        triggerArrowNavigation(arrow, direction);
      }
      touchStarted = false;
    });
  }

  return {
    clearArrowStates,
    pulseNavArrowForDirection,
    setupArrowInteractionFeedback
  };
}
