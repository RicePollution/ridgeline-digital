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

// ── Screen texture placeholder ────────────────────────────
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

// Instantiate laptop and add to scene
const { group: laptopGroup, screenTex, screenCanvas } = buildLaptop();
laptopGroup.rotation.y = THREE.MathUtils.degToRad(-10); // resting angle
scene.add(laptopGroup);

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
