import { useEffect, useState } from 'react';
import { LiquidTabs } from 'fluidkit';
import { Hint, openHelp } from './Help';
import { useStore } from './store';
import { exportRpyFile, followLine, hasRpyTarget, newProject, openProject, runInRenpy, saveProject, setFollowLine } from './files';
import { pullInbox, scanFolder, useGameFolder } from './gameFolder';
import { snapAdd, snapDelete, snapList, type Snapshot } from './persist';
import { toggleFocus } from './actions';
import { keyOf } from './prefs';
import { getLang, LANGS, setLang, type Lang } from './i18n';
import { desktop, isDesktop } from './desktop';
import { useLive } from './showpyLive';
import { FolderMenu } from './FolderMenu';
import { openIconsDialog } from './IconsDialog';
import { Redo2, Undo2 } from 'lucide-react';

// 화면 바꾸기: 대본 편집 / GUI 편집(데스크톱 앱에서만) / 화면 / 효과 / 셰이더 / 글꼴(앱에서만)
// fluidkit LiquidTabs: 유리 물방울 막대가 탭 사이를 흘러가고, 꼬리가 늦게 따라와 다시 합쳐진다
const VIEW_TABS: { id: View; label: string; title: string; app?: boolean }[] = [
  { id: 'script', label: '대본 편집', title: '상자와 선으로 대본을 써요' },
  { id: 'showpy', label: 'GUI 편집', title: '게임 화면을 보면서 타이틀, 대사 창, 선택지 같은 GUI를 고쳐요', app: true },
  { id: 'screens', label: '화면', title: '버튼을 끌어 놓아 렌파이 화면(screen)을 만들어요. 흐름의 [화면 부르기]로 띄워요' },
  { id: 'effects', label: '효과', title: '글자 효과와 그림 효과를 보고, 켜고 끄고, 넣고 빼요' },
  { id: 'shaders', label: '셰이더', title: '화면 전체에 씌우는 셰이더와 셰이더가 바뀔 때의 전환을 봐요' },
  { id: 'fonts', label: '글꼴', title: '게임에 글꼴을 넣고, 대사·이름·선택지·메뉴의 기본 글꼴을 정해요', app: true },
];
type View = ReturnType<typeof useLive.getState>['view'];

