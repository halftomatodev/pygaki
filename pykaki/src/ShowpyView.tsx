// showpy 화면 (데스크톱 앱 전용). 게임 창은 옆에 그대로 두고, 게임 안 편집기를 여기서 조종한다.
// 왼쪽: 고칠 것 목록 / 가운데: 지금 게임 위치와 대본 / 오른쪽: 고르는 칸.
// 값은 게임이 갖고 있고(docs/LINK.md 9장), 여기는 보여주고 바꾸라고 보내기만 한다. 저장도 게임이 한다.
import { useEffect, useState } from 'react';
import { desktop } from './desktop';
import { liveSend, useLive, type GameState, type TitleItem, type TitleState } from './showpyLive';
import { useStore } from './store';
import { CustomUIPanel } from './ShowpyCustomUI';
import { MirrorPanel } from './ShowpyMirror';

interface Section {
  id: string;
  label: string;
  tab: string | null; // 게임 안 편집기 탭
  app: boolean; // 앱에 따로 만든 칸이 있음
  mirror?: boolean; // 게임 안 패널을 통째로 옮겨 그림 (ui_kit 3.16부터)
  note: string;
}

const SECTIONS: Section[] = [
  { id: 'splash', label: '스플래시 (로고, 경고, 조작 방법)', tab: 'splash', app: false, mirror: true, note: '게임을 켰을 때 타이틀 전에 나오는 페이지예요. showpy 4.18(splash 1.2)부터 여기서 고쳐요. 예전 판이면 splash/splash_config.rpy에서 고쳐요.' },
  { id: 'title', label: '타이틀 메뉴', tab: 'title', app: true, note: '' },
  { id: 'pause', label: '게임 내 메뉴 (ESC)', tab: 'title', app: true, note: '' },
  { id: 'watermorph', label: '타이틀 셰이더 (일렁임)', tab: 'watermorph', app: false, mirror: true, note: '타이틀 배경에만 걸리는 일렁임 효과예요.' },
  { id: 'screen_fx', label: '인게임 화면 셰이더', tab: 'screen_fx', app: false, mirror: true, note: '게임 화면 전체에 씌우는 효과(VHS, ASCII 등)예요.' },
  { id: 'custom_ui', label: '커서, 클릭 대기(CTC), 대사 소리', tab: 'custom_ui', app: true, note: '' },
  { id: 'say', label: '대사 (위치, 줄마다 화면 효과)', tab: 'say', app: false, mirror: true, note: '' },
  { id: 'choice', label: '선택지', tab: 'choice', app: false, mirror: true, note: '' },
  { id: 'stage', label: '그림, 영상 배치', tab: 'stage', app: false, mirror: true, note: '' },
];

export function ShowpyView() {
  const { on, st, section, err, showpy } = useLive();
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
    liveSend({ cmd: 'panel', hide: inApp(s) });
    liveSend({ cmd: 'editor', open: true, tab: s.tab });
  };

  return (
    <div className="sp-view">
      <nav className="sp-nav">
        <div className={'sp-conn' + (on ? ' on' : '')}>{on ? `게임과 연결됨 (ui_kit ${showpy ?? '?'})` : '게임 연결 안 됨'}</div>
        {SECTIONS.map((s) => {
          const t = s.tab ? st?.editor.tabs.find((x) => x.id === s.tab) : null;
          return (
            <button key={s.id} className={'sp-nav-item' + (s.id === sec.id ? ' on' : '')} onClick={() => choose(s)} title={t && !t.ok ? t.why : ''}>
              {s.label}
              {!inApp(s) && <span className="sp-badge">게임 안</span>}
            </button>
          );
        })}
      </nav>
      <div className="sp-main">
        {!on ? <NotConnected /> : st ? <Where st={st} /> : <p className="tip">게임 상태를 기다리는 중...</p>}
      </div>
      <div className="sp-panel">
        <h3>{sec.label}</h3>
        {on && st && <EditorBar st={st} />}
        {err && <p className="sp-err">{err}</p>}
        {!on ? (
          <p className="tip">게임과 연결되면 여기서 고쳐요.</p>
        ) : !st ? null : sec.id === 'custom_ui' && st.custom_ui !== undefined ? (
          <CustomUIPanel cu={st.custom_ui} />
        ) : sec.id === 'title' || sec.id === 'pause' ? (
          <TitlePanel st={st} want={sec.id} />
        ) : sec.mirror && mirrorOk ? (
          <MirrorSection st={st} sec={sec} />
        ) : (
          <InGamePanel st={st} sec={sec} />
        )}
      </div>
    </div>
  );
}

