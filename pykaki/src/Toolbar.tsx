import { useEffect, useState } from 'react';
import { useStore } from './store';
import { exportRpyFile, followLine, hasRpyTarget, newProject, openProject, runInRenpy, saveProject, setFollowLine } from './files';
import { pullInbox, scanFolder, useGameFolder } from './gameFolder';
import { snapAdd, snapDelete, snapList, type Snapshot } from './persist';
import { toggleFocus } from './actions';
import { keyOf } from './prefs';
import { desktop, isDesktop } from './desktop';
import { useLive } from './showpyLive';

// 화면 바꾸기: 대본 편집 / GUI 편집(데스크톱 앱에서만) / 효과 / 셰이더
function ViewSwitch() {
  const view = useLive((l) => l.view);
  const go = (v: typeof view) => useLive.setState({ view: v });
  return (
    <span className="view-switch">
      <button className={view === 'script' ? 'on' : ''} onClick={() => go('script')} title="상자와 선으로 대본을 써요">
        대본 편집
      </button>
      {isDesktop && (
        <button className={view === 'showpy' ? 'on' : ''} onClick={() => go('showpy')} title="게임 화면을 보면서 타이틀, 대사 창, 선택지 같은 GUI를 고쳐요">
          GUI 편집
        </button>
      )}
      <button className={view === 'effects' ? 'on' : ''} onClick={() => go('effects')} title="글자 효과와 그림 효과를 보고, 켜고 끄고, 넣고 빼요">
        효과
      </button>
      <button className={view === 'shaders' ? 'on' : ''} onClick={() => go('shaders')} title="화면 전체에 씌우는 셰이더와 셰이더가 바뀔 때의 전환을 봐요">
        셰이더
      </button>
    </span>
  );
}

// 게임과 붙어 있는지 (데스크톱 앱). 붙어 있으면 옅은 파란색, 게임이 원고를 다시 읽는 중이면 노란색, 아니면 회색. 누르면 GUI 편집으로
function LiveBadge() {
  const on = useLive((l) => l.on);
  const reloading = useLive((l) => l.reloading);
  if (!isDesktop) return null;
  return (
    <button
      className={'live-badge' + (on ? ' on' : reloading ? ' reloading' : '')}
      onClick={() => useLive.setState({ view: 'showpy' })}
      title={
        on
          ? '게임과 연결됐어요. 누르면 GUI 편집으로 가요'
          : reloading
            ? '게임이 바뀐 원고를 다시 읽는 중이에요. 끝나면 저절로 다시 붙어요'
            : '게임과 연결 안 됨. [▶ 렌파이에서 실행]이나 런처에서 프로젝트를 실행하면 저절로 붙어요'
      }
    >
      {on ? '● 게임과 연결됨' : reloading ? '◐ 게임 수정 중' : '○ 게임 연결 안 됨'}
    </button>
  );
}

export function Toolbar() {
  const s = useStore();
  const [showVersions, setShowVersions] = useState(false);

  const saveVersion = async () => {
    const memo = prompt('버전 메모 (예: 1장 완성, 엔딩 분기 추가 전)');
    if (memo === null) return;
    try {
      await snapAdd(memo || '(메모 없음)', s.project);
      s.say('버전을 저장했어요');
    } catch (e: any) {
      alert('버전 저장 실패: ' + e.message);
    }
  };

  return (
    <div className="toolbar">
      {/* 왼쪽: 프로젝트 제목, 큰 탭 셋 */}
      <div className="tb-left">
      <input
        className="ptitle"
        value={s.project.project.title}
        onChange={(e) => s.update((p) => void (p.project.title = e.target.value), 'ptitle')}
        placeholder="프로젝트 제목"
        title="프로젝트 제목 (눌러서 고쳐요)"
      />
      <ViewSwitch />
      <LiveBadge />
      </div>
      {/* 게임 돌려보기: 첫 줄 오른쪽 끝에 초록 톤으로 */}
      <div className="tb-run">
      {isDesktop && (
        <button className="run" onClick={() => void runInRenpy()} title="지금 대본을 내보내고 렌파이로 게임을 켜요. 이미 켜져 있을 때 어떻게 할지는 [설정]에서 골라요">
          ▶ 렌파이에서 실행
        </button>
      )}
      <FollowLine />
      </div>
      {/* 메뉴: 둘째 줄 왼쪽부터. 자주 쓰는 되돌리기, 집중, 설정이 맨 앞 */}
      <div className="tb-right">
      <button disabled={!s.past.length} onClick={s.undo} title={'실행 취소 ' + keyOf('undo')}>↶</button>
      <button disabled={!s.future.length} onClick={s.redo} title={'다시 실행 ' + keyOf('redo')}>↷</button>
      <button className="focus-btn" onClick={toggleFocus} title={'집중 모드: 캔버스만 남기기 ' + keyOf('focus')}>집중</button>
      <button onClick={() => useStore.setState({ showPrefs: true })} title="화면 색, 단축키">설정</button>
      <span className="sep" />
      <button onClick={newProject}>새로</button>
      <button onClick={openProject}>열기</button>
      <button onClick={() => saveProject()} title={keyOf('save')}>저장</button>
      <button onClick={() => saveProject(true)} title={keyOf('saveAs')}>다른 이름</button>
      <FolderButtons />
      <span className="sep" />
      <button onClick={saveVersion}>버전 저장</button>
      <button onClick={() => setShowVersions(true)}>버전 목록</button>
      <span className="sep" />
      <button onClick={() => exportRpyFile(false)}>.rpy 내보내기</button>
      {hasRpyTarget() && <button onClick={() => exportRpyFile(true)} title={keyOf('export')}>같은 곳에 다시</button>}
      </div>
      {showVersions && <Versions onClose={() => setShowVersions(false)} />}
    </div>
  );
}

