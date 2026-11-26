// showpy 화면 (데스크톱 앱 전용). 게임 창은 옆에 그대로 두고, 게임 창의 GUI 편집기를 여기서 조종한다.
// 왼쪽: 고칠 것 목록 / 가운데: 지금 게임 위치와 대본 / 오른쪽: 고르는 칸.
// 값은 게임이 갖고 있고(docs/LINK.md 9장), 여기는 보여주고 바꾸라고 보내기만 한다. 저장도 게임이 한다.
import { Hint } from './Help';
import { Resizer } from './Resizer';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { desktop } from './desktop';
import { GAME_VIEW_LABEL, liveSend, nextGameView, panelCmd, toggleGamePanel, useLive, type GameState, type TitleItem, type TitleState } from './showpyLive';
import { keyOf } from './prefs';
import { useStore } from './store';
import { CustomUIPanel } from './ShowpyCustomUI';
import { MirrorPanel } from './ShowpyMirror';
import { Card } from './Card';

interface Section {
  id: string;
  label: string;
  tab: string | null; // 게임 창의 GUI 편집기 탭
  app: boolean; // 앱에 따로 만든 칸이 있음
  mirror?: boolean; // 게임 안 패널을 통째로 옮겨 그림
  note: string;
}

const SECTIONS: Section[] = [
  { id: 'splash', label: '스플래시 페이지', tab: 'splash', app: false, mirror: true, note: '게임을 켰을 때 타이틀 전에 나오는 페이지예요. 여기서 고쳐요. 예전 판이면 splash/splash_config.rpy에서 고쳐요.' },
  { id: 'title', label: '타이틀 메뉴', tab: 'title', app: true, note: '' },
  { id: 'title_fx', label: '타이틀 셰이더', tab: 'title_fx', app: false, mirror: true, note: '타이틀에만 걸리는 셰이더 두 자리예요. 1번과 2번에 고른 것이 겹쳐요. 일렁임(예전 "타이틀 일렁임")도 여기서 골라요.' },
  { id: 'pause', label: 'ESC 메뉴', tab: 'title', app: true, note: '' },
  { id: 'pause_fx', label: '게임 내 메뉴 셰이더', tab: 'pause_fx', app: false, mirror: true, note: 'ESC 메뉴와 거기서 연 화면에만 걸리는 셰이더 두 자리예요. 메뉴가 열려 있는 동안 뒤 게임 화면도 이 셰이더로 보여요.' },
  { id: 'screen_fx', label: '셰이더 기본 값', tab: 'screen_fx', app: false, mirror: true, note: '셰이더마다 처음 값(세부 값)을 게임 화면을 보면서 고쳐요. 타이틀, 게임 내 메뉴 셰이더와, 상자에서 값을 따로 정하지 않은 곳이 이 값을 써요. 상자마다 다른 값은 [대본 편집]에서 상자나 label의 ◐ 셰이더로 정해요.' },
  { id: 'custom_ui', label: '커서, 클릭 대기, 대사 소리', tab: 'custom_ui', app: true, note: '' },
  { id: 'say', label: '대사 상자', tab: 'say', app: false, mirror: true, note: '대사 상자의 처음 위치와 모양이에요. 줄마다 다른 위치는 [대본 편집] 대사 카드의 줄마다 있는 [위치 옮기기]로 정해요.' },
  { id: 'choice', label: '선택지', tab: 'choice', app: false, mirror: true, note: '선택지의 처음 위치와 모양이에요. 상자마다 다른 위치는 [대본 편집] 다음 흐름 카드의 [위치 옮기기]로 정해요.' },
  { id: 'stage', label: '그림, 영상 배치', tab: 'stage', app: false, mirror: true, note: '그림을 넣는 것은 [대본 편집] 상자의 배경, 그림·영상 카드에서 해요. 여기서는 게임 화면에서 자리를 끌어 정해요.' },
  { id: 'hotkeys', label: '단축키 수정', tab: 'hotkeys', app: false, mirror: true, note: '기능 옆 키 단추를 누르고 게임 창에서 바꿀 키를 눌러요. 다른 기능이 쓰는 키면 경고와 안내가 나와요. [안내 화면으로 내보내기]를 누르면 조작 안내 화면의 표가 이 설정을 따라가고, 보여 줄 기능은 조작 안내 화면에서 골라요. 예전 pygaki 플러그인에는 없어요.' },
  { id: 'ui_text', label: '종료 메시지, 버튼 글', tab: 'ui_text', app: false, mirror: true, note: '종료 확인 창, 퀵메뉴 버튼 같은 글을 바꿔요. 예전 pygaki 플러그인에는 없어요.' },
  { id: 'screens', label: '화면, HUD 자리', tab: 'screens', app: false, mirror: true, note: '[대본 편집]의 [화면] 탭에서 만든 화면과 HUD를 게임 화면 위에서 고쳐요. 항목을 끌어 옮기고, HUD는 붙일 곳과 크기를 정하고, 글을 고쳐요. 저장하면 대본에도 받아 적어요. 항목을 더하거나 지우는 것과 버튼이 할 일은 [화면] 탭에서 해요. 예전 pygaki 플러그인에는 없어요.' },
];

