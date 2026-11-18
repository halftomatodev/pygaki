// 투명 영상 만들기: 투명 webm, PNG 연속 그림, 움직이는 GIF·WebP·PNG, 초록 화면 영상 →
// 렌파이가 바로 쓰는 "왼쪽 색 + 오른쪽 투명도(흑백)" webm (렌파이 Movie(side_mask=True), 플러그인은 mask_ 이름이면 저절로).
// 렌파이(8.6.1까지)는 알파가 든 webm을 그대로 못 틀어서 이 꼴로 바꿔야 한다.
// 앱 안의 Chromium으로 다 한다: <video>·ImageDecoder로 프레임을 읽고 → 캔버스에서 두 쪽을 그리고 →
// WebCodecs VideoEncoder(VP9)로 굽고 → webm.ts로 묶는다. ffmpeg나 다른 프로그램은 쓰지 않는다.
import { muxWebm, type Chunk } from './webm';

export interface FrameFile {
  name: string;
  load: () => Promise<Blob>;
}

export type Source =
  | { kind: 'video'; name: string; blob: Blob } // 영상 하나 (투명 webm이나 초록 화면 영상)
  | { kind: 'frames'; name: string; files: FrameFile[] } // 그림 여러 장 (이름 순서)
  | { kind: 'anim'; name: string; blob: Blob; type: string }; // 움직이는 GIF·WebP·PNG

export interface Look {
  mode: 'alpha' | 'key'; // 투명도 그대로 | 색 빼기 (초록 화면)
  key: [number, number, number]; // 뺄 색
  tol: number; // 0~1: 이만큼 가까운 색은 다 뺌
  soft: number; // 0~1: 가장자리를 부드럽게 넘기는 폭
  despill: boolean; // 가장자리에 묻은 초록(뺀 색) 걷어 내기
  height: number; // 결과 높이 (0이면 원본)
  fps: number; // 그림 연속의 1초 장 수 (영상은 원본 값으로 채워 둠)
}

export interface Opened {
  name: string;
  width: number;
  height: number;
  fps: number; // 영상은 잰 값, 그림 연속은 Look.fps를 따름, 움직이는 그림은 평균
  count: number; // 원본 장 수 (영상은 잰 fps로 셈. 다른 fps로 뽑을 때는 countAt)
  durationMs?: number; // 영상 길이: 영상은 어느 fps로든 때를 골라 뽑을 수 있다
  hasAlpha: boolean; // 원본에 투명한 곳이 있는지 (없으면 색 빼기를 권함)
  edgeColor: [number, number, number] | null; // 가장자리에 고르게 깔린 색 (초록 화면이면 그 색)
  // i번째 프레임을 ctx에 w×h로 그림. 돌려주는 값은 그 프레임의 때와 길이 (밀리초)
  draw(i: number, ctx: CanvasRenderingContext2D, w: number, h: number, fps: number): Promise<{ ms: number; dur: number }>;
  close(): void;
}

export class MaskError extends Error {}

// ── 원본 열기 ──

const waitEvent = (t: EventTarget, ok: string, ms = 15000) =>
  new Promise<void>((res, rej) => {
    const timer = setTimeout(() => (done(), rej(new MaskError('영상을 읽는 데 너무 오래 걸려요'))), ms);
    const done = () => (clearTimeout(timer), t.removeEventListener(ok, good), t.removeEventListener('error', bad));
    const good = () => (done(), res());
    const bad = () => (done(), rej(new MaskError('이 영상은 앱이 읽지 못해요. webm(VP8·VP9)이나 mp4(H.264)로 바꾸거나, PNG 연속 그림으로 뽑아 주세요')));
    t.addEventListener(ok, good);
    t.addEventListener('error', bad);
  });

