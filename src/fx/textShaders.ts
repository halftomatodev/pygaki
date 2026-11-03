// 등장 효과 셰이더: showpy와 같은 셰이더 파일을 읽고, 렌파이가 셰이더 조각을 합치는 방식 그대로 합친다.
// - text_effects.glsl: showpy game/ui_kit/engine/text_effects.glsl의 사본 (npm run sync-shaders로 복사)
// - renpy_textshaders.glsl: 렌파이에 들어 있는 효과 (dissolve, typewriter ...)
// 합치는 방식은 렌파이 8.5.3 renpy/gl2/gl2shadercache.py와 renpy/text/shader.py를 따른다.
import showpySource from './text_effects.glsl?raw';
import renpySource from './renpy_textshaders.glsl?raw';

export interface ShaderEffect {
  name: string;
  label: string;
  cps: boolean; // 글자가 하나씩 나와야 보임
  slow: string | null; // 다 나온 뒤 더 기다릴 시간(글자 수)의 식
  redraw: string | null; // 'always' 또는 u__ 이름
  outlines: [number, string, number, number][]; // 굵기, 색, x, y
  uniforms: [string, string][]; // u__이름, 기본값 (적힌 그대로)
  code: [string, string][]; // variables, vertex_N, fragment_N
  showpy: boolean;
}

// text_effects.glsl 읽기. showpy text_effects.rpy의 tfx_parse와 같은 규칙
export function parseShaders(text: string, showpy: boolean): ShaderEffect[] {
  const parts: Record<string, string[]> = {};
  const effects: ShaderEffect[] = [];
  const raw: [string, string[]][][] = [];
  let cur: string[] | null = null;
  let eff: ShaderEffect | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('//')) continue; // 맨 앞의 // 줄은 설명
    const s = line.trim();
    if (!s.startsWith('@')) {
      if (cur) cur.push(line);
      continue;
    }
    const sp = s.indexOf(' ');
    const word = sp < 0 ? s.slice(1) : s.slice(1, sp);
    const rest = sp < 0 ? '' : s.slice(sp + 1).trim();
    if (word === 'part') {
      cur = parts[rest] = [];
      eff = null;
    } else if (word === 'effect') {
      const k = rest.indexOf(' ');
      eff = { name: k < 0 ? rest : rest.slice(0, k), label: k < 0 ? '' : rest.slice(k + 1).trim(), cps: false, slow: null, redraw: null, outlines: [], uniforms: [], code: [], showpy };
      effects.push(eff);
      raw.push([]);
      cur = null;
    } else if (!eff) {
      throw new Error('셰이더 파일: @effect 밖의 줄 ' + s);
    } else if (word === 'use') {
      if (!cur || !parts[rest]) throw new Error('셰이더 파일: ' + s);
      cur.push(...parts[rest]);
    } else if (word === 'cps') eff.cps = true;
    else if (word === 'slow') eff.slow = rest;
    else if (word === 'redraw') eff.redraw = rest;
    else if (word === 'outline') {
      const [size, color, x, y] = rest.split(/\s+/);
      eff.outlines.push([Number(size), color, Number(x), Number(y)]);
    } else if (word === 'set') {
      const k = rest.indexOf(' ');
      eff.uniforms.push([rest.slice(0, k), rest.slice(k + 1).trim()]);
    } else if (word === 'variables' || word.startsWith('vertex_') || word.startsWith('fragment_')) {
      cur = [];
      raw[raw.length - 1].push([word, cur]);
    } else throw new Error('셰이더 파일: 모르는 표시 ' + s);
  }
  effects.forEach((e, i) => (e.code = raw[i].map(([k, v]) => [k, expandRand(v.join('\n') + '\n')])));
  return effects;
}

// RAND(1.0) → 글자마다 다른 값(0~1)
const expandRand = (code: string) => code.replace(/RAND\(([^()]*)\)/g, 'fract(sin(a_text_index * 12.9898 + $1) * 43758.5453)');

export const SHOWPY_SHADERS = parseShaders(showpySource, true);
export const RENPY_SHADERS = parseShaders(renpySource, false);
const BY_NAME = new Map([...RENPY_SHADERS, ...SHOWPY_SHADERS].map((e) => [e.name, e]));
export const shaderEffect = (name: string) => BY_NAME.get(name);

// ── 렌파이 셰이더 조각 (renpy/gl2/gl2shadercache.py의 ShaderPart) ──────────────────

