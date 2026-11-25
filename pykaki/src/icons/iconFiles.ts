// [아이콘] 창의 계산: 그림 읽기, 크기 확인, 줄이기, PNG와 윈도우.ico 만들기 (밖과 통신하지 않음, 라이브러리 없음)
// - 창 아이콘: PNG 한 장 (렌파이 config.window_icon, 1024보다 크면 렌파이가 줄이므로 1024까지만)
// - exe 아이콘:.ico 한 파일에 16·24·32·48·64·128·256. 256은 PNG로, 나머지는 32비트 BMP로 넣는다
//   (렌파이 런처 change_icon.py가.ico 칸을 그대로 exe에 옮김. 작은 크기 BMP는 예전 윈도우 탐색기에서도 보임)

export const MIN_SIDE = 256; // 두 아이콘 모두 정사각형 256×256 이상
export const WINDOW_MAX = 1024;
export const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

export type SrcKind = 'png' | 'jpeg' | 'webp' | 'ico';

export interface Source {
  name: string;
  kind: SrcKind;
  w: number;
  h: number;
  alpha: boolean; // 투명한 곳이 있는지 (ico는 true로 봄)
  bmp?: ImageBitmap; // 그림 (ico 원본은 없음)
  raw?: Uint8Array; // ico 원본 바이트 (그대로 저장)
  icoSizes?: number[]; // ico 안의 크기들
}

export class IconError extends Error {}

export function kindOf(name: string, bytes: Uint8Array): SrcKind | null {
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) return 'ico';
  const ext = /\.([a-z]+)$/i.exec(name)?.[1].toLowerCase();
  return ext === 'jpg' ? 'jpeg' : ext === 'png' || ext === 'jpeg' || ext === 'webp' || ext === 'ico' ? ext : null;
}

//.ico 머리 읽기: 안에 든 크기들 (너비 칸 0 = 256)
export function icoSizes(b: Uint8Array): number[] {
  if (b.length < 6) throw new IconError('.ico 파일이 너무 짧아요');
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (v.getUint16(0, true) !== 0 || v.getUint16(2, true) !== 1) throw new IconError('.ico 파일이 아니에요');
  const n = v.getUint16(4, true);
  if (!n || b.length < 6 + n * 16) throw new IconError('.ico 파일 안에 그림이 없어요');
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const w = b[6 + i * 16] || 256;
    const h = b[7 + i * 16] || 256;
    out.push(Math.max(w, h));
  }
  return [...new Set(out)].sort((a, c) => a - c);
}

export async function readSource(name: string, bytes: Uint8Array): Promise<Source> {
  const kind = kindOf(name, bytes);
  if (!kind) throw new IconError('PNG, JPEG, WebP 그림이나 .ico 파일만 쓸 수 있어요');
  if (kind === 'ico') {
    const sizes = icoSizes(bytes);
    const top = sizes[sizes.length - 1];
    return { name, kind, w: top, h: top, alpha: true, raw: bytes, icoSizes: sizes };
  }
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(new Blob([bytes as BlobPart]));
  } catch {
    throw new IconError('그림을 읽지 못했어요. 깨진 파일인지 봐 주세요');
  }
  return { name, kind, w: bmp.width, h: bmp.height, alpha: kind !== 'jpeg' && hasAlpha(bmp), bmp };
}

