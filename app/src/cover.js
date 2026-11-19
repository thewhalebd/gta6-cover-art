// Vice Sunset Cover Studio — the cover engine. Draws a multi-panel GTA-poster-style
// cover onto any 2D canvas context from a state object, at any output size.
// Layouts are computed in normalised (0..1) rects so the same cover works at
// 1080x1080, 1080x1350 and 1920x1080. Grades are canvas filters + gradient maps
// painted over each panel; lettering is drawn with system fonts only (no
// Rockstar artwork, logo or font anywhere in this app).

export const LAYOUTS = ['hero', 'split2', 'trio', 'grid4', 'diagonal', 'full'];
export const GRADES = ['sunset', 'neon', 'day', 'noir', 'vice'];
export const STYLES = ['block', 'sunset', 'neon', 'outline', 'badge'];

export const PRESETS = {
  viceSunset: { layout: 'hero', grade: 'sunset', style: 'sunset', warmth: 18, contrast: 114, saturation: 135, titleColor: '#ffffff', titlePos: 'bottom' },
  neonNights: { layout: 'diagonal', grade: 'neon', style: 'neon', warmth: -12, contrast: 120, saturation: 160, titleColor: '#ff5ce1', titlePos: 'bottom' },
  dayDrive: { layout: 'trio', grade: 'day', style: 'block', warmth: 6, contrast: 104, saturation: 112, titleColor: '#ffffff', titlePos: 'top' },
  noirHeist: { layout: 'grid4', grade: 'noir', style: 'outline', warmth: -18, contrast: 128, saturation: 70, titleColor: '#f5f0e6', titlePos: 'band' },
};

/** Default state for a fresh cover. */
export function defaultState() {
  return {
    layout: 'hero', grade: 'sunset', style: 'sunset',
    warmth: 12, contrast: 112, saturation: 128,
    title: 'SUNSET HEIST', subtitle: 'Vice City · one last ride',
    titleColor: '#ffffff', titlePos: 'bottom',
    frame: true, grain: true, selected: 0,
    panels: [
      { zoom: 1.15, panX: 0, panY: 0 },
      { zoom: 1.15, panX: 0, panY: 0 },
      { zoom: 1.15, panX: 0, panY: 0 },
      { zoom: 1.15, panX: 0, panY: 0 },
    ],
  };
}

/** Panel rects for a layout, in normalised coords. `wide` is true for 16:9. */
export function layoutRects(layout, wide) {
  const g = 0.012;
  switch (layout) {
    case 'split2': return [{ x: 0, y: 0, w: 0.5 - g / 2, h: 1 }, { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 1 }];
    case 'trio': return [0, 1, 2].map(i => ({ x: i * (1 / 3) + (i ? g / 2 : 0), y: 0, w: 1 / 3 - (i === 1 ? g : g / 2), h: 1 }));
    case 'grid4': return [
      { x: 0, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2 }, { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2 },
      { x: 0, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2 }, { x: 0.5 + g / 2, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2 },
    ];
    case 'diagonal': return [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 0, w: 1, h: 1 }];
    case 'full': return [{ x: 0, y: 0, w: 1, h: 1 }];
    case 'hero':
    default:
      if (wide) return [
        { x: 0, y: 0, w: 0.62, h: 1 },
        { x: 0.62 + g, y: 0, w: 0.38 - g, h: 0.32 },
        { x: 0.62 + g, y: 0.32 + g, w: 0.38 - g, h: 0.32 },
        { x: 0.62 + g, y: 0.64 + 2 * g, w: 0.38 - g, h: 0.36 - 2 * g },
      ];
      return [
        { x: 0, y: 0, w: 1, h: 0.58 },
        { x: 0, y: 0.58 + g, w: 0.32, h: 0.42 - g },
        { x: 0.32 + g, y: 0.58 + g, w: 0.32, h: 0.42 - g },
        { x: 0.64 + 2 * g, y: 0.58 + g, w: 0.36 - 2 * g, h: 0.42 - g },
      ];
  }
}

/** How many panels a layout shows. */
export function panelCount(layout) {
  return { hero: 4, split2: 2, trio: 3, grid4: 4, diagonal: 2, full: 1 }[layout] ?? 4;
}

