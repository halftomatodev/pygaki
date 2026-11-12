// 파일 저장/열기/.rpy 내보내기. 크롬·엣지는 같은 파일에 덮어쓰기, 그 외 브라우저는 다운로드.
import { useFolded } from './Card';
import { useStore } from './store';
import { createEmpty, normalizeProject } from './sample';
import { generateRpy as generateRpyWith } from './exportRpy';
import { snapAdd, snapAuto } from './persist';
import { desktop, isDesktop } from './desktop';
import { usePrefs } from './prefs';
import { backupRpy, folderAllowed, folderReady, hasDirPicker, pullInbox, readRpyFromFolder, RPY_FILE, scanFolder, useGameFolder, writeRpyToFolder } from './gameFolder';
import { BUILD, FEATURE } from './version';
import type { Project } from './types';

const w = window as any;
const hasFS = typeof w.showSaveFilePicker === 'function';
let jsonHandle: any = null;
let rpyHandle: any = null;

export const hasRpyTarget = () => !!rpyHandle;

// 쓴 판을 붙여서 파일 글로. needs는 내려가지 않는다(더 새 판이 쓴 대본을 옛 판이 저장해도 경고가 남게)
export function serialize(p: Project) {
  const app = { by: isDesktop ? 'pygaki 앱' : 'PyKaki 웹', build: BUILD, needs: Math.max(p.app?.needs ?? 0, FEATURE) };
  return JSON.stringify({ ...p, app }, null, 2);
}

// 이 판보다 새 판에서 쓴 대본인지
export const newerThanMe = (p: Project) => (p.app?.needs ?? 0) > FEATURE;
export function warnNewer(p: Project) {
  if (newerThanMe(p)) useStore.getState().say(`더 새 판(${p.app!.by} ${p.app!.build})에서 쓴 대본이에요. 이 판으로 내보내면 일부 줄이 빠질 수 있어요`);
}

export function summary(p: Project, time?: number) {
  const lines = p.nodes.reduce((a, n) => a + n.lines.length, 0);
  const parts = [`상자 ${p.nodes.length}개, 줄 ${lines}개`];
  if (time) parts.push(new Date(time).toLocaleString('ko-KR'));
  if (p.app) parts.push(`${p.app.by}에서 저장`);
  return parts.join(', ');
}

// ── 프로젝트 대본 파일 (SPEC 9-3) ──
// 앱은 늘, 웹은 렌파이 프로젝트 폴더를 연결했을 때, 대본을 프로젝트 폴더 맨 위의 .flow.json 하나에 둔다.
// seen: 이 창이 마지막으로 읽거나 쓴 파일 글의 지문. 파일이 이것과 다르면 다른 곳(웹, 앱, 다른 창)이 고친 것
let bound = false;
let boundName: string | null = null;
let seen: string | null = null;
// 이 창이 쓴 글의 지문들. 앞서 쓴 것이 늦게 보여도(쓰는 도중에 읽음) 밖에서 바뀐 것으로 치지 않는다
const mine: string[] = [];
let writing = 0;
const outside = (cur: string) => {
  const h = hash(cur);
  return h !== seen && !mine.includes(h);
};

const hash = (t: string) => {
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = (h * 33 + t.charCodeAt(i)) | 0;
  return t.length + ':' + (h >>> 0).toString(36);
};

// 앱은 켤 때마다 파일을 읽으니 지문을 남기지 않는다(앱 창들이 저장소를 같이 씀)
async function setSeen(text: string | null) {
  seen = text === null ? null : hash(text);
}

// 데스크톱 앱: 대본은 프로젝트 폴더의 .flow.json 하나에 저장한다 (main.tsx가 열 때 정함). text는 연 파일의 글(새 파일이면 null)
export function setProjectFile(handle: any, text: string | null) {
  jsonHandle = handle;
  bound = true;
  boundName = handle.name;
  void setSeen(text);
}
export const projectFileName = () => (bound ? boundName : null);

async function handleOf() {
  return jsonHandle;
}

async function readCurrent(): Promise<string | null> {
  try {
    // 빈 파일은 없는 것으로 (웹은 손잡이를 얻을 때 빈 파일이 생김)
    return (await (await (await handleOf()).getFile()).text()) || null;
  } catch {
    return null;
  }
}

