const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'globe.js'), 'utf8');
const data = fs.readFileSync(path.join(base, 'globe-data.js'), 'utf8');

function loadGlobe({ gpu = false, failShader = false, reduced = false, hidden = false, dpr = 1, slow = false } = {}) {
  const events = {}, pending = new Map(), frames = [], uploads = [], colors = [];
  let nextId = 1, clock = 0, canvasNumber = 0, paths = 0;
  let bounds = { width: 1200, height: 800 };
  let main;
  function makeCanvas() {
    const id = canvasNumber++;
    const item = {
      dataset: {}, width: 0, height: 0,
      getBoundingClientRect: () => bounds,
      setAttribute() {},
      addEventListener(name, fn) { events[name] = fn; },
      replaceWith(replacement) { main = replacement; },
    };
    const context = {
      setTransform() {},
      clearRect() { if (item === main) frames.push([]); },
      beginPath() { paths++; }, moveTo() {}, lineTo() {}, closePath() {}, arc() {},
      fill() { colors.push(this.fillStyle); },
      getImageData() { return {}; }, putImageData() {},
      drawImage(sprite, ...args) { if (item === main) frames.at(-1).push([sprite.number, ...args]); },
    };
    item.number = id;
    item.getContext = kind => kind === 'webgl' ? gpu && item === main ? gl : null : context;
    return item;
  }
  const uniforms = {};
  const gl = {
    VERTEX_SHADER:1, FRAGMENT_SHADER:2, COMPILE_STATUS:3, LINK_STATUS:4,
    ARRAY_BUFFER:5, STATIC_DRAW:6, FLOAT:7, TEXTURE0:8, TEXTURE_2D:9,
    RGBA:10, UNSIGNED_BYTE:11, POINTS:12,
    createShader: type => ({type}), shaderSource(item, code) { item.source = code; }, compileShader() {},
    getShaderParameter: () => !failShader, deleteShader() {},
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true, useProgram() {},
    createBuffer: () => ({}), bindBuffer() {}, bufferData(type, points) { uploads.push(Array.from(points)); },
    getAttribLocation: () => 0, enableVertexAttribArray() {}, vertexAttribPointer() {},
    createTexture: () => ({}), activeTexture() {}, bindTexture() {}, texParameteri() {}, texImage2D() {},
    uniform1i() {}, enable() {}, blendFuncSeparate() {}, clearColor() {}, viewport() {}, clear() {},
    getUniformLocation: (program, name) => name,
    uniform1f(name, a) { uniforms[name] = a; },
    uniform2f(name, a, b) { uniforms[name] = [a, b]; },
    drawArrays(type, start, count) { frames.push({type, start, count, ...uniforms}); },
  };
  main = makeCanvas();
  const motion = { matches: reduced, addEventListener(type, fn) { events.motion = fn; } };
  const document = {
    hidden, getElementById: () => main, createElement: makeCanvas,
    addEventListener(type, fn) { events[type] = fn; },
  };
  const window = {
    devicePixelRatio: dpr, matchMedia: () => motion,
    addEventListener(type, fn) { events[type] = fn; },
    requestAnimationFrame(fn) { const id = nextId++; pending.set(id, fn); return id; },
    cancelAnimationFrame(id) { pending.delete(id); },
  };
  vm.runInNewContext(data + source, { document, window, atob, performance: { now() { if (slow) clock += 12; return clock; } } });
  return {
    get canvas() { return main; }, get paths() { return paths; }, frames, uploads, colors, pending,
    tick(time) { clock = time; const work = [...pending.values()]; pending.clear(); work.forEach(fn => fn(time)); },
    setHidden(value) { document.hidden = value; events.visibilitychange(); },
    setReduced(value) { motion.matches = value; events.motion(); },
    input() { events.input(); },
    resize(width, height) { bounds = { width, height }; events.resize(); },
    loseGPU() { gpu = false; events.webglcontextlost(); },
  };
}

