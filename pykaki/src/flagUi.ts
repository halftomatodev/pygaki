// 플래그의 꼴 (FEATURE 20): 기본값, 꾸밀 부품, 불러온 값 정리, 시험 값, 그 값일 때 대본이 어떻게 되는지
import { create } from 'zustand';
import type { Flag, FlagLook, FlagUi, LevelStyle, Project } from './types';
import { evalExpr, applyAction, initVars, UNKNOWN, type Val, type Vars } from './trace';
import { exprNames, parseAction } from './flags';

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
