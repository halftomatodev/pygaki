// 상자 둘레의 세 메뉴(줄 종류 고르기, 글자 스타일, 다음 흐름)가 같이 쓰는 모양 (세션 93, 사용자 손그림).
// - 유리 덩어리: 끈적한 덩어리(liquid-gooey)를 카드처럼 반투명 유리로. 바탕은 [카드 투명도]의 `--glass-tint`,
//   테두리 빛(위쪽 밝은 띠, 얇은 흰 테)은 합쳐진 모양을 따라 그린다(inset 그림자). 칸 하나하나는 뒤를 흐린다(.gg-blob)
// - 호 배치: 메뉴의 칸([data-arc])을 상자 가운데를 둘러싼 타원을 따라 옆으로 밀어, 세 메뉴를 다 펴면 상자를 둥글게 감싼다.
//   상자 가운데 높이에 가까운 칸일수록 바깥으로 나가고, 위아래 끝 칸은 상자 쪽에 붙는다. 칸 너비는 같게 둬서 바깥 끝도 같은 호가 된다
// - 펼치기: 바탕이 접힌 방울 자리에서 끈적하게 부풀어 나와 제자리로 간다(useReveal, GlassOne)
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Liquid } from 'liquid-gooey';

export const GLASS_GOO = {
  blur: 7,
  contrast: 20,
  // 세션 94 사용자: 거의 투명해서 안 보이는 유리 바탕은 아예 없앤다(세 버블 모두). 칸과 글만 상자 둘레에 떠 있다.
  // 예전 값(세션 93): fill `color-mix(in srgb, var(--panel) 16%, transparent)`, 둘레 그림자와 inset 테두리 빛
  fill: 'transparent',
  shadow: 'none',
};

const BULGE = 64; // 상자 가운데 높이의 칸이 위아래 끝 칸보다 바깥으로 나가는 거리(px)
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 칸 이름(data-arc 값)마다
export interface Arc {
  x: Record<string, number>; // 옆으로 밀 거리 (root 안 px. 오른쪽 메뉴는 +, 왼쪽 메뉴는 -)
  mid: Record<string, number>; // 가운데 높이 (root 안 px)
  order: string[]; // 위에서부터 차례 (흘러나오는 순서)
  h: number; // root 높이
  w: number; // root 너비
  sig: string;
}

// root 안 [data-arc] 칸들의 호 배치. box: 감쌀 상자(없으면 밀지 않음)
export const NO_ARC: Arc = { x: {}, mid: {}, order: [], h: 0, w: 0, sig: '' };

