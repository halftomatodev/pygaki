// 글꼴 파일(.ttf, .otf, .ttc) 읽기: 이름 표(name)와 글자 표(cmap)만 본다. 그리지는 않는다.
// [글꼴] 화면(FontsView.tsx)이 글꼴 이름, 라이선스 글, 한글·가나·한자·영문이 들어 있는지, 대본 글자 중 없는 글자를 알려 줄 때 쓴다.
// 렌파이(FreeType)가 읽는 파일과 같은 파일을 읽는다. 모르는 꼴이면 null

export interface FontInfo {
  family: string; // 글꼴 이름 (한국어 이름이 있으면 그것)
  style: string; // Regular, Bold …
  license: string; // 글꼴에 적힌 라이선스 글 (name 13). 없으면 ''
  licenseUrl: string; // name 14
  copyright: string; // name 0
  faces: number; // .ttc 안의 글꼴 수 (보통 1). 렌파이는 첫 글꼴을 쓴다
  has(code: number): boolean; // 이 글자가 있는지
  count: number; // 들어 있는 글자 수
}

// 글자 묶음: 이 글꼴에 몇 자 있는지 셀 범위
export const SCRIPTS: { id: string; label: string; ranges: [number, number][] }[] = [
  { id: 'latin', label: '영문·숫자', ranges: [[0x30, 0x39], [0x41, 0x5a], [0x61, 0x7a]] },
  { id: 'hangul', label: '한글', ranges: [[0xac00, 0xd7a3]] },
  { id: 'kana', label: '가나', ranges: [[0x3041, 0x3096], [0x30a1, 0x30fa]] },
  { id: 'kanji', label: '한자', ranges: [[0x4e00, 0x9fff]] },
];
// "있음"으로 보는 몫. 한글은 자주 쓰는 2,350자만 든 글꼴도 많아서 낮게
const ENOUGH: Record<string, number> = { latin: 1, hangul: 0.2, kana: 0.95, kanji: 0.2 };

export interface Coverage { id: string; label: string; have: number; total: number; ok: boolean }

export function coverage(f: FontInfo): Coverage[] {
  return SCRIPTS.map((s) => {
    let have = 0;
    let total = 0;
    for (const [a, b] of s.ranges)
      for (let c = a; c <= b; c++) {
        total++;
        if (f.has(c)) have++;
      }
    return { id: s.id, label: s.label, have, total, ok: have / total >= ENOUGH[s.id] };
  });
}

// 글 속에서 이 글꼴에 없는 글자 (빈칸·줄바꿈·태그 기호처럼 그리지 않는 것은 뺌). 많으면 앞의 limit자만
export function missingChars(f: FontInfo, text: string, limit = 60): { chars: string[]; total: number } {
  const seen = new Set<string>();
  const out: string[] = [];
  let total = 0;
  for (const ch of text) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    const c = ch.codePointAt(0)!;
    if (c < 0x21 || (c >= 0x7f && c < 0xa0) || c === 0x3000 || (c >= 0xfe00 && c <= 0xfe0f) || c === 0x200b || c === 0x200d) continue;
    if (f.has(c)) continue;
    total++;
    if (out.length < limit) out.push(ch);
  }
  return { chars: out, total };
}

const tag = (v: DataView, o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));

function tables(v: DataView, at: number) {
  const n = v.getUint16(at + 4);
  const out = new Map<string, { off: number; len: number }>();
  for (let i = 0; i < n; i++) {
    const r = at + 12 + i * 16;
    out.set(tag(v, r), { off: v.getUint32(r + 8), len: v.getUint32(r + 12) });
  }
  return out;
}

function utf16(v: DataView, o: number, len: number) {
  let s = '';
  for (let i = 0; i + 1 < len; i += 2) s += String.fromCharCode(v.getUint16(o + i));
  return s;
}
function latin1(v: DataView, o: number, len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(v.getUint8(o + i));
  return s;
}

// name 표: 한국어(0x412) → 영어(0x409) → 아무 윈도우 이름 → 맥 이름 차례로
function names(v: DataView, t: { off: number; len: number } | undefined) {
  const got = new Map<number, { rank: number; text: string }>();
  if (!t) return got;
  const count = v.getUint16(t.off + 2);
  const strs = t.off + v.getUint16(t.off + 4);
  for (let i = 0; i < count; i++) {
    const r = t.off + 6 + i * 12;
    const plat = v.getUint16(r);
    const lang = v.getUint16(r + 4);
    const id = v.getUint16(r + 6);
    const len = v.getUint16(r + 8);
    const o = strs + v.getUint16(r + 10);
    if (o + len > v.byteLength) continue;
    let rank: number;
    let text: string;
    if (plat === 3 || plat === 0) {
      rank = lang === 0x412 ? 0 : lang === 0x409 ? 1 : 2;
      text = utf16(v, o, len);
    } else if (plat === 1 && lang === 0) {
      rank = 3;
      text = latin1(v, o, len);
    } else continue;
    const had = got.get(id);
    if (!had || rank < had.rank) got.set(id, { rank, text: text.trim() });
  }
  return got;
}