interface Variable { storage: string; type: string; name: string; line: string }
interface Part {
  name: string;
  vertex: [number, string, string][];
  fragment: [number, string, string][];
  vertexVars: Variable[];
  fragmentVars: Variable[];
  types: Record<string, string>;
  uniforms: string[];
}

function parseVariable(l: string): Variable {
  const line = l.trim().replace(/[; ]+$/, '');
  const w = line.split(/\s+/);
  if (w[0] === 'invariant') w.shift();
  const [storage, ...more] = w;
  let i = 0;
  if (['highp', 'mediump', 'lowp'].includes(more[0])) i++;
  return { storage, type: more[i], name: (more[i + 1] ?? '').replace(/\[.*$/, ''), line };
}

// u__x → u_<조각 이름>_x. l__, v__, a__도 같다
function substituteName(partName: string, s: string) {
  const name = partName.replace(/\./g, '_');
  return s
    .replace(/\b([uavl])__(\w+)/g, (_m, k, rest) => `${k}_${name}_${rest}`)
    .replace(/\bu_(\w+)__(\w+)/g, 'u_$1_OP_$2');
}

function makePart(name: string, code: [string, string][]): Part {
  const p: Part = { name, vertex: [], fragment: [], vertexVars: [], fragmentVars: [], types: {}, uniforms: [] };
  const used = { vertex: new Set<string>(), fragment: new Set<string>() };
  let variables = '';
  for (const [k, v0] of code) {
    if (k === 'variables') {
      variables = v0;
      continue;
    }
    const [shader, priority] = k.split('_');
    const v = substituteName(name, v0);
    (shader === 'vertex' ? p.vertex : p.fragment).push([Number(priority), name, v]);
    for (const m of v.matchAll(/\b\w+\b/g)) used[shader as 'vertex' | 'fragment'].add(m[0]);
  }
  for (const l0 of substituteName(name, variables).split('\n')) {
    const l = l0.split('//')[0].trim();
    if (!l) continue;
    const v = parseVariable(l);
    p.types[v.name] = v.type;
    if (used.vertex.has(v.name)) p.vertexVars.push(v);
    if (used.fragment.has(v.name)) p.fragmentVars.push(v);
    if (v.storage === 'uniform') p.uniforms.push(v.name);
  }
  return p;
}

// 렌파이 기본 조각 (renpy/common/_shaders.rpym)
const PARTS = new Map<string, Part>();
PARTS.set('renpy.geometry', makePart('renpy.geometry', [
  ['variables', 'uniform mat4 u_transform;\nattribute vec4 a_position;\n'],
  ['vertex_0', '\n    gl_Position = a_position;\n'],
  ['vertex_100', '\n    gl_Position = u_transform * gl_Position;\n'],
]));
PARTS.set('renpy.texture', makePart('renpy.texture', [
  ['variables', 'uniform float u_lod_bias;\nuniform sampler2D tex0;\nattribute vec2 a_tex_coord;\nvarying vec2 v_tex_coord;\n'],
  ['vertex_200', '\n    v_tex_coord = a_tex_coord;\n'],
  ['fragment_200', '\n    gl_FragColor = texture2D(tex0, v_tex_coord.xy, u_lod_bias);\n'],
]));
for (const e of BY_NAME.values()) PARTS.set('textshader.' + e.name, makePart('textshader.' + e.name, e.code));

// 셰이더 코드 만들기 (gl2shadercache.py의 source). WebGL1은 조각 셰이더에 정밀도가 있어야 한다
function source(vars: Variable[], parts: [number, string, string][], fragment: boolean) {
  const out: string[] = [];
  if (fragment) out.push('precision highp float;\n');
  const seen = new Map<string, Variable>();
  for (const v of vars) seen.set(v.line, v);
  for (const v of [...seen.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) out.push(v.line + ';\n');
  out.push('\nvoid main() {\n');
  const sorted = [...parts].sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0));
  for (const [, , text] of sorted) out.push(text);
  out.push('}\n');
  return out.join('');
}