function gradeFilter(state) {
  const { grade, warmth, contrast, saturation } = state;
  const sat = grade === 'noir' ? Math.min(saturation, 85) : saturation;
  const con = grade === 'noir' ? contrast + 8 : contrast;
  const hue = warmth > 0 ? -warmth * 0.35 : -warmth * 0.5;
  const sepia = grade === 'sunset' ? 0.22 : grade === 'vice' ? 0.12 : grade === 'noir' ? 0.25 : 0;
  return `saturate(${sat}%) contrast(${con}%) brightness(${grade === 'neon' ? 96 : 102}%) sepia(${sepia}) hue-rotate(${hue}deg)`;
}

function gradeOverlay(ctx, rect, state) {
  const { grade } = state;
  const { x, y, w, h } = rect;
  let grad;
  if (grade === 'sunset') {
    grad = ctx.createLinearGradient(x, y + h * 0.45, x, y + h);
    grad.addColorStop(0, 'rgba(255,122,60,0)'); grad.addColorStop(0.6, 'rgba(255,80,120,0.16)'); grad.addColorStop(1, 'rgba(150,20,110,0.42)');
  } else if (grade === 'neon') {
    grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(255,40,180,0.34)'); grad.addColorStop(0.5, 'rgba(20,10,60,0.08)'); grad.addColorStop(1, 'rgba(0,220,255,0.36)');
  } else if (grade === 'vice') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(0,200,170,0.14)'); grad.addColorStop(0.55, 'rgba(255,170,40,0.05)'); grad.addColorStop(1, 'rgba(255,60,140,0.30)');
  } else if (grade === 'noir') {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(10,10,25,0.10)'); grad.addColorStop(1, 'rgba(5,5,15,0.45)');
  } else {
    grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,220,120,0.10)'); grad.addColorStop(1, 'rgba(255,140,60,0.12)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

/** Draws one photo into a panel rect, honouring its crop, with a diagonal clip when needed. */
function drawPanel(ctx, photo, rect, crop, state, diagonalFirst) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  if (state.layout === 'diagonal') {
    if (diagonalFirst) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 0.18, y + h); ctx.lineTo(x, y + h); }
    else { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.18, y + h); }
    ctx.closePath();
  } else ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo) {
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * crop.zoom;
    const pw = photo.naturalWidth * base, ph = photo.naturalHeight * base;
    ctx.filter = gradeFilter(state);
    ctx.drawImage(photo, x + (w - pw) / 2 + crop.panX * w, y + (h - ph) / 2 + crop.panY * h, pw, ph);
    ctx.filter = 'none';
  } else {
    const g2 = ctx.createLinearGradient(x, y, x + w, y + h);
    g2.addColorStop(0, '#3a1c5e'); g2.addColorStop(1, '#120a24');
    ctx.fillStyle = g2; ctx.fillRect(x, y, w, h);
  }
  gradeOverlay(ctx, { x, y, w, h }, state);
  ctx.restore();
  ctx.strokeStyle = state.frame ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.strokeRect(x, y, w, h);
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(2, Math.round(size * 0.04));
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

