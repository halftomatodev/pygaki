import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Hint } from './Help';
import { useReactFlow } from '@xyflow/react';
import { useGameFolder } from './gameFolder';
import { isDesktop, projectInfo } from './desktop';
import { newerThanMe, projectFileName } from './files';
import { addBoxCenter, runLayout } from './actions';
import { keyOf, SIZE_KEYS, SIZES, sizeDefaults, usePrefs } from './prefs';
import { forgetFlow } from './flowPick';
import { useStore } from './store';
import { Card, FoldAll, FoldScope } from './Card';
import { SceneTree } from './SceneTree';
import { timeStr } from './util';
import { generateRpy, type Warn as Warning } from './exportRpy';
import { exportRpyFile } from './files';

export function Sidebar() {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const sel = useStore((s) => s.selectedIds.length);
  const rf = useReactFlow();
  const sizeLock = usePrefs((p) => p.sizeLock);
  const resized = usePrefs((p) => SIZE_KEYS.some((k) => p[k] !== SIZES[k].def));

  return (
    <aside className="sidebar">
      <FoldScope name="left">
      <FoldAll side="left" />
      {/* 장면·상자·캐릭터는 트리, 나머지는 카드 (세션 82, UI_PLAN B "섞기") */}
      <Card id="labels" defFolded title="장면과 캐릭터">
        <SceneTree />
        <div className="sec-sub">상자와 정렬</div>
        <div className="sec-btns">
          <button className="primary" onClick={() => addBoxCenter(rf)} title={`캔버스 빈 곳 더블클릭으로도 만들 수 있어요 (${keyOf('newBox')})`}>+ 상자</button>
          <button onClick={() => runLayout(rf, 'all')}>전체 정렬</button>
          <button disabled={!sel} onClick={() => runLayout(rf, 'label')} title="선택한 상자의 label 안에서만 정렬">label 정렬</button>
          <button disabled={sel < 2} onClick={() => runLayout(rf, 'selection')} title="Shift+드래그로 여러 상자 선택">선택 정렬</button>
        </div>
        <label className="info-row">
          <span>정렬 방향</span>
          <select value={project.layout.direction} onChange={(e) => update((p) => void (p.layout.direction = e.target.value as 'TB' | 'LR'))}>
            <option value="TB">↓ 위→아래</option>
            <option value="LR">→ 왼→오른</option>
          </select>
        </label>
      </Card>

      <WarnCard />

      <Card id="project" defFolded title="렌파이 프로젝트 정보" hint="연결한 프로젝트, 대본 파일, 저장 상태" topic="데스크톱 앱">
        <LinkPanel />
      </Card>

      <ScriptCard />

      <Card id="settings" defFolded title="설정" hint="칸 크기와 내보내기 설정. 화면 색과 단축키는 위쪽 [설정]" topic="화면 둘러보기">
        <div className="info-row">
          <span>칸 크기<Hint text="칸 사이 경계를 끌어 바꾸고, 더블클릭하면 그 칸만 처음 크기로. [GUI 편집]·[효과]·[셰이더] 칸도 같아요" topic="화면 둘러보기" /></span>
          <span className="mini-btns">
            <button disabled={!resized} onClick={() => usePrefs.setState(sizeDefaults())} title="모든 화면의 칸 너비를 처음 크기로 되돌려요">
              처음 크기
            </button>
            <button className={sizeLock ? 'on' : ''} onClick={() => usePrefs.setState({ sizeLock: !sizeLock })} title={sizeLock ? '잠겨 있어요. 누르면 칸 경계를 끌어서 크기를 바꿀 수 있어요' : '누르면 칸 경계를 끌어도 크기가 바뀌지 않아요'}>
              {sizeLock ? '잠김' : '잠금'}
            </button>
          </span>
        </div>
        <div className="settings">
            <label>
              <input type="checkbox" checked={project.settings.escapeBrackets} onChange={(e) => update((p) => void (p.settings.escapeBrackets = e.target.checked))} />
              [ 를 글자 그대로 ([[ 로 변환)
            </label>
            <label>
              <input type="checkbox" checked={project.settings.allowTextTags} onChange={(e) => update((p) => void (p.settings.allowTextTags = e.target.checked))} />
              {'텍스트 태그 사용 ({b} 등)'}
            </label>
            <label>
              <input type="checkbox" checked={project.settings.escapePercent} onChange={(e) => update((p) => void (p.settings.escapePercent = e.target.checked))} />
              % 를 글자 그대로 (%% 로 변환)
            </label>
            <label>
              <input type="checkbox" checked={!!project.settings.renpyLink} onChange={(e) => update((p) => void (p.settings.renpyLink = e.target.checked))} />
              pygaki 플러그인 연결
            </label>
        </div>
      </Card>

      </FoldScope>
    </aside>
  );
}

// 지금 대본으로 만든 원고와 경고 (검사, 스크립트 카드가 같이 쓴다)
function useRpy() {
  const project = useStore((s) => s.project);
  const endMarks = useGameFolder((f) => f.endMarks); // 내보낼 때와 같은 형식으로
  const newMark = useGameFolder((f) => f.newMark);
  const oldMedia = useGameFolder((f) => f.mediaBox === false);
  const images = useGameFolder((f) => f.imageBook); // 그림 이름 검사 (연결한 게임의 그림)
  const audio = useGameFolder((f) => f.media.audio); // 음성 파일 잇기
  return useMemo(() => generateRpy(project, { endMarks, newMark, oldMedia, images, audio }), [project, endMarks, newMark, oldMedia, images, audio]);
}

// 검사: 내보낼 때 걸리는 것. 누르면 그 상자로 간다 (예전에는 오른쪽 [검사] 탭)
function WarnCard() {
  const { warnings } = useRpy();
  const errors = warnings.filter((w) => w.level === 'error').length;
  const go = (w: Warning) => {
    if (!w.nodeId) return;
    useStore.getState().select([w.nodeId]);
    useStore.getState().focusNodes([w.nodeId]);
  };
  return (
    <Card id="warn" defFolded className="warn-card" domId="warn-card" title={<>검사 {warnings.length > 0 && <span className={'count' + (errors ? ' err' : '')}>{warnings.length}</span>}</>}>
      {!warnings.length && <p className="tip">문제가 없어요.</p>}
      {warnings.map((w, i) => (
        <div key={i} className={'warn-item ' + w.level + (w.nodeId ? ' go' : '')} onClick={() => go(w)}>
          {w.level === 'error' ? '⛔ ' : '⚠ '}
          {w.msg}
        </div>
      ))}
    </Card>
  );
}

// 스크립트: 내보낼 원고. 길어서 처음에는 접어 둔다 (예전에는 오른쪽 [스크립트] 탭)
function ScriptCard() {
  const { code } = useRpy();
  return (
    <Card id="script" title="스크립트" defFolded>
      <div className="sec-btns">
        <button onClick={() => navigator.clipboard.writeText(code).then(() => useStore.getState().say('복사했어요'))}>복사</button>
        <button className="primary" onClick={() => exportRpyFile(false)}>.rpy 내보내기</button>
      </div>
      <pre className="rpy side-rpy">{code}</pre>
    </Card>
  );
}

// 정보 한 줄: 왼쪽에 이름, 오른쪽에 값
function Info({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="info-row">
      <span>{k}</span>
      <b>{children}</b>
    </div>
  );
}

// 저장 상태 (예전에는 위쪽 줄 오른쪽에 있었다)
function SaveInfo() {
  const fileName = useStore((v) => v.fileName);
  const dirty = useStore((v) => v.dirty);
  const savedAt = useStore((v) => v.localSavedAt);
  return (
    <>
      <Info k="파일 저장">
        {!fileName ? '파일로 저장 안 됨' : dirty ? '저장 안 한 변경 있음' : '저장됨'}
        {dirty && <i className="dirty" title="파일로 저장하지 않은 변경이 있어요"> ●</i>}
      </Info>
      {savedAt && <Info k="자동 저장">{timeStr(savedAt)}</Info>}
    </>
  );
}

// 렌파이 프로젝트 정보: 프로젝트, 대본 파일, 저장 상태, 찾은 그림·소리, 경고를 한곳에.
// 폴더를 열고 읽는 단추는 위쪽 줄에 있다 (웹에서 처음 연결하는 단추만 여기)
function LinkPanel() {
  const f = useGameFolder();
  const hasStart = useStore((v) => v.project.labels.some((l) => l.name === 'start'));
  const fileName = useStore((v) => v.fileName); // 대본 파일이 바뀌면 다시 그린다
  const app = useStore((v) => v.project.app);
  const flowFile = fileName && projectFileName();
  const newer = app && newerThanMe(useStore.getState().project) && (
    <p className="tip warn-text">
      이 대본은 더 새 판({app.by} {app.build})에서 저장했어요. 앱을 새 판으로 바꾸세요. 이 판으로 내보내면 일부 줄이 빠질 수 있어요.
    </p>
  );
  const clash = f.startClash && hasStart && <p className="tip warn-text">{f.startClash}에도 label start가 있어요. 대본의 start label 이름을 바꾸거나 그 파일의 label start를 지워 주세요.</p>;
  const media = (
    <>
      <Info k="그림과 영상">{f.media.images.length}개</Info>
      <Info k="소리">{f.media.audio.length}개</Info>
    </>
  );
  const [info, setInfo] = useState<{ project: string; flows: string[] } | null>(null);
  useEffect(() => void (isDesktop && projectInfo().then(setInfo)), []);
  if (isDesktop)
    return (
      <div className="link-panel">
        <Info k="프로젝트">{f.name}</Info>
        <Info k="대본 파일">{flowFile}</Info>
        {info && info.flows.length > 1 && (
          <button
            className="info-btn"
            onClick={() => {
              if (useStore.getState().dirty && !confirm('아직 파일에 저장하지 않은 변경이 있어요. 그래도 다른 대본 파일을 고를까요?')) return;
              forgetFlow(info.project);
              location.reload();
            }}
          >
            다른 대본 파일 고르기
          </button>
        )}
        <SaveInfo />
        {media}
        {newer}
        {!f.hasShowpy && <p className="tip">pygaki 플러그인 없음<Hint text="런처 새 프로젝트 만들기의 Pygaki로 만든 프로젝트에 들어 있어요" topic="pygaki 플러그인과 함께" /></p>}
        {clash}
      </div>
    );
  // 개발 서버를 브라우저로 열었을 때 (웹 버전은 없앰)
  return (
    <div className="link-panel">
      <SaveInfo />
      <p className="tip">개발용 화면 (렌파이 프로젝트는 앱에서)</p>
      {newer}
    </div>
  );
}
