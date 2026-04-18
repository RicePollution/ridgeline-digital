# Three.js Stylized Laptop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CSS 3D laptop in the About section with a Three.js scene featuring real lighting, metallic materials, and mouse-follow interactivity.

**Architecture:** A standalone ES module (`laptop-3d.js`) builds the Three.js scene and mounts it onto a `<canvas>` in the About section. `index.html` loads it via importmap. `styles.css` drops all `.laptop*` rules and adds canvas sizing. No bundler, no build step.

**Tech Stack:** Three.js r0.183.1 (CDN importmap), vanilla JS ES modules, plain HTML/CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `laptop-3d.js` | **Create** | All Three.js scene code: geometry, materials, lighting, animation, mouse interaction |
| `index.html` | **Modify** | Add importmap, replace `.laptop-scene` div with `<canvas id="laptop-canvas">`, add `<script type="module" src="laptop-3d.js">` |
| `styles.css` | **Modify** | Remove all `.laptop*` rules (~150 lines); add `.about__visual canvas` sizing |

---

## Task 1: Wire up the canvas and verify Three.js loads

**Files:**
- Create: `laptop-3d.js`
- Modify: `index.html` (add importmap + canvas + script tag)

- [ ] **Step 1: Add importmap and canvas to index.html**

In `index.html`, inside `<head>`, add the importmap **before** any other `<script>` tags:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js"
  }
}
</script>
```

Replace the entire `.about__visual` div contents (the `<div class="laptop-scene" id="laptop">` block and all children) with:

```html
<canvas id="laptop-canvas"></canvas>
```

At the bottom of `<body>`, after the existing `<script>` block, add:

```html
<script type="module" src="laptop-3d.js"></script>
```

- [ ] **Step 2: Create laptop-3d.js with a console hello**

```javascript
// laptop-3d.js
import * as THREE from 'three';

const canvas = document.getElementById('laptop-canvas');
if (!canvas) throw new Error('laptop-canvas not found');

console.log('Three.js loaded:', THREE.REVISION);
```

- [ ] **Step 3: Open index.html in a browser and verify**

Open `index.html` directly in a browser (or via a local server: `python3 -m http.server 8080`).

Open DevTools console. Expected output:
```
Three.js loaded: 163
```

No errors in console. The about section should show an empty space where the laptop was.

- [ ] **Step 4: Commit**

```bash
git add index.html laptop-3d.js
git commit -m "feat: scaffold Three.js canvas for laptop scene"
```

---

## Task 2: Create the renderer, scene, and camera

**Files:**
- Modify: `laptop-3d.js`

- [ ] **Step 1: Replace the stub with a full scene setup**

```javascript
// laptop-3d.js
import * as THREE from 'three';

const canvas = document.getElementById('laptop-canvas');
if (!canvas) throw new Error('laptop-canvas not found');

// ── Renderer ──────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Scene ─────────────────────────────────────────────────
const scene = new THREE.Scene();

// ── Camera ────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.3, 5);
camera.lookAt(0, 0, 0);

// ── Resize handling ───────────────────────────────────────
function resizeRenderer() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// ── Render loop ───────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  resizeRenderer();
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 2: Verify in browser**

Reload the page. The about section canvas area should now be transparent (alpha: true, no geometry yet). No console errors.

