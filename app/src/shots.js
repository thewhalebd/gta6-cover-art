// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the cover alone, full frame. Query params pick the
// scene: photo / photo2 (samples/<name>.jpg), caption, subtitle, layout, grade,
// style, preset, size (1080x1080, 1080x1350, 1920x1080). window.__shotReady is
// set once painted, so a headless browser can wait for it before screenshotting.
export async function runShot(shot, query, api) {
  const { state, loadImage, redraw, setStatus } = api;
  const preset = query.get('preset');
  if (preset) {
    const { PRESETS } = await import('./cover.js');
    if (PRESETS[preset]) Object.assign(state, PRESETS[preset]);
  }
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('style')) state.style = query.get('style');
  if (query.get('titlePos')) state.titlePos = query.get('titlePos');
  if (query.get('caption')) state.title = query.get('caption');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('size')) {
    const sel = document.getElementById('exportSize');
    if (sel) { sel.value = query.get('size'); sel.dispatchEvent(new Event('change')); }
  }
  const names = [query.get('photo') ?? 'boulevard', query.get('photo2') ?? query.get('photo') ?? 'pier'];
  const imgs = [];
  for (const n of names) imgs.push(await loadImage(`samples/${n}.jpg`));
  // Alternate the two photos across panels so multi-panel layouts show both.
  api.photos[0] = imgs[0]; api.photos[1] = imgs[1]; api.photos[2] = imgs[0]; api.photos[3] = imgs[1];
  const titleEl = document.getElementById('title');
  const subEl = document.getElementById('subtitle');
  if (titleEl) titleEl.value = state.title;
  if (subEl) subEl.value = state.subtitle;
  document.querySelectorAll('#layoutGrid button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeGrid button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#styleGrid button').forEach((b) => b.classList.toggle('active', b.dataset.style === state.style));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  setStatus('Screenshot scene ready.');
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
