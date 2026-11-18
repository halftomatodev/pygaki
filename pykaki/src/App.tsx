import { useEffect, useLayoutEffect, useRef } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { RightPanel } from './Panels';
import { SettingsModal } from './SettingsModal';
import { MaskVideoDialog } from './MaskVideoDialog';
import { FindPanel } from './FindPanel';
import { ScreensView } from './ScreensView';
import { TracePanel } from './TracePanel';
import { FlagDesign } from './FlagDesign';
import { HelpModal, HintTip, openHelp } from './Help';
import { EditCaret } from './Caret';
import { useStore } from './store';
import { exportRpyFile, saveProject } from './files';
import { addBoxCenter, goNextBox, toggleFocus } from './actions';
import { hit } from './prefs';
import { Resizer } from './Resizer';
import { isTyping } from './util';
import { copyText, pasteClip, readClip, type BoxClip } from './boxClip';

// 실행 취소를 앱이 받을지. 창(설정·도움말) 안의 칸과, 고칠 때까지 대본에 안 들어가는 칸(data-native-undo)은 브라우저에 맡긴다
function appUndo(t: EventTarget | null) {
  if (!isTyping(t)) return true;
  const el = t as HTMLElement;
  return !el.closest('.modal, [data-native-undo]');
}
import { isDesktop } from './desktop';
import { liveSend, startLive, toggleGamePanel, useLive } from './showpyLive';
import { ShowpyView } from './ShowpyView';
import { EffectsView } from './EffectsView';
import { ShadersView } from './ShadersView';
import { FontsView } from './FontsView';

// 단축키는 환경 설정에서 바꿀 수 있다 (prefs.ts)
function Keys() {
  const rf = useReactFlow();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const run = (fn: () => void) => (e.preventDefault(), fn());
      // 도움말은 어느 화면에서나
      if (e.key === 'F1') return run(() => openHelp());
      // 게임 창의 GUI 편집기 보이기/숨기기는 어느 화면에서나 (데스크톱 앱)
      if (isDesktop && hit(e, 'gamePanel')) return run(() => s.say(toggleGamePanel()));
      // showpy 화면에서는 저장 키가 게임 안 편집기의 저장(Ctrl+S)
      if (useLive.getState().view === 'showpy') {
        if (hit(e, 'save')) run(() => liveSend({ cmd: 'save' }));
        return;
      }
      // 효과 화면에서는 저장과 되돌리기만 (효과를 바꾸고 빼면 대본이 바뀜)
      if (['effects', 'shaders', 'screens', 'fonts'].includes(useLive.getState().view)) {
        if (hit(e, 'save')) run(() => saveProject());
        else if (appUndo(e.target) && hit(e, 'undo')) run(s.undo);
        else if (appUndo(e.target) && hit(e, 'redo')) run(s.redo);
        return;
      }
      if (hit(e, 'focus')) run(toggleFocus);
      else if (s.inlineEdit && hit(e, 'nextBox')) run(() => goNextBox(s.inlineEdit!));
      else if (s.inlineEdit && hit(e, 'flowMenu')) run(() => useStore.setState({ flowMenu: !s.flowMenu }));
      else if (hit(e, 'save')) run(() => saveProject());
      else if (hit(e, 'saveAs')) run(() => saveProject(true));
      // 이미 열려 있으면 찾을 글 칸을 고른다
      else if (hit(e, 'find'))
        run(() => {
          if (!s.showFind) useStore.setState({ showFind: true });
          else document.querySelector<HTMLInputElement>('.float-panel.find input')?.select();
        });
      else if (hit(e, 'export')) run(() => exportRpyFile(true));
      else if (hit(e, 'newBox')) run(() => addBoxCenter(rf));
      else if (!isTyping(e.target) && hit(e, 'duplicate')) run(() => duplicateBoxes());
      // 대본 입력칸 안에서도 앱의 실행 취소를 쓴다 (React 칸은 브라우저 되돌리기가 잘 안 먹음)
      else if (appUndo(e.target) && hit(e, 'undo')) run(s.undo);
      else if (appUndo(e.target) && hit(e, 'redo')) run(s.redo);
    };
    // 상자 복사·붙여넣기: 글 칸 밖에서 Ctrl+C / Ctrl+V. 클립보드에 상자 JSON을 글자로 넣어서 창이나 대본 사이에도 됨
    let mouse: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => (mouse = { x: e.clientX, y: e.clientY });
    // 붙일 자리: 마우스가 캔버스 위면 그 자리, 아니면 원래 자리에서 조금 옆
    const pasteAt = () => {
      const el = document.querySelector('.canvas')?.getBoundingClientRect();
      if (!mouse || !el || mouse.x < el.left || mouse.x > el.right || mouse.y < el.top || mouse.y > el.bottom) return null;
      return rf.screenToFlowPosition(mouse);
    };
    const scriptView = () => useLive.getState().view === 'script' && !document.querySelector('.modal');
    const onCopy = (e: ClipboardEvent) => {
      const s = useStore.getState();
      if (!scriptView() || isTyping(e.target) || isTyping(document.activeElement) || !s.selectedIds.length) return;
      const text = copyText(s.project, s.selectedIds);
      if (!text || !e.clipboardData) return;
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
      s.say(`상자 ${s.selectedIds.length}개를 복사했어요 (Ctrl+V로 붙여넣기)`);
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!scriptView() || isTyping(e.target) || isTyping(document.activeElement)) return;
      const clip = readClip(e.clipboardData?.getData('text/plain'));
      if (!clip) return;
      e.preventDefault();
      pasteBoxes(clip, pasteAt());
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [rf]);
  return null;
}

