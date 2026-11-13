// 갤러리 카드의 멈춘 미리보기 그림. 카드마다 WebGL을 켜면 브라우저가 몇 개(16쯤)만 허락해서,
// 그리는 판 하나(종류마다 하나)로 차례대로 한 장씩 그리고 그림(data URL)으로 바꿔 둔다. 움직이는 샘플은 마우스를 올린 카드 하나만.
import { useEffect, useState } from 'react';
import type { ShaderInfo } from '../shader';
import type { ShaderEffect } from './textShaders';
import { ScreenFxRenderer, screenFxValues } from './ScreenFxCanvas';
import { TransitionRenderer, transitionValues, type Picture } from './TransitionCanvas';

export const THUMB_WIDTH = 400;

let screenR: InstanceType<typeof ScreenFxRenderer> | null = null;
let transR: InstanceType<typeof TransitionRenderer> | null = null;
const fresh = <T extends { gl: WebGLRenderingContext }>(r: T | null, make: (c: HTMLCanvasElement) => T) =>
  r && !r.gl.isContextLost() ? r : make(document.createElement('canvas'));

// 그린 판을 곧바로 그림으로 (같은 차례 안이라 preserveDrawingBuffer 없이도 읽힘)
const grab = (c: HTMLCanvasElement) => c.toDataURL('image/jpeg', 0.85);

// 화면 셰이더를 그림에 씌운 한 장 (time초 때)
export function shaderThumb(info: ShaderInfo, args: Record<string, unknown>, picture: Picture, size: [number, number], time = 1.2) {
  screenR = fresh(screenR, (c) => new ScreenFxRenderer(c));
  const c = screenR.canvas;
  c.width = (picture as HTMLCanvasElement).width;
  c.height = (picture as HTMLCanvasElement).height;
  screenR.setShader(info);
  screenR.setPicture(picture);
  screenR.draw(time, size, screenFxValues(info, args, size));
  return grab(c);
}

// 작게 줄인 픽셀 (어느 순간이 효과를 잘 보여 주는지 고를 때)
const SMALL = [32, 18] as const;
let smallCtx: CanvasRenderingContext2D | null = null;
function small(src: CanvasImageSource) {
  if (!smallCtx) {
    const s = document.createElement('canvas');
    [s.width, s.height] = SMALL;
    smallCtx = s.getContext('2d', { willReadFrequently: true })!;
  }
  smallCtx.clearRect(0, 0, SMALL[0], SMALL[1]);
  smallCtx.drawImage(src, 0, 0, SMALL[0], SMALL[1]);
  return smallCtx.getImageData(0, 0, SMALL[0], SMALL[1]).data;
}
const diff = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
  let d = 0;
  for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  return d / (a.length / 4);
};
// 한 장 안에서 밝기가 얼마나 고른지 (온통 한 색이면 0)
const spread = (a: Uint8ClampedArray) => {
  let s = 0;
  let s2 = 0;
  const n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    const y = (a[i] + a[i + 1] + a[i + 2]) / 3;
    s += y;
    s2 += y * y;
  }
  return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
};

// 그림 효과가 지나는 중의 한 장: 앞 그림과도 새 그림과도 가장 다르고, 온통 한 색이 아닌 순간을 고른다
export function transitionThumb(effect: ShaderEffect, args: Record<string, string>, old: Picture, next: Picture, size: [number, number]) {
  transR = fresh(transR, (c) => new TransitionRenderer(c));
  const r = transR;
  const c = r.canvas;
  c.width = (old as HTMLCanvasElement).width;
  c.height = (old as HTMLCanvasElement).height;
  r.setEffect(effect);
  r.setPicture(0, old);
  r.setPicture(1, next);
  const values = transitionValues(effect, args);
  const [a, b] = [small(old as CanvasImageSource), small(next as CanvasImageSource)];
  let best = 0.5;
  let score = -1;
  for (const t of [0.2, 0.35, 0.5, 0.65, 0.8]) {
    r.draw(t, size, values);
    const s = small(c);
    const v = Math.min(diff(s, a), diff(s, b)) * Math.min(1, spread(s) / 20);
    if (v > score + 1) (score = v), (best = t);
  }
  r.draw(best, size, values);
  return grab(c);
}

// 한 박자에 한 장씩 (셰이더를 처음 맞추는 데 시간이 걸려서 한꺼번에 하면 화면이 멈춤)
type Job = { key: string; make: () => string; done: (v: string | Error) => void };
const queue: Job[] = [];
const cache = new Map<string, string | Error>();
let running = false;
function pump() {
  if (running) return;
  running = true;
  const step = () => {
    const job = queue.shift();
    if (!job) return void (running = false);
    let v: string | Error;
    if (cache.has(job.key)) v = cache.get(job.key)!;
    else {
      try {
        v = job.make();
      } catch (e: any) {
        v = new Error(String(e?.message ?? e).split('\n')[0]);
      }
      if (cache.size > 300) cache.clear();
      cache.set(job.key, v);
    }
    job.done(v);
    setTimeout(step, 30); // requestAnimationFrame은 창이 안 보일 때 멈춰서 쓰지 않음
  };
  step();
}

// key가 같으면 다시 그리지 않는다. make가 null이면 그리지 않음
export function useThumb(key: string, make: (() => string) | null): string | Error | null {
  const [v, setV] = useState<string | Error | null>(() => cache.get(key) ?? null);
  useEffect(() => {
    if (!make) return setV(null);
    const hit = cache.get(key);
    if (hit) return setV(hit);
    setV(null);
    let live = true;
    const job: Job = { key, make, done: (x) => live && setV(x) };
    queue.push(job);
    pump();
    return () => {
      live = false;
      const i = queue.indexOf(job);
      if (i >= 0) queue.splice(i, 1);
    };
    // make는 key가 바뀔 때만 다시 씀
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, !!make]);
  return v;
}
