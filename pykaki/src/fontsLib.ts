// 글꼴 관리: 게임 폴더의 글꼴 목록, 글꼴 정보(fontInfo.ts), 쓰인 곳, 기본 글꼴(gui.rpy), 넣기·빼기.
// 화면은 [글꼴] 탭(FontsView.tsx). 데스크톱 앱에서만 (파일은 window.pygaki로 읽고 씀).
// - 글꼴 자리: game 폴더 바로 아래와 game/fonts (렌파이가 "fonts/이름.ttf"처럼 game 기준 경로로 찾음)
// - 기본 글꼴: gui.rpy의 define gui.text_font 같은 줄의 값만 바꾼다. 처음 바꾸기 전에 ui_kit_backup/gui/에 백업
// - 빼기: game/fonts 안의, 어디에도 안 쓰는 글꼴만. ui_kit_backup/fonts/에 백업한 뒤 지움
import type { Project } from './types';
import { desktop } from './desktop';
import { RPY_FILE, scanFolder, useGameFolder } from './gameFolder';
import { readFontInfo, type FontInfo } from './fontInfo';
import { commonHangul, subsetFont } from './fontSubset';

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
// 글꼴 묶음(group)은 config.font_name_map의 이름: 영문·숫자는 latin, 나머지는 main 글꼴로
export type RoleValue = { file: string } | { same: RoleId } | { expr: string } | ({ group: string } & FontGroupDef) | null;

const lineRe = (key: string) => new RegExp(`^(define\\s+gui\\.${key}\\s*=\\s*)([^\\r\\n#]*?)(\\s*(?:#[^\\r\\n]*)?)$`, 'm');

export function readRoles(gui: string): Record<RoleId, RoleValue> {
  const out = {} as Record<RoleId, RoleValue>;
  const groups = readGroups(gui);
  for (const r of ROLES) {
    const m = lineRe(r.key).exec(gui);
    if (!m) {
      out[r.id] = null;
      continue;
    }
    const v = m[2].trim();
    const q = /^(?:"([^"]*)"|'([^']*)')$/.exec(v);
    const same = ROLES.find((x) => v === 'gui.' + x.key);
    const name = q ? q[1] ?? q[2] : null;
    out[r.id] = name && groups[name] ? { group: name, ...groups[name] } : name ? { file: name } : same ? { same: same.id } : { expr: v };
  }
  return out;
}

// 그 자리가 실제로 쓰는 글꼴 파일 (같게 → 따라감). 모르면 null
export function roleFile(roles: Record<RoleId, RoleValue>, id: RoleId, depth = 0): string | null {
  const v = roles[id];
  if (!v) return id === 'choice' && depth < 3 ? roleFile(roles, 'text', depth + 1) : null;
  if ('file' in v) return v.file;
  if ('group' in v) return v.main;
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
  return changeGui((old) => {
    const r = readRoles(old)[id];
    if (typeof value === 'string' && r && 'group' in r) return writeGroup(old, r.group, { latin: r.latin, main: value });
    return writeRole(old, id, value);
  });
}