// 재생하며 프레임 사이 간격을 재서 1초 장 수를 어림한다 (못 재면 30)
async function measureFps(v: HTMLVideoElement): Promise<number> {
  if (!('requestVideoFrameCallback' in v)) return 30;
  const times: number[] = [];
  await new Promise<void>((res) => {
    const stop = setTimeout(res, 1500);
    const on = (_now: number, m: { mediaTime: number }) => {
      times.push(m.mediaTime);
      if (times.length >= 14) return clearTimeout(stop), res();
      (v as any).requestVideoFrameCallback(on);
    };
    (v as any).requestVideoFrameCallback(on);
    v.play().catch(() => (clearTimeout(stop), res()));
  });
  v.pause();
  const d = times
    .slice(1)
    .map((t, i) => t - times[i])
    .filter((x) => x > 0.001)
    .sort((a, b) => a - b);
  if (!d.length) return 30;
  const fps = 1 / d[0]; // 건너뛴 프레임이 있어도 가장 짧은 간격이 한 프레임
  for (const f of [12, 15, 24, 25, 30, 50, 60]) if (Math.abs(fps - f) < f * 0.04) return f;
  return Math.max(1, Math.min(60, Math.round(fps)));
}

async function openVideo(src: Extract<Source, { kind: 'video' }>): Promise<Opened> {
  const url = URL.createObjectURL(src.blob);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    await waitEvent(v, 'loadeddata');
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
  if (!v.videoWidth || !isFinite(v.duration) || v.duration <= 0) {
    URL.revokeObjectURL(url);
    throw new MaskError('영상 크기나 길이를 읽지 못했어요');
  }
  const fps = await measureFps(v);
  const seek = async (t: number) => {
    if (Math.abs(v.currentTime - t) < 1e-4) return;
    v.currentTime = t;
    await waitEvent(v, 'seeked');
  };
  const op: Opened = {
    name: src.name,
    width: v.videoWidth,
    height: v.videoHeight,
    fps,
    count: Math.max(1, Math.round(v.duration * fps)),
    durationMs: v.duration * 1000,
    hasAlpha: false,
    edgeColor: null,
    async draw(i, ctx, w, h, f) {
      // 프레임 가운데 때로 가야 앞 프레임이 잡히지 않는다
      await seek(Math.min(v.duration - 0.001, (i + 0.5) / f));
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(v, 0, 0, w, h);
      return { ms: (i * 1000) / f, dur: 1000 / f };
    },
    close() {
      v.removeAttribute('src');
      v.load();
      URL.revokeObjectURL(url);
    },
  };
  await probe(op);
  return op;
}

async function openFrames(src: Extract<Source, { kind: 'frames' }>, fps: number): Promise<Opened> {
  let cache: { i: number; bmp: ImageBitmap } | null = null;
  const bitmap = async (i: number) => {
    if (cache?.i === i) return cache.bmp;
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(await src.files[i].load());
    } catch {
      throw new MaskError(`그림을 읽지 못했어요: ${src.files[i].name}`);
    }
    cache?.bmp.close();
    cache = { i, bmp };
    return bmp;
  };
  const first = await bitmap(0);
  const op: Opened = {
    name: src.name,
    width: first.width,
    height: first.height,
    fps,
    count: src.files.length,
    hasAlpha: false,
    edgeColor: null,
    async draw(i, ctx, w, h, f) {
      const bmp = await bitmap(i);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
      return { ms: (i * 1000) / f, dur: 1000 / f };
    },
    close() {
      cache?.bmp.close();
      cache = null;
    },
  };
  await probe(op);
  return op;
}

