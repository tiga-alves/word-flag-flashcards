(() => {
  'use strict';
  let canvas = document.getElementById('world-background');
  if (!canvas || !globalThis.FlagGlobeData) return;

  // Geometry and trigonometry are generated once at build time, not per frame.
  const bytes = Uint8Array.from(atob(globalThis.FlagGlobeData), char => char.charCodeAt(0));
  const packed = new DataView(bytes.buffer);
  const points = new Float32Array(bytes.length / 2);
  for (let i = 0; i < points.length; i++) points[i] = packed.getInt16(i * 2, true) / 32767;
  const count = points.length / 5;
  const tile = 32, levels = 16, atlasSize = tile * levels;
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = atlasSize;
  const paint = atlas.getContext('2d');
  if (!paint) return;
  // Bake all sparkle shapes and colors once. Rendering reuses these pixels.
  for (let color = 0; color < levels; color++) {
    const mix = color / (levels - 1);
    const rgb = `${Math.round(105 + mix * 64)},${Math.round(66 + mix * 59)},${Math.round(217 + mix * 33)}`;
    for (let phase = 0; phase < levels; phase++) {
      const sparkle = phase / (levels - 1);
      const cx = color * tile + tile / 2, cy = phase * tile + tile / 2;
      paint.fillStyle = `rgba(${rgb},${0.03 + sparkle * 0.1})`;
      paint.beginPath(); paint.arc(cx, cy, 4 * (1.8 + sparkle * 1.8), 0, Math.PI * 2); paint.fill();
      const ray = 4 * (1.25 + sparkle * 2.5), waist = 1.4;
      paint.fillStyle = `rgba(${rgb},${0.6 * (0.5 + sparkle * 0.5)})`;
      paint.beginPath(); paint.moveTo(cx, cy - ray);
      paint.lineTo(cx + waist, cy - waist); paint.lineTo(cx + ray, cy); paint.lineTo(cx + waist, cy + waist);
      paint.lineTo(cx, cy + ray); paint.lineTo(cx - waist, cy + waist); paint.lineTo(cx - ray, cy); paint.lineTo(cx - waist, cy - waist);
      paint.closePath(); paint.fill();
      paint.fillStyle = `rgba(${rgb},${0.62 + sparkle * 0.16})`;
      paint.beginPath(); paint.arc(cx, cy, 4 * (0.8 + sparkle * 0.3), 0, Math.PI * 2); paint.fill();
    }
  }
  let width = 0, height = 0, dpr = 1;
  let angle = -Math.PI / 10, sparkleTime = 0;
  let frame = 0, lastDraw = null, lastTick = null, inputUntil = 0;
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const tiltCos = Math.cos(-0.14), tiltSin = Math.sin(-0.14);
  let renderer;

  function createGPU(gl) {
    const vertexSource = `
      attribute vec3 a_position;
      attribute vec2 a_phase;
      uniform vec2 u_rotation, u_sparkle, u_resolution, u_center;
      uniform float u_radius, u_dpr;
      varying vec2 v_tile;
      varying float v_alpha;
      void main() {
        float x = a_position.x * u_rotation.x + a_position.z * u_rotation.y;
        float z = a_position.z * u_rotation.x - a_position.x * u_rotation.y;
        float y = a_position.y * 0.9902159962 + z * 0.1395431146;
        float depth = -a_position.y * 0.1395431146 + z * 0.9902159962;
        vec2 pixel = u_center + vec2(x, y) * u_radius;
        vec2 clip = pixel / u_resolution * 2.0 - 1.0;
        gl_Position = depth > 0.0 ? vec4(clip.x, -clip.y, 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
        float wave = clamp((1.0 + u_sparkle.y * a_phase.x + u_sparkle.x * a_phase.y) * 0.5, 0.0, 1.0);
        float square = wave * wave;
        float sparkle = square * square * square;
        float color = clamp(0.45 + x * 0.35 - y * 0.4, 0.0, 1.0);
        v_tile = floor(vec2(color, sparkle) * 15.0 + 0.5);
        v_alpha = clamp(0.2 + depth * 0.8, 0.0, 1.0);
        gl_PointSize = clamp(u_radius / 640.0, 0.55, 1.35) * (0.7 + max(depth, 0.0) * 0.3) * 8.0 * u_dpr;
      }`;
    const fragmentSource = `
      precision mediump float;
      uniform sampler2D u_atlas;
      varying vec2 v_tile;
      varying float v_alpha;
      void main() {
        vec4 sprite = texture2D(u_atlas, (v_tile * 32.0 + vec2(0.5) + gl_PointCoord * 31.0) / 512.0);
        gl_FragColor = vec4(sprite.rgb, sprite.a * v_alpha);
      }`;
    function shader(type, source) {
      const item = gl.createShader(type);
      gl.shaderSource(item, source); gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) { gl.deleteShader(item); throw new Error('Globe shader unavailable'); }
      return item;
    }
    const vertex = shader(gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Globe GPU unavailable');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    for (const [name, size, offset] of [['a_position', 3, 0], ['a_phase', 2, 12]]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 20, offset);
    }
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.uniform1i(gl.getUniformLocation(program, 'u_atlas'), 0);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const uniforms = {};
    for (const name of ['rotation', 'sparkle', 'resolution', 'center', 'radius', 'dpr']) uniforms[name] = gl.getUniformLocation(program, `u_${name}`);
    return {
      kind: 'gpu',
      resize() { gl.viewport(0, 0, canvas.width, canvas.height); },
      draw(radius, cx, cy) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniforms.rotation, Math.cos(angle), Math.sin(angle));
        gl.uniform2f(uniforms.sparkle, Math.cos(sparkleTime), Math.sin(sparkleTime));
        gl.uniform2f(uniforms.resolution, width, height); gl.uniform2f(uniforms.center, cx, cy);
        gl.uniform1f(uniforms.radius, radius); gl.uniform1f(uniforms.dpr, dpr);
        gl.drawArrays(gl.POINTS, 0, count);
      }
    };
  }
  function createFallback() {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;
    const originals = [];
    for (let color = 0; color < levels; color++) {
      for (let phase = 0; phase < levels; phase++) {
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = tile;
        sprite.getContext('2d').putImageData(paint.getImageData(color * tile, phase * tile, tile, tile), 0, 0);
        originals.push(sprite);
      }
    }
    let sprites = [], spriteSize = 0, stride = 1, fastFrames = 0;
    return {
      kind: '2d',
      resize() {
        context.setTransform(1, 0, 0, 1, 0, 0);
        const radius = Math.min(Math.max(width * 0.43, height * 0.62), 920);
        const size = Math.ceil(Math.max(0.55, Math.min(1.35, radius / 640)) * 8 * dpr);
        if (size === spriteSize) return;
        spriteSize = size;
        sprites = originals.map(original => {
          const sprite = document.createElement('canvas');
          sprite.width = sprite.height = size;
          sprite.getContext('2d').drawImage(original, 0, 0, size, size);
          return sprite;
        });
      },
      draw(radius, cx, cy) {
        const started = performance.now();
        context.clearRect(0, 0, canvas.width, canvas.height);
        const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(sparkleTime), st = Math.sin(sparkleTime);
        const half = spriteSize / (2 * dpr);
        for (let i = 0; i < points.length; i += 5 * stride) {
          const x = points[i] * ca + points[i + 2] * sa;
          const z = points[i + 2] * ca - points[i] * sa;
          const y = points[i + 1] * tiltCos - z * tiltSin;
          const depth = points[i + 1] * tiltSin + z * tiltCos;
          if (depth <= 0) continue;
          const px = cx + x * radius, py = cy + y * radius;
          if (px + half < 0 || px - half > width || py + half < 0 || py - half > height) continue;
          const wave = (1 + st * points[i + 3] + ct * points[i + 4]) * 0.5;
          const square = wave * wave;
          const sparkle = square * square * square;
          const blend = 0.45 + x * 0.35 - y * 0.4;
          const color = ((blend < 0 ? 0 : blend > 1 ? 1 : blend) * 15 + 0.5) | 0;
          const phase = ((sparkle > 1 ? 1 : sparkle) * 15 + 0.5) | 0;
          context.globalAlpha = 0.2 + depth * 0.8;
          context.drawImage(sprites[color * levels + phase], ((px - half) * dpr + 0.5) | 0, ((py - half) * dpr + 0.5) | 0);
        }
        const cost = performance.now() - started;
        if (cost > 8 && stride < 4) { stride++; fastFrames = 0; }
        else if (cost < 3 && stride > 1 && ++fastFrames > 90) { stride--; fastFrames = 0; }
        else if (cost >= 3) fastFrames = 0;
      }
    };
  }
  function replaceCanvas() {
    const replacement = document.createElement('canvas');
    replacement.id = 'world-background'; replacement.setAttribute('aria-hidden', 'true');
    canvas.replaceWith(replacement); canvas = replacement;
  }
  let gpu;
  try {
    gpu = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (gpu) renderer = createGPU(gpu);
  } catch (_) {
    if (gpu) replaceCanvas();
  }
  if (!renderer) renderer = createFallback();
  if (!renderer) return;
  canvas.dataset.renderer = renderer.kind;
  if (renderer.kind === 'gpu') canvas.addEventListener('webglcontextlost', () => {
    // A lost GPU must not stop the game or leave a broken background.
    replaceCanvas(); renderer = createFallback();
    if (renderer) { canvas.dataset.renderer = '2d'; resize(); syncAnimation(); }
    else { if (frame) window.cancelAnimationFrame(frame); frame = 0; }
  }, { once: true });

  function draw() {
    if (!width || !height) return;
    renderer.draw(Math.min(Math.max(width * 0.43, height * 0.62), 920), width * (width < 700 ? 0.7 : 0.76), height * 0.7);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    if (!width || !height) return;
    // Keep a full-screen background below three million physical pixels.
    dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3000000 / (width * height)));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    renderer.resize(); draw();
  }
  function animate(time) {
    if (document.hidden) { frame = 0; lastDraw = lastTick = null; return; }
    const elapsed = lastTick === null ? 0 : Math.min(time - lastTick, 100);
    lastTick = time;
    angle = (angle + elapsed * Math.PI * 2 / (motion?.matches ? 180000 : 60000)) % (Math.PI * 2);
    sparkleTime += elapsed * (motion?.matches ? 0.00045 : 0.0014);
    const interval = renderer.kind === 'gpu' ? 1000 / 60 : time < inputUntil ? 1000 / 20 : 1000 / 30;
    if (lastDraw === null || time - lastDraw >= interval - 0.1) {
      draw();
      lastDraw = time - (lastDraw === null ? 0 : (time - lastDraw) % interval);
    }
    frame = window.requestAnimationFrame(animate);
  }
  function syncAnimation() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0; lastDraw = lastTick = null;
    if (!document.hidden) frame = window.requestAnimationFrame(animate);
  }
  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(() => { resizeQueued = false; resize(); });
  }, { passive: true });
  document.addEventListener('input', () => { inputUntil = performance.now() + 180; }, { passive: true });
  document.addEventListener('visibilitychange', syncAnimation);
  if (motion?.addEventListener) motion.addEventListener('change', syncAnimation);
  else if (motion?.addListener) motion.addListener(syncAnimation);
  resize(); syncAnimation();
})();
