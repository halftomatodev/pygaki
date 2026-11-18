// 화면 만들기 (FEATURE 17): 화면 목록(project.screens) → game/pykaki_screens.rpy, 흐름 "화면 부르기"의 갈래 맞추기
import type { BoxNode, Flag, Project, ScreenAnchor, ScreenDef, ScreenItem } from './types';
import { addFixup } from './store';
import { IDENT, RESERVED, uid } from './util';
import { parseAction } from './flags';
import { cornerOf, flagUi, partColor, partImage, statePart, strOptions, uiMax, uiMin } from './flagUi';
import { isMaskName, isMovieFile } from './stage';

// HUD (FEATURE 18): 대사가 흐르는 동안 떠 있는 화면. 없으면 전체 화면 (call screen)
export const isHud = (s?: ScreenDef | null) => s?.kind === 'hud';
export const isBtnKind = (k: ScreenItem['kind']) => k === 'imagebutton' || k === 'textbutton';
// 누르거나 놓으면 할 일이 있는 항목: 버튼과 놓는 곳 (FEATURE 19)
export const hasAct = (k: ScreenItem['kind']) => isBtnKind(k) || k === 'drop';
// 끌어 놓기 (FEATURE 19): 글·그림만 끌 수 있음
export const canDrag = (k: ScreenItem['kind']) => k === 'text' || k === 'image';
export const isDragged = (it: ScreenItem) => !!it.drag && canDrag(it.kind);
export const DROP_W = 160;
export const DROP_H = 100;
// 버튼을 누르면: HUD는 값을 돌려줄 수 없어서 처음은 플래그 바꾸기
export const actOf = (s: ScreenDef | undefined, it: ScreenItem) => it.act ?? (isHud(s) ? 'flag' : 'return');
export const HUD_W = 420;
export const HUD_H = 160;
export const hudSize = (s: ScreenDef) => ({ w: s.w ?? HUD_W, h: s.h ?? HUD_H });
// 스크롤 (FEATURE 23): HUD 안쪽 크기가 HUD보다 크면 그 크기, 아니면 null
export function hudInner(s: ScreenDef): { cw: number; ch: number } | null {
  if (!isHud(s) || (s.cw === undefined && s.ch === undefined)) return null;
  const { w, h } = hudSize(s);
  const cw = Math.max(w, Math.round(s.cw ?? w)), ch = Math.max(h, Math.round(s.ch ?? h));
  return cw > w || ch > h ? { cw, ch } : null;
}
export const BAR_W = 300;
export const BAR_H = 24;
// 9칸 붙이기: [이름, 가로 0~1, 세로 0~1]
export const ANCHORS: [ScreenAnchor, string, number, number][] = [
  ['tl', '왼쪽 위', 0, 0], ['t', '위 가운데', 0.5, 0], ['tr', '오른쪽 위', 1, 0],
  ['l', '왼쪽 가운데', 0, 0.5], ['c', '가운데', 0.5, 0.5], ['r', '오른쪽 가운데', 1, 0.5],
  ['bl', '왼쪽 아래', 0, 1], ['b', '아래 가운데', 0.5, 1], ['br', '오른쪽 아래', 1, 1],
];
export const anchorOf = (s: ScreenDef) => ANCHORS.find((a) => a[0] === (s.anchor ?? 'tl')) ?? ANCHORS[0];
// 게임 화면 안에서 HUD 왼쪽 위 (px)
export function hudPos(s: ScreenDef, W: number, H: number) {
  const { w, h } = hudSize(s);
  const [, , ax, ay] = anchorOf(s);
  return { x: Math.round((W - w) * ax) + (s.dx ?? 0), y: Math.round((H - h) * ay) + (s.dy ?? 0), w, h };
}

export const SCREENS_FILE = 'pykaki_screens.rpy';
// 게임 안 편집 화면의 [화면] 탭이 읽는 화면 자리 (개발용, 배포판에서 뺌. LINK.md 12장)
export const SCREENS_META_FILE = 'pykaki_screens.json';
// 원고 표시: screen 줄 끝 "# @s:화면 id", 항목 첫 줄 끝 "# @i:항목 id". 게임 안 편집 화면이 저장할 때 이 줄을 찾아 고친다
let marks = true;
const mark = (out: string[], tag: string) => {
  if (marks && out.length) out[0] += `  # @${tag}`;
  return out;
};

// [화면] 탭이 쓰는 화면 자리 (LINK.md 12장). 글 크기를 모르는 항목은 w·h 없이 (게임이 그려 보고 잼)
export function screensMeta(p: Project): string {
  const screens = (p.screens ?? []).filter((s) => IDENT.test(s.name)).map((s) => {
    const hud = isHud(s);
    const { w, h } = hudSize(s);
    const inner = hudInner(s);
    return {
      id: s.id, name: s.name, title: s.title || s.name, kind: hud ? 'hud' : 'full',
      ...(hud ? { w, h, anchor: s.anchor ?? 'tl', dx: s.dx ?? 0, dy: s.dy ?? 0 } : {}),
      ...(inner ? { cw: inner.cw, ch: inner.ch } : {}),
      ...(s.bg ? { bg: s.bg, bgAlpha: s.bgAlpha ?? 100 } : {}),
      items: s.items.map((it) => {
        const o: Record<string, unknown> = { id: it.id, kind: it.kind, x: Math.round(it.x), y: Math.round(it.y) };
        if (it.kind === 'text' || it.kind === 'textbutton' || it.kind === 'drop') o.text = it.text ?? '';
        if (it.size) o.size = it.size;
        if (it.color) o.color = it.color;
        if (it.kind === 'image' || it.kind === 'imagebutton') o.image = it.image ?? '';
        if (it.kind === 'bar') ((o.w = Math.round(it.w ?? BAR_W)), (o.h = Math.round(it.h ?? BAR_H)), (o.flag = it.flag ?? ''));
        if (it.kind === 'drop') ((o.w = Math.round(it.w ?? DROP_W)), (o.h = Math.round(it.h ?? DROP_H)));
        if (it.kind === 'look') {
          const [lw, lh] = lookSize(p, it);
          ((o.w = lw), (o.h = lh), (o.flag = it.flag ?? ''));
        }
        if (isDragged(it)) o.drag = true;
        return o;
      }),
    };
  });
  return JSON.stringify({ format: 'pygaki-screens', version: 1, screens }, null, 1) + '\n';
}

