// 플래그 설계 표 계산 (2단계, 화면은 FlagDesign.tsx): 세로 = 플래그, 가로 = 대본 흐름 순서의 상자. 칸마다 그 상자가 플래그를 바꾸는 곳(✎)과 보는 곳(?)을 모은다.
// 닿을 수 있는 값은 대본을 렌파이 없이 상자 단위로 넓게 따라가 셈한다(갈래·선택지를 모두 지나간다고 보고, 값이 많으면 "여러 값").
// 그래서 "늘 참/늘 거짓" 표시는 확실할 때만 나온다(놓치는 것은 있어도 틀리게 짚지는 않음). 대본은 고치지 않는다
import type { BoxNode, Project } from './types';
import { screenFlagUses } from './screens';
import { exprNames, parseAction, parseCond } from './flags';
import { applyAction, boxActions, evalExpr, UNKNOWN, type Val, type Vars } from './trace';

// 칸 안의 쓰임 하나. 고칠 자리를 가리킨다
export type DUse =
  | { at: 'line'; lineId: string; text: string; write: boolean } // ⚑ 플래그 바꾸기 줄
  | { at: 'cmd'; lineId: string; text: string; write: boolean } // 직접 쓴 명령 줄 (표에서는 못 고침)
  | { at: 'act'; choiceId: string; idx: number; text: string; choice: string } // 선택지 "고르면"
  | { at: 'cond'; choiceId: string; text: string; choice: string } // 선택지 보이는 조건
  | { at: 'branch'; branchId: string; idx: number; text: string }; // ◇ 조건 분기

export const isWrite = (u: DUse) => (u.at === 'line' || u.at === 'cmd' ? u.write : u.at === 'act');

const MANY = 12; // 한 플래그가 가질 수 있는 값을 이만큼 넘게 모으면 "여러 값"
type VSet = Set<string> | 'many'; // 값은 JSON 글로 모은다 (true, 3, "a")
type State = Record<string, VSet>;

const enc = (v: Val) => JSON.stringify(v);
const dec = (s: string) => JSON.parse(s) as Val;

export interface Design {
  boxes: BoxNode[]; // 표의 가로: 흐름 순서 (플래그를 쓰는 상자만, all이면 모두)
  unreached: Set<string>; // 대본 시작에서 닿지 않는 상자
  cells: Map<string, DUse[]>; // key = 플래그 이름 + '\n' + 상자 id
  values: Map<string, VSet>; // 플래그마다 대본 어디선가 가질 수 있는 값
  notes: Map<string, string[]>; // 플래그마다 노란 표시 글
  cellNotes: Map<string, string>; // 칸마다 노란 표시 글 (늘 참/늘 거짓)
}

export const cellKey = (flag: string, box: string) => flag + '\n' + box;

// 상자에서 나가는 곳 (선택지는 고르면 바꾸는 식을 함께)
function exits(b: BoxNode): { to: string | null; acts?: string[] }[] {
  const e = b.exit;
  if (e.type === 'next') return [{ to: e.target }];
  if (e.type === 'if') return [...e.branches.map((x) => ({ to: x.target })), { to: e.else }];
  if (e.type === 'menu') return e.choices.map((c) => ({ to: c.target, acts: c.actions }));
  if (e.type === 'call') return [{ to: e.target }];
  if (e.type === 'screen') return [...e.outs.map((x) => ({ to: x.target })), { to: e.else }];
  return [];
}

// 흐름 순서: 시작 상자부터 나가는 곳을 차례로(깊이 먼저, call의 "돌아오면"은 call한 곳 뒤에). 닿지 않는 상자는 뒤에 label 차례로
export function flowOrder(p: Project): { order: BoxNode[]; unreached: Set<string> } {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const order: BoxNode[] = [];
  const visit = (id: string | null) => {
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || seen.has(cur)) continue;
      const b = byId.get(cur);
      if (!b) continue;
      seen.add(cur);
      order.push(b);
      const next: (string | null)[] = exits(b).map((x) => x.to);
      if (b.exit.type === 'call') next.push(b.exit.then);
      for (let i = next.length - 1; i >= 0; i--) stack.push(next[i]);
    }
  };
  visit(p.project.startNode || p.nodes[0]?.id || null);
  const reached = new Set(seen);
  for (const g of p.labels) visit(g.entry); // 따로 jump로만 부르는 label은 입구부터
  for (const n of p.nodes) visit(n.id);
  const unreached = new Set(p.nodes.filter((n) => !reached.has(n.id)).map((n) => n.id));
  return { order, unreached };
}

