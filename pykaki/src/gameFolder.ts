// 렌파이 game 폴더 연결: 그림/소리 목록, script_flow.rpy 쓰기, showpy_inbox.json 받아 적기.
// 크롬·엣지의 폴더 권한을 쓴다. 다른 브라우저에서는 연결 없이 지금처럼 글자로 적는다.
import { create } from 'zustand';
import { kvGet, kvSet, snapAdd } from './persist';
import { applyInbox, type InboxOp } from './inbox';
import { useStore } from './store';
import { gameDir, isDesktop, projectDir, projectInfo } from './desktop';
import { setFolderEffects, type EffectPack } from './fx/textShaders';
import { parseEffectsOff, refreshEffects, setEffectsOff } from './stage';
import { setShaderList, setShadersOff } from './shader';

const w = window as any;
export const hasDirPicker = typeof w.showDirectoryPicker === 'function' || isDesktop;
export const INBOX_FILE = 'showpy_inbox.json';
export const RPY_FILE = 'script_flow.rpy';
export const SHADER_LIST_FILE = 'shader_list.json'; // 셰이더 목록 (screen_fx 안, 플러그인이 씀. LINK.md 11장)
export const SHADERS_OFF_FILE = 'shaders_off.txt'; // 끈 셰이더 목록 (screen_fx 안)
export const EFFECTS_OFF_FILE = 'effects_off.txt'; // 끈 효과 목록 (ui_kit/effects 안, LINK.md 8-2)
export const GOTO_FILE = 'pykaki_goto.json'; // 자동 내보내기 뒤 게임이 옮겨 갈 줄 (showpy editor_preview.rpy가 읽음, LINK.md 7-1)

export interface Media {
  images: string[]; // "bg hall", "mina scared", "ghost", 영상도 같은 이름 규칙
  audio: string[]; // audio 폴더 기준 경로
  fonts: string[]; // game 폴더 기준 경로
  // 커서와 클릭 대기 표시의 그림 묶음: 그림이 든 폴더 하나가 한 묶음 (gui/ctc, gui/ctc/heart …). first는 첫 그림 (작은 그림용)
  frames?: { ctc: FrameSet[]; cursor: FrameSet[] };
}
export interface FrameSet { dir: string; first: string; n: number }

// 플레이 화면을 게임처럼 그리는 데 쓰는 값. gui.rpy 등에서 읽고, 없으면 렌파이 기본값 (1280x720)
export interface GameLook {
  width: number;
  height: number;
  textSize: number;
  nameSize: number;
  textColor: string;
  font: string | null;
  textboxHeight: number;
  textboxYalign: number;
  nameX: number;
  nameY: number;
  dialogueX: number;
  dialogueY: number;
  dialogueWidth: number;
  textCps: number; // 0이면 한 번에
  textbox: string | null; // gui/textbox.png
  namebox: string | null; // gui/namebox.png
  placed: Record<string, [number, number]>; // stage_layout.rpy. "태그" 또는 "상자|태그"
}

export const DEFAULT_LOOK: GameLook = {
  width: 1280, height: 720, textSize: 22, nameSize: 30, textColor: '#ffffff', font: null,
  textboxHeight: 185, textboxYalign: 1, nameX: 240, nameY: 0, dialogueX: 268, dialogueY: 50, dialogueWidth: 744,
  textCps: 0, textbox: null, namebox: null, placed: {},
};

interface F {
  name: string | null; // 연결한 폴더 이름
  media: Media;
  look: GameLook;
  startClash: string | null; // label start가 있는 다른 파일
  hasShowpy: boolean; // game 폴더에 ui_kit이 있는지
  fxErrors: [string, string][]; // 효과 폴더(ui_kit/effects)에서 못 읽은 파일과 이유
  endMarks: boolean; // 이 게임의 플러그인이 줄 끝 표시를 읽는지 (ui_kit 4.5, script_edit.rpy의 PK_END_MARKS)
  sceneUi: boolean | null; // custom_ui.scene이 있는지 (ui_kit 4.7). 플러그인이 없거나 폴더를 안 열었으면 null
  fxSeq: number; // 효과 목록이 바뀔 때마다 오른다 (목록을 쓰는 화면이 다시 그리게)
  fxFiles: string[]; // 효과 폴더에 있는 효과 파일 이름
  fxOff: string[]; // 끈 효과 이름 (effects_off.txt)
  shOff: string[]; // 끈 셰이더 이름 (screen_fx/shaders_off.txt)
  set(v: Partial<F>): void;
}

