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

function initPixelCursor() {
  const cursorEl = document.getElementById('pixelCursor');
  if (!cursorEl) return;
  cursorEl.appendChild(buildCursorSVG());
}

initPixelCursor();