// 상자 하나에서 플래그마다 쓰임
export function boxUses(b: BoxNode, names: Set<string>): Map<string, DUse[]> {
  const out = new Map<string, DUse[]>();
  const put = (n: string, u: DUse) => {
    if (!names.has(n)) return;
    const a = out.get(n) ?? [];
    a.push(u);
    out.set(n, a);
  };
  for (const l of b.lines) {
    if (l.type === 'flag' && l.text.trim()) {
      const w = parseAction(l.text)?.name;
      if (w) put(w, { at: 'line', lineId: l.id, text: l.text, write: true });
      for (const n of new Set(exprNames(l.text))) if (n !== w) put(n, { at: 'line', lineId: l.id, text: l.text, write: false });
    }
    if (l.type === 'command')
      for (const row of l.text.split('\n')) {
        const t = row.trim().replace(/^\$\s*/, '');
        if (!t) continue;
        const w = row.trim().startsWith('$') ? parseAction(t)?.name : undefined;
        if (w) put(w, { at: 'cmd', lineId: l.id, text: row.trim(), write: true });
        for (const n of new Set(exprNames(t))) if (n !== w) put(n, { at: 'cmd', lineId: l.id, text: row.trim(), write: false });
      }
  }
  const e = b.exit;
  if (e.type === 'menu')
    for (const c of e.choices) {
      if (c.condition) for (const n of new Set(exprNames(c.condition))) put(n, { at: 'cond', choiceId: c.id, text: c.condition, choice: c.text });
      c.actions.forEach((a, idx) => {
        const w = parseAction(a)?.name;
        if (w) put(w, { at: 'act', choiceId: c.id, idx, text: a, choice: c.text });
      });
    }
  if (e.type === 'if') e.branches.forEach((br, idx) => br.cond && new Set(exprNames(br.cond)).forEach((n) => put(n, { at: 'branch', branchId: br.id, idx, text: br.cond })));
  // 같은 줄이 여러 번 잡히지 않게 (명령 줄 여러 줄은 줄마다)
  for (const [n, a] of out) {
    const seen = new Set<string>();
    out.set(n, a.filter((u) => {
      const k = JSON.stringify(u);
      return seen.has(k) ? false : (seen.add(k), true);
    }));
  }
  return out;
}

// ── 닿을 수 있는 값 (넓게 따라가기)
function join(a: State, b: State): [State, boolean] {
  let changed = false;
  const out: State = { ...a };
  for (const k of Object.keys(b)) {
    const x = out[k], y = b[k];
    if (x === 'many') continue;
    if (y === 'many' || !x) {
      if (x !== y) changed = true;
      out[k] = y === 'many' ? 'many' : new Set(y);
      continue;
    }
    let s: Set<string> | null = null;
    for (const v of y)
      if (!x.has(v)) {
        s ??= new Set(x);
        s.add(v);
      }
    if (s) {
      changed = true;
      out[k] = s.size > MANY ? 'many' : s;
    }
  }
  return [out, changed];
}

// 식 하나를 상태에 적용: 바꾸는 플래그의 값마다(다른 플래그는 값이 하나일 때만 앎)
function applyState(st: State, act: string): State {
  const a = parseAction(act.replace(/^\s*\$\s*/, ''));
  if (!a || !(a.name in st)) return st;
  const fixed: Vars = {};
  for (const [k, s] of Object.entries(st)) if (s !== 'many' && s.size === 1) fixed[k] = dec([...s][0]);
  const cur = st[a.name];
  const out = new Set<string>();
  const froms: (Val | undefined)[] = a.op === '=' ? [undefined] : cur === 'many' ? [] : [...cur].map(dec);
  if (a.op !== '=' && cur === 'many') return { ...st, [a.name]: 'many' };
  for (const f of froms) {
    const vars: Vars = { ...fixed };
    if (f !== undefined) vars[a.name] = f;
    else delete vars[a.name];
    const r = applyAction(act, vars);
    if (!r || r.value === UNKNOWN) return { ...st, [a.name]: 'many' };
    out.add(enc(r.value));
  }
  return { ...st, [a.name]: out.size > MANY ? 'many' : out };
}