const NO_MEDIA: Media = { images: [], audio: [], fonts: [], frames: { ctc: [], cursor: [] } };

export const useGameFolder = create<F>((set) => ({
  name: null,
  media: NO_MEDIA,
  look: DEFAULT_LOOK,
  startClash: null,
  hasShowpy: false,
  fxErrors: [],
  endMarks: false,
  sceneUi: null,
  fxSeq: 0,
  fxFiles: [],
  fxOff: [],
  shOff: [],
  set: (v) => set(v),
}));

let dir: any = null;
// 웹: 프로젝트 폴더(game 폴더 위)를 골랐을 때 그 손잡이. 대본 파일(.flow.json)을 여기에 둔다. game 폴더를 바로 골랐으면 null
let proj: any = null;
let pictures = new Map<string, { path: string; video: boolean }>(); // 렌파이 그림 이름 → game 폴더 기준 경로
const urls = new Map<string, string>(); // 경로 → 읽어 둔 주소

// 렌파이 그림 이름: 파일 이름에서 확장자를 빼고 소문자로. 안쪽 폴더는 이름에 안 들어간다
export const imageNameOf = (file: string) => file.replace(/\.[^.]+$/, '').toLowerCase().split('@')[0].trim();
// 영상: 앞의 mask_는 투명 영상 표시라서 뺀다
export const movieNameOf = (file: string) => imageNameOf(file).replace(/^mask_/, '');

const IMG = /\.(png|jpe?g|webp|avif)$/i;
const MOV = /\.webm$/i;
const SND = /\.(ogg|opus|mp3|wav|flac)$/i;
const FONT = /\.(ttf|otf|ttc|woff2?)$/i;

async function walk(d: any, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  for await (const [name, h] of d.entries()) {
    if (h.kind === 'directory') out.push(...(await walk(h, prefix + name + '/')));
    else out.push(prefix + name);
  }
  return out;
}

async function sub(d: any, name: string) {
  try {
    return await d.getDirectoryHandle(name);
  } catch {
    return null;
  }
}

async function readText(d: any, name: string): Promise<string | null> {
  try {
    return await (await (await d.getFileHandle(name)).getFile()).text();
  } catch {
    return null;
  }
}

async function writeText(d: any, name: string, text: string) {
  const ws = await (await d.getFileHandle(name, { create: true })).createWritable();
  await ws.write(text);
  await ws.close();
}

// game 폴더 기준 경로의 파일을 브라우저 주소로. 없으면 null
export async function fileUrl(path: string): Promise<string | null> {
  if (!dir) return null;
  const had = urls.get(path);
  if (had) return had;
  try {
    let d = dir;
    const parts = path.split('/').filter(Boolean);
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p);
    const url = URL.createObjectURL(await (await d.getFileHandle(parts[parts.length - 1])).getFile());
    urls.set(path, url);
    return url;
  } catch {
    return null;
  }
}

export async function pictureOf(name: string) {
  const p = pictures.get(name);
  if (!p) return null;
  const url = await fileUrl(p.path);
  return url ? { url, video: p.video } : null;
}

// 대본의 소리 파일 이름은 audio 폴더 기준일 수도, game 폴더 기준일 수도 있다
export const soundUrl = async (file: string) => (await fileUrl(file)) ?? (await fileUrl('audio/' + file));

// 게임 글꼴을 브라우저에 등록하고 글꼴 이름을 돌려준다. 다 읽기 전에는 다음 글꼴로 보인다
const families = new Map<string, string>();
let familySeq = 0; // 폴더를 다시 읽어도 이름이 겹치지 않게 계속 센다
export function gameFont(path: string | null | undefined) {
  if (!path || !dir) return undefined;
  let name = families.get(path);
  if (!name) {
    name = 'pk-game-' + familySeq++;
    families.set(path, name);
    const family = name;
    void fileUrl(path)
      .then(async (u) => {
        if (!u) return;
        const ff = new FontFace(family, `url(${u})`);
        document.fonts.add(await ff.load());
      })
      .catch((e) => console.warn('글꼴을 못 읽었어요', path, e));
  }
  return name;
}

