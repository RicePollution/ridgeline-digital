// pixel-demo.js
// Uses cursor-old.png (actual Windows 95 bitmap cursor) and
// cursor-new.svg (actual Windows 10 Aero cursor shape) as img elements.

function buildCursorEl() {
  // Fixed 40×40 box for both cursors — hotspot (top-left tip) stays aligned
  const SZ = '40px';
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:relative;width:${SZ};height:${SZ};`;

  const pixelImg = document.createElement('img');
  pixelImg.id = 'cursor-pixel';
  pixelImg.src = 'cursor-old.png';
  pixelImg.setAttribute('alt', '');
  pixelImg.style.cssText = `position:absolute;top:0;left:0;width:${SZ};height:${SZ};object-fit:contain;object-position:top left;image-rendering:pixelated;max-width:none;transition:opacity 0.55s ease;`;

  const smoothImg = document.createElement('img');
  smoothImg.id = 'cursor-smooth';
  smoothImg.src = 'cursor-new.svg';
  smoothImg.setAttribute('alt', '');
  smoothImg.style.cssText = `position:absolute;top:0;left:0;width:${SZ};height:${SZ};object-fit:contain;object-position:top left;opacity:0;transition:opacity 0.55s ease;max-width:none;`;

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

function resetAnimation(cursor, oldSite, newSite) {
  // Strip all animation classes and inline overrides so it can replay cleanly
  cursor.className = 'pixel-cursor';
  cursor.style.top = '';
  cursor.style.left = '';
  oldSite.style.filter = '';
  oldSite.style.transition = '';
  oldSite.style.opacity = '';
  newSite.style.opacity = '';
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

  function play() {
    resetAnimation(cursorEl, oldSite, newSite);
    runAnimation(cursorEl, oldSite, newSite);
    // Re-attach observer after animation finishes (is-gone exits at ~5600ms)
    setTimeout(attach, 6200);
  }

  function attach() {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        play();
      }
    }, { threshold: 0.3 });
    obs.observe(section);
  }

  attach();
}

init();
