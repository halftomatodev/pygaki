// 화면 만들기 (FEATURE 17): 화면 목록(project.screens) → game/pykaki_screens.rpy, 흐름 "화면 부르기"의 갈래 맞추기
import type { BoxNode, Project, ScreenAnchor, ScreenDef, ScreenItem } from './types';
import { addFixup } from './store';
import { IDENT, RESERVED, uid } from './util';
import { parseAction } from './flags';
import { flagUi, partColor, strOptions, uiMax, uiMin } from './flagUi';

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
  return withCond(it, out, I0);
}

// 플래그 꼴 (FEATURE 21): 플래그 카드의 꼴과 꾸미기를 렌파이 화면 언어로. 첫 줄은 맨 바깥 칸(뒤에 pos가 들어감)
export const LOOK_SIZE: Record<string, [number, number]> = { level: [240, 22], slider: [240, 24], rating: [220, 30], switch: [64, 32], pulldown: [200, 40], combo: [200, 40] };
export function lookSize(p: Project, it: ScreenItem): [number, number] {
  const f = p.variables.find((v) => v.name === it.flag);
  const u = f ? flagUi(f) : null;
  const d = LOOK_SIZE[u ? (u.look === 'level' && u.style === 'rating' ? 'rating' : u.look) : 'level'];
  return [Math.round(it.w ?? d[0]), Math.round(it.h ?? d[1])];
}
export function lookCode(p: Project, it: ScreenItem): string[] {
  const f = p.variables.find((v) => v.name === it.flag);
  if (!f || !IDENT.test(f.name)) return [];
  const u = flagUi(f);
  const I = '    ';
  const [w, h] = lookSize(p, it);
  const edit = !!it.edit; // FEATURE 22: 게임에서 꼴로 값 바꾸기
  // 부품: 그림이 있으면 그림(늘여 맞춤), 없으면 색
  const part = (k: string, pw: number | string, ph: number | string) => {
    const img = u.skin?.[k]?.image?.trim();
    return img ? `Transform(${imgRef(img)}, xysize=(${pw}, ${ph}))` : `Solid(${py(partColor(u, k))}, xysize=(${pw}, ${ph}))`;
  };
  // 누르는 칸: 배경·여백 없는 button (칸 하나에 그림 하나). 올리면 살짝 밝게
  const press = (I1: string, action: string) => [`${I1}button:`, `${I1}${I}background None`, `${I1}${I}padding (0, 0)`, `${I1}${I}hover_foreground Solid("#ffffff30")`, `${I1}${I}action ${action}`];
  const lo = uiMin(u), hi = uiMax(u), n = f.name;
  // 칸·별 i를 누르면 그 칸까지 찬 값. 첫 칸이 이미 그 값이면 최솟값으로 (모두 비우기)
  const stepSet = (count: number) => {
    const t = `${lo} + ((i + 1) * ${hi - lo} + ${count - 1}) // ${count}`;
    return `SetVariable(${py(n)}, (${lo} if i == 0 and ${n} == ${t} else ${t}))`;
  };
  if (f.kind === 'int' && u.look === 'level' && u.style === 'rating') {
    const count = Math.min(hi - lo, 10), per = (hi - lo) / count;
    const on = u.skin?.on?.image?.trim(), off = u.skin?.off?.image?.trim();
    const I2 = edit ? I + I + I : I + I;
    const sym = on && off ? [`${I2}add (${imgRef(on)} if ${n} - ${lo} >= (i + 1) * ${per} else ${imgRef(off)}):`, `${I2}${I}fit "contain"`, `${I2}${I}xysize (${h}, ${h})`]
      : [`${I2}text "★" font "DejaVuSans.ttf" size ${h} color (${py(partColor(u, 'on'))} if ${n} - ${lo} >= (i + 1) * ${per} else ${py(partColor(u, 'off'))})`];
    return ['hbox:', `${I}xysize (${w}, ${h})`, `${I}spacing 2`, `${I}for i in range(${count}):`, ...(edit ? press(I + I, stepSet(count)) : []), ...sym];
  }
  if (f.kind === 'int' && u.look === 'level' && u.style === 'discrete') {
    const count = Math.min(hi - lo, 20);
    const seg = `(${w} - ${count + 1} * 2) // ${count}`;
    const cell = `add (${part('fill', seg, h - 4)} if (${n} - ${lo}) * ${count} >= (i + 1) * ${hi - lo} else ${part('track', seg, h - 4)})`;
    return ['frame:', `${I}background ${part('border', w, h)}`, `${I}padding (2, 2)`, `${I}xysize (${w}, ${h})`, `${I}hbox:`, `${I}${I}spacing 2`, `${I}${I}for i in range(${count}):`,
      ...(edit ? [...press(I + I + I, stepSet(count)), `${I}${I}${I}${I}${cell}`] : [`${I}${I}${I}${cell}`])];
  }
  if (f.kind === 'int') {
    // 바꿀 수 있으면 끌어서 정수로 (VariableValue, 최솟값~최댓값). 아니면 따라가기만 (AnimatedValue)
    const v = edit ? `VariableValue(${py(n)}, min=${lo}, max=${hi}, step=1, force_step=True)` : `AnimatedValue(${n} - ${lo}, ${hi - lo}, 0.3)`;
    const value = `${I}value ${v}`;
    if (u.look === 'slider') {
      // 트랙은 가운데 가는 띠, 손잡이는 그림이 없으면 네모 (렌파이 Solid는 둥글지 않음)
      const th = Math.max(4, Math.round(h / 5));
      const thin = (k: string) => {
        const img = u.skin?.[k]?.image?.trim();
        const d = img ? `Transform(${imgRef(img)}, xysize=(${w}, ${th}), yalign=0.5)` : `Solid(${py(partColor(u, k))}, xysize=(${w}, ${th}), yalign=0.5)`;
        return `Fixed(${d}, xysize=(${w}, ${h}))`;
      };
      const t = u.skin?.thumb?.image?.trim();
      const tw = t ? h : Math.max(6, Math.round(h * 0.5));
      return ['bar:', value, `${I}xysize (${w}, ${h})`, `${I}left_bar ${thin('fill')}`, `${I}right_bar ${thin('track')}`,
        `${I}thumb ${t ? `Transform(${imgRef(t)}, xysize=(${h}, ${h}))` : `Solid(${py(partColor(u, 'thumb'))}, xysize=(${tw}, ${h}))`}`, `${I}thumb_offset ${Math.round(tw / 2)}`];
    }
    return ['frame:', `${I}background ${part('border', w, h)}`, `${I}padding (1, 1)`, `${I}xysize (${w}, ${h})`,
      `${I}bar:`, I + value, `${I}${I}xysize (${w - 2}, ${h - 2})`, `${I}${I}left_bar ${part('fill', w - 2, h - 2)}`, `${I}${I}right_bar ${part('track', w - 2, h - 2)}`, `${I}${I}thumb None`];
  }
  if (f.kind === 'bool') {
    const k = Math.round(h * 0.8), m = Math.round((h - k) / 2);
    const inner = (I1: string) => [`${I1}add (${part('on', w, h)} if ${n} else ${part('off', w, h)})`, `${I1}add ${part('thumb', k, k)}:`, `${I1}${I}xpos (${w - k - m} if ${n} else ${m})`, `${I1}${I}ypos ${m}`];
    if (!edit) return ['fixed:', `${I}xysize (${w}, ${h})`, ...inner(I)];
    return ['button:', `${I}xysize (${w}, ${h})`, `${I}background None`, `${I}padding (0, 0)`, `${I}action ToggleVariable(${py(n)})`, `${I}fixed:`, ...inner(I + I)];
  }
  // 글자: 값을 글로 보이는 칸. 바꿀 수 있으면 눌러서 고를 값 목록을 펼침 (콤보는 아래에 글 치는 칸도)
  const ts = Math.max(12, Math.round(h * 0.5));
  const tc = py(partColor(u, 'text'));
  const value = (I1: string) => `${I1}text "[${n}]" color ${tc} yalign 0.5 size ${ts}`;
  // 펼침 표시 ▾는 따로 (게임 글꼴에 없을 수 있어 DejaVuSans. 값 글은 게임 글꼴 그대로)
  const label = (I1: string) => [`${I1}frame:`, `${I1}${I}background ${part('box', w - 2, h - 2)}`, `${I1}${I}xfill True`, `${I1}${I}yfill True`, `${I1}${I}padding (10, 0)`,
    ...(edit ? [`${I1}${I}fixed:`, value(I1 + I + I), `${I1}${I}${I}text "▾" font "DejaVuSans.ttf" color ${tc} size ${ts} xalign 1.0 yalign 0.5`] : [value(I1 + I)])];
  if (!edit) return ['frame:', `${I}background ${part('border', w, h)}`, `${I}padding (1, 1)`, `${I}xysize (${w}, ${h})`, ...label(I)];
  const open = '_pk_open_' + it.id.replace(/\W/g, '_');
  const opts = strOptions(p, f).filter((o) => o !== '');
  const out = ['vbox:', `${I}default ${open} = False`, `${I}spacing 2`,
    `${I}button:`, `${I}${I}background ${part('border', w, h)}`, `${I}${I}padding (1, 1)`, `${I}${I}xysize (${w}, ${h})`, `${I}${I}action ToggleScreenVariable(${py(open)})`, ...label(I + I),
    `${I}if ${open}:`, `${I}${I}frame:`, `${I}${I}${I}background ${part('border', w, 1)}`, `${I}${I}${I}padding (1, 1)`, `${I}${I}${I}xsize ${w}`, `${I}${I}${I}vbox:`, `${I}${I}${I}${I}spacing 1`];
  const I4 = I + I + I + I;
  // 올린 줄·고른 줄은 글자 색 바탕에 칸 색 글자 (뒤집기)
  const hl = `Solid(${tc})`, bc = py(partColor(u, 'box'));
  for (const o of opts)
    out.push(`${I4}textbutton ${py(o.replace(/\[/g, '[[').replace(/\{/g, '{{'))}:`, `${I4}${I}xfill True`, `${I4}${I}padding (10, 4)`, `${I4}${I}background ${part('box', w - 2, h - 2)}`, `${I4}${I}hover_background ${hl}`, `${I4}${I}selected_background ${hl}`,
      `${I4}${I}text_size ${ts}`, `${I4}${I}text_color ${tc}`, `${I4}${I}text_hover_color ${bc}`, `${I4}${I}text_selected_color ${bc}`, `${I4}${I}selected ${n} == ${py(o)}`, `${I4}${I}action [SetVariable(${py(n)}, ${py(o)}), SetScreenVariable(${py(open)}, False)]`);
  if (u.look === 'combo')
  {
    // 글 치는 칸: 누르면 치기 시작(Toggle), Enter로 끝(action Disable: Enter가 대사로 가지 않음). 누르기가 대사로 가지 않게 button으로 감쌈
    const iv = `VariableInputValue(${py(n)}, default=False, returnable=False)`;
    out.push(`${I4}button:`, `${I4}${I}xfill True`, `${I4}${I}padding (10, 4)`, `${I4}${I}background ${part('box', w - 2, h - 2)}`, `${I4}${I}action ${iv}.Toggle()`,
      `${I4}${I}input value ${iv} action [${iv}.Disable(), SetScreenVariable(${py(open)}, False)] size ${ts} color ${tc} pixel_width ${Math.max(20, w - 24)}`);
  }
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
  return withCond(it, out, I0);
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

function bgCode(s: ScreenDef, I0: string): string[] {
  const a = s.bgAlpha !== undefined && s.bgAlpha < 100 ? ` alpha ${pct(s.bgAlpha)}` : '';
  if (isColor(s.bg)) return [`${I0}add Solid(${py(s.bg!)})${a}`];
  if (s.bg?.trim()) return [`${I0}add ${imgRef(s.bg)}${a}`];
  return [];
}

// pykaki_screens.rpy 글. 화면이 없으면 머리말만 (지운 화면이 게임에 남지 않게)
// only: 그 화면 하나만 (머리말 없이, [화면] 탭의 원고 보기)
export function screensCode(p: Project, only?: string): string {
  const out = only ? [] : ['# pygaki가 만든 화면이에요. 직접 고치면 다음 내보내기 때 덮어써져요.', '# 대본 편집기의 [화면] 탭에서 고쳐요.', ''];
  for (const s of p.screens ?? []) {
    if (only && s.id !== only) continue;
    out.push(`# ${(s.title || s.name).replace(/\s+/g, ' ')}${isHud(s) ? ' (HUD)' : ''}`);
    out.push(`screen ${s.name}():`);
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
      out.push(...itemsCode(p, s, '        '));
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
  return out.join('\n') + '\n';
}

// HUD 틀 세 가지 (FEATURE 18): 필요한 플래그도 만든다 (같은 이름이 있으면 그대로 씀). 만든 화면 id
export type HudTemplate = 'inventory' | 'love' | 'map' | 'use';
// [+ HUD 틀에서] 메뉴 (Command Palette 꼴, 설명 카드에 영상): 메뉴 줄 글, 설명, 만드는 플래그, ✎ 바꾸는 곳, ? 보는 곳
export interface HudTpl { id: HudTemplate; icon: string; title: string; kindHint: string; desc: string; flags: string[]; write: string[]; read: string[] }
export const HUD_TEMPLATES: HudTpl[] = [
  { id: 'inventory', icon: '🎒', title: '인벤토리', kindHint: '켜짐/꺼짐', desc: '오른쪽 위에 가진 물건을 늘어놓아요. 플래그가 켜진 물건만 보여요.', flags: ['has_key', 'has_map', 'has_lamp'], write: ['대본에서 물건을 얻을 때: has_key = True'], read: ['물건마다 보이는 조건: has_key'] },
  { id: 'love', icon: '♥', title: '호감도 막대', kindHint: '숫자', desc: '왼쪽 위에 호감도를 막대와 숫자로 보여요. 값이 바뀌면 막대가 부드럽게 움직여요.', flags: ['love'], write: ['선택지를 고르면: love += 1'], read: ['막대와 글 속 [love]'] },
  { id: 'map', icon: '⌖', title: '미니맵', kindHint: '글자', desc: '오른쪽 아래에 장소 버튼을 늘어놓아요. 누르면 그 상자로 가요. 지금 장소는 글자 플래그로 보여요.', flags: ['place'], write: ['장소 상자에 들어갈 때: place = "부엌"'], read: ['글 속 [place]', '버튼마다 갈 상자를 골라요'] },
  { id: 'use', icon: '✋', title: '물건 쓰기 (끌어 놓기)', kindHint: '끌어 놓기', desc: '가진 물건을 끌어 문에 놓으면 문이 열려요. 다른 곳에 놓으면 물건이 제자리로 돌아가요.', flags: ['has_key', 'door_open'], write: ['문에 열쇠를 놓으면: door_open = True, has_key = False'], read: ['열쇠의 보이는 조건: has_key', '대본의 조건 분기: door_open'] },
];
// 틀의 글은 대본에 저장되는 글이라 화면 사전으로 바꾸지 않고 처음부터 화면 언어로 넣는다 (sample.ts 새 대본 이름과 같게)
const TPL_WORDS = {
  ko: { inv: '인벤토리', have: '가진 것', key: '열쇠', map: '지도', lamp: '등불', keyN: '열쇠를 가졌는지', mapN: '지도를 가졌는지', lampN: '등불을 가졌는지', love: '호감도 막대', loveT: '호감도', loveN: '호감도', mini: '미니맵', now: '지금', place: '지금 있는 장소', rooms: ['거실', '부엌', '정원'], use: '물건 쓰기', door: '문 (여기에 놓기)', doorN: '문이 열렸는지' },
  ja: { inv: 'インベントリ', have: '持ち物', key: '鍵', map: '地図', lamp: 'ランプ', keyN: '鍵を持っているか', mapN: '地図を持っているか', lampN: 'ランプを持っているか', love: '好感度バー', loveT: '好感度', loveN: '好感度', mini: 'ミニマップ', now: '現在地', place: '今いる場所', rooms: ['居間', '台所', '庭'], use: 'アイテムを使う', door: 'ドア (ここに置く)', doorN: 'ドアが開いたか' },
  en: { inv: 'Inventory', have: 'Items', key: 'Key', map: 'Map', lamp: 'Lamp', keyN: 'Has the key', mapN: 'Has the map', lampN: 'Has the lamp', love: 'Affection bar', loveT: 'Affection', loveN: 'Affection', mini: 'Minimap', now: 'Now', place: 'Current place', rooms: ['Living room', 'Kitchen', 'Garden'], use: 'Use an item', door: 'Door (drop here)', doorN: 'Door is open' },
};
function tplWords() {
  try {
    const v = localStorage.getItem('pygaki-lang'); // i18n.ts의 KEY
    return TPL_WORDS[v === 'ja' || v === 'en' ? v : 'ko'];
  } catch {
    return TPL_WORDS.ko;
  }
}
function ensureFlag(p: Project, name: string, kind: 'bool' | 'int' | 'str', init: boolean | number | string, note: string) {
  if (!p.variables.some((f) => f.name === name)) p.variables.push({ id: uid('v'), name, kind, init, note });
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
    ensureFlag(p, 'love', 'int', 0, W.loveN);
    p.screens.push({ ...base, name: freeName(p, 'hud_love'), title: W.love, anchor: 'tl', dx: 20, dy: 20, w: 360, h: 74, items: [
      it({ kind: 'text', x: 14, y: 6, text: W.loveT + ' [love]', size: 22 }),
      it({ kind: 'bar', x: 14, y: 40, flag: 'love', max: 10, w: 332, h: 20, color: '#e0607a', bgColor: '#ffffff33' }),
    ] });
  } else if (t === 'use') {
    ensureFlag(p, 'has_key', 'bool', false, W.keyN);
    ensureFlag(p, 'door_open', 'bool', false, W.doorN);
    const key = it({ kind: 'text', x: 24, y: 64, text: W.key, size: 26, cond: 'has_key', drag: true });
    p.screens.push({ ...base, name: freeName(p, 'hud_use'), title: W.use, anchor: 'b', dx: 0, dy: -250, w: 460, h: 150, items: [
      it({ kind: 'text', x: 14, y: 10, text: W.have, size: 22, color: '#ffd27a' }),
      key,
      it({ kind: 'drop', x: 250, y: 20, w: 196, h: 110, text: W.door, size: 22, bgColor: '#ffffff26', accept: key.id, act: 'flag', acts: ['door_open = True', 'has_key = False'] }),
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