function ViewSwitch() {
  const view = useLive((l) => l.view);
  const ink = useThemeInk();
  const items = VIEW_TABS.filter((t) => !t.app || isDesktop).map((t) => ({ id: t.id, label: <span title={t.title}>{t.label}</span> }));
  return (
    <LiquidTabs
      className="view-tabs"
      items={items}
      value={view}
      onChange={(v) => useLive.setState({ view: v as View })}
      flow="slide"
      material="glass"
      size="sm"
      tint={ink.tint}
      labelColor={ink.muted}
      activeLabelColor="#ffffff"
      reflection
      shadow
      style={{ background: 'color-mix(in srgb, var(--text) 6%, transparent)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
      aria-label="화면 바꾸기"
    />
  );
}

// 테마 색을 LiquidTabs가 섞을 수 있는 rgb()로. 환경 설정에서 색이나 어두운 화면이 바뀌면 다시 읽는다
export function useThemeInk() {
  const read = () => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const rgb = (v: string) => {
      probe.style.color = v;
      const c = document.createElement('canvas').getContext('2d')!;
      c.fillStyle = getComputedStyle(probe).color;
      c.fillRect(0, 0, 1, 1);
      const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    const m = rgb('var(--muted)'), a = rgb('var(--accent)');
    probe.remove();
    return { muted: `rgb(${m.join(', ')})`, tint: `rgba(${a.join(', ')}, 0.82)` };
  };
  const [ink, setInk] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setInk((o) => {
      const n = read();
      return n.muted === o.muted && n.tint === o.tint ? o : n;
    }));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-dark', 'class'] });
    return () => mo.disconnect();
  }, []);
  return ink;
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
  const [askMemo, setAskMemo] = useState(false);

  // 메모는 앱 안 작은 창으로 받는다 (데스크톱 앱(Electron)은 브라우저 prompt()를 지원하지 않아서, 2.0-beta1)
  const saveVersion = async (memo: string) => {
    setAskMemo(false);
    try {
      await snapAdd(memo.trim() || '(메모 없음)', useStore.getState().project);
      s.say('버전을 저장했어요');
    } catch (e: any) {
      alert('버전 저장 실패: ' + e.message);
    }
  };

  return (
    <div className="toolbar">
      {/* 가운데 두 줄: 첫 줄은 파란 탭 묶음 + 게임 연결 표시 + 분홍 묶음, 둘째 줄은 메뉴 묶음. 모두 가운데 정렬 (세션 77·78) */}
      <div className="tb-center">
      <div className="tb-left">
      <ViewSwitch />
      <LiveBadge />
      {/* 분홍 묶음: 프로젝트 제목, 렌파이에서 실행, 스크립트 따라가기. 파란 탭 묶음과 같은 줄·같은 높이에 두되 따로 떨어진 묶음 (세션 78) */}
      <div className="tb-ctx" role="group" aria-label="프로젝트와 실행">
      <input
        className="ptitle"
        value={s.project.project.title}
        onChange={(e) => s.update((p) => void (p.project.title = e.target.value), 'ptitle')}
        placeholder="프로젝트 제목"
        title="프로젝트 제목 (눌러서 고쳐요)"
      />
      <RunItems />
      </div>
      </div>
      {/* 메뉴: 둘째 줄 왼쪽부터. 자주 쓰는 되돌리기, 집중, 설정이 맨 앞 */}
      <div className="tb-right">
      <button className="tb-icon" aria-label="실행 취소" disabled={!s.past.length} onClick={s.undo} title={'실행 취소 ' + keyOf('undo')}><Undo2 size={16} strokeWidth={2} aria-hidden /></button>
      <button className="tb-icon" aria-label="다시 실행" disabled={!s.future.length} onClick={s.redo} title={'다시 실행 ' + keyOf('redo')}><Redo2 size={16} strokeWidth={2} aria-hidden /></button>
      <button className="focus-btn" onClick={toggleFocus} title={'집중 모드: 캔버스만 남기기 ' + keyOf('focus')}>집중</button>
      <button onClick={() => useStore.setState({ showPrefs: true })} title="화면 색, 단축키">설정</button>
      <button onClick={() => openHelp()} title="쓰는 법과 설명 모음 (F1)">도움말</button>
      <LangSelect />
      <button onClick={() => useStore.setState({ showFind: !s.showFind })} title={'대사, 선택지, 상자 제목에서 찾기·바꾸기 ' + keyOf('find')}>찾기</button>
      <span className="sep" />
      <button onClick={newProject}>새로</button>
      <button onClick={openProject}>열기</button>
      <button onClick={() => saveProject()} title={keyOf('save')}>저장</button>
      <button onClick={() => saveProject(true)} title={keyOf('saveAs')}>다른 이름</button>
      <FolderButtons />
      <span className="sep" />
      <button onClick={() => setAskMemo(true)} title="지금 대본을 이 컴퓨터에 한 판 남겨요. [버전 목록]에서 되돌려요">버전 저장</button>
      <button onClick={() => setShowVersions(true)}>버전 목록</button>
      <span className="sep" />
      <button onClick={() => exportRpyFile(false)}>.rpy 내보내기</button>
      {hasRpyTarget() && <button onClick={() => exportRpyFile(true)} title={keyOf('export')}>같은 곳에 다시</button>}
      </div>
      </div>
      {showVersions && <Versions onClose={() => setShowVersions(false)} />}
      {askMemo && <VersionMemo onSave={saveVersion} onClose={() => setAskMemo(false)} />}
    </div>
  );
}

// 렌파이 프로젝트 폴더를 열고 읽는 단추. 앱은 프로젝트 하나를 연 채라 다시 읽기·폴더 열기·다른 프로젝트
function FolderButtons() {
  const reread = () => void pullInbox(true).then(() => scanFolder());
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  if (isDesktop)
    return (
      <>
        <span className="sep" />
        <button onClick={reread} title="프로젝트 폴더의 그림·소리와 게임 안 pygaki editor가 넣은 줄을 다시 읽어요">다시 읽기</button>
        <button className={menu ? 'on' : ''} onClick={(e) => setMenu(menu ? null : e.currentTarget)} title="그림, 영상, 소리, 효과처럼 기능마다 쓰는 폴더를 탐색기로 열어요">폴더 관리 ▾</button>
        {menu && <FolderMenu anchor={menu} onClose={() => setMenu(null)} />}
        <button onClick={openIconsDialog} title="게임 창 아이콘과 윈도우 exe 아이콘 (배포할 때 쓰는 아이콘)">아이콘</button>
        <button onClick={() => void desktop!.choose()} title="다른 렌파이 프로젝트를 새 창으로 열어요">다른 프로젝트</button>
      </>
    );
  return null;
}

