// pixel-demo.js
// Uses cursor-old.png (actual Windows 95 bitmap cursor) and
// cursor-new.svg (actual Windows 10 Aero cursor shape) as img elements.

function buildCursorEl() {
  // Both cursors display at 32px wide — real OS cursor size
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:32px;height:50px;';

  const pixelImg = document.createElement('img');
  pixelImg.id = 'cursor-pixel';
  pixelImg.src = 'cursor-old.png';
  pixelImg.setAttribute('alt', '');
  // image-rendering:pixelated keeps the bitmap crisp (no blur when scaled)
  pixelImg.style.cssText = 'position:absolute;top:0;left:0;width:32px;height:32px;image-rendering:pixelated;max-width:none;';

  const smoothImg = document.createElement('img');
  smoothImg.id = 'cursor-smooth';
  smoothImg.src = 'cursor-new.svg';
  smoothImg.setAttribute('alt', '');
  // Win10 Aero viewBox is ~36.67×56.16 — at 32px wide that's ~49px tall
  smoothImg.style.cssText = 'position:absolute;top:0;left:0;width:32px;height:auto;opacity:0;transition:opacity 0.55s ease;max-width:none;';

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