// 렌파이 프로젝트 폴더를 열고 읽는 단추. 앱은 프로젝트 하나를 연 채라 다시 읽기·폴더 열기·다른 프로젝트
function FolderButtons() {
  const reread = () => void pullInbox(true).then(() => scanFolder());
  if (isDesktop)
    return (
      <>
        <span className="sep" />
        <button onClick={reread} title="프로젝트 폴더의 그림·소리와 GUI 편집기가 넣은 줄을 다시 읽어요">다시 읽기</button>
        <button onClick={() => void desktop!.openFolder('')} title="프로젝트 폴더를 탐색기로 열어요">폴더 열기</button>
        <button onClick={() => void desktop!.choose()} title="다른 렌파이 프로젝트를 새 창으로 열어요">다른 프로젝트</button>
      </>
    );
  return null;
}

// 렌파이 폴더를 연결했을 때: 고치면 저절로 내보내고, 게임을 지금 쓰는 줄로 옮길지
function FollowLine() {
  const link = useStore((s) => s.project.settings.renpyLink);
  const name = useGameFolder((g) => g.name);
  const [on, setOn] = useState(followLine);
  if (!link || !name) return null;
  return (
    <button
      className={'follow' + (on ? ' on' : '')}
      onClick={() => {
        setFollowLine(!on);
        setOn(!on);
      }}
      title={
        '고치고 잠깐 멈추면 script_flow.rpy로 저절로 내보내고, 켜 둔 게임이 다시 불러와요. ' +
        (on ? '켬: 게임을 지금 쓰는 줄로 옮겨요. 여러 곳을 고친 뒤 처음부터 훑어보려면 꺼요.' : '끔: 게임은 있던 자리에 그대로 있어요.')
      }
    >
      게임 줄 따라가기: {on ? '켬' : '끔'}
    </button>
  );
}

function Versions({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<Snapshot[] | null>(null);
  const reload = () => snapList().then(setList).catch(() => setList([]));
  useEffect(() => void reload(), []);

  const restore = async (v: Snapshot) => {
    if (!confirm(`"${v.memo}" 버전으로 되돌릴까요?\n지금 상태는 "복원 전 자동 백업"으로 남겨 둬요.`)) return;
    const s = useStore.getState();
    await snapAdd('복원 전 자동 백업', s.project);
    s.load(structuredClone(v.project), { dirty: true });
    s.say(`"${v.memo}" 버전으로 되돌렸어요. Ctrl+E로 내보내면 렌파이도 따라가요`);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>버전 목록</h3>
        <p className="tip">이 브라우저 안에만 저장돼요. 중요한 시점에는 [저장]으로 파일도 남겨 주세요.</p>
        {!list && <p>불러오는 중…</p>}
        {list?.length === 0 && <p className="tip">저장된 버전이 없어요.</p>}
        {list?.map((v) => (
          <div className="ver" key={v.id}>
            <span className="when">{new Date(v.time).toLocaleString('ko-KR')}</span>
            <span className="memo">{v.memo}</span>
            <span className="tip">{v.project.nodes.length}상자</span>
            <button onClick={() => restore(v)}>복원</button>
            <button className="danger" onClick={() => confirm('이 버전을 지울까요?') && snapDelete(v.id).then(reload)}>삭제</button>
          </div>
        ))}
        <div className="row end">
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
