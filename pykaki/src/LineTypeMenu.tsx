// 줄 종류(화자) 고르기 (세션 90). 예전 <select>를 바꾼 것.
// 단추를 누르거나 단축키(기본 Alt+↓, [다음 흐름]의 Alt+Enter처럼 하나)로 열면, 대사·연출·기타 세 칸이 단추에서 끈적하게(liquid-gooey) 흘러나와
// 한눈에 펼쳐진다. ↑↓로 칸 안에서, Tab(Shift+Tab)으로 칸 사이를 옮기고 Enter로 정한다(세션 91, ←→도 됨). Esc나 같은 단축키는 고르지 않고 글로 돌아간다.
// 상자 안에서는 단추 없이 고치는 줄 왼쪽 방울(LineChip)에 붙어, 상자 왼쪽 바깥에 세 칸을 세로로 조금씩 엇갈려 쌓는다(TypeMenuFor, 세션 91 사용자 손그림)
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Liquid } from 'liquid-gooey';
import { useStore } from './store';
import * as ops from './ops';
import type { Line } from './types';
import { STAGE_LABEL, STAGE_TYPES } from './stage';
import { focusField } from './actions';
import { hit, keyOf } from './prefs';

type SetLine = (fn: (x: Line) => void, key?: string) => void;
interface Opt { value: string; label: string }
interface Col { title: string; opts: Opt[] }

// 지금 열린 고르기 창: 줄 id와 자리(상자 안 / 오른쪽 칸). 단축키는 App.tsx가 이 값을 바꾼다
export type TypeMenuAt = { line: string; where: 'box' | 'insp' } | null;

function columns(l: Line, chars: { id: string; name: string }[], val: string): Col[] {
  const say: Opt[] = [{ value: 'narration', label: '내레이션' }, ...chars.map((c) => ({ value: 'say:' + c.id, label: c.name }))];
  if (l.type === 'say' && !chars.some((c) => c.id === l.who)) say.push({ value: val, label: '? ' + l.who });
  return [
    { title: '대사', opts: say },
    // 화면 효과·HUD 줄은 렌파이 편집기에서 고친다. 예전에 넣은 줄만 그대로 보여 준다
    { title: '연출', opts: STAGE_TYPES.filter((t) => (t !== 'fx' && t !== 'hud') || l.type === t).map((t) => ({ value: t, label: STAGE_LABEL[t] })) },
    {
      title: '기타',
      opts: [
        { value: 'flag', label: '⚑ 플래그 바꾸기' },
        { value: 'input', label: '✎ 플래그 입력' },
        { value: 'command', label: '⚙ 직접 명령' },
        { value: 'note', label: '# 메모' },
      ],
    },
  ];
}

// 끈적한 덩어리 모양: 줄 종류 고르기, 태그 상자, 다음 흐름이 같이 쓴다(세션 92)
export const GOO = { blur: 7, contrast: 20, fill: 'var(--panel)', shadow: '0 8px 24px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)' };

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SpeakerSelect({ l, set, className, where = 'insp' }: { l: Line; set: SetLine; className?: string; where?: 'box' | 'insp' }) {
  const chars = useStore((s) => s.project.characters);
  const at = useStore((s) => s.typeMenu);
  const open = !!at && at.line === l.id && at.where === where;
  const btn = useRef<HTMLButtonElement>(null);
  const val = ops.speakerValue(l);
  const cols = columns(l, chars, val);
  const cur = cols.flatMap((c) => c.opts).find((o) => o.value === val);
  const toggle = () => useStore.setState({ typeMenu: open ? null : { line: l.id, where } });
  return (
    <>
      <button
        ref={btn}
        type="button"
        className={'lt-btn ' + (className ?? '') + (open ? ' open' : '')}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`줄 종류 바꾸기 (${keyOf('lineType')}, 방향키로 고르기)`}
        onClick={toggle}
      >
        <span className="lt-cur">{cur?.label ?? val}</span>
        <span className="lt-caret" aria-hidden>▾</span>
      </button>
      {open && btn.current && <TypeMenu anchor={btn.current} cols={cols} val={val} onPick={(v) => set((x) => ops.setSpeaker(x, v))} />}
    </>
  );
}

// 단추 없이 다른 요소(anchor)에 붙어 여는 줄 종류 고르기 (상자 안, 세션 91)
export function TypeMenuFor({ l, set, where, anchor }: { l: Line; set: SetLine; where: 'box' | 'insp'; anchor: React.RefObject<HTMLElement> }) {
  const chars = useStore((s) => s.project.characters);
  const at = useStore((s) => s.typeMenu);
  const open = !!at && at.line === l.id && at.where === where;
  if (!open || !anchor.current) return null;
  const val = ops.speakerValue(l);
  return <TypeMenu side anchor={anchor.current} cols={columns(l, chars, val)} val={val} onPick={(v) => set((x) => ops.setSpeaker(x, v))} />;
}

// 세로로 쌓을 때 칸마다 오른쪽에서 들어간 거리(px): 대사·기타는 상자 가까이, 연출은 조금 더 왼쪽으로 (손그림처럼 엇갈림)
const STAGGER = [12, 46, 0];

