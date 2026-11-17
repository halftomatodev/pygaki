// 글꼴 관리: 게임 폴더의 글꼴 목록, 글꼴 정보(fontInfo.ts), 쓰인 곳, 기본 글꼴(gui.rpy), 넣기·빼기.
// 화면은 [글꼴] 탭(FontsView.tsx). 데스크톱 앱에서만 (파일은 window.pygaki로 읽고 씀).
// - 글꼴 자리: game 폴더 바로 아래와 game/fonts (렌파이가 "fonts/이름.ttf"처럼 game 기준 경로로 찾음)
// - 기본 글꼴: gui.rpy의 define gui.text_font 같은 줄의 값만 바꾼다. 처음 바꾸기 전에 ui_kit_backup/gui/에 백업
// - 빼기: game/fonts 안의, 어디에도 안 쓰는 글꼴만. ui_kit_backup/fonts/에 백업한 뒤 지움
import type { Project } from './types';
import { desktop } from './desktop';
import { RPY_FILE, scanFolder, useGameFolder } from './gameFolder';
import { readFontInfo, type FontInfo } from './fontInfo';

export const FONT_EXT = /\.(ttf|otf|ttc)$/i; // 렌파이가 읽는 글꼴 (woff는 안 넣음)
export const RENPY_DEFAULT_FONT = 'DejaVuSans.ttf'; // 렌파이 안에 든 기본 글꼴 (한글 없음)

// 기본 글꼴 자리: gui.rpy의 값 이름
export type RoleId = 'text' | 'name' | 'interface' | 'choice';
export const ROLES: { id: RoleId; key: string; label: string; tip: string }[] = [
  { id: 'text', key: 'text_font', label: '대사', tip: '대사 글 (gui.text_font)' },
  { id: 'name', key: 'name_text_font', label: '이름', tip: '대사창의 말하는 사람 이름 (gui.name_text_font)' },
  { id: 'interface', key: 'interface_text_font', label: '메뉴·버튼', tip: '타이틀·저장·설정 화면 같은 메뉴와 버튼 글 (gui.interface_text_font)' },
  { id: 'choice', key: 'choice_button_text_font', label: '선택지', tip: '선택지 글 (gui.choice_button_text_font). 처음에는 대사와 같은 글꼴' },
];

// gui.rpy에 적힌 값: 글꼴 파일 / 다른 자리와 같게(gui.text_font 같은 식) / 그 밖의 식 / 줄 없음
export type RoleValue = { file: string } | { same: RoleId } | { expr: string } | null;

const lineRe = (key: string) => new RegExp(`^(define\\s+gui\\.${key}\\s*=\\s*)([^\\r\\n#]*?)(\\s*(?:#[^\\r\\n]*)?)$`, 'm');

export function readRoles(gui: string): Record<RoleId, RoleValue> {
  const out = {} as Record<RoleId, RoleValue>;
  for (const r of ROLES) {
    const m = lineRe(r.key).exec(gui);
    if (!m) {
      out[r.id] = null;
      continue;
    }
    const v = m[2].trim();
    const q = /^(?:"([^"]*)"|'([^']*)')$/.exec(v);
    const same = ROLES.find((x) => v === 'gui.' + x.key);
    out[r.id] = q ? { file: q[1] ?? q[2] } : same ? { same: same.id } : { expr: v };
  }
  return out;
}

// 그 자리가 실제로 쓰는 글꼴 파일 (같게 → 따라감). 모르면 null
export function roleFile(roles: Record<RoleId, RoleValue>, id: RoleId, depth = 0): string | null {
  const v = roles[id];
  if (!v) return id === 'choice' && depth < 3 ? roleFile(roles, 'text', depth + 1) : null;
  if ('file' in v) return v.file;
  if ('same' in v && depth < 3) return roleFile(roles, v.same, depth + 1);
  return null;
}

// gui.rpy 글에서 그 자리 값을 바꾼 글. value: 파일 경로, 또는 { same } (선택지를 대사와 같게)
export function writeRole(gui: string, id: RoleId, value: string | { same: RoleId }): string {
  const r = ROLES.find((x) => x.id === id)!;
  const code = typeof value === 'string' ? JSON.stringify(value) : 'gui.' + ROLES.find((x) => x.id === value.same)!.key;
  const re = lineRe(r.key);
  if (re.test(gui)) return gui.replace(re, (_m, head: string, _v: string, tail: string) => head + code + tail);
  const nl = gui.includes('\r\n') ? '\r\n' : '\n';
  return gui.replace(/\s*$/, '') + nl + nl + `## pygaki [글꼴] 탭에서 정한 ${r.label} 글꼴` + nl + `define gui.${r.key} = ${code}` + nl;
}

