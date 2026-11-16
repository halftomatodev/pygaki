// 플래그의 꼴 (FEATURE 20): 기본값, 꾸밀 부품, 불러온 값 정리, 시험 값, 그 값일 때 대본이 어떻게 되는지
import { create } from 'zustand';
import type { Flag, FlagLook, FlagUi, LevelStyle, Project } from './types';
import { evalExpr, applyAction, initVars, UNKNOWN, type Val, type Vars } from './trace';
import { condText, exprNames, parseAction, parseCond, type CmpOp } from './flags';

export const LOOK_LABEL: Record<FlagLook, string> = { level: '레벨 인디케이터', slider: '슬라이더', switch: '스위치', pulldown: '풀다운', combo: '콤보박스' };
export const STYLE_LABEL: Record<LevelStyle, string> = { continuous: '이어진 막대', discrete: '칸 막대', rating: '별' };
export const looksFor = (k: Flag['kind']): FlagLook[] => (k === 'int' ? ['level', 'slider'] : k === 'bool' ? ['switch'] : ['pulldown', 'combo']);

// 꾸밀 부품: [이름, 한국어 이름, 기본 색]. 그림을 넣으면 그 부품을 그림으로 그림
export type PartDef = [part: string, label: string, color: string];
export function skinParts(ui: FlagUi): PartDef[] {
  if (ui.look === 'level')
    return ui.style === 'rating'
      ? [['on', '찬 기호', '#f5b301'], ['off', '빈 기호', '#c9c4b8']]
      : [['fill', '채움', '#e0607a'], ['track', '바탕', '#00000022'], ['border', '테두리', '#00000033']];
  if (ui.look === 'slider') return [['track', '트랙', '#00000022'], ['fill', '채운 쪽', '#3b82f6'], ['thumb', '손잡이', '#ffffff'], ['tick', '눈금', '#00000055']];
  if (ui.look === 'switch') return [['on', '켜짐 바탕', '#34c759'], ['off', '꺼짐 바탕', '#00000026'], ['thumb', '손잡이', '#ffffff']];
  return [['box', '바탕', '#ffffff'], ['text', '글자', '#1f2328'], ['border', '테두리', '#00000033']];
}

// 이 플래그의 꼴 (저장된 것이 종류와 맞지 않으면 종류의 기본 꼴)
export function flagUi(f: Pick<Flag, 'kind' | 'ui'>): FlagUi {
  const u = f.ui;
  const ok = u && looksFor(f.kind).includes(u.look);
  if (ok) return u!;
  return f.kind === 'int' ? { look: 'slider', min: 0, max: 10 } : f.kind === 'bool' ? { look: 'switch' } : { look: 'pulldown', options: [] };
}
export const uiMin = (u: FlagUi) => (Number.isFinite(u.min) ? u.min! : 0);
export const uiMax = (u: FlagUi) => Math.max(uiMin(u) + 1, Number.isFinite(u.max) ? u.max! : 10);
export const partColor = (u: FlagUi, part: string) => u.skin?.[part]?.color || skinParts(u).find((p) => p[0] === part)?.[2] || '#888888';

// 불러온 값 정리 (normalizeFlags에서)
export function normalizeUi(raw: unknown): FlagUi | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (!['level', 'slider', 'switch', 'pulldown', 'combo'].includes(r.look as string)) return undefined;
  const u: FlagUi = { look: r.look as FlagLook };
  if (['continuous', 'discrete', 'rating'].includes(r.style as string)) u.style = r.style as LevelStyle;
  if (typeof r.min === 'number' && Number.isFinite(r.min)) u.min = r.min;
  if (typeof r.max === 'number' && Number.isFinite(r.max)) u.max = r.max;
  if (Array.isArray(r.options)) u.options = r.options.filter((x): x is string => typeof x === 'string');
  if (r.skin && typeof r.skin === 'object') {
    const s: FlagUi['skin'] = {};
    for (const [k, v] of Object.entries(r.skin as Record<string, any>)) {
      if (!v || typeof v !== 'object') continue;
      const p: { color?: string; image?: string } = {};
      if (typeof v.color === 'string' && v.color) p.color = v.color;
      if (typeof v.image === 'string' && v.image) p.image = v.image;
      if (p.color || p.image) s[k] = p;
    }
    if (Object.keys(s).length) u.skin = s;
  }
  return u;
}

