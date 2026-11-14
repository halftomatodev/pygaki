// 플래그(렌파이 변수) 다루기 (FEATURE 14). 처음 값은 원고 맨 위 default, 바꾸기는 $ 줄, 보기는 조건식
import type { Flag, FlagKind, Project } from './types';
import { IDENT, PLUGIN_NAMES, RESERVED } from './util';

export const KIND_LABEL: Record<FlagKind, string> = { bool: '켜짐/꺼짐', int: '숫자', str: '글자' };

export const defaultInit = (k: FlagKind): Flag['init'] => (k === 'bool' ? false : k === 'int' ? 0 : '');

// 종류에 맞게 처음 값을 고친다 (손으로 고친 파일, 종류를 바꿀 때)
export function fitInit(k: FlagKind, v: unknown): Flag['init'] {
  if (k === 'bool') return v === true || v === 'True' || v === 'true' || v === 1;
  if (k === 'int') {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v);
}

const pyStr = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n') + '"';

// 파이썬 값으로
export function pyValue(f: Pick<Flag, 'kind' | 'init'>) {
  if (f.kind === 'bool') return f.init ? 'True' : 'False';
  if (f.kind === 'int') return String(fitInit('int', f.init));
  return pyStr(String(f.init));
}

// 이름 검사. 문제가 없으면 ''
export function flagNameProblem(p: Project, name: string, selfId?: string) {
  if (!name) return '이름이 비어 있어요';
  if (!IDENT.test(name)) return '영문·숫자·_만 쓰고, 숫자로 시작할 수 없어요';
  if (RESERVED.has(name) || PY_NAMES.has(name)) return '렌파이나 파이썬이 쓰는 이름이에요';
  if (p.settings.renpyLink && PLUGIN_NAMES.has(name)) return 'pygaki 플러그인이 쓰는 이름과 겹쳐요';
  if (p.characters.some((c) => c.id === name)) return '캐릭터 id와 겹쳐요';
  if (p.variables.some((v) => v.id !== selfId && v.name === name)) return '같은 이름의 플래그가 있어요';
  return '';
}

export function newFlagName(p: Project) {
  let i = p.variables.length + 1;
  while (p.variables.some((v) => v.name === 'flag_' + i)) i++;
  return 'flag_' + i;
}

// 조건식·바꾸는 식에 나와도 플래그로 보지 않는 이름 (파이썬 키워드, 자주 쓰는 내장 함수, 렌파이 이름공간)
const PY_NAMES = new Set([
  'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'if', 'else', 'lambda',
  'len', 'min', 'max', 'abs', 'int', 'str', 'float', 'bool', 'round', 'sum', 'any', 'all', 'list', 'dict', 'set', 'range',
  'renpy', 'persistent', 'store', 'config', 'preferences', '_preferences', 'achievement', 'gui', 'style',
]);

// 식에 나오는 이름 (글자 안, 점 뒤, 함수 부르기는 뺌)
export function exprNames(expr: string): string[] {
  const out: string[] = [];
  const s = expr.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, ' "" ');
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const before = s.slice(0, m.index).trimEnd();
    const after = s.slice(m.index + m[0].length).trimStart();
    if (before.endsWith('.') || /^[0-9]/.test(m[0])) continue;
    if (/[0-9.]$/.test(s.slice(0, m.index)) && /^[eE]/.test(m[0])) continue; // 1e5
    if (after.startsWith('(')) continue;
    if (PY_NAMES.has(m[0])) continue;
    out.push(m[0]);
  }
  return out;
}

// 바꾸는 식 하나: name op value
export type Op = '=' | '+=' | '-=';
export interface Action { name: string; op: Op; value: string }
export function parseAction(s: string): Action | null {
  const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(\+=|-=|=)(?!=)\s*(.*?)\s*$/.exec(s);
  return m ? { name: m[1], op: m[2] as Op, value: m[3] } : null;
}
export const actionText = (a: Action) => `${a.name} ${a.op} ${a.value}`.trimEnd();

