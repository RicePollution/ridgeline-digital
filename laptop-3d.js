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
