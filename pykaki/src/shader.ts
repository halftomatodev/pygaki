// 상자와 label에 거는 셰이더 (showpy screen_fx.shaders 두 자리).
// 상자마다 첫 줄에 그 상자의 셰이더를 적는다. 같은 값이면 showpy가 전환 없이 넘어가서, 어느 길로 들어와도 맞다.
import type { BoxNode, BoxShader, Project } from './types';

// 1번, 2번에 고를 수 있는 셰이더: pygaki 플러그인이 내놓는 목록 파일(screen_fx/shader_list.json, screen_fx 5.4, LINK.md 11장).
// 연결한 게임 폴더에 있으면 그것을, 없으면(연결 안 함, 예전 플러그인) 빌드할 때 가져온 저장소의 목록을 쓴다.
import builtinList from '../../showpy/game/screen_fx/shader_list.json';

export interface ShaderInfo {
  id: string;
  label: string; // 고르는 칸에 보이는 이름
  name: string; // 효과의 이름
  order: number;
  overlay_only: boolean;
  params: Record<string, unknown[]>; // 값 이름: [종류, 기본값(, 고를 수 있는 값)]
  groups: unknown[]; // 막대 묶음
  // 아래는 목록 파일 2판부터 (샘플을 그릴 때 씀, fx/ScreenFxCanvas.tsx)
  prefix?: string; // 값 이름 앞에 붙는 유니폼 머리 (u_boil_)
  extra?: boolean; // 파이썬이 값이나 그림을 더 넣는 효과 (앱에서는 못 그림)
  glsl?: ShaderCode[] | null; // 셰이더 코드 조각
}
export interface ShaderCode {
  name: string;
  variables: string;
  fragment_functions: string;
  fragment: [number, string][];
}
const readList = (d: any): ShaderInfo[] | null =>
  d && Array.isArray(d.shaders) && d.shaders.every((s: any) => s && typeof s.id === 'string' && typeof s.label === 'string') ? (d.shaders as ShaderInfo[]) : null;
const BUILTIN = readList(builtinList) ?? [];
const BUILTIN_VER = String((builtinList as any).screen_fx ?? '');
let LIST = BUILTIN;
let LIST_VER = BUILTIN_VER;
const OFF = new Set<string>();

// 게임 폴더에서 읽은 목록 파일의 글. null이나 못 읽는 글이면 앱에 든 목록으로
export function setShaderList(text: string | null) {
  let found: ShaderInfo[] | null = null;
  let ver = '';
  try {
    const d = text ? JSON.parse(text) : null;
    found = readList(d);
    ver = String(d?.screen_fx ?? '');
  } catch {
    found = null;
  }
  LIST = found ?? BUILTIN;
  LIST_VER = found ? ver : BUILTIN_VER;
}
// 끈 셰이더 (screen_fx/shaders_off.txt). 고르는 목록에서만 빠지고, 이미 정한 곳에는 이름이 그대로 보인다
export function setShadersOff(names: string[]) {
  OFF.clear();
  names.forEach((n) => OFF.add(n));
}
export const shaderList = () => LIST;
export const shaderInfo = (id: string) => LIST.find((s) => s.id === id) ?? null;

// 판 비교 ("5.10" > "5.9")
function verAtLeast(v: string, want: string) {
  const a = v.split('.').map(Number);
  const b = want.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return true;
}
// 게임의 screen_fx가 상자마다 세부 값(values=, tv=)을 받는지 (5.5부터, LINK.md 2장)
export const valuesSupported = () => verAtLeast(LIST_VER || '0', '5.5');

// TV 전환의 세부 값 (screen_fx_config.rpy의 screen_fx.tv). 막대: [이름, 보일 글, 최소, 최대, 한 칸, 소수 자리, 기본값]
export const TV_KNOBS: [string, string, number, number, number, number, number][] = [
  ['off_time', '꺼지는 시간(초)', 0, 2, 0.05, 2, 0.35],
  ['black_time', '검은 화면(초)', 0, 2, 0.05, 2, 0.25],
  ['on_time', '켜지는 시간(초)', 0, 2, 0.05, 2, 0.45],
  ['line', '가로선 두께(픽셀)', 1, 12, 1, 0, 3],
  ['flash', '꺼질 때 빛남', 0, 1, 0.05, 2, 0.8],
  ['noise', '켜질 때 지직거림', 0, 1, 0.05, 2, 0.5],
  ['volume', '소리 크기', 0, 1, 0.05, 2, 1],
];
export const shaderOff = (id: string) => OFF.has(id);