const num = (src: string, key: string, def: number) => {
  const m = new RegExp(`^define\\s+gui\\.${key}\\s*=\\s*(-?[\\d.]+)`, 'm').exec(src);
  return m ? Number(m[1]) : def;
};
const quoted = (src: string, key: string) => new RegExp(`^define\\s+gui\\.${key}\\s*=\\s*"([^"]+)"`, 'm').exec(src)?.[1] ?? null;

// 게임의 설정 파일을 읽는다. 게임 안의 코드는 실행하지 않고 값만 찾는다
async function readLook(): Promise<GameLook> {
  const d = DEFAULT_LOOK;
  const gui = (await readText(dir, 'gui.rpy')) ?? '';
  const size = /gui\.init\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(gui);
  const options = (await readText(dir, 'options.rpy')) ?? '';
  const uiKit = await sub(dir, 'ui_kit');
  const uiConfig = uiKit ? (await readText(uiKit, 'custom_ui_config.rpy')) ?? '' : '';
  const layout = uiKit ? (await readText(uiKit, 'stage_layout.rpy')) ?? '' : '';
  const cps = /^define\s+custom_ui\.text_cps\s*=\s*(\d+)/m.exec(uiConfig) ?? /^default\s+preferences\.text_cps\s*=\s*(\d+)/m.exec(options);

  const placed: GameLook['placed'] = {};
  for (const m of layout.matchAll(/(?:"(\w+)"|\(\s*"([^"]+)"\s*,\s*"(\w+)"\s*\))\s*:\s*"stage\.pos\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/g))
    placed[m[1] ?? m[2] + '|' + m[3]] = [Number(m[4]), Number(m[5])];

  return {
    width: size ? Number(size[1]) : d.width,
    height: size ? Number(size[2]) : d.height,
    textSize: num(gui, 'text_size', d.textSize),
    nameSize: num(gui, 'name_text_size', d.nameSize),
    textColor: quoted(gui, 'text_color') ?? d.textColor,
    font: quoted(gui, 'text_font'),
    textboxHeight: num(gui, 'textbox_height', d.textboxHeight),
    textboxYalign: num(gui, 'textbox_yalign', d.textboxYalign),
    nameX: num(gui, 'name_xpos', d.nameX),
    nameY: num(gui, 'name_ypos', d.nameY),
    dialogueX: num(gui, 'dialogue_xpos', d.dialogueX),
    dialogueY: num(gui, 'dialogue_ypos', d.dialogueY),
    dialogueWidth: num(gui, 'dialogue_width', d.dialogueWidth),
    textCps: cps ? Number(cps[1]) : d.textCps,
    textbox: await fileUrl('gui/textbox.png'),
    namebox: await fileUrl('gui/namebox.png'),
    placed,
  };
}

