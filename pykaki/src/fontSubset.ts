// 글꼴 줄이기: TrueType(glyf) 글꼴에서 고른 글자만 남긴 새 글꼴 파일을 만든다. 라이브러리 없이 표를 직접 다시 씀.
// [글꼴] 탭(FontsView.tsx)의 [쓴 글자만 남기기]가 쓴다 (fontsLib.ts shrinkFont).
// - 남기는 표: head hhea maxp hmtx loca glyf cmap post(3.0, 글자 이름 없음) name OS/2 cvt fpgm prep gasp
// - 버리는 표: 글자 번호를 쓰는 GSUB·GPOS·GDEF·kern 등 (한글 완성형은 문제없음, 영문 자간 조정은 빠짐), 서명 DSIG
// - 못 줄이는 글꼴: CFF 외곽선(.otf 대부분), 가변 글꼴(gvar), 비트맵만 있는 글꼴 → 까닭을 담아 오류
// - .ttc는 첫 글꼴만 (렌파이도 첫 글꼴을 씀)

export interface SubsetResult {
  bytes: Uint8Array;
  glyphs: number; // 남긴 글자 모양 수 (.notdef 포함)
  chars: number; // 남긴 글자 수
}

const KEEP = new Set(['head', 'hhea', 'maxp', 'hmtx', 'loca', 'glyf', 'cmap', 'post', 'name', 'OS/2', 'cvt ', 'fpgm', 'prep', 'gasp']);