// 파일이 밖에서 바뀌었을 때 묻기. 'took' 밖의 것을 읽음, 'kept' 지금 것을 씀(다음 저장 때 덮어씀), 'wait' 아직 못 정함
let asking = false;
async function resolveExternal(cur: string): Promise<'took' | 'kept' | 'wait'> {
  if (asking) return 'wait';
  let p: Project;
  try {
    p = normalizeProject(JSON.parse(cur));
  } catch {
    return 'wait'; // 쓰는 도중이면 다음에 다시
  }
  asking = true;
  try {
    const s = useStore.getState();
    const yes = confirm(
      `대본 파일 ${boundName}이 다른 곳(다른 창이나 다른 프로그램)에서 바뀌었어요.\n\n` +
        `파일: ${summary(p)}\n지금 화면: ${summary(s.project)}\n\n` +
        `[확인] 파일을 다시 읽어요${s.dirty ? ' (여기서 고친 것은 버전 목록에 백업돼요)' : ''}\n[취소] 지금 화면의 대본을 쓰고, 다음 저장 때 파일을 덮어써요`,
    );
    await setSeen(cur);
    if (yes) {
      await snapAdd('다시 읽기 전 자동 백업', s.project).catch(() => {});
      s.load(p, { fileName: boundName, dirty: false });
      s.say(`${boundName}을 다시 읽었어요`);
      warnNewer(p);
      return 'took';
    }
    useStore.setState({ dirty: true });
    return 'kept';
  } finally {
    asking = false;
  }
}

// 창으로 돌아올 때, 앱이 파일 바뀜을 알릴 때
export async function checkExternal() {
  if (!bound || asking || writing) return;
  const cur = await readCurrent();
  if (cur !== null && !writing && outside(cur)) await resolveExternal(cur);
}

// 프로젝트 대본 파일에 쓰기. 밖에서 바뀌었으면 먼저 묻는다. 썼으면 true
async function writeBound(text: string, ask: boolean) {
  const cur = await readCurrent();
  if (cur !== null && cur !== text && outside(cur) && (await resolveExternal(cur)) !== 'kept') return false;
  await setSeen(text);
  mine.push(seen!);
  if (mine.length > 20) mine.shift();
  writing++;
  try {
    await writeTo(await handleOf(), text);
  } finally {
    writing--;
  }
  return true;
}

// 알림 없이 지금 대본을 그 파일에 쓴다 (데스크톱 앱의 자동 저장)
export async function saveQuiet() {
  if (!bound) return false;
  const project = useStore.getState().project;
  if (!(await writeBound(serialize(project), false))) return false;
  if (useStore.getState().project === project) useStore.setState({ dirty: false, fileName: boundName });
  return true;
}

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function writeTo(handle: any, text: string) {
  const ws = await handle.createWritable();
  await ws.write(text);
  await ws.close();
}

const aborted = (e: any) => e?.name === 'AbortError';

export async function saveProject(as = false) {
  const s = useStore.getState();
  const text = serialize(s.project);
  const name = s.fileName ?? `${s.project.project.title || 'script'}.flow.json`;
  try {
    if (bound && !as) {
      if (!(await writeBound(text, true))) return;
      useStore.setState({ dirty: false, fileName: boundName });
    } else if (bound && hasFS) {
      // 프로젝트 대본 파일은 그대로 두고 사본만 따로 저장한다
      const h = await w.showSaveFilePicker({ suggestedName: name, types: [{ description: 'pygaki 대본', accept: { 'application/json': ['.json'] } }] });
      await writeTo(h, text);
      s.say(`${h.name}에 사본을 저장했어요. 대본은 계속 ${boundName}에 저장돼요`);
      return;
    } else if (hasFS) {
      if (!jsonHandle || as)
        jsonHandle = await w.showSaveFilePicker({
          suggestedName: name,
          types: [{ description: "pygaki 대본", accept: { 'application/json': ['.json'] } }],
        });
      await writeTo(jsonHandle, text);
      useStore.setState({ dirty: false, fileName: jsonHandle.name });
    } else {
      download(name, text);
      useStore.setState({ dirty: false, fileName: name });
    }
    s.say('파일로 저장했어요');
  } catch (e: any) {
    if (!aborted(e)) alert('저장 실패: ' + e.message);
  }
}

function pickFileFallback(): Promise<File | null> {
  return new Promise((res) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => res(inp.files?.[0] ?? null);
    inp.click();
  });
}

const confirmDiscard = () =>
  !useStore.getState().dirty || confirm('파일로 저장하지 않은 변경이 있어요. 계속할까요?\n(지금 상태는 버전 목록에 자동 백업돼요)');