- [ ] **Step 3: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add Three.js renderer, scene, camera"
```

---

## Task 3: Build the laptop geometry

**Files:**
- Modify: `laptop-3d.js`

The laptop group sits at world origin. All measurements in Three.js units (roughly: 1 unit ≈ 1 inch at this camera distance). Lid opens upward from the back edge of the base.

- [ ] **Step 1: Add geometry builder function after the camera setup**

Insert this function before the `resizeRenderer` function:

```javascript
// ── Laptop geometry ───────────────────────────────────────
function buildLaptop() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Base (keyboard deck)
  const baseGeo = new THREE.BoxGeometry(2.8, 0.12, 1.9);
  const base = new THREE.Mesh(baseGeo, bodyMat);
  base.position.set(0, 0, 0);
  group.add(base);

  // Lid pivot group — hinge at back edge of base
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.06, -0.95); // top-back edge of base
  group.add(lidPivot);

  // Lid panel (rotated so it stands upright when open)
  const lidGeo = new THREE.BoxGeometry(2.7, 1.8, 0.07);
  const lid = new THREE.Mesh(lidGeo, bodyMat);
  // Place lid so its bottom edge is at the pivot
  lid.position.set(0, 0.9, 0);
  lidPivot.add(lid);

  // Screen bezel (inset dark plane on the front face of the lid)
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0 });
  const bezelGeo = new THREE.BoxGeometry(2.45, 1.52, 0.01);
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, 0.9, 0.04); // front face of lid
  lidPivot.add(bezel);

  // Screen emissive plane (sits just in front of bezel)
  const screenCanvas = buildScreenTexture();
  const screenTex = new THREE.CanvasTexture(screenCanvas.canvas);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screenGeo = new THREE.PlaneGeometry(2.28, 1.42);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.9, 0.052);
  lidPivot.add(screen);

  // Open the lid ~115 degrees (negative X rotation tilts top toward viewer)
  lidPivot.rotation.x = -THREE.MathUtils.degToRad(115);

  return { group, screenTex, screenCanvas };
}
```

- [ ] **Step 2: Add a placeholder buildScreenTexture function (will be filled in Task 4)**

Add this above `buildLaptop`:

```javascript
function buildScreenTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, size, size);
  return { canvas: cvs, ctx };
}
```

- [ ] **Step 3: Instantiate the laptop and add it to the scene**

After the `buildLaptop` function definition, add:

```javascript
const { group: laptopGroup, screenTex, screenCanvas } = buildLaptop();
laptopGroup.rotation.y = THREE.MathUtils.degToRad(-10); // resting angle
scene.add(laptopGroup);
```

- [ ] **Step 4: Verify in browser**

Reload. In the about section you should see a dark 3D laptop shape with a black screen. It will be unlit (flat) — that's correct, lighting comes in Task 4.

- [ ] **Step 5: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add Three.js laptop BoxGeometry"
```

---

## Task 4: Add lighting

**Files:**
- Modify: `laptop-3d.js`

- [ ] **Step 1: Add lights to the scene**

Insert after `scene.add(laptopGroup)`:

```javascript
// ── Lighting ──────────────────────────────────────────────
// Dim ambient fill
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// Primary highlight — white, above-left
const keyLight = new THREE.PointLight(0xffffff, 2.5, 20);
keyLight.position.set(-3, 4, 4);
scene.add(keyLight);

// Screen spill — low-intensity green from front
const screenLight = new THREE.PointLight(0x3dd68c, 0.6, 10);
screenLight.position.set(0, 1, 3);
scene.add(screenLight);
```

- [ ] **Step 2: Verify in browser**

Reload. The laptop body should now show visible shading — lighter on the upper-left faces, darker on the right/bottom. The body has a subtle metallic appearance.

- [ ] **Step 3: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add ambient, key, and screen-spill lights to laptop scene"
```

---

## Task 5: Build the CanvasTexture screen content with blinking cursor

**Files:**
- Modify: `laptop-3d.js`

- [ ] **Step 1: Replace buildScreenTexture with the full implementation**

Find the placeholder `buildScreenTexture` function and replace it entirely:

```javascript
function buildScreenTexture() {
  const W = 512, H = 512;
  const cvs = document.createElement('canvas');
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext('2d');

  function drawScreen(cursorOn) {
    // Background with radial green glow
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.35, H * 0.3, W * 0.65);
    grad.addColorStop(0, 'rgba(61,214,140,0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Terminal text
    ctx.font = '500 26px "Courier New", monospace';
    ctx.fillStyle = 'rgba(61,214,140,0.5)';
    const lines = ['> ridgeline.digital', '> colorado-built', '> mobile-first'];
    const lineH = 46;
    const startY = 180;
    lines.forEach((line, i) => {
      // dim the prompt ">" separately
      ctx.fillStyle = 'rgba(61,214,140,0.4)';
      ctx.fillText('>', 60, startY + i * lineH);
      ctx.fillStyle = '#3dd68c';
      ctx.fillText(line.slice(1), 60 + 18, startY + i * lineH);
    });

    // Blinking cursor block
    if (cursorOn) {
      ctx.fillStyle = '#3dd68c';
      ctx.fillRect(60, startY + lines.length * lineH - 30, 14, 26);
    }
  }

  drawScreen(true);
  return { canvas: cvs, ctx, drawScreen };
}
```

- [ ] **Step 2: Add cursor blink to the render loop**

At the top of `laptop-3d.js`, add a blink state variable after the imports:

```javascript
let cursorOn = true;
let lastBlink = 0;
```

Inside the `animate` function, after `resizeRenderer()` and before `renderer.render(...)`, add:

```javascript
  // Blink cursor at ~1Hz
  const now = performance.now();
  if (now - lastBlink > 500) {
    cursorOn = !cursorOn;
    lastBlink = now;
    screenCanvas.drawScreen(cursorOn);
    screenTex.needsUpdate = true;
  }
