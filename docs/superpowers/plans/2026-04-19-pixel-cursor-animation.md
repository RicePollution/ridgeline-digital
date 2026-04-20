# Pixel Cursor Before/After Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scroll-triggered "before/after" section between the marquee and the About section on the landing page, featuring a pixelated cursor that flies in, clicks a dated site preview, transforms both into modern versions, then exits.

**Architecture:** Pure vanilla HTML/CSS/JS. The section HTML lives in `index.html`. All styles go in `styles.css`. Animation logic lives in a new `pixel-demo.js` (loaded as a regular script). The pixel cursor is built using `createElementNS` SVG DOM APIs (no innerHTML). An IntersectionObserver fires the animation chain once on scroll.

**Tech Stack:** Vanilla JS, CSS transitions/keyframes, SVG DOM APIs, IntersectionObserver

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Modify | Add `.pixel-demo` section HTML; add `<script src="pixel-demo.js">` |
| `styles.css` | Modify | Add all `.pixel-demo`, `.site-preview`, `.pixel-cursor` styles |
| `pixel-demo.js` | Create | Cursor SVG generation + animation sequence |

---

### Task 1: Add section HTML skeleton to index.html

**Files:**
- Modify: `index.html` (between the `.marquee` div and the About `<section class="section section--light">`)

- [ ] **Step 1: Insert the section HTML**

  In `index.html`, between the closing `</div>` of `.marquee` and the opening `<section class="section section--light">` of About, insert:

  ```html
  <!-- PIXEL DEMO -->
  <section class="section section--dark pixel-demo">
    <div class="container">
      <div class="pixel-demo__text">
        <p class="section__eyebrow reveal">The Reality</p>
        <h2 class="section__heading reveal reveal--delay-1">Modern businesses<br>need a modern website.</h2>
      </div>
      <div class="pixel-demo__stage" aria-hidden="true">
        <div class="site-preview">
          <div class="site-preview--old">
            <div class="sp-old__chrome">
              <span class="sp-old__chrome-dot"></span>
              <span class="sp-old__chrome-dot"></span>
              <span class="sp-old__chrome-dot"></span>
              <span class="sp-old__url">www.bestplumber4u.com/home.htm</span>
            </div>
            <div class="sp-old__body">
              <div class="sp-old__header">BOB'S PLUMBING SERVICE!!</div>
              <div class="sp-old__marquee-wrap">
                <span class="sp-old__marquee-text">&#9733; CALL NOW FOR FREE ESTIMATES &#9733; SERVING THE TRI-COUNTY AREA &#9733; 25 YEARS EXPERIENCE &#9733; LICENSED &amp; INSURED &#9733;</span>
              </div>
              <div class="sp-old__rainbow-hr"></div>
              <p class="sp-old__welcome">Welcome to our website!! We offer quality plumbing at affordable prices. Click the links below to learn more!!</p>
              <span class="sp-old__btn">CLICK HERE for a FREE quote!!</span>
              <p class="sp-old__blink">&#9888;&#65039; SITE UNDER CONSTRUCTION &#9888;&#65039;</p>
              <p class="sp-old__counter">You are visitor #000423</p>
            </div>
          </div>

          <div class="site-preview--new">
            <div class="sp-new__chrome">
              <span class="sp-new__chrome-dot"></span>
              <span class="sp-new__chrome-dot"></span>
              <span class="sp-new__chrome-dot"></span>
              <span class="sp-new__url">bobsplumbing.com</span>
            </div>
            <div class="sp-new__body">
              <nav class="sp-new__nav">
                <span class="sp-new__logo">Bob's Plumbing</span>
                <span class="sp-new__nav-link">Services</span>
                <span class="sp-new__nav-cta">Get a Quote</span>
              </nav>
              <div class="sp-new__hero">
                <p class="sp-new__eyebrow">Denver Metro &middot; Licensed &amp; Insured</p>
                <h3 class="sp-new__headline">Denver's Trusted Plumber</h3>
                <p class="sp-new__sub">Fast, reliable service &mdash; 25 years in the trade.</p>
                <button class="sp-new__btn">Get a Free Quote &rarr;</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cursor actor — SVG built and injected by pixel-demo.js -->
        <div class="pixel-cursor" id="pixelCursor"></div>

      </div>
    </div>
  </section>
  ```

