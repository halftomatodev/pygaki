// 화면 만들기 (FEATURE 17): 화면 목록(project.screens) → game/pykaki_screens.rpy, 흐름 "화면 부르기"의 갈래 맞추기
import type { BoxNode, Project, ScreenDef, ScreenItem } from './types';
import { addFixup } from './store';
import { IDENT, RESERVED, uid } from './util';

export const SCREENS_FILE = 'pykaki_screens.rpy';

// 버튼이 돌려주는 값들 (차례대로, 겹치는 값은 하나)
export function screenValues(s: ScreenDef | undefined): string[] {
  const out: string[] = [];
  for (const it of s?.items ?? []) {
    const v = it.value?.trim();
    if ((it.kind === 'imagebutton' || it.kind === 'textbutton') && v && !out.includes(v)) out.push(v);
  }
  return out;
}

// "화면 부르기" 흐름의 갈래를 그 화면의 버튼 값에 맞춘다. 같은 값의 갈래는 선을 그대로 둔다
export function syncOuts(p: Project, b: BoxNode) {
  if (b.exit.type !== 'screen') return;
  const e = b.exit;
  const vals = screenValues(p.screens?.find((s) => s.id === e.screen));
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
      items: Array.isArray(s.items) ? s.items.filter((it: ScreenItem) => it && typeof it.id === 'string').map((it: ScreenItem) => ({ ...it, x: Number(it.x) || 0, y: Number(it.y) || 0 })) : [],
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

function itemCode(it: ScreenItem): string[] {
  const I = '    ';
  const pos = `${I}${I}pos (${Math.round(it.x)}, ${Math.round(it.y)})`;
  const act = `${I}${I}action Return(${py(it.value?.trim() || '')})`;
  if (it.kind === 'image') return it.image?.trim() ? [`${I}add ${imgRef(it.image)}:`, pos] : [];
  if (it.kind === 'text') {
    const out = [`${I}text ${py(it.text ?? '')}:`, pos];
    if (it.size) out.push(`${I}${I}size ${it.size}`);
    if (it.color) out.push(`${I}${I}color ${py(it.color)}`);
    return out;
  }
  if (it.kind === 'imagebutton') {
    if (!it.image?.trim()) return [];
    const out = [`${I}imagebutton:`, `${I}${I}idle ${imgRef(it.image)}`];
    if (it.hover?.trim()) out.push(`${I}${I}hover ${imgRef(it.hover)}`);
    out.push(pos, act);
    return out;
  }
  const out = [`${I}textbutton ${py(it.text ?? '')}:`, pos];
  if (it.size) out.push(`${I}${I}text_size ${it.size}`);
  if (it.color) out.push(`${I}${I}text_color ${py(it.color)}`);
  if (it.hoverColor) out.push(`${I}${I}text_hover_color ${py(it.hoverColor)}`);
  out.push(act);
  return out;
}

// pykaki_screens.rpy 글. 화면이 없으면 머리말만 (지운 화면이 게임에 남지 않게)
export function screensCode(p: Project): string {
  const out = ['# pygaki가 만든 화면이에요. 직접 고치면 다음 내보내기 때 덮어써져요.', '# 대본 편집기의 [화면] 탭에서 고쳐요.', ''];
  for (const s of p.screens ?? []) {
    out.push(`# ${(s.title || s.name).replace(/\s+/g, ' ')}`);
    out.push(`screen ${s.name}():`);
    out.push('    modal True');
    if (isColor(s.bg)) out.push(`    add Solid(${py(s.bg!)})`);
    else if (s.bg?.trim()) out.push(`    add ${imgRef(s.bg)}`);
    for (const it of s.items) out.push(...itemCode(it));
    if (out[out.length - 1] === '    modal True') out.push('    null');
    out.push('');
  }
  return out.join('\n') + '\n';
}
