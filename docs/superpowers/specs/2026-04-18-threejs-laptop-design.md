# Three.js Stylized Laptop — Design Spec

**Date:** 2026-04-18
**Status:** Approved
**Scope:** Replace the CSS 3D laptop in the About section of `index.html` with a Three.js canvas-based version. Geometry-first approach (BoxGeometry primitives); realistic GLTF model is a future option.

---

## Goal

Upgrade the about-section laptop from pure CSS transforms to a Three.js scene that provides real lighting, metallic shading, and mouse-follow interactivity — while keeping the same visual role (right-column accent in the about grid) and matching the Ridgeline site aesthetic.

---

## Geometry

Built entirely from `BoxGeometry` primitives. No external GLTF model, no network assets.

| Part | Description |
|------|-------------|
| Lid | Thin wide box, rotated open ~115° from the hinge |
| Base | Wider, shallow box (keyboard deck) |
| Screen bezel | Inset dark box inside the lid face |
| Screen surface | Emissive plane so it glows independently of scene lighting |

All parts assembled as children of a single `Group` for unified transforms.

---

## Materials & Lighting

**Body:** `MeshStandardMaterial` — dark charcoal (`#1e1e1e`), metalness `0.6`, roughness `0.4`

**Screen:** `MeshBasicMaterial` (emissive) — dark base with a green radial glow matching the site's `--accent` color. Uses a `CanvasTexture` generated on-device.

**Lighting:**
- `AmbientLight` — dim, provides base fill
- `PointLight` above-left — white, primary highlight
- `PointLight` from screen direction — low-intensity green, simulates screen spill on the body

**Shadows:** Disabled for performance. A 2D CSS ellipse gradient under the canvas serves as the ground shadow (same as current implementation).

---

## Screen Content (CanvasTexture)

An offscreen `<canvas>` renders the terminal content, used as a `CanvasTexture` on the screen plane. Generated once at init, re-applied only for cursor blink.

Content:
```
> ridgeline.digital
> colorado-built
> mobile-first
█  (blinking cursor)
```

- Font: Courier New, monospace
- Color: `--accent` green
- Background: dark with subtle green radial gradient

Cursor blink is driven by toggling the cursor rectangle in `requestAnimationFrame` at ~1Hz, with `texture.needsUpdate = true`.

---

## Entrance Animation

Triggered by `IntersectionObserver` at `threshold: 0.1` (same as current).

On intersection:
1. Laptop group starts 80px below canvas center, `opacity` 0 (canvas CSS)
2. Over ~900ms: rises to center position, fades to opacity 1
3. Simultaneously: Y-rotation animates from `+35°` to `−10°` with spring overshoot (lerp-based, not CSS transitions)
4. All animation driven inside the Three.js `requestAnimationFrame` render loop

Easing: manual lerp with overshoot — target overshoots by ~5° then settles back, giving a spring feel without a CSS dependency.

---

## Mouse Interaction

Activates after entrance animation completes.

- Listens to `mousemove` on the `.about__visual` container
- Maps cursor X → Y-axis rotation: `±15°` from resting angle
- Maps cursor Y → X-axis rotation: `±12°` from resting angle
- Lerp factor: `0.08` per frame (smooth follow, not instant snap)
- On `mouseleave`: lerp back to resting angle (`−10°` Y, `0°` X)

---

## Integration

- Three.js loaded via **CDN importmap** (ES module, no bundler required)
- The existing `.laptop-scene` div and all child HTML is replaced by a `<canvas>` element
- All CSS rules under `.laptop`, `.laptop__lid`, `.laptop__base`, etc. are removed
- Canvas is styled to fill `.about__visual` at a fixed height (e.g., `320px` desktop, `220px` mobile)
- The existing `IntersectionObserver` for `.reveal` elements is unchanged
- A separate observer handles the laptop canvas entrance
- WebGL unavailability: wrapped in try/catch; canvas hidden on failure, no JS error thrown

---

## Performance

| Factor | Detail |
|--------|--------|
| Bundle size | Three.js core via CDN, ~160KB gzipped |
| Render loop | Paused via `IntersectionObserver` when canvas scrolled off-screen |
| Draw calls | Single scene, minimal geometry — effectively 1 draw call |
| Network assets | None — screen texture generated on-device |

---

## Future Upgrade Path

The animation, mouse-follow, and lighting system are independent of geometry. To upgrade to a realistic GLTF model later:
1. Load model with `GLTFLoader`
2. Swap the `BoxGeometry` group for the loaded scene
3. Keep entrance animation, mouse-follow, and CanvasTexture logic as-is

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Replace `.laptop-scene` HTML with `<canvas id="laptop-canvas">` + importmap + inline JS module |
| `styles.css` | Remove all `.laptop*` rules; add `.about__visual canvas` sizing rules |