```

- [ ] **Step 3: Verify in browser**

Reload. The laptop screen should display the three terminal lines in green with a blinking cursor block. The radial glow should be visible as a subtle green haze on the left portion of the screen.

- [ ] **Step 4: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add CanvasTexture screen content with blinking cursor"
```

---

## Task 6: Entrance animation (rise + spin on scroll-into-view)

**Files:**
- Modify: `laptop-3d.js`

The laptop starts invisible and 80px below its resting position. When the canvas enters the viewport, it animates up and spins from +35° Y to −10° Y with a spring overshoot. All driven by lerp in the render loop (no CSS transitions on the canvas).

- [ ] **Step 1: Add animation state variables**

Add these after the `lastBlink` variable:

```javascript
// Entrance animation state
let entranceTriggered = false;
let entranceDone = false;
let entranceProgress = 0; // 0 → 1
const ENTRANCE_DURATION = 900; // ms
let entranceStart = 0;

// Target rotation for mouse follow (set after entrance)
let targetRotY = THREE.MathUtils.degToRad(-10);
let targetRotX = 0;
const REST_Y = THREE.MathUtils.degToRad(-10);
const REST_X = 0;
```

- [ ] **Step 2: Set initial hidden state**

After `scene.add(laptopGroup)`, add:

```javascript
// Start hidden — entrance animates these in
canvas.style.opacity = '0';
laptopGroup.position.y = -1.2; // 80px-equivalent below rest
laptopGroup.rotation.y = THREE.MathUtils.degToRad(35); // start spun right
```

- [ ] **Step 3: Add IntersectionObserver to trigger entrance**

Add this after the `scene.add(screenLight)` block:

```javascript
// ── Entrance trigger ──────────────────────────────────────
const entranceObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entranceTriggered) {
      entranceTriggered = true;
      entranceStart = performance.now();
      entranceObserver.unobserve(canvas);
    }
  });
}, { threshold: 0.1 });
entranceObserver.observe(canvas);
```

- [ ] **Step 4: Add easing helper and entrance update to the render loop**

Add this easing function near the top of the file, after the state variables:

```javascript
// Ease out cubic
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// Spring overshoot: overshoots ~5° then settles
function springY(t) {
  // Simple exponential decay overshoot
  return 1 + Math.sin(t * Math.PI * 1.2) * Math.exp(-t * 4) * 0.15;
}
```

Inside the `animate` function, before the blink block, add:

```javascript
  // Entrance animation
  if (entranceTriggered && !entranceDone) {
    const elapsed = performance.now() - entranceStart;
    entranceProgress = Math.min(elapsed / ENTRANCE_DURATION, 1);
    const e = easeOut(entranceProgress);

    // Rise: from -1.2 to 0
    laptopGroup.position.y = -1.2 + 1.2 * e;

    // Fade in via canvas opacity
    canvas.style.opacity = String(e);

    // Spin: from +35° to -10° with spring overshoot
    const fromY = THREE.MathUtils.degToRad(35);
    const toY = REST_Y;
    laptopGroup.rotation.y = fromY + (toY - fromY) * springY(entranceProgress);

    if (entranceProgress >= 1) {
      entranceDone = true;
      laptopGroup.position.y = 0;
      laptopGroup.rotation.y = REST_Y;
      canvas.style.opacity = '1';
    }
  }
```

- [ ] **Step 5: Verify in browser**

Reload and scroll to the about section. The laptop should:
1. Start invisible
2. Rise into view and spin from right-angled to slightly left-facing
3. Settle with a small overshoot spring feel
4. End fully opaque at −10° Y

- [ ] **Step 6: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add entrance rise+spin animation via IntersectionObserver"
```

---

## Task 7: Mouse-follow interaction

**Files:**
- Modify: `laptop-3d.js`

After entrance completes, the laptop tilts toward wherever the cursor is within `.about__visual`. It lerps smoothly at 0.08/frame and returns to resting angle on mouse leave.

- [ ] **Step 1: Add mouse event listeners**

Add this block after the `entranceObserver.observe(canvas)` line:

```javascript
// ── Mouse follow ──────────────────────────────────────────
const aboutVisual = canvas.closest('.about__visual') || canvas.parentElement;

