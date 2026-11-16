// 플래그 설계 마법사 (2단계 "틀에서 만들기", 화면은 FlagWizard.tsx (파일 이름이 대소문자만 다르지 않게 flagWiz)): 1단계 용례(flagRecipes.ts)를 틀로
// 플래그, 선택지 "고르면", 상자 끝 ⚑ 바꾸기 줄, 선택지 보이는 조건, ◇ 조건 분기를 한 번에 넣는다.
// 화면은 고른 것을 WizPlan으로 모으고 applyPlan이 update 한 번 안에서 넣어서 실행 취소 한 번에 되돌아간다.
// 결과는 지금 있는 선택지·조건 분기·flag 줄 그대로라 저장 형식은 안 바뀐다
import type { BoxNode, Choice, FlagKind, Project } from './types';
import { condText, flagNameProblem, parseCond } from './flags';
import { FLAG_RECIPES, freeFlagName, type FlagRecipe } from './flagRecipes';
import { buildDesign } from './flagTable';
import { uid } from './util';

// 바꾸는 곳: 선택지(choices) 또는 상자 끝 줄(boxes). 보는 곳: 조건 분기(branch) 또는 선택지 보이는 조건(conds)
export interface WizShape {
  write: 'choices' | 'boxes';
  read: 'branch' | 'conds';
  threshold?: number; // 숫자 플래그의 기준 값 처음 값
  rows?: string[]; // 조건 분기 갈래 이름 (route는 값마다라 없음)
}
export const WIZ_SHAPES: Record<string, WizShape> = {
  affection: { write: 'choices', read: 'branch', threshold: 2, rows: ['좋은 끝'] },
  met_once: { write: 'boxes', read: 'branch', rows: ['다시 왔을 때'] },
  item: { write: 'choices', read: 'conds' },
  locked_choice: { write: 'choices', read: 'conds', threshold: 3 },
  route: { write: 'choices', read: 'branch' },
  ending: { write: 'choices', read: 'branch', threshold: 2, rows: ['진짜 끝', '좋은 끝'] },
};
export const WIZ_RECIPES: FlagRecipe[] = FLAG_RECIPES.filter((r) => WIZ_SHAPES[r.id]);

// 마법사가 고른 것 (화면 상태). flag 번호는 용례의 flags 차례
export interface WizState {
  recipe: string;
  names: string[]; // 플래그마다 이름 (있는 플래그와 같은 이름·종류면 그것을 씀)
  picks: { choiceId?: string; boxId?: string; flag: number; value?: string }[]; // 바꾸는 곳 (route는 value에 글자)
  readBox: string | null; // 조건 분기로 만들 상자
  readChoices: string[]; // 보이는 조건을 걸 선택지
  threshold: number;
  targets: (string | null)[]; // 조건 분기 갈래마다 갈 상자 (route는 값 차례)
  elseTarget: string | null; // 그 밖
}

export interface WizPlan {
  flags: { name: string; kind: FlagKind; init: boolean | number | string; note: string }[]; // 새로 만들 것만
  acts: { choiceId: string; act: string }[];
  lines: { boxId: string; act: string }[];
  conds: { choiceId: string; cond: string }[];
  branch?: { boxId: string; rows: { cond: string; target: string | null }[]; else: string | null };
}

