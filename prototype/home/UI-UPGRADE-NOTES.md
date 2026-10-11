# UI upgrade — tooling + backlog

Working note for the craft/a11y pass on `index.html`. Scope: prototype only; copy stays verbatim.

## Skill toolkit assembled
Installed via `npx skills` into `.agents/skills/` (symlinked for Claude Code), all reviewed (instruction-only, no scripts):

| Skill | Source | Risk | Use |
|---|---|---|---|
| `find-skills` | vercel-labs/skills | Snyk Med* | Discover/install more skills (`npx skills find/add`) |
| `web-design-guidelines` | vercel-labs/agent-skills | Low | Audit UI vs Vercel Web Interface Guidelines |
| `animation-vocabulary` | emilkowalski/skills | Low | Motion naming + principles (ease-out, reduced-motion, perceived perf) |

*Med = it advises `npx skills add -g -y` (full perms), not malicious content. Its guidance is treated as data.

Built-in skills used (no install): `interface-design`, `example-skills:frontend-design`,
`design:design-critique`, `design:accessibility-review`, `design:design-system`, and
`figma:figma-design-to-code` (pending Figma MCP auth).

## Audit → backlog (ranked)

### P0 — guideline / a11y correctness
1. **`color-scheme` per theme** on `<html>` — fixes native scrollbars & form controls (missing).
2. **Animate only transform/opacity** — replace `transition: gap` on `.teaser-link` / `.case-view`
   hover with a `transform: translateX` on a wrapped arrow span (gap is a layout property → jank).
3. **`touch-action: manipulation`** + deliberate `-webkit-tap-highlight-color` on interactive els.
4. **Curly apostrophes** in display copy (Let's → Let's, I've, don't, I'd) — typography craft.
5. **Theme toggle** — add `aria-pressed` reflecting state (+ polite live announce of theme).
6. **Heading hierarchy** — give the "Previously trusted by" section a real (visually-hidden) `<h2>`.

### P1 — craft polish
7. **Hero depth** — faint radial accent glow + dot-grid behind hero (static, no animation); near-invisible
   in light. Enterprise "canvas" nod while staying airy.
8. **Staggered reveal** for grids (impact tiles, work cards, why cards, tool tiles) — orchestration;
   reduced-motion safe, content-present by default.
9. **Press feedback** — subtle `:active` scale on tiles/cards (buttons already have it).
10. **Non-breaking spaces** around metric arrows (`$8M → $30M`) and `⌘K` to avoid awkward wraps.
11. **Preload Fraunces** (hero display) to cut first-paint FOUT.

### P2 — later / needs assets or Figma
12. Real case thumbnails → `<img>` with explicit width/height, `alt`, `loading="lazy"`.
13. Fold in direction from the Figma file once the MCP is authorized (palette/spacing/component ideas).

## Verification
Serve (`.claude/launch.json` "portfolio" or `python3 -m http.server`), check both themes, scrollspy,
anchors, 400px no-h-scroll, clean console; screenshots before/after. Isolation: only `prototype/` + the
new `.agents/skills/` dir change; no live-site file touched.

---

## Figma pass (file `0sh1LfotQLzNG6kHIdBFzq`, authorized)
The file is a full design of this same home page — frames: Home Light/Dark × mobile(400) / desktop(1440).
No Figma variables defined (raw values). Palette / structure / fonts match our prototype — confirms the
token choices. Treated as **reference**.

### Applied (additive, no locked-copy changes)
- **Schematic mini-visuals** in the 4 case thumbnails (inline SVG, theme-aware, `aria-hidden` + role=img
  label, `Schematic` tag) — line chart (Price), signal bars (Channel), component swatches (Design System),
  table rows (Cross-Campaign). Replaces the empty dashed placeholders. Real cover images still swap in later.
- **Numbered section nav (01–07)** in the sidebar (active number turns accent); hidden in the mobile row.

### Optional — needs Anton's OK (Figma refines copy that our handoff locked verbatim)
- Section-2 heading `Selected work` → **`Complexity in. Clarity out.`** (+ sub "Four systems. Four ways to
  make the work easier.").
- Punchier card hooks: `Make pricing a self-service decision.` / `Bring the signal into focus.` /
  `Give AI a shared design language.` / `Turn repetitive work into one flow.`
- Sub lines: Why → "From the shape of the system to the detail of the interaction."; AI → "A shorter path
  from a question to something tangible. Human judgment stays at the center."; Contact →
  "Have a complex system that needs a clearer experience?"
- Small **line icons** on Why cards, Tool tiles (+ descriptors), and Contact methods.
- Numbered mono eyebrow labels per section ("01 · SHIP IMPACT", …) to mirror the sidebar.