const two = (n: number) => String(n).padStart(2, '0');
const stamp = () => {
  const t = new Date();
  return `${t.getFullYear()}${two(t.getMonth() + 1)}${two(t.getDate())}-${two(t.getHours())}${two(t.getMinutes())}${two(t.getSeconds())}`;
};
const dec = new TextDecoder('utf-8', { ignoreBOM: true }); // gui.rpy 맨 앞의 BOM을 그대로 두고 다시 씀
const readGame = async (rel: string) => {
  const b = await desktop!.read('game/' + rel);
  return b ? dec.decode(b) : null;
};

let guiBackedUp = false; // 앱을 켠 동안 한 번만 백업
export async function readGui() {
  return (await readGame('gui.rpy')) ?? '';
}
export async function setRole(id: RoleId, value: string | { same: RoleId }) {
  const old = await readGame('gui.rpy');
  if (old === null) throw new Error('game/gui.rpy가 없어요');
  const next = writeRole(old, id, value);
  if (next === old) return null;
  let backup: string | null = null;
  if (!guiBackedUp) {
    backup = `ui_kit_backup/gui/gui.${stamp()}.rpy`;
    await desktop!.write(backup, old);
    guiBackedUp = true;
  }
  await desktop!.write('game/gui.rpy', next);
  await scanFolder(); // 대사 미리보기 글꼴도 새로
  return backup;
}

// ── 글꼴 정보 (파일을 읽어 둠. 다시 읽기 전까지 그대로) ──
const infos = new Map<string, { size: number; mtime: number; info: FontInfo | null }>();
export async function fontInfoOf(path: string): Promise<{ size: number; info: FontInfo | null } | null> {
  const st = await desktop!.stat('game/' + path);
  if (!st || st.dir) return null;
  const had = infos.get(path);
  if (had && had.size === st.size && had.mtime === st.mtime) return had;
  const b = await desktop!.read('game/' + path);
  if (!b) return null;
  const v = { size: st.size, mtime: st.mtime, info: readFontInfo(b) };
  infos.set(path, v);
  return v;
}

// ── 쓰인 곳 ──
export interface FontUses {
  roles: RoleId[]; // 기본 글꼴로 쓰는 자리
  lines: { nodeId: string; lineId: string }[]; // 대본에서 이 글꼴을 쓴 줄 (줄 글꼴, 이름 글꼴, {font=} 태그)
  files: { file: string; n: number }[]; // 게임 코드(.rpy)에서 이 경로를 적은 곳
}

const same = (a: string, b: string) => a.replace(/\\/g, '/').toLowerCase() === b.replace(/\\/g, '/').toLowerCase();