// 게임 안 편집 화면에서 고친 화면 (LINK.md 3장 screen, screen_item). p를 직접 고친다. 못 찾으면 false
export function applyScreenOp(p: Project, op: { op: string; screen?: string; item?: string; set?: Record<string, unknown> }): boolean {
  const s = p.screens?.find((x) => x.id === op.screen);
  const set = op.set ?? {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : undefined);
  if (!s) return false;
  if (op.op === 'screen') {
    if (!isHud(s)) return false;
    if (typeof set.anchor === 'string' && ANCHORS.some(([k]) => k === set.anchor)) set.anchor === 'tl' ? delete s.anchor : (s.anchor = set.anchor as ScreenAnchor);
    for (const k of ['dx', 'dy'] as const) if (num(set[k]) !== undefined) (num(set[k]) ? (s[k] = num(set[k])) : delete s[k]);
    for (const k of ['w', 'h'] as const) if (num(set[k]) !== undefined) s[k] = Math.max(20, num(set[k])!);
    return true;
  }
  const it = s.items.find((x) => x.id === op.item);
  if (!it) return false;
  if (num(set.x) !== undefined) it.x = num(set.x)!;
  if (num(set.y) !== undefined) it.y = num(set.y)!;
  if (typeof set.text === 'string' && (it.kind === 'text' || it.kind === 'textbutton' || it.kind === 'drop')) it.text = set.text;
  return true;
}

// 버튼이 돌려주는 값들 (차례대로, 겹치는 값은 하나)
export function screenValues(s: ScreenDef | undefined): string[] {
  const out: string[] = [];
  for (const it of s?.items ?? []) {
    const v = it.value?.trim();
    if (hasAct(it.kind) && actOf(s, it) === 'return' && v && !out.includes(v)) out.push(v);
  }
  return out;
}

// "화면 부르기" 흐름의 갈래를 그 화면의 버튼 값에 맞춘다. 같은 값의 갈래는 선을 그대로 둔다
export function syncOuts(p: Project, b: BoxNode) {
  if (b.exit.type !== 'screen') return;
  const e = b.exit;
  const sc = p.screens?.find((s) => s.id === e.screen);
  const vals = isHud(sc) ? [] : screenValues(sc);
  if (vals.length === e.outs.length && vals.every((v, i) => e.outs[i].value === v)) return;
  e.outs = vals.map((value) => e.outs.find((o) => o.value === value) ?? { id: uid('o'), value, target: null });
}

addFixup((p) => {
  for (const b of p.nodes) if (b.exit.type === 'screen') syncOuts(p, b);
});

export function normalizeScreens(raw: unknown): ScreenDef[] | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined;
  return raw
    .filter((s) => s && typeof s.id === 'string')
    .map((s) => ({
      ...s,
      name: typeof s.name === 'string' ? s.name : 'screen_' + s.id,
      title: typeof s.title === 'string' ? s.title : '',
      items: Array.isArray(s.items) ? s.items.filter((it: ScreenItem) => it && typeof it.id === 'string').map((it: ScreenItem) => ({ ...it, x: Number(it.x) || 0, y: Number(it.y) || 0, ...(it.acts !== undefined ? { acts: Array.isArray(it.acts) ? it.acts.filter((a) => typeof a === 'string') : [] } : {}) })) : [],
    }));
}

export function newScreenName(p: Project) {
  let i = (p.screens?.length ?? 0) + 1;
  while (p.screens?.some((s) => s.name === 'pk_screen_' + i)) i++;
  return 'pk_screen_' + i;
}

// 렌파이에 원래 있는 screen 이름 (덮으면 게임 화면이 바뀜)
const RENPY_SCREENS = new Set(['say', 'input', 'choice', 'quick_menu', 'navigation', 'main_menu', 'game_menu', 'about', 'save', 'load', 'file_slots', 'preferences', 'history', 'help', 'confirm', 'skip_indicator', 'notify', 'nvl', 'bubble', 'keyboard_help', 'mouse_help', 'gamepad_help']);

export function screenNameProblem(p: Project, s: ScreenDef) {
  if (!s.name) return '이름이 비어 있어요';
  if (!IDENT.test(s.name)) return '영문·숫자·_만 쓰고, 숫자로 시작할 수 없어요';
  if (RESERVED.has(s.name)) return '렌파이가 쓰는 이름이에요';
  if (RENPY_SCREENS.has(s.name)) return '렌파이 기본 화면 이름이라 게임 화면이 바뀌어요';
  if (p.screens?.some((x) => x.id !== s.id && x.name === s.name)) return '같은 이름의 화면이 있어요';
  if (p.labels.some((g) => g.name === s.name)) return 'label 이름과 겹쳐요';
  return '';
}

const py = (s: string) => JSON.stringify(s);
const isColor = (s?: string) => !!s && /^#[0-9a-f]{3,8}$/i.test(s);

// 그림 이름 칸: "bg room" 같은 렌파이 그림 이름, 또는 game 기준 파일 경로(images/x.png)
const imgRef = (s: string) => py(s.trim());
// 꼴 부품 그림·영상 (FEATURE 29): 그림 이름이나 game 기준 파일 경로. 영상은 Movie(반복, 소리 없음. mask_ 이름은 투명 영상 side_mask)로.
// pw가 'None'이고 aspect면 높이만 맞추고 비율은 그대로 (끝 장식)
function mediaCode(v: string, pw: number | string, ph: number | string, aspect = false): string {
  const t = v.trim().replace(/\\/g, '/');
  const d = isMovieFile(t) ? `Movie(play=${py(t)}, loop=True${isMaskName(t) ? ', side_mask=True' : ''})` : py(t);
  return aspect ? `Transform(${d}, ysize=${ph}, fit="contain")` : `Transform(${d}, xysize=(${pw}, ${ph}))`;
}

// 상자 id → 렌파이 label 이름 (label 첫 상자는 label 이름, 나머지는 label.상자)
export function boxRef(p: Project, id: string | null | undefined): string | null {
  const b = id ? p.nodes.find((n) => n.id === id) : undefined;
  const g = b && p.labels.find((l) => l.id === b.group);
  if (!b || !g) return null;
  return g.entry === b.id ? g.name : `${g.name}.${b.id}`;
}

// 플래그 바꾸기 식 하나 → 렌파이 화면 동작. 못 바꾸면 null
export function flagAction(src: string): string | null {
  const a = parseAction(src.replace(/^\s*\$\s*/, ''));
  if (!a || !a.value) return null;
  const n = py(a.name);
  const num = /^-?\d+(\.\d+)?$/.test(a.value) ? Number(a.value) : null;
  if (a.op === '=') return a.value === `not ${a.name}` ? `ToggleVariable(${n})` : `SetVariable(${n}, ${a.value})`;
  if (num !== null) return `IncrementVariable(${n}, ${a.op === '-=' ? -num : num})`;
  return `SetVariable(${n}, ${a.name} ${a.op === '-=' ? '-' : '+'} (${a.value}))`;
}

// 버튼의 action 글
export function actionCode(p: Project, s: ScreenDef, it: ScreenItem): string {
  const act = actOf(s, it);
  if (act === 'return') return isHud(s) ? 'NullAction()' : `Return(${py(it.value?.trim() || '')})`;
  if (act === 'jump') {
    const r = boxRef(p, it.target);
    return r ? `Jump(${py(r)})` : 'NullAction()';
  }
  if (act === 'toggle') {
    const o = p.screens?.find((x) => x.id === it.screen);
    return o ? `ToggleScreen(${py(o.name)})` : 'NullAction()';
  }
  const list = (it.acts ?? []).map(flagAction).filter((x): x is string => !!x);
  return !list.length ? 'NullAction()' : list.length === 1 ? list[0] : `[${list.join(', ')}]`;
}