// 왼쪽 목록의 카드 묶음
const GROUPS: { title: string; ids: string[] }[] = [
  { title: '스플래시', ids: ['splash', 'hotkeys'] },
  { title: '타이틀 메뉴', ids: ['title', 'title_fx', 'screen_fx'] },
  { title: '게임 내 메뉴', ids: ['pause', 'pause_fx'] },
  { title: '확인 창, UI 글', ids: ['ui_text'] },
  // 상자마다 바꾸는 것은 [대본 편집]으로 옮겼다(세션 32). 여기는 상자에서 정하지 않았을 때 쓰는 게임 처음 값만
  { title: '게임 처음 값', ids: ['say', 'choice', 'stage', 'custom_ui'] },
];

// 스플래시 기본 페이지는 우리말 이름, 사용자가 만든 페이지는 제목(없으면 id)
const PAGE_NAMES: Record<string, string> = { logo: '로고', warning: '경고', controls: '조작 안내 화면' };
const pageLabel = (p: { id: string; title: string }) => PAGE_NAMES[p.id] ?? (p.title.replace(/\{[^}]*\}/g, '').trim() || p.id);

export function ShowpyView() {
  const { on, st, section, err } = useLive();
  const sec = SECTIONS.find((s) => s.id === section) ?? SECTIONS[1];
  const mirrorOk = !!st && st.panel !== undefined; // 게임의 showpy가 패널을 통째로 보낼 수 있음
  const inApp = (s: Section) => s.app || (!!s.mirror && mirrorOk);

  const choose = (s: Section) => {
    useLive.setState({ section: s.id });
    if (!s.tab) return;
    // 편집기가 열려 있으면 게임 화면의 클릭과 키가 편집기로 간다. 앱 칸만으로 되는 곳은 열지 않음
    if (s.id === 'custom_ui' && st?.custom_ui?.values) {
      if (st.editor.open && st.editor.hide_panel) liveSend({ cmd: 'editor', open: false });
      return;
    }
    // 게임 창에도 보이기로 해 두었으면(F9) 숨기지 않음
    // 앱 칸으로 고치는 곳이면 기억해 둔 모양(F9)대로, 게임 창 패널로만 고치는 곳이면 숨김은 축약형으로
    const gv = useLive.getState().gamePanel;
    liveSend(panelCmd(inApp(s) || gv !== 'hidden' ? gv : 'compact'));
    liveSend({ cmd: 'editor', open: true, tab: s.tab });
  };

  // pygaki editor의 [pygaki 앱에서 고르기]: 그 탭의 칸을 고름. 게임과 아직 안 붙었으면(게임이 앱을 막 켰을 때) 칸만 골라 두고
  // 붙으면 그때 게임에도 그 탭을 엶 (그래야 칸이 보임)
  const want = useLive((s) => s.want);
  const wantLater = useRef<Section | null>(null);
  useEffect(() => {
    if (!want) return;
    useLive.setState({ want: null, wantField: want.field ? { f: want.field, n: want.n } : null });
    const tab = WANT_TAB[want.tab] ?? want.tab;
    const s = SECTIONS.find((x) => x.id === tab) ?? SECTIONS.find((x) => x.tab === tab);
    if (!s) return;
    wantLater.current = null;
    if (on && st) choose(s);
    else {
      wantLater.current = s;
      useLive.setState({ section: s.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want?.n]);
  const ready = on && !!st;
  useEffect(() => {
    const s = wantLater.current;
    if (!ready || !s) return;
    wantLater.current = null;
    if (useLive.getState().section === s.id) choose(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // 그 탭에서 누른 칸(data-f)이 화면에 오면 그 줄로 내려가 잠깐 강조. 게임 패널(옮겨 그린 것)이 늦게 오면 올 때까지.
  // 앱을 막 켰으면 게임과 붙을 때까지 기다리고, 붙은 뒤 5초 안에 안 오면 그만둠
  const wantField = useLive((s) => s.wantField);
  const viewRef = useRef<HTMLDivElement>(null);
  const fieldSince = useRef(0);
  useEffect(() => {
    if (!wantField || !on || !st) return;
    if (fieldSince.current < wantField.n) fieldSince.current = Math.max(wantField.n, Date.now());
    if (Date.now() - fieldSince.current > 5000) return void useLive.setState({ wantField: null });
    const el = viewRef.current?.querySelector(`[data-f="${wantField.f}"]`);
    if (!el) return;
    useLive.setState({ wantField: null });
    const row = (el.closest('.sp-m-h, .sp-field') ?? el) as HTMLElement;
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row.classList.remove('sp-m-want');
    void row.offsetWidth;
    row.classList.add('sp-m-want');
    window.setTimeout(() => row.classList.remove('sp-m-want'), 1600);
  }, [wantField, on, st]);

  // 가운데 스크립트 칸은 볼 일이 드물어 기본은 접고, 위의 [>_ 스크립트] 단추로 편다 (세션 79). 접으면 오른쪽 편집 칸이 그 자리까지 넓어진다
  const [script, setScript] = useState(() => {
    try {
      return localStorage.getItem('pygaki-gui-script') === 'on';
    } catch {
      return false;
    }
  });
  const toggleScript = () =>
    setScript((v) => {
      try {
        localStorage.setItem('pygaki-gui-script', v ? 'off' : 'on');
      } catch {
        // 기억 못 해도 이번 창에서는 바뀜
      }
      return !v;
    });

  return (
    <div className={'sp-view sp-cards' + (script ? '' : ' script-off')} ref={viewRef}>
      <div className="sp-hint">
        <span className="sp-hint-t">
          GUI 편집
          <Hint text={`게임 창 옆에 두고 써요 · 왼쪽에서 고칠 곳을 고르면 게임도 그 화면으로 · 게임 화면에서 끌어서 옮기고 숫자는 오른쪽에서 · ${keyOf('save')} 저장 · 게임 창에서 Esc: 편집 닫고 게임 진행`} topic="GUI 편집] 화면" />
        </span>
        <button className={'sp-script-tg' + (script ? ' on' : '')} aria-pressed={script} onClick={toggleScript} title={script ? '가운데 스크립트(지금 원고 줄) 칸을 접어요' : '게임이 지금 읽는 원고 줄을 가운데 칸에 펴서 봐요'}>
          <TermIcon />
          스크립트
        </button>
      </div>
      <nav className="sp-nav">
        {GROUPS.map((g) => (
          <Card key={g.title} id={'gn-' + g.title} title={g.title} className="sp-group">
            {g.ids.map((id) => {
              const s = SECTIONS.find((x) => x.id === id)!;
              const t = s.tab ? st?.editor.tabs.find((x) => x.id === s.tab) : null;
              const item = (sub = false) => (
                <button key={s.id} className={'sp-nav-item' + (sub ? ' sub' : '') + (s.id === sec.id ? ' on' : '')} onClick={() => choose(s)} title={t && !t.ok ? t.why : ''}>
                  {s.label}
                  {!inApp(s) && <span className="sp-badge">게임 안</span>}
                </button>
              );
              // 단축키 수정: 게임에 그 탭이 있을 때만, 조작 안내 화면 바로 아래 
              const keysPage = st?.splash?.pages.some((p) => p.keys);
              if (s.id === 'hotkeys') return !st || t ? (keysPage ? null : item()) : null;
              // 스플래시는 페이지마다 항목 (. 예전 판이면 항목 하나)
              if (s.id === 'splash' && st?.splash?.pages.length) {
                const hk = SECTIONS.find((x) => x.id === 'hotkeys')!;
                const hkTab = st.editor.tabs.find((x) => x.id === 'hotkeys');
                return st.splash.pages.map((p) => [
                  <button
                    key={'splash-' + p.id}
                    className={'sp-nav-item' + (sec.id === 'splash' && st.splash?.cur === p.id ? ' on' : '')}
                    onClick={() => (choose(s), liveSend({ cmd: 'splash.page', id: p.id }))}
                    title={p.id}
                  >
                    {pageLabel(p)}
                    {!inApp(s) && <span className="sp-badge">게임 안</span>}
                  </button>,
                  p.keys && hkTab ? (
                    <button key="hotkeys" className={'sp-nav-item sub' + (sec.id === 'hotkeys' ? ' on' : '')} onClick={() => choose(hk)} title={hkTab.ok ? '' : hkTab.why}>
                      {hk.label}
                      {!inApp(hk) && <span className="sp-badge">게임 안</span>}
                    </button>
                  ) : null,
                ]);
              }
              return item();
            })}
          </Card>
        ))}
      </nav>
      <Resizer size="guiLeftW" grow={1} className="left" />
      {script && (
        <div className="sp-main">
          {!on ? <NotConnected /> : st ? <Where st={st} /> : <p className="tip">게임 상태를 기다리는 중...</p>}
        </div>
      )}
      {script && <Resizer size="guiRightW" grow={-1} className="right" />}
      {/* 오른쪽 칸도 대본 편집처럼 카드: 저장·편집기 카드 + 고치는 칸 카드 (커서·대사 소리는 칸마다 카드) */}
      <div className="sp-panel">
        <Card id="g-bar" title="저장과 게임 안 pygaki editor">
          {on && st && <EditorBar st={st} />}
          {err && <p className="sp-err">{err}</p>}
          {!on && (script ? <p className="tip">게임과 연결되면 여기서 고쳐요.</p> : <NotConnected />)}
        </Card>
        {on && st && (sec.id === 'custom_ui' && st.custom_ui !== undefined ? (
          <CustomUIPanel cu={st.custom_ui} />
        ) : (
          <Card id={'g-' + sec.id} title={sec.id === 'splash' && st.splash?.cur ? '스플래시: ' + pageLabel(st.splash.pages.find((p) => p.id === st.splash!.cur) ?? { id: st.splash.cur, title: '' }) : sec.label} hint={sec.note || undefined} topic="GUI 편집] 화면">
            {sec.id === 'title' || sec.id === 'pause' ? (
              <TitlePanel st={st} want={sec.id} />
            ) : sec.mirror && mirrorOk ? (
              <MirrorSection st={st} sec={sec} />
            ) : (
              <InGamePanel st={st} sec={sec} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// [스크립트] 단추의 터미널 아이콘 (>_)
function TermIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" />
      <path d="M4.5 6.5 L6.8 8.5 L4.5 10.5" />
      <path d="M8.5 10.5 H11.5" />
    </svg>
  );
}

function NotConnected() {
  return (
    <div className="sp-help">
      <h3>게임을 개발 모드로 켜 주세요<Hint text="pygaki 플러그인이 든 게임을 개발 모드로 켜면 저절로 붙어요. 배포판에서는 안 붙어요" topic="GUI 편집] 화면" /></h3>
      <ol>
        <li>렌파이 런처에서 이 프로젝트를 고르고 [프로젝트 실행]을 눌러요. (개발 모드로 켜져요)</li>
        <li>게임이 켜지면 game 폴더에 showpy_live.json이 생기고, 이 앱이 저절로 붙어요.</li>
        <li>게임 창과 이 창을 나란히 놓고 써요. 게임 화면에서는 끌어서 옮기고, 숫자와 목록은 여기서 봐요.</li>
      </ol>
    </div>
  );
}

// ── 가운데: 지금 위치와 대본 ──

const SCREEN_NAMES: Record<string, string> = {
  main_menu: '타이틀', tmenu_pause: 'ESC 메뉴', say: '대사', choice: '선택지', preferences: '환경설정', save: '저장', load: '불러오기',
  history: '대사록', about: '버전정보', help: '조작방법', splash_page: '스플래시', quick_menu: '퀵메뉴', confirm: '확인 창',
};
const HIDDEN_SCREENS = new Set(['ui_editor_live', 'ui_editor_pk_watch', 'ui_editor_root']);

function Where({ st }: { st: GameState }) {
  const w = st.where;
  const screens = w.screens.filter((s) => !HIDDEN_SCREENS.has(s));
  return (
    <>
      <div className="sp-card">
        <div className="sp-row">
          <b>지금 화면</b>
          {screens.length ? screens.map((s) => <span key={s} className="sp-chip">{SCREEN_NAMES[s] ?? s}</span>) : <span className="tip">없음</span>}
        </div>
        <div className="sp-row">
          <b>원고 위치</b>
          <span className="sp-mono">{w.file ? `${w.file}:${w.line}` : '-'}</span>
          {w.main_menu && <span className="tip">(타이틀에 있어요)</span>}
        </div>
      </div>
      <Script file={w.file} line={w.line} />
    </>
  );
}

// PyKaki 표시: 줄 전체(예전 형식)이거나 문장 끝에 붙는다 (docs/LINK.md 2장)
const MARK_ROW = /^\s*#\s*@(l|node|end):/;
const MARK_TAIL = /\s+#\s*@(l|node|end):\S+[^#]*$/;
// 게임 탭 id → 앱 칸 id (같지 않은 것만)
const WANT_TAB: Record<string, string> = { watermorph: 'title_fx' };

const MARK = /(?:^|\s)#\s*@(l|node|end):/;

function Script({ file, line }: { file: string | null; line: number }) {
  const [text, setText] = useState<{ file: string; lines: string[] | null } | null>(null);
  const [rev, setRev] = useState(0);
  // 게임 줄을 따라 스크롤. 사용자가 직접 스크롤하면 멈추고 [지금 줄로]로 다시 따라감
  const [follow, setFollow] = useState(true);
  // PyKaki 표시 줄(# @l:, # @node:, # @end:) 숨기기. 줄 번호는 그대로 둔다 (이 창에만 기억)
  const [hideMarks, setHideMarks] = useState(() => {
    try {
      return localStorage.getItem('pygaki-hide-marks') !== 'off';
    } catch {
      return true;
    }
  });
  const box = useRef<HTMLPreElement>(null);
  const auto = useRef(0); // 우리가 스크롤한 때 (그 스크롤 이벤트는 사용자 것으로 치지 않음)

  const toCurrent = (smooth: boolean) => {
    const el = box.current?.querySelector<HTMLElement>('div.cur');
    const b = box.current;
    if (!el || !b) return;
    auto.current = Date.now() + (smooth ? 900 : 0);
    b.scrollTo({ top: el.offsetTop - b.clientHeight / 2 + el.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (!desktop) return;
    return desktop.onChange((rel) => {
      if (rel === file) setRev((r) => r + 1);
    });
  }, [file]);

  useEffect(() => {
    if (!file || !desktop) return setText(null);
    let alive = true;
    desktop.read(file).then((b) => {
      if (alive) setText({ file, lines: b ? new TextDecoder().decode(b).split(/\r?\n/) : null });
    });
    return () => void (alive = false);
  }, [file, rev]);

  const ready = !!text && text.file === file && !!text.lines;
  useLayoutEffect(() => {
    if (ready && follow) toCurrent(false);
  }, [ready, file, line, follow]);

  if (!file) return null;
  if (!text || text.file !== file) return <p className="tip">원고를 읽는 중...</p>;
  if (!text.lines) return <p className="tip">{file}은 프로젝트 밖(렌파이 안쪽) 파일이라 보여줄 수 없어요.</p>;

  const lines = text.lines;

  // PyKaki가 내보낸 원고면 줄 위의 "# @node:id 이름" 표시로 상자를 찾는다 (docs/LINK.md 2장)
  let node: { id: string; name: string } | null = null;
  for (let i = Math.min(line, lines.length) - 1; i >= 0; i--) {
    const m = /(?:^|\s)#\s*@node:(\S+)[ \t]*(.*)$/.exec(lines[i]);
    if (m) {
      node = { id: m[1], name: m[2] };
      break;
    }
  }

  const goBox = () => {
    if (!node) return;
    useStore.getState().select([node.id]);
    useLive.setState({ view: 'script' });
  };

  return (
    <div className="sp-card">
      <div className="sp-row">
        <b>원고</b>
        {node && (
          <button onClick={goBox} title="대본 화면에서 이 상자를 골라요">
            대본 상자: {node.name || node.id} →
          </button>
        )}
        <span className="tip">줄을 누르면 게임도 그 줄로 가요</span>
        {lines.some((l) => MARK.test(l)) && (
          <button
            className={hideMarks ? 'on' : ''}
            title="pygaki가 줄을 찾으려고 넣은 표시 줄(# @l: 등)을 숨겨요. 파일은 그대로예요"
            onClick={() => {
              try {
                localStorage.setItem('pygaki-hide-marks', hideMarks ? 'off' : 'on');
              } catch {
                /* 이번만 */
              }
              setHideMarks(!hideMarks);
            }}
          >
            표시 숨기기: {hideMarks ? '켬' : '끔'}
          </button>
        )}
        <span className="grow" />
        {!follow && (
          <button
            onClick={() => {
              setFollow(true);
              toCurrent(true);
            }}
            title="게임의 지금 줄로 스크롤하고, 다시 따라가요"
          >
            지금 줄로 ({line})
          </button>
        )}
      </div>
      <pre
        className="sp-script"
        ref={box}
        onScroll={() => {
          if (Date.now() - auto.current > 400) setFollow(false);
        }}
      >
        {lines.map((l, i) => {
          const n = i + 1;
          if (hideMarks && n !== line && MARK_ROW.test(l)) return null;
          return (
            <div
              key={n}
              data-n={n}
              className={n === line ? 'cur' : 'go'}
              onClick={n === line ? undefined : () => liveSend({ cmd: 'goto', where: 'line', file, line: n })}
              title={n === line ? '게임의 지금 줄' : '게임을 이 줄로 옮겨요 (지나온 줄이면 되감기, 아니면 게임을 다시 시작해서 건너뜀)'}
            >
              <span className="ln">{n}</span>
              {(hideMarks ? l.replace(MARK_TAIL, '') : l) || ' '}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

// ── 오른쪽 위: 편집기 상태, 저장 ──

function EditorBar({ st }: { st: GameState }) {
  const e = st.editor;
  const gv = e.view ?? (e.hide_panel ? 'hidden' : 'compact');
  return (
    <div className="sp-bar">
      <div className="sp-row">
        <button className="primary" disabled={!e.pending} onClick={() => liveSend({ cmd: 'save' })} title="게임 창 편집 화면의 Ctrl+S와 같아요">
          저장 {e.pending ? `(${e.pending})` : ''}
        </button>
        <button
          disabled={!e.open}
          onClick={() => confirm('지금 탭의 저장 안 한 변경을 모두 버릴까요?') && liveSend({ cmd: 'discard' })}
        >
          버리기
        </button>
        <span className="grow" />
        {e.open ? <button onClick={() => liveSend({ cmd: 'editor', open: false })}>편집기 닫기</button> : <span className="tip">편집기 꺼짐</span>}
      </div>
      <div className="sp-row">
        <button
          className={e.open && !e.hide_panel ? 'on' : ''}
          onClick={() => useStore.getState().say(toggleGamePanel())}
          title={`게임 창 pygaki editor 패널을 바꿔요. ${keyOf('gamePanel')}를 누를 때마다 축약형(자리 옮기기만) → 대형(값 칸 전부) → 숨김(여기서만 고침) 차례로 돌아요. 끄기는 게임 창에서 Esc. 게임 창에서도 같은 키예요`}
        >
          {`게임 창 pygaki editor: ${e.open ? GAME_VIEW_LABEL[gv] : '꺼짐'} (${keyOf('gamePanel')} → ${GAME_VIEW_LABEL[e.open ? nextGameView(gv) : 'compact']})`}
        </button>
      </div>
      {e.open && e.hide_panel && (
        <div className="sp-editing" title="편집 중에는 게임 화면의 클릭과 키가 편집기로 가요(끌어서 옮기기용). 게임을 진행하려면 편집기를 닫아요 (게임 창에서 Esc)">
          <span>편집 중: 게임 클릭은 편집기로 가요</span>
        </div>
      )}
      {e.message && <p className="sp-msg">{e.message}</p>}
    </div>
  );
}

// ── 게임 안 패널을 통째로 옮겨 그리는 것  ──

function MirrorSection({ st, sec }: { st: GameState; sec: Section }) {
  const t = sec.tab ? st.editor.tabs.find((x) => x.id === sec.tab) : null;
  const open = () => (liveSend(panelCmd('hidden')), liveSend({ cmd: 'editor', open: true, tab: sec.tab }));
  if (!t)
    return (
      <div>
        <p className="tip">이 게임에는 이 편집기 탭이 없어요. (플러그인이 빠져 있거나 예전 판일 수 있어요)</p>
      </div>
    );
  const here = !!st.panel && st.panel.tab === sec.tab;

  // 그 탭을 쓸 수 없는 화면이면 갈 곳 버튼 (대사, 선택지, 그림은 게임 중 / 일렁임은 타이틀)
  const go = !t.ok && (
    <p>
      {sec.id === 'watermorph' || sec.id === 'title_fx' ? (
        !st.where.main_menu && <button onClick={() => confirm('타이틀로 갈까요? 진행 중인 게임은 끝나요.') && liveSend({ cmd: 'goto', where: 'title' })}>타이틀로 가기</button>
      ) : sec.id === 'pause_fx' ? (
        !st.where.main_menu && !st.where.menu ? <button onClick={() => liveSend({ cmd: 'goto', where: 'pause' })}>ESC 메뉴 열기</button> : null
      ) : st.where.main_menu ? (
        <button onClick={() => liveSend({ cmd: 'goto', where: 'start' })}>게임 시작</button>
      ) : null}
    </p>
  );

  if (here)
    return (
      <>
        {go}
        <MirrorPanel panel={st.panel!} />
      </>
    );
  return (
    <div>
      {!t.ok && <p className="sp-warn">{t.why || '지금 화면에서는 쓸 수 없어요.'}</p>}
      {go}
      <button className="primary" onClick={open}>
        편집 시작
      </button>
      {/* 예전 pygaki 플러그인은 게임 창 패널이 보이면 앱에 패널을 안 보냄 */}
      {st.editor.open && !st.editor.hide_panel && st.editor.tab === sec.tab && <p className="tip">게임 창 패널에 열려 있어요 ({keyOf('gamePanel')}로 숨김까지 넘기면 여기로)</p>}
    </div>
  );
}

// ── 앱 칸이 아직 없는 것: 게임 안 패널로 ──

function InGamePanel({ st, sec }: { st: GameState; sec: Section }) {
  const t = sec.tab ? st.editor.tabs.find((x) => x.id === sec.tab) : null;
  const here = st.editor.open && st.editor.tab === sec.tab;
  return (
    <div>
      <p className="tip">이 칸은 아직 앱으로 옮기지 않았어요. 지금은 게임 창의 편집 화면 패널에서 고쳐요.</p>
      {sec.tab &&
        (!t ? (
          <p className="tip">이 게임에는 이 편집기 탭이 없어요. (플러그인이 빠져 있을 수 있어요)</p>
        ) : !t.ok ? (
          <p className="sp-warn">{t.why || '지금 화면에서는 쓸 수 없어요.'}</p>
        ) : here ? (
          <p className="tip">게임 창에 이 탭 패널이 열려 있어요.</p>
        ) : (
          <button onClick={() => (liveSend(panelCmd('full')), liveSend({ cmd: 'editor', open: true, tab: sec.tab }))}>게임 창 pygaki editor에서 열기</button>
        ))}
      {here && st.editor.info.length > 0 && (
        <pre className="sp-info">{st.editor.info.join('\n')}</pre>
      )}
    </div>
  );
}

// ── 타이틀 메뉴, ESC 메뉴 ──

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

function TitlePanel({ st, want }: { st: GameState; want: 'title' | 'pause' }) {
  const t = st.title;
  if (!t) return <p className="sp-warn">타이틀 메뉴 기능(tmenu)이 없거나 꺼져 있어요.</p>;

  const atTitle = st.where.main_menu && st.where.screens.includes('main_menu');
  const inGame = !st.where.main_menu && !st.where.menu;
  const showing = t.ok && t.menu === want;

  if (!showing) {
    return (
      <div>
        {want === 'title' ? (
          <>
            <p>게임이 타이틀 화면에 있어야 고칠 수 있어요.</p>
            {!atTitle && (
              <button onClick={() => confirm('타이틀로 갈까요? 진행 중인 게임은 끝나요.') && liveSend({ cmd: 'goto', where: 'title' })}>타이틀로 가기</button>
            )}
          </>
        ) : (
          <>
            <p>게임 중에 ESC 메뉴를 연 채로 고쳐요.</p>
            {inGame ? (
              <button onClick={() => liveSend({ cmd: 'goto', where: 'pause' })}>ESC 메뉴 열기</button>
            ) : (
              <p className="tip">게임을 시작한 뒤 ESC 메뉴 열기를 눌러요.</p>
            )}
          </>
        )}
        {!st.editor.open && (
          <p className="tip">
            <button onClick={() => (liveSend(panelCmd('hidden')), liveSend({ cmd: 'editor', open: true, tab: 'title' }))}>편집기 열기</button>
          </p>
        )}
      </div>
    );
  }

  if (!st.editor.open || st.editor.tab !== 'title') {
    return (
      <div>
        <button className="primary" onClick={() => (liveSend(panelCmd('hidden')), liveSend({ cmd: 'editor', open: true, tab: 'title' }))}>
          편집 시작
        </button>
      </div>
    );
  }

  const it = t.items[t.sel] as TitleItem | undefined;
  return (
    <div className="sp-title">
      <div className="sp-seg">
        <button className={t.mode === 'base' ? 'on' : ''} onClick={() => liveSend({ cmd: 'title.mode', mode: 'base' })}>평소</button>
        <button className={t.mode === 'hover' ? 'on' : ''} onClick={() => liveSend({ cmd: 'title.mode', mode: 'hover' })}>선택됐을 때</button>
      </div>
      <div className="sp-seg">
        <button className={t.scope === 'item' ? 'on' : ''} onClick={() => liveSend({ cmd: 'title.scope', scope: 'item' })}>이 항목만</button>
        <button className={t.scope === 'all' ? 'on' : ''} onClick={() => liveSend({ cmd: 'title.scope', scope: 'all' })}>모든 항목 공통</button>
      </div>

      {t.background !== undefined && <BackgroundField t={t} />}

      <div className="sp-items">
        {t.items.map((x, i) => (
          <button key={x.kind + ':' + x.id} className={'sp-item' + (i === t.sel ? ' on' : '')} onClick={() => liveSend({ cmd: 'title.select', index: i })}>
            <span>{x.kind === 'label' ? x.text || '(비어 있음)' : x.text}</span>
            <span className="tip">{x.kind === 'label' ? x.name : x.id}</span>
            {x.edited && <b className="dirty" title="저장 안 한 변경"> ●</b>}
          </button>
        ))}
      </div>

      {it && <TitleFields t={t} it={it} />}

      <div className="sp-row">
        <button onClick={() => liveSend({ cmd: 'title.reset' })}>{t.scope === 'all' ? '공통 값 되돌리기' : '이 항목 되돌리기'}</button>
      </div>
      <p className="tip">게임 화면에서도 고쳐요<Hint text="항목 끌기: 옮기기 · 분홍 네모 끌기: 돌리기(Shift: 15도씩) · Shift+휠: 글자 크기. 여기 숫자도 같이 바뀌어요" topic="GUI 편집] 화면" /></p>
    </div>
  );
}

// 배경: 그림이나 영상(webm). 없으면 타이틀은 검은 화면, ESC 메뉴는 투명 
function BackgroundField({ t }: { t: TitleState }) {
  const files = useLive((s) => s.files);
  useEffect(() => {
    if (!files?.movies) liveSend({ cmd: 'files' });
  }, [files]);
  const cur = t.background ?? '';
  const list = [...(files?.images ?? []), ...(files?.movies ?? [])];
  if (cur && !list.includes(cur)) list.unshift(cur);
  return (
    <label className="sp-field wide">
      <span>배경</span>
      <select value={cur} onChange={(e) => liveSend({ cmd: 'title.background', value: e.target.value || null })}>
        <option value="">{t.menu === 'pause' ? '없음 (투명, 뒤 게임 화면)' : '없음 (검은 화면)'}</option>
        {list.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <button onClick={() => liveSend({ cmd: 'files' })} title="game 폴더에 그림이나 영상을 새로 넣었으면 눌러요">
        목록 새로
      </button>
    </label>
  );
}

function TitleFields({ t, it }: { t: TitleState; it: TitleItem }) {
  const label = it.kind === 'label';
  const hover = t.mode === 'hover' && !label;
  const all = t.scope === 'all' && !label;
  const set = (key: string, value: unknown) => liveSend({ cmd: 'title.set', key, value });
  const k = (name: string) => (hover ? 'hover_' + name : name);

  // 공통 값은 tmenu.default + 저장된 공통 + 편집 중인 공통. 없으면 비워 둔다
  const common = (name: string) => {
    const c = t.common as Record<string, any>;
    return hover && c['hover_' + name] !== undefined ? c['hover_' + name] : c[name];
  };
  const look = hover ? it.hover : it;
  const val = (name: keyof typeof look) => (all ? common(String(name)) : (look as any)[name]);

  return (
    <div className="sp-fields">
      {!all && (label || t.scope === 'item') && (
        <TextField label={label ? it.name + ' 글' : '글'} value={it.text} placeholder={label ? '비우면 안 보여요' : ''} onSet={(v) => set('text', v)} />
      )}
      {!all &&
        (hover ? (
          <>
            <Num label="이동 x" value={it.hover.offset[0]} onSet={(v) => set('hover_offset', [Math.round(v), it.hover.offset[1]])} />
            <Num label="이동 y" value={it.hover.offset[1]} onSet={(v) => set('hover_offset', [it.hover.offset[0], Math.round(v)])} />
          </>
        ) : (
          <>
            <Num label="x" value={it.x} onSet={(v) => set('x', v)} />
            <Num label="y" value={it.y} onSet={(v) => set('y', v)} />
          </>
        ))}
      <Num label="회전" value={val('rotate')} step={0.5} round={r1} onSet={(v) => set(k('rotate'), v)} />
      {!label && <Num label="기울기" value={val('skew')} step={0.5} round={r1} onSet={(v) => set(k('skew'), v)} />}
      <Num label="확대" value={val('zoom')} step={0.05} round={r2} onSet={(v) => set(k('zoom'), Math.max(0.05, v))} />
      <Num label="글자 크기" value={val('size')} onSet={(v) => set(k('size'), Math.max(4, Math.round(v)))} />
      <ColorField label="색" value={val('color')} onSet={(v) => set(k('color'), v)} />
      <TextField label="글꼴" value={val('font')} placeholder="fonts/내글꼴.ttf" onSet={(v) => set(k('font'), v || null)} />
      {t.effects && (
        <label className="sp-field wide" data-f="text_effect">
          <span>글자 효과</span>
          <select value={(all ? (t.common as any).effect : it.effect) ?? ''} onChange={(e) => set('effect', e.target.value || null)}>
            {t.effects.map(([n, l]) => (
              <option key={n ?? ''} value={n ?? ''}>
                {l}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

// 입력하는 동안은 게임에서 오는 값으로 덮지 않는다
function Num({ label, value, step = 1, round = Math.round, onSet }: { label: string; value: any; step?: number; round?: (v: number) => number; onSet: (v: number) => void }) {
  const [txt, setTxt] = useState<string | null>(null);
  const shown = txt ?? (typeof value === 'number' ? String(round(value)) : '');
  return (
    <label className="sp-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={shown}
        placeholder="-"
        onFocus={() => setTxt(shown)}
        onBlur={() => setTxt(null)}
        onChange={(e) => {
          setTxt(e.target.value);
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onSet(v);
        }}
      />
    </label>
  );
}

function TextField({ label, value, placeholder, onSet }: { label: string; value: any; placeholder?: string; onSet: (v: string) => void }) {
  const [txt, setTxt] = useState<string | null>(null);
  const cur = typeof value === 'string' ? value : '';
  const commit = () => {
    if (txt !== null && txt !== cur) onSet(txt.trim());
    setTxt(null);
  };
  return (
    <label className="sp-field wide">
      <span>{label}</span>
      <input
        value={txt ?? cur}
        placeholder={placeholder}
        onFocus={() => setTxt(cur)}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

// 렌파이 색은 "#rrggbb" 또는 "#rrggbbaa". 고르개는 앞 6자리만 바꾸고 투명도는 그대로 둔다
function ColorField({ label, value, onSet }: { label: string; value: any; onSet: (v: string) => void }) {
  const cur = typeof value === 'string' ? value : '';
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(cur);
  return (
    <div className="sp-field wide sp-color">
      <span>{label}</span>
      <input type="color" value={m ? '#' + m[1] : '#ffffff'} onChange={(e) => onSet(e.target.value + (m?.[2] ?? ''))} />
      <TextField label="" value={cur} placeholder="#ffffff" onSet={(v) => v && onSet(v)} />
    </div>
  );
}