async function openAnim(src: Extract<Source, { kind: 'anim' }>): Promise<Opened> {
  const ID = (window as any).ImageDecoder;
  if (!ID) throw new MaskError('이 앱에서는 움직이는 그림을 읽지 못해요');
  let dec: any;
  try {
    dec = new ID({ data: await src.blob.arrayBuffer(), type: src.type });
    await dec.tracks.ready;
    await dec.completed;
  } catch {
    throw new MaskError('움직이는 그림을 읽지 못했어요');
  }
  const track = dec.tracks.selectedTrack;
  const count = track?.frameCount ?? 1;
  if (count < 2) {
    dec.close();
    throw new MaskError('움직이지 않는 그림이에요. 그림 한 장은 PNG 그대로 쓰면 돼요');
  }
  const first = (await dec.decode({ frameIndex: 0 })).image as VideoFrame;
  const width = first.displayWidth;
  const height = first.displayHeight;
  first.close();
  let at = 0; // 다음 프레임의 때 (GIF는 timestamp가 없을 수 있어 길이를 더해 감)
  const op: Opened = {
    name: src.name,
    width,
    height,
    fps: 30,
    count,
    hasAlpha: false,
    edgeColor: null,
    async draw(i, ctx, w, h) {
      if (i === 0) at = 0;
      const f = (await dec.decode({ frameIndex: i })).image as VideoFrame;
      const dur = f.duration ? f.duration / 1000 : 100;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(f, 0, 0, w, h);
      f.close();
      const ms = at;
      at += Math.max(10, dur);
      return { ms, dur: Math.max(10, dur) };
    },
    close() {
      dec.close();
    },
  };
  await probe(op);
  return op;
}

// 처음·가운데·끝 프레임을 작게 그려 보고: 투명한 곳이 있는지, 가장자리에 고른 색(초록 화면)이 깔렸는지
async function probe(op: Opened) {
  const w = Math.max(2, Math.min(160, op.width));
  const h = Math.max(2, Math.round((op.height * w) / op.width));
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true }) as unknown as CanvasRenderingContext2D;
  const edge: number[][] = [];
  for (const i of [...new Set([0, Math.floor(op.count / 2), op.count - 1])]) {
    await op.draw(i, ctx, w, h, op.fps);
    const d = ctx.getImageData(0, 0, w, h).data;
    for (let p = 3; p < d.length; p += 4) if (d[p] < 250) op.hasAlpha = true;
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) edge.push(Array.from(d.slice((y * w + x) * 4, (y * w + x) * 4 + 4)));
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) edge.push(Array.from(d.slice((y * w + x) * 4, (y * w + x) * 4 + 4)));
  }
  // 가장자리 색의 가운데 값. 맑고 진한 색이 대부분이면 그 색을 뺄 색으로 권한다
  const solid = edge.filter((p) => p[3] > 250);
  if (solid.length < edge.length * 0.6) return;
  const med = [0, 1, 2].map((k) => solid.map((p) => p[k]).sort((a, b) => a - b)[solid.length >> 1]) as [number, number, number];
  const near = solid.filter((p) => Math.abs(p[0] - med[0]) + Math.abs(p[1] - med[1]) + Math.abs(p[2] - med[2]) < 90).length;
  if (Math.max(...med) - Math.min(...med) > 60 && near > solid.length * 0.6) op.edgeColor = med;
}

const ANIM_TYPES: Record<string, string> = { gif: 'image/gif', webp: 'image/webp', png: 'image/png', apng: 'image/apng', avif: 'image/avif' };
export const extOf = (name: string) => (name.match(/\.([^.\\/]+)$/)?.[1] ?? '').toLowerCase();
export const isVideoName = (n: string) => /^(webm|mp4|m4v|mkv|ogv|mov)$/.test(extOf(n));
export const isImageName = (n: string) => !!ANIM_TYPES[extOf(n)] || /^(jpe?g|bmp)$/.test(extOf(n));
export const animType = (n: string) => ANIM_TYPES[extOf(n)];

// fps로 뽑을 때의 장 수 (영상만 달라짐)
export const countAt = (op: Opened, fps: number) => (op.durationMs ? Math.max(1, Math.round((op.durationMs / 1000) * fps)) : op.count);