export async function openProject() {
  if (!bound && !confirmDiscard()) return; // 프로젝트 대본이면 가져오기 전에 따로 묻는다
  let file: File | null = null;
  let handle: any = null;
  try {
    if (typeof w.showOpenFilePicker === 'function') {
      [handle] = await w.showOpenFilePicker({ types: [{ description: "pygaki 대본", accept: { 'application/json': ['.json'] } }] });
      file = await handle.getFile();
    } else file = await pickFileFallback();
  } catch (e: any) {
    if (!aborted(e)) alert('열기 실패: ' + e.message);
    return;
  }
  if (!file) return;
  try {
    const p = normalizeProject(JSON.parse(await file.text()));
    const s = useStore.getState();
    // 프로젝트 대본 파일이 있으면: 고른 파일의 내용을 이 프로젝트의 대본으로 가져온다 (저장은 계속 프로젝트 폴더의 파일에)
    if (bound) {
      if (
        !confirm(
          `${file.name}의 내용으로 이 프로젝트 대본(${boundName})을 바꿀까요?\n\n가져올 대본: ${summary(p, file.lastModified)}\n지금 대본: ${summary(s.project)}\n\n` +
            `지금 대본은 버전 목록에 백업돼요. GUI 편집기에서 받아 적은 줄도 가져올 대본의 것으로 바뀌어요.`,
        )
      )
        return;
      await snapAdd('가져오기 전 자동 백업', s.project).catch(() => {});
      s.load(p, { fileName: boundName, dirty: true });
      s.say(`${file.name}의 내용을 이 프로젝트 대본으로 가져왔어요`);
      warnNewer(p);
      return;
    }
    await snapAdd('열기 전 자동 백업', s.project).catch(() => {});
    jsonHandle = handle;
    s.load(p, { fileName: file.name, dirty: false });
    warnNewer(p);
  } catch (e: any) {
    alert('파일을 읽을 수 없어요: ' + e.message);
  }
}

export async function newProject() {
  if (bound) {
    if (!confirm('이 프로젝트의 대본을 비우고 새로 시작할까요?\n(지금 대본은 버전 목록에 자동 백업돼요)')) return;
  } else if (!confirmDiscard()) return;
  const s = useStore.getState();
  await snapAdd('새로 만들기 전 자동 백업', s.project).catch(() => {});
  if (bound) return s.load(createEmpty(), { fileName: boundName, dirty: true });
  jsonHandle = null;
  s.load(createEmpty(), { fileName: null, dirty: false });
}