const pct = (n: number) => String(Math.round(Math.max(0, Math.min(100, n))) / 100);

function itemCode(p: Project, s: ScreenDef, it: ScreenItem, I0: string): string[] {
  const I = '    ';
  const pos = `${I}pos (${Math.round(it.x)}, ${Math.round(it.y)})`;
  const act = `${I}action ${actionCode(p, s, it)}`;
  let out: string[] = [];
  if (it.kind === 'image') out = it.image?.trim() ? [`add ${imgRef(it.image)}:`, pos] : [];
  else if (it.kind === 'text') {
    out = [`text ${py(it.text ?? '')}:`, pos];
    if (it.size) out.push(`${I}size ${it.size}`);
    if (it.color) out.push(`${I}color ${py(it.color)}`);
  } else if (it.kind === 'bar') {
    if (!it.flag || !IDENT.test(it.flag)) return [];
    out = ['bar:', `${I}value AnimatedValue(${it.flag}, ${it.max && it.max > 0 ? it.max : 10}, 0.3)`, pos, `${I}xysize (${Math.round(it.w ?? BAR_W)}, ${Math.round(it.h ?? BAR_H)})`];
    out.push(`${I}left_bar Solid(${py(isColor(it.color) ? it.color! : '#e0607a')})`, `${I}right_bar Solid(${py(isColor(it.bgColor) ? it.bgColor! : '#00000080')})`, `${I}thumb None`);
  } else if (it.kind === 'look') {
    out = lookCode(p, it);
    if (!out.length) return [];
    out.splice(1, 0, pos);
  } else if (it.kind === 'imagebutton') {
    if (!it.image?.trim()) return [];
    out = ['imagebutton:', `${I}idle ${imgRef(it.image)}`];
    if (it.hover?.trim()) out.push(`${I}hover ${imgRef(it.hover)}`);
    out.push(pos, act);
  } else {
    out = [`textbutton ${py(it.text ?? '')}:`, pos];
    if (it.size) out.push(`${I}text_size ${it.size}`);
    if (it.color) out.push(`${I}text_color ${py(it.color)}`);
    if (it.hoverColor) out.push(`${I}text_hover_color ${py(it.hoverColor)}`);
    out.push(act);
  }
  return withCond(it, mark(out, 'i:' + it.id), I0);
}