// 조건을 상태로 셈: 'true' | 'false' | 'some'(갈림) | 'unknown'(모름). 플래그 값의 짝을 모두 넣어 봄 (많으면 모름)
export function condOver(st: State | undefined, cond: string): 'true' | 'false' | 'some' | 'unknown' {
  if (!st || !cond.trim()) return 'unknown';
  const names = [...new Set(exprNames(cond))];
  if (!names.length || names.some((n) => !(n in st) || st[n] === 'many')) return 'unknown';
  let combos: Vars[] = [{}];
  for (const n of names) {
    const next: Vars[] = [];
    for (const c of combos) for (const v of st[n] as Set<string>) next.push({ ...c, [n]: dec(v) });
    combos = next;
    if (combos.length > 256) return 'unknown';
  }
  let t = false, f = false;
  for (const c of combos) {
    const r = evalExpr(cond, c);
    if (r === UNKNOWN) return 'unknown';
    if (r === false || r === null || r === 0 || r === '') f = true;
    else t = true;
  }
  return t && f ? 'some' : t ? 'true' : 'false';
}

// 상자에 들어갈 때의 상태와 상자 끝(선택지·조건 분기를 볼 때)의 상태
function reach(p: Project): { atEnd: Map<string, State>; all: State } {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const init: State = Object.fromEntries(p.variables.map((f) => [f.name, new Set([enc(f.init as Val)])]));
  const atStart = new Map<string, State>();
  const atEnd = new Map<string, State>();
  // return 상자마다 돌아갈 곳: 그 상자에 닿는 call의 "돌아오면" (call이 부른 상자에서 return 전까지 닿는 것만. 맨 위 return은 끝)
  const backTo = new Map<string, string[]>();
  for (const c of p.nodes) {
    if (c.exit.type !== 'call' || !c.exit.then) continue;
    const seen = new Set<string>();
    const stack = [c.exit.target];
    while (stack.length) {
      const id = stack.pop();
      if (!id || seen.has(id)) continue;
      const b = byId.get(id);
      if (!b) continue;
      seen.add(id);
      if (b.exit.type === 'return') backTo.set(id, [...(backTo.get(id) ?? []), c.exit.then]);
      else if (b.exit.type === 'call') stack.push(b.exit.then); // 안쪽 call은 돌아온 뒤부터 이어감
      else for (const x of exits(b)) stack.push(x.to);
    }
  }
  const work: string[] = [];
  const feed = (id: string | null, st: State) => {
    if (!id || !byId.has(id)) return;
    const old = atStart.get(id);
    if (!old) atStart.set(id, st);
    else {
      const [j, ch] = join(old, st);
      if (!ch) return;
      atStart.set(id, j);
    }
    work.push(id);
  };
  feed(p.project.startNode || p.nodes[0]?.id || null, init);
  let guard = 0;
  while (work.length && guard++ < 20000) {
    const id = work.shift()!;
    const b = byId.get(id)!;
    let st = atStart.get(id)!;
    for (const a of boxActions(b)) st = applyState(st, a);
    atEnd.set(id, st);
    for (const x of exits(b)) {
      let s2 = st;
      for (const a of x.acts ?? []) s2 = applyState(s2, a);
      feed(x.to, s2);
    }
    // return은 그 상자에 닿는 call의 "돌아오면"으로 (여러 call이 부르면 모두로)
    if (b.exit.type === 'return') for (const t of backTo.get(id) ?? []) feed(t, st);
  }
  let all: State = { ...init };
  for (const s of atEnd.values()) all = join(all, s)[0];
  for (const s of atStart.values()) all = join(all, s)[0];
  return { atEnd, all };
}