// cmap 표: 유니코드 글자 → 있음. 형식 4(BMP)와 12(전체)만 (다른 형식은 요즘 글꼴에 거의 없음)
function charSet(v: DataView, t: { off: number; len: number } | undefined) {
  const ranges: [number, number][] = [];
  if (!t) return ranges;
  const n = v.getUint16(t.off + 2);
  let best = -1;
  let bestRank = 99;
  for (let i = 0; i < n; i++) {
    const r = t.off + 4 + i * 8;
    const plat = v.getUint16(r);
    const enc = v.getUint16(r + 2);
    const sub = t.off + v.getUint32(r + 4);
    const fmt = v.getUint16(sub);
    const rank = fmt === 12 && (plat === 3 || plat === 0) ? 0 : fmt === 4 && ((plat === 3 && (enc === 1 || enc === 10)) || plat === 0) ? 1 : 99;
    if (rank < bestRank) (bestRank = rank), (best = sub);
  }
  if (best < 0) return ranges;
  const fmt = v.getUint16(best);
  if (fmt === 12) {
    const groups = v.getUint32(best + 12);
    for (let i = 0; i < groups; i++) {
      const g = best + 16 + i * 12;
      const a = v.getUint32(g);
      const b = v.getUint32(g + 4);
      // 첫 글자 번호가 0이면 그 첫 글자만 빈 글자
      if (v.getUint32(g + 8) !== 0) ranges.push([a, b]);
      else if (b > a) ranges.push([a + 1, b]);
    }
  } else {
    const segs = v.getUint16(best + 6) / 2;
    const ends = best + 14;
    const starts = ends + segs * 2 + 2;
    const deltas = starts + segs * 2;
    const offs = deltas + segs * 2;
    for (let i = 0; i < segs; i++) {
      const end = v.getUint16(ends + i * 2);
      const start = v.getUint16(starts + i * 2);
      if (start === 0xffff) continue;
      const delta = v.getInt16(deltas + i * 2);
      const ro = v.getUint16(offs + i * 2);
      if (ro === 0) {
        // 글자 번호가 0(빈 글자)이 되는 것만 빼고 모두 있음
        let runStart = -1;
        for (let c = start; c <= end + 1; c++) {
          const ok = c <= end && ((c + delta) & 0xffff) !== 0;
          if (ok && runStart < 0) runStart = c;
          if (!ok && runStart >= 0) (ranges.push([runStart, c - 1]), (runStart = -1));
        }
      } else {
        let runStart = -1;
        for (let c = start; c <= end + 1; c++) {
          let ok = false;
          if (c <= end) {
            const at = offs + i * 2 + ro + (c - start) * 2;
            ok = at + 2 <= v.byteLength && v.getUint16(at) !== 0;
          }
          if (ok && runStart < 0) runStart = c;
          if (!ok && runStart >= 0) (ranges.push([runStart, c - 1]), (runStart = -1));
        }
      }
    }
  }
  ranges.sort((x, y) => x[0] - y[0]);
  return ranges;
}

export function readFontInfo(buf: ArrayBuffer | Uint8Array): FontInfo | null {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.byteLength < 12) return null;
  try {
    let at = 0;
    let faces = 1;
    const head = tag(v, 0);
    if (head === 'ttcf') {
      faces = v.getUint32(8);
      at = v.getUint32(12);
    } else if (!(v.getUint32(0) === 0x00010000 || head === 'OTTO' || head === 'true')) return null;
    const t = tables(v, at);
    const nm = names(v, t.get('name'));
    const ranges = charSet(v, t.get('cmap'));
    const has = (c: number) => {
      let lo = 0;
      let hi = ranges.length - 1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (c < ranges[m][0]) hi = m - 1;
        else if (c > ranges[m][1]) lo = m + 1;
        else return true;
      }
      return false;
    };
    const text = (id: number) => nm.get(id)?.text ?? '';
    return {
      family: text(16) || text(1) || text(4),
      style: text(17) || text(2),
      license: text(13),
      licenseUrl: text(14),
      copyright: text(0),
      faces,
      has,
      count: ranges.reduce((n, [a, b]) => n + b - a + 1, 0),
    };
  } catch {
    return null;
  }
}