export function scriptUses(p: Project, path: string) {
  const out: FontUses['lines'] = [];
  const tagRe = new RegExp(`\\{font=${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'i');
  for (const n of p.nodes) {
    for (const l of n.lines)
      if ((l.say?.font && same(l.say.font, path)) || (l.say?.name_font && same(l.say.name_font, path)) || tagRe.test(l.text ?? '')) out.push({ nodeId: n.id, lineId: l.id });
    if (n.exit.type === 'menu') for (const c of n.exit.choices) if (tagRe.test(c.text)) out.push({ nodeId: n.id, lineId: c.id });
  }
  return out;
}

// 게임 코드에서 글꼴 경로를 찾는다. pygaki가 쓰는 원고(script_flow.rpy)는 대본으로 세니 빼고, gui.rpy는 기본 글꼴로 따로 셈
const CODE_SKIP_DIRS = new Set(['tl', 'cache', 'saves', 'images', 'movies', 'audio', 'fonts', 'ui_kit_backup']);
let codeCache: { at: number; files: { file: string; text: string }[] } | null = null;
async function codeFiles() {
  if (codeCache && Date.now() - codeCache.at < 3000) return codeCache.files;
  const files: { file: string; text: string }[] = [];
  const walk = async (rel: string, top: boolean) => {
    for (const e of (await desktop!.list('game' + (rel ? '/' + rel : ''))) ?? []) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.dir) {
        if (!(top && CODE_SKIP_DIRS.has(e.name.toLowerCase())) && !/^(editor|engine)$/i.test(e.name)) await walk(r, false);
      } else if (/\.rpy$/i.test(e.name) && !(top && (e.name === RPY_FILE || e.name === 'gui.rpy'))) {
        const t = await readGame(r);
        if (t !== null) files.push({ file: r, text: t });
      }
    }
  };
  await walk('', true);
  codeCache = { at: Date.now(), files };
  return files;
}

export async function fontUses(p: Project, path: string, roles: Record<RoleId, RoleValue>): Promise<FontUses> {
  const q = path.replace(/\\/g, '/').toLowerCase();
  const files: FontUses['files'] = [];
  for (const f of await codeFiles()) {
    const low = f.text.toLowerCase();
    let n = 0;
    for (const quote of ['"', "'"]) {
      let i = 0;
      while ((i = low.indexOf(quote + q + quote, i)) >= 0) (n++, (i += q.length + 2));
    }
    if (n) files.push({ file: f.file, n });
  }
  return { roles: ROLES.filter((r) => { const f = roleFile(roles, r.id); return !!f && same(f, path); }).map((r) => r.id), lines: scriptUses(p, path), files };
}
export const usedAnywhere = (u: FontUses) => u.roles.length + u.lines.length + u.files.length > 0;

// 대본에 쓴 글자 (대사, 선택지, 캐릭터 이름, 화면 글). 태그 {…}와 [변수]는 뺌
export function scriptText(p: Project) {
  const parts: string[] = [];
  for (const c of p.characters) parts.push(c.name);
  for (const n of p.nodes) {
    for (const l of n.lines) if (l.text) parts.push(l.text);
    if (n.exit.type === 'menu') {
      for (const c of n.exit.choices) parts.push(c.text);
      if (n.exit.ask?.text) parts.push(n.exit.ask.text);
    }
  }
  for (const s of p.screens ?? []) for (const it of s.items) if (it.text) parts.push(it.text);
  return parts.join('\n').replace(/\{[^{}]*\}/g, '').replace(/\[[^\[\]]*\]/g, '');
}

// ── 넣기·빼기 ──
// 고르기 창으로 하나. 돌려주는 값: game 기준 경로 (이미 game 안이면 그 경로), 취소면 null
export async function pickFont(): Promise<string | null> {
  const r = await desktop!.pickFile!('font');
  if (!r) return null;
  const rel = r.rel ?? (await desktop!.importFile!(r.token!, 'fonts'));
  await scanFolder();
  return rel;
}

// 끌어다 놓은 파일. 글꼴로 못 읽으면 넣지 않고 까닭을 돌려줌
export async function dropFont(file: File): Promise<{ rel?: string; why?: string }> {
  if (!FONT_EXT.test(file.name)) return { why: '.ttf, .otf, .ttc 파일만 넣을 수 있어요' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!readFontInfo(bytes)) return { why: '글꼴 파일로 읽지 못했어요' };
  const ext = file.name.slice(file.name.lastIndexOf('.'));
  const base = file.name.slice(0, -ext.length).replace(/[\\/:*?"<>|]/g, '_');
  let name = base + ext;
  for (let i = 2; await desktop!.stat('game/fonts/' + name); i++) name = `${base}_${i}${ext}`;
  await desktop!.write('game/fonts/' + name, bytes);
  await scanFolder();
  return { rel: 'fonts/' + name };
}

export const removable = (path: string) => /^fonts\//i.test(path) && FONT_EXT.test(path);

// 지우기 전에 ui_kit_backup/fonts/에 남긴다. 돌려주는 값은 백업한 자리
export async function removeFont(path: string): Promise<string> {
  if (!removable(path)) throw new Error('game/fonts 안의 글꼴만 뺄 수 있어요');
  const b = await desktop!.read('game/' + path);
  if (!b) throw new Error('파일이 없어요: ' + path);
  const name = path.split('/').pop()!;
  let as = 'ui_kit_backup/fonts/' + name;
  if (await desktop!.stat(as)) as = 'ui_kit_backup/fonts/' + name.replace(FONT_EXT, '') + '.' + stamp() + name.slice(name.lastIndexOf('.'));
  await desktop!.write(as, b);
  await desktop!.remove('game/' + path);
  infos.delete(path);
  await scanFolder();
  return as;
}

// 목록: 게임 폴더의 글꼴 (렌파이가 읽는 꼴만)
export const gameFonts = () => useGameFolder.getState().media.fonts.filter((f) => FONT_EXT.test(f));