// 고르는 칸의 [이름, 보일 글]. keep(지금 고른 것)은 꺼져 있거나 목록에 없어도 남긴다
export function shaderNames(keep: (string | undefined)[] = []): [string, string][] {
  const rv: [string, string][] = [['none', '없음']];
  for (const s of LIST) if (!OFF.has(s.id) || keep.includes(s.id)) rv.push([s.id, s.label + (OFF.has(s.id) ? ' (끔)' : '')]);
  for (const k of keep) if (k && !rv.some(([id]) => id === k)) rv.push([k, k + ' (이 게임에 없음)']);
  return rv;
}
// 전환: TV 꺼짐·켜짐, 그림 전환 둘(픽셀소트, 데이터모싱), 없음(바로 바뀜, transition=None)
export const SHADER_TRANS: [string, string][] = [['tv', 'TV 꺼짐·켜짐'], ['pixelsort', '픽셀소트'], ['datamosh', '데이터모싱'], ['none', '없음']];
// 그림 전환으로 셰이더를 바꾸기 (screen_fx 5.6, LINK.md 2장): 효과 폴더(ui_kit/effects)의 @transition을 써서
// 앞 상자 마지막 화면 → 이 상자 첫 화면을 잇고, 셰이더는 그 시간의 절반에 바뀐다. 원고에는 셰이더 줄 + 첫 그림 줄들 + with screen_fx.pending_with()
export const IMG_SHADER_TRANS = ['pixelsort', 'datamosh'];
export const isImgTrans = (t?: string) => !!t && IMG_SHADER_TRANS.includes(t);
// 그림 전환의 방향 값: [값 이름, [[값, 이름]...]]. 효과 파일에 그 값(u__이름)이 있을 때만 고른다
export const IMG_TRANS_DIR: Record<string, [string, [number, string][]]> = {
  datamosh: ['mode', [[0, '회전'], [1, '확산']]],
  pixelsort: ['dir', [[0, '가로'], [1, '세로'], [2, '회전'], [3, '확산']]],
};
// 게임의 screen_fx가 그림 전환으로 셰이더를 바꿀 수 있는지 (5.6부터)
export const imgTransSupported = () => verAtLeast(LIST_VER || '0', '5.6');
// 예전 판에서 고를 수 있던 값. 대본에 남아 있으면 그대로 내보내고(게임 설정대로는 전환을 적지 않음, 서서히는 "fade"), 칸에 예전 값이라고 알린다
export const oldTransLabel = (t?: string) => (SHADER_TRANS.some(([k]) => k === t) ? null : t === 'fade' ? '서서히' : !t ? '게임 설정대로' : t);

// 자동 확인(app/smoke.cjs)과 개발자 도구에서 볼 수 있게
if (typeof window !== 'undefined') (window as any).pykakiShaders = { names: shaderNames, list: shaderList, off: shaderOff };

const nameOf = (n: string) => LIST.find((s) => s.id === n)?.label ?? n;
export const newShader = (): BoxShader => ({ a: 'none', b: 'none', in: 'tv', out: 'tv' });

// 이 상자에 걸리는 셰이더: 상자 것 → label 것 → 없음(게임 설정대로)
export function shaderOfBox(p: Project, b: BoxNode): BoxShader | null {
  return b.shader ?? p.labels.find((g) => g.id === b.group)?.shader ?? null;
}
export const usesShaders = (p: Project) => p.nodes.some((n) => n.shader) || p.labels.some((g) => g.shader);

const key = (s: BoxShader | null) => (s ? `${s.a}|${s.b}|${JSON.stringify(s.va ?? {})}|${JSON.stringify(s.vb ?? {})}` : '');
export const sameShader = (x: BoxShader | null, y: BoxShader | null) => key(x) === key(y);

// 화면에 보일 이름: "아스키 + VHS", 아무것도 없으면 "셰이더 끔"
export function shaderLabel(s: BoxShader | null) {
  if (!s) return '게임 설정대로';
  const on = [s.a, s.b].filter((n) => n && n !== 'none').map(nameOf);
  return on.length ? on.join(' + ') : '셰이더 끔';
}

// 플레이 화면에 보일 이름. 켜진 것이 없으면 null
export function shaderShown(s: BoxShader | null) {
  const on = s ? [s.a, s.b].filter((n) => n && n !== 'none').map(nameOf) : [];
  return on.length ? on.join(' + ') : null;
}