export async function exportRpyFile(again = false) {
  let s = useStore.getState();
  // showpy 연결: 연결한 폴더의 script_flow.rpy에 바로 쓴다. 쓰기 전에 showpy가 넣은 줄부터 받아 적어야 안 사라진다
  const toFolder = hasDirPicker && (s.project.settings.renpyLink || folderReady());
  if (toFolder) {
    if (!folderReady()) return;
    if (!(await folderAllowed(true))) {
      alert('렌파이 폴더에 쓸 권한이 없어요. 권한을 허용해 주세요.');
      return;
    }
    try {
      await pullInbox(true);
      await scanFolder();
    } catch (e: any) {
      alert('GUI 편집기가 넣은 줄을 받아 적지 못해서 내보내기를 멈췄어요: ' + e.message);
      return;
    }
    s = useStore.getState();
  }
  const { code, warnings } = makeRpy(s.project);
  const errors = warnings.filter((x) => x.level === 'error').length;
  if (errors && !confirm(`오류 ${errors}개가 있어요. 이대로 내보내면 렌파이에서 실행이 안 될 수 있어요. 계속할까요?`)) {
    useStore.setState({ hideLeft: false });
    useFolded.setState({ warn: false }); // 왼쪽 카드는 접혀서 시작하니 검사 카드를 펼친다
    document.getElementById('warn-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  try {
    if (toFolder) {
      // 다른 대본으로 만든 원고면 묻고, 덮어쓰기 전 원고는 script_flow.rpy.bak으로 남긴다
      if (lastAuto === null) {
        const old = await readRpyFromFolder();
        const lost = foreignBoxes(old, s.project);
        if (lost && !confirm(`${RPY_FILE}에 지금 대본에 없는 상자가 ${lost}개 있어요. 다른 대본으로 만든 원고 같아요.
지금 대본으로 덮어쓸까요? (지금 원고는 ${RPY_FILE}.bak으로 남겨요)`)) return;
        if (old && old !== code) await backupRpy(old);
      }
      await snapAuto('내보내기', s.project).catch(() => {});
      await writeRpyToFolder(code, { line: followLine() ? codeLineOf(code, editingLineId()) : null });
      lastAuto = code;
      // 웹: 대본 파일도 같이 (앱에서 이어 쓰게)
      if (bound && !isDesktop && (await writeBound(serialize(s.project), true)) && useStore.getState().project === s.project)
        useStore.setState({ dirty: false, fileName: boundName });
      s.say(`${RPY_FILE}로 내보냈어요. 게임이 켜져 있으면 저절로 다시 불러와요 (플러그인이 예전 판이면 게임에서 Shift+R)`);
    } else if (hasFS) {
      if (!rpyHandle || !again)
        rpyHandle = await w.showSaveFilePicker({
          suggestedName: rpyHandle?.name ?? 'script_flow.rpy',
          types: [{ description: "Ren'Py 스크립트", accept: { 'text/plain': ['.rpy'] } }],
        });
      await writeTo(rpyHandle, code);
      s.say(`${rpyHandle.name}로 내보냈어요 — 렌파이에서 Shift+R로 다시 불러오기`);
    } else {
      download('script_flow.rpy', code);
      s.say('script_flow.rpy를 내려받았어요');
    }
  } catch (e: any) {
    if (!aborted(e)) alert('내보내기 실패: ' + e.message);
  }
}

// ── 렌파이에서 실행 (앱) ──
// 지금 대본을 내보낸 뒤 이 프로젝트를 렌파이로 켠다. 게임이 이미 켜져 있으면 설정에 따라 그냥 둔다(내보낸 대본은 게임이 다시 불러옴)
export async function runInRenpy() {
  const s = useStore.getState();
  if (!desktop?.runGame) return s.say('이 판의 앱에서는 게임을 켤 수 없어요. 렌파이 런처에서 실행해 주세요');
  await exportRpyFile(true);
  const r = await desktop.runGame(!usePrefs.getState().runSkip).catch(() => 'failed' as const);
  s.say(
    r === 'started' ? '렌파이에서 게임을 켜는 중이에요'
    : r === 'running' ? '게임이 이미 켜져 있어서 다시 켜지 않았어요. 고친 대본은 게임이 저절로 다시 불러와요'
    : r === 'no-sdk' ? '렌파이를 찾지 못했어요. 렌파이 런처에서 [프로젝트 실행]으로 켜 주세요'
    : '게임을 켜지 못했어요. 렌파이 런처에서 실행해 주세요',
  );
}

// ── 자동 내보내기 (앱에서 대본을 고치고 멈추면) ──
// 렌파이 연결을 켜고 폴더가 연결돼 있으면 script_flow.rpy를 다시 쓴다. 켜 둔 게임(showpy ui_kit 4.2+)이 저절로 다시 불러오고,
// "게임 줄 따라가기"가 켜져 있으면 지금 쓰는 줄로 게임을 옮긴다(pykaki_goto.json).
const FOLLOW_KEY = 'pykaki-follow-line';
export function followLine() {
  try {
    return localStorage.getItem(FOLLOW_KEY) !== 'off';
  } catch {
    return true;
  }
}
export function setFollowLine(on: boolean) {
  try {
    localStorage.setItem(FOLLOW_KEY, on ? 'on' : 'off');
  } catch {
    /* 이번만 */
  }
}

// 연결한 게임의 플러그인이 읽을 수 있을 때만 줄 끝 표시로 내보낸다 (LINK.md 2장)
const makeRpy = (p: Parameters<typeof generateRpyWith>[0]) => generateRpyWith(p, { endMarks: useGameFolder.getState().endMarks });

// 지금 쓰는 줄(없으면 고른 상자의 첫 줄)이 내보낸 원고의 몇째 줄인지 (1부터)
// 표시는 그 줄 끝에 붙어 있거나(문장이면 그 줄, 메모면 다음 문장), 윗줄에 따로 있다
export function codeLineOf(code: string, lineId: string | null): number | null {
  if (!lineId) return null;
  const rows = code.split(/\r?\n/);
  const mark = `# @l:${lineId}`;
  const at = rows.findIndex((r) => r.trim() === mark || r.endsWith('  ' + mark));
  if (at < 0) return null;
  if (rows[at].trim() !== mark && !rows[at].trim().startsWith('#')) return at + 1;
  for (let i = at + 1; i < rows.length; i++) {
    const t = rows[i].trim();
    if (t && !t.startsWith('#')) return i + 1;
  }
  return null;
}

function editingLineId(): string | null {
  const s = useStore.getState();
  if (s.activeLine) return s.activeLine;
  const node = s.project.nodes.find((n) => n.id === s.selectedIds[0]);
  return node?.lines[0]?.id ?? null;
}

let lastAuto: string | null = null;
let autoBusy = false;
let autoWarned = false;
let autoHeld = false;

// 원고에 적힌 상자(# @node:id) 가운데 지금 대본에 없는 것의 수. 절반 넘게 없으면 다른 대본으로 만든 원고로 본다 (아니면 0)
export function foreignBoxes(old: string | null, project: { nodes: { id: string }[] }): number {
  if (!old) return 0;
  const ids = [...old.matchAll(/# @node:(\S+)/g)].map((m) => m[1]);
  if (ids.length < 2) return 0;
  const have = new Set(project.nodes.map((n) => n.id));
  const lost = ids.filter((id) => !have.has(id)).length;
  return lost * 2 > ids.length ? lost : 0;
}
export async function autoExport() {
  const s = useStore.getState();
  if (autoBusy || !s.project.settings.renpyLink || !folderReady()) return;
  autoBusy = true;
  try {
    if (!(await folderAllowed(false))) return;
    await pullInbox(false).catch(() => 0);
    const { code, warnings } = makeRpy(useStore.getState().project);
    if (warnings.some((x) => x.level === 'error')) {
      if (!autoWarned) useStore.getState().say('오류가 있어서 렌파이로 자동 내보내기를 멈췄어요 (검사 탭). 고치면 다시 내보내요');
      autoWarned = true;
      return;
    }
    autoWarned = false;
    if (code === lastAuto) return;
    if (lastAuto === null) {
      const old = await readRpyFromFolder();
      if (code === old) {
        lastAuto = code;
        return;
      }
      // 이 창에서 처음 쓰는데 원고가 다른 대본 것이면 덮어쓰지 않는다 (Ctrl+E로 물어보고 내보내면 그때부터 다시 자동)
      const lost = foreignBoxes(old, useStore.getState().project);
      if (lost) {
        if (!autoHeld) useStore.getState().say(`${RPY_FILE}에 지금 대본에 없는 상자가 ${lost}개 있어서 자동 내보내기를 멈췄어요. 이 대본으로 덮어쓰려면 Ctrl+E`);
        autoHeld = true;
        return;
      }
      if (old) await backupRpy(old);
    }
    await writeRpyToFolder(code, { line: followLine() ? codeLineOf(code, editingLineId()) : null });
    lastAuto = code;
  } catch (e) {
    console.warn('자동 내보내기 실패', e);
  } finally {
    autoBusy = false;
  }
}

// [위치 옮기기], [렌파이에서 여기로 이동] (앱 + 게임 연결): 원고를 지금 대본으로 내보낸 뒤 그 줄의 원고 줄 번호를 돌려준다.
// 원고가 다르거나 오류가 있으면 null (게임을 옮기지 않는다)
export async function exportedLineOf(lineId: string): Promise<number | null> {
  await autoExport();
  const old = await readRpyFromFolder();
  const { code } = makeRpy(useStore.getState().project);
  if (old !== code) return null;
  return codeLineOf(code, lineId);
}

// 상자의 시작 자리: # @node:id 다음의 첫 실행 줄(label 줄은 건너뜀). 줄이 없는 상자면 label 줄
export function codeBoxLineOf(code: string, boxId: string): number | null {
  const rows = code.split(/\r?\n/);
  const mark = `# @node:${boxId}`;
  const isMark = (r: string) => {
    const k = r.indexOf(mark);
    if (k < 0) return false;
    const after = r[k + mark.length];
    return (after === undefined || after === ' ') && (r.slice(0, k).trim() === '' || r.slice(k - 2, k) === '  ');
  };
  const at = rows.findIndex(isMark);
  if (at < 0) return null;
  let labelRow: number | null = null;
  for (let i = at; i < rows.length; i++) {
    const t = rows[i].trim();
    if (i > at && t.includes('# @node:')) break;
    if (!t || t.startsWith('#')) continue;
    if (/^label\s/.test(t)) {
      labelRow = i + 1;
      continue;
    }
    return i + 1;
  }
  return labelRow;
}

export async function exportedBoxLineOf(boxId: string): Promise<number | null> {
  await autoExport();
  const old = await readRpyFromFolder();
  const { code } = makeRpy(useStore.getState().project);
  if (old !== code) return null;
  return codeBoxLineOf(code, boxId);
}
