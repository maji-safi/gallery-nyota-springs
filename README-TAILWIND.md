# Nyota Springs Tailwind Migration

All component layout and responsive styles use Tailwind v4. `app/globals.css` contains only Tailwind import, global variables, and document-level accessibility defaults. The `styles/` directory and legacy CSS overrides are removed. GSAP uses `.hero-reveal`, `.reveal-section`, `.photo-card` as animation selectors, not style classes.

## Install

`npm install` then `npm run typecheck && npm run build`. Hero video is supplied via `NEXT_PUBLIC_HERO_VIDEO_URL` or `public/videos/hero.mp4`; the central video watermark remains unobscured by the compact lower-left overlay.
