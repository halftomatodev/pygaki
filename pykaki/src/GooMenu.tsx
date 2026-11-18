// 끈적 드롭다운 (docs/MOTION.md 3장). 메뉴 판 안에 <GooMenu anchor ready />를 넣으면
// 판의 배경을 뒤 액체 층에 따로 그려, 단추에서 녹아 나와 커지고 목이 끊어져 떨어진다.
// 닫힐 때(판이 사라질 때)는 판을 복제해 두고 단추로 빨려 들어가게 한다.
// 액체 층: 흐림 + 알파 문턱 SVG 필터. 자리를 잡으면 흐림을 0으로 줄여 목을 완전히 끊고 필터를 끈다.
import { useLayoutEffect, useRef } from 'react';

const SPRING = 'linear(0, 0.102 4%, 0.322 8%, 0.564 12%, 0.775 16%, 0.929 20%, 1.041 25%, 1.081 30%, 1.078 35%, 1.056 40%, 1.026 46%, 1.003 53%, 0.994 60%, 0.995 70%, 0.999 80%, 1 90%, 1)';
const OUT = 'cubic-bezier(0.2, 0, 0, 1)';
const SUCK = 'cubic-bezier(0.5, 0, 0.75, 0)';
const BLUR = 6;
const SVG = 'http://www.w3.org/2000/svg';
let seq = 0;
const painted = new WeakMap<HTMLElement, number>(); // 단추를 칠한 메뉴 수 (닫히는 중에 다시 열 때)