// 플래그 꼴 (FEATURE 21): 플래그 카드의 꼴과 꾸미기를 렌파이 화면 언어로. 첫 줄은 맨 바깥 칸(뒤에 pos가 들어감)
export const LOOK_SIZE: Record<string, [number, number]> = { level: [240, 22], rating: [220, 30], switch: [64, 32], checkbox: [32, 32], radio: [200, 32], pulldown: [200, 40] };
const RADIO_ROW = 32; // 라디오 한 줄 높이 (처음 크기는 고를 값 수만큼)
export function lookSize(p: Project, it: ScreenItem): [number, number] {
  const f = p.variables.find((v) => v.name === it.flag);
  const u = f ? flagUi(f) : null;
  const d = LOOK_SIZE[u ? (u.look === 'level' && u.style === 'rating' ? 'rating' : u.look) : 'level'];
  const dh = u?.look === 'radio' && f ? RADIO_ROW * Math.max(1, strOptions(p, f).filter((o) => o !== '').length) : d[1];
  return [Math.round(it.w ?? d[0]), Math.round(it.h ?? dh)];
}
export function lookCode(p: Project, it: ScreenItem): string[] {
  const f = p.variables.find((v) => v.name === it.flag);
  if (!f || !IDENT.test(f.name)) return [];
  const u = flagUi(f);
  const I = '    ';
  const [w, h] = lookSize(p, it);
  const edit = !!it.edit; // FEATURE 22: 게임에서 꼴로 값 바꾸기
  // 모서리 (FEATURE 23): 각지게 0, 알약 높이의 반, 둥글게(없을 때) 높이의 1/4(8px까지). 둥근 색 부품은 _pk_round(셰이더)로 깎음
  const cn = cornerOf(u);
  const rad = (ph: number) => (cn === 'square' ? 0 : cn === 'pill' ? ph / 2 : Math.min(ph / 4, 8));
  const pillR = (ph: number) => (cn === 'square' ? 0 : ph / 2); // 슬라이더 트랙·스위치는 둥글게도 알약 (앱 꼴과 같게)
  const roundOf = (d: string, r: number) => (r > 0.5 ? `_pk_round(${d}, ${+r.toFixed(1)})` : d);
  // 부품: 그림·영상이 있으면 그것(늘여 맞춤), 없으면 색
  const part = (k: string, pw: number | string, ph: number | string, r = 0) => {
    const img = partImage(u, k);
    return img ? mediaCode(img, pw, ph) : roundOf(`Solid(${py(partColor(u, k))}, xysize=(${pw}, ${ph}))`, r);
  };
  // 경고·위험 (FEATURE 29): 단계마다 채움 부품. 제 것이 없고 정상 채움이 그림이면 그 그림의 색조만 바꿈 (앱 SHIFT_CSS와 비슷하게)
  const SHIFT = ['', 'HueMatrix(45) * SaturationMatrix(1.3)', 'HueMatrix(-35) * SaturationMatrix(1.8) * BrightnessMatrix(-0.1)'];
  const stateCode = (base: 'fill' | 'on', pw: number | string, ph: number | string, r = 0, zero?: string) => {
    const one = (s: 0 | 1 | 2) => {
      const sp = statePart(u, base, s);
      const d = zero && sp.part === base ? zero : part(sp.part, pw, ph, r);
      return sp.shift ? `Transform(${d}, matrixcolor=${SHIFT[sp.shift]})` : d;
    };
    const cmp = u.dir === 'high' ? '>=' : '<=';
    const c = (t?: number) => (t === undefined ? '' : `${n} ${cmp} ${t}`);
    let out = one(0);
    if (u.warn !== undefined) out = `(${one(1)} if ${c(u.warn)} else ${out})`;
    if (u.crit !== undefined) out = `(${one(2)} if ${c(u.crit)} else ${out})`;
    return out;
  };
  // 프레임: 그림이면 9-slice(Frame) 또는 늘인 그림·영상, 아니면 둥근 색
  const frameCode = (pw: number, ph: number) => {
    const img = partImage(u, 'border');
    return img && u.slice && !isMovieFile(img) ? `Transform(Frame(${imgRef(img)}, ${u.slice}, ${u.slice}), xysize=(${pw}, ${ph}))` : part('border', pw, ph, rad(ph));
  };
  // 올리거나 키보드로 고르면(렌파이는 둘 다 hover) 살짝 밝게. 모서리도 맞춤
  const LIT = '"#ffffff30"';
  const litFg = (r: number) => roundOf(`Solid(${LIT})`, r);
  const lit = (d: string, pw: number | string, ph: number | string, r: number) => roundOf(`Fixed(${d}, Solid(${LIT}), xysize=(${pw}, ${ph}))`, r);
  // 누르는 칸: 배경·여백 없는 button (칸 하나에 그림 하나). 올리면 살짝 밝게
  const press = (I1: string, action: string, r = 0) => [`${I1}button:`, `${I1}${I}background None`, `${I1}${I}padding (0, 0)`, `${I1}${I}hover_foreground ${litFg(r)}`, `${I1}${I}action ${action}`];
  const lo = uiMin(u), hi = uiMax(u), n = f.name;
  // 칸·별 i를 누르면 그 칸까지 찬 값. 첫 칸이 이미 그 값이면 최솟값으로 (모두 비우기)
  const stepSet = (count: number) => {
    const t = `${lo} + ((i + 1) * ${hi - lo} + ${count - 1}) // ${count}`;
    return `SetVariable(${py(n)}, (${lo} if i == 0 and ${n} == ${t} else ${t}))`;
  };
  if (f.kind === 'int' && u.look === 'level' && u.style === 'rating') {
    // 칸형 (FEATURE 29): 칸마다 빈칸 위에 채움을 그 칸 몫만큼 잘라 덮음 (한 칸이 여러 값이면 반 칸도). 그림이 없으면 ★ (DejaVuSans)
    const count = Math.max(1, Math.min(u.cells && u.cells > 0 ? Math.round(u.cells) : hi - lo, 20)), per = (hi - lo) / count;
    const gap = Math.max(0, u.gap ?? 2);
    const cw = Math.max(4, Math.min(h, Math.floor((w - gap * (count - 1)) / count)));
    const sym = (k: string) => `Text("★", font="DejaVuSans.ttf", size=${h}, color=${py(partColor(u, k))}, align=(0.5, 0.5))`;
    const off = partImage(u, 'off') ? part('off', cw, h) : `Fixed(${sym('off')}, xysize=(${cw}, ${h}))`;
    const one = (s: 0 | 1 | 2) => {
      const sp = statePart(u, 'on', s);
      const d = partImage(u, sp.part) ? part(sp.part, cw, h) : `Fixed(${sym(sp.part)}, xysize=(${cw}, ${h}))`;
      return sp.shift ? `Transform(${d}, matrixcolor=${SHIFT[sp.shift]})` : d;
    };
    const cmp = u.dir === 'high' ? '>=' : '<=';
    let on = one(0);
    if (u.warn !== undefined) on = `(${one(1)} if ${n} ${cmp} ${u.warn} else ${on})`;
    if (u.crit !== undefined) on = `(${one(2)} if ${n} ${cmp} ${u.crit} else ${on})`;
    const fr = `(${n} - ${lo}) / ${per} - i`;
    const cell = (I1: string) => [`${I1}fixed:`, `${I1}${I}xysize (${cw}, ${h})`, `${I1}${I}add ${off}`, `${I1}${I}if ${fr} > 0:`, `${I1}${I}${I}add Crop((0, 0, int(${cw} * min(1.0, ${fr})), ${h}), ${on})`];
    return ['hbox:', `${I}xysize (${w}, ${h})`, `${I}spacing ${gap}`, `${I}for i in range(${count}):`, ...(edit ? [...press(I + I, stepSet(count)), ...cell(I + I + I)] : cell(I + I))];
  }
  const pad = Math.max(0, u.pad ?? (u.style === 'discrete' ? 2 : 1));
  const iw = Math.max(1, w - 2 * pad), ih = Math.max(1, h - 2 * pad);
  if (f.kind === 'int' && u.look === 'level' && u.style === 'discrete') {
    const count = Math.min(hi - lo, 20);
    const seg = `(${iw} - ${count - 1} * 2) // ${count}`;
    const sr = cn === 'square' ? 0 : cn === 'pill' ? ih / 2 : 1;
    const cell = `add (${stateCode('fill', seg, ih, sr)} if (${n} - ${lo}) * ${count} >= (i + 1) * ${hi - lo} else ${part('track', seg, ih, sr)})`;
    return ['fixed:', `${I}xysize (${w}, ${h})`, `${I}add ${frameCode(w, h)}`, `${I}hbox:`, `${I}${I}pos (${pad}, ${pad})`, `${I}${I}spacing 2`, `${I}${I}for i in range(${count}):`,
      ...(edit ? [...press(I + I + I, stepSet(count), sr), `${I}${I}${I}${I}${cell}`] : [`${I}${I}${I}${cell}`])];
  }
  if (f.kind === 'int') {
    // 이어진 막대 (FEATURE 29): 프레임 → 안쪽 여백에 bar(트랙·채움) → 끝 장식 → 광택.
    // 바꿀 수 있으면 끌어서 정수로 (VariableValue, 최솟값~최댓값). 아니면 따라가기만 (AnimatedValue)
    const v = edit ? `VariableValue(${py(n)}, min=${lo}, max=${hi}, step=1, force_step=True)` : `AnimatedValue(${n} - ${lo}, ${hi - lo}, 0.3)`;
    const ir = Math.max(0, rad(h) - pad);
    // 채움 맞춤: 자르기(없을 때, bar가 자름), 늘이기(bar_resizing), 타일(높이에 맞춘 그림을 옆으로 반복)
    const fillImg = partImage(u, 'fill');
    const tile = u.fit === 'tile' && fillImg && !isMovieFile(fillImg);
    // 타일은 정상 채움만 (경고·위험은 제 부품이나 색조만 바꾼 타일)
    const fill = stateCode('fill', iw, ih, ir, tile ? `Tile(Transform(${imgRef(fillImg)}, ysize=${ih}, fit="contain"), size=(${iw}, ${ih}))` : undefined);
    const out = ['fixed:', `${I}xysize (${w}, ${h})`, `${I}add ${frameCode(w, h)}`, `${I}fixed:`, `${I}${I}pos (${pad}, ${pad})`, `${I}${I}xysize (${iw}, ${ih})`,
      `${I}${I}bar:`, `${I}${I}${I}value ${v}`, `${I}${I}${I}xysize (${iw}, ${ih})`, `${I}${I}${I}left_bar ${fill}`, `${I}${I}${I}right_bar ${part('track', iw, ih, ir)}`];
    if (u.fit === 'stretch') {
      // 늘이기: bar가 양쪽을 제 몫 크기로 그리게 (bar_resizing). 크기를 정한 부품은 Frame(테두리 0)으로 감싸 그 몫에 늘여 맞춤
      const L = out.findIndex((x) => x.startsWith(`${I}${I}${I}left_bar `));
      out[L] = `${I}${I}${I}left_bar Frame(${fill}, 0, 0)`;
      out[L + 1] = `${I}${I}${I}right_bar Frame(${part('track', iw, ih, ir)}, 0, 0)`;
      out.push(`${I}${I}${I}bar_resizing True`);
    }
    if (edit) out.push(`${I}${I}${I}hover_left_bar ${lit(fill, iw, ih, ir)}`, `${I}${I}${I}hover_right_bar ${lit(part('track', iw, ih), iw, ih, ir)}`);
    out.push(`${I}${I}${I}thumb None`);
    const tip = partImage(u, 'tip');
    if (tip) {
      const th = Math.max(1, u.tip ?? h);
      out.push(`${I}${I}add ${mediaCode(tip, `None`, th, true)}:`, `${I}${I}${I}xpos int(${iw} * max(0.0, min(1.0, (${n} - ${lo}) / ${hi - lo})))`, `${I}${I}${I}xanchor 0.5`, `${I}${I}${I}yalign 0.5`);
    }
    const gl = partImage(u, 'gloss');
    if (gl) out.push(`${I}${I}add ${mediaCode(gl, iw, ih)}`);
    return out;
  }
  if (f.kind === 'bool' && u.look === 'checkbox') {
    // 체크박스: 테두리 + 상자, 체크되면 "체크된 상자" + 마크(그림이 없으면 ✓ 글자)
    const r = rad(h), mk = u.skin?.mark?.image?.trim();
    const off = u.skin?.box?.image?.trim() ? part('box', w, h) : `Fixed(${part('border', w, h, r)}, Transform(${part('box', w - 4, h - 4, Math.max(0, r - 2))}, pos=(2, 2)), xysize=(${w}, ${h}))`;
    const mark = mk ? `Transform(${mediaCode(mk, Math.round(w * 0.8), Math.round(h * 0.8))}, align=(0.5, 0.5))`
      : `Text("✓", font="DejaVuSans.ttf", size=${Math.round(h * 0.8)}, color=${py(partColor(u, 'mark'))}, align=(0.5, 0.5))`;
    const onD = u.skin?.box?.image?.trim() && !u.skin?.on ? off : part('on', w, h, r); // 상자 그림만 있으면 체크돼도 그 그림 (앱 꼴과 같게)
    const inner = (I1: string) => [`${I1}add (${onD} if ${n} else ${off})`, `${I1}if ${n}:`, `${I1}${I}add ${mark}`];
    if (!edit) return ['fixed:', `${I}xysize (${w}, ${h})`, ...inner(I)];
    return ['button:', `${I}xysize (${w}, ${h})`, `${I}background None`, `${I}padding (0, 0)`, `${I}hover_foreground ${litFg(r)}`, `${I}action ToggleVariable(${py(n)})`, `${I}fixed:`, ...inner(I + I)];
  }
  if (f.kind === 'str' && u.look === 'radio') {
    // 라디오: 고를 값마다 한 줄 (링 + 고르면 선택 점 + 글). 링은 그림이 없으면 둥근 색 두 겹
    const opts = strOptions(p, f).filter((o) => o !== '');
    if (!opts.length) return [];
    const rh = Math.max(12, Math.floor(h / opts.length)), k = Math.min(Math.round(rh * 0.7), 40), d = Math.round(k * 0.5);
    const ts = Math.max(12, Math.round(rh * 0.55)), tc = py(partColor(u, 'text'));
    const ring = (key: string) => (u.skin?.[key]?.image?.trim() ? part(key, k, k)
      : `Fixed(${roundOf(`Solid(${py(partColor(u, key))}, xysize=(${k}, ${k}))`, k / 2)}, Transform(${roundOf(`Solid("#ffffff", xysize=(${k - 4}, ${k - 4}))`, (k - 4) / 2)}, pos=(2, 2)), xysize=(${k}, ${k}))`);
    const dot = partImage(u, 'dot') ? mediaCode(partImage(u, 'dot'), k, k) : `Transform(${roundOf(`Solid(${py(partColor(u, 'dot'))}, xysize=(${d}, ${d}))`, d / 2)}, align=(0.5, 0.5))`;
    const onRing = ring('on');
    const out = ['vbox:', `${I}xsize ${w}`];
    for (const o of opts) {
      const sel = `${n} == ${py(o)}`;
      const row = (I1: string) => [`${I1}fixed:`, `${I1}${I}xysize (${k}, ${k})`, `${I1}${I}yalign 0.5`, `${I1}${I}add (${onRing} if ${sel} else ${ring('ring')})`, `${I1}${I}if ${sel}:`, `${I1}${I}${I}add ${dot}`,
        `${I1}text ${py(o.replace(/\[/g, '[[').replace(/\{/g, '{{'))} size ${ts} color ${tc} xpos ${k + 8} yalign 0.5`];
      if (edit) out.push(`${I}button:`, `${I}${I}xysize (${w}, ${rh})`, `${I}${I}background None`, `${I}${I}padding (0, 0)`, `${I}${I}hover_foreground ${litFg(4)}`, `${I}${I}action SetVariable(${py(n)}, ${py(o)})`, `${I}${I}fixed:`, ...row(I + I + I));
      else out.push(`${I}fixed:`, `${I}${I}xysize (${w}, ${rh})`, ...row(I + I));
    }
    return out;
  }
  if (f.kind === 'bool') {
    // 스위치: 트랙 꺼짐·켜짐, 썸(켜짐 썸이 있으면 켜졌을 때 그것)
    const k = Math.round(h * 0.8), m = Math.round((h - k) / 2);
    const thumbOn = partImage(u, 'thumbOn') || u.skin?.thumbOn?.color;
    const thumb = thumbOn ? `(${part('thumbOn', k, k, pillR(k))} if ${n} else ${part('thumb', k, k, pillR(k))})` : part('thumb', k, k, pillR(k));
    const inner = (I1: string) => [`${I1}add (${part('on', w, h, pillR(h))} if ${n} else ${part('off', w, h, pillR(h))})`, `${I1}add ${thumb}:`, `${I1}${I}xpos (${w - k - m} if ${n} else ${m})`, `${I1}${I}ypos ${m}`];
    if (!edit) return ['fixed:', `${I}xysize (${w}, ${h})`, ...inner(I)];
    return ['button:', `${I}xysize (${w}, ${h})`, `${I}background None`, `${I}padding (0, 0)`, `${I}hover_foreground ${litFg(pillR(h))}`, `${I}action ToggleVariable(${py(n)})`, `${I}fixed:`, ...inner(I + I)];
  }
  // 글자 풀다운: 값을 글로 보이는 칸. 바꿀 수 있으면 눌러서 고를 값 목록을 펼침
  const ts = Math.max(12, Math.round(h * 0.5));
  const tc = py(partColor(u, 'text'));
  const value = (I1: string) => `${I1}text "[${n}]" color ${tc} yalign 0.5 size ${ts}`;
  // 펼침 표시 ▾는 따로 (게임 글꼴에 없을 수 있어 DejaVuSans. 값 글은 게임 글꼴 그대로)
  const label = (I1: string) => [`${I1}frame:`, `${I1}${I}background ${part('box', w - 2, h - 2, Math.max(0, rad(h) - 1))}`, `${I1}${I}xfill True`, `${I1}${I}yfill True`, `${I1}${I}padding (10, 0)`,
    ...(edit ? [`${I1}${I}fixed:`, value(I1 + I + I), `${I1}${I}${I}text "▾" font "DejaVuSans.ttf" color ${tc} size ${ts} xalign 1.0 yalign 0.5`] : [value(I1 + I)])];
  if (!edit) return ['frame:', `${I}background ${part('border', w, h, rad(h))}`, `${I}padding (1, 1)`, `${I}xysize (${w}, ${h})`, ...label(I)];
  const open = '_pk_open_' + it.id.replace(/\W/g, '_');
  const opts = strOptions(p, f).filter((o) => o !== '');
  const out = ['vbox:', `${I}default ${open} = False`, `${I}spacing 2`,
    `${I}button:`, `${I}${I}background ${part('border', w, h, rad(h))}`, `${I}${I}padding (1, 1)`, `${I}${I}xysize (${w}, ${h})`, `${I}${I}hover_foreground ${litFg(rad(h))}`, `${I}${I}action ToggleScreenVariable(${py(open)})`, ...label(I + I),
    `${I}if ${open}:`, `${I}${I}frame:`, `${I}${I}${I}background ${part('border', w, 1)}`, `${I}${I}${I}padding (1, 1)`, `${I}${I}${I}xsize ${w}`, `${I}${I}${I}vbox:`, `${I}${I}${I}${I}spacing 1`];
  const I4 = I + I + I + I;
  // 올린 줄·고른 줄은 글자 색 바탕에 칸 색 글자 (뒤집기)
  const hl = `Solid(${tc})`, bc = py(partColor(u, 'box'));
  for (const o of opts)
    out.push(`${I4}textbutton ${py(o.replace(/\[/g, '[[').replace(/\{/g, '{{'))}:`, `${I4}${I}xfill True`, `${I4}${I}padding (10, 4)`, `${I4}${I}background ${part('box', w - 2, h - 2)}`, `${I4}${I}hover_background ${hl}`, `${I4}${I}selected_background ${hl}`,
      `${I4}${I}text_size ${ts}`, `${I4}${I}text_color ${tc}`, `${I4}${I}text_hover_color ${bc}`, `${I4}${I}text_selected_color ${bc}`, `${I4}${I}selected ${n} == ${py(o)}`, `${I4}${I}action [SetVariable(${py(n)}, ${py(o)}), SetScreenVariable(${py(open)}, False)]`);
  return out;
}

