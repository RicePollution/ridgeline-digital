// laptop-3d.js
import * as THREE from 'three';

(function init() {
  try {
    const canvas = document.getElementById('laptop-canvas');
    if (!canvas) return;

    // WebGL availability check — probe a throwaway canvas to avoid context conflicts
    const probe = document.createElement('canvas');
    const testCtx = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!testCtx) {
      canvas.style.display = 'none';
      return;
    }

    // Cursor blink state
    let cursorOn = true;
    let lastBlink = 0;

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

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.5, 3.5);
    camera.lookAt(0, 0.5, 0);

    // Ease out cubic
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    // Spring overshoot: easeOutElastic — overshoots past 1.0 then settles back to 1
    function springY(t) {
      if (t >= 1) return 1;
      const c4 = (2 * Math.PI) / 3;
      return Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    // ── Screen texture ────────────────────────────────────────
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

      // Open the lid ~110 degrees from closed.
      // Closed = +90deg (lid horizontal over keyboard). 110deg open = +90 - 110 = -20deg.
      lidPivot.rotation.x = -THREE.MathUtils.degToRad(20);

      // Ground shadow — flat ellipse rendered in scene so it composites correctly
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      const shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -0.2, 0.3);
      group.add(shadowMesh);

      return { group, screenTex, screenCanvas };
    }

    // Instantiate laptop and add to scene
    const { group: laptopGroup, screenTex, screenCanvas } = buildLaptop();
    laptopGroup.rotation.y = THREE.MathUtils.degToRad(-10); // resting angle
    scene.add(laptopGroup);

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

    // Start hidden — entrance animates these in
    canvas.style.opacity = '0';
    laptopGroup.position.y = -1.8; // below rest (-0.6 rest offset + 1.2 entrance drop)
    laptopGroup.rotation.y = THREE.MathUtils.degToRad(35); // start spun right

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

    // ── Render loop pause when off-screen ─────────────────────
    let isVisible = false;
    const visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    visibilityObserver.observe(canvas);

    // ── Resize handling ───────────────────────────────────────
    function resizeRenderer() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.position.z = w < 500 ? 5 : 3.5;
        camera.updateProjectionMatrix();
      }
    }

    // ── Render loop ───────────────────────────────────────────
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible && entranceDone) return;
      resizeRenderer();

      // Entrance animation
      if (entranceTriggered && !entranceDone) {
        const elapsed = performance.now() - entranceStart;
        entranceProgress = Math.min(elapsed / ENTRANCE_DURATION, 1);
        const e = easeOut(entranceProgress);

        // Rise: from -1.8 to -0.6 (group rests at -0.6 to keep lid inside canvas)
        laptopGroup.position.y = -1.8 + 1.2 * e;

        // Fade in via canvas opacity
        canvas.style.opacity = String(e);

        // Spin: from +35° to -10° with spring overshoot
        const fromY = THREE.MathUtils.degToRad(35);
        const toY = REST_Y;
        laptopGroup.rotation.y = fromY + (toY - fromY) * springY(entranceProgress);

        if (entranceProgress >= 1) {
          entranceDone = true;
          laptopGroup.position.y = -0.6;
          laptopGroup.rotation.y = REST_Y;
          canvas.style.opacity = '1';
        }
      }

      // Mouse-follow lerp (only after entrance done)
      if (entranceDone) {
        laptopGroup.rotation.y += (targetRotY - laptopGroup.rotation.y) * 0.08;
        laptopGroup.rotation.x += (targetRotX - laptopGroup.rotation.x) * 0.08;
      }

      // Blink cursor at ~1Hz
      const now = performance.now();
      if (now - lastBlink > 500) {
        cursorOn = !cursorOn;
        lastBlink = now;
        screenCanvas.drawScreen(cursorOn);
        screenTex.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }
    animate();

  } catch (e) {
    const canvas = document.getElementById('laptop-canvas');
    if (canvas) canvas.style.display = 'none';
  }
})();