type Box = { left: number; top: number; width: number; height: number };
const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
const place = (el: HTMLElement, b: Box, radius?: number) => {
  Object.assign(el.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });
  if (radius !== undefined) el.style.borderRadius = radius + 'px';
};
const frame = (b: Box) => ({ left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Goo = { close: () => void };

function start(panel: HTMLElement, anchor: HTMLElement): Goo {
  if (reduced()) {
    // 애니메이션 줄이기: 판은 제 배경 그대로 짧은 페이드 (여는 쪽은 CSS가 함)
    return {
      close() {
        const c = ghost(panel);
        c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: OUT, fill: 'forwards' }).finished.then(() => c.remove(), () => c.remove());
      },
    };
  }

  const cs = getComputedStyle(panel);
  const fill = cs.backgroundColor;
  const radius = parseFloat(cs.borderTopLeftRadius) || 10;
  const z = (parseInt(cs.zIndex) || 100) - 1;
  const a = boxOf(anchor);
  const aRadius = Math.min(a.height / 2, 10);
  const to = boxOf(panel);
  const up = to.top + to.height / 2 < a.top + a.height / 2;
  const sw = a.width * 0.6, sh = Math.min(a.height * 0.6, 18);
  const seed: Box = { left: a.left + (a.width - sw) / 2, top: up ? a.top + 2 : a.top + a.height - sh - 2, width: sw, height: sh };

  // 단추를 판과 같은 색 알약으로 칠한다 (메뉴가 단추에서 나온 것처럼)
  painted.set(anchor, (painted.get(anchor) ?? 0) + 1);
  anchor.style.setProperty('--goo-fill', fill);
  anchor.style.setProperty('--goo-r', aRadius + 'px');
  anchor.classList.add('goo-anchor');

  // 액체 층: 단추 자리는 구멍(진짜 단추가 보이게), 나머지에 단추 모양 + 판 모양
  const id = 'pk-goo-menu-' + ++seq;
  const liq = document.createElement('div');
  liq.className = 'goo-liq';
  liq.style.zIndex = String(z);
  Object.assign(liq.style, {
    maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
    maskSize: `100% 100%, ${a.width}px ${a.height}px`,
    maskPosition: `0 0, ${a.left}px ${a.top}px`,
    maskRepeat: 'no-repeat',
    maskComposite: 'exclude',
  });
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.innerHTML = `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${BLUR}" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>`;
  const blur = svg.querySelector('feGaussianBlur')!;
  const goo = document.createElement('div');
  goo.className = 'goo-in';
  goo.style.filter = `url(#${id})`;
  const bBtn = document.createElement('div');
  const bPanel = document.createElement('div');
  bBtn.className = bPanel.className = 'goo-blob';
  bBtn.style.background = bPanel.style.background = fill;
  place(bBtn, a, aRadius);
  place(bPanel, to, radius);
  goo.append(bBtn, bPanel);
  liq.append(svg, goo);
  document.body.append(liq);
  panel.classList.add('goo-panel');

  let anims: Animation[] = [];
  let raf = 0;
  const setBlur = (v: number) => {
    blur.setAttribute('stdDeviation', String(v));
    goo.style.filter = v > 0.05 ? `url(#${id})` : 'none';
  };
  // 흐림을 줄여 목을 끊는다
  const unblur = (delay: number, dur: number) => {
    cancelAnimationFrame(raf);
    const t0 = performance.now() + delay;
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      setBlur(BLUR * (1 - p * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  // 열기
  anims.push(bPanel.animate([{ top: seed.top + 'px', height: seed.height + 'px' }, { top: to.top + 'px', height: to.height + 'px' }], { duration: 440, easing: SPRING }));
  anims.push(bPanel.animate([{ left: seed.left + 'px', width: seed.width + 'px' }, { left: to.left + 'px', width: to.width + 'px' }], { duration: 440, delay: 30, easing: SPRING, fill: 'backwards' }));
  anims.push(panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 230, easing: OUT, fill: 'backwards' }));
  unblur(300, 140);

  // 열린 동안 판 크기·자리가 바뀌면 (찾기로 목록이 줄 때 등) 판 모양도 따라감
  const ro = new ResizeObserver(() => {
    if (anims.some((x) => x.playState === 'running')) return;
    place(bPanel, boxOf(panel));
  });
  ro.observe(panel);
  Promise.all(anims.map((x) => x.finished)).then(() => place(bPanel, boxOf(panel)), () => {});

  return {
    close() {
      ro.disconnect();
      const from = boxOf(bPanel);
      const ghostPanel = ghost(panel);
      anims.forEach((x) => x.cancel());
      anims = [];
      cancelAnimationFrame(raf);
      setBlur(BLUR);
      place(bPanel, seed);
      ghostPanel.animate([{ opacity: getComputedStyle(panel).opacity }, { opacity: 0 }], { duration: 80, easing: SUCK, fill: 'forwards' });
      const suck = bPanel.animate([frame(from), frame(seed)], { duration: 300, delay: 40, easing: SUCK, fill: 'backwards' });
      const end = () => {
        cancelAnimationFrame(raf);
        liq.remove();
        ghostPanel.remove();
        const n = (painted.get(anchor) ?? 1) - 1;
        painted.set(anchor, n);
        if (n <= 0) anchor.classList.remove('goo-anchor');
      };
      suck.finished.then(end, end);
    },
  };
}

// 사라지는 판의 복제 (React가 진짜 판을 빼도 닫히는 동안 보이게)
function ghost(panel: HTMLElement) {
  const b = boxOf(panel);
  const c = panel.cloneNode(true) as HTMLElement;
  c.removeAttribute('id');
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, { position: 'fixed', left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', margin: '0', transform: 'none', pointerEvents: 'none', animation: 'none' });
  document.body.append(c);
  return c;
}

// 메뉴 판 안 맨 앞에 둔다. ready: 판 자리가 정해졌을 때 true
export function GooMenu({ anchor, ready }: { anchor: HTMLElement | null | undefined; ready: boolean }) {
  const mark = useRef<HTMLSpanElement>(null);
  const goo = useRef<Goo | null>(null);
  useLayoutEffect(() => {
    const panel = mark.current?.parentElement;
    if (goo.current || !ready || !panel || !anchor) return;
    goo.current = start(panel, anchor);
  });
  useLayoutEffect(
    () => () => {
      goo.current?.close();
      goo.current = null;
    },
    [],
  );
  return <span ref={mark} hidden />;
}