test('GPU: uma única chamada desenha todos os pontos, sem reconstruir geometria', () => {
  const globe = loadGlobe({gpu:true});
  assert.equal(globe.canvas.dataset.renderer, 'gpu');
  assert.equal(globe.uploads.length, 1);
  assert.equal(globe.uploads[0].length / 5, 9445);
  assert.ok(globe.uploads[0].every(Number.isFinite));
  const cachedPaths = globe.paths;
  globe.tick(0);
  const before = globe.frames.length;
  globe.tick(17);
  assert.equal(globe.frames.length, before + 1);
  assert.equal(globe.frames.at(-1).count, 9445);
  assert.notDeepEqual(globe.frames[0].u_rotation, globe.frames.at(-1).u_rotation);
  assert.notDeepEqual(globe.frames[0].u_sparkle, globe.frames.at(-1).u_sparkle);
  assert.equal(globe.uploads.length, 1);
  assert.equal(globe.paths, cachedPaths);
});

test('fallback reutiliza sprites, mantém rotação e não redesenha brilhos por quadro', () => {
  const globe = loadGlobe();
  assert.equal(globe.canvas.dataset.renderer, '2d');
  const initial = globe.frames[0];
  assert.ok(initial.length > 1000);
  assert.ok(initial.every(point => point.every(Number.isFinite)));
  const paths = globe.paths;
  globe.tick(0); globe.tick(40);
  assert.notDeepEqual(globe.frames.at(-1), initial);
  assert.equal(globe.paths, paths);
  assert.ok(globe.colors.every(color => {
    const [, r, g, b] = color.match(/^rgba\((\d+),(\d+),(\d+),/);
    return +b > +r && +r > +g;
  }));
});

test('fallback adapta densidade ao orçamento sem parar a animação', () => {
  const globe = loadGlobe({slow:true});
  const initialDots = globe.frames[0].length;
  for (let time = 0; time <= 200; time += 40) globe.tick(time);
  assert.ok(globe.frames.at(-1).length < initialDots / 2);
  assert.ok(globe.frames.at(-1).length > 200);
  assert.equal(globe.pending.size, 1);
});

test('digitar prioriza a interface no fallback sem congelar o globo', () => {
  const globe = loadGlobe();
  globe.tick(0); globe.input();
  const before = globe.frames.length;
  globe.tick(34);
  assert.equal(globe.frames.length, before);
  globe.tick(51);
  assert.equal(globe.frames.length, before + 1);
});

test('movimento reduzido continua animado e aba oculta pausa e retoma um loop', () => {
  for (const gpu of [false, true]) {
    const globe = loadGlobe({gpu, reduced:true});
    const before = globe.frames[0];
    globe.tick(0); globe.tick(50);
    assert.notDeepEqual(globe.frames.at(-1), before);
    globe.setHidden(true); assert.equal(globe.pending.size, 0);
    globe.setHidden(false); globe.setHidden(false); assert.equal(globe.pending.size, 1);
    globe.setReduced(false); assert.equal(globe.pending.size, 1);
  }
});

test('resize é agrupado e o fundo respeita o limite de pixels físicos', () => {
  const globe = loadGlobe({gpu:true, dpr:3});
  assert.equal(globe.canvas.width, 1800); assert.equal(globe.canvas.height, 1200);
  globe.resize(4000, 3000); globe.resize(4000, 3000);
  assert.equal(globe.pending.size, 2); // one animation and one resize
  globe.tick(100);
  assert.ok(globe.canvas.width * globe.canvas.height <= 3004000);
  globe.resize(390, 844); globe.tick(140);
  assert.equal(globe.canvas.width, 585); assert.equal(globe.canvas.height, 1266);
});

test('falha de shader ou perda de GPU recorre ao Canvas sem quebrar o jogo', () => {
  const failed = loadGlobe({gpu:true,failShader:true});
  assert.equal(failed.canvas.dataset.renderer,'2d');
  const lost = loadGlobe({gpu:true}); lost.loseGPU();
  assert.equal(lost.canvas.dataset.renderer,'2d');
  lost.tick(0); lost.tick(40);
  assert.ok(lost.frames.at(-1).length > 1000);
  assert.equal(lost.pending.size,1);
});

test('ausência do canvas ou dos dados não impede a página', () => {
  assert.doesNotThrow(() => vm.runInNewContext(source, {document:{getElementById:()=>null}}));
  assert.doesNotThrow(() => vm.runInNewContext(source, {document:{getElementById:()=>({})}}));
});