// 보이는 조건 (FEATURE 18)
function withCond(it: ScreenItem, out: string[], I0: string): string[] {
  if (!out.length) return out;
  if (it.cond?.trim()) return [`${I0}if ${it.cond.trim()}:`, ...out.map((x) => I0 + '    ' + x)];
  return out.map((x) => I0 + x);
}

// 끌어 놓기 (FEATURE 19): 끌 수 있는 글·그림과 놓는 곳은 렌파이 drag 하나씩. 한 화면의 것은 draggroup 하나에 모은다
// 끈 것은 놓으면 제자리로 돌아가고(_PkBack), 놓는 곳은 받는 것이 맞으면 "놓으면" 할 일을 한다(_PkDrop)
function dragCode(p: Project, s: ScreenDef, it: ScreenItem, I0: string): string[] {
  const I = '    ';
  const x = Math.round(it.x), y = Math.round(it.y);
  const out = ['drag:', `${I}drag_name ${py(it.id)}`, `${I}pos (${x}, ${y})`];
  const textLines = (I1: string) => {
    const t = [`${I1}text ${py(it.text ?? '')}:`];
    if (it.kind === 'drop') t.push(`${I1}${I}align (0.5, 0.5)`, `${I1}${I}text_align 0.5`);
    if (it.size) t.push(`${I1}${I}size ${it.size}`);
    if (it.color) t.push(`${I1}${I}color ${py(it.color)}`);
    return t;
  };
  if (it.kind === 'drop') {
    const acc = s.items.find((o) => o.id === it.accept && isDragged(o));
    out.push(`${I}draggable False`, `${I}dropped _PkDrop(${acc ? py(acc.id) : 'None'}, ${actionCode(p, s, it)})`);
    out.push(`${I}fixed:`, `${I}${I}xysize (${Math.round(it.w ?? DROP_W)}, ${Math.round(it.h ?? DROP_H)})`, `${I}${I}add Solid(${py(isColor(it.bgColor) ? it.bgColor! : '#ffffff26')})`);
    if (it.text?.trim()) out.push(...textLines(I + I));
  } else {
    if (it.kind === 'image' && !it.image?.trim()) return [];
    out.push(`${I}droppable False`, `${I}dragged _PkBack(${x}, ${y})`);
    if (it.kind === 'image') out.push(`${I}add ${imgRef(it.image!)}`);
    else out.push(...textLines(I));
  }
  return withCond(it, mark(out, 'i:' + it.id), I0);
}