export async function openSource(src: Source, fps: number): Promise<Opened> {
  if (src.kind === 'video') return openVideo(src);
  if (src.kind === 'frames') return openFrames(src, fps);
  return openAnim(src);
}

// 그림 이름을 사람이 보는 순서로 (frame2 < frame10)
export const naturalSort = <T extends { name: string }>(a: T[]) => [...a].sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true, sensitivity: 'base' }));

// ── 프레임 꾸미기 ──

export interface Canvases {
  w: number; // 결과 한쪽 크기
  h: number;
  src: OffscreenCanvas; // w×h: 원본을 그린 곳 (색 빼기를 하면 투명도가 들어감)
  out: OffscreenCanvas; // 2w×h: 왼쪽 색, 오른쪽 투명도
  tmp: OffscreenCanvas;
}

// 결과 크기: 높이를 맞추고 둘 다 짝수로 (VP9 4:2:0)
export function outSize(op: Opened, height: number) {
  const h0 = height && height < op.height ? height : op.height;
  const h = Math.max(2, Math.round(h0 / 2) * 2);
  const w = Math.max(2, Math.round((op.width * h) / op.height / 2) * 2);
  return { w, h };
}

export function makeCanvases(w: number, h: number): Canvases {
  return { w, h, src: new OffscreenCanvas(w, h), out: new OffscreenCanvas(w * 2, h), tmp: new OffscreenCanvas(w, h) };
}

const ctx2d = (c: OffscreenCanvas, read = false) => c.getContext('2d', read ? { willReadFrequently: true } : undefined) as OffscreenCanvasRenderingContext2D;

const cbcr = (r: number, g: number, b: number) => [-0.1687 * r - 0.3313 * g + 0.5 * b, 0.5 * r - 0.4187 * g - 0.0813 * b];

// 색 빼기: 뺄 색과 색감(CbCr)이 가까울수록 투명하게. 원래 투명도에 곱한다
function chromaKey(c: OffscreenCanvas, look: Look) {
  const x = ctx2d(c, true);
  const img = x.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const [kr, kg, kb] = look.key;
  const [kcb, kcr] = cbcr(kr, kg, kb);
  const lo = look.tol * 255;
  const span = Math.max(1, look.soft * 255);
  // 걷어 낼 채널: 뺄 색에서 가장 센 채널
  const ch = kg >= kr && kg >= kb ? 1 : kb >= kr ? 2 : 0;
  const o1 = (ch + 1) % 3;
  const o2 = (ch + 2) % 3;
  for (let p = 0; p < d.length; p += 4) {
    const a0 = d[p + 3];
    if (!a0) continue;
    const [cb, cr] = cbcr(d[p], d[p + 1], d[p + 2]);
    const dist = Math.hypot(cb - kcb, cr - kcr);
    const k = Math.min(1, Math.max(0, (dist - lo) / span));
    d[p + 3] = Math.round(a0 * k);
    if (look.despill && k > 0) {
      const lim = Math.max(d[p + o1], d[p + o2]);
      if (d[p + ch] > lim) d[p + ch] = lim;
    }
  }
  x.putImageData(img, 0, 0);
}

