// 태그 상자: 대사·내레이션 글 칸에 커서가 있으면 뜨는 작은 창. 고른 글을 렌파이 텍스트 태그로 감싸거나 멈춤 태그를 넣는다
// 상자 안 편집에서는 상자 오른쪽 위 바깥에, 오른쪽 편집 탭에서는 글자 효과 칸 위쪽에 붙는다
import { useEffect, useReducer, useRef, useState } from 'react';
import { create } from 'zustand';
import { useStore } from './store';
import { useGameFolder } from './gameFolder';
import { hit, keyOf } from './prefs';
import { EFFECTS, effectKnobs, formatEffect, parseEffect } from './stage';
import { shaderEffect } from './fx/textShaders';
import { RUBY_NOTE, insertRuby, insertTag, removeTag, retag, setTagValue, stepSize, tagsAt, toggleTag, type Edit } from './tagEdit';
import { TagDemo, type Tip } from './TagDemo';

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

// 막대 + 숫자 칸: 끄는 동안 값만 보여 주고, 놓을 때(또는 숫자 칸에서 Enter) 한 번만 글에 넣는다 (실행 취소가 한 번으로 묶이게)
// stops가 있으면 막대는 그 값들 사이를 칸칸이 옮긴다 (속도처럼 1 둘레를 촘촘히). 숫자 칸에는 그 사이 값도 적을 수 있다
const fmt = (x: number) => String(Math.round(x * 100) / 100);
function Slide({ cur, def, min, max, step = 1, stops, unit, title, onCommit, onLive }: {
  cur?: number; def: number; min: number; max: number; step?: number; stops?: number[]; unit?: string; title: string;
  onCommit(v: number): void; onLive?(v: number | null): void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  // 놓을 때(keyup·pointerup) 넣고 나면 글 칸으로 포커스가 옮겨 가며 blur가 또 온다. 그때는 이미 넣었으니 ref로 한 번만
  const dragRef = useRef<number | null>(null);
  const v = drag ?? cur ?? def;
  const idx = (x: number) => stops!.reduce((b, s, i) => (Math.abs(s - x) < Math.abs(stops![b] - x) ? i : b), 0);
  const live = (x: number | null) => ((dragRef.current = x), setDrag(x), onLive?.(x));
  const commit = () => {
    const x = dragRef.current;
    if (x === null) return;
    live(null);
    onCommit(x);
  };
  const typed = () => {
    const x = Number((typing ?? '').trim().replace(/^[*×x]/, ''));
    setTyping(null);
    if (typing?.trim() && Number.isFinite(x)) onCommit(Math.min(max, Math.max(min, x)));
  };
  return (
    <>
      <input
        className="tb-range"
        type="range"
        title={title}
        min={stops ? 0 : min}
        max={stops ? stops.length - 1 : max}
        step={stops ? 1 : step}
        value={stops ? idx(v) : v}
        onChange={(e) => {
          const n = Number(e.target.value);
          live(stops ? stops[n] : n);
        }}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <input
        className={'tb-num' + (cur !== undefined ? ' on' : '')}
        value={typing ?? fmt(v)}
        title={title + '  (숫자를 적고 Enter)'}
        onFocus={(e) => (setTyping(fmt(v)), e.target.select())}
        onChange={(e) => setTyping(e.target.value)}
        onBlur={() => setTyping(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.preventDefault(), typed());
        }}
      />
      {unit && <span className="tb-unit">{unit}</span>}
    </>
  );
}

