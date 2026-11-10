// 상자와 label에 거는 셰이더 (showpy screen_fx.shaders 두 자리).
// 상자마다 첫 줄에 그 상자의 셰이더를 적는다. 같은 값이면 showpy가 전환 없이 넘어가서, 어느 길로 들어와도 맞다.
import type { BoxNode, BoxShader, Project } from './types';

// 1번, 2번에 고를 수 있는 이름 (showpy screen_fx 5.3)
export const SHADER_NAMES: [string, string][] = [
  ['none', '없음'], ['ascii', '아스키'], ['vhs_crt', 'VHS'], ['retro_term', '단말기'], ['gameboy', '게임보이'],
  ['glitch', '글리치'], ['boil', '지글거림'], ['halftone', '망점'], ['hologram', '홀로그램'], ['nightvision', '나이트비전'],
  ['collage', '포토 콜라주'], ['shards', '파편 흩날림'],
];
export const SHADER_TRANS: [string, string][] = [['', '게임 설정대로'], ['tv', 'TV 꺼짐·켜짐'], ['fade', '서서히'], ['none', '바로']];

const nameOf = (n: string) => SHADER_NAMES.find(([k]) => k === n)?.[1] ?? n;
export const newShader = (): BoxShader => ({ a: 'none', b: 'none' });

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
