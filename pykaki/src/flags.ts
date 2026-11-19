// 플래그(렌파이 변수) 다루기 (FEATURE 14). 처음 값은 원고 맨 위 default, 바꾸기는 $ 줄, 보기는 조건식
import type { Flag, FlagKind, Project } from './types';
import { IDENT, PLUGIN_NAMES, RESERVED } from './util';
import { normalizeUi } from './flagUi';

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

// 대사·선택지 글 안의 플래그 값 [이름] (렌파이 글 바꿔 넣기). 앞이 [이면 글자 그대로 쓴 것([[)이라 뺌
export const FLAG_SUB = /(?<!\[)\[([A-Za-z_][A-Za-z0-9_]*)\]/g;
// 글에 [이름]으로 쓴 이름들 (플래그인지는 안 봄)
export const subNames = (t: string) => Array.from(t.matchAll(FLAG_SUB), (m) => m[1]);
// 렌파이가 보여 주는 모양: True/False, 숫자, 글 그대로
export const shownValue = (v: unknown) => (v === true ? 'True' : v === false ? 'False' : v === undefined || v === null ? '' : String(v));
// 미리보기: 플래그 [이름]을 값으로 (없는 이름은 그대로)
export const fillFlags = (t: string, vars: Record<string, unknown>) => t.replace(FLAG_SUB, (m, n) => (n in vars ? shownValue(vars[n]) : m));

// 게임 밖에도 남는 플래그 (FEATURE 30, variables[].persist): 대본에는 이름만 쓰고, 원고에서만 persistent.이름으로
export const persistNames = (p: Project) => p.variables.filter((v) => v.persist).map((v) => v.name);
export const flagRef = (p: Project, name: string) => (p.variables.some((v) => v.name === name && v.persist) ? 'persistent.' + name : name);
// 식 안의 그 플래그 이름을 persistent.이름으로 (글자 안과 점 뒤는 그대로)
export function persistExpr(p: Project, e: string) {
  for (const n of persistNames(p)) e = renameIn(e, n, 'persistent.' + n);
  return e;
}
// 글 안 [이름]도 (화면 글·캐릭터 이름처럼 원고에 그대로 쓰는 글)
export function persistSub(p: Project, t: string) {
  for (const n of persistNames(p)) t = renameSub(t, n, 'persistent.' + n);
  return t;
}

// 글 안 플래그 값 [from]을 [to]로 (플래그 이름을 바꿀 때)
export const renameSub = (t: string, from: string, to: string) => t.replace(FLAG_SUB, (m, n) => (n === from ? `[${to}]` : m));

// 플래그 입력 줄의 원고 (FEATURE 30, 31). 원고 줄 목록 ($ 줄)
// 글자: $ 이름 = renpy.input("묻는 글", default=이름, length=N).strip() or "처음 값"
// 숫자 (range 최솟값·최댓값): 숫자만 받아 범위 안으로, 잘못 치거나 비우면 값 그대로
// ref는 원고에 쓰는 플래그 식(엔딩 후에도 남는 플래그는 persistent.이름), prompt는 대사처럼 바꾼 글
export function inputCode(f: Pick<Flag, 'kind' | 'init'>, ref: string, prompt: string, length?: number, range?: [number, number]): string[] {
  const len = length && length > 0 ? `, length=${Math.round(length)}` : '';
  if (f.kind === 'int' && range)
    return [`$ _pk_typed = renpy.input(${prompt}, default=str(${ref}), allow="-0123456789"${len}).strip()`, `$ ${ref} = max(${range[0]}, min(${range[1]}, int(_pk_typed))) if _pk_typed.lstrip("-").isdigit() else ${ref}`];
  return [`$ ${ref} = renpy.input(${prompt}, default=${ref}${len}).strip() or ${pyValue({ kind: 'str', init: String(f.init ?? '') })}`];
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
  while (flagNameProblem(p, 'flag_' + i)) i++;
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
      else if (l.type === 'input' && l.flag && p.variables.find((f) => f.id === l.flag)?.name === name) out.push({ nodeId: n.id, where: '플래그 입력 줄', write: true });
      else if ((l.type === 'say' || l.type === 'narration') && subNames(l.text).includes(name)) out.push({ nodeId: n.id, where: '대사 글', write: false });
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
  for (const c of p.characters) c.name = renameSub(c.name, from, to);
  for (const n of p.nodes) {
    for (const l of n.lines) {
      if (l.type === 'flag') l.text = renameIn(l.text, from, to);
      if (l.type === 'say' || l.type === 'narration' || l.type === 'input') l.text = renameSub(l.text, from, to);
    }
    if (n.exit.type === 'menu') {
      for (const c of n.exit.choices) c.text = renameSub(c.text, from, to);
      if (n.exit.ask) n.exit.ask.text = renameSub(n.exit.ask.text, from, to);
    }
    const e = n.exit;
    if (e.type === 'menu')
      for (const c of e.choices) {
        if (c.condition) c.condition = renameIn(c.condition, from, to);
        c.actions = c.actions.map((a) => renameIn(a, from, to));
      }
    if (e.type === 'if') for (const b of e.branches) b.cond = renameIn(b.cond, from, to);
  }
  // 화면의 보이는 조건, 버튼의 바꾸기, 막대, 글 속 [이름] (FEATURE 18)
  for (const s of p.screens ?? [])
    for (const it of s.items) {
      if (it.cond) it.cond = renameIn(it.cond, from, to);
      if (it.acts) it.acts = it.acts.map((a) => renameIn(a, from, to));
      if (it.flag === from) it.flag = to;
      if (it.text) it.text = it.text.split(`[${from}]`).join(`[${to}]`);
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
    out.push({ id: typeof v.id === 'string' && v.id ? v.id : 'v' + Date.now().toString(36) + seq++, name: v.name, kind, init: fitInit(kind, v.init), ...(typeof v.note === 'string' && v.note ? { note: v.note } : {}), ...(v.persist === true ? { persist: true as const } : {}), ...(normalizeUi(v.ui) ? { ui: normalizeUi(v.ui) } : {}) });
  }
  return out;
}

// ── 조건을 고르는 칸 (GUI). 조건식을 [플래그] [어떻게] [값] 줄 여러 개와 "모두/하나라도"로 읽고 다시 쓴다.
// 저장은 예전처럼 렌파이 조건식 글 하나라서 형식은 그대로. 이 모양으로 못 읽는 식은 글 칸으로 고친다
export type CmpOp = 'on' | 'off' | '==' | '!=' | '>=' | '<=' | '>' | '<';
export interface Clause { name: string; op: CmpOp; value: string }
export interface Cond { join: 'and' | 'or'; clauses: Clause[] }

const NAME = '[A-Za-z_][A-Za-z0-9_]*';
const VALUE = /-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|True|False/.source;
const CLAUSE_RE = new RegExp(`^(?:(not\\s+)?(${NAME})|(${NAME})\\s*(==|!=|>=|<=|>|<)\\s*(${VALUE}))$`);

export function parseCond(s: string): Cond | null {
  const t = s.trim();
  if (!t) return { join: 'and', clauses: [] };
  // 글자 안의 and/or는 나누지 않게 글자를 잠깐 가린다
  const strs: string[] = [];
  const masked = t.replace(/"(?:[^"\\]|\\.)*"/g, (m) => (strs.push(m), `\u0000${strs.length - 1}\u0000`));
  const hasAnd = /\band\b/.test(masked);
  const hasOr = /\bor\b/.test(masked);
  if (hasAnd && hasOr) return null; // 섞인 것은 괄호 뜻이 달라질 수 있어서 글 칸으로
  if (/[()]/.test(masked)) return null;
  const join = hasOr ? 'or' : 'and';
  const parts = masked.split(join === 'or' ? /\s+or\s+/ : /\s+and\s+/).map((p) => p.replace(/\u0000(\d+)\u0000/g, (_, i) => strs[+i]).trim());
  const clauses: Clause[] = [];
  for (const p of parts) {
    const m = CLAUSE_RE.exec(p);
    if (!m) return null;
    if (m[2]) {
      if (PY_NAMES.has(m[2])) return null;
      clauses.push({ name: m[2], op: m[1] ? 'off' : 'on', value: '' });
    } else {
      // 켜짐/꺼짐 플래그를 == True / == False로 쓴 것도 읽는다
      if ((m[4] === '==' || m[4] === '!=') && (m[5] === 'True' || m[5] === 'False')) clauses.push({ name: m[3], op: (m[4] === '==') === (m[5] === 'True') ? 'on' : 'off', value: '' });
      else clauses.push({ name: m[3], op: m[4] as CmpOp, value: m[5] });
    }
  }
  return { join, clauses };
}

