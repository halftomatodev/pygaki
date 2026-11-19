// 왼쪽·오른쪽 칸과 GUI 편집 칸이 같이 쓰는 카드 (fluidkit LiquidCard 유리, 내용은 그 안 content 칸). 접으면 이름만 남고 하늘색 톤이 된다.
// 카드마다 접기 단추는 없다(세션 78): 제목 줄을 누르면 접고 펴고, 칸 맨 위의 일괄 단추(FoldAll)로 모두 접고 편다.
// 펼칠 때는 아이폰 폴더 열기처럼 안의 줄들이 제목 쪽에서 작게 흐린 채 하나씩 늦게 커지며 나오고, 접을 때는 거꾸로 들어간다(FoldBody).
// 접은 카드는 이 브라우저에 기억한다 (localStorage `pygaki-folded`, 카드 id → 접힘).
// 왼쪽 칸 카드(FRESH)는 기억을 안 쓰고 켤 때마다 접혀서 시작한다.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { create } from 'zustand';
import { LiquidCard } from 'fluidkit';
import { BorderBeam } from 'border-beam';
import { Hint } from './Help';
import { useStore } from './store';
import { glassOf, useDark, usePrefs } from './prefs';

const KEY = 'pygaki-folded';
export const FRESH = ['labels', 'chars', 'warn', 'project', 'script', 'settings', 'usage'];
// "사용 중"이 될 수 있는 카드 (Inspector.tsx `use`). 이 카드들은 늘 border-beam으로 감싸 두고 사용 중일 때만 빛을 켠다.
// 사용 중이 될 때마다 감싸고 풀면 카드 안이 새로 그려져 입력 칸 초점이 빠지므로 감싼 틀은 그대로 둔다(세션 90)
const BEAM = new Set(['i-look', 'i-say', 'i-lines', 'i-bg', 'i-pic', 'i-sound']);

function load(): Record<string, boolean> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v === 'object') {
      for (const id of FRESH) delete v[id];
      return v;
    }
    // 예전 판에서 기억한 것 (스크립트는 펼쳐야 보였고, 사용법은 접을 수 있었다)
    const old: Record<string, boolean> = {};
    return old;
  } catch {
    return {};
  }
}

export const useFolded = create<Record<string, boolean>>(load);
useFolded.subscribe((v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // 기억 못 해도 이번 창에서는 접힌다
  }
});

export const toggleFold = (id: string, def = false) => useFolded.setState((s) => ({ [id]: !(s[id] ?? def) }));

// [모두 접기] 단추가 그 칸에 지금 보이는 카드를 알게: 칸(FoldScope)마다 카드 id → 기본 접힘
const Scope = createContext<string | null>(null);
const useMounted = create<Record<string, Record<string, boolean>>>(() => ({}));

export function FoldScope({ name, children }: { name: string; children: ReactNode }) {
  return <Scope.Provider value={name}>{children}</Scope.Provider>;
}

