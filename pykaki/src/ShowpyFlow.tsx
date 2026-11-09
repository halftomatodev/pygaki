// 줄기표 (showpy screen_fx 5.2): 원고를 줄 번호 순서대로 마디로, 선택지와 if는 옆 가지로 그린다.
// 게임이 state.flow로 행을 보내 주면 그대로 그리고, 끌면 구간(flow range), 누르면 그 줄로(flow pick),
// 오른쪽 네모 점을 누르면 전환 점 고르기(flow point). 형식은 docs/LINK.md 9장.
// [이 구간에 적용], 전환 고르기 같은 버튼은 오른쪽 패널(게임 패널 통째로)에 있다.
import { useEffect, useRef, useState } from 'react';
import { liveSend, type FlowRow, type FlowState } from './showpyLive';

const ROW = 20;
const LANE = 14;
const MAX_D = 8;

const NODE: Partial<Record<FlowRow['k'], string>> = { fx: '#ff3b8d', jump: '#4fc3f7', call: '#4fc3f7', menu: '#ffd23b', show: '#7ee787', say: '#dddddd' };

export function FlowTree({ flow, onLine }: { flow: FlowState; onLine: (line: number) => void }) {
  const rows = flow.rows ?? [];
  const list = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ a: number; b: number; moved: boolean } | null>(null);
  const depth = Math.min(MAX_D, rows.reduce((m, r) => Math.max(m, r.d), 0));
  const gutter = (depth + 2) * LANE;
  const range = drag && drag.moved ? [Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)] : flow.range ?? null;
  const sel = new Set((flow.points ?? []).map((p) => p.join(':')));

  const rowAt = (clientY: number) => {
    const el = list.current;
    if (!el) return 0;
    const y = clientY - el.getBoundingClientRect().top + el.scrollTop;
    return Math.max(0, Math.min(rows.length - 1, Math.floor(y / ROW)));
  };

  const scrollTo = (line: number | null | undefined, smooth: boolean) => {
    const el = list.current;
    if (!el || line == null) return;
    const i = rows.findIndex((r) => r.l >= line);
    if (i < 0) return;
    const top = i * ROW;
    if (top < el.scrollTop || top > el.scrollTop + el.clientHeight - ROW) el.scrollTo({ top: top - el.clientHeight / 3, behavior: smooth ? 'smooth' : 'auto' });
  };

  // 처음 펴면 지금 줄로
  useEffect(() => {
    scrollTo(flow.sel ?? flow.here, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.file]);

  const down = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    list.current?.setPointerCapture(e.pointerId);
    list.current?.focus({ preventScroll: true });
    setDrag({ a: i, b: i, moved: false });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const el = list.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top + 10) el.scrollTop -= ROW;
      else if (e.clientY > r.bottom - 10) el.scrollTop += ROW;
    }
    const i = rowAt(e.clientY);
    if (i !== drag.b || drag.moved) setDrag({ ...drag, b: i, moved: drag.moved || i !== drag.a });
  };
  const up = () => {
    if (!drag) return;
    const { a, b, moved } = drag;
    setDrag(null);
    if (moved && a !== b) liveSend({ cmd: 'flow', do: 'range', a: Math.min(a, b), b: Math.max(a, b) });
    else {
      onLine(rows[a].l);
      liveSend({ cmd: 'flow', do: 'pick', row: a });
    }
  };

  const del = () => liveSend({ cmd: 'flow', do: 'delete' });

  if (!rows.length) return <p className="tip">이 원고 파일에서 label 안의 줄을 찾지 못했어요. 게임을 진행한 뒤 다시 펴요.</p>;

  return (
    <div className="sp-flow">
      <div className="sp-row">
        <b>줄기표</b>
        <span className="sp-mono">{flow.file?.replace(/^game\//, '')}</span>
        <span className="grow" />
        {flow.here != null && (
          <button onClick={() => scrollTo(flow.here, true)} title="게임의 지금 줄로 스크롤">
            지금 줄 ({flow.here})
          </button>
        )}
        {flow.range && <button onClick={() => liveSend({ cmd: 'flow', do: 'range', a: null })}>구간 풀기</button>}
        {(flow.range || (flow.points ?? []).length > 0) && (
          <button onClick={del} title="고른 구간(끝 다음의 '원래대로' 줄까지)과 고른 전환 점의 셰이더 줄을 지워요. 저장하면 원고에서 빠져요">
            셰이더 지우기 (Delete)
          </button>
        )}
      </div>
      <div
        className="sp-flow-list"
        ref={list}
        tabIndex={0}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={(e) => {
          if (e.key === 'Delete') {
            // 대본 화면(상자 캔버스)의 Delete가 숨은 채 고른 상자를 지우지 않게 여기서 멈춤
            e.preventDefault();
            e.stopPropagation();
            del();
          }
        }}
      >
        {rows.map((r, i) => {
          const inRange = !!range && i >= range[0] && i <= range[1];
          const d = Math.min(MAX_D, r.d);
          const cx = d * LANE + 6;
          const pt = r.p ? sel.has(r.p.join(':')) : false;
          return (
            <div
              key={i}
              className={'sp-flow-row' + (inRange ? ' rg' : r.i && flow.sel === r.l ? ' sel' : '')}
              style={{ height: ROW }}
              title={`${r.l}번째 줄  ${r.s}\n누르기: 그 줄로 | 끌기: 구간 고르기`}
            >
              <span className={'ln' + (r.i && flow.here === r.l ? ' here' : '')} onPointerDown={(e) => down(e, i)}>
                {r.l}
              </span>
              <svg width={gutter} height={ROW} onPointerDown={(e) => down(e, i)}>
                {r.g.filter((g) => g <= MAX_D).map((g) => (
                  <rect key={g} x={g * LANE + 5} y={0} width={2} height={ROW} fill="#ffffff40" />
                ))}
                {r.k === 'branch' ? (
                  <>
                    <rect x={(d - 1) * LANE + 5} y={ROW / 2 - 1} width={LANE + 2} height={2} fill="#ffd23b" />
                    <rect x={cx - 4} y={ROW / 2 - 4} width={8} height={8} fill="#ffd23b" />
                    <rect x={cx - 2} y={ROW / 2 - 2} width={4} height={4} fill="#14141c" />
                  </>
                ) : r.k === 'label' ? (
                  <rect x={cx - 5} y={ROW / 2 - 5} width={10} height={10} fill="#ffd23b" />
                ) : (
                  <rect x={cx - (r.k === 'fx' ? 4 : 3)} y={ROW / 2 - (r.k === 'fx' ? 4 : 3)} width={r.k === 'fx' ? 8 : 6} height={r.k === 'fx' ? 8 : 6} fill={NODE[r.k] ?? '#999999'} />
                )}
              </svg>
              <span className="tx" style={{ color: r.c }} onPointerDown={(e) => down(e, i)}>
                {r.t}
              </span>
              <span className="band" title={r.s}>
                <i style={{ background: r.a ?? 'transparent' }} />
                <i style={{ background: r.b ?? 'transparent' }} />
              </span>
              {r.p ? (
                <button className={'dot' + (pt ? ' on' : '')} title="전환 점: 눌러서 고르고, 오른쪽 패널 '고른 전환 점'에서 전환을 골라요" onClick={() => liveSend({ cmd: 'flow', do: 'point', target: r.p })} />
              ) : (
                <span className="dot-sp" />
              )}
            </div>
          );
        })}
      </div>
      <p className="tip">누르기: 그 줄로 (원고 칸도 그 줄로) | 끌기: 구간 고르기 → 오른쪽 [이 구간에 적용] | 네모 점: 전환 점 | Delete: 고른 구간, 점의 셰이더 지우기 | 색 띠: 왼쪽 1번, 오른쪽 2번 셰이더</p>
    </div>
  );
}
