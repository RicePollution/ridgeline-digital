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

    // Mobile detection
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Cursor blink state
    let cursorOn = true;
    let lastBlink = 0;

    // Entrance animation state
    let entranceTriggered = false;
    let entranceDone = false;
    let entranceProgress = 0;
    const ENTRANCE_DURATION = 900; // ms
    let entranceStart = 0;

    // Target rotation for mouse/touch follow
    let targetRotY = THREE.MathUtils.degToRad(-10);
    let targetRotX = 0;
    const REST_Y = THREE.MathUtils.degToRad(-10);
    const REST_X = 0;

    // Mobile auto-rock + touch drag state
    let autoRockTime = 0;
    let lastFrameTime = performance.now();
    let touchDragging = false;
    let touchLastX = 0;
    let touchLastY = 0;
    let touchEndTime = 0;

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

    // Spring overshoot: easeOutElastic
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
        ctx.fillStyle = '#060606';
        ctx.fillRect(0, 0, W, H);
        const grad = ctx.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.35, H * 0.3, W * 0.65);
        grad.addColorStop(0, 'rgba(61,214,140,0.15)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.font = '500 26px "Courier New", monospace';
        const lines = ['> ridgeline.digital', '> colorado-built', '> mobile-first'];
        const lineH = 46;
        const startY = 180;
        lines.forEach((line, i) => {
          ctx.fillStyle = 'rgba(61,214,140,0.4)';
          ctx.fillText('>', 60, startY + i * lineH);
          ctx.fillStyle = '#3dd68c';
          ctx.fillText(line.slice(1), 60 + 18, startY + i * lineH);
        });

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
      lidPivot.position.set(0, 0.06, -0.95);
      group.add(lidPivot);

      // Lid panel
      const lidGeo = new THREE.BoxGeometry(2.7, 1.8, 0.07);
      const lid = new THREE.Mesh(lidGeo, bodyMat);
      lid.position.set(0, 0.9, 0);
      lidPivot.add(lid);

      // Screen bezel
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0 });
      const bezelGeo = new THREE.BoxGeometry(2.45, 1.52, 0.01);
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(0, 0.9, 0.04);
      lidPivot.add(bezel);

      // Screen emissive plane
      const screenCanvas = buildScreenTexture();
      const screenTex = new THREE.CanvasTexture(screenCanvas.canvas);
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
      const screenGeo = new THREE.PlaneGeometry(2.28, 1.42);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0.9, 0.052);
      lidPivot.add(screen);

      // Open the lid ~110 degrees from closed
      lidPivot.rotation.x = -THREE.MathUtils.degToRad(20);

      return { group, screenTex, screenCanvas };
    }

    // Instantiate laptop and add to scene
    const { group: laptopGroup, screenTex, screenCanvas } = buildLaptop();
    laptopGroup.rotation.y = REST_Y;
    scene.add(laptopGroup);

    // ── Lighting ──────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xffffff, 2.5, 20);
    keyLight.position.set(-3, 4, 4);
    scene.add(keyLight);

    const screenLight = new THREE.PointLight(0x3dd68c, 0.6, 10);
    screenLight.position.set(0, 1, 3);
    scene.add(screenLight);

    // Start hidden — entrance animates these in
    canvas.style.opacity = '0';
    laptopGroup.position.y = -1.8;
    laptopGroup.rotation.y = THREE.MathUtils.degToRad(35);

    // ── Entrance trigger ──────────────────────────────────────
    // Only fire after the user has scrolled — prevents triggering on initial page load
    // if the about section happens to be in the viewport already.
    let hasScrolled = false;
    window.addEventListener('scroll', () => { hasScrolled = true; }, { once: true, passive: true });

    const entranceObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entranceTriggered && hasScrolled) {
          entranceTriggered = true;
          entranceStart = performance.now();
          lastFrameTime = performance.now();
          entranceObserver.unobserve(canvas);
        }
      });
    }, { threshold: 0.1 });
    entranceObserver.observe(canvas);

    // ── Desktop: mouse follow ─────────────────────────────────
    const aboutVisual = canvas.closest('.about__visual') || canvas.parentElement;

    if (!isMobile) {
      aboutVisual.addEventListener('mousemove', (e) => {
        if (!entranceDone) return;
        const rect = aboutVisual.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetRotY = REST_Y + nx * THREE.MathUtils.degToRad(15);
        targetRotX = -ny * THREE.MathUtils.degToRad(12);
      });

      aboutVisual.addEventListener('mouseleave', () => {
        targetRotY = REST_Y;
        targetRotX = REST_X;
      });
    }

    // ── Mobile: touch drag ────────────────────────────────────
    if (isMobile) {
      aboutVisual.addEventListener('touchstart', (e) => {
        if (!entranceDone) return;
        touchDragging = true;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
      }, { passive: true });

      aboutVisual.addEventListener('touchmove', (e) => {
        if (!touchDragging || !entranceDone) return;
        const dx = e.touches[0].clientX - touchLastX;
        const dy = e.touches[0].clientY - touchLastY;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;

        // Accumulate into target, clamped to reasonable range
        targetRotY = Math.max(
          REST_Y - THREE.MathUtils.degToRad(35),
          Math.min(REST_Y + THREE.MathUtils.degToRad(35), targetRotY + dx * 0.009)
        );
        targetRotX = Math.max(
          -THREE.MathUtils.degToRad(20),
          Math.min(THREE.MathUtils.degToRad(20), targetRotX - dy * 0.007)
        );
      }, { passive: true });

      aboutVisual.addEventListener('touchend', () => {
        touchDragging = false;
        touchEndTime = performance.now();
      });
    }

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

      const now = performance.now();
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05); // seconds, capped
      lastFrameTime = now;

      // Entrance animation
      if (entranceTriggered && !entranceDone) {
        const elapsed = now - entranceStart;
        entranceProgress = Math.min(elapsed / ENTRANCE_DURATION, 1);
        const e = easeOut(entranceProgress);

        laptopGroup.position.y = -1.8 + 1.2 * e;
        canvas.style.opacity = String(e);

        const fromY = THREE.MathUtils.degToRad(35);
        laptopGroup.rotation.y = fromY + (REST_Y - fromY) * springY(entranceProgress);

        if (entranceProgress >= 1) {
          entranceDone = true;
          laptopGroup.position.y = -0.6;
          laptopGroup.rotation.y = REST_Y;
          canvas.style.opacity = '1';
          // Seed auto-rock time so it starts smoothly
          autoRockTime = 0;
          touchEndTime = now; // trigger settle → auto-rock transition
        }
      }

      // Rotation control (post-entrance)
      if (entranceDone) {
        if (isMobile) {
          autoRockTime += dt;
          const timeSinceTouch = now - touchEndTime;

          if (!touchDragging && timeSinceTouch > 1200) {
            // Auto-rock mode: gentle sinusoidal rotation, two frequencies for organic feel
            targetRotY = REST_Y + Math.sin(autoRockTime * 0.45) * THREE.MathUtils.degToRad(16);
            targetRotX = Math.sin(autoRockTime * 0.32) * THREE.MathUtils.degToRad(6);
          } else if (!touchDragging) {
            // Brief settle after touch ends — lerp back toward rest
            targetRotY += (REST_Y - targetRotY) * 0.04;
            targetRotX += (REST_X - targetRotX) * 0.04;
          }
          // During touch: targetRotY/X driven by touchmove

          laptopGroup.rotation.y += (targetRotY - laptopGroup.rotation.y) * 0.06;
          laptopGroup.rotation.x += (targetRotX - laptopGroup.rotation.x) * 0.06;
        } else {
          // Desktop: smooth mouse-follow lerp
          laptopGroup.rotation.y += (targetRotY - laptopGroup.rotation.y) * 0.08;
          laptopGroup.rotation.x += (targetRotX - laptopGroup.rotation.x) * 0.08;
        }
      }

      // Blink cursor at ~1Hz
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