// 칸 맨 위 오른쪽의 [모두 접기]↔[모두 펼치기] 하나. 펼친 카드가 하나라도 있으면 모두 접기.
// 글 앞의 학종이 아이콘: 펼친 카드가 있으면 펴진 종이, 모두 접혔으면 대각선으로 반 접힌 종이. 누르면 접히고 펴지는 것이 보인다
// 칸을 통째로 접는 ‹ › 단추는 이 단추 바로 옆(캔버스 쪽)에 붙는다(세션 82). 칸을 접으면 캔버스 위 단추(Canvas.tsx)로 편다
export function FoldAll({ side }: { side: 'left' | 'right' }) {
  const scope = useContext(Scope);
  const cards = useMounted((m) => (scope ? m[scope] : undefined));
  const folded = useFolded();
  const ids = Object.keys(cards ?? {});
  const anyOpen = ids.some((id) => !(folded[id] ?? cards![id]));
  const all = () => useFolded.setState(Object.fromEntries(ids.map((id) => [id, anyOpen])));
  const hide = (
    <button className="side-fold" title={side === 'left' ? '왼쪽 칸 접기' : '오른쪽 칸 접기'} aria-label={side === 'left' ? '왼쪽 칸 접기' : '오른쪽 칸 접기'} onClick={() => useStore.getState().togglePanel(side)}>
      {side === 'left' ? '‹' : '›'}
    </button>
  );
  return (
    <div className="fold-all">
      {side === 'right' && hide}
      {ids.length > 0 && (
        <button className="fold-btn" onClick={all} aria-pressed={!anyOpen} title={anyOpen ? '이 칸의 카드를 모두 이름만 남기고 접어요' : '이 칸의 카드를 모두 펼쳐요'}>
          <PaperFold folded={!anyOpen} />
          {anyOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      )}
      {side === 'left' && hide}
    </div>
  );
}

// 학종이 아이콘 (16px). 펼친 카드가 있으면 펴진 종이, 모두 접히면 종이학(세션 79, 사용자 손그림).
// 바뀔 때: 종이의 위 오른쪽 반이 대각선을 축으로 뒤집혀 접히며 작아지고, 그 자리에서 학이 커지며 나온다.
// 3D 회전은 SVG 안에서 납작해지므로 대각선에 수직인 방향으로 scale을 1 → -1로 바꿔 뒤집힘을 낸다
function PaperFold({ folded }: { folded: boolean }) {
  return (
    <svg className={'paper-fold' + (folded ? ' folded' : '')} width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <g className="pf-paper">
        <path className="pf-base" d="M2 2 L2 14 L14 14 Z" />
        <path className="pf-flap" d="M2 2 L14 2 L14 14 Z" />
        <path className="pf-crease" d="M2.6 2.6 L13.4 13.4" />
      </g>
      <g className="pf-crane">
        <path className="pc-back" d="M5.2 10.6 L1.2 3.6 L2.3 3.4 L7.2 9.6 Z M10.8 10.6 L15.2 4.4 L14.1 4.2 L8.8 9.6 Z" />
        <path className="pc-head" d="M1.2 3.6 L0.6 5.8 L2.3 3.4 Z" />
        <path className="pc-body" d="M4.6 10.2 L8 13.8 L11.4 10.2 L8 8.8 Z" />
        <path className="pc-wing" d="M6.2 9.6 L9.9 0.9 L10.4 9.5 Z" />
      </g>
    </svg>
  );
}

interface Props {
  id: string; // 접은 것을 기억할 이름
  title: ReactNode;
  extra?: ReactNode; // 제목 오른쪽 단추 (+ 추가 등). 접었을 때는 숨긴다
  defFolded?: boolean;
  className?: string;
  domId?: string;
  children?: ReactNode;
  hint?: string; // 제목 옆 ⓘ에 올리면 나오는 짧은 설명
  topic?: string; // ⓘ를 누르면 열 도움말 항목 (제목의 일부)
}

export function Card({ id, title, extra, defFolded = false, className = '', domId, children, hint, topic }: Props) {
  const folded = useFolded((s) => s[id] ?? defFolded);
  const scope = useContext(Scope);
  useEffect(() => {
    if (!scope) return;
    useMounted.setState((m) => ({ [scope]: { ...m[scope], [id]: defFolded } }));
    return () =>
      useMounted.setState((m) => {
        const c = { ...m[scope] };
        delete c[id];
        return { [scope]: c };
      });
  }, [scope, id, defFolded]);
  const toggle = () => toggleFold(id, defFolded);
  const glass = glassOf(usePrefs((p) => p.glass));
  const dark = useDark();
  // 접은 카드는 제목 길이만큼만 넓고, 펼치면 칸 폭으로 (세션 78). 폭이 바뀌면 이전 폭에서 스프링으로 늘고 준다
  const headRef = useRef<HTMLHeadingElement>(null);
  const width = useRef(0);
  const widening = useRef<Animation | null>(null);
  useEffect(() => {
    const el = headRef.current?.closest('.card') as HTMLElement | null;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!widening.current) width.current = el.getBoundingClientRect().width;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const reflow = () => {
    const el = headRef.current?.closest('.card') as HTMLElement | null;
    if (!el) return;
    const old = width.current;
    widening.current?.cancel();
    widening.current = null;
    const now = el.getBoundingClientRect().width;
    width.current = now;
    if (!old || Math.abs(old - now) < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = el.animate([{ width: old + 'px' }, { width: now + 'px' }], { duration: ms(motionToken('--dur-view', '400ms')), easing: motionToken('--ease-spring', 'ease-out') });
    widening.current = a;
    a.finished.then(
      () => {
        if (widening.current === a) widening.current = null;
      },
      () => {},
    );
  };
  // 제목 줄 어디를 눌러도 접고 편다. 제목 줄의 단추(+ 추가 등), ⓘ, 입력 칸은 빼고
  const onHead = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, .hint-i')) return;
    toggle();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    toggle();
  };
  const card = (
    <LiquidCard
      className={'sec card' + (folded ? ' folded' : '') + (className ? ' ' + className : '')}
      id={domId}
      material="glass"
      radius={14}
      style={{ padding: undefined, ['--card-blur' as string]: glass.blur, ['--card-shadow' as string]: glass.shadow }}
      tint={folded ? glass.folded : glass.base}
      intensity={glass.intensity}
    >
      <h3 ref={headRef} className="card-head" onClick={onHead} title={folded ? '눌러서 펼쳐요' : undefined}>
        <span className="card-title" role="button" tabIndex={0} aria-expanded={!folded} onKeyDown={onKey}>
          {title}
          {hint && <Hint text={hint} topic={topic} />}
        </span>
        {!folded && extra && <span className="card-acts">{extra}</span>}
      </h3>
      <FoldBody open={!folded} onShown={reflow}>
        {children}
      </FoldBody>
    </LiquidCard>
  );
  if (!BEAM.has(id)) return card;
  // 사용 중 빛 (세션 90, border-beam): 카드 둘레를 도는 빛 띠. 색은 예전처럼 분홍·보라 쪽(candy). light 테마는 밝은 카드에서 더 흐려서 늘 dark 테마로 그린다.
  // border-beam은 어두운 카드에 맞춰져 있어 밝은 유리 카드 위에서는 거의 안 보인다 → 세기(--beam-strength, 보통 0~1)를 밝은 화면에서 더 올린다
  const inUse = /(^|\s)in-use(\s|$)/.test(className);
  return (
    <BorderBeam className="card-beam" size="md" colorVariant="candy" theme="dark" duration={4} borderRadius={14} active={inUse && !folded} css={beamCss(dark)}>
      {card}
    </BorderBeam>
  );
}

const beamCss = (dark: boolean) => `[data-beam="{id}"] { --beam-strength: ${dark ? 1.4 : 3} !important; }`;

// 펼친 카드의 내용. 펼칠 때 높이가 스프링으로 늘고, 안의 줄들이 제목 쪽에서 작고 흐리게 시작해 30ms씩 늦게 제자리로(아이폰 폴더 열기).
// 접을 때는 아래 줄부터 거꾸로 작아지며 제목 안으로 들어간 뒤 빠진다. 애니메이션 줄이기면 짧은 페이드만.
// 움직이는 동안에도 다시 누를 수 있다(하던 움직임을 멈추고 지금 자리에서 반대로)
const MAX_STAGGER = 10; // 이보다 아래 줄은 같이 움직임 (긴 목록이 늦게 끝나지 않게)
export function motionToken(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
export function ms(v: string) {
  const n = parseFloat(v);
  return v.endsWith('ms') ? n : n * 1000;
}

function FoldBody({ open, children, onShown }: { open: boolean; children?: ReactNode; onShown?: () => void }) {
  const [shown, setShown] = useState(open);
  const first = useRef(true);
  // 내용이 생기거나 빠진 바로 뒤 (카드 폭 맞추기)
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onShown?.();
  }, [shown]);
  const ref = useRef<HTMLDivElement | null>(null);
  const anims = useRef<Animation[]>([]);
  const moved = useRef(false); // 처음 그릴 때는 움직이지 않음
  const stop = () => {
    for (const a of anims.current) a.cancel();
    anims.current = [];
  };

  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    if (open) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return setShown(false);
    stop();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = ms(motionToken('--dur-pop', '250ms'));
    const easeIn = motionToken('--ease-in', 'ease-in');
    let last: Animation;
    if (reduce) {
      last = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: easeIn, fill: 'forwards' });
      anims.current.push(last);
    } else {
      const kids = [...el.children] as HTMLElement[];
      const n = Math.min(kids.length, MAX_STAGGER);
      kids.forEach((k, i) => {
        const d = Math.max(0, n - 1 - Math.min(i, n - 1)) * 18;
        anims.current.push(
          k.animate([{}, { opacity: 0, scale: '0.6', translate: '0 -14px', filter: 'blur(6px)' }], { duration: dur, delay: d, easing: easeIn, fill: 'forwards' }),
        );
      });
      el.style.overflow = 'clip';
      last = el.animate([{ height: el.offsetHeight + 'px' }, { height: '0px' }], { duration: dur + (n - 1) * 18, easing: easeIn, fill: 'forwards' });
      anims.current.push(last);
    }
    last.finished.then(
      () => setShown(false),
      () => {}, // 도중에 다시 펼침
    );
  }, [open]);

  // 펼쳐서 내용이 막 그려졌을 때 (접는 도중에 다시 펼쳤을 때도)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !shown || !el || !moved.current) return;
    const from = anims.current.length ? el.offsetHeight : 0;
    stop();
    if (from === 0 && el.dataset.fresh !== '1') return; // 처음 그린 카드
    el.dataset.fresh = '';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      anims.current.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: motionToken('--ease-out', 'ease-out') }));
      return;
    }
    const dur = ms(motionToken('--dur-view', '400ms'));
    const spring = motionToken('--ease-spring', 'ease-out');
    const kids = [...el.children] as HTMLElement[];
    kids.forEach((k, i) => {
      anims.current.push(
        k.animate([{ opacity: 0, scale: '0.6', translate: '0 -14px', filter: 'blur(6px)' }, { opacity: 1, scale: '1', translate: '0 0', filter: 'blur(0px)' }], {
          duration: dur,
          delay: Math.min(i, MAX_STAGGER - 1) * 30,
          easing: spring,
          fill: 'backwards',
        }),
      );
    });
    el.style.overflow = 'clip';
    const h = el.scrollHeight;
    const a = el.animate([{ height: from + 'px' }, { height: h + 'px' }], { duration: dur, easing: spring });
    anims.current.push(a);
    a.finished.then(
      () => {
        el.style.overflow = '';
        anims.current = [];
      },
      () => {},
    );
  }, [open, shown]);

  if (!shown) return null;
  return (
    <div className="card-body" ref={(el) => {
      // 접힌 채로 그려졌다가 펼쳐질 때만 움직이게 표시
      if (el && !ref.current && moved.current) el.dataset.fresh = '1';
      ref.current = el;
    }}>
      {children}
    </div>
  );
}