const strVal = (s: string) => '"' + s.replace(/["\\]/g, '') + '"';
export const recipeOf = (id: string) => WIZ_RECIPES.find((r) => r.id === id)!;

// 선택지가 있는 곳 (상자, 선택지)
export function allChoices(p: Project): { box: BoxNode; choice: Choice }[] {
  const out: { box: BoxNode; choice: Choice }[] = [];
  for (const b of p.nodes) if (b.exit.type === 'menu') for (const c of b.exit.choices) out.push({ box: b, choice: c });
  return out;
}

// 조건 분기로 바꿀 수 있는 상자: 다음 상자로 가는 상자(그 밖 = 원래 다음), 끝나는 상자(return, 그 밖은 비움 = 지금처럼 끝),
// 이미 조건 분기인 상자(갈래를 앞에 더함). 선택지·call·화면 상자는 안 됨
export const canBranch = (b: BoxNode) => b.exit.type === 'next' || b.exit.type === 'return' || b.exit.type === 'if';

export function startState(p: Project, recipe: string, sel: string[]): WizState {
  const r = recipeOf(recipe);
  const sh = WIZ_SHAPES[recipe];
  const taken = new Set<string>();
  // 같은 이름·종류의 플래그가 있으면 그것을 씀 ([+ 추가]로 먼저 만들어 둔 것), 아니면 겹치지 않는 새 이름
  const names = r.flags.map((f) => {
    const have = p.variables.find((v) => v.name === f.name);
    if (have?.kind === f.kind && !taken.has(f.name)) return (taken.add(f.name), f.name);
    let n = freeFlagName(p, f.name);
    while (taken.has(n)) n = freeFlagName(p, n + '_x');
    taken.add(n);
    return n;
  });
  const box = p.nodes.find((b) => sel.includes(b.id) && canBranch(b)) ?? null;
  return {
    recipe,
    names,
    picks: [],
    readBox: sh.read === 'branch' && box ? box.id : null,
    readChoices: [],
    threshold: sh.threshold ?? 1,
    targets: (sh.rows ?? []).map(() => null),
    elseTarget: box?.exit.type === 'next' ? box.exit.target : null,
  };
}

// 이름 칸 검사: '' 문제 없음 (새로 만듦) | 'reuse' 있는 플래그를 씀 | 그 밖은 문제 글
export function nameCheck(p: Project, s: WizState, i: number): string {
  const r = recipeOf(s.recipe);
  const n = s.names[i].trim();
  if (s.names.some((x, j) => j !== i && x.trim() === n)) return '두 플래그 이름이 같아요';
  const have = p.variables.find((v) => v.name === n);
  if (have) return have.kind === r.flags[i].kind ? 'reuse' : '같은 이름의 플래그가 종류가 달라요';
  return flagNameProblem(p, n);
}

// route: 고른 선택지들의 값 (차례대로, 겹치지 않게)
export const routeValues = (s: WizState) => [...new Set(s.picks.map((x) => (x.value ?? '').trim()).filter(Boolean))];

// 단계마다 넘어가지 못하는 까닭 ('' = 됨). 단계: 1 플래그, 2 바꾸는 곳, 3 보는 곳
export function stepProblem(p: Project, s: WizState, step: number): string {
  const sh = WIZ_SHAPES[s.recipe];
  if (step === 1) {
    for (let i = 0; i < s.names.length; i++) {
      const w = nameCheck(p, s, i);
      if (w && w !== 'reuse') return w;
    }
  }
  if (step === 2) {
    const r = recipeOf(s.recipe);
    for (let i = 0; i < r.flags.length; i++)
      if (!s.picks.some((x) => x.flag === i)) return r.flags.length > 1 ? `${s.names[i]}을(를) 바꾸는 곳을 골라요` : sh.write === 'boxes' ? '바꾸는 상자를 골라요' : '바꾸는 선택지를 골라요';
    if (s.recipe === 'route' && s.picks.some((x) => !(x.value ?? '').trim())) return '고른 선택지마다 기억할 글자를 적어요';
  }
  if (step === 3) {
    if (sh.read === 'branch' && !s.readBox) return '갈라질 상자를 골라요';
    if (sh.read === 'conds' && !s.readChoices.length) return '조건을 걸 선택지를 골라요';
  }
  return '';
}

// 조건 둘을 "그리고"로 (읽을 수 있으면 조각을 이어서, 아니면 괄호)
export function andCond(old: string | null | undefined, add: string) {
  if (!old?.trim()) return add;
  const a = parseCond(old), b = parseCond(add);
  if (a && b && (a.join === 'and' || a.clauses.length === 1) && (b.join === 'and' || b.clauses.length === 1)) return condText({ join: 'and', clauses: [...a.clauses, ...b.clauses] });
  return `(${old.trim()}) and ${add}`;
}

export function makePlan(p: Project, s: WizState): WizPlan {
  const r = recipeOf(s.recipe);
  const sh = WIZ_SHAPES[s.recipe];
  const n = s.names.map((x) => x.trim());
  const flags = r.flags.flatMap((f, i) => (nameCheck(p, s, i) === 'reuse' ? [] : [{ name: n[i], kind: f.kind, init: f.init, note: f.note }]));
  const actOf = (i: number, value?: string) => {
    const k = r.flags[i].kind;
    return k === 'int' ? `${n[i]} += 1` : k === 'bool' ? `${n[i]} = True` : `${n[i]} = ${strVal(value ?? '')}`;
  };
  const plan: WizPlan = { flags, acts: [], lines: [], conds: [] };
  for (const x of s.picks) {
    if (x.choiceId) plan.acts.push({ choiceId: x.choiceId, act: actOf(x.flag, x.value) });
    if (x.boxId) plan.lines.push({ boxId: x.boxId, act: actOf(x.flag) });
  }
  const t = s.threshold;
  const want = r.flags[0].kind === 'int' ? `${n[0]} >= ${t}` : n[0];
  if (sh.read === 'conds') for (const c of s.readChoices) plan.conds.push({ choiceId: c, cond: want });
  if (sh.read === 'branch' && s.readBox) {
    let rows: { cond: string; target: string | null }[];
    if (s.recipe === 'route') rows = routeValues(s).map((v, i) => ({ cond: `${n[0]} == ${strVal(v)}`, target: s.targets[i] ?? null }));
    else if (s.recipe === 'ending') rows = [{ cond: `${n[0]} >= ${t} and ${n[1]} >= ${t}`, target: s.targets[0] ?? null }, { cond: `${n[0]} >= ${t}`, target: s.targets[1] ?? null }];
    else rows = [{ cond: want, target: s.targets[0] ?? null }];
    plan.branch = { boxId: s.readBox, rows, else: s.elseTarget };
  }
  return plan;
}

// 한 번에 넣는다 (store.update 안에서). 손댄 상자 id를 돌려줌
export function applyPlan(p: Project, plan: WizPlan): string[] {
  const touched = new Set<string>();
  for (const f of plan.flags) p.variables.push({ id: uid('v'), name: f.name, kind: f.kind, init: f.init, ...(f.note ? { note: f.note } : {}) });
  const choice = (id: string) => {
    for (const b of p.nodes)
      if (b.exit.type === 'menu') {
        const c = b.exit.choices.find((x) => x.id === id);
        if (c) return (touched.add(b.id), c);
      }
    return undefined;
  };
  for (const a of plan.acts) {
    const c = choice(a.choiceId);
    if (c && !c.actions.includes(a.act)) c.actions.push(a.act);
  }
  for (const c of plan.conds) {
    const x = choice(c.choiceId);
    if (x) x.condition = andCond(x.condition, c.cond);
  }
  for (const l of plan.lines) {
    const b = p.nodes.find((x) => x.id === l.boxId);
    if (b) {
      b.lines.push({ id: uid('l'), type: 'flag', text: l.act });
      touched.add(b.id);
    }
  }
  const br = plan.branch;
  const b = br && p.nodes.find((x) => x.id === br.boxId);
  if (br && b) {
    const rows = br.rows.map((x) => ({ id: uid('b'), cond: x.cond, target: x.target }));
    if (b.exit.type === 'if') b.exit.branches = [...rows, ...b.exit.branches];
    else b.exit = { type: 'if', branches: rows, else: br.else };
    touched.add(b.id);
  }
  return [...touched];
}

// 만들기 전에 미리: 넣은 뒤의 표에서 노란 표시가 생기는지 (늘 참/거짓, 바꾸기만 등)
export function planWarnings(p: Project, plan: WizPlan, names: string[]): string[] {
  const q = structuredClone(p);
  applyPlan(q, plan);
  const d = buildDesign(q, true);
  const out: string[] = [];
  for (const n of names) for (const w of d.notes.get(n) ?? []) out.push(`${n}: ${w}`);
  for (const [k, w] of d.cellNotes) {
    const [n] = k.split('\n');
    if (names.includes(n)) out.push(w);
  }
  return [...new Set(out)];
}
