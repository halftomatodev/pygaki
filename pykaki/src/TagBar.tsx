// 태그 상자: 대사·내레이션 글 칸에 커서가 있으면 뜨는 작은 창. 고른 글을 렌파이 텍스트 태그로 감싸거나 멈춤 태그를 넣는다
// 상자 안 편집에서는 상자 오른쪽 위 바깥에, 오른쪽 편집 탭에서는 글자 효과 칸 위쪽에 붙는다
import { useEffect, useReducer, useRef, useState } from 'react';
import { create } from 'zustand';
import { useStore } from './store';
import { useGameFolder } from './gameFolder';
import { hit, keyOf } from './prefs';
import { EFFECTS, effectKnobs, formatEffect, parseEffect } from './stage';
import { shaderEffect } from './fx/textShaders';
import { RUBY_NOTE, insertRuby, insertTag, removeTag, retag, setTagValue, stepK, stepSize, tagsAt, toggleTag, type Edit } from './tagEdit';

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
const KERN = /^-?\d+(?:\.\d+)?$/;
const MORE_KEY = 'pykaki-tag-more';
const readMore = () => {
  try {
    return localStorage.getItem(MORE_KEY) === '1';
  } catch {
    return false;
  }
};

const KNOBS_KEY = 'pykaki-tag-knobs';
const readKnobs = () => {
  try {
    return localStorage.getItem(KNOBS_KEY) === '1';
  } catch {
    return false;
  }
};

