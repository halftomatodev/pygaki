// 등장 효과를 WebGL로 그린다. 렌파이처럼 글자를 그림으로 만들고, 글자마다 조각(줄 높이 × 글자 폭, 중심은 글자 밑줄 자리)을
// 나눠 렌파이와 같은 값(a_text_*, u_text_*, u_time, tex0, res0 ...)을 넘긴다. 셰이더는 showpy와 같은 파일에서 온다.
// 글자 자리는 화면에 깔린 글자(span.ch, 보이지 않게 둠)에서 잰다. WebGL이 안 되면 onFail을 불러 CSS 흉내로 돌아간다.
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import type { Tagged } from '../textTags';
import { colorValue, shaderSource, type TextShader, type UniformValue } from './textShaders';

// 조각 꼭짓점 하나에 넣는 값 (renpy/gl2/gl2mesh.pyx의 TEXT_LAYOUT + 위치)
const ATTRS: [string, number][] = [
  ['a_position', 4], ['a_tex_coord', 2], ['a_text_center', 2], ['a_text_time', 1], ['a_text_min_time', 1], ['a_text_max_time', 1],
  ['a_text_index', 1], ['a_text_pos_rect', 4], ['a_text_ascent', 1], ['a_text_descent', 1], ['a_text_pseudo_glyph', 1],
];
const STRIDE = ATTRS.reduce((n, [, k]) => n + k, 0);
const FUTURE = 1e6; // 아직 언제 나올지 모르는 글자
const LOD_BIAS = -0.6; // 렌파이 config.gl_lod_bias

interface GlyphBox { i: number; ch: string; x: number; w: number; top: number; bottom: number; base: number; ascent: number; descent: number; font: string; color: string; alpha: number }
interface Line { top: number; bottom: number; base: number; glyphs: GlyphBox[] }
interface Layout { w: number; h: number; lines: Line[]; size: number }

let measureCtx: CanvasRenderingContext2D | null = null;
const metrics = (font: string, ch: string) => {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx!.font = font;
  const m = measureCtx!.measureText(ch.trim() ? ch : 'M');
  return { ascent: m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent, descent: m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent };
};

// 화면의 글자 자리를 게임 픽셀로 잰다 (글 칸이 줄어 보여도 원래 크기로)
function measure(box: HTMLElement): Layout | null {
  const W = box.offsetWidth;
  const H = box.offsetHeight;
  if (!W || !H) return null;
  const br = box.getBoundingClientRect();
  const s = br.width / W || 1;
  const lines: Line[] = [];
  let size = 0;
  for (const el of box.querySelectorAll<HTMLElement>(':scope > .ch')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const font = cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const ch = el.textContent ?? '';
    const m = metrics(font, ch);
    const top = (r.top - br.top) / s;
    const g: GlyphBox = {
      i: Number(el.dataset.i), ch, x: (r.left - br.left) / s, w: r.width / s, top, bottom: top + r.height / s, base: top + m.ascent,
      ascent: m.ascent, descent: m.descent, font, color: cs.color, alpha: Number(cs.opacity) || 1,
    };
    size = Math.max(size, parseFloat(cs.fontSize) || 0);
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.base - g.base) < 1 && g.x >= last.glyphs[last.glyphs.length - 1].x - 0.5) {
      last.glyphs.push(g);
      last.top = Math.min(last.top, g.top);
      last.bottom = Math.max(last.bottom, g.bottom);
      last.base = Math.max(last.base, g.base);
    } else lines.push({ top: g.top, bottom: g.bottom, base: g.base, glyphs: [g] });
  }
  // 렌파이처럼 그림의 폭은 칸 폭이 아니라 가장 긴 줄의 폭 (줄 오른쪽 빈 조각이 칸 끝까지 늘어나지 않게)
  const w = Math.min(W, Math.ceil(Math.max(1, ...lines.map((l) => { const g = l.glyphs[l.glyphs.length - 1]; return g.x + g.w; }))));
  // 줄의 위아래: 첫 줄은 0부터, 줄 사이는 가운데에서 나누고, 마지막 줄은 글 칸 끝까지 (렌파이도 같음)
  lines.forEach((l, k) => {
    const next = lines[k + 1];
    l.bottom = next ? (l.bottom + next.top) / 2 : H;
  });
  lines.forEach((l, k) => (l.top = k ? lines[k - 1].bottom : 0));
  return { w, h: H, lines, size };
}

