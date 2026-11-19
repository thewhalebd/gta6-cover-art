[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/thewhalebd/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/thewhalebd/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Sunset Cover Studio

A GTA-poster-style cover art maker that runs entirely offline in your browser.
Drop in 1–4 of your own photos, arrange them in a multi-panel poster, grade
them like a Vice City sunset, letter the caption, and export a PNG to post.
Nothing uploads — your photos never leave your machine.

## What it does

- **Multi-panel layouts** — Hero + 3, Split 2, Trio, Grid 4, Diagonal split,
  and Full bleed, in square, portrait and wide shapes.
- **Any photo** — file picker and drag-and-drop for 1–4 photos, one-click
  sample photos, and "fill all panels with this photo". Click a panel to
  select it, then crop it: zoom and pan sliders, drag on the panel to pan,
  scroll on it to zoom.
- **Colour grades** — Sunset, Neon, Day, Noir and Vice, plus warmth,
  contrast and saturation sliders, film grain and vignette, and a striped
  sunset-sun poster mark.
- **Caption lettering** — title + subtitle, five lettering styles (Block,
  Sunset gradient, Neon glow, Outline, Badge), title colour and position
  (top / bottom / centre band), and four one-click looks (Vice Sunset,
  Neon Nights, Day Drive, Noir Heist).
- **Fast export** — pick a post size (1080 × 1080, 1080 × 1350 or
  1920 × 1080) and hit **Export PNG**. Sample photo to exported PNG is
  a couple of clicks.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no
network requests, no libraries — plain static files under `app/`.

## Screenshots

- `screenshots/1-cover.jpg` — exported wide cover, Hero + 3, Sunset grade
- `screenshots/2-editor.jpg` — the editor with a photo loaded
- `screenshots/3-cover.jpg` — exported portrait cover, Diagonal, Neon grade
- `screenshots/4-cover.jpg` — exported square cover, Grid 4, Badge lettering

## Originality

All art, lettering and layout are original, drawn in code with system
fonts. No Rockstar Games logo, official artwork, character or font is
used anywhere. The two sample photos in `app/samples/` were made for
make.fun with an image model and are free to use.

Built by an AI agent for make.fun's
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty.