export function shaderSource(partnames: string[]) {
  const names = [...new Set([...partnames, 'renpy.geometry'])].sort();
  const vv: Variable[] = [];
  const fv: Variable[] = [];
  const vp: [number, string, string][] = [];
  const fp: [number, string, string][] = [];
  for (const n of names) {
    const p = PARTS.get(n);
    if (!p) throw new Error(n + '는 모르는 셰이더 조각이에요');
    vv.push(...p.vertexVars);
    fv.push(...p.fragmentVars);
    vp.push(...p.vertex);
    fp.push(...p.fragment);
  }
  return { key: names.join('|'), vertex: source(vv, vp, false), fragment: source(fv, fp, true) };
}

// ── 텍스트 셰이더 (renpy/text/shader.py의 TextShader) ──────────────────────────────

export type UniformValue = number | number[];

export interface TextShader {
  parts: string[]; // 셰이더 조각 이름 (renpy.texture는 그릴 때 더함)
  uniforms: Map<string, UniformValue>;
  extraSlowDuration: number; // 다 나온 뒤 더 기다릴 시간 (글자 수)
  redraw: boolean; // 계속 다시 그림
  outlines: [number, string, number, number][];
}

// 색: 투명도를 곱한 vec4 (renpy.color.Color.premultiplied)
export function colorValue(s: string): number[] {
  let h = s.replace('#', '');
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
  const a = h.length >= 8 ? n(6) : 1;
  return [n(0) * a, n(2) * a, n(4) * a, a];
}

function toValue(type: string | undefined, v: string): UniformValue {
  if (type === 'vec4' && v.startsWith('#')) return colorValue(v);
  if (v.startsWith('#')) return colorValue(v);
  const nums = v.replace(/^\(|\)$/g, '').split(',').map(Number);
  if (nums.some(isNaN)) throw new Error(`값을 읽지 못했어요: ${v}`);
  return nums.length === 1 ? nums[0] : nums;
}

function evalSlow(expr: string, kw: Record<string, UniformValue>) {
  let total = 0;
  for (const term of expr.split('+')) {
    let v = 1;
    for (const f0 of term.split('*')) {
      const f = f0.trim();
      v *= f in kw ? Number(kw[f]) : Number(f);
    }
    total += v;
  }
  return total;
}

// "scatter", "scatter:u__distance=200", "scatter:200", "typewriter|slowalpha" → 텍스트 셰이더. 모르는 효과면 null
export function parseTextShader(effect: string): TextShader | null {
  let rv: TextShader | null = null;
  for (const one of effect.split('|')) {
    const [name0, ...args] = one.split(':');
    const name = name0.trim();
    const e = shaderEffect(name);
    if (!e) return null;
    const part = PARTS.get('textshader.' + name)!;
    const prefix = 'u_textshader_' + name.replace(/\./g, '_');
    const orig = new Map(e.uniforms.map(([k, v]) => [prefix + k.slice(2), [k, v] as [string, string]]));
    const values = new Map<string, string>();
    for (const u of part.uniforms) if (orig.has(u)) values.set(u, orig.get(u)![1]);
    const order = [...values.keys()];
    args.forEach((arg, i) => {
      let k: string;
      let v: string;
      if (arg.includes('=')) [k, v] = [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)];
      else [k, v] = [order[i] ?? '', arg];
      k = k.trim();
      if (!k.startsWith('u_')) k = 'u_' + k;
      if (k.startsWith('u__')) k = prefix + k.slice(2);
      if (!values.has(k)) throw new Error(`${name}에 없는 값이에요: ${arg}`);
      values.set(k, v.trim());
    });
    const uniforms = new Map<string, UniformValue>();
    const kw: Record<string, UniformValue> = {};
    for (const [k, v] of values) {
      const val = toValue(part.types[k], v);
      uniforms.set(k, val);
      if (orig.has(k)) kw[orig.get(k)![0]] = val;
    }
    let extra = e.slow ? evalSlow(e.slow, kw) : 0;
    let redraw = e.redraw === 'always' || (!!e.redraw && Number(kw[e.redraw] ?? 0) > 0);
    const ts: TextShader = { parts: ['textshader.' + name], uniforms, extraSlowDuration: extra, redraw, outlines: e.outlines };
    if (!rv) rv = ts;
    else {
      extra = Math.max(rv.extraSlowDuration, extra);
      redraw = rv.redraw || redraw;
      rv = { parts: [...rv.parts, ...ts.parts], uniforms: new Map([...rv.uniforms, ...ts.uniforms]), extraSlowDuration: extra, redraw, outlines: rv.outlines.length ? rv.outlines : ts.outlines };
    }
  }
  return rv;
}