export function subsetFont(src: Uint8Array, codes: Iterable<number>): SubsetResult {
  const dv = new DataView(src.buffer, src.byteOffset, src.byteLength);
  const tag = (o: number) => String.fromCharCode(src[o], src[o + 1], src[o + 2], src[o + 3]);
  let base = 0;
  if (tag(0) === 'ttcf') base = dv.getUint32(12);
  const ver = tag(base);
  if (ver === 'OTTO') throw new Error('CFF 외곽선 글꼴(.otf)이라 줄이지 못해요. TrueType(.ttf) 판을 쓰세요');
  if (dv.getUint32(base) !== 0x00010000 && ver !== 'true') throw new Error('TrueType 글꼴이 아니라서 줄이지 못해요');

  const n = dv.getUint16(base + 4);
  const tables = new Map<string, Uint8Array>();
  for (let i = 0; i < n; i++) {
    const r = base + 12 + i * 16;
    const off = dv.getUint32(r + 8);
    const len = dv.getUint32(r + 12);
    tables.set(tag(r), src.subarray(off, off + len));
  }
  for (const t of ['head', 'hhea', 'maxp', 'hmtx', 'loca', 'glyf', 'cmap'])
    if (!tables.has(t)) throw new Error(tables.has('gvar') || tables.has('CFF2') ? '가변 글꼴이라 줄이지 못해요' : `글꼴에 ${t} 표가 없어서 줄이지 못해요`);
  if (tables.has('gvar')) throw new Error('가변 글꼴이라 줄이지 못해요');

  const view = (t: Uint8Array) => new DataView(t.buffer, t.byteOffset, t.byteLength);
  const head = view(tables.get('head')!);
  const maxp = view(tables.get('maxp')!);
  const hhea = view(tables.get('hhea')!);
  const hmtx = view(tables.get('hmtx')!);
  const loca = view(tables.get('loca')!);
  const glyf = tables.get('glyf')!;
  const numGlyphs = maxp.getUint16(4);
  const longLoca = head.getInt16(50) === 1;
  const nMetrics = hhea.getUint16(34);
  const glyphAt = (g: number) => {
    const a = longLoca ? loca.getUint32(g * 4) : loca.getUint16(g * 2) * 2;
    const b = longLoca ? loca.getUint32(g * 4 + 4) : loca.getUint16(g * 2 + 2) * 2;
    return glyf.subarray(a, Math.max(a, b));
  };

  // 글자 → 글자 모양 번호
  const cmap = readCmap(tables.get('cmap')!);
  const keep: [number, number][] = []; // [글자, 옛 번호]
  for (const c of new Set(codes)) {
    const g = cmap.get(c);
    if (g && g < numGlyphs) keep.push([c, g]);
  }
  keep.sort((a, b) => a[0] - b[0]);

  // 남길 모양: .notdef + 글자 + 합친 모양(composite)이 쓰는 부품
  const used = new Set<number>([0]);
  const stack = keep.map(([, g]) => g);
  while (stack.length) {
    const g = stack.pop()!;
    if (used.has(g)) continue;
    used.add(g);
    for (const p of components(glyphAt(g))) if (!used.has(p)) stack.push(p);
  }
  // 0번 .notdef의 부품도
  for (const p of components(glyphAt(0))) if (!used.has(p)) (used.add(p), stack.push(p));
  while (stack.length) {
    const g = stack.pop()!;
    for (const p of components(glyphAt(g))) if (!used.has(p)) (used.add(p), stack.push(p));
  }
  const olds = [...used].sort((a, b) => a - b);
  const newOf = new Map(olds.map((g, i) => [g, i]));

  // glyf + loca (긴 꼴)
  const parts: Uint8Array[] = [];
  const offs: number[] = [];
  let at = 0;
  for (const g of olds) {
    offs.push(at);
    let d = glyphAt(g);
    if (d.length && view(d).getInt16(0) < 0) d = renumber(d, newOf);
    const pad = (4 - (d.length % 4)) % 4;
    parts.push(d);
    if (pad) parts.push(new Uint8Array(pad));
    at += d.length + pad;
  }
  offs.push(at);
  const newGlyf = concat(parts);
  const newLoca = new Uint8Array(offs.length * 4);
  offs.forEach((o, i) => view(newLoca).setUint32(i * 4, o));

  // hmtx: 모두 긴 꼴
  const newHmtx = new Uint8Array(olds.length * 4);
  olds.forEach((g, i) => {
    const m = Math.min(g, nMetrics - 1);
    const adv = hmtx.getUint16(m * 4);
    const lsb = g < nMetrics ? hmtx.getInt16(g * 4 + 2) : hmtx.getInt16(nMetrics * 4 + (g - nMetrics) * 2);
    view(newHmtx).setUint16(i * 4, adv);
    view(newHmtx).setInt16(i * 4 + 2, lsb);
  });

  const out = new Map<string, Uint8Array>();
  for (const [t, d] of tables) if (KEEP.has(t)) out.set(t, d.slice());
  out.set('glyf', newGlyf);
  out.set('loca', newLoca);
  out.set('hmtx', newHmtx);
  out.set('cmap', writeCmap(keep.map(([c, g]) => [c, newOf.get(g)!])));
  const h = view(out.get('head')!);
  h.setInt16(50, 1);
  h.setUint32(8, 0);
  view(out.get('maxp')!).setUint16(4, olds.length);
  view(out.get('hhea')!).setUint16(34, olds.length);
  const post = out.get('post');
  if (post && post.length >= 32) {
    const p = post.slice(0, 32);
    view(p).setUint32(0, 0x00030000);
    out.set('post', p);
  } else out.delete('post');
  const os2 = out.get('OS/2');
  if (os2 && os2.length >= 68 && keep.length) {
    view(os2).setUint16(64, Math.min(keep[0][0], 0xffff));
    view(os2).setUint16(66, Math.min(keep[keep.length - 1][0], 0xffff));
  }
  return { bytes: writeFont(out), glyphs: olds.length, chars: keep.length };
}

// 합친 모양이 쓰는 부품 번호
function components(d: Uint8Array): number[] {
  if (d.length < 10) return [];
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  if (v.getInt16(0) >= 0) return [];
  const out: number[] = [];
  let o = 10;
  for (;;) {
    const flags = v.getUint16(o);
    out.push(v.getUint16(o + 2));
    o += 4 + (flags & 1 ? 4 : 2) + (flags & 8 ? 2 : flags & 0x40 ? 4 : flags & 0x80 ? 8 : 0);
    if (!(flags & 0x20) || o + 4 > d.length) return out;
  }
}
function renumber(d: Uint8Array, newOf: Map<number, number>): Uint8Array {
  const c = d.slice();
  const v = new DataView(c.buffer);
  let o = 10;
  for (;;) {
    const flags = v.getUint16(o);
    v.setUint16(o + 2, newOf.get(v.getUint16(o + 2)) ?? 0);
    o += 4 + (flags & 1 ? 4 : 2) + (flags & 8 ? 2 : flags & 0x40 ? 4 : flags & 0x80 ? 8 : 0);
    if (!(flags & 0x20) || o + 4 > c.length) return c;
  }
}