export function clauseText(c: Clause) {
  if (c.op === 'on') return c.name;
  if (c.op === 'off') return `not ${c.name}`;
  return `${c.name} ${c.op} ${c.value || '0'}`;
}

export const condText = (c: Cond) => c.clauses.map(clauseText).join(` ${c.join} `);

// 플래그를 고를 때 처음 조건 (켜짐/꺼짐은 켜져 있으면, 숫자는 1 이상, 글자는 빈 글과 같으면)
export const firstClause = (f: Flag): Clause => (f.kind === 'bool' ? { name: f.name, op: 'on', value: '' } : f.kind === 'int' ? { name: f.name, op: '>=', value: '1' } : { name: f.name, op: '==', value: '""' });

export const CMP_LABEL: Record<Exclude<CmpOp, 'on' | 'off'>, string> = { '>=': '이상', '<=': '이하', '>': '보다 크면', '<': '보다 작으면', '==': '이면', '!=': '이 아니면' };

// 조건을 사람 말로 (상자 안에 보여 줄 때). 못 읽으면 식 그대로
export function condWords(s: string) {
  const c = parseCond(s);
  if (!c || !c.clauses.length) return s;
  const one = (x: Clause) => {
    if (x.op === 'on') return `${x.name} 켜짐`;
    if (x.op === 'off') return `${x.name} 꺼짐`;
    const sym = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '=', '!=': '≠' }[x.op];
    return `${x.name} ${sym} ${x.value}`;
  };
  return c.clauses.map(one).join(c.join === 'and' ? ' 그리고 ' : ' 또는 ');
}