// 분홍 묶음의 두 단추 (세션 77, 78에 첫 줄로 옮김). 둘 다 켜짐/꺼짐 꼴: 켜짐은 옅은 바탕, 꺼짐은 바탕 없음
// - 렌파이에서 실행: 게임이 꺼져 있으면 켜짐(누를 수 있음). 게임이 켜져 있으면(앱과 연결됨, 다시 읽는 중) 꺼짐(누를 수 없음).
//   플러그인이 없는 게임은 앱이 켜진 줄 몰라서 켜짐으로 보이고, 누르면 runInRenpy가 "이미 켜져 있어요"라고 알린다
// - 스크립트 따라가기(예전 이름 게임 줄 따라가기): 렌파이 폴더를 연결했을 때만. 고치고 잠깐 멈추면 script_flow.rpy로 저절로 내보내고,
//   켜 두면 켜 둔 게임을 지금 쓰는 줄로 옮긴다
function RunItems() {
  const running = useLive((l) => l.on || l.reloading);
  const link = useStore((s) => s.project.settings.renpyLink);
  const name = useGameFolder((g) => g.name);
  const [on, setOn] = useState(followLine);
  const follow = !!link && !!name;
  if (!isDesktop && !follow) return null;
  return (
    <>
      <span className="ctx-sep" />
      {isDesktop && (
        <button
          className={'ctx-item' + (running ? '' : ' on')}
          disabled={running}
          onClick={() => void runInRenpy()}
          title={running ? '게임이 켜져 있어요. 고친 대본은 게임이 저절로 다시 불러와요' : '지금 대본을 내보내고 렌파이로 게임을 켜요. 이미 켜져 있을 때 어떻게 할지는 [설정]에서 골라요'}
        >
          <span>렌파이에서 실행</span>
          <span className="ctx-state">{running ? '실행 중' : ''}</span>
        </button>
      )}
      {follow && (
        <button
          className={'ctx-item' + (on ? ' on' : '')}
          aria-pressed={on}
          onClick={() => {
            setFollowLine(!on);
            setOn(!on);
          }}
          title={
            '고치고 잠깐 멈추면 script_flow.rpy로 저절로 내보내고, 켜 둔 게임이 다시 불러와요. ' +
            (on ? '켬: 게임을 지금 쓰는 줄로 옮겨요. 여러 곳을 고친 뒤 처음부터 훑어보려면 꺼요.' : '끔: 게임은 있던 자리에 그대로 있어요.')
          }
        >
          <span>스크립트 따라가기</span>
          <span className="ctx-state">{on ? '켬' : '끔'}</span>
        </button>
      )}
    </>
  );
}

// [버전 저장] 메모 창: 칸 하나 + [저장]·[취소]. Enter 저장, Esc 취소, 바탕 클릭도 취소
function VersionMemo({ onSave, onClose }: { onSave: (memo: string) => void; onClose: () => void }) {
  const [memo, setMemo] = useState('');
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <form
        className="modal ver-memo"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => (e.preventDefault(), onSave(memo))}
      >
        <h3>버전 저장<Hint text="이 컴퓨터 안에만 저장돼요. 중요한 때는 [저장]으로 파일도 남겨요" topic="저장과 백업" /></h3>
        <label className="tip" htmlFor="ver-memo-in">버전 메모 (비워도 돼요)</label>
        <input
          id="ver-memo-in"
          autoFocus
          value={memo}
          maxLength={80}
          placeholder="예: 1장 완성, 엔딩 분기 추가 전"
          onChange={(e) => setMemo(e.target.value)}
        />
        <div className="row end">
          <button type="button" onClick={onClose}>취소</button>
          <button type="submit" className="primary">저장</button>
        </div>
      </form>
    </div>
  );
}

function Versions({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<Snapshot[] | null>(null);
  const reload = () => snapList().then(setList).catch(() => setList([]));
  useEffect(() => void reload(), []);
  // Esc로 닫기 (세션 118: 바탕 클릭으로만 닫히던 것)
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);

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
        <h3>버전 목록<Hint text="이 컴퓨터 안에만 저장돼요. 중요한 때는 [저장]으로 파일도 남겨요" topic="저장과 백업" /></h3>
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

// 언어 버튼: 대본 편집기 화면 글 (도움말 문서는 한국어만). 고른 언어는 이 컴퓨터에 기억
function LangSelect() {
  const [l, setL] = useState<Lang>(getLang());
  return (
    <select className="lang-sel" data-no-tr value={l} title="Language" onChange={(e) => (setLang(e.target.value as Lang), setL(e.target.value as Lang))}>
      {LANGS.map(([k, t]) => (
        <option key={k} value={k}>{t}</option>
      ))}
    </select>
  );
}
