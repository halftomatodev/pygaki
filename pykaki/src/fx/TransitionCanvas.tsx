// 그림 효과(효과 폴더의 @transition)를 WebGL로 그린다. 게임(showpy image_effects.rpy)과 같은 셰이더 코드를 쓴다:
// 앞 그림(tex0)과 새 그림(tex1)을 한 장에 깔고, 효과 코드에 l__uv, l__old, l__new, l__t, l__size를 넘긴다.
// [효과] 화면의 샘플과 플레이 화면이 함께 쓴다.
import { useEffect, useRef } from 'react';
import { colorValue, type ShaderEffect } from './textShaders';

export type Picture = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap;

// u__이름 → u_imgfx_<효과>_이름 (image_effects.rpy _rename과 같음)
const rename = (name: string, code: string) => code.replace(/\b([ul])__(\w+)/g, (_m, k, rest) => `${k}_imgfx_${name}_${rest}`);

const VERTEX = `attribute vec2 a_position;
varying vec2 v_tex_coord;
void main() {
    v_tex_coord = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
const VARIABLES = `precision highp float;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float u_imgfx_t;
uniform vec2 u_imgfx_size;
varying vec2 v_tex_coord;
`;
const PRELUDE = `
    vec2 l__uv = v_tex_coord;
    vec4 l__old = texture2D(tex0, v_tex_coord);
    vec4 l__new = texture2D(tex1, v_tex_coord);
    float l__t = u_imgfx_t;
    vec2 l__size = u_imgfx_size;
`;

// 효과의 조각 셰이더 코드. @fragment가 없으면 이유를 던진다 (게임도 그 효과를 건너뜀)
export function transitionSource(e: ShaderEffect) {
  const code = new Map(e.code);
  const frag = code.get('fragment') ?? code.get('fragment_300');
  if (!frag) throw new Error('@fragment가 없어요: ' + e.name);
  return VARIABLES + rename(e.name, code.get('variables') ?? '') + '\nvoid main() {\n' + rename(e.name, PRELUDE + frag) + '}\n';
}

// @set의 기본값에 고친 값을 덮어 셰이더 값으로. 고친 값의 이름은 count나 u__count 어느 쪽이든 된다 (img_fx.use의 값 이름은 count)
export function transitionValues(e: ShaderEffect, args: Record<string, string> = {}): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const [key, def] of e.uniforms) {
    const short = key.replace(/^u__/, '');
    const v = (args[key] ?? args[short] ?? def).trim().replace(/^["']|["']$/g, '');
    const nums = v.startsWith('#') ? colorValue(v) : v.replace(/^\(|\)$/g, '').split(',').map(Number);
    if (!nums.length || nums.some(isNaN)) throw new Error(`${e.name}의 값을 읽지 못했어요: ${short}=${v}`);
    out.set(`u_imgfx_${e.name}_${short}`, nums);
  }
  return out;
}

class Renderer {
  gl: WebGLRenderingContext;
  prog: WebGLProgram | null = null;
  uniforms: { loc: WebGLUniformLocation; name: string; type: number }[] = [];
  textures: (WebGLTexture | null)[] = [null, null];
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('WebGL을 쓸 수 없어요');
    this.gl = gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  setEffect(e: ShaderEffect) {
    const gl = this.gl;
    if (this.prog) gl.deleteProgram(this.prog);
    this.prog = null;
    this.uniforms = [];
    const compile = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('셰이더 오류: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, transitionSource(e)));
    gl.bindAttribLocation(prog, 0, 'a_position');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('셰이더 연결 오류: ' + gl.getProgramInfoLog(prog));
    for (let n = 0; n < gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); n++) {
      const u = gl.getActiveUniform(prog, n)!;
      this.uniforms.push({ loc: gl.getUniformLocation(prog, u.name)!, name: u.name, type: u.type });
    }
    this.prog = prog;
  }

  setPicture(slot: 0 | 1, pic: Picture | null) {
    const gl = this.gl;
    if (this.textures[slot]) gl.deleteTexture(this.textures[slot]);
    this.textures[slot] = null;
    if (!pic) return;
    const t = (this.textures[slot] = gl.createTexture());
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  draw(t: number, size: [number, number], values: Map<string, number[]>) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.prog) return;
    gl.disable(gl.BLEND);
    gl.useProgram(this.prog);
    for (const slot of [0, 1]) {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[slot] ?? this.textures[0]); // 새 그림을 기다리는 동안은 앞 그림으로
    }
    for (const u of this.uniforms) {
      if (u.type === gl.SAMPLER_2D) {
        gl.uniform1i(u.loc, u.name === 'tex1' ? 1 : 0);
        continue;
      }
      const a = u.name === 'u_imgfx_t' ? [t] : u.name === 'u_imgfx_size' ? size : values.get(u.name);
      if (!a) continue;
      if (u.type === gl.FLOAT) gl.uniform1f(u.loc, a[0]);
      else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.loc, a);
      else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.loc, a);
      else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.loc, a);
      else if (u.type === gl.INT || u.type === gl.BOOL) gl.uniform1i(u.loc, a[0]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export interface TransitionCanvasProps {
  effect: ShaderEffect;
  args?: Record<string, string>; // 고친 값 (count 또는 u__count)
  time?: number; // 걸리는 초. 비우면 효과 파일의 @time
  old: Picture; // 앞 그림
  next: Picture | null; // 새 그림. null이면 올 때까지 앞 그림을 그리며 기다린다
  size: [number, number]; // 게임 화면 크기 (l__size). 그리는 크기는 앞 그림의 크기
  className?: string;
  onDone?(): void;
  onFail(e: unknown): void;
}

// 한 번 돈다. 다시 돌리려면 key를 바꿔서 새로 만든다
export function TransitionCanvas(props: TransitionCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const { effect, old, next } = props;
  const st = useRef({ r: null as Renderer | null, t0: -1, raf: 0, done: false, values: new Map<string, number[]>() });

  useEffect(() => {
    const s = st.current;
    const c = canvas.current;
    if (!c) return;
    const frame = () => {
      const p = latest.current;
      s.raf = 0;
      if (!s.r) return;
      try {
        const dur = p.time ?? p.effect.time;
        const t = s.t0 < 0 ? 0 : dur > 0 ? Math.min(1, (performance.now() - s.t0) / 1000 / dur) : 1;
        s.r.draw(t, p.size, s.values);
        if (s.t0 >= 0 && t < 1) s.raf = requestAnimationFrame(frame);
        else if (s.t0 >= 0 && !s.done) (s.done = true), p.onDone?.();
      } catch (e) {
        p.onFail(e);
      }
    };
    try {
      c.width = (old as HTMLCanvasElement).width || 1;
      c.height = (old as HTMLCanvasElement).height || 1;
      s.r ??= new Renderer(c);
      s.r.setEffect(effect);
      s.values = transitionValues(effect, latest.current.args);
      s.r.setPicture(0, old);
      s.r.setPicture(1, next);
      if (next) s.t0 = performance.now();
      frame();
    } catch (e) {
      latest.current.onFail(e);
    }
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.t0 = -1;
      s.done = false;
    };
  }, [effect, old, next]);

  useEffect(
    () => () => {
      st.current.r?.dispose();
      st.current.r = null;
    },
    [],
  );

  return <canvas ref={canvas} className={props.className} aria-hidden />;
}