function hasAlpha(bmp: ImageBitmap) {
  const s = Math.min(256, bmp.width, bmp.height);
  const c = canvas(s, s);
  c.ctx.drawImage(bmp, 0, 0, s, s);
  const d = c.ctx.getImageData(0, 0, s, s).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

// 요구 조건에 맞는지. 맞으면 null, 아니면 알릴 글
export function problem(src: Source, pad: boolean, forWindow: boolean): string | null {
  if (src.kind === 'ico') {
    if (forWindow) return '창 아이콘은 .ico를 쓸 수 없어요. PNG, JPEG, WebP 그림을 골라 주세요';
    if (!src.icoSizes!.includes(256)) return `이 .ico에는 256×256 그림이 없어요 (든 크기: ${src.icoSizes!.join(', ')}). 256×256이 든 .ico를 고르거나 PNG 그림을 골라 주세요`;
    return null;
  }
  const side = pad ? Math.max(src.w, src.h) : Math.min(src.w, src.h);
  if (src.w !== src.h && !pad) return `정사각형이 아니에요 (${src.w}×${src.h}). [투명 여백으로 정사각형 만들기]를 켜거나 정사각형 그림을 골라 주세요`;
  if (side < MIN_SIDE) return `${src.w}×${src.h}라서 작아요. 256×256 이상이 필요해요`;
  return null;
}

interface Cv {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}
function canvas(w: number, h: number): Cv {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  const ctx = el.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { el, ctx };
}

// 정사각형 바탕 (모자라면 투명 여백, 가운데)
function square(src: Source): Cv {
  const bmp = src.bmp!;
  const s = Math.max(bmp.width, bmp.height);
  const c = canvas(s, s);
  c.ctx.drawImage(bmp, Math.floor((s - bmp.width) / 2), Math.floor((s - bmp.height) / 2));
  return c;
}

// 반씩 줄여 가다 마지막에 맞춤 (한 번에 크게 줄이면 거칠어짐)
function scaled(base: Cv, size: number): Cv {
  let cur = base;
  while (cur.el.width / 2 >= size * 1.5) {
    const half = Math.ceil(cur.el.width / 2);
    const n = canvas(half, half);
    n.ctx.drawImage(cur.el, 0, 0, half, half);
    cur = n;
  }
  if (cur.el.width === size) return cur;
  const out = canvas(size, size);
  out.ctx.drawImage(cur.el, 0, 0, size, size);
  return out;
}

const toPng = (c: Cv) =>
  new Promise<Uint8Array>((ok, bad) =>
    c.el.toBlob((b) => (b ? void b.arrayBuffer().then((a) => ok(new Uint8Array(a)), bad) : bad(new IconError('PNG로 바꾸지 못했어요'))), 'image/png'),
  );

// 미리보기용 그림 (크기별)
export function previewUrl(src: Source, size: number): string | null {
  if (!src.bmp) return null;
  return scaled(square(src), size).el.toDataURL('image/png');
}

export async function makeWindowPng(src: Source): Promise<Uint8Array> {
  const base = square(src);
  return toPng(scaled(base, Math.min(base.el.width, WINDOW_MAX)));
}

// 32비트 BMP 칸 (BITMAPINFOHEADER + 아래에서 위로 BGRA + 비운 AND 마스크)
function bmpEntry(c: Cv): Uint8Array {
  const s = c.el.width;
  const px = c.ctx.getImageData(0, 0, s, s).data;
  const maskRow = Math.ceil(s / 32) * 4;
  const out = new Uint8Array(40 + s * s * 4 + maskRow * s);
  const v = new DataView(out.buffer);
  v.setUint32(0, 40, true);
  v.setInt32(4, s, true);
  v.setInt32(8, s * 2, true); // 색 + 마스크 높이
  v.setUint16(12, 1, true);
  v.setUint16(14, 32, true);
  v.setUint32(16, 0, true);
  v.setUint32(20, s * s * 4 + maskRow * s, true);
  let o = 40;
  for (let y = s - 1; y >= 0; y--)
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      out[o++] = px[i + 2];
      out[o++] = px[i + 1];
      out[o++] = px[i];
      out[o++] = px[i + 3];
    }
  return out; // 마스크는 0 (투명도는 알파로)
}

export async function makeIco(src: Source): Promise<Uint8Array> {
  if (src.raw) return src.raw;
  const base = square(src);
  const parts: { size: number; data: Uint8Array }[] = [];
  for (const size of ICO_SIZES) {
    const c = scaled(base, size);
    parts.push({ size, data: size >= 256 ? await toPng(c) : bmpEntry(c) });
  }
  const head = 6 + parts.length * 16;
  const total = head + parts.reduce((n, p) => n + p.data.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true);
  v.setUint16(2, 1, true);
  v.setUint16(4, parts.length, true);
  let off = head;
  parts.forEach((p, i) => {
    const e = 6 + i * 16;
    out[e] = p.size >= 256 ? 0 : p.size;
    out[e + 1] = p.size >= 256 ? 0 : p.size;
    v.setUint16(e + 4, 1, true);
    v.setUint16(e + 6, 32, true);
    v.setUint32(e + 8, p.data.length, true);
    v.setUint32(e + 12, off, true);
    out.set(p.data, off);
    off += p.data.length;
  });
  return out;
}

// PNG 머리에서 크기 읽기 (지금 창 아이콘 표시용)
export function pngSize(b: Uint8Array): [number, number] | null {
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return [v.getUint32(16), v.getUint32(20)];
}

// options.rpy의 config.window_icon. 값과 그 줄 (주석 줄은 안 봄)
export function windowIconLine(options: string): { path: string | null; line: string } | null {
  const m = /^define\s+config\.window_icon\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))[^\r\n]*/m.exec(options);
  if (!m) return null;
  const path = m[1] ?? m[2] ?? null;
  return { path, line: m[0] };
}

export const DEFAULT_WINDOW = 'gui/window_icon.png';

// 창 아이콘을 쓸 자리 (game 기준)와 고쳐야 할 options.rpy (안 고쳐도 되면 null)
export function windowTarget(options: string | null): { rel: string; options: string | null } {
  const def = `define config.window_icon = "${DEFAULT_WINDOW}"`;
  if (options === null) return { rel: DEFAULT_WINDOW, options: null };
  const cur = windowIconLine(options);
  if (cur?.path && /\.png$/i.test(cur.path) && !/^\/|\.\./.test(cur.path)) return { rel: cur.path, options: null };
  if (cur) return { rel: DEFAULT_WINDOW, options: options.replace(cur.line, def) };
  const nl = options.includes('\r\n') ? '\r\n' : '\n';
  return { rel: DEFAULT_WINDOW, options: options.replace(/\s*$/, '') + nl + nl + '## 창 아이콘 (pygaki [아이콘]에서 넣음)' + nl + nl + def + nl };
}