// 툴팁: 이름, 넣는 태그, 설명, 견본 글 (TagDemo가 한 글자씩 돌려 보여 줌)
const TIPS: Record<string, Tip> = {
  w: { label: '클릭 대기', code: '{w}', desc: '여기서 클릭할 때까지 기다렸다가 이어서 나와요', demo: '여기서 멈추고{w} 클릭하면 이어져요' },
  w05: { label: '잠깐', code: '{w=0.5}', desc: '여기서 0.5초 쉬었다가 저절로 이어서 나와요. 숫자는 바꿀 수 있어요', demo: '잠깐 쉬었다가{w=0.8} 저절로 이어져요' },
  p: { label: '줄 바꾸며 대기', code: '{p}', desc: '클릭할 때까지 기다리고, 줄을 바꿔서 이어 나와요', demo: '첫 줄이 나오고{p}줄을 바꿔 이어져요' },
  nw: { label: '자동 넘김', code: '{nw}', desc: '글이 다 나오면 클릭 없이 다음 줄로 넘어가요. 글 끝에 넣어요', demo: '다 나오면 기다리지 않고{nw}', next: '다음 줄이 바로 나와요' },
  fast: { label: '여기까지 한 번에', code: '{fast}', desc: '이 앞의 글은 한 번에 보이고, 뒤의 글부터 한 글자씩 나와요', demo: '앞은 한 번에 보이고{fast} 여기부터 한 글자씩' },
  space: { label: '가로 띄우기', code: '{space=30}', desc: '커서 자리에 가로로 빈 자리를 넣어요. 숫자는 픽셀', demo: '가로로{space=60}띄웠어요' },
  vspace: { label: '세로 띄우기', code: '{vspace=30}', desc: '여기서 줄을 바꾸고 세로로 빈 자리를 넣어요. 숫자는 픽셀', demo: '첫 줄{vspace=24}세로로 띄운 줄' },
  brace: { label: '{ 글자', code: '{{', desc: '중괄호를 태그가 아닌 글자 그대로 보여요', demo: '중괄호 {{그대로} 보여요' },
  ruby: {
    label: '루비',
    code: '{rb}글{/rb}{rt}읽는 법{/rt}',
    desc: '고른 글 위에 작은 글(읽는 법)을 올려요. 고른 글이 없으면 바로 앞 글자 위에. 게임에서 style ruby_text의 크기와 자리를 정해 줘야 글 위에 작게 올라가요 (견본은 작은 글로만)',
    demo: '{rb}夢{/rb}{rt}꿈{/rt}을 꿨어요',
  },
};
const CPS_STOPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];

