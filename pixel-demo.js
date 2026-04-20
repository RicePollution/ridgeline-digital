// pixel-demo.js
// Uses cursor-old.svg (authentic Win95 pixel-art cursor) and
// cursor-new.svg (smooth macOS-style cursor) as img elements.

function buildCursorEl() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:40px;height:64px;';

  const pixelImg = document.createElement('img');
  pixelImg.id = 'cursor-pixel';
  pixelImg.src = 'cursor-old.svg';
  pixelImg.setAttribute('width', '40');
  pixelImg.setAttribute('height', '64');
  pixelImg.setAttribute('alt', '');
  // image-rendering:pixelated keeps the bitmap sharp when CSS scales it up
  pixelImg.style.cssText = 'position:absolute;inset:0;image-rendering:pixelated;';

  const smoothImg = document.createElement('img');
  smoothImg.id = 'cursor-smooth';
  smoothImg.src = 'cursor-new.svg';
  smoothImg.setAttribute('width', '40');
  smoothImg.setAttribute('height', '64');
  smoothImg.setAttribute('alt', '');
  smoothImg.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity 0.55s ease;';

  wrap.appendChild(pixelImg);
  wrap.appendChild(smoothImg);
  return wrap;
}

function runAnimation(cursor, oldSite, newSite) {
  // 600ms: cursor slides in from left
  setTimeout(() => cursor.classList.add('is-entering'), 600);

  // 1800ms: nudge cursor down toward old site
  setTimeout(() => {
    cursor.style.top = '52%';
    cursor.style.left = '42%';
  }, 1800);

  // 2300ms: click pulse
  setTimeout(() => cursor.classList.add('is-clicking'), 2300);

  // 2500ms: remove click, start glitch on old site
  setTimeout(() => {
    cursor.classList.remove('is-clicking');
    oldSite.style.filter = 'saturate(5) contrast(3) hue-rotate(80deg)';
    oldSite.style.transition = 'filter 0.2s ease, opacity 0.5s ease 0.2s';
  }, 2500);

  // 2750ms: swap previews
  setTimeout(() => {
    oldSite.style.opacity = '0';
    newSite.style.opacity = '1';
  }, 2750);

  // 3200ms: cursor morphs to smooth
  setTimeout(() => cursor.classList.add('is-modern'), 3200);

  // 4400ms: cursor exits — clear inline position first so is-gone CSS can drive the transition
  setTimeout(() => {
    cursor.style.top = '';
    cursor.style.left = '';
    cursor.classList.add('is-gone');
  }, 4400);
}

function skipToFinal(oldSite, newSite) {
  oldSite.style.opacity = '0';
  newSite.style.opacity = '1';
}

function init() {
  const cursorEl = document.getElementById('pixelCursor');
  if (!cursorEl) return;
  cursorEl.appendChild(buildCursorEl());

  const section = document.querySelector('.pixel-demo');
  const oldSite = document.querySelector('.site-preview--old');
  const newSite = document.querySelector('.site-preview--new');
  if (!section || !oldSite || !newSite) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    skipToFinal(oldSite, newSite);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      runAnimation(cursorEl, oldSite, newSite);
    }
  }, { threshold: 0.3 });

  observer.observe(section);
}

init();
