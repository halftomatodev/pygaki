// 플래그 따라가 보기 (3단계): 대본을 렌파이 없이 상자 단위로 따라가며 플래그 값과 조건 분기 갈래를 본다.
// 조건식과 바꾸는 식은 파이썬 일부만 계산한다 (숫자, 글자, True/False/None, 이름, + - * / // %, 비교, and/or/not, 괄호).
// 모르는 이름이나 문법이면 UNKNOWN (화면에서 "알 수 없음"으로 보여 주고 사람이 고르게)
import type { BoxNode, Project } from './types';
import { parseAction } from './flags';

export const UNKNOWN = Symbol('unknown');
export type Val = number | string | boolean | null;
export type Vars = Record<string, Val>;
type V = Val | typeof UNKNOWN;

type Tok = { k: 'num' | 'str' | 'name' | 'op'; v: string };
function lex(s: string): Tok[] | null {
  const out: Tok[] = [];
  const re = /\s*(?:(\d+\.\d*|\.\d+|\d+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_]\w*)|(\/\/|==|!=|>=|<=|[-+*/%<>()]))/y;
  let i = 0;
  while (i < s.length) {
    if (!s.slice(i).trim()) break;
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) return null;
    i = re.lastIndex;
    if (m[1]) out.push({ k: 'num', v: m[1] });
    else if (m[2]) out.push({ k: 'str', v: m[2].slice(1, -1).replace(/\\(.)/g, '$1') });
    else if (m[3]) out.push({ k: 'name', v: m[3] });
    else out.push({ k: 'op', v: m[4] });
  }
  return out;
}

const truthy = (v: Val) => !(v === false || v === null || v === 0 || v === '');

// 우선순위: or < and < not < 비교 < + - < * / // % < 단항 -
export function evalExpr(src: string, vars: Vars): V {
  const t = lex(src);
  if (!t || !t.length) return UNKNOWN;
  let i = 0;
  const peek = () => t[i];
  const eat = (v: string) => (t[i]?.k === 'op' && t[i].v === v ? (i++, true) : false);
  const bad = { x: false };
  const or = (): V => {
    let a = and();
    while (peek()?.k === 'name' && peek().v === 'or') {
      i++;
      const b = and();
      a = a === UNKNOWN ? (b !== UNKNOWN && truthy(b) ? b : UNKNOWN) : truthy(a) ? a : b;
    }
    return a;
  };
  const and = (): V => {
    let a = not();
    while (peek()?.k === 'name' && peek().v === 'and') {
      i++;
      const b = not();
      a = a === UNKNOWN ? (b !== UNKNOWN && !truthy(b) ? b : UNKNOWN) : !truthy(a) ? a : b;
    }
    return a;
  };
  const not = (): V => {
    if (peek()?.k === 'name' && peek().v === 'not') {
      i++;
      const a = not();
      return a === UNKNOWN ? UNKNOWN : !truthy(a);
    }
    return cmp();
  };
  const cmp = (): V => {
    let a = add();
    let res: V = null;
    let chained = false;
    while (peek()?.k === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(peek().v)) {
      const op = t[i++].v;
      const b = add();
      let r: V;
      if (a === UNKNOWN || b === UNKNOWN) r = UNKNOWN;
      else if (op === '==') r = a === b;
      else if (op === '!=') r = a !== b;
      else if ((typeof a === 'string') !== (typeof b === 'string') || a === null || b === null) r = UNKNOWN;
      else {
        const x = typeof a === 'string' ? a : Number(a), y = typeof b === 'string' ? b : Number(b);
        r = op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
      }
      res = !chained ? r : res === UNKNOWN || r === UNKNOWN ? UNKNOWN : (res as boolean) && (r as boolean);
      chained = true;
      a = b;
    }
    return chained ? res : a;
  };
  const num = (v: V) => (v === true ? 1 : v === false ? 0 : v);
  const add = (): V => {
    let a = mul();
    while (peek()?.k === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = t[i++].v;
      const b = mul();
      if (a === UNKNOWN || b === UNKNOWN) a = UNKNOWN;
      else if (typeof a === 'string' && typeof b === 'string' && op === '+') a = a + b;
      else if (typeof num(a) === 'number' && typeof num(b) === 'number') a = op === '+' ? (num(a) as number) + (num(b) as number) : (num(a) as number) - (num(b) as number);
      else a = UNKNOWN;
    }
    return a;
  };
  const mul = (): V => {
    let a = unary();
    while (peek()?.k === 'op' && ['*', '/', '//', '%'].includes(peek().v)) {
      const op = t[i++].v;
      const b = unary();
      const x = num(a), y = num(b);
      if (typeof x !== 'number' || typeof y !== 'number' || (op !== '*' && y === 0)) a = UNKNOWN;
      else a = op === '*' ? x * y : op === '/' ? x / y : op === '//' ? Math.floor(x / y) : ((x % y) + y) % y;
    }
    return a;
  };
  const unary = (): V => {
    if (eat('-')) {
      const a = num(unary());
      return typeof a === 'number' ? -a : UNKNOWN;
    }
    if (eat('+')) return unary();
    return atom();
  };
  const atom = (): V => {
    const x = t[i++];
    if (!x) return (bad.x = true), UNKNOWN;
    if (x.k === 'num') return Number(x.v);
    if (x.k === 'str') return x.v;
    if (x.k === 'op' && x.v === '(') {
      const a = or();
      if (!eat(')')) bad.x = true;
      return a;
    }
    if (x.k === 'name') {
      if (x.v === 'True') return true;
      if (x.v === 'False') return false;
      if (x.v === 'None') return null;
      if (peek()?.v === '(' || peek()?.v === '.') return (bad.x = true), UNKNOWN; // 함수, 속성은 모름
      return x.v in vars ? vars[x.v] : UNKNOWN;
    }
    bad.x = true;
    return UNKNOWN;
  };
  const r = or();
  return bad.x || i < t.length ? UNKNOWN : r;
}

