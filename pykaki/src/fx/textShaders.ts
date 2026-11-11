// 등장 효과 셰이더: showpy와 같은 셰이더 파일을 읽고, 렌파이가 셰이더 조각을 합치는 방식 그대로 합친다.
// - text_effects.glsl: showpy의 셰이더 파일을 그대로 가져옴 (저장소의 showpy/game/ui_kit/engine/text_effects.glsl)
// - renpy_textshaders.glsl: 렌파이에 들어 있는 효과 (dissolve, flip ...)
// 합치는 방식은 렌파이 8.5.3 renpy/gl2/gl2shadercache.py와 renpy/text/shader.py를 따른다.
import showpySource from '../../../showpy/game/ui_kit/engine/text_effects.glsl?raw';
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
  kind: 'effect' | 'transition'; // 글자 등장 효과 / 그림 전환 (효과 폴더의 @transition)
  params: [string, number, number, string][]; // @param: u__이름, 최소, 최대, 한글 이름 (막대)
  time: number; // 전환이 걸리는 초 (@time)
  file?: string; // 효과 폴더에서 읽었으면 파일 이름
}

// text_effects.glsl 읽기. showpy text_effects.rpy의 tfx_parse와 같은 규칙
// shared를 주면 거기 든 조각(@part)을 @use로 쓸 수 있고, 이 글의 조각도 거기에 더한다
export function parseShaders(text: string, showpy: boolean, shared?: Record<string, string[]>): ShaderEffect[] {
  const parts: Record<string, string[]> = shared ?? {};
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
    } else if (word === 'effect' || word === 'transition') {
      const k = rest.indexOf(' ');
      eff = { name: k < 0 ? rest : rest.slice(0, k), label: k < 0 ? '' : rest.slice(k + 1).trim(), cps: false, slow: null, redraw: null, outlines: [], uniforms: [], code: [], showpy, kind: word, params: [], time: 1 };
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
    } else if (word === 'param') {
      const w = rest.split(/\s+/);
      if (w.length < 3 || isNaN(Number(w[1])) || isNaN(Number(w[2]))) throw new Error('셰이더 파일: ' + s);
      eff.params.push([w[0], Number(w[1]), Number(w[2]), w.slice(3).join(' ') || w[0]]);
    } else if (word === 'time') eff.time = Number(rest) || 1;
    else if (word === 'variables' || word === 'fragment' || word.startsWith('vertex_') || word.startsWith('fragment_')) {
      cur = [];
      raw[raw.length - 1].push([word, cur]);
    } else throw new Error('셰이더 파일: 모르는 표시 ' + s);
  }
  effects.forEach((e, i) => (e.code = raw[i].map(([k, v]) => [k, expandRand(v.join('\n') + '\n')])));
  return effects;
}

// RAND(1.0) → 글자마다 다른 값(0~1)
const expandRand = (code: string) => code.replace(/RAND\(([^()]*)\)/g, 'fract(sin(a_text_index * 12.9898 + $1) * 43758.5453)');

// showpy 기본 효과(text_effects.glsl)와 조각. 효과 폴더의 파일도 이 조각을 @use로 쓴다
const SHOWPY_PARTS: Record<string, string[]> = {};
export const SHOWPY_SHADERS = parseShaders(showpySource, true, SHOWPY_PARTS).filter((e) => e.kind === 'effect');
export const RENPY_SHADERS = parseShaders(renpySource, false);
// 그림 전환 (효과 폴더의 @transition). showpy img_fx.use("이름")
export const IMAGE_FX: ShaderEffect[] = [];
// 한 글자씩 나오기 (렌파이 typewriter). 고르는 목록에는 없고, 글의 일부에만 효과를 건 줄({shader=})의 나머지 글자를 그릴 때 쓴다
const HIDDEN_SHADERS = parseShaders(
  `@effect typewriter 한 글자씩
@cps
@variables
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    varying float v_text_min_time;
@vertex_200
    v_text_min_time = a_text_min_time;
@fragment_350
    float l__done = v_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    gl_FragColor = gl_FragColor * l__done;
`,
  false,
);
const BY_NAME = new Map([...HIDDEN_SHADERS, ...RENPY_SHADERS, ...SHOWPY_SHADERS].map((e) => [e.name, e]));
// 샘플로만 돌려 보는 효과: 효과 모음에 있지만 아직 게임에 넣지 않은 것 ([효과] 화면). 고르는 목록과 플레이에는 안 나온다
const PREVIEW = new Map<string, ShaderEffect>();
export const shaderEffect = (name: string, preview = false) => BY_NAME.get(name) ?? (preview ? PREVIEW.get(name) : undefined);

// ── 효과 폴더 (showpy ui_kit/effects/*.glsl, ui_kit 4.3) ──
// 플러그인이 있는 게임 폴더를 연결했으면 그 폴더의 파일만 쓴다 (게임에서 도는 것과 같은 목록).
// 연결하지 않았으면 showpy에 든 샘플(빌드할 때 같이 가져옴)을 쓴다.
// 읽는 규칙은 showpy text_effects.rpy의 _tfx_register와 같다: 틀린 파일은 그 파일만 건너뛰고, 이미 있는 이름은 쓰지 않는다
const NAME_OK = /^[a-z][a-z0-9_]*$/;
function readPack(file: string, text: string, have: Set<string>): ShaderEffect[] {
  const more = parseShaders(text, true, { ...SHOWPY_PARTS });
  for (const e of more) {
    if (!NAME_OK.test(e.name)) throw new Error('이름은 영어 소문자, 숫자, _만 써요: ' + (e.name || '(이름 없음)'));
    if (have.has(e.name) || more.filter((x) => x.name === e.name).length > 1) throw new Error('이미 있는 이름이에요: ' + e.name);
    if (!e.code.length) throw new Error('셰이더 코드가 없어요: ' + e.name);
  }
  more.forEach((e) => (e.file = file));
  return more;
}