// 붙인 상자를 골라 둠 (실행 취소 한 번으로 되돌림)
function pasteBoxes(clip: BoxClip, at: { x: number; y: number } | null) {
  let ids: string[] = [];
  const s = useStore.getState();
  s.update((p) => void (ids = pasteClip(p, clip, at)));
  s.select(ids);
  s.say(`상자 ${ids.length}개를 붙였어요`);
}

// 고른 상자를 바로 옆에 복제 (클립보드는 그대로)
function duplicateBoxes() {
  const s = useStore.getState();
  const clip = readClip(copyText(s.project, s.selectedIds));
  if (!clip) return s.say('복제할 상자를 먼저 고르세요');
  pasteBoxes(clip, null);
}

// 칸과 캔버스 사이 경계 (칸을 숨기면 같이 숨김)
function SideResizer({ side }: { side: 'left' | 'right' }) {
  const hidden = useStore((s) => (side === 'left' ? s.hideLeft : s.hideRight));
  if (hidden) return null;
  return <Resizer size={side === 'left' ? 'leftW' : 'rightW'} grow={side === 'left' ? 1 : -1} className={side} />;
}

// 상단 탭 차례 (화면 전환 방향을 정함). Toolbar.tsx ViewSwitch와 같은 차례
const VIEW_ORDER = ['script', 'showpy', 'screens', 'effects', 'shaders', 'fonts'];

export function App() {
  const focus = useStore((s) => s.focusMode);
  const showPrefs = useStore((s) => s.showPrefs);
  const showFind = useStore((s) => s.showFind);
  const showTrace = useStore((s) => s.showTrace);
  const showDesign = useStore((s) => s.showDesign);
  const flash = useStore((s) => s.flash);
  const hideLeft = useStore((s) => s.hideLeft);
  const hideRight = useStore((s) => s.hideRight);
  const view = useLive((s) => s.view);
  useEffect(() => {
    if (isDesktop) startLive();
  }, []);

  // 화면을 바꾸면 새 화면이 탭이 움직인 방향에서 밀려 들어온다 (docs/MOTION.md, 끈적 탭과 짝)
  const appRef = useRef<HTMLDivElement>(null);
  const lastView = useRef(view);
  useLayoutEffect(() => {
    const prev = lastView.current;
    lastView.current = view;
    if (prev === view || !appRef.current) return;
    const el = [...appRef.current.children].find((c) => !c.classList.contains('toolbar') && !(c as HTMLElement).hidden) as HTMLElement | undefined;
    if (!el) return;
    el.style.setProperty('--dir', String(VIEW_ORDER.indexOf(view) > VIEW_ORDER.indexOf(prev) ? 1 : -1));
    el.classList.remove('view-in');
    void el.offsetWidth;
    el.classList.add('view-in');
    const done = () => el.classList.remove('view-in');
    el.addEventListener('animationend', done, { once: true });
  }, [view]);

  return (
    <ReactFlowProvider>
      <Keys />
      <div ref={appRef} className={'app' + (focus ? ' focus' : '')}>
        <Toolbar />
        {/* 대본 화면은 showpy 화면을 보는 동안에도 그대로 둔다 (캔버스 상태 유지) */}
        <div className={'main' + (hideLeft ? ' no-left' : '') + (hideRight ? ' no-right' : '')} hidden={view !== 'script'}>
          <Sidebar />
          <SideResizer side="left" />
          <Canvas />
          <SideResizer side="right" />
          <RightPanel />
          {showDesign && <FlagDesign />}
        </div>
        {view === 'showpy' && <ShowpyView />}
        {view === 'effects' && <EffectsView />}
        {view === 'shaders' && <ShadersView />}
        {view === 'fonts' && <FontsView />}
        {view === 'screens' && <ScreensView />}
      </div>
      {flash && <div className="toast">{flash}</div>}
      {/* 일렁임(liquid) 효과가 쓰는 물결 필터 */}
      <svg className="svg-defs" aria-hidden="true">
        <filter id="pk-liquid">
          <feTurbulence type="turbulence" baseFrequency="0.02 0.05" numOctaves={2} seed={3}>
            <animate attributeName="baseFrequency" dur="3s" values="0.02 0.05;0.026 0.062;0.02 0.05" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* 끈적(gooey): 흐린 뒤 알파를 날카롭게 잘라 가까운 모양끼리 녹아 붙게. 상단 탭 색 막대가 씀 */}
        <filter id="pk-goo" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      {showPrefs && <SettingsModal />}
      {showFind && view === 'script' && <FindPanel />}
      {showTrace !== null && view === 'script' && <TracePanel />}
      <HelpModal />
      <MaskVideoDialog />
      <HintTip />
      <EditCaret />
    </ReactFlowProvider>
  );
}
