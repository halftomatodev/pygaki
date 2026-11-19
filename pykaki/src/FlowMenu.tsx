// 글을 고치는 동안 상자 오른쪽에 붙는 "다음 흐름" 창.
// 다섯 가지: 다음 상자로 / 끝(return) / 선택지 / 조건 분기 / 다음 상자로 이어 쓰기. 어디로 이어지는지는 캔버스에서 선을 끌어 붙인다
// 흐름 버블(세션 94 이름). 단축키(기본 Alt+→)로 들어가 ↑↓(←→)·Enter·Esc로 키보드만으로 고른다
// 세션 93(사용자 요청): 평소에는 녹색 방울 [→] 하나로 접혀 있고, 방울을 누르거나 단축키로 펼친다. 고르거나 Esc·바깥을 누르면 다시 접힌다
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from './store';
import * as ops from './ops';
import type { BoxNode, ExitType } from './types';
import { continueInNewBox, focusField, goNextBox } from './actions';
import { hit, keyOf } from './prefs';
import { FlowTipView } from './FlowDemo';
import { GooPill } from './GooPill';
import { Liquid } from 'liquid-gooey';
import { useStore as useFlow } from '@xyflow/react';
import { GLASS_GOO, GlassOne, arcRow, useArc, useReveal } from './GooGlass';

interface Item {
  key: string;
  label: string;
  hint?: string;
  on?: boolean; // 지금 고른 것
  run: () => void;
}

const TYPES: [ExitType, string][] = [
  ['next', '→ 다음 상자로'],
  ['return', '■ 끝 (return)'],
  ['menu', '◆ 선택지'],
  ['if', '◇ 조건 분기'],
  ['answer', '✎ 정답 입력'],
];

