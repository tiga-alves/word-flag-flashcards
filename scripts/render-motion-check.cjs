// Render the production canvas component offline; no browser or network required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createCanvas } = require('C:/Users/tiga_/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.cache', 'motion-check');
fs.mkdirSync(output, { recursive: true });
const source = fs.readFileSync(path.join(root, 'globe-data.js'), 'utf8') + fs.readFileSync(path.join(root, 'globe.js'), 'utf8');
const reports = [];
for (const reduced of [false, true]) {
  const canvas = createCanvas(1400, 900);
  canvas.dataset = {}; canvas.getBoundingClientRect = () => ({ width: 1400, height: 900 });
  let callback;
  const context = canvas.getContext('2d');
  vm.runInNewContext(source, { atob, performance: { now: () => 0 },
    document: { hidden: false, getElementById: () => canvas, createElement: () => createCanvas(1, 1), addEventListener() {} },
    window: {
      devicePixelRatio: 1,
      matchMedia: () => ({ matches: reduced, addEventListener() {} }),
      requestAnimationFrame(fn) { callback = fn; return 1; },
      cancelAnimationFrame() {}, addEventListener() {},
    },
  });
  const mode = reduced ? 'reduced' : 'normal';
  const before = context.getImageData(0, 0, 1400, 900).data;
  fs.writeFileSync(path.join(output, `${mode}-0s.png`), canvas.toBuffer('image/png'));
  // Realistic frame cadence is essential: production caps long-frame deltas.
  for (let tick = 0; tick <= 120; tick++) callback(tick * 1000 / 60);
  const after = context.getImageData(0, 0, 1400, 900).data;
  fs.writeFileSync(path.join(output, `${mode}-2s.png`), canvas.toBuffer('image/png'));
  let changedPixels = 0;
  let sample;
  for (let offset = 0; offset < before.length; offset += 4) {
    if (before.slice(offset, offset + 4).some((value, channel) => value !== after[offset + channel])) {
      changedPixels++;
      if (!sample) sample = { x: (offset / 4) % 1400, y: Math.floor(offset / 4 / 1400), before: [...before.slice(offset, offset + 4)], after: [...after.slice(offset, offset + 4)] };
    }
  }
  assert.ok(changedPixels > 10000, `${mode}: expected visible rotation`);
  reports.push({ mode, elapsedSeconds: 2, changedPixels, sample });
}
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports, null, 2));
