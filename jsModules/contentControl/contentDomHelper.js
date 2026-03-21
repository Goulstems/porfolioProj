export function getPanelWidth(contentArea) {
  return contentArea.clientWidth || window.innerWidth;
}

export function clampPanelIndex(index, panelCount) {
  return Math.max(0, Math.min(index, panelCount - 1));
}

export function isArrowNavVisible(arrowNav) {
  if (!arrowNav) return false;
  const styles = window.getComputedStyle(arrowNav);
  return styles.display !== 'none' && Number.parseFloat(styles.opacity || '1') > 0.01;
}

export function updateContentTitle(contentTitle, contentPanels, index) {
  if (!contentTitle) return;
  const title = contentPanels[index]?.dataset.title;
  if (title) {
    contentTitle.textContent = title;
  }
}

export function updateCarouselDots(carouselDots, index) {
  if (carouselDots.length === 0) return;
  carouselDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === index);
  });
}
