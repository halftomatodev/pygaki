// 화면 만들기 (FEATURE 17): 화면 목록(project.screens) → game/pykaki_screens.rpy, 흐름 "화면 부르기"의 갈래 맞추기
import type { BoxNode, Project, ScreenAnchor, ScreenDef, ScreenItem } from './types';
import { addFixup } from './store';
import { IDENT, RESERVED, uid } from './util';
import { parseAction } from './flags';

// HUD (FEATURE 18): 대사가 흐르는 동안 떠 있는 화면. 없으면 전체 화면 (call screen)
export const isHud = (s?: ScreenDef | null) => s?.kind === 'hud';
export const isBtnKind = (k: ScreenItem['kind']) => k === 'imagebutton' || k === 'textbutton';
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
    if (isBtnKind(it.kind) && actOf(s, it) === 'return' && v && !out.includes(v)) out.push(v);
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
  if (!out.length) return out;
  // 보이는 조건 (FEATURE 18)
  if (it.cond?.trim()) return [`${I0}if ${it.cond.trim()}:`, ...out.map((x) => I0 + I + x)];
  return out.map((x) => I0 + x);
}

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
      for (const it of s.items) out.push(...itemCode(p, s, it, '        '));
    } else {
      out.push('    modal True');
      out.push(...bgCode(s, '    '));
      for (const it of s.items) out.push(...itemCode(p, s, it, '    '));
    }
    if (out.length === start) out.push('    null');
    out.push('');
  }
  // 게임 내내 띄우는 HUD
  const ov = (p.screens ?? []).filter((s) => isHud(s) && s.overlay && IDENT.test(s.name) && (!only || s.id === only)).map((s) => py(s.name));
  if (ov.length) {
    out.push('# 게임 내내 띄우는 HUD ([화면] 탭의 "게임 내내 띄우기")', 'init python:', `    for _pk_hud in [${ov.join(', ')}]:`, '        if _pk_hud not in config.overlay_screens:', '            config.overlay_screens.append(_pk_hud)', '');
  }
  return out.join('\n') + '\n';
}

// HUD 틀 세 가지 (FEATURE 18): 필요한 플래그도 만든다 (같은 이름이 있으면 그대로 씀). 만든 화면 id
export type HudTemplate = 'inventory' | 'love' | 'map';
export const HUD_TEMPLATES: [HudTemplate, string, string][] = [
  ['inventory', '인벤토리', '켜짐/꺼짐 플래그(has_key 등)가 켜진 물건만 보여요'],
  ['love', '호감도 막대', '숫자 플래그 love를 막대와 숫자로 보여요'],
  ['map', '미니맵', '장소 버튼을 누르면 그 상자로 가요. 지금 장소는 글자 플래그 place'],
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
  } else {
    ensureFlag(p, 'place', 'str', W.rooms[0], W.place);
    p.screens.push({ ...base, name: freeName(p, 'hud_map'), title: W.mini, anchor: 'br', dx: -20, dy: -230, w: 260, h: 190, items: [
      it({ kind: 'text', x: 14, y: 10, text: W.now + ': [place]', size: 22, color: '#9fd8ff' }),
      ...W.rooms.map((n, i) => it({ kind: 'textbutton', x: 24, y: 52 + i * 42, text: n, size: 24, color: '#cccccc', hoverColor: '#ffffff', act: 'jump', target: null })),
    ] });
  }
  return id;
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