export async function scanFolder() {
  if (!dir) return;
  // 그림을 바꾸고 돌아와도 새 파일이 보이게 다시 읽는다. 옛 주소는 화면이 새 값을 받은 뒤에 버린다
  const oldUrls = [...urls.values()];
  urls.clear();
  families.clear();
  const media: Media = { images: [], audio: [], fonts: [] };
  const found = new Map<string, { path: string; video: boolean }>();
  const images = await sub(dir, 'images');
  if (images) for (const f of await walk(images)) if (IMG.test(f)) found.set(imageNameOf(f.split('/').pop()!), { path: 'images/' + f, video: false });
  const movies = await sub(dir, 'movies');
  if (movies) for (const f of await walk(movies)) if (MOV.test(f)) found.set(movieNameOf(f.split('/').pop()!), { path: 'movies/' + f, video: true });
  pictures = found;
  media.images = [...found.keys()].sort();
  const audio = await sub(dir, 'audio');
  if (audio) for (const f of await walk(audio)) if (SND.test(f)) media.audio.push(f);
  media.audio.sort();
  for await (const [name, h] of dir.entries()) if (h.kind === 'file' && FONT.test(name)) media.fonts.push(name);
  const fonts = await sub(dir, 'fonts');
  if (fonts) for (const f of await walk(fonts)) if (FONT.test(f)) media.fonts.push('fonts/' + f);
  media.fonts.sort();
  // 커서·클릭 대기 그림 묶음 (custom_ui.scene의 ctc=, cursor=에 적는 폴더)
  const gui = await sub(dir, 'gui');
  const sets = async (name: 'ctc' | 'cursor') => {
    const d = gui ? await sub(gui, name) : null;
    if (!d) return [];
    const by = new Map<string, string[]>();
    for (const f of await walk(d)) {
      if (!/\.(png|webp|jpe?g)$/i.test(f)) continue;
      const at = f.lastIndexOf('/');
      const k = at < 0 ? '' : f.slice(0, at);
      by.set(k, [...(by.get(k) ?? []), f]);
    }
    return [...by.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, fs]) => ({ dir: `gui/${name}` + (k ? '/' + k : ''), first: `gui/${name}/` + fs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0], n: fs.length }));
  };
  media.frames = { ctc: await sets('ctc'), cursor: await sets('cursor') };
  const look = await readLook();

  // 대본에 이름이 start인 label을 만들면 script.rpy의 label start와 겹친다
  let startClash: string | null = null;
  for await (const [name, h] of dir.entries()) {
    if (h.kind !== 'file' || !/\.rpy$/i.test(name) || name === RPY_FILE) continue;
    if (/^label\s+start\s*(\(|:)/m.test(await (await h.getFile()).text())) {
      startClash = name;
      break;
    }
  }
  const uiKit = await sub(dir, 'ui_kit');
  const hasShowpy = !!uiKit;
  // 효과 폴더: ui_kit/effects/*.glsl (showpy text_effects.rpy가 읽는 것과 같은 파일)
  // 플러그인이 있는 게임이면 그 폴더의 파일만 쓴다 (샘플도 게임에서 뺐으면 목록에서 빠짐). 없으면 앱에 든 샘플
  const packs: EffectPack[] = [];
  const fxDir = uiKit ? await sub(uiKit, 'effects') : null;
  if (fxDir)
    for await (const [name, h] of fxDir.entries())
      if (h.kind === 'file' && /\.glsl$/i.test(name)) packs.push({ name, text: await (await h.getFile()).text() });
  const fxOff = parseEffectsOff((fxDir && (await readText(fxDir, EFFECTS_OFF_FILE))) || '');
  const fxErrors = setFolderEffects(uiKit ? packs : null);
  setEffectsOff(fxOff);
  refreshEffects();
  // 화면 셰이더: 플러그인이 내놓은 목록과 끈 목록 (shader.ts)
  const sfx = await sub(dir, 'screen_fx');
  setShaderList(sfx ? await readText(sfx, SHADER_LIST_FILE) : null);
  const shOff = parseEffectsOff((sfx && (await readText(sfx, SHADERS_OFF_FILE))) || '');
  setShadersOff(shOff);
  const engine = uiKit ? await sub(uiKit, 'engine') : null;
  const endMarks = /^\s*PK_END_MARKS\s*=\s*True/m.test((engine && (await readText(engine, 'script_edit.rpy'))) || '');
  const cuText = engine ? await readText(engine, 'custom_ui.rpy') : null;
  const sceneUi = cuText === null ? null : /^\s*def scene\(/m.test(cuText);
  const g = useGameFolder.getState();
  if (fxErrors.length && JSON.stringify(fxErrors) !== JSON.stringify(g.fxErrors))
    useStore.getState().say('효과 폴더에서 못 읽은 파일: ' + fxErrors.map(([f, why]) => `${f} (${why})`).join(' / '));
  g.set({ name: g.name ?? dir.name, media, look, startClash, hasShowpy, endMarks, sceneUi, fxErrors, fxSeq: g.fxSeq + 1, fxFiles: packs.map((f) => f.name).sort(), fxOff, shOff });
  setTimeout(() => oldUrls.forEach((u) => URL.revokeObjectURL(u)), 5000);
}

// 권한은 프로젝트 폴더에 받으면 안의 game 폴더까지 같이 된다
const allowed = async (ask: boolean) => {
  const root = proj ?? dir;
  if (!root) return false;
  const o = { mode: 'readwrite' };
  if ((await root.queryPermission(o)) === 'granted') return true;
  return ask ? (await root.requestPermission(o)) === 'granted' : false;
};

// 고른 폴더가 프로젝트 폴더면 그 안의 game을 쓴다
export async function connectFolder(pull = true) {
  try {
    const picked = await w.showDirectoryPicker({ id: 'pykaki-game', mode: 'readwrite' });
    const inner = await sub(picked, 'game');
    dir = inner ?? picked;
    proj = inner ? picked : null;
    await kvSet('gameDir', dir);
    await kvSet('projectDir', proj);
    await scanFolder();
    await kvSet('gameName', inner ? picked.name : dir.name);
    useGameFolder.getState().set({ name: inner ? picked.name : dir.name });
    if (pull) await pullInbox();
    useStore.getState().say(`렌파이 폴더 "${useGameFolder.getState().name}"를 연결했어요`);
    return true;
  } catch (e: any) {
    if (e?.name !== 'AbortError') alert('폴더를 연결하지 못했어요: ' + e.message);
    return false;
  }
}

export async function disconnectFolder() {
  dir = null;
  proj = null;
  await kvSet('gameDir', null);
  await kvSet('projectDir', null);
  pictures = new Map();
  setFolderEffects(null);
  setEffectsOff([]);
  setShaderList(null);
  setShadersOff([]);
  refreshEffects();
  useGameFolder.getState().set({ name: null, media: NO_MEDIA, look: DEFAULT_LOOK, startClash: null, hasShowpy: false, endMarks: false, sceneUi: null, fxErrors: [], fxSeq: useGameFolder.getState().fxSeq + 1, fxFiles: [], fxOff: [] });
}

// 앱을 다시 열 때: 연결은 기억하지만, 권한은 사용자가 한 번 눌러야 다시 생긴다
export async function restoreFolder() {
  // 데스크톱 앱: 연 렌파이 프로젝트의 game 폴더가 곧 연결한 폴더
  if (isDesktop) {
    dir = gameDir();
    const { name } = await projectInfo();
    useGameFolder.getState().set({ name });
    await scanFolder();
    useGameFolder.getState().set({ name });
    return;
  }
  if (!hasDirPicker) return;
  try {
    dir = (await kvGet('gameDir')) ?? null;
    proj = (await kvGet('projectDir')) ?? null;
    if (!dir) return;
    const name = (await kvGet('gameName')) ?? dir.name;
    useGameFolder.getState().set({ name });
    if (await allowed(false)) await scanFolder();
    useGameFolder.getState().set({ name });
  } catch {
    dir = null;
    proj = null;
  }
}

export const folderReady = () => !!dir;

// 웹: 연결한 프로젝트 폴더의 대본 파일 (SPEC 9-3). 권한은 부르는 쪽이 먼저 얻는다
export const hasProjectFolder = () => !isDesktop && !!proj;
export async function projectFlows(): Promise<string[]> {
  if (!proj) return [];
  const out: string[] = [];
  for await (const [name, h] of proj.entries()) if (h.kind === 'file' && /\.flow\.json$/i.test(name)) out.push(name);
  return out.sort();
}
export const projectFlowHandle = (name: string) => proj.getFileHandle(name, { create: true });

// 받아 적기. 받은 것이 있으면 저장본을 먼저 남기고, 다 적은 기록은 파일에서 지운다
export async function pullInbox(ask = false) {
  if (!(await allowed(ask))) return 0;
  const text = await readText(dir, INBOX_FILE);
  if (!text) return 0;
  let ops: InboxOp[] = [];
  try {
    ops = JSON.parse(text).ops ?? [];
  } catch {
    return 0; // showpy가 쓰는 중이면 다음에 다시 읽는다
  }
  if (!ops.length) return 0;
  const s = useStore.getState();
  await snapAdd('받아 적기 전 자동 백업', s.project).catch(() => {});
  let res = { applied: 0, moved: [] as string[], dropped: [] as string[] };
  s.update((p) => void (res = applyInbox(p, ops)));

  // 읽는 동안 showpy가 더 적었으면 그 기록은 남긴다
  const done = new Set(ops.map((o) => o.id));
  let rest: InboxOp[] = [];
  try {
    rest = (JSON.parse((await readText(dir, INBOX_FILE)) ?? '{}').ops ?? []).filter((o: InboxOp) => !done.has(o.id));
  } catch {
    /* 비운다 */
  }
  await writeText(dir, INBOX_FILE, JSON.stringify({ format: 'showpy-inbox', version: 1, ops: rest }, null, 2));

  const extra = [res.moved.length ? `기준 줄이 없어 상자 끝에 넣음 ${res.moved.length}개` : '', res.dropped.length ? `넣을 곳이 없어 뺌: ${res.dropped.join(', ')}` : ''].filter(Boolean).join(' / ');
  s.say(`GUI 편집기에서 고친 ${res.applied}곳을 받아 적었어요${extra ? ' (' + extra + ')' : ''}`);
  return res.applied;
}

// 고른 폴더가 렌파이 프로젝트인지. 새 프로젝트에는 늘 gui.rpy나 options.rpy가 있다
export const looksLikeGame = async () => (await readText(dir, 'gui.rpy')) !== null || (await readText(dir, 'options.rpy')) !== null;
export const readRpyFromFolder = () => readText(dir, RPY_FILE);

export async function writeRpyToFolder(code: string, goto?: { line: number | null }) {
  // 옮겨 갈 줄을 먼저 적는다. 게임은 원고가 바뀐 것을 보고 이 파일을 읽는다
  if (goto) await writeText(dir, GOTO_FILE, JSON.stringify({ format: 'pykaki-goto', version: 1, file: 'game/' + RPY_FILE, line: goto.line, time: Date.now() }));
  await writeText(dir, RPY_FILE, code);
}

// 덮어쓰기 전 원고를 남긴다. 렌파이는 .bak을 읽지 않고 배포판에도 넣지 않는다
export const backupRpy = (old: string) => writeText(dir, RPY_FILE + '.bak', old).catch((e) => console.warn('원고 백업 실패', e));

export { allowed as folderAllowed };

// ── 효과 폴더의 파일 다루기 (effectsLib.ts가 씀). 권한은 부르는 쪽이 먼저 얻는다 ──
const BACKUP_DIR = 'ui_kit_backup'; // showpy script_edit.rpy가 원고 백업을 두는 곳과 같은 폴더
const fxFolder = async (create: boolean) => {
  const uiKit = dir && (await sub(dir, 'ui_kit'));
  if (!uiKit) return null;
  return create ? uiKit.getDirectoryHandle('effects', { create: true }) : sub(uiKit, 'effects');
};
export async function readFxFile(name: string): Promise<string | null> {
  const d = await fxFolder(false);
  return d ? readText(d, name) : null;
}
// 화면 효과 플러그인 폴더(game/screen_fx)의 글 파일. 폴더가 없으면 읽기는 null, 쓰기는 오류
export async function readSfxFile(name: string): Promise<string | null> {
  const d = dir ? await sub(dir, 'screen_fx') : null;
  return d ? readText(d, name) : null;
}
export async function writeSfxFile(name: string, text: string) {
  const d = dir ? await sub(dir, 'screen_fx') : null;
  if (!d) throw new Error('이 게임에 화면 효과 플러그인(screen_fx 폴더)이 없어요');
  await writeText(d, name, text);
}
export async function writeFxFile(name: string, text: string) {
  const d = await fxFolder(true);
  if (!d) throw new Error('이 게임에 pygaki 플러그인(ui_kit)이 없어요');
  await writeText(d, name, text);
}
// 효과 파일을 지운다. 지우기 전의 글은 프로젝트 폴더의 ui_kit_backup/effects/에 남긴다 (배포판에서 빠지는 폴더).
// 웹에서 game 폴더를 바로 골랐으면 프로젝트 폴더에 못 써서 game/ui_kit_backup/effects/에 둔다. 돌려주는 값은 백업한 자리
export async function removeFxFile(name: string): Promise<string> {
  const d = await fxFolder(false);
  const text = d ? await readText(d, name) : null;
  if (text === null) throw new Error('효과 폴더에 그 파일이 없어요: ' + name);
  const root = isDesktop ? projectDir() : proj;
  const base = await (root ?? dir).getDirectoryHandle(BACKUP_DIR, { create: true });
  const keep = await base.getDirectoryHandle('effects', { create: true });
  let as = name;
  if ((await readText(keep, name)) !== null) {
    const t = new Date();
    const two = (n: number) => String(n).padStart(2, '0');
    const stamp = `${t.getFullYear()}${two(t.getMonth() + 1)}${two(t.getDate())}-${two(t.getHours())}${two(t.getMinutes())}${two(t.getSeconds())}`;
    as = name.replace(/\.glsl$/i, '') + '.' + stamp + '.glsl';
  }
  await writeText(keep, as, text);
  await d.removeEntry(name);
  return (root ? '' : 'game/') + BACKUP_DIR + '/effects/' + as;
}