const isDD = (it: ScreenItem) => isDragged(it) || it.kind === 'drop';

// 화면의 항목들. 끌어 놓기 항목은 처음 나온 자리에 draggroup으로 모은다 (놓는 곳은 같은 draggroup 안에서만 받음)
function itemsCode(p: Project, s: ScreenDef, I0: string): string[] {
  const out: string[] = [];
  let grouped = false;
  for (const it of s.items) {
    if (!isDD(it)) {
      out.push(...itemCode(p, s, it, I0));
      continue;
    }
    if (grouped) continue;
    grouped = true;
    const inner = s.items.filter(isDD).flatMap((d) => dragCode(p, s, d, I0 + '    '));
    if (inner.length) out.push(`${I0}draggroup:`, ...inner);
  }
  return out;
}

const DRAG_HELPERS = [
  '# 끌어 놓기 ([화면] 탭의 "끌 수 있음", "놓는 곳")',
  'init -1 python:',
  '    class _PkBack(object):',
  '        # 끈 것을 놓으면 제자리로',
  '        def __init__(self, x, y):',
  '            self.x, self.y = x, y',
  '        def __call__(self, drags, drop):',
  '            for d in drags:',
  '                d.snap(self.x, self.y, 0.2)',
  '            return None',
  '',
  '    class _PkDrop(object):',
  '        # 받는 것이 맞으면 "놓으면" 할 일을 함. 값을 돌려주면 화면이 닫힘',
  '        def __init__(self, accept, action):',
  '            self.accept, self.action = accept, action',
  '        def __call__(self, target, drags):',
  '            if self.accept is not None and not any(d.drag_name == self.accept for d in drags):',
  '                return None',
  '            rv = renpy.run(self.action)',
  '            renpy.restart_interaction()',
  '            return rv',
  '',
];

