// 환경 설정 창: 화면 색, 단축키 바꾸기
import { GAME_KEYS } from './gameKeys';
import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Hint } from './Help';
import { isDesktop } from './desktop';
import { ACTIONS, DIMS, GLASS, gradOf, comboLabel, comboOf, resetKeys, resetPrefs, usePrefs, type ActionId } from './prefs';

const close = () => useStore.setState({ showPrefs: false });

export function SettingsModal() {
  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal prefs" onClick={(e) => e.stopPropagation()}>
        <h3>환경 설정<Hint text="화면 설정은 이 컴퓨터에만, 상자 색만 대본 파일에 저장돼요" topic="환경 설정" /></h3>
        <FramePrefs />
        <GlassPrefs />
        <LookPrefs />
        <BoxColors />
        {isDesktop && <RunPrefs />}
        <KeyPrefs />
        <div className="row end">
          <button
            className="danger"
            title="화면 테마, 집중 모드 흐림, 단축키를 모두 처음 값으로. 대본과 상자 색은 그대로예요"
            onClick={() => confirm('화면 테마, 집중 모드 흐림, 단축키를 모두 처음 값으로 되돌릴까요?\n대본과 상자 색은 그대로예요.') && (resetPrefs(), useStore.getState().say('설정을 처음 값으로 되돌렸어요'))}
          >
            모든 설정을 처음 값으로
          </button>
          <span className="sp" />
          <button onClick={close}>닫기</button>
        </div>
      </div>
    </div>
  );
}

// 텍스트 색: 어느 테마에서든 고를 수 있다. 자동이면 테마가 밝기에 맞춰 정한다
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
// #abc → #aabbcc
const fullHex = (h: string) => (h.length === 4 ? '#' + [...h.slice(1)].map((x) => x + x).join('') : h).toLowerCase();