- [ ] **Step 2: Verify skeleton renders**

  Open `index.html` in browser. Scroll past the marquee — a dark section should appear with the eyebrow "The Reality" and heading "Modern businesses need a modern website." Both site previews and the empty cursor div exist in the DOM (unstyled).

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add pixel-demo section HTML skeleton"
  ```

---

### Task 2: Style the section wrapper and stage

**Files:**
- Modify: `styles.css` (append after existing styles, before `@media` queries)

- [ ] **Step 1: Add section and stage CSS**

  ```css
  /* ─── PIXEL DEMO SECTION ─── */
  .pixel-demo { padding-bottom: 80px; }

  .pixel-demo__text { margin-bottom: 52px; }

  .pixel-demo__stage {
    position: relative;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    height: 340px;
  }

  .site-preview {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.55);
  }
  ```

- [ ] **Step 2: Verify**

  Reload browser. The stage area is ~520px wide and centered, with a fixed 340px height. Both site previews stack inside it.

- [ ] **Step 3: Commit**

  ```bash
  git add styles.css
  git commit -m "feat: add pixel-demo stage layout styles"
  ```

---

### Task 3: Style the old site preview

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append old site styles to the pixel-demo block**

  ```css
  /* --- Site preview base --- */
  .site-preview--old,
  .site-preview--new {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    transition: opacity 0.4s ease;
  }

  .site-preview--new { opacity: 0; }

  /* --- Old site --- */
  .sp-old__chrome {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    background: #c0c0c0;
    border-bottom: 2px solid #808080;
    font-family: Arial, sans-serif;
    font-size: 10px;
    color: #000;
  }
  .sp-old__chrome-dot {
    display: inline-block;
    width: 10px; height: 10px;
    background: #a0a0a0;
    border: 2px solid;
    border-color: #dfdfdf #808080 #808080 #dfdfdf;
  }
  .sp-old__url {
    margin-left: 4px;
    flex: 1;
    background: #fff;
    border: 1px solid #808080;
    padding: 1px 4px;
    overflow: hidden;
    white-space: nowrap;
    font-size: 9px;
  }

  .sp-old__body {
    flex: 1;
    background: #c0c0c0;
    padding: 10px 12px;
    overflow: hidden;
    font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif;
  }

  .sp-old__header {
    font-size: 17px;
    font-weight: bold;
    color: #00008b;
    text-align: center;
    text-shadow: 2px 2px #ff0, -1px -1px #f00;
    margin-bottom: 4px;
  }

  .sp-old__marquee-wrap {
    overflow: hidden;
    white-space: nowrap;
    background: #000080;
    color: #ffff00;
    font-size: 9px;
    padding: 2px 0;
  }
  .sp-old__marquee-text {
    display: inline-block;
    animation: sp-marquee 12s linear infinite;
  }
  @keyframes sp-marquee {
    from { transform: translateX(100%); }
    to   { transform: translateX(-100%); }
  }

  .sp-old__rainbow-hr {
    height: 4px;
    margin: 6px 0;
    background: linear-gradient(to right,
      red, orange, yellow, green, blue, indigo, violet);
  }

  .sp-old__welcome {
    font-size: 10px;
    color: #000;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .sp-old__btn {
    display: inline-block;
    font-family: Arial, sans-serif;
    font-size: 9px;
    background: #c0c0c0;
    color: #000;
    border: 2px solid;
    border-color: #fff #808080 #808080 #fff;
    padding: 3px 8px;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .sp-old__blink {
    font-size: 10px;
    font-weight: bold;
    color: #ff0000;
    text-align: center;
    animation: sp-blink 0.9s step-start infinite;
  }
  @keyframes sp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .sp-old__counter {
    font-size: 9px;
    color: #444;
    text-align: right;
    margin-top: 6px;
  }
  ```

- [ ] **Step 2: Verify**

  Reload. The stage shows a recognizably dated site: gray `#c0c0c0` background, Windows-bevel chrome bar, garish blue header with shadow, scrolling yellow-on-navy marquee, rainbow divider, Comic Sans body text, bevel-bordered button, red blinking warning text.

- [ ] **Step 3: Commit**

  ```bash
  git add styles.css
  git commit -m "feat: style old-site preview"
  ```

---

### Task 4: Style the new site preview

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append new site styles**

  ```css
  /* --- New site --- */
  .sp-new__chrome {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    font-family: system-ui, sans-serif;
    font-size: 10px;
    color: #555;
  }
  .sp-new__chrome-dot {
    display: inline-block;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #ddd;
  }
  .sp-new__chrome-dot:nth-child(1) { background: #ff5f57; }
  .sp-new__chrome-dot:nth-child(2) { background: #febc2e; }
  .sp-new__chrome-dot:nth-child(3) { background: #28c840; }
  .sp-new__url {
    margin-left: 6px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 9px;
    color: #333;
  }

  .sp-new__body {
    flex: 1;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sp-new__nav {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    border-bottom: 1px solid #f0f0f0;
    font-family: system-ui, sans-serif;
    font-size: 10px;
  }
  .sp-new__logo {
    font-weight: 700;
    font-size: 11px;
    color: #111;
    margin-right: auto;
  }
  .sp-new__nav-link { color: #555; }
  .sp-new__nav-cta {
    background: #111;
    color: #fff;
    padding: 3px 9px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 9px;
  }

  .sp-new__hero {
    flex: 1;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-family: system-ui, sans-serif;
  }
  .sp-new__eyebrow {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #3dd68c;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .sp-new__headline {
    font-size: 22px;
    font-weight: 800;
    color: #111;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .sp-new__sub {
    font-size: 10px;
    color: #666;
    margin-bottom: 14px;
    line-height: 1.5;
  }
  .sp-new__btn {
    display: inline-block;
    background: #111;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    align-self: flex-start;
  }
  ```

- [ ] **Step 2: Temporarily force new site visible in DevTools to verify**

  In browser DevTools console:
  ```javascript
  document.querySelector('.site-preview--new').style.opacity = '1'
  ```
  Should show: macOS traffic-light chrome dots, clean white body, minimal nav, green eyebrow, bold sans-serif headline, gray subtitle, dark CTA button.

- [ ] **Step 3: Commit**

  ```bash
  git add styles.css
  git commit -m "feat: style new-site preview"
  ```

---

### Task 5: Build the pixel cursor with SVG DOM APIs

**Files:**
- Create: `pixel-demo.js`
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Create `pixel-demo.js`**

  ```javascript
  // pixel-demo.js
  // Pixel art cursor: b=black border, w=white fill, space=transparent
  // 10 cols x 11 rows at 5px/pixel => 50x55px SVG
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

    // Pixel group
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

    // Smooth cursor group (hidden by default)
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
    const el = document.getElementById('pixelCursor');
    if (!el) return;
    el.appendChild(buildCursorSVG());
  }

  initPixelCursor();
  ```

- [ ] **Step 2: Append cursor CSS to the pixel-demo block in `styles.css`**

  ```css
  /* --- Pixel cursor actor --- */
  .pixel-cursor {
    position: absolute;
    top: 30%;
    left: -80px;
    opacity: 0;
    transform: rotate(-12deg);
    pointer-events: none;
    z-index: 10;
    transition:
      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.5s ease,
      left 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      top 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity, left, top;
  }

  .pixel-cursor.is-entering {
    left: 38%;
    top: 18%;
    opacity: 1;
    transform: rotate(-6deg);
  }

  .pixel-cursor.is-clicking {
    transform: rotate(-6deg) scale(0.82);
    transition: transform 0.12s ease;
  }

  .pixel-cursor.is-modern #cursor-pixel { display: none; }
  .pixel-cursor.is-modern #cursor-smooth { opacity: 1 !important; }
  .pixel-cursor.is-modern {
    transform: rotate(0deg);
    transition:
      transform 0.4s ease,
      opacity 0.5s ease,
      left 0.5s ease,
      top 0.5s ease;
  }

  .pixel-cursor.is-gone {
    left: 110%;
    top: -10%;
    opacity: 0;
    transition:
      left 0.55s cubic-bezier(0.55, 0, 1, 0.45),
      top 0.55s cubic-bezier(0.55, 0, 1, 0.45),
      opacity 0.4s ease 0.2s;
  }
  ```

- [ ] **Step 3: Add `<script src="pixel-demo.js">` to `index.html`**

  At the bottom of `<body>`, after `<script type="module" src="laptop-3d.js">`:

  ```html
  <script src="pixel-demo.js"></script>
  ```

- [ ] **Step 4: Verify cursor renders**

  Reload browser. In DevTools console:
  ```javascript
  document.getElementById('pixelCursor').classList.add('is-entering')
  ```
  Should see a 50×55px chunky pixel-art arrow cursor (black outline, white fill) floating over the stage at ~6deg rotation.

- [ ] **Step 5: Commit**

  ```bash
  git add pixel-demo.js styles.css index.html
  git commit -m "feat: add pixel cursor SVG builder and CSS states"
  ```

---

### Task 6: Wire up the animation sequence

**Files:**
- Modify: `pixel-demo.js`

- [ ] **Step 1: Replace `pixel-demo.js` with the full animation version**

  ```javascript
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
  ```

- [ ] **Step 2: Verify full animation end-to-end**

  1. Reload browser.
  2. Scroll down until the pixel-demo section hits the viewport.
  3. Expected:
     - ~0.4s: chunky pixel cursor slides in from left at a slight tilt
     - ~1.1s: cursor moves toward the old site
     - ~1.4s: cursor pulses (click)
     - ~1.55s: old site briefly over-saturates/glitches
     - ~1.7s: old site fades out, clean modern site fades in
     - ~1.9s: cursor polygon swap — blocky version gone, smooth path visible
     - ~2.4s: cursor glides off to top-right and fades
  4. Refresh and scroll again — animation does not replay.

- [ ] **Step 3: Commit**

  ```bash
  git add pixel-demo.js
  git commit -m "feat: wire up pixel demo animation sequence with IntersectionObserver"
  ```

---

### Task 7: Mobile responsive adjustments

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add mobile styles inside the existing `@media (max-width: 640px)` block**

  If a `@media (max-width: 640px)` block already exists in `styles.css`, add these rules inside it. If not, append a new one:

  ```css
  @media (max-width: 640px) {
    .pixel-demo__stage { height: 280px; }
    .sp-old__header { font-size: 13px; }
    .sp-new__headline { font-size: 17px; }
    .pixel-cursor { transform: rotate(-12deg) scale(0.75); }
    .pixel-cursor.is-entering { transform: rotate(-6deg) scale(0.75); }
    .pixel-cursor.is-clicking { transform: rotate(-6deg) scale(0.65); }
    .pixel-cursor.is-modern  { transform: rotate(0deg) scale(0.75); }
  }
  ```

- [ ] **Step 2: Verify at 375px viewport**

  In DevTools device toolbar, set to 375px wide. Stage height is 280px. Both previews fill it. Cursor is smaller but still clearly visible and animates.

- [ ] **Step 3: Commit**

  ```bash
  git add styles.css
  git commit -m "feat: pixel-demo mobile responsive styles"
  ```

---

## Self-Review

**Spec coverage:**
- Placement after marquee, before About: Task 1
- Headline "Modern businesses need a modern website." + eyebrow: Task 1
- Pixelated cursor flies in rotated: Task 5 (CSS) + Task 6 (JS, t=400ms)
- Cursor clicks old site (pulse): Task 6 (t=1400ms)
- Old site looks dated: Task 3 (Comic Sans, bevel, marquee, rainbow HR, blink)
- Glitch transition: Task 6 (t=1550ms, CSS filter)
- New site reveals clean/modern: Task 4 (CSS) + Task 6 (t=1700ms)
- Cursor morphs from pixel to smooth: Task 5 (SVG groups) + Task 6 (t=1900ms)
- Cursor exits off-screen: Task 6 (t=2400ms)
- One-shot (observer disconnects): Task 6
- `aria-hidden` on stage: Task 1
- `prefers-reduced-motion` handled: Task 6 (`skipToFinal`)
- Mobile: Task 7

**Placeholder scan:** No TBDs. All steps include complete code.

**Type consistency:** `cursorEl` / `oldSite` / `newSite` consistent in Task 6. CSS classes `.is-entering`, `.is-clicking`, `.is-modern`, `.is-gone` match exactly between Task 5 CSS and Task 6 JS.