export function buildDesign(p: Project, showAll = false): Design {
  const names = new Set(p.variables.map((f) => f.name));
  const { order, unreached } = flowOrder(p);
  const cells = new Map<string, DUse[]>();
  const used = new Set<string>();
  for (const b of order) {
    const m = boxUses(b, names);
    if (m.size) used.add(b.id);
    for (const [n, a] of m) cells.set(cellKey(n, b.id), a);
  }
  const { atEnd, all } = reach(p);
  const notes = new Map<string, string[]>();
  const cellNotes = new Map<string, string>();
  for (const f of p.variables) {
    const us = order.flatMap((b) => cells.get(cellKey(f.name, b.id)) ?? []);
    // 화면(HUD)에서 보거나 바꾸는 것도 친다 (FEATURE 18)
    const su = screenFlagUses(p, f.name);
    const w = us.some(isWrite) || su.some((u) => u.write), r = us.some((u) => !isWrite(u)) || su.some((u) => !u.write);
    const a: string[] = [];
    if (!us.length && !su.length) a.push('아직 안 써요');
    else if (w && !r) a.push('바꾸기만 하고 보는 곳이 없어요');
    else if (!w && r) a.push('보기만 하고 바꾸는 곳이 없어요 (늘 처음 값)');
    if (a.length) notes.set(f.name, a);
  }
  // 선택지 조건·조건 분기가 늘 참이거나 늘 거짓인 칸
  for (const b of order) {
    const st = atEnd.get(b.id);
    if (!st) continue;
    for (const f of p.variables) {
      const us = cells.get(cellKey(f.name, b.id));
      if (!us) continue;
      for (const u of us) {
        if (u.at !== 'cond' && u.at !== 'branch') continue;
        const r = condOver(st, u.text);
        if (r === 'true' || r === 'false') {
          const what = u.at === 'cond' ? `선택지 "${u.choice}"가 늘 ${r === 'true' ? '보여요' : '안 보여요'}` : `"${u.text}" 조건이 늘 ${r === 'true' ? '참이에요' : '거짓이에요'}`;
          cellNotes.set(cellKey(f.name, b.id), what);
        }
      }
    }
  }
  return {
    boxes: showAll ? order : order.filter((b) => used.has(b.id)),
    unreached,
    cells,
    values: new Map(Object.entries(all)),
    notes,
    cellNotes,
  };
}

// 값 모음을 사람 말로 (숫자는 작은 것부터, 넷 넘게면 "최소 ~ 최대")
export function valuesText(v: VSet | undefined, kind: 'bool' | 'int' | 'str') {
  if (!v) return '';
  if (v === 'many') return '여러 값';
  const xs = [...v].map(dec);
  if (kind === 'bool') return xs.length > 1 ? '켜짐, 꺼짐' : xs[0] ? '늘 켜짐' : '늘 꺼짐';
  if (kind === 'int') {
    const ns = xs.filter((x): x is number => typeof x === 'number').sort((a, b) => a - b);
    if (ns.length !== xs.length) return xs.map((x) => String(x)).join(', ');
    return ns.length > 4 ? `${ns[0]} ~ ${ns[ns.length - 1]}` : ns.join(', ');
  }
  return xs.map((x) => (typeof x === 'string' ? `"${x}"` : String(x))).join(', ');
}

// 칸에 짧게 보일 글: 바꾸기는 "+1", "켜기", "= "a"", 보기는 그 플래그 조각만 ("≥ 2", "켜짐")
export function shortOf(u: DUse, flag: string): string {
  if (isWrite(u)) {
    const a = parseAction(u.text.replace(/^\$\s*/, ''));
    if (!a) return u.text;
    if (a.op === '+=') return `+${a.value}`;
    if (a.op === '-=') return `−${a.value}`;
    if (a.value === 'True') return '켜기';
    if (a.value === 'False') return '끄기';
    if (a.value === `not ${flag}`) return '뒤집기';
    return `= ${a.value}`;
  }
  const c = parseCond(u.text);
  const k = c?.clauses.find((x) => x.name === flag);
  if (!k) return '?';
  if (k.op === 'on') return '켜짐';
  if (k.op === 'off') return '꺼짐';
  const sym = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '=', '!=': '≠' }[k.op];
  return `${sym} ${k.value}`;
}
