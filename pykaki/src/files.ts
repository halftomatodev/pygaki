// 파일 저장/열기/.rpy 내보내기. 크롬·엣지는 같은 파일에 덮어쓰기, 그 외 브라우저는 다운로드.
import { useStore } from './store';
import { createEmpty, normalizeProject } from './sample';
import { generateRpy } from './exportRpy';
import { snapAdd, snapAuto } from './persist';
import { isDesktop } from './desktop';
import { connectFolder, disconnectFolder, folderAllowed, folderReady, hasDirPicker, looksLikeGame, pullInbox, readRpyFromFolder, RPY_FILE, scanFolder, useGameFolder, writeRpyToFolder } from './gameFolder';

const w = window as any;
const hasFS = typeof w.showSaveFilePicker === 'function';
let jsonHandle: any = null;
let rpyHandle: any = null;

export const hasRpyTarget = () => !!rpyHandle;

// 데스크톱 앱: 대본은 프로젝트 폴더의 .flow.json 하나에 저장한다 (main.tsx가 열 때 정함)
export const setProjectFile = (handle: any) => (jsonHandle = handle);

// 알림 없이 지금 대본을 그 파일에 쓴다 (데스크톱 앱의 자동 저장)
export async function saveQuiet() {
  if (!jsonHandle) return false;
  const s = useStore.getState();
  const project = s.project;
  await writeTo(jsonHandle, JSON.stringify(project, null, 2));
  if (useStore.getState().project === project) useStore.setState({ dirty: false, fileName: jsonHandle.name });
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
  const text = JSON.stringify(s.project, null, 2);
  const name = s.fileName ?? `${s.project.project.title || 'script'}.flow.json`;
  try {
    if (isDesktop && jsonHandle && !as) {
      await writeTo(jsonHandle, text);
      useStore.setState({ dirty: false, fileName: jsonHandle.name });
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
  if (!confirmDiscard()) return;
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
    await snapAdd('열기 전 자동 백업', s.project).catch(() => {});
    // 데스크톱 앱: 연 파일의 내용을 이 프로젝트의 대본으로 가져온다 (저장은 계속 프로젝트 폴더의 파일에)
    if (isDesktop && jsonHandle) {
      s.load(p, { fileName: jsonHandle.name, dirty: true });
      s.say(`${file.name}의 내용을 이 프로젝트 대본으로 가져왔어요`);
      return;
    }
    jsonHandle = handle;
    s.load(p, { fileName: file.name, dirty: false });
  } catch (e: any) {
    alert('파일을 읽을 수 없어요: ' + e.message);
  }
}

export async function newProject() {
  if (isDesktop) {
    if (!confirm('이 프로젝트의 대본을 비우고 새로 시작할까요?\n(지금 대본은 버전 목록에 자동 백업돼요)')) return;
  } else if (!confirmDiscard()) return;
  const s = useStore.getState();
  await snapAdd('새로 만들기 전 자동 백업', s.project).catch(() => {});
  if (isDesktop) return s.load(createEmpty(), { fileName: jsonHandle?.name ?? null, dirty: true });
  jsonHandle = null;
  s.load(createEmpty(), { fileName: null, dirty: false });
}

// 렌파이 프로젝트 연결: 폴더를 고르면 연결, showpy 확인, 첫 내보내기까지 한 번에 한다
export async function linkProject() {
  if (!(await connectFolder())) return;
  const s = useStore.getState();
  if (!(await looksLikeGame())) {
    await disconnectFolder();
    alert('렌파이 프로젝트 폴더가 아닌 것 같아요. gui.rpy가 들어 있는 game 폴더나 그 위 프로젝트 폴더를 골라 주세요.');
    return;
  }
  const f = useGameFolder.getState();
  if (!!s.project.settings.renpyLink !== f.hasShowpy) s.update((p) => void (p.settings.renpyLink = f.hasShowpy));
  try {
    const old = await readRpyFromFolder();
    const code = generateRpy(useStore.getState().project).code;
    if (old && old !== code && !confirm(`이 폴더에 이미 ${RPY_FILE}가 있어요. 지금 대본으로 덮어쓸까요?\n다른 대본을 쓰던 폴더라면 [취소]를 누르고, 그 대본을 먼저 여세요.`)) {
      s.say('폴더만 연결했어요. 내보내려면 Ctrl+E를 누르세요');
      return;
    }
  } catch (e: any) {
    alert('폴더를 정리하지 못했어요: ' + e.message);
    return;
  }
  await exportRpyFile(true);
  s.say(f.hasShowpy ? '연결했어요. 렌파이에서 게임을 실행하면 돼요' : '연결했어요. showpy가 없어서 위치와 화면 효과는 렌파이에서 고칠 수 없어요');
}

export async function exportRpyFile(again = false) {
  let s = useStore.getState();
  // showpy 연결: 연결한 폴더의 script_flow.rpy에 바로 쓴다. 쓰기 전에 showpy가 넣은 줄부터 받아 적어야 안 사라진다
  const toFolder = hasDirPicker && (s.project.settings.renpyLink || folderReady());
  if (toFolder) {
    if (!folderReady() && !(await connectFolder())) return;
    if (!(await folderAllowed(true))) {
      alert('렌파이 폴더에 쓸 권한이 없어요. 권한을 허용해 주세요.');
      return;
    }
    try {
      await pullInbox(true);
      await scanFolder();
    } catch (e: any) {
      alert('showpy가 넣은 줄을 받아 적지 못해서 내보내기를 멈췄어요: ' + e.message);
      return;
    }
    s = useStore.getState();
  }
  const { code, warnings } = generateRpy(s.project);
  const errors = warnings.filter((x) => x.level === 'error').length;
  if (errors && !confirm(`오류 ${errors}개가 있어요. 이대로 내보내면 렌파이에서 실행이 안 될 수 있어요. 계속할까요?`)) {
    useStore.setState({ tab: 'warn' });
    return;
  }
  try {
    if (toFolder) {
      await snapAuto('내보내기', s.project).catch(() => {});
      await writeRpyToFolder(code);
      s.say(`${RPY_FILE}로 내보냈어요. 렌파이가 바로 다시 불러와요 (자동 불러오기는 렌파이에서 Shift+R)`);
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