// 상자 색 한꺼번에 바꾸기. 대본 파일에 저장되는 값이라 실행 취소가 된다
function BoxColors() {
  const grad = usePrefs((p) => !!gradOf(p));
  const project = useStore((s) => s.project);
  const sel = useStore((s) => s.selectedIds);
  const [target, setTarget] = useState(sel.length ? 'sel' : 'all');
  const [color, setColor] = useState('#007aff');
  const [hex, setHex] = useState('#007aff');
  const ids = target === 'all' ? project.nodes.map((n) => n.id) : target === 'sel' ? sel : project.nodes.filter((n) => n.group === target).map((n) => n.id);
  const paint = (c: string | undefined) => {
    useStore.getState().update((p) => {
      for (const n of p.nodes) if (ids.includes(n.id)) c ? (n.color = c) : delete n.color;
    });
    useStore.getState().say(c ? `상자 ${ids.length}개를 칠했어요` : `상자 ${ids.length}개를 label 색으로 되돌렸어요`);
  };
  return (
    <>
      <h4>상자 색 (이 대본에 저장)<Hint text="고른 상자를 칠해요. hex 코드도 돼요. Ctrl+Z로 되돌려요" topic="환경 설정" /></h4>
      {grad && <p className="tip warn-text">어둡게 테마에서는 상자가 그라데이션 색을 따라서 칠할 수 없어요. 칠해 둔 색은 다른 테마에서 보여요.</p>}
      <fieldset className="plain" disabled={grad}>
      <div className="row">
        <label className="pick" htmlFor="bc-target">바꿀 상자</label>
        <select id="bc-target" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="all">모든 상자 ({project.nodes.length})</option>
          <option value="sel" disabled={!sel.length}>선택한 상자 ({sel.length})</option>
          {project.labels.map((g) => (
            <option key={g.id} value={g.id}>
              label: {g.title ? `${g.title} (${g.name})` : g.name} ({project.nodes.filter((n) => n.group === g.id).length})
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <label className="pick" htmlFor="bc-color">색</label>
        <input id="bc-color" type="color" className="bc-big" value={color} onChange={(e) => (setColor(e.target.value), setHex(e.target.value))} title="눌러서 색 고르기" />
        <input
          className={'bc-hex' + (HEX.test(hex) ? '' : ' invalid')}
          value={hex}
          placeholder="#007aff"
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
            setHex(v);
            if (HEX.test(v)) setColor(fullHex(v));
          }}
          title="hex 코드 (#RRGGBB 또는 #RGB)"
        />
      </div>
      <div className="row">
        <button className="primary" disabled={!ids.length} onClick={() => paint(color)}>칠하기</button>
        <button disabled={!ids.length} onClick={() => paint(undefined)}>label 색으로 되돌리기</button>
      </div>
      </fieldset>
    </>
  );
}

// label 경계선 굵기 (세션 77에 화면 테마 칸을 없애며 따로 뺌)
function FramePrefs() {
  const w = usePrefs((p) => p.frameWidth);
  return (
    <div className="row">
      <label className="pick" htmlFor="frame-w">label 경계선</label>
      <input id="frame-w" type="range" min={0} max={6} step={0.5} value={w} onChange={(e) => usePrefs.setState({ frameWidth: +e.target.value })} />
      <span className="tip">{w ? w + 'px' : '안 보임'}</span>
    </div>
  );
}

// 카드 투명도 (세션 82): 왼쪽·오른쪽 칸과 GUI 편집 칸의 유리 카드가 모두 따른다(Card.tsx glassOf)
function GlassPrefs() {
  const g = usePrefs((p) => p.glass);
  return (
    <div className="row" data-testid="pref-glass">
      <label className="pick" htmlFor="card-glass">카드 투명도</label>
      <input id="card-glass" type="range" min={GLASS.min} max={GLASS.max} step={1} value={g} onChange={(e) => usePrefs.setState({ glass: +e.target.value })} />
      <span className="tip">{g}%</span>
      <Hint text="높일수록 카드 뒤의 캔버스가 비치고 가장자리 빛이 세져요. 글이 읽기 어려우면 낮춰요" topic="환경 설정" />
    </div>
  );
}

function LookPrefs() {
  const dim = usePrefs((p) => p.dim);
  return (
    <>
      <h4>집중 모드 흐림<Hint text="상자 안에서 쓸 때 커서 줄 말고는 흐려져요" topic="집중 모드" /></h4>
      <div className="row">
        {DIMS.map((d) => (
          <button key={d.id} className={'swatch' + (dim === d.id ? ' on' : '')} onClick={() => usePrefs.setState({ dim: d.id })}>
            {d.label}
          </button>
        ))}
      </div>
    </>
  );
}

// [렌파이에서 실행] 단추 (앱)
function RunPrefs() {
  const skip = usePrefs((p) => p.runSkip);
  const snap = usePrefs((p) => p.snapGame);
  const bands = usePrefs((p) => p.gameBands !== false);
  return (
    <>
      <h4>렌파이에서 실행<Hint text="켜 두면 게임이 켜져 있을 때 대본만 내보내고 게임은 그대로 둬요" topic="데스크톱 앱" /></h4>
      <label className="row">
        <input type="checkbox" checked={skip} onChange={(e) => usePrefs.setState({ runSkip: e.target.checked })} />
        게임이 이미 켜져 있으면 무시 (다시 켜지 않음)
      </label>
      <label className="row">
        <input type="checkbox" checked={!!snap} onChange={(e) => usePrefs.setState({ snapGame: e.target.checked })} />
        게임과 연결되면 이 창을 게임 창 옆으로 옮기기
      </label>
      <label className="row" title="창이 게임 화면보다 커서 둘레에 검은 띠가 남을 때(레트로 해상도처럼 정수 배율로 키운 게임 등), 게임 안 편집 화면이 열려 있으면 게임 화면 가장자리에 붉은 선을 그어요. 띠는 칠하지 않아요. 게임 창에서는 F8">
        <input type="checkbox" checked={bands} onChange={(e) => usePrefs.setState({ gameBands: e.target.checked })} />
        게임 화면 가장자리에 붉은 경계선 (게임 안 편집 화면을 열었을 때)
      </label>
    </>
  );
}

function KeyPrefs() {
  const keys = usePrefs((s) => s.keys);
  const [rec, setRec] = useState<ActionId | null>(null);
  const [msg, setMsg] = useState('');

  // 바꾸는 중에는 누른 키를 가로채서 그 동작에 붙인다
  useEffect(() => {
    if (!rec) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') return setRec(null);
      const c = comboOf(e);
      if (!c) return;
      if (e.code === 'F1' && !e.ctrlKey && !e.altKey && !e.metaKey) return setMsg('F1은 도움말이라 쓸 수 없어요.');
      const fn = /^F\d+$/.test(e.code);
      if (!fn && !e.ctrlKey && !e.metaKey && !e.altKey) return setMsg('글자를 칠 때 겹치지 않게 Ctrl이나 Alt를 함께 눌러 주세요 (F2~F12는 혼자 써도 돼요).');
      const next = { ...usePrefs.getState().keys, [rec]: c };
      const other = ACTIONS.find((a) => a.id !== rec && next[a.id] === c);
      if (other) next[other.id] = '';
      usePrefs.setState({ keys: next });
      setMsg(other ? `"${other.label}"에 쓰던 키라서 그쪽은 비웠어요.` : '');
      setRec(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [rec]);

  return (
    <>
      <h4>단축키<Hint text="누르고 새 키를 눌러 바꿔요. Esc, Delete는 못 바꿔요" topic="단축키" /></h4>
      <table className="keys">
        <tbody>
          {ACTIONS.map((a) => (
            <tr key={a.id}>
              <td>{a.label}</td>
              <td>
                <button className={'key' + (rec === a.id ? ' rec' : '')} onClick={() => (setMsg(''), setRec(rec === a.id ? null : a.id))}>
                  {rec === a.id ? '키를 누르세요… (Esc 취소)' : comboLabel(keys[a.id])}
                </button>
              </td>
              <td>
                {keys[a.id] && (
                  <button className="x" title="단축키 없애기" onClick={() => usePrefs.setState({ keys: { ...keys, [a.id]: '' } })}>✕</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p className="tip warn-text">{msg}</p>}
      <div className="row">
        <button onClick={() => (resetKeys(), setMsg('기본값으로 되돌렸어요.'))}>기본값으로</button>
        
      </div>
      <h4>pygaki editor 단축키<Hint text="게임 창에서 F9로 켠 pygaki editor(게임 안 편집 화면)의 키예요. 여기서는 보기만 해요" topic="단축키" /></h4>
      {GAME_KEYS.map((g) => (
        <div key={g.group}>
          <p className="tip game-keys-group">{g.group}</p>
          <table className="keys game-keys">
            <tbody>
              {g.rows.map(([k, d]) => (
                <tr key={k + d}>
                  <td>{d}</td>
                  <td>
                    <kbd>{k}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