// ── 글꼴 묶음 (한글은 이 글꼴, 영문·숫자는 저 글꼴) ──
// 렌파이 FontGroup을 이름(config.font_name_map)으로 두고, gui.rpy의 글꼴 값은 그 이름(글자)으로 둔다.
// 그래서 gui.text_font를 글자로 다루는 코드(플러그인 설정 등)가 그대로 돈다:
//   define config.font_name_map["pygaki_text"] = FontGroup().add("fonts/en.ttf", 0x0020, 0x007e).add("fonts/ko.ttf", None, None)
//   define gui.text_font = "pygaki_text"
// 이 꼴(영문 범위 0x0020~0x007e + 나머지)만 알아본다. 다른 꼴은 그 밖의 식으로 둠
export interface FontGroupDef { latin: string; main: string }
export const LATIN_RANGE = 'U+20-7E'; // 앱 미리보기 (CSS unicode-range)
export const groupName = (id: RoleId) => 'pygaki_' + id;
const groupRe = /^define\s+config\.font_name_map\[\s*"([^"]+)"\s*\]\s*=\s*FontGroup\(\)\.add\(\s*"([^"]+)"\s*,\s*0x0020\s*,\s*0x007e\s*\)\.add\(\s*"([^"]+)"\s*,\s*None\s*,\s*None\s*\)[^\r\n]*$/gm;
export function readGroups(gui: string): Record<string, FontGroupDef> {
  const out: Record<string, FontGroupDef> = {};
  for (const m of gui.matchAll(groupRe)) out[m[1]] = { latin: m[2], main: m[3] };
  return out;
}
export function writeGroup(gui: string, name: string, def: FontGroupDef | null): string {
  const line = def && `define config.font_name_map[${JSON.stringify(name)}] = FontGroup().add(${JSON.stringify(def.latin)}, 0x0020, 0x007e).add(${JSON.stringify(def.main)}, None, None)`;
  return putManaged(gui, '## pygaki [글꼴] 탭에서 정한 글꼴 묶음 (영문·숫자는 다른 글꼴)', groupRe, name, line);
}
// 그 자리에 영문·숫자 글꼴을 정함 (null이면 묶음을 풀고 원래 글꼴로)
export async function setLatin(id: RoleId, latin: string | null) {
  return changeGui((old) => {
    const roles = readRoles(old);
    const r = roles[id];
    if (!latin) return r && 'group' in r ? writeRole(writeGroup(old, r.group, null), id, r.main) : old;
    const main = roleFile(roles, id) ?? RENPY_DEFAULT_FONT;
    const name = r && 'group' in r ? r.group : groupName(id);
    return writeRole(writeGroup(old, name, { latin, main }), id, name);
  });
}

// ── 굵은 글꼴 짝 ──
// {b} 태그·굵게(bold)일 때 렌파이는 글자를 억지로 두껍게 그린다. 짝을 정하면 그 파일로 바꿔 그린다:
//   define config.font_replacement_map["fonts/a.ttf", True, False] = ("fonts/a-Bold.ttf", False, False)
// 렌파이는 글꼴 경로 글자를 그대로 비교하니, 대본·gui.rpy에 쓴 경로와 똑같이 적는다
const boldRe = /^define\s+config\.font_replacement_map\[\s*(?:"([^"]+)"|'([^']+)')\s*,\s*True\s*,\s*False\s*\]\s*=\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*,\s*False\s*,\s*False\s*\)[^\r\n]*$/gm;
export function readBold(gui: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of gui.matchAll(boldRe)) out[m[1] ?? m[2]] = m[3] ?? m[4];
  return out;
}
export function writeBold(gui: string, font: string, bold: string | null): string {
  const line = bold && `define config.font_replacement_map[${JSON.stringify(font)}, True, False] = (${JSON.stringify(bold)}, False, False)`;
  return putManaged(gui, '## pygaki [글꼴] 탭에서 정한 굵은 글꼴 ({b} 태그에 쓸 파일)', boldRe, font, line);
}