export function FlowMenu({ b }: { b: BoxNode }) {
  const update = useStore((s) => s.update);
  const active = useStore((s) => s.flowMenu);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [top, setTop] = useState(0);
  const [cur, setCur] = useState(0);

  // 다음 흐름 줄 높이에 맞추되, 옆에 붙은 카드(연출 입력칸, 대사 설정)와 겹치면 그 아래로 내린다
  const place = () => {
    const box = ref.current?.parentElement;
    const exit = box?.querySelector('.box-exit') as HTMLElement | null;
    if (!box || !exit) return;
    let t = exit.offsetTop;
    const side = box.querySelector('.side-r') as HTMLElement | null;
    if (side?.offsetParent) {
      // 카드가 움직이는 중이어도 도착할 자리로 잰다
      const z = box.getBoundingClientRect().height / (box.offsetHeight || 1);
      const base = (side.offsetParent.getBoundingClientRect().top - box.getBoundingClientRect().top) / z;
      t = Math.max(t, base + parseFloat(side.style.top || '0') + side.offsetHeight + 8);
    }
    setTop(t);
  };
  useLayoutEffect(place);
  // 쓰는 줄을 옮기면 이 창은 다시 그려지지 않아서, 상자 안이 바뀌는 것을 지켜본다
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;
    const watch = new MutationObserver(place);
    watch.observe(box, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    return () => watch.disconnect();
  }, []);

  // 들어오면 키를 받을 칸에 커서를 둔다(지금 고른 흐름에서 시작). 나갈 때는 쓰던 글자 칸으로 돌려보낸다
  const back = useRef<string | null>(null);
  const backEl = useRef<HTMLElement | null>(null); // 다른 버블의 키 칸(id 없음)에서 들어왔으면 그리로 (세션 94)
  useLayoutEffect(() => {
    if (active) {
      const el = document.activeElement as HTMLElement | null;
      backEl.current = el && el !== input.current && !el.id && el.classList.contains('fm-keys') ? el : null;
      if (el && el !== input.current && el.id) back.current = el.id;
      setCur(Math.max(0, TYPES.findIndex(([t]) => t === b.exit.type)));
      input.current?.focus();
    }
  }, [active]);

  const close = (refocus = true) => {
    useStore.setState({ flowMenu: false });
    if (refocus && backEl.current?.isConnected) backEl.current.focus();
    else if (refocus && back.current) focusField(back.current);
  };

  // 선택지로 바꾸면(이미 선택지면 그대로) 첫 선택지 칸에서 문구를 쓴다
  const toMenu = () => {
    if (b.exit.type !== 'menu') update((p) => ops.setExitType(ops.findBox(p, b.id)!, 'menu'));
    const x = ops.findBox(useStore.getState().project, b.id);
    close(false);
    if (x?.exit.type === 'menu' && x.exit.choices[0]) focusField('in-' + x.exit.choices[0].id);
  };
  // 조건 분기로 바꾸면(이미 조건 분기면 그대로) 첫 조건 칸에서 조건을 쓴다
  const toIf = () => {
    if (b.exit.type !== 'if') update((p) => ops.setExitType(ops.findBox(p, b.id)!, 'if'));
    const x = ops.findBox(useStore.getState().project, b.id);
    close(false);
    if (x?.exit.type === 'if' && x.exit.branches[0]) focusField('in-' + x.exit.branches[0].id);
  };
  // 정답 입력으로 바꾸면(이미 정답 입력이면 그대로) 묻는 글 칸에서 쓴다 (FEATURE 32)
  const toAnswer = () => {
    if (b.exit.type !== 'answer') update((p) => ops.setExitType(ops.findBox(p, b.id)!, 'answer'));
    close(false);
    focusField('in-ask-' + b.id);
  };
  // 다음 상자로 이어 쓰기: 이어진 상자가 있으면 그리로, 없으면 새 상자를 만들어 잇는다.
  // 끝(return)이면 다음 상자로 바꾸고, 선택지·조건 분기면 아직 안 이어진 첫 갈래(없으면 첫 갈래)로
  const goOn = () => {
    close(false);
    if (b.exit.type === 'return') {
      update((p) => ops.setExitType(ops.findBox(p, b.id)!, 'next'));
      return continueInNewBox(b.id, 'next');
    }
    goNextBox(b.id);
  };

  const items: Item[] = [
    ...TYPES.map(([t, label]) => ({
      key: 'type:' + t,
      label,
      on: b.exit.type === t,
      run: t === 'menu' ? toMenu : t === 'if' ? toIf : t === 'answer' ? toAnswer : () => (b.exit.type !== t && update((p) => ops.setExitType(ops.findBox(p, b.id)!, t)), close()),
    })),
    { key: 'go', label: '↪ 다음 상자로 이어 쓰기', hint: keyOf('nextBox'), run: goOn },
  ];
  // call로 이어진 상자는 선을 두 번 눌러 바꾼다 (이 창에는 없음)
  const isCall = b.exit.type === 'call';

  const at = Math.min(cur, items.length - 1);

  // 툴팁: 마우스를 올린 카드, 키로 고르는 중이면 고른 카드. 350ms 뒤에 (태그 상자 툴팁과 같음)
  const [hover, setHover] = useState<string | null>(null);
  const want = hover ?? (active ? items[at]?.key ?? null : null);
  const [tip, setTip] = useState<string | null>(null);
  useEffect(() => {
    if (!want) return setTip(null);
    const t = setTimeout(() => setTip(want), 350);
    return () => clearTimeout(t);
  }, [want]);

  const zoom = useFlow((s) => s.transform[2]);
  const arc = useArc(ref, () => ref.current?.parentElement ?? null, 'right');
  const out = useReveal(active);

  // 고른 항목이 보이게 굴린다
  useLayoutEffect(() => {
    if (active) ref.current?.querySelector('.fm-item.cur')?.scrollIntoView({ block: 'nearest' });
  });

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    // 같은 단축키로 다시 누르면 글로 돌아간다
    if (hit(e, 'flowMenu')) {
      e.preventDefault();
      e.stopPropagation();
      return close();
    }
    // 다른 버블의 단축키(Alt+← 등)는 App.tsx로 보낸다
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      setCur((at + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1) + items.length) % items.length);
    } else if (k === 'Enter') {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      items[at]?.run();
    } else if (k === 'Escape' || k === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  if (!active)
    return (
      <div className="side-flow-pill nodrag" style={{ top }} ref={ref}>
        <GooPill color="green" label="→" seed={3} tip={`흐름 제어 · ${keyOf('flowMenu')}로 펼치기`} onOpen={() => useStore.setState({ flowMenu: true })} />
      </div>
    );

  // 유리 바탕 한 장 안의 줄. 상자를 둘러싼 호를 따라 엇갈린다 (세션 93)
  const row = (k: string, _i: number, body: React.ReactNode) => (
    <div key={k} className="fm-row" data-arc={k} style={arcRow(arc, k)}>
      {body}
    </div>
  );
  return (
    <div className="side-flow fm nodrag" style={{ top }} ref={ref} onMouseDown={(e) => (e.target as HTMLElement).closest('input, select, textarea') || e.preventDefault()}>
      {/* 키만 받는 숨은 칸 */}
      <input
        ref={input}
        className="fm-keys"
        readOnly
        value=""
        aria-label="다음 흐름 메뉴"
        onKeyDown={onKey}
        // 커서가 떠나도 닫지 않는다(세션 94: 대사·글꼴 버블과 같이 열어 둠). 상자 편집을 끝내면 store.ts가 접는다
      />
      <Liquid className="fm-liquid" {...GLASS_GOO} style={{ '--lg-unscale': 1 / zoom } as React.CSSProperties}>
        <GlassOne arc={arc} out={out} side="right" from="tl" className="fm-one">
        {row(
          'head',
          0,
          <div className="gg-title tip" data-tip={`${keyOf('flowMenu')} 펼치기/접기 · 방향키 고르기 · Enter 정하기 · Esc 접기 · 이어지는 곳은 선을 끌어 붙여요`}>
            다음 흐름
          </div>,
        )}
        {items.map((it, i) =>
          row(
            it.key,
            i + 1,
            <div
              className={'fm-item' + (it.key === 'go' ? ' fm-act' : '') + (i === at ? ' cur' : '') + (it.on ? ' on' : '')}
              onMouseEnter={() => (setCur(i), setHover(it.key))}
              onMouseLeave={() => setHover(null)}
              onClick={() => it.run()}
            >
              <span className="fm-dot">{it.on ? '●' : ''}</span>
              <span className="fm-label">{it.label}</span>
            </div>,
          ),
        )}
        {isCall && row('call', items.length + 1, <div className="fm-help">지금은 call로 이어져요. 선을 두 번 누르면 바뀌어요</div>)}
        </GlassOne>
      </Liquid>
      {tip && <FlowTipView k={tip} anchor={ref.current} keyHint={items.find((x) => x.key === tip)?.hint} />}
    </div>
  );
}
