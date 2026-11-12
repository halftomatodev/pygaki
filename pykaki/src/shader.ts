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
let LIST = BUILTIN;
const OFF = new Set<string>();

// 게임 폴더에서 읽은 목록 파일의 글. null이나 못 읽는 글이면 앱에 든 목록으로
export function setShaderList(text: string | null) {
  let found: ShaderInfo[] | null = null;
  try {
    found = text ? readList(JSON.parse(text)) : null;
  } catch {
    found = null;
  }
  LIST = found ?? BUILTIN;
}
// 끈 셰이더 (screen_fx/shaders_off.txt). 고르는 목록에서만 빠지고, 이미 정한 곳에는 이름이 그대로 보인다
export function setShadersOff(names: string[]) {
  OFF.clear();
  names.forEach((n) => OFF.add(n));
}
export const shaderList = () => LIST;
export const shaderOff = (id: string) => OFF.has(id);

// 고르는 칸의 [이름, 보일 글]. keep(지금 고른 것)은 꺼져 있거나 목록에 없어도 남긴다
export function shaderNames(keep: (string | undefined)[] = []): [string, string][] {
  const rv: [string, string][] = [['none', '없음']];
  for (const s of LIST) if (!OFF.has(s.id) || keep.includes(s.id)) rv.push([s.id, s.label + (OFF.has(s.id) ? ' (끔)' : '')]);
  for (const k of keep) if (k && !rv.some(([id]) => id === k)) rv.push([k, k + ' (이 게임에 없음)']);
  return rv;
}
// 전환은 둘만 고른다: TV 꺼짐·켜짐, 없음(바로 바뀜, transition=None)
export const SHADER_TRANS: [string, string][] = [['tv', 'TV 꺼짐·켜짐'], ['none', '없음']];
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

const key = (s: BoxShader | null) => (s ? `${s.a}|${s.b}` : '');
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
const transArg = (t?: string) => (!t ? '' : t === 'none' ? 'transition=None' : `transition=${pyStr(t)}`);

// 원고 한 줄. 셰이더가 없는 상자는 게임 설정대로 돌린다
export function shaderCode(s: BoxShader | null, trans?: string) {
  const t = transArg(trans);
  if (!s) return `$ screen_fx.clear(${t})`;
  return `$ screen_fx.shaders(${[pyStr(s.a || 'none'), pyStr(s.b || 'none'), t].filter(Boolean).join(', ')})`;
}

// 이 상자로 들어올 때 쓸 전환: 이 상자의 "시작할 때" → 셰이더가 다른 앞 상자의 "끝날 때" → 게임 설정대로
export function enterTrans(p: Project, b: BoxNode, from: BoxNode[]) {
  const mine = shaderOfBox(p, b);
  if (mine?.in) return mine.in;
  for (const f of from) {
    const s = shaderOfBox(p, f);
    if (s?.out && !sameShader(s, mine)) return s.out;
  }
  return '';
}
