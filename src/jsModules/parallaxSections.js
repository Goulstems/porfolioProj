window.addEventListener('scroll', () => {
  const heroBg = document.querySelector('.bg-local-wrapper');
  const about = document.querySelector('.about-me');
  const work = document.querySelector('.work-experience');
  const scrollY = window.scrollY;

  // Parallax factors (furthest = video, closer = about, closest = work)
  const heroFactor = 0.05; // least movement
  const aboutFactor = 0.15; // medium movement
  const workFactor = 0.25; // most movement

  if (heroBg) {
    heroBg.style.transform = `translateY(${scrollY * heroFactor}px)`;
  }
  if (about) {
    about.style.transform = `translateY(${scrollY * aboutFactor}px)`;
  }
  if (work) {
    work.style.transform = `translateY(${scrollY * workFactor}px)`;
  }
});