// 바꾸는 식을 사람 말로 (상자 안에 보여 줄 때)
export function actionWords(p: Project, s: string) {
  const a = parseAction(s);
  if (!a) return s;
  const f = p.variables.find((v) => v.name === a.name);
  if (f?.kind === 'bool' && a.op === '=' && (a.value === 'True' || a.value === 'False')) return `${a.name} ${a.value === 'True' ? '켜기' : '끄기'}`;
  if (a.op === '+=') return `${a.name} +${a.value}`;
  if (a.op === '-=') return `${a.name} −${a.value}`;
  return `${a.name} = ${a.value}`;
}

// 식에 쓴 이름을 바꾼다 (글자 안과 점 뒤는 그대로)
export function renameIn(expr: string, from: string, to: string) {
  const parts = expr.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
  const re = new RegExp(`(?<![A-Za-z0-9_.])${from}(?![A-Za-z0-9_])`, 'g');
  return parts.map((x, i) => (i % 2 ? x : x.replace(re, to))).join('');
}

export interface FlagUse { nodeId: string; where: string; write: boolean }

// 플래그가 쓰인 곳: 어느 상자가 바꾸고(write) 보는지
export function flagUses(p: Project, name: string): FlagUse[] {
  const out: FlagUse[] = [];
  const has = (e: string | null | undefined) => !!e && exprNames(e).includes(name);
  const writes = (a: string) => parseAction(a)?.name === name;
  for (const n of p.nodes) {
    for (const l of n.lines) {
      if (l.type === 'flag' && writes(l.text)) out.push({ nodeId: n.id, where: '바꾸기 줄', write: true });
      else if (l.type === 'flag' && has(l.text)) out.push({ nodeId: n.id, where: '바꾸기 줄', write: false });
      else if (l.type === 'command' && new RegExp(`(?<![A-Za-z0-9_.])${name}(?![A-Za-z0-9_])`).test(l.text)) out.push({ nodeId: n.id, where: '명령 줄', write: false });
    }
    const e = n.exit;
    if (e.type === 'menu')
      for (const c of e.choices) {
        if (has(c.condition)) out.push({ nodeId: n.id, where: '선택지 조건', write: false });
        if (c.actions.some(writes)) out.push({ nodeId: n.id, where: '선택지 고르면', write: true });
      }
    if (e.type === 'if' && e.branches.some((b) => has(b.cond))) out.push({ nodeId: n.id, where: '조건 분기', write: false });
  }
  // 같은 상자의 같은 자리는 한 번만
  const seen = new Set<string>();
  return out.filter((u) => {
    const k = u.nodeId + u.where + u.write;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}

// 플래그 이름을 바꾸면 쓰인 곳도 같이 (명령 줄은 사용자가 쓴 글이라 그대로)
export function renameFlag(p: Project, from: string, to: string) {
  for (const n of p.nodes) {
    for (const l of n.lines) if (l.type === 'flag') l.text = renameIn(l.text, from, to);
    const e = n.exit;
    if (e.type === 'menu')
      for (const c of e.choices) {
        if (c.condition) c.condition = renameIn(c.condition, from, to);
        c.actions = c.actions.map((a) => renameIn(a, from, to));
      }
    if (e.type === 'if') for (const b of e.branches) b.cond = renameIn(b.cond, from, to);
  }
}

// 플래그를 고를 때 조건 칸에 넣을 글 (켜짐/꺼짐은 이름만, 숫자는 비교)
export const condSnippet = (f: Flag) => (f.kind === 'bool' ? f.name : f.kind === 'int' ? `${f.name} >= 1` : `${f.name} == ""`);

// 불러온 값 정리 (normalizeProject)
let seq = 0;
export function normalizeFlags(raw: unknown): Flag[] {
  if (!Array.isArray(raw)) return [];
  const out: Flag[] = [];
  for (const v of raw as any[]) {
    if (!v || typeof v !== 'object' || typeof v.name !== 'string') continue;
    const kind: FlagKind = v.kind === 'bool' || v.kind === 'int' || v.kind === 'str' ? v.kind : typeof v.init === 'boolean' ? 'bool' : typeof v.init === 'number' ? 'int' : 'str';
    out.push({ id: typeof v.id === 'string' && v.id ? v.id : 'v' + Date.now().toString(36) + seq++, name: v.name, kind, init: fitInit(kind, v.init), ...(typeof v.note === 'string' && v.note ? { note: v.note } : {}) });
  }
  return out;
}