// 글자를 그림으로. color가 있으면 외곽선 겹 (그 색으로, 굵기만큼 두껍게)
function paint(layout: Layout, k: number, color: string | null, outline: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(layout.w * k));
  c.height = Math.max(1, Math.ceil(layout.h * k));
  const ctx = c.getContext('2d')!;
  ctx.scale(k, k);
  ctx.textBaseline = 'alphabetic';
  for (const l of layout.lines)
    for (const g of l.glyphs) {
      if (!g.ch.trim()) continue;
      ctx.font = g.font;
      ctx.globalAlpha = g.alpha;
      ctx.fillStyle = color ?? g.color;
      if (outline > 0) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = outline * 2;
        ctx.strokeStyle = color ?? g.color;
        ctx.strokeText(g.ch, g.x, l.base);
      }
      ctx.fillText(g.ch, g.x, l.base);
    }
  return c;
}

export interface Timing { min: (i: number) => number; dur: (i: number) => number } // 초. 글자 번호는 parsed.glyphs 기준

// 조각 만들기 (renpy/text/text.py create_mesh_displayable + gl2mesh2.pyx add_glyph). 단위는 그림 픽셀
function buildMesh(layout: Layout, k: number, t: Timing) {
  const quads: number[][] = [];
  const tw = Math.ceil(layout.w * k);
  const th = Math.ceil(layout.h * k);
  let index = 0; // 렌파이 글자 번호 (줄바꿈은 세지 않음)
  let lastIndex = 0;
  let lastTime = 0;
  const glyph = (cx: number, cy: number, idx: number, left: number, top: number, right: number, bottom: number, lt: number, rt: number, asc: number, desc: number, pseudo: number) => {
    if (right <= left) return;
    const mint = Math.min(lt, rt);
    const maxt = Math.max(lt, rt);
    const v = (x: number, y: number, time: number) => [x, y, 0, 1, x / tw, y / th, cx, cy, time, mint, maxt, idx, left, top, right - left, bottom - top, asc, desc, pseudo];
    quads.push([...v(left, bottom, lt), ...v(right, bottom, rt), ...v(right, top, rt), ...v(left, top, lt)]);
  };
  for (const l of layout.lines) {
    const top = l.top * k;
    const bottom = l.bottom * k;
    const base = l.base * k;
    const first = l.glyphs[0];
    let right = first.x * k;
    // 줄 왼쪽의 빈 곳 (가짜 글자)
    if (right > 0) glyph(right / 2, base, lastIndex, 0, top, right, bottom, lastTime, lastTime, base - top, bottom - base, 1);
    for (const g of l.glyphs) {
      const left = right;
      right = Math.min(tw, Math.max(left, (g.x + g.w) * k));
      const min = t.min(g.i);
      const end = min + t.dur(g.i);
      glyph((g.x + g.w / 2) * k, base, index, left, top, right, bottom, min, end, g.ascent * k, g.descent * k, 0);
      lastTime = end;
      lastIndex = index++;
    }
    // 줄 오른쪽의 빈 곳
    if (right < tw) glyph(right + (tw - right) / 2, base, lastIndex, right, top, tw, bottom, lastTime, lastTime, base - top, bottom - base, 1);
  }
  const data = new Float32Array(quads.length * 4 * STRIDE);
  quads.forEach((q, n) => data.set(q, n * 4 * STRIDE));
  const idx = new Uint16Array(quads.length * 6);
  for (let n = 0; n < quads.length; n++) idx.set([n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3], n * 6);
  return { data, idx, count: quads.length * 6, tw, th };
}

interface Program { prog: WebGLProgram; attrs: [number, number, number][]; uniforms: { loc: WebGLUniformLocation; name: string; type: number }[] }

class Renderer {
  gl: WebGLRenderingContext;
  programs = new Map<string, Program>();
  vbo: WebGLBuffer;
  ibo: WebGLBuffer;
  textures: WebGLTexture[] = [];
  count = 0;
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL을 쓸 수 없어요');
    this.gl = gl;
    this.vbo = gl.createBuffer()!;
    this.ibo = gl.createBuffer()!;
  }

  program(parts: string[]): Program {
    const src = shaderSource(parts);
    const had = this.programs.get(src.key);
    if (had) return had;
    const gl = this.gl;
    const compile = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('셰이더 오류: ' + gl.getShaderInfoLog(s) + '\n' + code);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, src.vertex));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, src.fragment));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('셰이더 연결 오류: ' + gl.getProgramInfoLog(prog));
    const attrs: [number, number, number][] = [];
    let off = 0;
    for (const [name, size] of ATTRS) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc >= 0) attrs.push([loc, size, off]);
      off += size;
    }
    const uniforms: Program['uniforms'] = [];
    for (let n = 0; n < gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); n++) {
      const u = gl.getActiveUniform(prog, n)!;
      uniforms.push({ loc: gl.getUniformLocation(prog, u.name)!, name: u.name, type: u.type });
    }
    const p = { prog, attrs, uniforms };
    this.programs.set(src.key, p);
    return p;
  }

  setTextures(layers: HTMLCanvasElement[]) {
    const gl = this.gl;
    for (const t of this.textures) gl.deleteTexture(t);
    this.textures = layers.map((c) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
  }

  setMesh(data: Float32Array, idx: Uint16Array, count: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW);
    this.count = count;
  }

  // 겹마다 한 번씩 그린다. 외곽선 겹이 먼저(뒤), 글자가 마지막
  draw(p: Program, layers: { tex: number; values: Map<string, UniformValue> }[]) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.count) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(p.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    for (const [loc, size, off] of p.attrs) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    }
    for (const layer of layers) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[layer.tex]);
      for (const u of p.uniforms) {
        if (u.type === gl.SAMPLER_2D) {
          gl.uniform1i(u.loc, 0);
          continue;
        }
        const v = layer.values.get(u.name);
        if (v === undefined) continue;
        const a = typeof v === 'number' ? [v] : v;
        if (u.type === gl.FLOAT) gl.uniform1f(u.loc, a[0]);
        else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.loc, a);
        else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.loc, a);
        else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.loc, a);
        else if (u.type === gl.FLOAT_MAT4) gl.uniformMatrix4fv(u.loc, false, a);
        else if (u.type === gl.INT || u.type === gl.BOOL) gl.uniform1i(u.loc, a[0]);
      }
      gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export const webglOk = (() => {
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
})();

