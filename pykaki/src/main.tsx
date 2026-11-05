import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import { App } from './App';
import { useStore } from './store';
import { AUTO_MEMO, kvGet, kvSet, snapAuto } from './persist';
import { folderReady, INBOX_FILE, pullInbox, restoreFolder, useGameFolder } from './gameFolder';
import { createEmpty, createSample, normalizeProject } from './sample';
import { desktop, flowFile, isDesktop, projectInfo } from './desktop';
import { checkExternal, restoreProjectFile, saveQuiet, setProjectFile, warnNewer } from './files';
import { chooseFlow } from './flowPick';

// 데스크톱 앱: 프로젝트 폴더 맨 위의 .flow.json을 연다(여러 개면 고름). 없으면 프로젝트 이름으로 새 대본을 만들어 바로 저장한다
async function bootDesktop() {
  const inf = await projectInfo();
  const name = await chooseFlow(inf);
  const file = flowFile(name);
  let project;
  let fresh = false;
  let text: string | null = null;
  try {
    text = await (await file.getFile()).text();
    project = normalizeProject(JSON.parse(text));
  } catch (e: any) {
    if (inf.flows[0]) {
      alert(`대본 파일 ${name}을 읽지 못했어요: ${e.message}\n파일을 고치거나 지우고 다시 열어 주세요.`);
      throw e;
    }
    project = createEmpty();
    project.project.title = inf.name;
    fresh = true;
    text = null;
  }
  setProjectFile(file, text);
  useStore.getState().load(project, { fileName: name, dirty: fresh });
  warnNewer(project);
  document.title = `pygaki - ${inf.name}`;

  // 자동 저장: 바뀌고 0.7초 뒤 그 파일에
  let timer: ReturnType<typeof setTimeout> | undefined;
  useStore.subscribe((st, prev) => {
    if (st.project === prev.project && st.dirty === prev.dirty) return;
    if (!st.dirty) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveQuiet()
        .then(() => useStore.setState({ localSavedAt: Date.now() }))
        .catch((e) => useStore.getState().say('대본을 저장하지 못했어요: ' + e.message));
    }, 700);
  });

  let lastSnap = useStore.getState().project;
  setInterval(() => {
    const cur = useStore.getState().project;
    if (cur === lastSnap) return;
    lastSnap = cur;
    snapAuto(AUTO_MEMO, cur).catch((e) => console.warn('자동 저장본 실패', e));
  }, 5 * 60 * 1000);

  await restoreFolder();
  // 새 대본이면 showpy가 있는지에 맞춰 연결 설정을 켠다
  if (fresh) useStore.getState().update((p) => void (p.settings.renpyLink = useGameFolder.getState().hasShowpy));
  if (fresh && (await desktop!.stat('game/script_flow.rpy')))
    useStore.getState().say('이 프로젝트에 이미 script_flow.rpy가 있어요. 내보내면 지금 대본으로 덮어써요');

  // showpy가 넣은 줄: 파일이 바뀌면 바로, 창으로 돌아올 때도 받아 적는다
  let pullTimer: ReturnType<typeof setTimeout> | undefined;
  const pull = () => {
    clearTimeout(pullTimer);
    pullTimer = setTimeout(() => void pullInbox().catch((e) => console.warn('받아 적기 실패', e)), 300);
  };
  desktop!.onChange((rel) => rel === 'game/' + INBOX_FILE && pull());
  window.addEventListener('focus', pull);
  pull();

  // 대본 파일이 밖(웹 PyKaki, 다른 창)에서 바뀌면 다시 읽을지 묻는다
  let extTimer: ReturnType<typeof setTimeout> | undefined;
  const ext = () => {
    clearTimeout(extTimer);
    extTimer = setTimeout(() => void checkExternal().catch((e) => console.warn('대본 파일 확인 실패', e)), 300);
  };
  desktop!.onChange((rel) => rel === name && ext());
  window.addEventListener('focus', ext);

  createRoot(document.getElementById('root')!).render(<App />);
}

async function boot() {
  if (isDesktop) return bootDesktop();
  let saved: any = null;
  let meta: any = null;
  try {
    saved = await kvGet('current');
    meta = await kvGet('meta');
  } catch (e) {
    console.warn('브라우저 저장소를 쓸 수 없어요', e);
  }
  let project;
  try {
    project = saved ? normalizeProject(saved) : createSample();
  } catch {
    project = createSample();
  }
  useStore.getState().load(project, { fileName: meta?.fileName ?? null, dirty: meta?.dirty ?? false });
  warnNewer(project);

  // 자동 저장: 바뀌고 0.7초 뒤 IndexedDB에
  let timer: ReturnType<typeof setTimeout> | undefined;
  useStore.subscribe((s, prev) => {
    if (s.project === prev.project && s.fileName === prev.fileName && s.dirty === prev.dirty) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const st = useStore.getState();
      try {
        await kvSet('current', st.project);
        await kvSet('meta', { fileName: st.fileName, dirty: st.dirty });
        useStore.setState({ localSavedAt: Date.now() });
      } catch (e) {
        console.warn('자동 저장 실패', e);
      }
    }, 700);
  });

  // 저장본: 바뀐 것이 있으면 5분마다 남긴다
  let lastSnap = useStore.getState().project;
  setInterval(() => {
    const cur = useStore.getState().project;
    if (cur === lastSnap) return;
    lastSnap = cur;
    snapAuto(AUTO_MEMO, cur).catch((e) => console.warn('자동 저장본 실패', e));
  }, 5 * 60 * 1000);

  // 렌파이에서 돌아오면 showpy가 넣은 줄을 바로 대본에 보여 준다
  await restoreFolder();
  // 연결한 프로젝트 폴더의 대본 파일: 앱에서 고쳤으면 다시 읽을지 묻는다 (폴더 권한이 남아 있을 때)
  await restoreProjectFile().catch((e) => console.warn('대본 파일 확인 실패', e));
  const pull = () => void (folderReady() && pullInbox().catch((e) => console.warn('받아 적기 실패', e)));
  const ext = () => void checkExternal().catch((e) => console.warn('대본 파일 확인 실패', e));
  window.addEventListener('focus', () => {
    ext();
    pull();
  });
  pull();

  window.addEventListener('beforeunload', (e) => {
    if (useStore.getState().dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  createRoot(document.getElementById('root')!).render(<App />);
}

boot();