export interface EffectPack { name: string; text: string } // 효과 파일 하나: 파일 이름과 글
const globPacks = (found: Record<string, string>): EffectPack[] =>
  Object.keys(found).sort().map((path) => ({ name: path.split('/').pop()!, text: found[path] }));
// 새 프로젝트마다 들어가는 샘플 (showpy/game/ui_kit/effects)
export const SAMPLE_PACKS = globPacks(import.meta.glob('../../../showpy/game/ui_kit/effects/*.glsl', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
// 효과 모음: pygaki와 같이 오지만 게임에 넣어야 쓸 수 있는 것 (showpy/effects_library)
export const LIBRARY_PACKS = globPacks(import.meta.glob('../../../showpy/effects_library/*.glsl', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);

// 기본 효과와 렌파이 효과의 이름 (효과 폴더의 파일이 쓸 수 없는 이름)
const BUILT_IN = new Set(BY_NAME.keys());

// 효과 파일 검사: 지금 목록에 넣을 수 있는지. 같은 파일(바꿔 넣을 것)에 든 이름은 겹쳐도 된다. 틀리면 이유를 던진다
export function checkPack(file: string, text: string): ShaderEffect[] {
  const have = new Set([...BY_NAME.values()].filter((e) => e.file !== file).map((e) => e.name));
  const found = readPack(file, text, have);
  if (!found.length) throw new Error('효과가 없어요 (@effect나 @transition 줄이 있어야 해요)');
  return found;
}

// 아직 넣지 않은 효과 파일을 샘플로 돌릴 수 있게 올려 둔다. 이미 쓸 수 있는 이름은 그대로 둔다. 틀린 파일이면 이유를 던진다
export function previewPack(file: string, text: string): ShaderEffect[] {
  const found = checkPack(file, text);
  for (const e of found) {
    if (BY_NAME.has(e.name)) continue;
    if (JSON.stringify(PREVIEW.get(e.name)?.code) !== JSON.stringify(e.code)) effectEpoch++; // 만들어 둔 셰이더를 버린다
    PREVIEW.set(e.name, e);
    if (e.kind === 'effect') PARTS.set('textshader.' + e.name, makePart('textshader.' + e.name, e.code));
  }
  return found;
}

// 효과 폴더를 다시 읽는다. files가 null이면 연결한 폴더(플러그인)가 없는 것이라 샘플을 쓴다.
// 돌려주는 값은 못 읽은 파일과 이유. 바뀐 것이 있으면 effectEpoch가 오른다 (미리보기 셰이더 다시 만들기)
export let effectEpoch = 0;
let folderSeen = '';
let folderErrors: [string, string][] = [];
export function setFolderEffects(files: EffectPack[] | null): [string, string][] {
  const sorted = [...(files ?? SAMPLE_PACKS)].sort((a, b) => (a.name < b.name ? -1 : 1));
  const seen = JSON.stringify(sorted);
  if (seen === folderSeen) return folderErrors;
  folderSeen = seen;
  effectEpoch++;
  for (const name of [...BY_NAME.keys()])
    if (!BUILT_IN.has(name)) {
      BY_NAME.delete(name);
      PARTS.delete('textshader.' + name);
    }
  for (const list of [SHOWPY_SHADERS, IMAGE_FX])
    for (let i = list.length - 1; i >= 0; i--) if (!BUILT_IN.has(list[i].name)) list.splice(i, 1);
  folderErrors = [];
  for (const f of sorted) {
    try {
      for (const e of readPack(f.name, f.text, new Set(BY_NAME.keys()))) {
        BY_NAME.set(e.name, e);
        if (e.kind === 'effect') {
          SHOWPY_SHADERS.push(e);
          PARTS.set('textshader.' + e.name, makePart('textshader.' + e.name, e.code));
        } else IMAGE_FX.push(e);
      }
    } catch (e: any) {
      folderErrors.push([f.name, String(e?.message ?? e)]);
    }
  }
  return folderErrors;
}

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
for (const e of BY_NAME.values()) if (e.kind === 'effect') PARTS.set('textshader.' + e.name, makePart('textshader.' + e.name, e.code));
// 폴더를 연결하기 전에는 샘플을 쓴다
for (const [file, why] of setFolderEffects(null)) console.warn('효과 파일을 못 읽었어요', file, why);

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
  return { key: names.join('|') + '@' + effectEpoch, vertex: source(vv, vp, false), fragment: source(fv, fp, true) };
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

// "scatter", "scatter:u__distance=200", "scatter:200", "slidein|shake" → 텍스트 셰이더. 모르는 효과면 null
// preview: 샘플로 올려 둔 효과(previewPack)도 찾는다
export function parseTextShader(effect: string, preview = false): TextShader | null {
  let rv: TextShader | null = null;
  for (const one of effect.split('|')) {
    const [name0, ...args] = one.split(':');
    const name = name0.trim();
    const e = shaderEffect(name, preview);
    if (!e || e.kind !== 'effect') return null;
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