// 둥근 모서리 (FEATURE 23): 그림 없이 색 칸의 모서리를 셰이더로 깎는다 (플러그인이 없어도 됨)
const ROUND_HELPER = [
  '# 둥근 모서리 (플래그 꼴의 "모서리")',
  'init -1 python:',
  '    renpy.register_shader("pygaki.round", variables="""',
  '        uniform float u_pk_radius;',
  '        uniform vec2 u_model_size;',
  '        attribute vec4 a_position;',
  '        varying vec2 v_pk_pos;',
  '    """, vertex_300="""',
  '        v_pk_pos = a_position.xy;',
  '    """, fragment_300="""',
  '        vec2 pk_h = u_model_size * 0.5;',
  '        vec2 pk_q = abs(v_pk_pos - pk_h) - (pk_h - vec2(u_pk_radius));',
  '        float pk_d = length(max(pk_q, 0.0)) + min(max(pk_q.x, pk_q.y), 0.0) - u_pk_radius;',
  '        gl_FragColor *= clamp(0.5 - pk_d, 0.0, 1.0);',
  '    """, **({"glsl": 100} if hasattr(renpy.config, "glsl_version") else {}))  # 렌파이 8.6부터: 예전 문법(GLSL ES 1.00)이라고 알림',
  '',
  '    def _pk_round(d, r):',
  '        # 색 칸 d의 모서리를 반지름 r(px)만큼 둥글게',
  '        return Transform(d, mesh=True, shader="pygaki.round", u_pk_radius=float(r))',
  '',
];

function bgCode(s: ScreenDef, I0: string): string[] {
  const a = s.bgAlpha !== undefined && s.bgAlpha < 100 ? ` alpha ${pct(s.bgAlpha)}` : '';
  if (isColor(s.bg)) return [`${I0}add Solid(${py(s.bg!)})${a}`];
  if (s.bg?.trim()) return [`${I0}add ${imgRef(s.bg)}${a}`];
  return [];
}

// pykaki_screens.rpy 글. 화면이 없으면 머리말만 (지운 화면이 게임에 남지 않게)
// only: 그 화면 하나만 (머리말 없이, [화면] 탭의 원고 보기)
export function screensCode(p: Project, only?: string): string {
  marks = !only; // 원고 보기(화면 하나)에는 표시를 붙이지 않음
  const out = only ? [] : ['# pygaki가 만든 화면이에요. 직접 고치면 다음 내보내기 때 덮어써져요.', '# 대본 편집기의 [화면] 탭에서 고쳐요.', ''];
  for (const s of p.screens ?? []) {
    if (only && s.id !== only) continue;
    out.push(`# ${(s.title || s.name).replace(/\s+/g, ' ')}${isHud(s) ? ' (HUD)' : ''}`);
    out.push(`screen ${s.name}():` + (marks ? `  # @s:${s.id}` : ''));
    const start = out.length;
    if (isHud(s)) {
      // HUD: modal 없이 떠 있고, 붙인 자리에 크기만큼의 칸을 둔다
      const { w, h } = hudSize(s);
      const [, , ax, ay] = anchorOf(s);
      if (s.zorder) out.push(`    zorder ${Math.round(s.zorder)}`);
      // align은 소수로 (렌파이는 정수 1을 1px로 읽는다)
      out.push('    fixed:', `        xysize (${Math.round(w)}, ${Math.round(h)})`, `        align (${ax.toFixed(1)}, ${ay.toFixed(1)})`);
      if (s.dx || s.dy) out.push(`        offset (${Math.round(s.dx ?? 0)}, ${Math.round(s.dy ?? 0)})`);
      out.push(...bgCode(s, '        '));
      const inner = hudInner(s);
      if (inner) {
        // 스크롤: HUD 크기의 viewport 안에 안쪽 크기 칸. 끌거나 휠로 넘겨 봄 (항목 자리는 안쪽 칸 왼쪽 위 기준)
        // 휠: 세로로 넘길 것이 없으면 가로로
        out.push('        viewport:', `            xysize (${Math.round(w)}, ${Math.round(h)})`, '            draggable True', `            mousewheel ${inner.ch > h ? 'True' : '"horizontal"'}`,
          '            fixed:', `                xysize (${inner.cw}, ${inner.ch})`,
          // 빈 곳을 눌러도 대사가 넘어가지 않게 뒤에 아무것도 안 하는 단추 (키보드 초점은 안 감)
          '                button:', `                    xysize (${inner.cw}, ${inner.ch})`, '                    background None', '                    keyboard_focus False', '                    action NullAction()');
        out.push(...itemsCode(p, s, '                '));
      } else out.push(...itemsCode(p, s, '        '));
    } else {
      out.push('    modal True');
      out.push(...bgCode(s, '    '));
      out.push(...itemsCode(p, s, '    '));
    }
    if (out.length === start) out.push('    null');
    out.push('');
  }
  // 게임 내내 띄우는 HUD
  const ov = (p.screens ?? []).filter((s) => isHud(s) && s.overlay && IDENT.test(s.name) && (!only || s.id === only)).map((s) => py(s.name));
  if (ov.length) {
    out.push('# 게임 내내 띄우는 HUD ([화면] 탭의 "게임 내내 띄우기")', 'init python:', `    for _pk_hud in [${ov.join(', ')}]:`, '        if _pk_hud not in config.overlay_screens:', '            config.overlay_screens.append(_pk_hud)', '');
  }
  if (!only && (p.screens ?? []).some((s) => s.items.some(isDD))) out.push(...DRAG_HELPERS);
  if (out.some((x) => x.includes('_pk_round('))) out.push(...ROUND_HELPER);
  return out.join('\n') + '\n';
}