function drawTitle(ctx, state, W, H) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;
  const frame = state.frame ? W * 0.028 : W * 0.02;
  const bandH = H * 0.16;
  let ty;
  if (state.titlePos === 'top') ty = frame + H * 0.10;
  else if (state.titlePos === 'band') ty = H * 0.5 + H * 0.055;
  else ty = H - frame - H * 0.075;
  if (state.titlePos === 'band') {
    ctx.fillStyle = 'rgba(10,4,24,0.72)';
    ctx.fillRect(0, H * 0.5 - bandH / 2, W, bandH);
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(0, H * 0.5 - bandH / 2, W, Math.max(3, H * 0.008));
    ctx.fillStyle = '#00e5ff'; ctx.fillRect(0, H * 0.5 + bandH / 2 - Math.max(3, H * 0.008), W, Math.max(3, H * 0.008));
  } else {
    const g = ctx.createLinearGradient(0, ty - H * 0.13, 0, ty + H * 0.05);
    g.addColorStop(0, 'rgba(8,2,20,0)'); g.addColorStop(1, 'rgba(8,2,20,0.72)');
    ctx.fillStyle = g;
    ctx.fillRect(0, ty - H * 0.13, W, H * 0.19);
  }
  const family = `'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
  const maxW = W - frame * 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (title) {
    const size = fitFont(ctx, title, maxW, Math.min(W * 0.105, H * 0.115), family);
    const cx = W / 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.05;
    if (state.style === 'sunset') {
      const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
      grad.addColorStop(0, '#ffe259'); grad.addColorStop(0.5, '#ff7e3d'); grad.addColorStop(1, '#ff2e88');
      ctx.fillStyle = grad;
    } else if (state.style === 'neon') {
      ctx.fillStyle = state.titleColor;
      ctx.shadowColor = state.titleColor; ctx.shadowBlur = size * 0.55;
    } else ctx.fillStyle = state.titleColor;
    if (state.style !== 'outline') ctx.fillText(title, cx, ty);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = state.style === 'neon' ? '#ffffff' : '#14041f';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(title, cx, ty);
    if (state.style === 'outline') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillText(title, cx, ty); }
    if (state.style === 'badge') {
      const tw = ctx.measureText(title).width;
      ctx.fillStyle = '#ff2e88';
      const bx = cx - tw / 2 - size * 0.35, bw = tw + size * 0.7, bh = size * 1.25, by = ty - size * 0.95;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, size * 0.03); ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#ffffff'; ctx.fillText(title, cx, ty);
    }
    if (subtitle) {
      const subSize = Math.max(14, Math.min(W * 0.028, H * 0.032));
      ctx.font = `italic 700 ${subSize}px Georgia, 'Times New Roman', serif`;
      ctx.fillStyle = state.style === 'neon' ? '#aef7ff' : '#ffe9f4';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = subSize * 0.3;
      ctx.fillText(subtitle, cx, ty + subSize * 1.7);
      ctx.shadowBlur = 0;
    }
  }
}

function drawGrain(ctx, W, H) {
  let seed = 20261119;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rnd() * W, rnd() * H, Math.max(1, W * 0.0015), Math.max(1, W * 0.0015));
  }
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,0,15,0.38)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

function drawSun(ctx, W, H, state) {
  if (state.layout === 'full') return;
  const r = Math.min(W, H) * 0.075;
  const cx = W * 0.86, cy = H * 0.14;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe259'); g.addColorStop(0.55, '#ff7e3d'); g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20,4,30,0.55)';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - r, cy + r * (0.05 + i * 0.22), r * 2, r * 0.07);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
}

/** Draws the whole cover. `photos` is an array of images (or nulls) by panel. */
export function drawCover(ctx, W, H, state, photos) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#120a24'; ctx.fillRect(0, 0, W, H);
  const wide = W > H * 1.2;
  const rects = layoutRects(state.layout, wide);
  const n = panelCount(state.layout);
  const inset = state.frame ? W * 0.014 : 0;
  if (state.frame) { ctx.fillStyle = '#fdfbf7'; ctx.fillRect(0, 0, W, H); }
  ctx.save();
  ctx.translate(inset, inset);
  const iw = W - inset * 2, ih = H - inset * 2;
  for (let i = 0; i < n; i++) {
    const r = rects[i];
    const photo = photos[i] ?? photos[0] ?? null;
    drawPanel(ctx, photo, { x: r.x * iw, y: r.y * ih, w: r.w * iw, h: r.h * ih }, state.panels[i] ?? { zoom: 1.15, panX: 0, panY: 0 }, state, i === 0);
  }
  ctx.restore();
  drawSun(ctx, W, H, state);
  drawTitle(ctx, state, W, H);
  if (state.grain) drawGrain(ctx, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.strokeRect(W * 0.008, H * 0.008, W * 0.984, H * 0.984);
}

/** Which panel (index) contains normalised point (nx, ny), or -1. */
export function panelAt(state, W, H, nx, ny) {
  const wide = W > H * 1.2;
  const rects = layoutRects(state.layout, wide);
  const n = panelCount(state.layout);
  for (let i = n - 1; i >= 0; i--) {
    const r = rects[i];
    if (nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h) return i;
  }
  return -1;
}