const T0 = performance.now();
const now = () => (performance.now() - T0) / 1000;

export interface FxCanvasProps {
  target: RefObject<HTMLElement | null>; // 글자(span.ch)가 깔린 칸. 캔버스는 이 칸의 형제로 같은 부모 안에 놓인다
  ts: TextShader;
  parsed: Tagged;
  shown: number; // 지금까지 나온 글자 수 (useReveal)
  limit: number; // 멈춤 전까지 나올 수 있는 글자 수
  holding: boolean; // 앞 줄 전환을 기다리는 중
  fast: boolean; // 클릭으로 한 번에 보였음
  cps: number;
  onFail(e: unknown): void;
}

export function FxCanvas({ target, ts, parsed, shown, limit, holding, fast, cps, onFail }: FxCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    r: null as Renderer | null,
    layout: null as Layout | null,
    k: 1,
    margin: 0,
    t0: -1, // 글자가 나오기 시작한 때
    reach: [] as number[], // reach[n]: shown이 n이 된 때
    raf: 0,
    lastMin: 0,
    lastDur: 0,
    props: null as FxCanvasProps | null,
    timing: null as Timing | null,
  });
  st.current.props = { target, ts, parsed, shown, limit, holding, fast, cps, onFail };

  // 시간 기록: shown이 늘 때마다 그때를 적는다
  const s = st.current;
  if (holding) (s.t0 = -1), (s.reach = []);
  else {
    if (s.t0 < 0) s.t0 = now();
    for (let n = 0; n <= shown; n++) if (s.reach[n] === undefined) s.reach[n] = now();
  }

  const rateOf = (i: number) => {
    const g = parsed.glyphs[i];
    return !g ? cps : g.fixed ? g.rate : cps * g.rate;
  };
  const timing: Timing = {
    min: (i) => {
      if (fast) return 0;
      if (holding) return FUTURE;
      const at = (n: number) => s.reach[n] - s.t0;
      if (i < shown) return at(i);
      if (shown >= limit) return FUTURE; // {w}에서 멈춘 동안 뒤 글자는 안 나옴
      if (i === shown) return at(shown);
      const r = rateOf(shown);
      return r > 0 ? at(shown) + (i - shown) / r : at(shown);
    },
    dur: (i) => (fast ? 0 : rateOf(i) > 0 ? 1 / rateOf(i) : 0),
  };
  s.timing = timing;

  // 그리기 한 번. 더 그려야 하면 다음 프레임을 부른다
  const frame = () => {
    const s = st.current;
    const p = s.props!;
    s.raf = 0;
    if (!s.r || !s.layout) return;
    try {
      const slowDur = p.cps > 0 ? 1 / p.cps : 0;
      const maxTime = s.lastMin + s.lastDur + p.ts.extraSlowDuration * slowDur;
      const done = p.fast || (p.shown >= p.parsed.glyphs.length && !p.holding);
      const elapsed = p.holding || s.t0 < 0 ? 0 : now() - s.t0;
      const slow = p.fast ? maxTime : done ? Math.min(elapsed, maxTime) : elapsed;
      const prog = s.r.program(['renpy.texture', ...p.ts.parts]);
      const { k, margin } = s;
      const cw = s.r.canvas.width;
      const ch = s.r.canvas.height;
      const outlines = p.ts.outlines;
      const maxDepth = outlines.length;
      const layers = [...outlines.map((o, n) => ({ o, n })), { o: null, n: outlines.length }].map(({ o, n }) => {
        const xo = (o?.[2] ?? 0) * k;
        const yo = (o?.[3] ?? 0) * k;
        // 그림 픽셀 → 캔버스 클립 좌표 (y는 아래로)
        const tx = (2 * (margin * k + xo)) / cw - 1;
        const ty = 1 - (2 * (margin * k + yo)) / ch;
        const values = new Map<string, UniformValue>([
          ['u_transform', [2 / cw, 0, 0, 0, 0, -2 / ch, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1]],
          ['u_lod_bias', LOD_BIAS],
          ['res0', [Math.ceil(s.layout!.w * k), Math.ceil(s.layout!.h * k)]],
          ['u_time', now() % 86400],
          ['u_random', [Math.random(), Math.random(), Math.random(), Math.random()]],
          ['u_drawable_size', [cw, ch]],
          ['u_text_slow_time', slow],
          ['u_text_slow_duration', slowDur],
          ['u_text_depth', maxDepth - n],
          ['u_text_max_depth', maxDepth],
          ['u_text_outline', o?.[0] ?? 0],
          ['u_text_offset', [o?.[2] ?? 0, o?.[3] ?? 0]],
          ['u_text_main', o ? 0 : 1],
          ['u_text_to_virtual', 1 / k],
          ['u_text_to_drawable', k],
          ...p.ts.uniforms,
        ]);
        return { tex: n, values };
      });
      s.r.draw(prog, layers);
      if (p.ts.redraw || !done || slow < maxTime) s.raf = requestAnimationFrame(frame);
    } catch (e) {
      p.onFail(e);
    }
  };
  const kick = () => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(frame);
  };

  // 조각의 시간 값: 글자가 나올 때마다 다시 만든다
  const remesh = () => {
    const s = st.current;
    const timing = s.timing;
    if (!s.r || !s.layout || !timing) return;
    const m = buildMesh(s.layout, s.k, timing);
    s.r.setMesh(m.data, m.idx, m.count);
    const last = s.layout.lines.flatMap((l) => l.glyphs).pop();
    s.lastMin = last ? Math.min(timing.min(last.i), FUTURE) : 0;
    s.lastDur = last ? timing.dur(last.i) : 0;
    kick();
  };

  // 글자 자리 재기와 그림 만들기: 글이나 크기, 글꼴이 바뀌면 다시
  const relayout = () => {
    const s = st.current;
    const p = s.props!;
    const box = p.target.current;
    const c = canvas.current;
    if (!box || !c) return;
    try {
      s.r ??= new Renderer(c);
      const layout = measure(box);
      if (!layout) return;
      const scale = box.getBoundingClientRect().width / layout.w || 1;
      const k = Math.min(Math.max(scale * (window.devicePixelRatio || 1), 1), 4096 / (layout.w + 400));
      const margin = Math.round(Math.max(80, layout.size * 3));
      s.layout = layout;
      s.k = k;
      s.margin = margin;
      c.style.left = box.offsetLeft - margin + 'px';
      c.style.top = box.offsetTop - margin + 'px';
      c.style.width = layout.w + margin * 2 + 'px';
      c.style.height = layout.h + margin * 2 + 'px';
      c.width = Math.ceil((layout.w + margin * 2) * k);
      c.height = Math.ceil((layout.h + margin * 2) * k);
      const outlines = p.ts.outlines;
      s.r.setTextures([...outlines.map(([size, color]) => paint(layout, k, normColor(color), size)), paint(layout, k, null, 0)]);
      remesh();
    } catch (e) {
      p.onFail(e);
    }
  };

  useLayoutEffect(relayout, [parsed, ts]);
  useLayoutEffect(remesh, [shown, limit, holding, fast, cps]);

  useEffect(() => {
    const box = target.current;
    if (!box) return;
    let alive = true;
    const again = () => alive && relayout();
    document.fonts?.ready.then(again);
    document.fonts?.addEventListener?.('loadingdone', again);
    const ro = new ResizeObserver(again);
    ro.observe(box);
    if (box.parentElement) ro.observe(box.parentElement);
    return () => {
      alive = false;
      document.fonts?.removeEventListener?.('loadingdone', again);
      ro.disconnect();
    };
  }, [target]);

  useEffect(
    () => () => {
      const s = st.current;
      if (s.raf) cancelAnimationFrame(s.raf);
      s.r?.dispose();
      s.r = null;
    },
    [],
  );

  return <canvas ref={canvas} className="fx-canvas" aria-hidden />;
}

// "#2a4cff" 같은 렌파이 색을 캔버스 색으로
const normColor = (c: string) => {
  const [r, g, b, a] = colorValue(c);
  return a > 0 ? `rgba(${(r / a) * 255}, ${(g / a) * 255}, ${(b / a) * 255}, ${a})` : 'transparent';
};