// HUD 틀 세 가지 (FEATURE 18. 물건 쓰기(끌어 놓기) 틀은 너무 복잡해서 뺌): 필요한 플래그도 만든다 (같은 이름이 있으면 그대로 씀). 만든 화면 id
export type HudTemplate = 'inventory' | 'love' | 'map';
// [+ HUD 틀에서] 메뉴 (Command Palette 꼴, 설명 카드에 영상): 메뉴 줄 글, 설명, 만드는 플래그, ✎ 바꾸는 곳, ? 보는 곳
export interface HudTpl { id: HudTemplate; icon: string; title: string; kindHint: string; desc: string; flags: string[]; write: string[]; read: string[] }
export const HUD_TEMPLATES: HudTpl[] = [
  { id: 'inventory', icon: '🎒', title: '인벤토리', kindHint: '켜짐/꺼짐', desc: '오른쪽 위에 가진 물건을 늘어놓아요. 플래그가 켜진 물건만 보여요.', flags: ['has_key', 'has_map', 'has_lamp'], write: ['대본에서 물건을 얻을 때: has_key = True'], read: ['물건마다 보이는 조건: has_key'] },
  { id: 'love', icon: '♥', title: '호감도 막대', kindHint: '숫자', desc: '왼쪽 위에 호감도를 레벨 인디케이터와 숫자로 보여요. 막대는 love 플래그의 꼴이라 플래그 카드에서 꾸민 모양 그대로예요.', flags: ['love'], write: ['선택지를 고르면: love += 1'], read: ['플래그 꼴과 글 속 [love]'] },
  { id: 'map', icon: '⌖', title: '미니맵', kindHint: '글자', desc: '오른쪽 아래에 장소 버튼을 늘어놓아요. 누르면 그 상자로 가요. 지금 장소는 글자 플래그로 보여요.', flags: ['place'], write: ['장소 상자에 들어갈 때: place = "부엌"'], read: ['글 속 [place]', '버튼마다 갈 상자를 골라요'] },
];
// 틀의 글은 대본에 저장되는 글이라 화면 사전으로 바꾸지 않고 처음부터 화면 언어로 넣는다 (sample.ts 새 대본 이름과 같게)
const TPL_WORDS = {
  ko: { inv: '인벤토리', have: '가진 것', key: '열쇠', map: '지도', lamp: '등불', keyN: '열쇠를 가졌는지', mapN: '지도를 가졌는지', lampN: '등불을 가졌는지', love: '호감도 막대', loveT: '호감도', loveN: '호감도', mini: '미니맵', now: '지금', place: '지금 있는 장소', rooms: ['거실', '부엌', '정원'] },
  ja: { inv: 'インベントリ', have: '持ち物', key: '鍵', map: '地図', lamp: 'ランプ', keyN: '鍵を持っているか', mapN: '地図を持っているか', lampN: 'ランプを持っているか', love: '好感度バー', loveT: '好感度', loveN: '好感度', mini: 'ミニマップ', now: '現在地', place: '今いる場所', rooms: ['居間', '台所', '庭'] },
  en: { inv: 'Inventory', have: 'Items', key: 'Key', map: 'Map', lamp: 'Lamp', keyN: 'Has the key', mapN: 'Has the map', lampN: 'Has the lamp', love: 'Affection bar', loveT: 'Affection', loveN: 'Affection', mini: 'Minimap', now: 'Now', place: 'Current place', rooms: ['Living room', 'Kitchen', 'Garden'] },
};
function tplWords() {
  try {
    const v = localStorage.getItem('pygaki-lang'); // i18n.ts의 KEY
    return TPL_WORDS[v === 'ja' || v === 'en' ? v : 'ko'];
  } catch {
    return TPL_WORDS.ko;
  }
}
function ensureFlag(p: Project, name: string, kind: 'bool' | 'int' | 'str', init: boolean | number | string, note: string, ui?: Flag['ui']) {
  if (!p.variables.some((f) => f.name === name)) p.variables.push({ id: uid('v'), name, kind, init, note, ...(ui ? { ui } : {}) });
}
function freeName(p: Project, base: string) {
  let n = base;
  for (let i = 2; p.screens?.some((s) => s.name === n) || p.labels.some((g) => g.name === n); i++) n = base + '_' + i;
  return n;
}
export function addHudTemplate(p: Project, t: HudTemplate): string {
  p.screens ??= [];
  const W = tplWords();
  const id = uid('s');
  const it = (o: Omit<ScreenItem, 'id'>): ScreenItem => ({ id: uid('i'), ...o });
  const base = { id, kind: 'hud' as const, bg: '#000000', bgAlpha: 55 };
  if (t === 'inventory') {
    ensureFlag(p, 'has_key', 'bool', false, W.keyN);
    ensureFlag(p, 'has_map', 'bool', false, W.mapN);
    ensureFlag(p, 'has_lamp', 'bool', false, W.lampN);
    p.screens.push({ ...base, name: freeName(p, 'hud_inventory'), title: W.inv, anchor: 'tr', dx: -20, dy: 20, w: 220, h: 170, items: [
      it({ kind: 'text', x: 14, y: 10, text: W.have, size: 22, color: '#ffd27a' }),
      it({ kind: 'text', x: 14, y: 48, text: W.key, size: 24, cond: 'has_key' }),
      it({ kind: 'text', x: 14, y: 84, text: W.map, size: 24, cond: 'has_map' }),
      it({ kind: 'text', x: 14, y: 120, text: W.lamp, size: 24, cond: 'has_lamp' }),
    ] });
  } else if (t === 'love') {
    ensureFlag(p, 'love', 'int', 0, W.loveN, { look: 'level', style: 'continuous', min: 0, max: 10 });
    p.screens.push({ ...base, name: freeName(p, 'hud_love'), title: W.love, anchor: 'tl', dx: 20, dy: 20, w: 360, h: 74, items: [
      it({ kind: 'text', x: 14, y: 6, text: W.loveT + ' [love]', size: 22 }),
      it({ kind: 'look', x: 14, y: 40, flag: 'love', w: 332, h: 20 }),
    ] });
  } else {
    ensureFlag(p, 'place', 'str', W.rooms[0], W.place);
    p.screens.push({ ...base, name: freeName(p, 'hud_map'), title: W.mini, anchor: 'br', dx: -20, dy: -230, w: 260, h: 190, items: [
      it({ kind: 'text', x: 14, y: 10, text: W.now + ': [place]', size: 22, color: '#9fd8ff' }),
      ...W.rooms.map((n, i) => it({ kind: 'textbutton', x: 24, y: 52 + i * 42, text: n, size: 24, color: '#cccccc', hoverColor: '#ffffff', act: 'jump', target: null })),
    ] });
  }
  return id;
}

// 틀 메뉴 설명 카드의 원고 (빈 대본에 그 틀만 넣어 본 것, 끌어 놓기 도움 글은 뺌)
export function hudTemplateCode(t: HudTemplate): string {
  const p = { labels: [], nodes: [], variables: [], screens: [] } as unknown as Project;
  addHudTemplate(p, t);
  return screensCode(p, p.screens![0].id).trim();
}

// 플래그를 쓰는 화면 (FEATURE 18): 보는 곳(보이는 조건, 막대, 글 속 [이름])과 바꾸는 곳(버튼)
export function screenFlagUses(p: Project, name: string): { screen: ScreenDef; write: boolean }[] {
  const out: { screen: ScreenDef; write: boolean }[] = [];
  const re = new RegExp(`(?<![A-Za-z0-9_.])${name}(?![A-Za-z0-9_])`);
  for (const s of p.screens ?? []) {
    let r = false, w = false;
    for (const it of s.items) {
      if ((it.cond && re.test(it.cond)) || it.flag === name || it.text?.includes(`[${name}]`)) r = true;
      if (actOf(s, it) === 'flag' && it.acts?.some((a) => parseAction(a)?.name === name)) w = true;
    }
    if (r) out.push({ screen: s, write: false });
    if (w) out.push({ screen: s, write: true });
  }
  return out;
}