// 글자 플래그의 고를 값: 꼴에 적은 목록 + 대본에서 그 플래그에 넣거나 견주는 글
export function strOptions(p: Project, f: Flag): string[] {
  const out = new Set<string>(flagUi(f).options ?? []);
  const lit = (e: string) => {
    if (!exprNames(e).includes(f.name)) return;
    for (const m of e.matchAll(new RegExp(`${f.name}\\s*(?:==|!=|=)\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'g'))) out.add(m[1]);
  };
  for (const n of p.nodes) {
    for (const l of n.lines) if (l.type === 'flag') lit(l.text);
    const e = n.exit;
    if (e.type === 'menu') for (const c of e.choices) (c.condition && lit(c.condition), c.actions.forEach(lit));
    if (e.type === 'if') for (const b of e.branches) lit(b.cond);
  }
  if (typeof f.init === 'string') out.add(f.init);
  return [...out];
}

// 시험 값: 플래그 카드에서 꼴을 끌어 바꾼 값 (저장 안 함). 없으면 처음 값
export const useFlagTest = create<{ vals: Record<string, Val> }>(() => ({ vals: {} }));
export const testValue = (f: Flag, vals: Record<string, Val>): Val => (f.id in vals ? vals[f.id] : (f.init as Val));
export function testVars(p: Project, vals: Record<string, Val>): Vars {
  const v = initVars(p);
  for (const f of p.variables) if (f.id in vals) v[f.name] = vals[f.id];
  return v;
}

// 그 값일 때 대본: 이 플래그를 보는 조건(선택지 보임/숨음, 조건 분기 갈래)과 바꾸는 식(바꾼 뒤 값)
export type Effect =
  | { at: 'choice'; nodeId: string; text: string; expr: string; ok: boolean | null }
  | { at: 'branch'; nodeId: string; expr: string; ok: boolean | null; say: string }
  | { at: 'act'; nodeId: string; where: string; expr: string; after: string };

const truth = (v: unknown) => (v === UNKNOWN ? null : !!v);
const show = (v: unknown) => (v === UNKNOWN ? '?' : v === true ? '켜짐' : v === false ? '꺼짐' : typeof v === 'string' ? `"${v}"` : String(v));

// 상자의 첫 대사 (조건 분기 갈래가 가는 곳 미리보기)
function firstSay(p: Project, id: string | null): string {
  const n = id ? p.nodes.find((x) => x.id === id) : null;
  if (!n) return '';
  const l = n.lines.find((x) => x.type === 'say' || x.type === 'narration');
  if (!l) return n.title;
  const who = l.type === 'say' ? p.characters.find((c) => c.id === l.who)?.name : '';
  return (who ? who + ': ' : '') + l.text;
}

export function flagEffects(p: Project, f: Flag, vars: Vars): Effect[] {
  const out: Effect[] = [];
  const reads = (e: string | null | undefined) => !!e && exprNames(e).includes(f.name);
  const writes = (a: string) => parseAction(a)?.name === f.name;
  const after = (a: string) => show(applyAction(a, { ...vars })?.value);
  for (const n of p.nodes) {
    for (const l of n.lines) if (l.type === 'flag' && writes(l.text)) out.push({ at: 'act', nodeId: n.id, where: '바꾸기 줄', expr: l.text, after: after(l.text) });
    const e = n.exit;
    if (e.type === 'menu')
      for (const c of e.choices) {
        if (reads(c.condition)) out.push({ at: 'choice', nodeId: n.id, text: c.text, expr: c.condition!, ok: truth(evalExpr(c.condition!, vars)) });
        for (const a of c.actions) if (writes(a)) out.push({ at: 'act', nodeId: n.id, where: `"${c.text}" 고르면`, expr: a, after: after(a) });
      }
    if (e.type === 'if' && e.branches.some((b) => reads(b.cond))) {
      // 앞 갈래부터 맞는 것 하나만 감
      let taken = false;
      for (const b of e.branches) {
        const ok = taken ? false : truth(evalExpr(b.cond, vars));
        if (ok) taken = true;
        if (reads(b.cond)) out.push({ at: 'branch', nodeId: n.id, expr: b.cond, ok, say: firstSay(p, b.target) });
      }
    }
  }
  return out;
}

// ── 조건 눈금 (2단계): 숫자 꼴 위에 그 플래그를 견주는 조건을 Steps처럼 표시. 끌면 조건식의 기준 값을 고침 ──
export interface MarkRef { nodeId: string; at: 'choice' | 'branch'; id: string; clause: number }
export interface Mark { value: number; op: CmpOp; label: string; text: string; ok: boolean; open: boolean | null; ref: MarkRef }
const SYM: Record<string, string> = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '=', '!=': '≠' };
const cmp = (op: CmpOp, a: number, b: number) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : op === '==' ? a === b : op === '!=' ? a !== b : false);

export function flagMarks(p: Project, f: Flag, vars: Vars): Mark[] {
  if (f.kind !== 'int') return [];
  const out: Mark[] = [];
  const v = typeof vars[f.name] === 'number' ? (vars[f.name] as number) : 0;
  const scan = (cond: string | null, ref: Omit<MarkRef, 'clause'>, text: string) => {
    if (!cond) return;
    const c = parseCond(cond);
    if (!c) return;
    c.clauses.forEach((k, i) => {
      if (k.name !== f.name || !(k.op in SYM)) return;
      const n = parseFloat(k.value);
      if (!Number.isFinite(n)) return;
      out.push({ value: n, op: k.op, label: `${SYM[k.op]} ${k.value}`, text, ok: cmp(k.op, v, n), open: truth(evalExpr(cond, vars)), ref: { ...ref, clause: i } });
    });
  };
  for (const n of p.nodes) {
    const e = n.exit;
    if (e.type === 'menu') for (const c of e.choices) scan(c.condition, { nodeId: n.id, at: 'choice', id: c.id }, c.text || '(빈 선택지)');
    if (e.type === 'if') for (const b of e.branches) scan(b.cond, { nodeId: n.id, at: 'branch', id: b.id }, firstSay(p, b.target) || '(이을 상자 없음)');
  }
  return out; // 차례는 대본 차례 그대로 (끄는 동안 값이 바뀌어도 눈금 번호가 섞이지 않게)
}

// 눈금을 끌어 기준 값을 바꿈 (update 안에서)
export function setMarkValue(p: Project, r: MarkRef, value: number) {
  const n = p.nodes.find((x) => x.id === r.nodeId);
  if (!n) return;
  const e = n.exit;
  const hold = r.at === 'choice' ? (e.type === 'menu' ? e.choices.find((c) => c.id === r.id) : undefined) : e.type === 'if' ? e.branches.find((b) => b.id === r.id) : undefined;
  if (!hold) return;
  const src = 'condition' in hold ? hold.condition : hold.cond;
  const c = src ? parseCond(src) : null;
  if (!c || !c.clauses[r.clause]) return;
  c.clauses[r.clause].value = String(Math.round(value));
  if ('condition' in hold) hold.condition = condText(c);
  else hold.cond = condText(c);
}

// ── 판단 인스펙터 (2단계): ◇ 조건 분기 상자마다 숫자 플래그로 갈래를 나누는 판단. 종류별로 더함 ──
export type JudgeKind = 'all' | 'any' | 'sum' | 'top';
export const JUDGE_LABEL: Record<JudgeKind, string> = { all: '모두 넉넉하면', any: '하나라도 넉넉하면', sum: '합이 넉넉하면', top: '가장 큰 값이면' };
export const JUDGE_HINT: Record<JudgeKind, string> = {
  all: '고른 플래그가 모두 기준 이상일 때 (love >= 2 and trust >= 2)',
  any: '고른 플래그 가운데 하나라도 기준 이상일 때 (love >= 2 or trust >= 2)',
  sum: '고른 플래그를 더한 값이 기준 이상일 때 (love + trust >= 4)',
  top: '첫 플래그가 나머지보다 크거나 같을 때 (love >= trust)',
};
export function judgeCond(kind: JudgeKind, names: string[], at: number): string {
  if (!names.length) return '';
  if (kind === 'all' || kind === 'any') return names.map((n) => `${n} >= ${at}`).join(kind === 'all' ? ' and ' : ' or ');
  if (kind === 'sum') return `${names.join(' + ')} >= ${at}`;
  const [a, ...rest] = names;
  return rest.length ? rest.map((n) => `${a} >= ${n}`).join(' and ') : `${a} >= ${at}`;
}

// 숫자 플래그를 보는 ◇ 조건 분기 상자
export function judgeBoxes(p: Project): { nodeId: string; flags: Flag[] }[] {
  const nums = p.variables.filter((f) => f.kind === 'int');
  const out: { nodeId: string; flags: Flag[] }[] = [];
  for (const n of p.nodes) {
    if (n.exit.type !== 'if') continue;
    const used = new Set(n.exit.branches.flatMap((b) => exprNames(b.cond)));
    const fl = nums.filter((f) => used.has(f.name));
    if (fl.length) out.push({ nodeId: n.id, flags: fl });
  }
  return out;
}

// 조건 분기에서 지금 값으로 가는 갈래 (앞 갈래부터 하나, 없으면 그 밖)
export function takenBranch(p: Project, nodeId: string, vars: Vars): string | 'else' | null {
  const e = p.nodes.find((n) => n.id === nodeId)?.exit;
  if (!e || e.type !== 'if') return null;
  for (const b of e.branches) {
    const r = truth(evalExpr(b.cond, vars));
    if (r === null) return null;
    if (r) return b.id;
  }
  return 'else';
}
export { firstSay };