function TypeMenu({ anchor, cols, val, onPick, side = false }: { anchor: HTMLElement; cols: Col[]; val: string; onPick: (v: string) => void; side?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [sideTop, setSideTop] = useState<number | null>(null);
  const [sideRight, setSideRight] = useState<number | null>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const back = useRef<string | null>(null);
  // 처음 자리: 지금 고른 것
  const start = (() => {
    for (let c = 0; c < cols.length; c++) {
      const r = cols[c].opts.findIndex((o) => o.value === val);
      if (r >= 0) return { c, r };
    }
    return { c: 0, r: 0 };
  })();
  const [pos, setPos] = useState(start);
  // 칸마다 단추 쪽으로 되돌아갈 거리 (열 때는 거기서 나오고, 닫을 때는 거기로 빨려 듦)
  const [home, setHome] = useState<{ x: number; y: number }[] | null>(null);
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const r = anchor.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left, window.innerWidth - 470));
  const below = r.bottom + 300 < window.innerHeight;
  const top = below ? r.bottom + 6 : Math.max(8, r.top - 306);
  // 세로(side): 방울 왼쪽에 오른쪽 끝을 맞추고, 높이를 잰 뒤 화면 안에 들어오게 위아래를 맞춘다
  const right = window.innerWidth - r.left + 10;
  const place: React.CSSProperties = side ? { right: sideRight ?? right, top: sideTop ?? r.top - 24 } : { left, top };

  useLayoutEffect(() => {
    const el = document.activeElement as HTMLElement | null;
    if (el && el.id) back.current = el.id;
    input.current?.focus({ preventScroll: true });
    if (side && menu.current) {
      const h = menu.current.offsetHeight;
      const t = Math.max(8, Math.min(r.top - 24, window.innerHeight - h - 8));
      menu.current.style.top = t + 'px';
      setSideTop(t);
      // 창이 좁아 왼쪽에 자리가 모자라면 화면 안으로 밀어 넣는다 (상자를 조금 덮더라도 다 보이게)
      const w = menu.current.offsetWidth;
      const rr = Math.min(right, window.innerWidth - w - 16);
      menu.current.style.right = rr + 'px';
      setSideRight(rr);
    }
    const ax = r.left + r.width / 2, ay = r.top + r.height / 2;
    setHome(
      colRefs.current.map((c) => {
        const b = c?.getBoundingClientRect();
        return b ? { x: ax - (b.left + b.width / 2), y: ay - (b.top + Math.min(b.height, 40) / 2) } : { x: 0, y: 0 };
      }),
    );
  }, []);
  // 자리를 잰 다음 그림에서 펼친다 (잰 자리에서 제자리로 움직이게)
  useEffect(() => {
    if (!home) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [home]);
  useLayoutEffect(() => {
    colRefs.current[pos.c]?.querySelectorAll('.lt-opt')[pos.r]?.scrollIntoView({ block: 'nearest' });
  }, [pos]);

  const close = (refocus = true) => {
    if (leaving) return;
    const done = () => {
      useStore.setState({ typeMenu: null });
      if (refocus && back.current) focusField(back.current);
    };
    if (reduced()) return done();
    setLeaving(true);
    setTimeout(done, 260);
  };
  const pick = (v: string) => {
    if (v !== val) onPick(v);
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (hit(e, 'lineType') || k === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      return close();
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      const n = cols[pos.c].opts.length;
      setPos({ c: pos.c, r: (pos.r + (k === 'ArrowDown' ? 1 : -1) + n) % n });
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      const c = (pos.c + (k === 'ArrowRight' ? 1 : -1) + cols.length) % cols.length;
      setPos({ c, r: Math.min(pos.r, cols[c].opts.length - 1) });
    } else if (k === 'Enter') {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      const o = cols[pos.c].opts[pos.r];
      if (o) pick(o.value);
    } else if (k === 'Tab') {
      e.preventDefault();
      const c = (pos.c + (e.shiftKey ? -1 : 1) + cols.length) % cols.length;
      setPos({ c, r: Math.min(pos.r, cols[c].opts.length - 1) });
    }
  };

  const out = shown && !leaving;
  const still = reduced();
  return createPortal(
    <div ref={menu} className={'lt-menu nodrag' + (side ? ' lt-side' : '') + (out ? ' out' : '')} style={place} onMouseDown={(e) => e.target === e.currentTarget && e.preventDefault()}>
      <input
        ref={input}
        className="fm-keys"
        readOnly
        value=""
        aria-label="줄 종류 고르기"
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => document.activeElement?.closest('.lt-menu') || close(false), 0)}
      />
      <Liquid className="lt-liquid" {...GOO}>
        {cols.map((c, ci) => {
          const h = home?.[ci] ?? { x: 0, y: 0 };
          return (
            <Liquid.Item
              key={c.title}
              x={still || out ? 0 : h.x}
              y={still || out ? 0 : h.y}
              scale={still || out ? 1 : 0.35}
              transition={out ? 'bouncy' : { duration: 220, ease: 'cubic-bezier(0.5, 0, 0.75, 0)' }}
              delay={out ? ci * 45 : (cols.length - 1 - ci) * 25}
            >
              <div className="lt-col" ref={(el) => (colRefs.current[ci] = el)} role="listbox" aria-label={c.title} style={side ? { marginRight: STAGGER[ci] ?? 0 } : undefined}>
                <div className="lt-title">{c.title}</div>
                {c.opts.map((o, ri) => (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={o.value === val}
                    className={'lt-opt' + (o.value === val ? ' on' : '') + (pos.c === ci && pos.r === ri ? ' cur' : '')}
                    onMouseEnter={() => setPos({ c: ci, r: ri })}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Liquid.Item>
          );
        })}
      </Liquid>
      <div className="lt-help">Tab 칸 옮기기 · ↑↓ 고르기 · Enter 정하기 · Esc 글로 돌아가기</div>
    </div>,
    document.body,
  );
}
