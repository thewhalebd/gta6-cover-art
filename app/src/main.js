// Vice Sunset Cover Studio — wires the editor: photo upload (picker + drag-and-drop),
// sample photos, layout / grade / caption controls, per-panel crop by click, drag
// and wheel on the preview, one-click presets, and PNG export at three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, panelCount, panelAt, PRESETS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const status = $('status');
const state = defaultState();
// photos[i] is the image for panel i (null = empty panel); slots beyond the
// loaded photos fall back to photos[0] in drawCover.
let photos = [null, null, null, null];
let previewSize = { w: 1080, h: 1080 };

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setStatus(msg) { status.textContent = msg; }

function redraw() {
  const { w, h } = previewSize;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(ctx, w, h, state, photos);
  const crop = state.panels[state.selected];
  $('zoom').value = crop.zoom; $('panX').value = crop.panX; $('panY').value = crop.panY;
  $('panelLabel').textContent = `Selected panel: ${['Hero', 'Panel 2', 'Panel 3', 'Panel 4'][state.selected] ?? 'Hero'} (${state.selected + 1} of ${panelCount(state.layout)})`;
}

/** Applies the export-size picker to the preview canvas (keeps the cover live). */
function applySize() {
  const [w, h] = $('exportSize').value.split('x').map(Number);
  previewSize = { w, h };
  redraw();
}

async function addFiles(files) {
  const imgs = [];
  for (const file of [...files].slice(0, 4)) {
    if (!file.type.startsWith('image/')) continue;
    imgs.push(await loadImage(URL.createObjectURL(file)));
  }
  if (!imgs.length) return;
  // First photo fills every empty panel; extra photos fill panels in order.
  imgs.forEach((img, k) => { photos[k] = img; });
  setStatus(`Loaded ${imgs.length} photo${imgs.length > 1 ? 's' : ''} — pick a layout and export.`);
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  photos[state.selected] = img;
  if (!photos.some((p, i) => p && i !== state.selected)) photos = photos.map(() => img);
  setStatus(`Sample “${name}” loaded into panel ${state.selected + 1}.`);
  redraw();
}

function bindGroup(id, key, fn) {
  $(id).querySelectorAll('button[data-' + key + ']').forEach((btn) => {
    btn.addEventListener('click', () => {
      $(id).querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      fn(btn.dataset[key]);
      redraw();
    });
  });
}

bindGroup('layoutGrid', 'layout', (v) => { state.layout = v; state.selected = 0; });
bindGroup('gradeGrid', 'grade', (v) => { state.grade = v; });
bindGroup('styleGrid', 'style', (v) => { state.style = v; });
$('presetGrid').querySelectorAll('button[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const p = PRESETS[btn.dataset.preset];
    Object.assign(state, p);
    document.querySelectorAll('#layoutGrid button').forEach((b) => b.classList.toggle('active', b.dataset.layout === p.layout));
    document.querySelectorAll('#gradeGrid button').forEach((b) => b.classList.toggle('active', b.dataset.grade === p.grade));
    document.querySelectorAll('#styleGrid button').forEach((b) => b.classList.toggle('active', b.dataset.style === p.style));
    $('warmth').value = p.warmth; $('contrast').value = p.contrast; $('saturation').value = p.saturation;
    $('titleColor').value = p.titleColor; $('titlePos').value = p.titlePos;
    setStatus(`Look applied: ${btn.textContent}.`);
    redraw();
  });
});

$('photoFiles').addEventListener('change', (e) => addFiles(e.target.files));
const dz = $('dropzone');
['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
['dragover', 'drop'].forEach((ev) => document.body.addEventListener(ev, (e) => e.preventDefault()));
document.querySelectorAll('.sample-btn').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.sample)));
$('fillAll').addEventListener('click', () => {
  const img = photos[state.selected];
  if (!img) { setStatus('Load a photo first, then fill all panels with it.'); return; }
  photos = photos.map(() => img);
  setStatus('One photo now fills every panel — crop each panel differently.');
  redraw();
});

// Caption + grade sliders.
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; redraw(); });
$('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
$('warmth').addEventListener('input', (e) => { state.warmth = +e.target.value; redraw(); });
$('contrast').addEventListener('input', (e) => { state.contrast = +e.target.value; redraw(); });
$('saturation').addEventListener('input', (e) => { state.saturation = +e.target.value; redraw(); });
$('frameToggle').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });
$('grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('exportSize').addEventListener('change', applySize);

// Per-panel crop sliders act on the selected panel.
$('zoom').addEventListener('input', (e) => { state.panels[state.selected].zoom = +e.target.value; redraw(); });
$('panX').addEventListener('input', (e) => { state.panels[state.selected].panX = +e.target.value; redraw(); });
$('panY').addEventListener('input', (e) => { state.panels[state.selected].panY = +e.target.value; redraw(); });

// Click a panel to select it; drag on it to pan, wheel to zoom.
let dragging = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height, x: e.clientX, y: e.clientY };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(state, canvas.width, canvas.height, p.nx, p.ny);
  if (idx >= 0) { state.selected = idx; dragging = { x: p.x, y: p.y, panX: state.panels[idx].panX, panY: state.panels[idx].panY }; redraw(); }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  const crop = state.panels[state.selected];
  crop.panX = Math.max(-0.5, Math.min(0.5, dragging.panX + (e.clientX - dragging.x) / r.width));
  crop.panY = Math.max(-0.5, Math.min(0.5, dragging.panY + (e.clientY - dragging.y) / r.height));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const crop = state.panels[state.selected];
  crop.zoom = Math.max(1, Math.min(2.5, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// Export: render the same cover at full post size and download the PNG.
$('export').addEventListener('click', () => {
  const [w, h] = $('exportSize').value.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), w, h, state, photos);
  off.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-cover-${w}x${h}.png`;
    a.click();
    setStatus(`Saved vice-sunset-cover-${w}x${h}.png`);
  }, 'image/png');
});

// Shot scenes for screenshots, or a live editor with a sample preloaded.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { state, photos, loadImage, loadSample, applySize, redraw, setStatus });
} else {
  loadSample('boulevard').catch(() => redraw());
  redraw();
}
