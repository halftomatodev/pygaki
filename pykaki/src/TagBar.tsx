// 태그 상자: 대사·내레이션 글 칸에 커서가 있으면 뜨는 작은 창. 고른 글을 렌파이 텍스트 태그로 감싸거나 멈춤 태그를 넣는다
// 상자 안 편집에서는 상자 오른쪽 위 바깥에, 오른쪽 편집 탭에서는 글자 효과 칸 위쪽에 붙는다
import { useEffect, useReducer, useRef, useState } from 'react';
import { create } from 'zustand';
import { useStore } from './store';
import { useGameFolder } from './gameFolder';
import { hit, keyOf } from './prefs';
import { insertTag, removeTag, setTagValue, stepSize, tagsAt, toggleTag, type Edit } from './tagEdit';

// 지금 태그를 넣을 글 칸(textarea id). 태그 상자 안으로 포커스가 옮겨 가도 그대로 둔다
export const useTagTarget = create<{ id: string | null }>(() => ({ id: null }));
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLTextAreaElement && t.dataset.tags) useTagTarget.setState({ id: t.id });
    else if (!t.closest?.('.tagbar')) useTagTarget.setState({ id: null });
  });
  document.addEventListener('focusout', (e) => {
    const to = (e as FocusEvent).relatedTarget as HTMLElement | null;
    const from = e.target as HTMLElement;
    // 창 밖으로 나갈 때는 그대로 두고(돌아오면 다시 포커스), 빈 곳을 눌러 포커스가 사라지면 닫는다
    if (!to && document.hasFocus() && (from.dataset?.tags || from.closest?.('.tagbar'))) setTimeout(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body) useTagTarget.setState({ id: null });
    });
  });
}

// React가 글 칸을 다시 그리게 진짜 입력처럼 값을 넣는다 (React onChange → 실행 취소도 그대로)
const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
function applyTo(el: HTMLTextAreaElement, r: { text: string; s: number; e: number }) {
  if (r.text !== el.value) {
    valueSetter.call(el, r.text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  el.focus();
  el.setSelectionRange(r.s, r.e);
  requestAnimationFrame(() => el.setSelectionRange(r.s, r.e));
}

// ── 색 팔레트 ──
const HUES = ['빨강', '주황', '노랑', '초록', '하늘', '파랑', '보라', '분홍'];
const PALETTE: string[][] = [
  ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#7dd3fc', '#93c5fd', '#c4b5fd', '#f9a8d4'],
  ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'],
  ['#b91c1c', '#c2410c', '#a16207', '#15803d', '#0369a1', '#1d4ed8', '#6d28d9', '#be185d'],
  ['#ffffff', '#e5e5e5', '#bfbfbf', '#999999', '#737373', '#4d4d4d', '#262626', '#000000'],
];
const ROW_NAMES = ['밝은', '', '어두운'];
const RECENT_KEY = 'pykaki-recent-colors';
const readRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
};
const saveRecent = (c: string) => {
  const v = [c, ...readRecent().filter((x) => x !== c)].slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(v));
  } catch {
    /* 이번 창에서만 */
  }
};
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const SIZE = /^[+\-*]?\d+(?:\.\d+)?$/;

interface Swatch { c: string; title: string }

