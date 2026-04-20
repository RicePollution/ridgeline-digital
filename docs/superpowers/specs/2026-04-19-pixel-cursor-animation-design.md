# Pixel Cursor "Before/After" Animation Section

**Date:** 2026-04-19  
**Status:** Approved

## Overview

A new landing page section between the marquee and the About section. It presents the selling point "Modern businesses need a modern website" while a pixelated cursor character flies in, clicks an old-looking site preview, and both the site and the cursor transform into clean/modern versions before the cursor flies off screen.

## Placement

Inserted into `index.html` between the `.marquee` div and the `section--light` About section.

## HTML Structure

A `<section class="section section--dark pixel-demo">` containing:

1. **Text block** — eyebrow + headline that reveals on scroll
2. **Stage** — a centered container holding the site preview mockup and the cursor actor

```
.pixel-demo
  .pixel-demo__text
    .section__eyebrow  "The Reality"
    h2.section__heading  "Modern businesses need a modern website."
  .pixel-demo__stage
    .site-preview  (holds .site-preview--old and .site-preview--new, stacked)
    .pixel-cursor  (the animated cursor actor)
```

## Site Previews

Both previews are absolutely positioned on top of each other inside `.site-preview` (approx 480×300px, scaled 0.9 on mobile). Switching is done by toggling `.is-active`.

**Old site** (`.site-preview--old`):
- Gray `#c0c0c0` background
- Comic Sans font (with fallback)
- `<marquee>`-style scrolling text via CSS animation
- Table-cell layout suggestion (divs mimicking old table structure)
- Rainbow horizontal rule via gradient border
- Bevel button (inset box-shadow)
- Tacky `<blink>`-style text blinking via CSS keyframes
- Domain: `www.best-plumber-4u.com`

**New site** (`.site-preview--new`):
- White background, clean sans-serif
- Simple nav bar, single headline, minimal CTA button
- Matches general aesthetic of Ridgeline sites

## Cursor Actor

The pixel cursor (`.pixel-cursor`) is an `<svg>` element that starts as a chunky pixelated arrow (literal 16×16 bitmap rendered at ~48px actual size, visibly blocky) and transitions to a smooth standard pointer SVG.

State classes on the actor element:
- *(default)* — pixel version visible, smooth hidden
- `.is-clicking` — scale pulse
- `.is-modern` — pixel hidden, smooth fades in
- `.is-gone` — translates off screen right + fades

The SVG contains two `<g>` groups: `#cursor-pixel` and `#cursor-smooth`. Toggling opacity + display handles the swap.

## Animation Sequence

All timing driven by JS after IntersectionObserver fires (threshold 0.3):

| t (ms) | Action |
|--------|--------|
| 0 | Section enters viewport. Text reveals (existing `.reveal` class). Cursor starts at `translate(-120px, 20px) rotate(-12deg)`, opacity 0. |
| 400 | Cursor transitions in: slides to center-ish position above the old site, opacity 1, `rotate(-6deg)`. Duration 700ms ease-out. |
| 1100 | Cursor moves down toward the "click zone" of the old site. Duration 300ms. |
| 1400 | `.is-clicking` added — scale(0.85) pulse, 150ms. Click sound optional (skipped for now). |
| 1550 | Old site plays "glitch" transition: brief CSS `filter: contrast(2) hue-rotate(90deg)` flash then fades out. Duration 400ms. |
| 1800 | New site fades in (`.is-active` swapped). Cursor morphs to smooth: `.is-modern` added, crossfade between pixel/smooth SVG groups. Duration 500ms. |
| 2200 | Cursor rotates to 0deg and floats up-right. Duration 300ms. |
| 2500 | `.is-gone` added — cursor translates to `(200px, -60px)` and fades out. Duration 600ms. |

Animation fires once per page load (observer disconnects after firing).

## CSS

All animation in `styles.css` under a `/* Pixel Demo Section */` comment block.

Key rules:
- `.pixel-demo__stage` — `position: relative`, fixed height ~340px, centered, max-width 540px
- `.site-preview` — `position: relative`, overflow hidden, border-radius 8px, box-shadow
- `.site-preview--old`, `.site-preview--new` — `position: absolute`, inset 0, transition opacity 400ms
- `.pixel-cursor` — `position: absolute`, pointer-events none, transition transform+opacity
- `@media (prefers-reduced-motion: reduce)` — skips the animation, shows new site state immediately

## JS

A small inline `<script>` at the bottom of `index.html` (alongside the existing IntersectionObserver block) — or a dedicated `pixel-demo.js` if it grows large. Uses one IntersectionObserver, a series of `setTimeout` calls, and class toggles. No dependencies.

## Accessibility

- `aria-hidden="true"` on the entire `.pixel-demo__stage` (decorative)
- `prefers-reduced-motion` check skips animation, shows final modern state immediately