// i번째 프레임을 out에 그림: 왼쪽 w는 색, 오른쪽 w는 투명도 (흰색 = 보임)
export async function composeFrame(op: Opened, i: number, look: Look, cv: Canvases) {
  const { w, h } = cv;
  const sx = ctx2d(cv.src, look.mode === 'key');
  const t = await op.draw(i, sx as unknown as CanvasRenderingContext2D, w, h, look.fps);
  if (look.mode === 'key') chromaKey(cv.src, look);

  const o = ctx2d(cv.out);
  o.globalCompositeOperation = 'source-over';
  o.filter = 'none';
  o.fillStyle = '#000';
  o.fillRect(0, 0, w * 2, h);
  // 왼쪽 색: 투명한 곳 둘레로 이웃 색을 번지게 깔고 그 위에 원본. 영상 압축이 가장자리를 섞어도 검은 테가 덜 생긴다
  o.save();
  o.beginPath();
  o.rect(0, 0, w, h);
  o.clip();
  const r = Math.max(2, Math.round(Math.min(w, h) / 120));
  for (const k of [4, 2, 1]) {
    o.filter = `blur(${r * k}px)`;
    o.drawImage(cv.src, 0, 0);
    o.drawImage(cv.src, 0, 0);
  }
  o.filter = 'none';
  o.drawImage(cv.src, 0, 0);
  o.restore();
  // 오른쪽 투명도: 원본 모양을 흰색으로 칠해 검은 바탕에
  const m = ctx2d(cv.tmp);
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, w, h);
  m.drawImage(cv.src, 0, 0);
  m.globalCompositeOperation = 'source-in';
  m.fillStyle = '#fff';
  m.fillRect(0, 0, w, h);
  m.globalCompositeOperation = 'source-over';
  o.drawImage(cv.tmp, w, 0);
  return t;
}

// ── 굽기 ──

export interface Progress {
  done: number;
  count: number;
}

const CODEC = 'vp09.00.10.08';

export async function encodeSupported(w: number, h: number) {
  try {
    const r = await VideoEncoder.isConfigSupported({ codec: CODEC, width: w * 2, height: h });
    return !!r.supported;
  } catch {
    return false;
  }
}

// 결과 webm 바이트. onFrame은 프레임마다 (미리보기·진행 막대), cancel()이 참이면 멈춤
export async function makeMaskWebm(op: Opened, look: Look, onFrame: (p: Progress, cv: Canvases) => void, cancel: () => boolean): Promise<Uint8Array> {
  const { w, h } = outSize(op, look.height);
  const cv = makeCanvases(w, h);
  const fps = look.fps || op.fps; // 화면이 영상·움직이는 그림은 원본 값으로 채워 둔다
  const chunks: Chunk[] = [];
  let failed: Error | null = null;
  const enc = new VideoEncoder({
    output: (c) => {
      const data = new Uint8Array(c.byteLength);
      c.copyTo(data);
      chunks.push({ data, ms: c.timestamp / 1000, key: c.type === 'key' });
    },
    error: (e) => (failed = e as Error),
  });
  // 화질: 한 프레임 화소에 비례 (720p 30장이면 약 8Mbps), 투명도 쪽은 단순해서 잘 줄어듦
  const bitrate = Math.round(Math.min(16e6, Math.max(1e6, w * 2 * h * Math.min(fps, 30) * 0.15)));
  if (!(await encodeSupported(w, h))) throw new MaskError('이 앱에서 VP9 영상을 만들 수 없어요');
  enc.configure({ codec: CODEC, width: w * 2, height: h, bitrate, framerate: fps, latencyMode: 'quality' });
  const keyEvery = Math.max(1, Math.round(fps * 2));
  let end = 0;
  try {
    const count = countAt(op, fps);
    for (let i = 0; i < count; i++) {
      if (cancel()) throw new MaskError('멈췄어요');
      if (failed) throw failed;
      const t = await composeFrame(op, i, look, cv);
      const frame = new VideoFrame(cv.out, { timestamp: Math.round(t.ms * 1000), duration: Math.round(t.dur * 1000), alpha: 'discard' });
      enc.encode(frame, { keyFrame: i % keyEvery === 0 });
      frame.close();
      end = Math.max(end, t.ms + t.dur);
      onFrame({ done: i + 1, count }, cv);
      while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 5));
    }
    await enc.flush();
  } finally {
    if (enc.state !== 'closed') enc.close();
  }
  if (failed) throw failed;
  if (!chunks.length) throw new MaskError('만든 프레임이 없어요');
  chunks.sort((a, b) => a.ms - b.ms);
  return muxWebm(chunks, w * 2, h, end, fps);
}