// ── 태그 상자 ──
// 묶음마다 카드 한 장. 카드 안 줄마다 소제목 버블(색은 카드마다 다름)
export function TagBar({ targetId, className = '' }: { targetId: string; className?: string }) {
  const tagsOn = useStore((s) => s.project.settings.allowTextTags);
  const update = useStore((s) => s.update);
  const [, redraw] = useReducer((x: number) => x + 1, 0);
  const [palette, setPalette] = useState<false | 'color' | 'outlinecolor'>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null); // 크기 칸에 치는 중인 값
  const [more, setMore] = useState(readMore);
  const [knobsOpen, setKnobsOpen] = useState(readKnobs); // 고른 글에만 효과의 [세부 값]
  const [knob, setKnob] = useState<{ i: number; key: string; v: string } | null>(null); // 세부 값 막대를 끄는 중인 값
  const knobRef = useRef(knob); // 놓은 뒤 blur가 또 와도 한 번만 넣게
  knobRef.current = knob;
  const [tip, setTip] = useState<string | null>(null); // 툴팁을 띄운 단추
  const [liveV, setLiveV] = useState<{ cps?: number; alpha?: number; k?: number }>({}); // 막대를 끄는 중인 값 (툴팁 견본에 바로)
  const tipTimer = useRef<ReturnType<typeof setTimeout>>();
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
  useEffect(() => () => clearTimeout(tipTimer.current), []);

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
        <div className="tb-card tb-off">
          텍스트 태그가 꺼져 있어요. <code>{'{'}</code>가 글자 그대로 나가요.
          <button className="primary" onClick={() => update((p) => void (p.settings.allowTextTags = true))}>켜기</button>
        </div>
      </div>
    );

  const t = el();
  const at = t ? tagsAt(t.value, t.selectionStart, t.selectionEnd) : new Map<string, string>();
  const color = at.get('color');
  const curSize = at.get('size');
  // 툴팁: 잠깐 올려 두면 뜨고, 벗어나면 닫는다
  const tipOn = (key: string) => ({
    onPointerEnter: () => {
      clearTimeout(tipTimer.current);
      tipTimer.current = setTimeout(() => setTip(key), 350);
    },
    onPointerLeave: () => {
      clearTimeout(tipTimer.current);
      setTip(null);
    },
  });
  const tog = (name: string, label: React.ReactNode, title: string) => (
    <button className={'tb-btn tb-' + name + (at.has(name) ? ' on' : '')} title={title} onClick={() => run((x, s, e) => toggleTag(x, s, e, name))}>
      {label}
    </button>
  );
  const ins = (tag: string, key: string, pick?: string) => (
    <button className="tb-btn tb-ins" aria-label={TIPS[key].label + '  ' + tag} {...tipOn(key)} onClick={() => run((x, s, e) => insertTag(x, s, e, tag, pick))}>
      {TIPS[key].label}
    </button>
  );
  // 값을 넣거나, 기본값이면 태그를 뺀다
  const putOrDrop = (name: string, what: string, v: string | null) =>
    run((x, s, e) => (v !== null ? setTagValue(x, s, e, name, v) : tagsAt(x, s, e).has(name) ? removeTag(x, s, e, name, what) : { text: x, s, e }));
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
  const applyKnob = () => {
    const k = knobRef.current;
    if (!k) return;
    knobRef.current = null;
    putKnob(k.i, k.key, k.v);
  };
  const toggleKnobs = () => {
    try {
      localStorage.setItem(KNOBS_KEY, knobsOpen ? '0' : '1');
    } catch {
      /* 이번 창에서만 */
    }
    setKnobsOpen(!knobsOpen);
  };
  const toggleMore = () => {
    try {
      localStorage.setItem(MORE_KEY, more ? '0' : '1');
    } catch {
      /* 이번 창에서만 */
    }
    setMore(!more);
  };
  // 속도 {cps=*배}: 막대는 배율. {cps=20}처럼 글자/초로 적은 태그는 그 값을 따로 알려 준다
  const cpsTag = at.get('cps');
  const cpsMul = cpsTag?.startsWith('*') ? Number(cpsTag.slice(1)) || undefined : undefined;
  const cpsFixed = cpsTag !== undefined && !cpsTag.startsWith('*') ? cpsTag : undefined;
  const curAlpha = at.has('alpha') ? Number(at.get('alpha')) : NaN;
  const alphaV = curAlpha >= 0 && curAlpha <= 1 ? curAlpha : undefined;
  const curK = at.has('k') ? Number(at.get('k')) : NaN;
  const kV = Number.isFinite(curK) ? curK : undefined;
  const live = (name: 'cps' | 'alpha' | 'k') => (v: number | null) => setLiveV((o) => ({ ...o, [name]: v ?? undefined }));
  // 막대 툴팁은 지금 값(끄는 중이면 그 값)으로 견본을 돌린다
  const cpsNow = liveV.cps ?? cpsMul ?? 1;
  const alphaNow = liveV.alpha ?? alphaV ?? 1;
  const kNow = liveV.k ?? kV ?? 0;
  const slideTips: Record<string, Tip> = {
    cps: { label: '속도', code: `{cps=*${fmt(cpsNow)}}`, desc: '고른 글만 나오는 빠르기를 바꿔요. 1보다 작으면 느리게, 크면 빠르게. 1에 놓으면 태그를 빼요', demo: `보통으로 나오다가 {cps=*${cpsNow}}이 부분만 ${cpsNow < 1 ? '느리게' : cpsNow > 1 ? '빠르게' : '그대로'}{/cps} 다시 보통` },
    alpha: { label: '투명도', code: `{alpha=${fmt(alphaNow)}}`, desc: '고른 글을 흐리게 해요. 왼쪽으로 갈수록 흐려요. 1에 놓으면 태그를 빼요', demo: `보통 글 {alpha=${alphaNow}}흐리게 한 글{/alpha} 보통 글` },
    k: { label: '자간', code: `{k=${fmt(kNow)}}`, desc: '고른 글의 글자 사이를 그만큼(픽셀) 넓혀요. 음수는 좁게. 0에 놓으면 태그를 빼요', demo: `보통 글 {k=${kNow}}자간을 바꾼 글{/k}` },
  };
  const tipInfo = tip ? TIPS[tip] ?? slideTips[tip] : null;

  return (
    <div className={cls} onMouseDown={keep} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setPalette(false), el()?.focus())}>
      <div className="tb-card" style={{ '--hue': 215 } as React.CSSProperties}>
        <div className="tb-row">
          <span className="tb-chip">글자</span>
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
      </div>
      <div className="tb-card" style={{ '--hue': 28 } as React.CSSProperties}>
        <div className="tb-row">
          <span className="tb-chip">멈춤</span>
          {ins('{w}', 'w')}
          {ins('{w=0.5}', 'w05', '0.5')}
          {ins('{p}', 'p')}
          {ins('{nw}', 'nw')}
          {ins('{fast}', 'fast')}
        </div>
      </div>
      <div className="tb-card" style={{ '--hue': 150 } as React.CSSProperties}>
        <div className="tb-row">
          <span className="tb-chip">속도</span>
          <span className="tb-slide" {...tipOn('cps')}>
            <Slide
              cur={cpsMul}
              def={1}
              min={0.1}
              max={10}
              stops={CPS_STOPS}
              unit="배"
              title="고른 글만 빠르기를 바꿔요 {cps=*배}"
              onLive={live('cps')}
              onCommit={(v) => putOrDrop('cps', '속도', v === 1 ? null : '*' + fmt(v))}
            />
          </span>
          {cpsFixed !== undefined && <span className="tb-hint" title="{cps=}에 숫자만 적으면 1초에 그만큼 글자가 나와요">{cpsFixed}자/초</span>}
          {at.has('cps') && <button className="tb-btn" title="속도 태그 빼기" onClick={() => run((x, s, e) => removeTag(x, s, e, 'cps', '속도'))}>보통</button>}
          <span className="tb-fill" />
          <button className={'tb-btn tb-more' + (more ? ' on' : '')} title="투명도, 자간, 외곽선 색, 글꼴, 고른 글에만 효과, 띄우기, 루비, 글 속 그림" onClick={toggleMore}>{more ? '접기 ▴' : '더 보기 ▾'}</button>
        </div>
      </div>
      {more && (
        <>
          <div className="tb-card" style={{ '--hue': 268 } as React.CSSProperties}>
            <div className="tb-row" {...tipOn('alpha')}>
              <span className="tb-chip">투명도</span>
              <Slide cur={alphaV} def={1} min={0} max={1} step={0.05} title="고른 글의 투명도 {alpha=}" onLive={live('alpha')} onCommit={(v) => putOrDrop('alpha', '투명도', v >= 1 ? null : fmt(v))} />
            </div>
            <div className="tb-row" {...tipOn('k')}>
              <span className="tb-chip">자간</span>
              <Slide cur={kV} def={0} min={-10} max={30} step={0.5} unit="px" title="고른 글의 자간 {k=}" onLive={live('k')} onCommit={(v) => putOrDrop('k', '자간', v === 0 ? null : fmt(v))} />
            </div>
            <div className="tb-row">
              <span className="tb-chip">외곽선</span>
              <button
                className={'tb-btn tb-color' + (palette === 'outlinecolor' ? ' on' : '')}
                title="외곽선 색 {outlinecolor=}: 글자 스타일에 외곽선(outlines)이 있을 때만 게임에서 보여요"
                onClick={() => setPalette((v) => (v === 'outlinecolor' ? false : 'outlinecolor'))}
              >
                <span className="tb-dot tb-ring" style={{ borderColor: outline ?? 'var(--muted)' }} />외곽선 색
              </button>
            </div>
          </div>
          <div className="tb-card" style={{ '--hue': 330 } as React.CSSProperties}>
            <div className="tb-row">
              <span className="tb-chip">글꼴</span>
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
              <span className="tb-chip">효과</span>
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
          </div>
          <div className="tb-card" style={{ '--hue': 188 } as React.CSSProperties}>
            <div className="tb-row">
              <span className="tb-chip">넣기</span>
              {ins('{space=30}', 'space', '30')}
              {ins('{vspace=30}', 'vspace', '30')}
              {ins('{{', 'brace')}
              <button className="tb-btn tb-ins" aria-label="루비" {...tipOn('ruby')} onClick={() => (run((x, s, e) => insertRuby(x, s, e, '읽는 법')), setMsg(RUBY_NOTE))}>루비</button>
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
          </div>
        </>
      )}
      {palette && (
        <div className="tb-card" style={{ '--hue': palette === 'color' ? 215 : 268 } as React.CSSProperties}>
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
        </div>
      )}
      {msg && <div className="tb-card tb-msg">{msg}</div>}
      {tipInfo && (
        <div className="tb-tip">
          <div className="tb-tip-head">
            <b>{tipInfo.label}</b>
            <code>{tipInfo.code}</code>
          </div>
          <div className="tb-tip-desc">{tipInfo.desc}</div>
          {tipInfo.demo && <TagDemo text={tipInfo.demo} next={tipInfo.next} />}
        </div>
      )}
    </div>
  );
}