// cmap 읽기: 형식 12(전체) 또는 4(BMP). 유니코드 표를 고름
function readCmap(t: Uint8Array): Map<number, number> {
  const v = new DataView(t.buffer, t.byteOffset, t.byteLength);
  const n = v.getUint16(2);
  let best = -1;
  let score = -1;
  for (let i = 0; i < n; i++) {
    const pid = v.getUint16(4 + i * 8);
    const eid = v.getUint16(6 + i * 8);
    const off = v.getUint32(8 + i * 8);
    const fmt = v.getUint16(off);
    const s = fmt === 12 && (pid === 3 || pid === 0) ? 3 : fmt === 4 && ((pid === 3 && eid === 1) || pid === 0) ? 2 : fmt === 4 && pid === 3 && eid === 0 ? 1 : -1;
    if (s > score) (score = s), (best = off);
  }
  if (best < 0) throw new Error('유니코드 글자 표(cmap)가 없어서 줄이지 못해요');
  const m = new Map<number, number>();
  if (v.getUint16(best) === 12) {
    const groups = v.getUint32(best + 12);
    for (let i = 0; i < groups; i++) {
      const g = best + 16 + i * 12;
      const s = v.getUint32(g);
      const e = v.getUint32(g + 4);
      const id = v.getUint32(g + 8);
      for (let c = s; c <= e; c++) m.set(c, id + c - s);
    }
    return m;
  }
  const seg = v.getUint16(best + 6) / 2;
  const ends = best + 14;
  const starts = ends + seg * 2 + 2;
  const deltas = starts + seg * 2;
  const ranges = deltas + seg * 2;
  for (let i = 0; i < seg; i++) {
    const e = v.getUint16(ends + i * 2);
    const s = v.getUint16(starts + i * 2);
    const delta = v.getInt16(deltas + i * 2);
    const ro = v.getUint16(ranges + i * 2);
    for (let c = s; c <= e && c !== 0xffff; c++) {
      let g: number;
      if (!ro) g = (c + delta) & 0xffff;
      else {
        const at = ranges + i * 2 + ro + (c - s) * 2;
        g = at + 2 <= t.length ? v.getUint16(at) : 0;
        if (g) g = (g + delta) & 0xffff;
      }
      if (g) m.set(c, g);
    }
  }
  return m;
}