const pyStr =(s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
// 세부 값 하나를 파이썬 글로: 숫자, 참거짓, 글, 목록(튜플로)
function pyVal(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 10000) / 10000) : '0';
  if (typeof v === 'string') return pyStr(v);
  if (Array.isArray(v)) return '(' + v.map(pyVal).join(', ') + (v.length === 1 ? ',' : '') + ')';
  if (v === null || v === undefined) return 'None';
  return pyStr(String(v));
}
const pyDict = (d: Record<string, unknown>) => '{' + Object.entries(d).map(([k, v]) => `${pyStr(k)}: ${pyVal(v)}`).join(', ') + '}';
const hasKeys = (d?: Record<string, unknown>) => !!d && Object.keys(d).length > 0;
// 대본 어딘가에 세부 값을 정했는지. 정했으면 셰이더 줄마다 값을 적어서 앞 상자의 값이 남지 않게 한다
export const usesShaderValues = (p: Project) =>
  [...p.nodes, ...p.labels].some((o) => o.shader && (hasKeys(o.shader.va) || hasKeys(o.shader.vb)));
export const usesTvValues = (p: Project) => [...p.nodes, ...p.labels].some((o) => hasKeys(o.shader?.tv));
// 두 자리의 세부 값을 셰이더 이름마다 (같은 셰이더를 두 자리에 고르면 2번 값이 덮음)
export function slotValues(s: BoxShader) {
  const rv: Record<string, Record<string, unknown>> = {};
  if (s.a && s.a !== 'none') rv[s.a] = { ...(s.va ?? {}) };
  if (s.b && s.b !== 'none') rv[s.b] = { ...(rv[s.b] ?? {}), ...(s.vb ?? {}) };
  return rv;
}
const transArg = (t?: string) => (!t ? '' : t === 'none' ? 'transition=None' : `transition=${pyStr(t)}`);

// 원고 한 줄. 셰이더가 없는 상자는 게임 설정대로 돌린다.
// tv: 이 전환의 TV 세부 값. time: 그림 전환의 초. iv: 그림 전환의 값. values: 세부 값을 적을지 (대본 어딘가에 값을 정했고 게임이 받을 때)
// 그림 전환의 값도 플러그인의 tv=로 적는다 (screen_fx 5.6: 그림 전환이면 tv=가 그 효과의 값)
export function shaderCode(s: BoxShader | null, trans?: string, opt: { tv?: Record<string, number>; time?: number; iv?: Record<string, number>; values?: boolean } = {}) {
  const t = transArg(trans);
  const tv = opt.tv && hasKeys(opt.tv) && trans === 'tv' ? `tv=${pyDict(opt.tv)}` : isImgTrans(trans) && hasKeys(opt.iv) ? `tv=${pyDict(opt.iv!)}` : '';
  const dur = isImgTrans(trans) && opt.time !== undefined ? `duration=${pyVal(opt.time)}` : '';
  if (!s) return `$ screen_fx.clear(${[t, dur, tv].filter(Boolean).join(', ')})`;
  const vals = opt.values ? 'values={' + Object.entries(slotValues(s)).map(([k, v]) => `${pyStr(k)}: ${pyDict(v)}`).join(', ') + '}' : '';
  return `$ screen_fx.shaders(${[pyStr(s.a || 'none'), pyStr(s.b || 'none'), t, dur, tv, vals].filter(Boolean).join(', ')})`;
}

// 이 상자로 들어올 때 쓸 전환과 그 TV 값, 그림 전환의 초: 이 상자의 "시작할 때" → 셰이더가 다른 앞 상자의 "끝날 때" → 게임 설정대로
export function enterTransTv(p: Project, b: BoxNode, from: BoxNode[]): { t: string; tv?: Record<string, number>; time?: number; iv?: Record<string, number> } {
  const mine = shaderOfBox(p, b);
  if (mine?.in) return { t: mine.in, tv: mine.tv, time: mine.time, iv: mine.iv?.[mine.in] };
  for (const f of from) {
    const s = shaderOfBox(p, f);
    if (s?.out && !sameShader(s, mine)) return { t: s.out, tv: s.tv, time: s.time, iv: s.iv?.[s.out] };
  }
  return { t: '' };
}
export const enterTrans = (p: Project, b: BoxNode, from: BoxNode[]) => enterTransTv(p, b, from).t;
