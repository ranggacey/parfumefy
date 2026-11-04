/*
 * Hero glow — WebGL2 modern, tanpa library (tanpa Three.js).
 * Satu kanvas di belakang hero: shader aurora amber/rose di atas dasar
 * tinta hangat yang mengalir pelan + partikel percikan wangi di atasnya.
 * Sengaja ringan:
 * dua program kecil, satu segitiga fullscreen + 240 titik, DPR dijepit,
 * RAF dijeda saat hero tidak terlihat atau tab hidden, dan pointer hanya
 * menggeser blob sedikit. Kalau WebGL2 tidak tersedia atau shader gagal
 * compile, init mengembalikan null dan kanvas tetap tersembunyi — situs
 * tampil persis seperti tanpa WebGL (fallback CSS biasa).
 */

const BG_VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const BG_FRAG = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
out vec4 fragColor;

float blob(vec2 p, vec2 c, float r) {
  float d = length((p - c) / r);
  return 1.0 - smoothstep(0.15, 1.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv - 0.5;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.06;
  vec2 drift = u_pointer * 0.06;
  vec3 base = vec3(0.078, 0.063, 0.047);
  vec3 tint = vec3(0.0);
  float a = 0.0;
  vec2 c1 = vec2(0.25 * sin(t * 0.9) + drift.x, 0.18 * cos(t * 0.7) + drift.y);
  float b1 = blob(p, c1, 0.55);
  tint += vec3(0.824, 0.635, 0.298) * b1; a += b1 * 0.55;
  vec2 c2 = vec2(-0.30 * cos(t * 0.6 + 1.7) + drift.x, -0.15 * sin(t * 0.8 + 0.5) + drift.y);
  float b2 = blob(p, c2, 0.50);
  tint += vec3(0.718, 0.431, 0.353) * b2; a += b2 * 0.50;
  vec2 c3 = vec2(0.20 * sin(t * 0.5 + 3.0) + drift.x, 0.25 * cos(t * 0.6 + 2.0) + drift.y);
  float b3 = blob(p, c3, 0.45);
  tint += vec3(0.95, 0.85, 0.60) * b3; a += b3 * 0.30;
  a = clamp(a, 0.0, 0.85);
  vec3 col = mix(base, clamp(tint, 0.0, 1.0), a);
  fragColor = vec4(col, 1.0);
}
`;

const PT_VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_misc;
uniform float u_time;
uniform float u_dpr;
out float v_tw;
void main() {
  vec2 p = a_pos;
  p.y = fract(p.y + u_time * a_misc.y * 0.015);
  p.x += sin(u_time * 0.25 + a_misc.x * 30.0) * 0.012;
  vec2 clip = vec2(p.x * 2.0 - 1.0, (1.0 - p.y) * 2.0 - 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_misc.x * u_dpr;
  v_tw = 0.55 + 0.45 * sin(u_time * (0.6 + a_misc.y) + a_misc.x * 40.0);
}
`;

const PT_FRAG = `#version 300 es
precision mediump float;
in float v_tw;
out vec4 fragColor;
void main() {
  float dist = length(gl_PointCoord - 0.5);
  float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * (0.20 + 0.45 * v_tw);
  fragColor = vec4(1.0, 0.82, 0.55, alpha);
}
`;

const COUNT = 240;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[heroGlow] shader gagal:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function program(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const pr = gl.createProgram();
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    console.warn('[heroGlow] link gagal:', gl.getProgramInfoLog(pr));
    return null;
  }
  return pr;
}

export function initHeroGlow(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
  });
  if (!gl) return null;

  const bgProg = program(gl, BG_VERT, BG_FRAG);
  const ptProg = program(gl, PT_VERT, PT_FRAG);
  if (!bgProg || !ptProg) return null;

  const bgLoc = {
    res: gl.getUniformLocation(bgProg, 'u_res'),
    time: gl.getUniformLocation(bgProg, 'u_time'),
    pointer: gl.getUniformLocation(bgProg, 'u_pointer'),
  };
  const ptLoc = {
    time: gl.getUniformLocation(ptProg, 'u_time'),
    dpr: gl.getUniformLocation(ptProg, 'u_dpr'),
  };

  // Segitiga fullscreen (menutupi layar dengan 1 segitiga).
  const bgVao = gl.createVertexArray();
  gl.bindVertexArray(bgVao);
  const bgBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Partikel: [x, y, ukuran px, kecepatan] x COUNT.
  const ptVao = gl.createVertexArray();
  gl.bindVertexArray(ptVao);
  const arr = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    arr[i * 4] = Math.random();
    arr[i * 4 + 1] = Math.random();
    arr[i * 4 + 2] = 2 + Math.random() * 4.5;
    arr[i * 4 + 3] = 0.5 + Math.random() * 0.5;
  }
  const ptBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const pointer = [0, 0];
  let raf = 0;
  let running = false;
  let visible = true;
  let start = performance.now();

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = (now - start) / 1000;
    resize();
    gl.clearColor(0.078, 0.063, 0.047, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(bgProg);
    gl.uniform2f(bgLoc.res, canvas.width, canvas.height);
    gl.uniform1f(bgLoc.time, t);
    gl.uniform2f(bgLoc.pointer, pointer[0], pointer[1]);
    gl.bindVertexArray(bgVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(ptProg);
    gl.uniform1f(ptLoc.time, t);
    gl.uniform1f(ptLoc.dpr, dpr);
    gl.bindVertexArray(ptVao);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  function play() {
    if (running) return;
    running = true;
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const hero = canvas.closest('.hero');
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer[0] = (e.clientX - r.left) / r.width - 0.5;
    pointer[1] = (e.clientY - r.top) / r.height - 0.5;
  };
  if (hero) hero.addEventListener('pointermove', onMove);

  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !document.hidden) play();
    else stop();
  });
  io.observe(canvas);

  const onVis = () => {
    if (document.hidden) stop();
    else if (visible) play();
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);

  resize();
  play();

  return () => {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', resize);
    if (hero) hero.removeEventListener('pointermove', onMove);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  };
}
