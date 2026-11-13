import { useEffect } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { RightPanel } from './Panels';
import { SettingsModal } from './SettingsModal';
import { HelpModal, HintTip, openHelp } from './Help';
import { EditCaret } from './Caret';
import { useStore } from './store';
import { exportRpyFile, saveProject } from './files';
import { addBoxCenter, goNextBox, toggleFocus } from './actions';
import { hit } from './prefs';
import { Resizer } from './Resizer';
import { isTyping } from './util';
import { isDesktop } from './desktop';
import { liveSend, startLive, toggleGamePanel, useLive } from './showpyLive';
import { ShowpyView } from './ShowpyView';
import { EffectsView } from './EffectsView';
import { ShadersView } from './ShadersView';

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
      if (useLive.getState().view === 'effects' || useLive.getState().view === 'shaders') {
        if (hit(e, 'save')) run(() => saveProject());
        else if (!isTyping(e.target) && hit(e, 'undo')) run(s.undo);
        else if (!isTyping(e.target) && hit(e, 'redo')) run(s.redo);
        return;
      }
      if (hit(e, 'focus')) run(toggleFocus);
      else if (s.inlineEdit && hit(e, 'nextBox')) run(() => goNextBox(s.inlineEdit!));
      else if (s.inlineEdit && hit(e, 'flowMenu')) run(() => useStore.setState({ flowMenu: !s.flowMenu }));
      else if (hit(e, 'save')) run(() => saveProject());
      else if (hit(e, 'saveAs')) run(() => saveProject(true));
      else if (hit(e, 'export')) run(() => exportRpyFile(true));
      else if (hit(e, 'newBox')) run(() => addBoxCenter(rf));
      // 입력칸 안에서는 브라우저의 글자 되돌리기를 쓴다
      else if (!isTyping(e.target) && hit(e, 'undo')) run(s.undo);
      else if (!isTyping(e.target) && hit(e, 'redo')) run(s.redo);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rf]);
  return null;
}

// 칸과 캔버스 사이 경계 (칸을 숨기면 같이 숨김)
function SideResizer({ side }: { side: 'left' | 'right' }) {
  const hidden = useStore((s) => (side === 'left' ? s.hideLeft : s.hideRight));
  if (hidden) return null;
  return <Resizer size={side === 'left' ? 'leftW' : 'rightW'} grow={side === 'left' ? 1 : -1} className={side} />;
}

export function App() {
  const focus = useStore((s) => s.focusMode);
  const showPrefs = useStore((s) => s.showPrefs);
  const flash = useStore((s) => s.flash);
  const hideLeft = useStore((s) => s.hideLeft);
  const hideRight = useStore((s) => s.hideRight);
  const view = useLive((s) => s.view);
  useEffect(() => {
    if (isDesktop) startLive();
  }, []);

  return (
    <ReactFlowProvider>
      <Keys />
      <div className={'app' + (focus ? ' focus' : '')}>
        <Toolbar />
        {/* 대본 화면은 showpy 화면을 보는 동안에도 그대로 둔다 (캔버스 상태 유지) */}
        <div className={'main' + (hideLeft ? ' no-left' : '') + (hideRight ? ' no-right' : '')} hidden={view !== 'script'}>
          <Sidebar />
          <SideResizer side="left" />
          <Canvas />
          <SideResizer side="right" />
          <RightPanel />
        </div>
        {view === 'showpy' && <ShowpyView />}
        {view === 'effects' && <EffectsView />}
        {view === 'shaders' && <ShadersView />}
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
      </svg>
      {showPrefs && <SettingsModal />}
      <HelpModal />
      <HintTip />
      <EditCaret />
    </ReactFlowProvider>
  );
}