// cmap 쓰기: 형식 4(BMP) + 필요하면 형식 12
function writeCmap(pairs: [number, number][]): Uint8Array {
  const bmp = pairs.filter(([c]) => c < 0xffff);
  // 형식 4: 글자와 번호가 같이 1씩 느는 구간 하나를 한 조각으로
  const segs: [number, number, number][] = []; // [시작, 끝, delta]
  for (const [c, g] of bmp) {
    const last = segs[segs.length - 1];
    if (last && last[1] === c - 1 && ((last[2] + c) & 0xffff) === g) last[1] = c;
    else segs.push([c, c, (g - c) & 0xffff]);
  }
  segs.push([0xffff, 0xffff, 1]);
  const sc = segs.length;
  const f4 = new Uint8Array(16 + sc * 8);
  const v4 = new DataView(f4.buffer);
  const pow = 2 ** Math.floor(Math.log2(sc));
  v4.setUint16(0, 4);
  v4.setUint16(2, f4.length);
  v4.setUint16(6, sc * 2);
  v4.setUint16(8, pow * 2);
  v4.setUint16(10, Math.log2(pow));
  v4.setUint16(12, sc * 2 - pow * 2);
  segs.forEach(([s, e, d], i) => {
    v4.setUint16(14 + i * 2, e);
    v4.setUint16(16 + sc * 2 + i * 2, s);
    v4.setUint16(16 + sc * 4 + i * 2, d);
    v4.setUint16(16 + sc * 6 + i * 2, 0);
  });
  if (f4.length > 0xffff) throw new Error('글자가 너무 많아서 줄이지 못해요');
  const wide = pairs.some(([c]) => c > 0xffff);
  let f12: Uint8Array | null = null;
  if (wide) {
    const gs: [number, number, number][] = [];
    for (const [c, g] of pairs) {
      const last = gs[gs.length - 1];
      if (last && last[1] === c - 1 && last[2] + (c - last[0]) === g) last[1] = c;
      else gs.push([c, c, g]);
    }
    f12 = new Uint8Array(16 + gs.length * 12);
    const v = new DataView(f12.buffer);
    v.setUint16(0, 12);
    v.setUint32(4, f12.length);
    v.setUint32(12, gs.length);
    gs.forEach(([s, e, g], i) => (v.setUint32(16 + i * 12, s), v.setUint32(20 + i * 12, e), v.setUint32(24 + i * 12, g)));
  }
  type Rec = [number, number, 'f4' | 'f12'];
  const recs: Rec[] = f12 ? [[0, 3, 'f4'], [0, 4, 'f12'], [3, 1, 'f4'], [3, 10, 'f12']] : [[0, 3, 'f4'], [3, 1, 'f4']];
  const headLen = 4 + recs.length * 8;
  const o4 = headLen;
  const o12 = o4 + f4.length;
  const outLen = o12 + (f12?.length ?? 0);
  const out = new Uint8Array(outLen);
  const v = new DataView(out.buffer);
  v.setUint16(2, recs.length);
  recs.forEach(([p, e, k], i) => {
    v.setUint16(4 + i * 8, p);
    v.setUint16(6 + i * 8, e);
    v.setUint32(8 + i * 8, k === 'f4' ? o4 : o12);
  });
  out.set(f4, o4);
  if (f12) out.set(f12, o12);
  return out;
}

function checksum(d: Uint8Array) {
  let s = 0;
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  for (let i = 0; i < d.length; i += 4) s = (s + (i + 4 <= d.length ? v.getUint32(i) : padWord(d, i))) >>> 0;
  return s;
}
const padWord = (d: Uint8Array, i: number) => ((d[i] << 24) | ((d[i + 1] ?? 0) << 16) | ((d[i + 2] ?? 0) << 8) | (d[i + 3] ?? 0)) >>> 0;

function writeFont(tables: Map<string, Uint8Array>): Uint8Array {
  const tags = [...tables.keys()].sort();
  const n = tags.length;
  const pow = 2 ** Math.floor(Math.log2(n));
  let at = 12 + n * 16;
  const offs = tags.map((t) => {
    const o = at;
    at += Math.ceil(tables.get(t)!.length / 4) * 4;
    return o;
  });
  const out = new Uint8Array(at);
  const v = new DataView(out.buffer);
  v.setUint32(0, 0x00010000);
  v.setUint16(4, n);
  v.setUint16(6, pow * 16);
  v.setUint16(8, Math.log2(pow));
  v.setUint16(10, n * 16 - pow * 16);
  tags.forEach((t, i) => {
    const d = tables.get(t)!;
    const r = 12 + i * 16;
    for (let k = 0; k < 4; k++) out[r + k] = t.charCodeAt(k);
    v.setUint32(r + 4, checksum(d));
    v.setUint32(r + 8, offs[i]);
    v.setUint32(r + 12, d.length);
    out.set(d, offs[i]);
  });
  const hi = tags.indexOf('head');
  v.setUint32(offs[hi] + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out;
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
}

// 자주 쓰는 한글 2,350자 (KS X 1001 완성형). EUC-KR 글자 표에서 만든다
export function commonHangul(): number[] {
  const bytes: number[] = [];
  for (let a = 0xb0; a <= 0xc8; a++) for (let b = 0xa1; b <= 0xfe; b++) bytes.push(a, b);
  const s = new TextDecoder('euc-kr').decode(new Uint8Array(bytes));
  return [...s].map((c) => c.codePointAt(0)!).filter((c) => c >= 0xac00 && c <= 0xd7a3);
}
