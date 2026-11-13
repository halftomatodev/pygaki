// 화면 셰이더(pygaki 플러그인 screen_fx의 효과)를 WebGL로 그린다. 게임과 같은 셰이더 코드를 쓴다:
// 플러그인이 screen_fx/shader_list.json에 내놓은 코드 조각(glsl)을 렌파이가 합치는 차례대로 합친다 (LINK.md 11장).
// [효과] 화면의 [셰이더] 칸 샘플이 쓴다. 파이썬이 그림을 더 넣는 효과(extra, ASCII의 글자 그림)는 여기서 못 그린다.
import { useEffect, useRef } from 'react';
import type { ShaderInfo } from '../shader';
import type { Picture } from './TransitionCanvas';

const VERTEX = `attribute vec2 a_position;
varying vec2 v_tex_coord;
void main() {
    v_tex_coord = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// 이 셰이더를 앱에서 그릴 수 없는 까닭. 그릴 수 있으면 null
export function screenFxBlocked(info: ShaderInfo): string | null {
  if (!info.glsl?.length) return '이 게임의 셰이더 목록에 셰이더 코드가 없어요. 게임을 한 번 켠 뒤 [다시 읽기]를 눌러 주세요 (pygaki 플러그인이 예전 판이면 새 판으로)';
  if (info.extra) return '이 셰이더는 게임이 글자 그림을 만들어 넣어야 해서 앱에서는 그리지 못해요';
  return null;
}

// 조각 셰이더 코드: 변수(uniform, varying) → 함수 → main 안에 조각들을 차례대로
export function screenFxSource(info: ShaderInfo) {
  const parts = info.glsl ?? [];
  if (!parts.length) throw new Error('셰이더 코드가 없어요: ' + info.id);
  const vars: string[] = [];
  for (const p of parts)
    for (const raw of p.variables.split('\n')) {
      const l = raw.split('//')[0].trim().replace(/;$/, '');
      if (/^(uniform|varying)\s/.test(l) && !vars.includes(l)) vars.push(l);
    }
  const body = parts.flatMap((p) => p.fragment).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return 'precision highp float;\n' + vars.map((l) => l + ';\n').join('') + parts.map((p) => p.fragment_functions).join('\n') + '\nvoid main() {\n' + body.join('\n') + '\n}\n';
}

const hex = (v: string) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);

// 값 목록(PARAMS의 기본값에 고친 값을 덮은 것)을 셰이더 값으로. screen_fx.rpy ShaderEffect._apply_values와 같은 규칙
export function screenFxValues(info: ShaderInfo, args: Record<string, unknown>, size: [number, number]): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const prefix = info.prefix ?? `u_${info.id}_`;
  for (const [k, p] of Object.entries(info.params)) {
    const kind = String(p[0]);
    const x = args[k] ?? p[1];
    let a: number[];
    if (kind === 'str') continue;
    else if (kind === 'choice') a = [Math.max(0, ((p[2] as unknown[]) ?? []).findIndex((o) => JSON.stringify(o) === JSON.stringify(x)))];
    else if (kind === 'bool') a = [x ? 1 : 0];
    else if (kind === 'vec2' || kind === 'resolution') a = Array.isArray(x) ? [Number(x[0]), Number(x[1])] : [size[0] / 2, size[1] / 2];
    else if (kind === 'color') a = Array.isArray(x) ? x.slice(0, 3).map(Number) : hex(String(x));
    else a = [Number(x)];
    if (a.some((n) => !isFinite(n))) continue;
    out.set(prefix + k, a);
  }
  return out;
}

class Renderer {
  gl: WebGLRenderingContext;
  prog: WebGLProgram | null = null;
  uniforms: { loc: WebGLUniformLocation; name: string; type: number }[] = [];
  texture: WebGLTexture | null = null;
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('WebGL을 쓸 수 없어요');
    this.gl = gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  setShader(info: ShaderInfo) {
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
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, screenFxSource(info)));
    gl.bindAttribLocation(prog, 0, 'a_position');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('셰이더 연결 오류: ' + gl.getProgramInfoLog(prog));
    for (let n = 0; n < gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); n++) {
      const u = gl.getActiveUniform(prog, n)!;
      this.uniforms.push({ loc: gl.getUniformLocation(prog, u.name)!, name: u.name, type: u.type });
    }
    this.prog = prog;
  }

  setPicture(pic: Picture) {
    const gl = this.gl;
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  draw(time: number, size: [number, number], values: Map<string, number[]>) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.prog) return;
    gl.disable(gl.BLEND);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // 렌파이가 늘 넣어 주는 값들
    const std: Record<string, number[]> = {
      u_time: [time], u_model_size: size, u_drawable_size: size, u_virtual_size: size, u_lod_bias: [0],
      u_sfx_base: [1], u_sfx_text: [0], u_random: [Math.random(), Math.random(), Math.random(), Math.random()],
      u_viewport: [0, 0, size[0], size[1]],
    };
    for (const u of this.uniforms) {
      if (u.type === gl.SAMPLER_2D) {
        gl.uniform1i(u.loc, 0);
        continue;
      }
      let a = values.get(u.name) ?? std[u.name];
      if (!a) continue;
      if (u.type === gl.FLOAT) gl.uniform1f(u.loc, a[0]);
      else if (u.type === gl.FLOAT_VEC2 && a.length >= 2) gl.uniform2fv(u.loc, a.slice(0, 2));
      else if (u.type === gl.FLOAT_VEC3 && a.length >= 3) gl.uniform3fv(u.loc, a.slice(0, 3));
      else if (u.type === gl.FLOAT_VEC4) {
        if (a.length === 3) a = [...a, 1];
        if (a.length >= 4) gl.uniform4fv(u.loc, a.slice(0, 4));
      } else if (u.type === gl.INT || u.type === gl.BOOL) gl.uniform1i(u.loc, a[0]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export interface ScreenFxCanvasProps {
  info: ShaderInfo;
  args: Record<string, unknown>; // 고친 값 (값 이름 → 값)
  picture: Picture; // 셰이더를 씌울 그림
  size: [number, number]; // 게임 화면 크기 (u_model_size). 그리는 크기는 그림의 크기
  className?: string;
  onFail(e: unknown): void;
}

// 보이는 동안 계속 그린다 (시간에 따라 움직이는 셰이더가 많음). 값은 다음 그림부터 바로 먹는다
export function ScreenFxCanvas(props: ScreenFxCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const { info, picture } = props;
  const st = useRef({ r: null as Renderer | null, raf: 0, t0: 0 });

  useEffect(() => {
    const s = st.current;
    const c = canvas.current;
    if (!c) return;
    const frame = () => {
      const p = latest.current;
      s.raf = 0;
      if (!s.r) return;
      try {
        s.r.draw((performance.now() - s.t0) / 1000, p.size, screenFxValues(p.info, p.args, p.size));
        s.raf = requestAnimationFrame(frame);
      } catch (e) {
        p.onFail(e);
      }
    };
    try {
      c.width = (picture as HTMLCanvasElement).width || 1;
      c.height = (picture as HTMLCanvasElement).height || 1;
      s.r ??= new Renderer(c);
      s.r.setShader(info);
      s.r.setPicture(picture);
      s.t0 = performance.now();
      frame();
    } catch (e) {
      latest.current.onFail(e);
    }
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [info, picture]);

  useEffect(
    () => () => {
      st.current.r?.dispose();
      st.current.r = null;
    },
    [],
  );

  return <canvas ref={canvas} className={props.className} aria-hidden />;
}

// ── 세부 값 막대 ──
// 플러그인의 GROUPS 그대로: [묶음 이름, [[값 이름, 보일 글, 최소, 최대, 한 칸, 소수 자리] | [값 이름, 보일 글, "bool" | "color" | "options", …], …]]
// 셰이더로 가지 않는 값(글, 그림 고르기)과 모르는 모양의 줄은 건너뛴다
export function ScreenFxKnobs({ info, values, onChange }: { info: ShaderInfo; values: Record<string, unknown>; onChange(key: string, v: unknown | undefined): void }) {
  const row = (r: unknown[]) => {
    const key = String(r[0]);
    const p = info.params[key];
    if (!p) return null;
    const set = values[key] !== undefined;
    const v = values[key] ?? p[1];
    let field: React.ReactNode = null;
    if (typeof r[2] === 'number' && typeof r[3] === 'number')
      field = (
        <>
          <input type="range" min={r[2]} max={r[3]} step={typeof r[4] === 'number' ? r[4] : 0.01} value={Number(v)} onChange={(e) => onChange(key, Number(e.target.value))} />
          <span className="fx-kv">{Number(v).toFixed(typeof r[5] === 'number' ? r[5] : 2)}</span>
        </>
      );
    else if (r[2] === 'bool') field = <input type="checkbox" checked={!!v} onChange={(e) => onChange(key, e.target.checked)} />;
    else if (r[2] === 'color' && typeof v === 'string') field = <input type="color" value={v.slice(0, 7)} onChange={(e) => onChange(key, e.target.value)} />;
    else if (r[2] === 'options' && Array.isArray(r[3]) && p[0] === 'choice') {
      const opts = r[3] as [unknown, string][];
      field = (
        <select value={Math.max(0, opts.findIndex((o) => JSON.stringify(o[0]) === JSON.stringify(v)))} onChange={(e) => onChange(key, opts[Number(e.target.value)][0])}>
          {opts.map((o, i) => (
            <option key={i} value={i}>{String(o[1])}</option>
          ))}
        </select>
      );
    } else return null;
    return (
      <label key={key} className={set ? 'set' : ''}>
        <span className="fx-kn" title={key}>{String(r[1])}</span>
        {field}
        <button className="fx-x" style={{ visibility: set ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), onChange(key, undefined))}>↺</button>
      </label>
    );
  };
  return (
    <>
      {info.groups.map((g, i) => {
        if (!Array.isArray(g) || !Array.isArray(g[1])) return null;
        const rows = (g[1] as unknown[][]).map(row).filter(Boolean);
        if (!rows.length) return null;
        return (
          <div key={i} className="sfx-group">
            <div className="look-title">{String(g[0])}</div>
            <div className="fx-knobs">{rows}</div>
          </div>
        );
      })}
    </>
  );
}

export { Renderer as ScreenFxRenderer };