function Palette({ current, onPick, onRemove, onClose }: { current?: string; onPick: (c: string) => void; onRemove: () => void; onClose: () => void }) {
  const chars = useStore((s) => s.project.characters);
  const look = useGameFolder((f) => (f.name ? f.look.textColor : null));
  const [hex, setHex] = useState(current ?? '');
  const grid = useRef<HTMLDivElement>(null);

  const own: Swatch[] = [];
  const seen = new Set<string>();
  const addOwn = (c: string | undefined | null, title: string) => {
    if (!c || !HEX.test(c) || seen.has(c.toLowerCase())) return;
    seen.add(c.toLowerCase());
    own.push({ c, title });
  };
  addOwn(look, '대사창 기본 글자 색 (gui.rpy)');
  for (const ch of chars) addOwn(ch.color, `${ch.name} 이름 색`);
  const rows: { name: string; items: Swatch[] }[] = [
    { name: '기본', items: PALETTE.flat().map((c, i) => ({ c, title: i >= 24 ? '회색 ' + c : `${ROW_NAMES[Math.floor(i / 8)]} ${HUES[i % 8]} `.trim() + ' ' + c })) },
    ...(own.length ? [{ name: '이 프로젝트', items: own.slice(0, 8) }] : []),
    ...(readRecent().length ? [{ name: '최근', items: readRecent().map((c) => ({ c, title: '최근에 쓴 색 ' + c })) }] : []),
  ];
  const flat = rows.flatMap((r) => r.items);
  const [cur, setCur] = useState(() => Math.max(0, flat.findIndex((x) => x.c.toLowerCase() === current?.toLowerCase())));

  useEffect(() => grid.current?.focus(), []);

  // 칸 옮기기: 기본 팔레트는 8칸씩 줄, 아래 줄들도 8칸씩
  const onKey = (e: React.KeyboardEvent) => {
    const n = flat.length;
    const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[e.key];
    if (mv) {
      e.preventDefault();
      setCur((c) => Math.min(n - 1, Math.max(0, c + mv)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[cur]) onPick(flat[cur].c);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  let k = 0;
  return (
    <div className="tb-palette">
      <div className="tb-grid" ref={grid} tabIndex={0} onKeyDown={onKey} title="←↑→↓로 옮기고 Enter로 골라요. Esc는 닫기">
        {rows.map((r) => (
          <div key={r.name} className="tb-prow">
            <span className="tb-pname">{r.name}</span>
            <div className="tb-swatches">
              {r.items.map((s) => {
                const i = k++;
                return (
                  <button
                    key={r.name + s.c}
                    tabIndex={-1}
                    className={'tb-sw' + (i === cur ? ' cur' : '') + (s.c.toLowerCase() === current?.toLowerCase() ? ' on' : '')}
                    style={{ background: s.c }}
                    title={s.title}
                    onMouseEnter={() => setCur(i)}
                    onClick={() => onPick(s.c)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="tb-prow tb-hexrow">
        <input
          className="tb-hex"
          value={hex}
          placeholder="#rrggbb"
          spellCheck={false}
          onChange={(e) => setHex(e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && HEX.test(hex)) (e.preventDefault(), onPick(hex));
            else if (e.key === 'Escape') (e.preventDefault(), e.stopPropagation(), onClose());
          }}
        />
        <label className="tb-pick" title="직접 고르기">
          <input type="color" value={HEX.test(hex) && hex.length === 7 ? hex : '#ffffff'} onChange={(e) => setHex(e.target.value)} />
          직접 고르기
        </label>
        <button disabled={!HEX.test(hex)} onClick={() => onPick(hex)}>적용</button>
        {current !== undefined && <button onClick={onRemove}>색 빼기</button>}
      </div>
    </div>
  );
}

// ── 태그 상자 ──
export function TagBar({ targetId, className = '' }: { targetId: string; className?: string }) {
  const tagsOn = useStore((s) => s.project.settings.allowTextTags);
  const update = useStore((s) => s.update);
  const [, redraw] = useReducer((x: number) => x + 1, 0);
  const [palette, setPalette] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null); // 크기 칸에 치는 중인 값
  const el = () => document.getElementById(targetId) as HTMLTextAreaElement | null;

  // 커서가 움직이면 단추 켜짐을 다시 본다
  useEffect(() => {
    const on = () => document.activeElement?.id === targetId && redraw();
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, [targetId]);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const run = (fn: (text: string, s: number, e: number) => Edit) => {
    const t = el();
    if (!t) return;
    const r = fn(t.value, t.selectionStart, t.selectionEnd);
    if ('error' in r) return setMsg(r.error), t.focus();
    setMsg(null);
    applyTo(t, r);
    redraw();
  };

  // Ctrl+B, I, U (바꿀 수 있음)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.id !== targetId || !tagsOn) return;
      const name = hit(e, 'tagBold') ? 'b' : hit(e, 'tagItalic') ? 'i' : hit(e, 'tagUnderline') ? 'u' : null;
      if (!name) return;
      e.preventDefault();
      e.stopPropagation();
      run((t, s, en) => toggleTag(t, s, en, name));
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [targetId, tagsOn]);

  // 단추를 눌러도 글 칸의 포커스와 고른 곳이 그대로 남게 (입력 칸만 빼고)
  const keep = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest('input, .tb-grid')) e.preventDefault();
  };

  const cls = 'tagbar nodrag nowheel ' + className;
  if (!tagsOn)
    return (
      <div className={cls} onMouseDown={keep}>
        <div className="tb-off">
          텍스트 태그가 꺼져 있어요. <code>{'{'}</code>가 글자 그대로 나가요.
          <button className="primary" onClick={() => update((p) => void (p.settings.allowTextTags = true))}>켜기</button>
        </div>
      </div>
    );

  const t = el();
  const at = t ? tagsAt(t.value, t.selectionStart, t.selectionEnd) : new Map<string, string>();
  const color = at.get('color');
  const curSize = at.get('size');
  const tog = (name: string, label: React.ReactNode, title: string) => (
    <button className={'tb-btn tb-' + name + (at.has(name) ? ' on' : '')} title={title} onClick={() => run((x, s, e) => toggleTag(x, s, e, name))}>
      {label}
    </button>
  );
  const ins = (tag: string, label: string, title: string, pick?: string) => (
    <button className="tb-btn tb-ins" title={title + '  ' + tag} onClick={() => run((x, s, e) => insertTag(x, s, e, tag, pick))}>
      {label}
    </button>
  );
  const applySize = () => {
    const v = (size ?? '').trim();
    setSize(null);
    if (!v) return el()?.focus();
    if (!SIZE.test(v)) return setMsg('크기는 30, +10, -10, *1.5 처럼 적어요'), el()?.focus();
    run((x, s, e) => setTagValue(x, s, e, 'size', v));
  };
  const pickColor = (c: string) => {
    saveRecent(c);
    setPalette(false);
    run((x, s, e) => setTagValue(x, s, e, 'color', c));
  };

  return (
    <div className={cls} onMouseDown={keep} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setPalette(false), el()?.focus())}>
      <div className="tb-row">
        {tog('b', 'B', `굵게 {b}  ${keyOf('tagBold')}`)}
        {tog('i', 'I', `기울임 {i}  ${keyOf('tagItalic')}`)}
        {tog('u', 'U', `밑줄 {u}  ${keyOf('tagUnderline')}`)}
        {tog('s', 'S', '취소선 {s}')}
        <span className="tb-sep" />
        <button className="tb-btn" title="작게 (크기 -10)" onClick={() => run((x, s, e) => stepSize(x, s, e, -10))}>가−</button>
        <input
          className={'tb-size' + (curSize !== undefined ? ' on' : '')}
          value={size ?? curSize ?? ''}
          placeholder="크기"
          title="크기 {size=}: 30은 그 크기, +10은 더 크게, -10은 더 작게, *1.5는 1.5배. Enter로 적용"
          onFocus={() => setSize(curSize ?? '')}
          onChange={(e) => setSize(e.target.value)}
          onBlur={() => setSize(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.preventDefault(), applySize());
          }}
        />
        <button className="tb-btn" title="크게 (크기 +10)" onClick={() => run((x, s, e) => stepSize(x, s, e, 10))}>가+</button>
        <span className="tb-sep" />
        <button className={'tb-btn tb-color' + (palette ? ' on' : '')} title="글자 색 {color=}" onClick={() => setPalette((v) => !v)}>
          <span className="tb-dot" style={{ background: color ?? 'conic-gradient(#ef4444, #eab308, #22c55e, #0ea5e9, #8b5cf6, #ef4444)' }} />색
        </button>
      </div>
      <div className="tb-row">
        <span className="tb-label">멈춤</span>
        {ins('{w}', '클릭 대기', '여기서 클릭할 때까지 기다렸다가 이어서')}
        {ins('{w=0.5}', '잠깐', '여기서 0.5초 쉬었다가 이어서 (숫자는 바꿀 수 있어요)', '0.5')}
        {ins('{p}', '줄 바꾸며 대기', '클릭할 때까지 기다리고 줄을 바꿔요')}
        {ins('{nw}', '자동 넘김', '다 나오면 클릭 없이 다음 줄로 (글 끝에 넣어요)')}
        {ins('{fast}', '여기까지 한 번에', '이 앞의 글은 한 번에 보여요')}
      </div>
      <div className="tb-row">
        <span className="tb-label">속도</span>
        <button className={'tb-btn' + (at.get('cps') === '*0.5' ? ' on' : '')} title="고른 글만 느리게 {cps=*0.5}" onClick={() => run((x, s, e) => setTagValue(x, s, e, 'cps', '*0.5'))}>느리게</button>
        <button className={'tb-btn' + (at.get('cps') === '*2' ? ' on' : '')} title="고른 글만 빠르게 {cps=*2}" onClick={() => run((x, s, e) => setTagValue(x, s, e, 'cps', '*2'))}>빠르게</button>
        {at.has('cps') && <button className="tb-btn" title="속도 태그 빼기" onClick={() => run((x, s, e) => removeTag(x, s, e, 'cps', '속도'))}>보통</button>}
      </div>
      {palette && <Palette current={color} onPick={pickColor} onRemove={() => (setPalette(false), run((x, s, e) => removeTag(x, s, e, 'color', '색')))} onClose={() => (setPalette(false), el()?.focus())} />}
      {msg && <div className="tb-msg">{msg}</div>}
    </div>
  );
}