// 바꾸는 식 하나를 적용. 바꾼 이름과 새 값(모르면 UNKNOWN), 못 읽으면 null
export function applyAction(src: string, vars: Vars): { name: string; value: V } | null {
  const a = parseAction(src.replace(/^\s*\$\s*/, ''));
  if (!a) return null;
  const v = evalExpr(a.value, vars);
  let out: V = v;
  if (a.op !== '=') {
    const cur = vars[a.name];
    if (v === UNKNOWN || !(a.name in vars)) out = UNKNOWN;
    else if (typeof cur === 'string' && typeof v === 'string' && a.op === '+=') out = cur + v;
    else if (typeof cur === 'number' || typeof cur === 'boolean') {
      const c = Number(cur), d = Number(v);
      out = Number.isFinite(d) ? (a.op === '+=' ? c + d : c - d) : UNKNOWN;
    } else out = UNKNOWN;
  }
  if (out === UNKNOWN) delete vars[a.name];
  else vars[a.name] = out;
  return { name: a.name, value: out };
}

export const initVars = (p: Project): Vars => Object.fromEntries(p.variables.map((f) => [f.name, f.init as Val]));

// 상자의 줄에서 플래그 바꾸기 (flag 줄, 직접 명령의 "$ 이름 op 값" 줄)
export function boxActions(b: BoxNode): string[] {
  const out: string[] = [];
  for (const l of b.lines) {
    if (l.type === 'flag' && l.text.trim()) out.push(l.text.trim());
    if (l.type === 'command') for (const row of l.text.split('\n')) if (/^\s*\$\s*[A-Za-z_]\w*\s*(\+=|-=|=)(?!=)/.test(row)) out.push(row.trim().replace(/^\$\s*/, ''));
  }
  return out;
}

export const showVal = (v: V) => (v === UNKNOWN ? '알 수 없음' : v === true ? '켜짐' : v === false ? '꺼짐' : v === null ? 'None' : typeof v === 'string' ? `"${v}"` : String(v));