export function useArc(root: React.RefObject<HTMLElement>, box: () => HTMLElement | null, side: 'left' | 'right'): Arc {
  const [arc, setArc] = useState<Arc>(NO_ARC);
  const measure = () => {
    const r = root.current;
    if (!r) return;
    const rows = [...r.querySelectorAll<HTMLElement>('[data-arc]')];
    // 칸은 Liquid.Item 껍데기 안에 있고, 껍데기는 x·y를 transform으로 움직인다. 화면 자리(getBoundingClientRect)를 재면
    // 움직이는 값이 다시 잰 값을 바꿔 끝없이 돈다 → 형제 껍데기끼리의 offsetTop(변형을 안 탐)으로 잰다
    const rr = r.getBoundingClientRect();
    const z = rr.height / (r.offsetHeight || 1) || 1; // 캔버스 확대 배율 (화면 px → root 안 px)
    // 칸은 유리 바탕 한 장(.gg-one) 안의 줄이고, 바탕은 펼칠 때 transform으로 움직인다. 화면 자리(getBoundingClientRect)를
    // 움직이는 것에서 재면 잰 값이 다시 자리를 바꿔 끝없이 돈다 → 줄끼리의 offsetTop(변형을 안 탐)과 움직이지 않는 틀(바탕 껍데기의 부모)로 잰다
    const one = rows[0]?.parentElement;
    const frame = one?.parentElement?.parentElement;
    const base = frame ? (frame.getBoundingClientRect().top - rr.top) / z : 0;
    const top0 = one?.offsetTop ?? 0;
    const mid = rows.map((e) => Math.round(base + e.offsetTop - top0 + e.offsetHeight / 2));
    const b = box();
    let x = rows.map(() => 0);
    if (b && rows.length) {
      const br = b.getBoundingClientRect();
      const cy = (br.top + br.height / 2 - rr.top) / z; // 상자 가운데 높이 (root 안 px)
      const R = Math.max(br.height / z / 2, ...mid.map((m) => Math.abs(m - cy))) + 36;
      const raw = mid.map((m) => BULGE * Math.sqrt(Math.max(0, 1 - ((m - cy) / R) ** 2)));
      const lo = Math.min(...raw);
      x = raw.map((v) => Math.round((v - lo) * (side === 'left' ? -1 : 1)));
    }
    const order = rows.map((e) => e.dataset.arc ?? '');
    const h = r.offsetHeight;
    const w = r.offsetWidth;
    const sig = order.join() + '|' + x.join() + '|' + mid.map(Math.round).join() + '|' + h + '|' + w;
    const of = (v: number[]) => Object.fromEntries(order.map((k, i) => [k, v[i]]));
    setArc((o) => (o.sig === sig ? o : { x: of(x), mid: of(mid), order, h, w, sig }));
  };
  // 그린 다음 프레임에 잰다(그리는 도중에 바로 다시 그리게 하면 끈적 라이브러리의 자리 재기와 겹쳐 끝없이 돌았다)
  useLayoutEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  });
  // 글꼴이 늦게 오는 등 다시 그리지 않고 크기가 바뀔 때. root 요소가 바뀌면(접힘 ↔ 펼침) 새 요소를 지켜본다
  const watched = useRef<{ el: HTMLElement; ro: ResizeObserver } | null>(null);
  useEffect(() => {
    const r = root.current;
    if (watched.current?.el === r) return;
    watched.current?.ro.disconnect();
    watched.current = null;
    if (!r) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(r);
    watched.current = { el: r, ro };
  });
  useEffect(() => () => watched.current?.ro.disconnect(), []);
  return arc;
}

// 펼치기: on이 켜진 첫 그림에서는 접힌 방울 자리에 모여 있다가 다음 그림에서 흘러나온다. 움직임 줄이기면 바로 제자리
export function useReveal(on = true) {
  const [out, setOut] = useState(false);
  useLayoutEffect(() => {
    if (!on) return setOut(false);
    if (reduced()) return setOut(true);
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setOut(true))));
    return () => cancelAnimationFrame(id);
  }, [on]);
  return out;
}

// 줄 k를 호 자리로 옆으로 미는 style (바탕은 그대로, 글 줄만 움직인다)
export function arcRow(arc: Arc, k: string): React.CSSProperties {
  const x = arc.x[k] ?? 0;
  return x ? { transform: `translateX(${x}px)` } : {};
}

// 메뉴 하나 = 줄들을 묶는 틀 한 장(세션 93 사용자: 줄마다 바탕을 두면 우둘투둘해서 하나만. 세션 94부터 바탕은 안 칠함).
// 줄들은 이 안에서 호를 따라 엇갈리고, 바탕은 가장 멀리 나간 줄만큼 그쪽으로 넓어진다.
// from: 접힌 방울이 있는 모서리(왼쪽 아래 'bl', 왼쪽 위 'tl'). 펼칠 때 바탕이 거기서 작게 시작해 끈적하게 부풀어 나온다.
// home: 방울 자리를 직접 준다(바탕 가운데에서 잰 거리)
export function GlassOne({ arc, out, side, from, home, className = '', children }: { arc: Arc; out: boolean; side: 'left' | 'right'; from?: 'bl' | 'tl'; home?: { x: number; y: number } | null; className?: string; children: React.ReactNode }) {
  const pad = Math.max(0, ...Object.values(arc.x).map(Math.abs));
  const W = arc.w, H = arc.h;
  const start = home ?? (from && W ? { x: 11 - W / 2, y: from === 'bl' ? H / 2 - 11 : 11 - H / 2 } : null);
  const p = out || !start ? { x: 0, y: 0, scale: 1, transition: 'bouncy' as const } : { x: start.x, y: start.y, scale: 0.25, transition: { duration: 0 } };
  return (
    <Liquid.Item {...p}>
      <div className={'gg-one ' + className} style={{ ['--arc-pad' as string]: pad + 'px', ['--arc-side' as string]: side }} data-side={side}>
        {children}
      </div>
    </Liquid.Item>
  );
}