function NotConnected() {
  return (
    <div className="sp-help">
      <h3>게임을 개발 모드로 켜 주세요</h3>
      <ol>
        <li>렌파이 런처에서 이 프로젝트를 고르고 [프로젝트 실행]을 눌러요. (개발 모드로 켜져요)</li>
        <li>게임이 켜지면 game 폴더에 showpy_live.json이 생기고, 이 앱이 저절로 붙어요.</li>
        <li>게임 창과 이 창을 나란히 놓고 써요. 게임 화면에서는 끌어서 옮기고, 숫자와 목록은 여기서 봐요.</li>
      </ol>
      <p className="tip">showpy(ui_kit) 3.14 이상이 들어 있어야 해요. 배포판(개발 모드 꺼짐)에서는 연결되지 않아요.</p>
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

const AROUND = 9;

function Script({ file, line }: { file: string | null; line: number }) {
  const [text, setText] = useState<{ file: string; lines: string[] | null } | null>(null);
  const [rev, setRev] = useState(0);

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

  if (!file) return null;
  if (!text || text.file !== file) return <p className="tip">원고를 읽는 중...</p>;
  if (!text.lines) return <p className="tip">{file}은 프로젝트 밖(렌파이 안쪽) 파일이라 보여줄 수 없어요.</p>;

  const lines = text.lines;
  const from = Math.max(1, line - AROUND);
  const to = Math.min(lines.length, line + AROUND);

  // PyKaki가 내보낸 원고면 줄 위의 "# @node:id 이름" 표시로 상자를 찾는다 (docs/LINK.md 2장)
  let node: { id: string; name: string } | null = null;
  for (let i = Math.min(line, lines.length) - 1; i >= 0; i--) {
    const m = /^\s*#\s*@node:(\S+)\s*(.*)$/.exec(lines[i]);
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
            PyKaki 상자: {node.name || node.id} →
          </button>
        )}
      </div>
      <pre className="sp-script">
        {lines.slice(from - 1, to).map((l, i) => {
          const n = from + i;
          return (
            <div key={n} className={n === line ? 'cur' : ''}>
              <span className="ln">{n}</span>
              {l || ' '}
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
  return (
    <div className="sp-bar">
      <div className="sp-row">
        <button className="primary" disabled={!e.pending} onClick={() => liveSend({ cmd: 'save' })} title="게임 안 편집기의 Ctrl+S와 같아요">
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
      <label className="sp-check">
        <input type="checkbox" checked={!e.hide_panel} onChange={(ev) => liveSend({ cmd: 'panel', hide: !ev.target.checked })} />
        게임 안 패널도 보기
      </label>
      {e.open && e.hide_panel && (
        <div className="sp-editing">
          <span>
            편집 중이라 게임 화면의 클릭과 키는 편집기로 가요(끌어서 옮기기용). 게임을 진행하려면 편집기를 닫아요. (게임 창에서 Esc)
          </span>
          <button onClick={() => liveSend({ cmd: 'editor', open: false })}>편집기 닫기</button>
        </div>
      )}
      {e.message && <p className="sp-msg">{e.message}</p>}
    </div>
  );
}

// ── 게임 안 패널을 통째로 옮겨 그리는 것 (ui_kit 3.16) ──

function MirrorSection({ st, sec }: { st: GameState; sec: Section }) {
  const t = sec.tab ? st.editor.tabs.find((x) => x.id === sec.tab) : null;
  const open = () => (liveSend({ cmd: 'panel', hide: true }), liveSend({ cmd: 'editor', open: true, tab: sec.tab }));
  if (!t)
    return (
      <div>
        {sec.note && <p>{sec.note}</p>}
        <p className="tip">이 게임에는 이 편집기 탭이 없어요. (플러그인이 빠져 있거나 예전 판일 수 있어요)</p>
      </div>
    );
  const here = !!st.panel && st.panel.tab === sec.tab;

  // 그 탭을 쓸 수 없는 화면이면 갈 곳 버튼 (대사, 선택지, 그림은 게임 중 / 일렁임은 타이틀)
  const go = !t.ok && (
    <p>
      {sec.id === 'watermorph' ? (
        !st.where.main_menu && <button onClick={() => confirm('타이틀로 갈까요? 진행 중인 게임은 끝나요.') && liveSend({ cmd: 'goto', where: 'title' })}>타이틀로 가기</button>
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
      {sec.note && <p>{sec.note}</p>}
      {!t.ok && <p className="sp-warn">{t.why || '지금 화면에서는 쓸 수 없어요.'}</p>}
      {go}
      <button className="primary" onClick={open}>
        편집 시작
      </button>
      {st.editor.open && !st.editor.hide_panel && st.editor.tab === sec.tab && <p className="tip">지금은 게임 창의 패널에 열려 있어요. [게임 안 패널도 보기]를 끄면 여기로 와요.</p>}
    </div>
  );
}

// ── 앱 칸이 아직 없는 것: 게임 안 패널로 ──

function InGamePanel({ st, sec }: { st: GameState; sec: Section }) {
  const t = sec.tab ? st.editor.tabs.find((x) => x.id === sec.tab) : null;
  const here = st.editor.open && st.editor.tab === sec.tab;
  return (
    <div>
      {sec.note && <p>{sec.note}</p>}
      <p className="tip">이 칸은 아직 앱으로 옮기지 않았어요. 지금은 게임 안 편집기 패널에서 고쳐요.</p>
      {sec.tab &&
        (!t ? (
          <p className="tip">이 게임에는 이 편집기 탭이 없어요. (플러그인이 빠져 있을 수 있어요)</p>
        ) : !t.ok ? (
          <p className="sp-warn">{t.why || '지금 화면에서는 쓸 수 없어요.'}</p>
        ) : here ? (
          <p className="tip">게임 창에 이 탭 패널이 열려 있어요.</p>
        ) : (
          <button onClick={() => (liveSend({ cmd: 'panel', hide: false }), liveSend({ cmd: 'editor', open: true, tab: sec.tab }))}>게임 안 편집기에서 열기</button>
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
            <button onClick={() => (liveSend({ cmd: 'panel', hide: true }), liveSend({ cmd: 'editor', open: true, tab: 'title' }))}>편집기 열기</button>
          </p>
        )}
      </div>
    );
  }

  if (!st.editor.open || st.editor.tab !== 'title') {
    return (
      <div>
        <p className="tip">게임 안 편집기의 타이틀 메뉴 탭을 열어야 끌어서 옮길 수 있어요.</p>
        <button className="primary" onClick={() => (liveSend({ cmd: 'panel', hide: true }), liveSend({ cmd: 'editor', open: true, tab: 'title' }))}>
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

      <div className="sp-items">
        {t.items.map((x, i) => (
          <button key={x.id} className={'sp-item' + (i === t.sel ? ' on' : '')} onClick={() => liveSend({ cmd: 'title.select', index: i })}>
            <span>{x.text}</span>
            <span className="tip">{x.id}</span>
            {x.edited && <b className="dirty" title="저장 안 한 변경"> ●</b>}
          </button>
        ))}
      </div>

      {it && <TitleFields t={t} it={it} />}

      <div className="sp-row">
        <button onClick={() => liveSend({ cmd: 'title.reset' })}>{t.scope === 'all' ? '공통 값 되돌리기' : '이 항목 되돌리기'}</button>
      </div>
      <p className="tip">게임 화면에서 항목을 끌어서 옮기고, 휠로 돌리고, Shift+휠로 글자 크기를 바꿀 수도 있어요. 여기 숫자가 같이 바뀌어요.</p>
    </div>
  );
}

function TitleFields({ t, it }: { t: TitleState; it: TitleItem }) {
  const hover = t.mode === 'hover';
  const all = t.scope === 'all';
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
      <Num label="기울기" value={val('skew')} step={0.5} round={r1} onSet={(v) => set(k('skew'), v)} />
      <Num label="확대" value={val('zoom')} step={0.05} round={r2} onSet={(v) => set(k('zoom'), Math.max(0.05, v))} />
      <Num label="글자 크기" value={val('size')} onSet={(v) => set(k('size'), Math.max(4, Math.round(v)))} />
      <ColorField label="색" value={val('color')} onSet={(v) => set(k('color'), v)} />
      <TextField label="글꼴" value={val('font')} placeholder="fonts/내글꼴.ttf" onSet={(v) => set(k('font'), v || null)} />
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
