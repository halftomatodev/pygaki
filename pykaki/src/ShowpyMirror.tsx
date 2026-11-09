// showpy 화면: 게임 안 편집기 패널을 통째로 옮겨 그리는 칸 (ui_kit 3.16).
// 게임이 화면 밖에 그려 둔 패널의 위젯(버튼, 글, 막대, 입력칸, 그림, 색 견본)을 나무 모양으로 보내 주면
// 그대로 그리고, 누르면 그 자리 번호를 panel.do로 돌려보낸다. 형식은 docs/LINK.md 9장.
// 탭마다 화면을 따로 만들지 않아서, 게임 쪽 탭을 고치면 여기도 저절로 바뀐다.
import { useState } from 'react';
import { liveSend, type MirrorNode, type PanelState } from './showpyLive';
import { Thumb } from './ShowpyCustomUI';

const press = (n: { id: string; t?: string }) => liveSend({ cmd: 'panel.do', id: n.id, t: n.t });

export function MirrorPanel({ panel }: { panel: PanelState }) {
  return (
    <div className="sp-mirror">
      {/* 고르기 창(글꼴, 색, 그림)은 맨 위에. 닫기 전에는 게임에서 다른 것을 누를 수 없어요 */}
      {panel.popup && (
        <div className="sp-mirror-popup">
          <p className="sp-warn">고르기 창이 열려 있는 동안은 게임 화면이 눌리지 않아요. 고른 뒤 확인이나 닫기를 눌러요.</p>
          <Node n={panel.popup} />
        </div>
      )}
      {panel.body ? <Node n={panel.body} /> : <p className="tip">패널을 기다리는 중...</p>}
    </div>
  );
}

function Node({ n }: { n: MirrorNode }) {
  switch (n.k) {
    case 'h':
      return (
        <div className="sp-m-h">
          {n.c.map((c, i) => (
            <Node key={i} n={c} />
          ))}
        </div>
      );
    case 'g':
      return (
        <div className="sp-m-g">
          {n.c.map((c, i) => (
            <Node key={i} n={c} />
          ))}
        </div>
      );
    case 'v':
      return (
        <div className="sp-m-v">
          {n.c.map((c, i) => (
            <Node key={i} n={c} />
          ))}
        </div>
      );
    case 't':
      return (
        <span className="sp-m-t" style={n.c ? { color: textColor(n.c) } : undefined}>
          {n.t}
        </span>
      );
    case 'b':
      return (
        <button className={'sp-m-b' + (n.on ? ' on' : '') + (n.c?.length && !n.t ? ' media' : '')} disabled={!n.ok} title={n.t} onClick={() => press(n)}>
          {n.c?.map((m, i) => <Media key={i} n={m} />)}
          {n.t && <span>{n.t}</span>}
        </button>
      );
    case 'bar':
      return <Bar n={n} />;
    case 'in':
      return <Input n={n} />;
    case 'img':
    case 'col':
      return <Media n={n} />;
  }
}

function Media({ n }: { n: MirrorNode }) {
  if (n.k === 'img')
    return (
      <span className="sp-m-img">
        <Thumb path={n.p} />
      </span>
    );
  if (n.k === 'col') return <span className="sp-m-col" style={{ background: n.v ?? 'transparent' }} title={n.v ?? '(기본)'} />;
  return null;
}

// 게임 패널 글자색은 어두운 바탕용이라, 회색(#cccccc 같은)은 앱에서는 흐린 글자로
function textColor(c: string) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c);
  if (!m) return undefined;
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16));
  if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16) return 'var(--muted)';
  return c;
}

// 끄는 동안은 게임에서 오는 값으로 덮지 않는다
function Bar({ n }: { n: Extract<MirrorNode, { k: 'bar' }> }) {
  const [drag, setDrag] = useState<number | null>(null);
  const step = n.s && n.s > 0 ? n.s : n.r / 100;
  return (
    <input
      type="range"
      className="sp-m-bar"
      min={0}
      max={n.r}
      step={step}
      value={drag ?? n.v}
      onPointerUp={() => setDrag(null)}
      onBlur={() => setDrag(null)}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        setDrag(v);
        liveSend({ cmd: 'panel.do', id: n.id, value: v });
      }}
    />
  );
}

// 글 칸마다 넓은 칸(세 줄)/좁은 칸을 고른 것. 이 앱에 붙는 설정이라 localStorage에 둔다
const WIDE_KEY = 'pygaki-wide-inputs';
const loadWide = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(WIDE_KEY) || '{}') ?? {};
  } catch {
    return {};
  }
};

function Input({ n }: { n: Extract<MirrorNode, { k: 'in' }> }) {
  const [txt, setTxt] = useState<string | null>(null);
  const [wideMap, setWideMap] = useState(loadWide);
  const wide = wideMap[n.id] ?? !!n.w;
  const toggleWide = () => {
    const m = { ...loadWide(), [n.id]: !wide };
    try {
      localStorage.setItem(WIDE_KEY, JSON.stringify(m));
    } catch {
      // 못 적어도 이번에는 바뀜
    }
    setWideMap(m);
  };
  const wideBtn = (
    <button className="sp-m-wide" onClick={toggleWide} title={wide ? '한 줄 좁은 칸으로' : '패널 폭 가득, 세 줄 넓은 칸으로'}>
      {wide ? '좁게' : '넓게'}
    </button>
  );
  const send = (enter: boolean) => {
    if (txt !== null) liveSend({ cmd: 'panel.do', id: n.id, value: txt, enter });
    setTxt(null);
  };
  const keys = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(true);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTxt(null);
      e.currentTarget.blur();
    }
  };
  // 넓은 글 칸(스플래시 글, UI 글 등): 패널 폭 가득, 세 줄이 보이게. 줄바꿈은 게임처럼 \n으로 적음
  if (wide)
    return (
      <div className="sp-m-inwrap wide">
        <textarea
          className="sp-m-in wide"
          rows={3}
          value={txt ?? n.t}
          onFocus={() => setTxt(n.t)}
          onChange={(e) => setTxt(e.target.value.replace(/\n/g, '\\n'))}
          onBlur={() => send(false)}
          onKeyDown={keys}
          title="Enter 끝내기, Esc 취소. 줄바꿈은 \n"
        />
        {wideBtn}
      </div>
    );
  return (
    <span className="sp-m-inwrap">
      <input
        className="sp-m-in"
        value={txt ?? n.t}
        onFocus={() => setTxt(n.t)}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={() => send(false)}
        onKeyDown={keys}
      />
      {wideBtn}
    </span>
  );
}
