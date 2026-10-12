import {World, blockAt, parseSeed} from './world.js';
import {loadBuiltins, loadFiles} from './assets.js';
import {movePlayer, canStand} from './navigation.js';
import {visibleBlocks} from './scene.js';
import {validateLayout} from './validation.js';
import {Renderer} from './renderer.js';
const $ = id => document.getElementById(id), renderer = new Renderer($('world'));
const player = {u: 256, v: 440, direction: 'south', protagonist: 'female', walking: false};
let registry, world, importIssues = [], report = [], mode = 'world', seed = 323, previous = 0, frame = 0;
const keys = new Set(), slots = [];
const solid = {manifest: {objects: []}, navigation: {cells: Array.from({length: 32}, () => Array(32).fill(0))}};
function previewBlocks() {
  return slots.map((slot, i) => ({x: i % 2, y: Math.floor(i / 2), asset: registry.get(slot.value), roadMask: registry.get(slot.value).manifest.roadMask}));
}
function activeWorld() {
  if (mode === 'world') return world;
  const blocks = previewBlocks();
  return {block(x, y) { return blocks.find(b => b.x === x && b.y === y) || {asset: solid}; }};
}
function resetPlayer() {
  const candidate = activeWorld();
  const points = [[256, 440], [256, 80], [48, 48]];
  const point = points.find(([u, v]) => canStand(candidate, u, v));
  if (!point) throw new Error('No safe prototype spawn in first block');
  [player.u, player.v] = point;
}
function setReport(issues) {
  report = [...importIssues, ...issues]; const element = $('validation'); element.classList.toggle('bad', report.length > 0);
  element.replaceChildren();
  const line = document.createElement('strong'); line.textContent = report.length ? `${report.length} validation failure(s)` : '✓ Connections, corners & source assets valid'; element.append(line);
  for (const issue of report.slice(0, 15)) { const p = document.createElement('div'); p.textContent = `${issue.category}: ${issue.asset || ''} ${issue.message}`; element.append(p); }
  if (!report.length) { const p = document.createElement('div'); p.textContent = 'Canonical collars checked pixel-by-pixel. Open grass/roads are walkable; water and footprints block movement.'; element.append(p); }
}
function createSlots() {
  slots.length = 0; $('slots').replaceChildren();
  const defaults = ['F004-crossroads', 'F002-east-west', 'F002-north-south', 'F001-clearing'];
  for (let i = 0; i < 4; i++) {
    const box = document.createElement('div'), label = document.createElement('label'), select = document.createElement('select');
    label.textContent = ['NW block', 'NE block', 'SW block', 'SE block'][i]; label.htmlFor = `slot-${i}`; select.id = `slot-${i}`;
    for (const id of registry.keys()) { const option = document.createElement('option'); option.value = id; option.textContent = id; select.append(option); }
    if (registry.has(defaults[i])) select.value = defaults[i];
    select.addEventListener('change', () => { mode = 'preview'; $('mode').value = mode; setReport(validateLayout(previewBlocks())); try { resetPlayer(); } catch (e) { setReport([{category: 'spawn', message: e.message}]); } });
    slots.push(select); box.append(label, select); $('slots').append(box);
  }
}
async function install(result, custom = false) {
  if (!result.registry.size) { importIssues = result.issues; setReport([]); return; }
  registry = result.registry; importIssues = result.issues; world = new World(seed, registry); createSlots();
  mode = custom ? 'preview' : 'world'; $('mode').value = mode; $('mode').options[0].disabled = custom;
  resetPlayer(); setReport(mode === 'preview' ? validateLayout(previewBlocks()) : []);
}
$('seed-form').addEventListener('submit', e => {
  e.preventDefault(); try { seed = parseSeed($('seed').value); world = new World(seed, registry); resetPlayer(); setReport(mode === 'preview' ? validateLayout(previewBlocks()) : []); }
  catch (error) { setReport([{category: 'seed', message: error.message}]); }
});
$('mode').addEventListener('change', () => { mode = $('mode').value; resetPlayer(); setReport(mode === 'preview' ? validateLayout(previewBlocks()) : []); });
$('nova').addEventListener('change', () => player.protagonist = $('nova').value);
$('home').addEventListener('click', () => { try { resetPlayer(); } catch (e) { setReport([{category: 'spawn', message: e.message}]); } });
$('files').addEventListener('change', async () => {
  keys.clear(); try { await install(await loadFiles($('files').files), true); }
  catch (error) { importIssues = [{category: 'load', message: error.message}]; setReport([]); }
});
$('builtin').addEventListener('click', async () => { try { await install(await loadBuiltins()); } catch (e) { setReport([{category: 'load', message: e.message}]); } });
$('report').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({prototype: 'Phase 2A', seed, mode, failures: report,
    assets: [...registry.values()].map(a => ({id: a.manifest.id, groundBytes: a.groundInfo.bytes,
      decodedGroundBytes: a.groundInfo.width * a.groundInfo.height * 4}))}, null, 2)], {type: 'application/json'});
  const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = 'PocketQuest-scenery-validation.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const aliases = {w: 'north', arrowup: 'north', s: 'south', arrowdown: 'south', a: 'west', arrowleft: 'west', d: 'east', arrowright: 'east'};
window.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (aliases[e.key.toLowerCase()]) { e.preventDefault(); keys.add(aliases[e.key.toLowerCase()]); }
});
window.addEventListener('keyup', e => keys.delete(aliases[e.key.toLowerCase()]));
window.addEventListener('blur', () => keys.clear()); document.addEventListener('visibilitychange', () => keys.clear());
for (const button of document.querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', e => { button.setPointerCapture(e.pointerId); keys.add(button.dataset.move); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.move));
}
function tick(time) {
  const dt = Math.min((time - (previous || time)) / 1000, .05); previous = time;
  if (registry) {
    let dx = Number(keys.has('east')) - Number(keys.has('west')), dy = Number(keys.has('south')) - Number(keys.has('north'));
    const norm = Math.hypot(dx, dy); player.walking = norm > 0 && report.length === 0;
    if (player.walking) {
      player.direction = Math.abs(dx) ? dx > 0 ? 'east' : 'west' : dy > 0 ? 'south' : 'north';
      movePlayer(activeWorld(), player, dx / norm * 190 * dt, dy / norm * 190 * dt);
    }
    const zoom = Number($('zoom').value), blocks = mode === 'world' ? visibleBlocks(player, $('world').clientWidth, $('world').clientHeight, zoom).map(b => world.block(b.x, b.y)) : previewBlocks();
    renderer.draw(blocks, player, {zoom, grid: $('grid').checked, seams: $('seams').checked}, time);
    if (++frame % 15 === 0) {
      const b = blockAt(player.u, player.v);
      $('location').textContent = `WORLD ${Math.round(player.u)}, ${Math.round(player.v)} · BLOCK ${b.x}, ${b.y} · SEED ${seed}`;
      $('map-tag').textContent = mode === 'world' ? (b.x === 0 && b.y === 0 ? 'OAKWOOD RESERVE · PLACEHOLDER' : world.block(b.x, b.y).asset.manifest.family + ' · WILDERNESS') : '2 × 2 ASSET PREVIEW';
      if (mode === 'world' && !report.some(i => i.category === 'seed')) setReport(validateLayout(blocks));
    }
  }
  requestAnimationFrame(tick);
}
try { await install(await loadBuiltins()); requestAnimationFrame(tick); }
catch (error) { setReport([{category: 'startup', message: error.message}]); }