// 색 칸: 고르는 동안에는 값만 보여 주고, 색 창을 닫을 때(change) 한 번만 글에 넣는다
function ColorKnob({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => (setV(null), pick.current(el.value));
    el.addEventListener('change', on);
    return () => el.removeEventListener('change', on);
  }, []);
  return <input ref={ref} type="color" value={v ?? value} onChange={(e) => setV(e.target.value)} />;
}

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
  const [palette, setPalette] = useState<false | 'color' | 'outlinecolor'>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null); // 크기 칸에 치는 중인 값
  const [more, setMore] = useState(readMore);
  const [kern, setKern] = useState<string | null>(null); // 자간 칸에 치는 중인 값
  const [alpha, setAlpha] = useState<number | null>(null); // 투명도 막대를 끄는 중인 값
  const [knobsOpen, setKnobsOpen] = useState(readKnobs); // 고른 글에만 효과의 [세부 값]
  const [knob, setKnob] = useState<{ i: number; key: string; v: string } | null>(null); // 세부 값 막대를 끄는 중인 값
  const media = useGameFolder((f) => f.media);
  const linked = useGameFolder((f) => !!f.name);
  useGameFolder((f) => f.fxSeq); // 효과 목록이 바뀌면 다시 그린다
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
    if (!t.closest('input, select, .tb-grid')) e.preventDefault();
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
    const name = palette || 'color';
    saveRecent(c);
    setPalette(false);
    run((x, s, e) => setTagValue(x, s, e, name, c));
  };
  const outline = at.get('outlinecolor');
  const curK = at.get('k');
  const curFont = at.get('font');
  const curFx = at.get('shader');
  // 고른 글에만 거는 효과: 켜 둔 글자 효과 가운데 외곽선 겹을 쓰는 것(색 잔상 등)은 뺀다. 외곽선은 줄 전체에 걸려서 일부에만 넣을 수 없다
  const partFx = EFFECTS.filter(([n]) => n && !shaderEffect(n)?.outlines.length);
  // 태그 안 효과의 세부 값: {shader=wave:u__amplitude=8}. 막대는 끄는 동안 값만 보여 주고 놓을 때 한 번만 글에 넣는다
  const fxParts = curFx ? parseEffect(curFx) : [];
  const fxSel = fxParts.length === 1 ? fxParts[0].name : curFx; // 목록에는 값을 뗀 이름으로 보인다
  const fxKnobs = fxParts.map((p) => effectKnobs(p.name));
  const fxChanged = fxParts.reduce((n, p) => n + p.args.filter(([k]) => k).length, 0);
  const putKnob = (i: number, key: string, v: string | undefined) => {
    setKnob(null);
    run((x, s, e) => {
      const parts = parseEffect(tagsAt(x, s, e).get('shader'));
      if (!parts[i]) return { error: '효과 태그 안에 있지 않아요' };
      parts[i].args = parts[i].args.filter(([k]) => k !== key);
      if (v !== undefined) parts[i].args.push([key, v]);
      return retag(x, s, e, 'shader', formatEffect(parts) ?? '', '효과');
    });
  };
  const applyKnob = () => knob && putKnob(knob.i, knob.key, knob.v);
  const toggleKnobs = () => {
    try {
      localStorage.setItem(KNOBS_KEY, knobsOpen ? '0' : '1');
    } catch {
      /* 이번 창에서만 */
    }
    setKnobsOpen(!knobsOpen);
  };
  const curAlpha = at.has('alpha') ? Number(at.get('alpha')) : NaN;
  const alphaNow = alpha ?? (curAlpha >= 0 && curAlpha <= 1 ? curAlpha : 1);
  const toggleMore = () => {
    try {
      localStorage.setItem(MORE_KEY, more ? '0' : '1');
    } catch {
      /* 이번 창에서만 */
    }
    setMore(!more);
  };
  const applyKern = () => {
    const v = (kern ?? '').trim();
    setKern(null);
    if (!v) return el()?.focus();
    if (!KERN.test(v)) return setMsg('자간은 2, -1, 0.5 같은 숫자로 적어요'), el()?.focus();
    run((x, s, e) => (Number(v) === 0 ? (tagsAt(x, s, e).has('k') ? removeTag(x, s, e, 'k', '자간') : { text: x, s, e }) : setTagValue(x, s, e, 'k', v)));
  };
  // 투명도 막대는 끄는 동안 값만 보여 주고, 놓을 때 한 번만 글에 넣는다 (실행 취소가 한 번으로 묶이게)
  const applyAlpha = () => {
    if (alpha === null) return;
    const v = String(alpha);
    setAlpha(null);
    run((x, s, e) => (alpha >= 1 ? (tagsAt(x, s, e).has('alpha') ? removeTag(x, s, e, 'alpha', '투명도') : { text: x, s, e }) : setTagValue(x, s, e, 'alpha', v)));
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
        <button className={'tb-btn tb-color' + (palette === 'color' ? ' on' : '')} title="글자 색 {color=}" onClick={() => setPalette((v) => (v === 'color' ? false : 'color'))}>
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
        <span className="tb-fill" />
        <button className={'tb-btn tb-more' + (more ? ' on' : '')} title="투명도, 자간, 글꼴, 외곽선 색, 고른 글에만 효과, 띄우기, 루비, 글 속 그림" onClick={toggleMore}>{more ? '접기 ▴' : '더 보기 ▾'}</button>
      </div>
      {more && (
        <>
          <div className="tb-row">
            <span className="tb-label">투명도</span>
            <input
              className="tb-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={alphaNow}
              title="고른 글의 투명도 {alpha=}: 왼쪽으로 갈수록 흐려요. 맨 오른쪽(1)에 놓으면 태그를 빼요"
              onChange={(e) => setAlpha(Number(e.target.value))}
              onPointerUp={applyAlpha}
              onKeyUp={applyAlpha}
              onBlur={applyAlpha}
            />
            <span className={'tb-val' + (at.has('alpha') ? ' on' : '')}>{alphaNow.toFixed(2)}</span>
            {at.has('alpha') && <button className="tb-btn" title="투명도 태그 빼기" onClick={() => run((x, s, e) => removeTag(x, s, e, 'alpha', '투명도'))}>빼기</button>}
          </div>
          <div className="tb-row">
            <span className="tb-label">자간</span>
            <button className="tb-btn" title="글자 사이를 좁게 (자간 -1)" onClick={() => run((x, s, e) => stepK(x, s, e, -1))}>좁게</button>
            <input
              className={'tb-size' + (curK !== undefined ? ' on' : '')}
              value={kern ?? curK ?? ''}
              placeholder="자간"
              title="자간 {k=}: 글자 사이를 그만큼(픽셀) 넓혀요. 음수는 좁게. Enter로 적용, 0은 빼기"
              onFocus={() => setKern(curK ?? '')}
              onChange={(e) => setKern(e.target.value)}
              onBlur={() => setKern(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.preventDefault(), applyKern());
              }}
            />
            <button className="tb-btn" title="글자 사이를 넓게 (자간 +1)" onClick={() => run((x, s, e) => stepK(x, s, e, 1))}>넓게</button>
            <span className="tb-sep" />
            <button
              className={'tb-btn tb-color' + (palette === 'outlinecolor' ? ' on' : '')}
              title="외곽선 색 {outlinecolor=}: 글자 스타일에 외곽선(outlines)이 있을 때만 게임에서 보여요"
              onClick={() => setPalette((v) => (v === 'outlinecolor' ? false : 'outlinecolor'))}
            >
              <span className="tb-dot tb-ring" style={{ borderColor: outline ?? 'var(--muted)' }} />외곽선 색
            </button>
          </div>
          <div className="tb-row">
            <span className="tb-label">글꼴</span>
            {linked && media.fonts.length ? (
              <select
                className={'tb-sel' + (curFont !== undefined ? ' on' : '')}
                value={curFont ?? ''}
                title="고른 글만 다른 글꼴로 {font=}"
                onChange={(e) => {
                  const v = e.target.value;
                  run((x, s, en) => (v ? setTagValue(x, s, en, 'font', v) : removeTag(x, s, en, 'font', '글꼴')));
                }}
              >
                <option value="">{curFont !== undefined ? '글꼴 태그 빼기' : '글꼴 고르기'}</option>
                {curFont !== undefined && !media.fonts.includes(curFont) && <option value={curFont}>{curFont} (폴더에 없음)</option>}
                {media.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <span className="tb-hint">{linked ? 'game 폴더나 game/fonts에 글꼴 파일(.ttf, .otf)이 없어요' : '게임 폴더를 연결하면 그 안의 글꼴을 골라요'}</span>
            )}
          </div>
          <div className="tb-row">
            <span className="tb-label">효과</span>
            <select
              className={'tb-sel' + (curFx !== undefined ? ' on' : '')}
              value={fxSel ?? ''}
              title="고른 글에만 등장 효과 {shader=}: 줄의 다른 글자는 줄의 효과(없으면 한 글자씩 나오기)로 나와요. 효과를 고르면 [세부 값]에서 막대로 고쳐요"
              onChange={(e) => {
                const v = e.target.value;
                run((x, s, en) => (v ? setTagValue(x, s, en, 'shader', v) : removeTag(x, s, en, 'shader', '효과')));
              }}
            >
              <option value="">{curFx !== undefined ? '효과 태그 빼기' : '고른 글에만 효과'}</option>
              {fxSel !== undefined && !partFx.some(([n]) => n === fxSel) && <option value={fxSel}>{fxSel}</option>}
              {partFx.map(([n, label]) => <option key={n} value={n}>{label}</option>)}
            </select>
            {fxKnobs.some((k) => k.length > 0) && (
              <button className={'tb-btn tb-knobs-btn' + (knobsOpen ? ' on' : '')} title="이 태그 효과의 세부 값을 막대로 고쳐요 ({shader=이름:u__값=3})" onClick={toggleKnobs}>
                세부 값{fxChanged ? ` (${fxChanged})` : ''}
              </button>
            )}
          </div>
          {knobsOpen && fxParts.map((p, i) => fxKnobs[i].length > 0 && (
            <div className="fx-knobs tb-knobs" key={i + p.name}>
              {fxParts.length > 1 && <span className="tb-hint">{EFFECTS.find(([n]) => n === p.name)?.[1] ?? p.name}</span>}
              {fxKnobs[i].map((k) => {
                const set = p.args.find(([key]) => key === k.key)?.[1];
                const drag = knob && knob.i === i && knob.key === k.key ? knob.v : undefined;
                const v = drag ?? set ?? k.def;
                return (
                  <label key={k.key} className={set !== undefined ? 'set' : ''}>
                    <span className="fx-kn" title={k.key}>{k.label}</span>
                    {k.kind === 'color' ? (
                      <ColorKnob value={v.slice(0, 7)} onPick={(c) => putKnob(i, k.key, c)} />
                    ) : (
                      <>
                        <input
                          type="range"
                          min={k.min}
                          max={k.max}
                          step={k.step}
                          value={Number(v)}
                          data-knob={k.key}
                          onChange={(e) => setKnob({ i, key: k.key, v: String(Number(e.target.value)) })}
                          onPointerUp={applyKnob}
                          onKeyUp={applyKnob}
                          onBlur={applyKnob}
                        />
                        <span className="fx-kv">{Number(v)}</span>
                      </>
                    )}
                    <button className="fx-x" style={{ visibility: set !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), putKnob(i, k.key, undefined))}>↺</button>
                  </label>
                );
              })}
            </div>
          ))}
          <div className="tb-row">
            <span className="tb-label">넣기</span>
            {ins('{space=30}', '가로 띄우기', '여기에 가로로 빈 자리를 넣어요 (숫자는 픽셀, 바꿀 수 있어요)', '30')}
            {ins('{vspace=30}', '세로 띄우기', '여기서 줄을 바꾸고 세로로 빈 자리를 넣어요 (숫자는 픽셀)', '30')}
            {ins('{{', '{ 글자', '중괄호를 글자 그대로 보여요')}
            <button className="tb-btn tb-ins" title="루비: 고른 글 위에 작은 글(읽는 법)을 올려요 {rb}글{/rb}{rt}읽는 법{/rt}. 고른 글이 없으면 바로 앞 글자 위에 올려요. 게임에서 style ruby_text의 크기와 자리를 정해 줘야 글 위에 작게 올라가요" onClick={() => (run((x, s, e) => insertRuby(x, s, e, '읽는 법')), setMsg(RUBY_NOTE))}>루비</button>
            {linked && media.images.length > 0 && (
              <select
                className="tb-sel tb-sel-s"
                value=""
                title="글 속 그림 {image=}: 커서 자리에 그림을 글자처럼 넣어요"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) run((x, s, en) => insertTag(x, s, en, `{image=${v}}`));
                }}
              >
                <option value="">글 속 그림</option>
                {media.images.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
        </>
      )}
      {palette && (
        <Palette
          key={palette}
          current={palette === 'color' ? color : outline}
          onPick={pickColor}
          onRemove={() => {
            const name = palette;
            setPalette(false);
            run((x, s, e) => removeTag(x, s, e, name, name === 'color' ? '색' : '외곽선 색'));
          }}
          onClose={() => (setPalette(false), el()?.focus())}
        />
      )}
      {msg && <div className="tb-msg">{msg}</div>}
    </div>
  );
}
