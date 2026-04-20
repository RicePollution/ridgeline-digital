// pixel-demo.js
const PIXEL_MAP = [
  'b         ',
  'bb        ',
  'bwb       ',
  'bwwb      ',
  'bwwwb     ',
  'bwwwwb    ',
  'bwwwwwb   ',
  'bwwwwwwb  ',
  'bwwwwwwwb ',
  'bwwwwwwwwb',
  'bbbbbbbbbb',
];

const PX = 5;
const SVG_NS = 'http://www.w3.org/2000/svg';

function makeEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function buildCursorSVG() {
  const cols = PIXEL_MAP[0].length;
  const rows = PIXEL_MAP.length;
  const svg = makeEl('svg', {
    width: cols * PX,
    height: rows * PX,
    viewBox: '0 0 ' + (cols * PX) + ' ' + (rows * PX),
    'shape-rendering': 'crispEdges',
  });

  const pixelG = makeEl('g', { id: 'cursor-pixel' });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = PIXEL_MAP[r][c];
      if (ch !== 'b' && ch !== 'w') continue;
      pixelG.appendChild(makeEl('rect', {
        x: c * PX, y: r * PX, width: PX, height: PX,
        fill: ch === 'b' ? '#000' : '#fff',
      }));
    }
  }
  svg.appendChild(pixelG);

  const smoothG = makeEl('g', { id: 'cursor-smooth', opacity: '0' });
  const path = makeEl('path', {
    d: 'M2 2 L2 36 L11 27 L17 42 L23 39 L17 24 L28 24 Z',
    fill: 'white',
    stroke: '#111',
    'stroke-width': '2.5',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  smoothG.appendChild(path);
  svg.appendChild(smoothG);

  return svg;
}

function runAnimation(cursor, oldSite, newSite) {
  // 400ms: cursor slides in from left
  setTimeout(() => cursor.classList.add('is-entering'), 400);

  // 1100ms: nudge cursor down toward old site
  setTimeout(() => {
    cursor.style.top = '52%';
    cursor.style.left = '42%';
  }, 1100);

  // 1400ms: click pulse
  setTimeout(() => cursor.classList.add('is-clicking'), 1400);

  // 1550ms: remove click, start glitch on old site
  setTimeout(() => {
    cursor.classList.remove('is-clicking');
    oldSite.style.filter = 'saturate(5) contrast(3) hue-rotate(80deg)';
    oldSite.style.transition = 'filter 0.15s ease, opacity 0.4s ease 0.15s';
  }, 1550);

  // 1700ms: swap previews
  setTimeout(() => {
    oldSite.style.opacity = '0';
    newSite.style.opacity = '1';
  }, 1700);

  // 1900ms: cursor morphs to smooth
  setTimeout(() => cursor.classList.add('is-modern'), 1900);

  // 2400ms: cursor exits
  setTimeout(() => cursor.classList.add('is-gone'), 2400);
}

function skipToFinal(oldSite, newSite) {
  oldSite.style.opacity = '0';
  newSite.style.opacity = '1';
}

function init() {
  const cursorEl = document.getElementById('pixelCursor');
  if (!cursorEl) return;
  cursorEl.appendChild(buildCursorSVG());

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
