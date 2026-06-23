# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

Serve locally with Python (no build step):
```bash
python3 serve.py        # port 3000
# or
python3 -m http.server 3000
```

Deploy: `git push origin main` → Vercel auto-deploys to `anton-alekseev.vercel.app`.

Convert new PNG assets to WebP before committing:
```python
from PIL import Image
img = Image.open('assets/{case}/raw/image-N.png')
img.save('assets/{case}/web/image-N.webp', 'webp', quality=95, method=6)
```

After updating `cases.js`, bump the version suffix in `case.html` (`cases.js?v=12` → `?v=13`) to bust the browser cache.

## Architecture

**No framework, no build tools.** Three HTML pages share one CSS file and two JS files:

| File | Purpose |
|------|---------|
| `index.html` | Home page (hero, work cards, about, contact) |
| `case.html` | Universal case study renderer — driven entirely by `cases.js` data |
| `style.css` | All styles for both pages |
| `cases.js` | `CASES` array + `CASE_BG` gradients — the only file to edit for case content |
| `figma.js` | Shared UI layer: custom cursor, edit mode, multiplayer cursor simulation |

External CDNs: Google Fonts (Fraunces, Source Serif 4, JetBrains Mono) + GSAP 3.13 (ScrollTrigger, ScrollSmoother).

## Case Data (`cases.js`)

All case content is in the `CASES` array. `renderCase(idx)` in `case.html` reads each case object and builds HTML. Section fields (all optional, rendered in order):

```js
{
  lbl: String,        // sidebar label
  h: String,          // <h2> heading — line-reveal animation, NO .rev class
  body: String,       // paragraphs split on \n\n; allows <strong> via safe()
  insight: String,    // large pull-quote block — line-reveal animation
  bullets: String[],
  steps: [{n, t, d}], // numbered steps
  diagram: String,    // monospace text block
  images: [{src, alt}], // body images with parallax + click-to-lightbox
  carousel: String[], // auto-scrolling strip; array is duplicated internally
  impacts: [{n, c, l}], // c = 'g'|'a'|'b' (green/amber/blue)
  reflection: String  // styled reflection block; split on \n\n
}
```

Hero image: add `image: "assets/{case}/web/image-1.webp"` to the case object (not a section).

## Asset Conventions

```
assets/
  {case-slug}/
    raw/    ← original PNGs (source of truth)
    web/    ← WebP files served by the site
```

`picTag(src, cls, alt)` in `case.html` auto-generates `<picture>` with WebP `<source>` + PNG fallback by substituting `/web/` → `/raw/` and `.webp` → `.png`. This only works if the path convention is followed exactly.

## Key Constraints

**`safe(str)`** — escapes all HTML but restores `<strong>` tags. Only `<strong>` markup is allowed in case text fields. Do not use any other HTML tags in `cases.js` strings.

**`initReveal()`** — must be called after any DOM injection. Uses `.gsap-init` and `.split-init` guards to prevent double-binding. `.rev` elements get fade+y reveal; `.cb-h` and `.cb-insight` get line-split reveal (do NOT add `.rev` to these).

**ScrollSmoother** wraps `#smooth-wrapper > #smooth-content`. All `ScrollTrigger` instances must be killed before re-rendering (`ScrollTrigger.getAll().forEach(t => t.kill())`), which `hashchange` handler does automatically on case-to-case navigation.

**Carousel** expects exactly the real slides in `sec.carousel`; `renderCase` duplicates the array internally for the infinite loop. Speed is `SPEED=1.8` (px/frame), lerped with factor `0.06`.

**Parallax transforms** live on `img.cv-img` (GSAP `y`). CSS hover/zoom effects live on the parent `picture` element (CSS `transform: scale`). Keep these on separate elements to avoid conflicts.

**`figma.js` cursor labels** — when adding new interactive regions, update the `mouseover`/`mouseout` handlers in `figma.js` to set `tag.textContent` appropriately (e.g. `'Zoom in'` for `.cb-img-wrap`).

## Design Tokens

```css
--bg: #080808        /* page background */
--fg: #f0ede8        /* primary text */
--fg2: #7a7672       /* secondary text */
--green: #4ade80     /* positive / available */
--amber: #f59e0b     /* secondary accent */
--blue: #60a5fa      /* tertiary accent */
```

Fonts: Fraunces (display/headings), Source Serif 4 (body), JetBrains Mono (labels, tags, metadata).

Do not change the color palette, font stack, or overall dark aesthetic without explicit instruction.