aboutVisual.addEventListener('mousemove', (e) => {
  if (!entranceDone) return;
  const rect = aboutVisual.getBoundingClientRect();
  // Normalize to -1 → +1
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  // Map to rotation ranges
  targetRotY = REST_Y + nx * THREE.MathUtils.degToRad(15);
  targetRotX = -ny * THREE.MathUtils.degToRad(12);
});

aboutVisual.addEventListener('mouseleave', () => {
  targetRotY = REST_Y;
  targetRotX = REST_X;
});
```

- [ ] **Step 2: Apply lerp in the render loop**

Inside `animate`, after the entrance block, add:

```javascript
  // Mouse-follow lerp (only after entrance done)
  if (entranceDone) {
    laptopGroup.rotation.y += (targetRotY - laptopGroup.rotation.y) * 0.08;
    laptopGroup.rotation.x += (targetRotX - laptopGroup.rotation.x) * 0.08;
  }
```

- [ ] **Step 3: Verify in browser**

After the entrance animation finishes, move your cursor over the about section. The laptop should tilt gently toward the cursor. Moving the mouse away should slowly return it to the resting angle.

- [ ] **Step 4: Commit**

```bash
git add laptop-3d.js
git commit -m "feat: add mouse-follow tilt interaction to Three.js laptop"
```

---

## Task 8: Pause render loop when off-screen

**Files:**
- Modify: `laptop-3d.js`

No need to run requestAnimationFrame when the canvas is scrolled out of view.

- [ ] **Step 1: Add visibility state and observer**

Add after the mouse event listeners:

```javascript
// ── Render loop pause when off-screen ─────────────────────
let isVisible = false;
const visibilityObserver = new IntersectionObserver((entries) => {
  isVisible = entries[0].isIntersecting;
}, { threshold: 0 });
visibilityObserver.observe(canvas);
```

- [ ] **Step 2: Guard the render loop**

Change the `animate` function to skip rendering when not visible. Replace:

```javascript
function animate() {
  requestAnimationFrame(animate);
  resizeRenderer();
```

with:

```javascript
function animate() {
  requestAnimationFrame(animate);
  if (!isVisible && entranceDone) return;
  resizeRenderer();
```

- [ ] **Step 3: Verify in browser**

Open DevTools → Performance tab → record while scrolling away from the about section and back. The GPU activity should drop to near zero when the section is off-screen.

- [ ] **Step 4: Commit**

```bash
git add laptop-3d.js
git commit -m "perf: pause Three.js render loop when laptop off-screen"
```

---

## Task 9: Update styles.css — remove CSS laptop, size the canvas

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Remove all `.laptop*` CSS rules**

In `styles.css`, delete every rule block that starts with `.laptop` (approximately lines 280–424 based on current file). These are:

- `.laptop-scene` and `.laptop-scene.is-visible`
- `.laptop` and `.laptop-scene.is-visible .laptop`
- `.laptop__lid` and `.laptop-scene.is-visible .laptop__lid`
- `.laptop__screen` and `.laptop__screen::before`
- `.laptop__screen-inner` and `.laptop-scene.is-visible .laptop__screen-inner`
- `.laptop__screen-line` and `.laptop__screen-line::before`
- `.laptop__cursor`
- `@keyframes blink`
- `.laptop__base`, `.laptop__base::before`, `.laptop__base::after`
- `.laptop__shadow`

Also remove the mobile overrides for these (around lines 665–671 in the `@media` block):

```css
.laptop-scene { transform: translateY(50px); }
.laptop-scene.is-visible { transform: translateY(0); }
.laptop { width: 180px; transform: rotateY(42deg); }
.laptop-scene.is-visible .laptop { transform: rotateY(-6deg); }
.laptop__lid { width: 180px; height: 116px; }
.laptop__base { width: 180px; }
.laptop__shadow { width: 150px; }
```

- [ ] **Step 2: Add canvas sizing rules**

In `styles.css`, after the `.about__visual` rule (or `.about-grid` block), add:

```css
.about__visual canvas {
  width: 100%;
  height: 320px;
  display: block;
  transition: opacity 0s; /* opacity managed by JS */
}

@media (max-width: 768px) {
  .about__visual canvas {
    height: 220px;
  }
}
```

- [ ] **Step 3: Verify in browser**

Reload. Check:
- No `.laptop` CSS rule errors in DevTools
- About section canvas is 320px tall on desktop, 220px on mobile
- No layout shift compared to before

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "style: remove CSS laptop rules, add canvas sizing for Three.js scene"
```

---

## Task 10: Clean up index.html script block + WebGL fallback

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove the laptop IntersectionObserver from the inline script**

In `index.html`, find the inline `<script>` block at the bottom of `<body>`. Remove the `laptopScene` observer block:

```javascript
// DELETE THIS BLOCK:
const laptopScene = document.getElementById('laptop');
if (laptopScene) {
  const laptopObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        laptopScene.classList.add('is-visible');
        laptopObserver.unobserve(laptopScene);
      }
    });
  }, { threshold: 0.1 });
  laptopObserver.observe(laptopScene);
}
```

- [ ] **Step 2: Add WebGL fallback in laptop-3d.js**

At the very top of `laptop-3d.js`, before any Three.js usage, wrap everything in a try/catch and check for WebGL support:

```javascript
// laptop-3d.js
import * as THREE from 'three';

(function init() {
  try {
    const canvas = document.getElementById('laptop-canvas');
    if (!canvas) return;

    // WebGL availability check
    const testCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!testCtx) {
      canvas.style.display = 'none';
      return;
    }

    // ... (rest of the laptop-3d.js code moves inside this IIFE)
  } catch (e) {
    const canvas = document.getElementById('laptop-canvas');
    if (canvas) canvas.style.display = 'none';
  }
})();
```

Wrap all existing code in the file inside the `try` block of this IIFE (move everything between the WebGL check and the catch).

- [ ] **Step 3: Verify in browser**

Reload. Everything should work as before. To test fallback: temporarily change `getContext('webgl')` to `getContext('webgl-disabled')` — canvas should disappear silently. Revert after testing.

- [ ] **Step 4: Commit**

```bash
git add index.html laptop-3d.js
git commit -m "fix: remove stale laptop observer from HTML, add WebGL fallback"
```

---

## Task 11: Final visual polish pass

**Files:**
- Modify: `laptop-3d.js` (tweaks only)

- [ ] **Step 1: Adjust camera position if laptop appears too large or small**

In `laptop-3d.js`, find:
```javascript
camera.position.set(0, 0.3, 5);
```

If the laptop looks too small → decrease Z (e.g., `4.2`). Too large → increase Z (e.g., `5.5`). The lid should fill roughly 60-70% of canvas height.

- [ ] **Step 2: Verify the resting angle looks natural**

The laptop rests at `REST_Y = degToRad(-10)`. If it looks too face-on, increase to `-15°`. If too side-on, decrease to `-5°`. Edit:

```javascript
const REST_Y = THREE.MathUtils.degToRad(-10); // adjust here
```

- [ ] **Step 3: Check mobile layout**

Resize browser to 375px wide. The canvas should be 220px tall. The laptop should be fully visible. If it's clipped, increase the camera Z slightly for mobile:

```javascript
// In resizeRenderer(), after updating camera.aspect:
if (canvas.clientWidth < 500) {
  camera.position.z = 6.5;
} else {
  camera.position.z = 5;
}
camera.updateProjectionMatrix();
```

- [ ] **Step 4: Final cross-browser check**

Test in Chrome and Firefox. Verify:
- Entrance animation fires on scroll
- Mouse follow works on desktop
- No console errors
- Canvas is transparent (site background shows through)

- [ ] **Step 5: Final commit**

```bash
git add laptop-3d.js styles.css index.html
git commit -m "polish: final Three.js laptop visual tweaks"
```

---

## Self-Review Checklist

- [x] **Importmap** covered in Task 1
- [x] **BoxGeometry lid/base/bezel/screen** covered in Task 3
- [x] **MeshStandardMaterial** with metalness/roughness covered in Task 3
- [x] **Lighting** (ambient + key + screen spill) covered in Task 4
- [x] **CanvasTexture** terminal content covered in Task 5
- [x] **Blinking cursor** covered in Task 5
- [x] **Entrance animation** (rise + spin + spring) covered in Task 6
- [x] **IntersectionObserver** entrance trigger covered in Task 6
- [x] **Mouse-follow tilt** covered in Task 7
- [x] **Mouse-leave reset** covered in Task 7
- [x] **Render loop pause** when off-screen covered in Task 8
- [x] **CSS cleanup** covered in Task 9
- [x] **WebGL fallback** covered in Task 10
- [x] **Old inline observer removal** covered in Task 10
- [x] **Mobile sizing** covered in Task 9 + Task 11
