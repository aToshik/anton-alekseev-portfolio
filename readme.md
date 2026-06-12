# Anton Alekseev — Portfolio Site
> Handoff document for Claude Code. Read this before touching any file.

---

## Project Overview

Personal portfolio site for Anton Alekseev, Senior Product Designer. Single-page application (SPA) built in vanilla HTML/CSS/JS — no frameworks, no build tools, no dependencies except Google Fonts.

The site is intentionally **vibe-coded**: dark editorial aesthetic, cinematic animations, custom cursor. This is a design statement, not just a portfolio. Preserve the character of the design in all edits.

---

## Current State

- **Single file:** `index.html` — contains all HTML, CSS, and JS
- **No build step** — open in browser directly or serve with any static server
- **No npm, no webpack, no framework**
- External dependency: Google Fonts only (Inter, DM Serif Display, JetBrains Mono)

---

## Architecture

### Pages (SPA routing)
Two "pages" managed by toggling `.active` class on `#page-home` and `#page-case`:

```
#page-home   — Hero + About + Work (cards) + Contact + Footer
#page-case   — Individual case study (rendered dynamically from JS data)
```

Navigation between pages:
- `showPage(id)` — switches active page, scrolls to top
- `openCase(idx)` — calls `showPage('page-case')` then `renderCase(idx)`
- Back button (`#btn-back`) → `showPage('page-home')`

### Data
All case content lives in the `CASES` array inside the IIFE in `index.html`. Each case object:
```js
{
  title: String,
  tagline: String,
  tags: String[],
  stats: [{n: String, l: String}],   // l uses \n for line break
  prev: Number|null,                  // index into CASES array
  prevT: String,                      // title of prev case
  next: Number|null,
  nextT: String,
  sections: [Section]
}
```

Section types (all optional, render in order):
```js
{ lbl, h, body, insight, bullets, steps, diagram, impacts, reflection }
```

### Key constraint — NO querySelector with dynamic values
All event binding uses direct `addEventListener` on DOM elements. Never pass a variable or number into `querySelector`/`getElementById` — this was the source of a recurring bug. Prev/next navigation uses closures:
```js
(function(pi){ btn.addEventListener('click', function(){ openCase(pi); }); })(c.prev);
```

### Scroll reveal
`.rev` class = initially hidden (`opacity:0, translateY(36px)`).
`.rev.in` = visible. Applied by `IntersectionObserver` in `initReveal()`.
Call `initReveal()` after any dynamic HTML injection (renderCase, showPage).
Observed elements tracked in `observed[]` array to prevent double-observation.

### Cursor
Custom cursor: `#cur` (dot) + `#cur-ring` (lagging circle) + `#cur-x` (crosshair on cards).
- `hoverOn()` / `hoverOff()` — toggle `.h` class for hover state
- Attach manually to every interactive element after dynamic render

---

## Case Studies (5 total)

| idx | Title | Type |
|-----|-------|------|
| 0 | Price Exploration | Main card |
| 1 | Design System for AI Agents | Main card |
| 2 | AI Data Assistant | Main card |
| 3 | Cross-Campaign Management | Mini card |
| 4 | Channel Analysis & Outlier Detection | Mini card |

---

## Planned Work

### High priority
- [ ] **Add real screenshots/mockups** — replace visual placeholder sections with actual images
- [ ] **Password protection** — decide: open or gated. If gated, simple JS password on load or server-side
- [ ] **Deploy** — static hosting (Netlify / Vercel / GitHub Pages). No server needed.

### Medium priority
- [ ] **Case study visuals** — each case has a `visuals` section (currently text-only). Add `<img>` tags or mockup frames when assets are ready
- [ ] **OG meta tags** — add `og:title`, `og:description`, `og:image` for LinkedIn sharing
- [ ] **Favicon** — add `<link rel="icon">` with a minimal monogram
- [ ] **Mobile layout** — currently desktop-first. Needs responsive breakpoints at 768px and 480px

### Nice to have
- [ ] **GSAP** — replace CSS animations with real GSAP for smoother cinematic effects (CDN import)
- [ ] **Case page hero image** — full-bleed background image or video per case
- [ ] **Analytics** — simple Plausible or Fathom snippet (privacy-friendly)

---

## Adding a New Case

1. Add object to `CASES` array with correct `prev`/`next` indices
2. Update adjacent cases' `next`/`prev` and `nextT`/`prevT`
3. If it's a main card (shown large): add to `mainData[]`, `mainNums[]`, `mainGlows[]`, `mainImpacts[]`, `mainDescs[]`
4. If it's a mini card: add to `miniData[]`, `miniDescs[]`
5. Call `initReveal()` — new `.rev` elements need observation

## Adding Visual Assets

Each case section can contain images. After `sec.body` or `sec.steps`, inject:
```html
<div class="cb-visual">
  <img src="assets/case-01-phase-1.png" alt="Phase 1 UI" style="width:100%;display:block;">
</div>
```
Create `assets/` folder at root. Use descriptive filenames: `case-[idx]-[description].png`.

---

## Deployment

```bash
# Netlify drag-and-drop
# Just drop the project folder on netlify.com/drop

# Or Vercel CLI
npx vercel

# Or GitHub Pages
# Push to repo, enable Pages in Settings → point to main branch / root
```

No build step needed. `index.html` is the entire site.

---

## Design Tokens (for reference)

```css
--bg: #080808       /* page background */
--bg2: #0f0f0f      /* card background */
--bg3: #141414      /* card hover state */
--fg: #f0ede8       /* primary text */
--fg2: #7a7672      /* secondary text */
--fg3: #333230      /* borders, labels */
--fg4: #1e1d1b      /* subtle dividers */
--green: #4ade80    /* accent / availability / positive impact */
--amber: #f59e0b    /* secondary accent */
--blue: #60a5fa     /* tertiary accent */
--serif: 'DM Serif Display'   /* headings, display text */
--sans: 'Inter'               /* body copy */
--mono: 'JetBrains Mono'      /* labels, tags, metadata */
```

---

## What NOT to change without asking

- The overall dark aesthetic and color palette
- Font stack (Inter + DM Serif Display + JetBrains Mono)
- The IIFE wrapper around all JS — this prevents global scope pollution
- The `observed[]` array pattern in `initReveal()` — prevents IntersectionObserver double-binding
- Cursor behavior and `.h` class toggle pattern


## relevant stuff:
cases.md, portfolio2.md, Anton_Alekseev_CV_2026.docx