// 우리가 머리말 아래에 모아 적는 줄(re의 첫 값이 key인 줄)을 바꾸거나 더하거나 지운다. 다른 줄은 그대로
function putManaged(gui: string, head: string, re: RegExp, key: string, line: string | null): string {
  const nl = gui.includes('\r\n') ? '\r\n' : '\n';
  const keyOf = (s: string) => {
    re.lastIndex = 0;
    const m = re.exec(s);
    re.lastIndex = 0;
    return m ? m[1] ?? m[2] : null;
  };
  let lines = gui.split(/\r?\n/);
  const at = lines.findIndex((l) => keyOf(l) === key);
  if (line) {
    if (at >= 0) lines[at] = line;
    else {
      const h = lines.indexOf(head);
      if (h >= 0) lines.splice(h + 1, 0, line);
      else {
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
        lines.push('', head, line, '');
      }
    }
    return lines.join(nl);
  }
  if (at < 0) return gui;
  lines.splice(at, 1);
  // 우리 줄이 하나도 안 남았으면 머리말과 그 앞 빈 줄도 지움
  if (!lines.some((l) => keyOf(l) !== null)) {
    const h = lines.indexOf(head);
    if (h >= 0) {
      lines.splice(h, 1);
      if (h > 0 && !lines[h - 1].trim() && (h >= lines.length || !lines[h]?.trim())) lines.splice(h - 1, 1);
    }
  }
  lines = lines.length ? lines : [''];
  return lines.join(nl);
}
export async function setBold(font: string, bold: string | null) {
  return changeGui((old) => writeBold(old, font, bold));
}
// 이름만 보고 굵은 짝을 짐작: "a.ttf" → "a-Bold.ttf", "a_Bold.ttf", "aBold.ttf", "a-B.ttf"
export function guessBold(font: string, fonts: string[]): string | null {
  const dot = font.lastIndexOf('.');
  const base = font.slice(0, dot).replace(/[-_ ]?(regular|r|medium|m)$/i, '').toLowerCase();
  if (/bold|[-_ ]b$/i.test(font.slice(0, dot))) return null;
  return fonts.find((f) => f !== font && new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[-_ ]?(bold|b)\\.(ttf|otf|ttc)$`, 'i').test(f)) ?? null;
}

// gui.rpy를 고쳐 쓴다. 앱을 켠 동안 처음 한 번만 백업. 돌려주는 값: 백업 자리 (안 했으면 null)
async function changeGui(edit: (old: string) => string) {
  const old = await readGame('gui.rpy');
  if (old === null) throw new Error('game/gui.rpy가 없어요');
  const next = edit(old);
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
  const inRole = (id: RoleId) => {
    const f = roleFile(roles, id);
    const v = roles[id];
    return (!!f && same(f, path)) || (!!v && 'group' in v && same(v.latin, path));
  };
  return { roles: ROLES.filter((r) => inRole(r.id)).map((r) => r.id), lines: scriptUses(p, path), files };
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

// ── 글꼴 줄이기 (쓴 글자만 남기기) ──
// 원본은 처음 한 번 ui_kit_backup/fonts/<이름>.full.<확장자>에 남기고(배포판에 안 들어감), 줄일 때마다 그 원본에서 다시 만든다.
// 경로가 그대로라 쓰는 곳(gui.rpy, 대본, 글꼴 묶음)은 안 고친다. 그 뒤에 대본에 새 글자를 쓰면 네모로 나오니, 배포 직전에 씀
export const fullBackup = (path: string) => {
  const name = path.split('/').pop()!;
  const ext = name.slice(name.lastIndexOf('.'));
  return 'ui_kit_backup/fonts/' + name.slice(0, -ext.length) + '.full' + ext;
};
export async function shrunkFrom(path: string) {
  return desktop!.stat(fullBackup(path));
}
// 남길 글자: 영문·숫자·기호(ASCII) + 대본 글 + 게임 코드(.rpy)의 글 + (고르면) 자주 쓰는 한글 2,350자
export async function usedCodes(p: Project, common: boolean): Promise<Set<number>> {
  const codes = new Set<number>();
  for (let c = 0x20; c <= 0x7e; c++) codes.add(c);
  const add = (s: string) => {
    for (const ch of s) {
      const c = ch.codePointAt(0)!;
      if (c >= 0x20) codes.add(c);
    }
  };
  add(scriptText(p));
  for (const f of await codeFiles()) add(f.text);
  if (common) {
    for (const c of commonHangul()) codes.add(c);
  }
  return codes;
}
export async function shrinkFont(p: Project, path: string, common: boolean) {
  const bk = fullBackup(path);
  let src = await desktop!.read(bk);
  const now = await desktop!.read('game/' + path);
  if (!now) throw new Error('파일이 없어요: ' + path);
  if (!src) src = now;
  const r = subsetFont(src, await usedCodes(p, common)); // 못 줄이면 여기서 오류 (원본은 아직 그대로)
  if (!(await desktop!.stat(bk))) await desktop!.write(bk, src);
  await desktop!.write('game/' + path, r.bytes);
  infos.delete(path);
  await scanFolder();
  return { full: src.length, before: now.length, after: r.bytes.length, chars: r.chars, backup: bk };
}
export async function restoreFont(path: string) {
  const bk = fullBackup(path);
  const src = await desktop!.read(bk);
  if (!src) throw new Error('원본 백업이 없어요: ' + bk);
  await desktop!.write('game/' + path, src);
  infos.delete(path);
  await scanFolder();
  return bk;
}
