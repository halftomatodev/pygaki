// 대사 글 안의 렌파이 텍스트 태그를 읽고, 넣고, 빼는 함수. 태그 상자(TagBar), 상자 보기 화면, 내보내기 검사가 같이 쓴다
// 태그 이름과 짝 규칙은 렌파이 8.5.3 renpy/text/extras.py의 text_tags, check_text_tags를 따른다

// 짝이 있는 태그(true)와 혼자 쓰는 태그(false)
const RENPY_TAGS: Record<string, boolean> = {
  alpha: true, alt: true, art: true, axis: true, done: false, instance: true, image: false, p: false, w: false, fast: false,
  feature: true, b: true, i: true, u: true, a: true, plain: true, font: true, color: true, outlinecolor: true, size: true,
  noalt: true, nw: false, s: true, shader: true, rt: true, rb: true, k: true, cps: true, space: false, vspace: false,
  clear: false, // NVL 화면 지우기 (nvl 모드에서만 뜻이 있다)
};

export interface Tok {
  k: 'text' | 'esc' | 'open' | 'close' | 'self' | 'note';
  s: number; // 글 안의 시작 자리
  e: number; // 끝 자리 (다음 글자)
  name: string;
  val: string;
}

export function tokenize(t: string): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < t.length; ) {
    if (t.startsWith('{{', i)) {
      out.push({ k: 'esc', s: i, e: i + 2, name: '', val: '' });
      i += 2;
      continue;
    }
    if (t[i] !== '{') {
      const j = t.indexOf('{', i);
      const end = j < 0 ? t.length : j;
      out.push({ k: 'text', s: i, e: end, name: '', val: '' });
      i = end;
      continue;
    }
    const j = t.indexOf('}', i);
    if (j < 0) {
      out.push({ k: 'text', s: i, e: t.length, name: '', val: '' });
      break;
    }
    const raw = t.slice(i + 1, j);
    const eq = raw.indexOf('=');
    const val = eq < 0 ? '' : raw.slice(eq + 1);
    if (raw.startsWith('#')) out.push({ k: 'note', s: i, e: j + 1, name: '#', val: raw.slice(1) });
    else if (raw.startsWith('/')) out.push({ k: 'close', s: i, e: j + 1, name: raw.slice(1), val: '' });
    else {
      const name = raw.split(/[=:]/)[0];
      out.push({ k: RENPY_TAGS[name] === false ? 'self' : 'open', s: i, e: j + 1, name, val });
    }
    i = j + 1;
  }
  return out;
}

export interface Pair { o: Tok; c: Tok }
export interface TagProblem { level: 'error' | 'warn'; msg: string }

// 여는 태그와 닫는 태그를 짝짓는다. 렌파이가 실행할 때처럼 닫는 태그는 가장 안쪽 것을 닫는다
export function pairTags(toks: Tok[]): { pairs: Pair[]; problems: TagProblem[] } {
  const pairs: Pair[] = [];
  const problems: TagProblem[] = [];
  const stack: Tok[] = [];
  let crossed = false; // 엇갈려 닫힌 태그는 닫는 쪽마다 걸려서, 첫 번째만 알린다
  for (const t of toks) {
    if (t.k === 'open') {
      if (!(t.name in RENPY_TAGS)) problems.push({ level: 'warn', msg: `{${t.name}}는 렌파이가 모르는 태그예요` });
      stack.push(t);
    } else if (t.k === 'self' && !(t.name in RENPY_TAGS)) problems.push({ level: 'warn', msg: `{${t.name}}는 렌파이가 모르는 태그예요` });
    else if (t.k === 'close') {
      const o = stack.pop();
      if (!o) problems.push({ level: 'error', msg: `{/${t.name}}를 여는 태그가 없어서 렌파이가 멈춰요` });
      else {
        if (o.name !== t.name && !crossed && (crossed = true)) problems.push({ level: 'warn', msg: `{${o.name}}보다 {/${t.name}}가 먼저 닫혀요 (렌파이 Lint 오류)` });
        pairs.push({ o, c: t });
      }
    }
  }
  for (const o of stack) problems.push({ level: 'warn', msg: `{${o.name}}를 닫지 않았어요` });
  return { pairs, problems };
}

// 글 안의 {shader=} 태그에 적힌 효과 값들 ("jitter", "slidein:u__dir=90|shake" ...)
export const shaderTags = (text: string) => (text.includes('{shader') ? tokenize(text).filter((t) => t.k === 'open' && t.name === 'shader' && t.val.trim()).map((t) => t.val.trim()) : []);
// 내보내기 검사용
export const checkTags = (text: string) => pairTags(tokenize(text)).problems;
// 렌파이 기본 루비 스타일(ruby_text)은 본문 기준선에 붙어 글에 겹치고, 글자 효과가 있는 대사에서는 오류로 멈춘다.
// pygaki 플러그인(ui_kit 4.9, say_style.rpy)이 루비가 있는 대사 줄마다 루비 스타일을 그 줄에 맞게 만들어 준다.
// 루비 글의 크기·색은 그 자리에서 {rt} 안에 {size=}, {color=}로 적는다 (rubyAt, setRubyStyle)
export const RUBY_NOTE = '루비를 넣었어요. 루비 글에 커서가 있으면 [루비 글] 줄에서 크기와 색을 그 자리에서 바꿔요';

// ── 고치기 ──

export interface Sel { text: string; s: number; e: number }
export type Edit = Sel | { error: string };

const NEST_ERR = '고른 곳이 다른 태그의 경계를 넘어요. 태그 안쪽만 고르거나 태그까지 함께 골라 주세요';

// 자리가 태그 글자 한가운데면 태그 앞(dir<0)이나 뒤로 옮긴다
function snap(toks: Tok[], pos: number, dir: number) {
  const t = toks.find((x) => x.k !== 'text' && x.s < pos && pos < x.e);
  return t ? (dir < 0 ? t.s : t.e) : pos;
}

function prep(text: string, s0: number, e0: number) {
  const toks = tokenize(text);
  const s = s0 === e0 ? snap(toks, s0, 1) : snap(toks, s0, -1);
  const e = s0 === e0 ? s : snap(toks, e0, 1);
  const { pairs } = pairTags(toks);
  return { toks, pairs, s, e };
}

// 고른 곳을 안에 품은 짝 (태그까지 딱 고른 경우도 품은 것으로 본다)
const holds = (p: Pair, s: number, e: number) => (p.o.e <= s && e <= p.c.s) || (s === p.o.s && e === p.c.e);
const exact = (p: Pair, s: number, e: number) => (s === p.o.e && e === p.c.s) || (s === p.o.s && e === p.c.e);

// 고른 곳을 품은 그 이름의 짝 중 가장 안쪽
function inner(pairs: Pair[], name: string, s: number, e: number) {
  let best: Pair | undefined;
  for (const p of pairs) if (p.o.name === name && holds(p, s, e) && (!best || p.o.s > best.o.s)) best = p;
  return best;
}

// 그 자리를 품은 가장 안쪽 짝 (이름 상관없이)
function innermostAt(pairs: Pair[], pos: number) {
  let best: Pair | undefined;
  for (const p of pairs) if (p.o.e <= pos && pos <= p.c.s && (!best || p.o.s > best.o.s)) best = p;
  return best;
}

// 고른 곳 안의 태그가 저희끼리 짝이 맞는지
function balanced(toks: Tok[], s: number, e: number) {
  let depth = 0;
  for (const t of toks) {
    if (t.s < s || t.e > e) continue;
    if (t.k === 'open') depth++;
    else if (t.k === 'close' && --depth < 0) return false;
  }
  return depth === 0;
}

// 위치 pos가 [at, at+removed)를 added 글자로 바꾼 뒤 어디로 가는지
const shift = (pos: number, at: number, removed: number, added: number) => (pos >= at + removed ? pos + added - removed : pos > at ? at : pos);

function unwrap(text: string, p: Pair, s: number, e: number): Sel {
  const ol = p.o.e - p.o.s;
  const t = text.slice(0, p.o.s) + text.slice(p.o.e, p.c.s) + text.slice(p.c.e);
  if (exact(p, s, e)) return { text: t, s: p.o.s, e: p.o.s + (p.c.s - p.o.e) };
  const m = (x: number) => shift(shift(x, p.c.s, p.c.e - p.c.s, 0), p.o.s, ol, 0);
  return { text: t, s: m(s), e: m(e) };
}

function wrap(text: string, toks: Tok[], s: number, e: number, open: string, close: string): Edit {
  if (s !== e && !balanced(toks, s, e)) return { error: NEST_ERR };
  return { text: text.slice(0, s) + open + text.slice(s, e) + close + text.slice(e), s: s + open.length, e: e + open.length };
}

// 짝 p를 고른 곳 앞뒤로 끊어서 고른 곳만 태그 밖으로 뺀다. 끊은 쪽이 비면 빈 짝은 남기지 않는다
function split(text: string, toks: Tok[], pairs: Pair[], p: Pair, s: number, e: number): Edit {
  if (innermostAt(pairs, s) !== p || innermostAt(pairs, e) !== p || !balanced(toks, s, e)) return { error: NEST_ERR };
  const open = text.slice(p.o.s, p.o.e);
  const close = text.slice(p.c.s, p.c.e);
  const left = s === p.o.e ? text.slice(0, p.o.s) : text.slice(0, s) + close;
  const right = e === p.c.s ? text.slice(p.c.e) : open + text.slice(e);
  const ns = left.length;
  return { text: left + text.slice(s, e) + right, s: ns, e: ns + (e - s) };
}

// 굵게, 기울임, 밑줄, 취소선: 이미 그 태그 안이면 빼고, 아니면 감싼다
export function toggleTag(text: string, s0: number, e0: number, name: string): Edit {
  const { toks, pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, name, s, e);
  if (p) return s === e || exact(p, s, e) ? unwrap(text, p, s, e) : split(text, toks, pairs, p, s, e);
  return wrap(text, toks, s, e, `{${name}}`, `{/${name}}`);
}

// 색, 크기: 이미 그 태그 안이면 값만 바꾸고, 아니면 감싼다
export function setTagValue(text: string, s0: number, e0: number, name: string, val: string): Edit {
  const { toks, pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, name, s, e);
  const open = `{${name}=${val}}`;
  if (p && (s === e || exact(p, s, e))) {
    const t = text.slice(0, p.o.s) + open + text.slice(p.o.e);
    const m = (x: number) => (x >= p.o.e ? x + open.length - (p.o.e - p.o.s) : x);
    return { text: t, s: m(s), e: m(e) };
  }
  return wrap(text, toks, s, e, open, `{/${name}}`);
}

// 고른 곳을 품은 그 태그의 값만 바꾼다 (효과 세부 값 막대). 태그 안의 일부만 골랐어도 새로 감싸지 않는다
export function retag(text: string, s0: number, e0: number, name: string, val: string, what: string): Edit {
  const { pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, name, s, e);
  if (!p) return { error: `${what} 태그 안에 있지 않아요` };
  const open = `{${name}=${val}}`;
  const m = (x: number) => (x >= p.o.e ? x + open.length - (p.o.e - p.o.s) : x);
  return { text: text.slice(0, p.o.s) + open + text.slice(p.o.e), s: m(s), e: m(e) };
}

// 그 태그를 벗긴다 (색 빼기)
export function removeTag(text: string, s0: number, e0: number, name: string, what: string): Edit {
  const { pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, name, s, e);
  return p ? unwrap(text, p, s, e) : { error: `${what} 태그 안에 있지 않아요` };
}

// 크기를 한 단계 키우거나 줄인다. 이미 크기 태그 안이면 그 값을 바꾼다
export function stepSize(text: string, s0: number, e0: number, step: number): Edit {
  const { pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, 'size', s, e);
  if (!p || !(s === e || exact(p, s, e))) return setTagValue(text, s0, e0, 'size', step > 0 ? `+${step}` : String(step));
  const v = p.o.val.trim();
  const m = /^([+-]?)(\d+(?:\.\d+)?)$/.exec(v);
  let nv: string | null;
  if (v.startsWith('*')) nv = '*' + Math.round((Number(v.slice(1)) || 1) * (step > 0 ? 1.25 : 0.8) * 100) / 100;
  else if (m && m[1]) {
    const n = (m[1] === '-' ? -1 : 1) * Number(m[2]) + step;
    nv = n > 0 ? `+${n}` : n < 0 ? String(n) : null;
  } else nv = String(Math.max(1, (m ? Number(m[2]) : 0) + step));
  return nv === null ? unwrap(text, p, s, e) : setTagValue(text, s0, e0, 'size', nv);
}

// 자간 {k=}을 step만큼 넓히거나 좁힌다. 이미 자간 태그 안이면 그 값에 더하고, 0이 되면 뺀다
export function stepK(text: string, s0: number, e0: number, step: number): Edit {
  const { pairs, s, e } = prep(text, s0, e0);
  const p = inner(pairs, 'k', s, e);
  if (!p || !(s === e || exact(p, s, e))) return setTagValue(text, s0, e0, 'k', String(step));
  const n = Math.round(((Number(p.o.val) || 0) + step) * 10) / 10;
  return n === 0 ? unwrap(text, p, s, e) : setTagValue(text, s0, e0, 'k', String(n));
}

// 루비: 고른 글을 {rb}…{/rb}로 감싸고 뒤에 {rt}읽는 법{/rt}을 붙인다. 고른 글이 없으면 {rt}만 넣는다(바로 앞 글자 위에 뜸)
// 넣은 뒤에는 읽는 법 자리를 골라 둔다
export function insertRuby(text: string, s0: number, e0: number, hint: string): Edit {
  const { toks, s, e } = prep(text, s0, e0);
  if (s !== e && !balanced(toks, s, e)) return { error: NEST_ERR };
  const head = s === e ? '{rt}' : `{rb}${text.slice(s, e)}{/rb}{rt}`;
  const at = s + head.length;
  return { text: text.slice(0, s) + head + hint + '{/rt}' + text.slice(e), s: at, e: at + hint.length };
}

// 커서가 루비 글({rt}…{/rt}) 안에 있으면 그 루비 글의 크기·색 (없으면 null)
const RUBY_IN = /^((?:\{(?:size|color)=[^}]*\})*)([\s\S]*?)((?:\{\/(?:size|color)\})*)$/;
function rubyPair(text: string, s0: number, e0: number) {
  const { pairs, s, e } = prep(text, s0, e0);
  return pairs.filter((p) => (p.o.name === 'rt' || p.o.name === 'art') && p.o.s <= s && e <= p.c.e).sort((a, b) => b.o.s - a.o.s)[0];
}
export function rubyAt(text: string, s0: number, e0: number): { size?: string; color?: string } | null {
  const p = rubyPair(text, s0, e0);
  if (!p) return null;
  const head = RUBY_IN.exec(text.slice(p.o.e, p.c.s))![1];
  const out: { size?: string; color?: string } = {};
  for (const m of head.matchAll(/\{(size|color)=([^}]*)\}/g)) out[m[1] as 'size' | 'color'] = m[2];
  return out;
}
// 루비 글의 크기·색을 바꾼다 (val이 null이면 뺀다). {rt}{size=14}{color=#f00}읽는 법{/color}{/size}{/rt} 꼴로 다시 적는다
export function setRubyStyle(text: string, s0: number, e0: number, key: 'size' | 'color', val: string | null): Edit {
  const p = rubyPair(text, s0, e0);
  if (!p) return { error: '루비 글({rt}) 안에 커서를 두세요' };
  const cur = rubyAt(text, s0, e0)!;
  if (val === null) delete cur[key];
  else cur[key] = val;
  const core = RUBY_IN.exec(text.slice(p.o.e, p.c.s))![2];
  const open = (cur.size ? `{size=${cur.size}}` : '') + (cur.color ? `{color=${cur.color}}` : '');
  const close = (cur.color ? '{/color}' : '') + (cur.size ? '{/size}' : '');
  const at = p.o.e + open.length;
  return { text: text.slice(0, p.o.e) + open + core + close + text.slice(p.c.s), s: at, e: at + core.length };
}

// 혼자 쓰는 태그를 커서 자리에 넣는다. {nw}는 렌파이에서 글 끝에 있어야 해서 끝에 넣는다
// pick이 있으면 넣은 태그 안의 그 글자(예: 초)를 골라 둔다
export function insertTag(text: string, s0: number, e0: number, tag: string, pick?: string): Sel {
  const toks = tokenize(text);
  if (tag === '{nw}') {
    if (/\{nw\}\s*$/.test(text)) return { text, s: text.length, e: text.length };
    const at = text.trimEnd().length;
    return { text: text.slice(0, at) + tag + text.slice(at), s: at + tag.length, e: at + tag.length };
  }
  const at = snap(toks, Math.max(s0, e0), 1);
  const t = text.slice(0, at) + tag + text.slice(at);
  const k = pick ? tag.indexOf(pick) : -1;
  return k >= 0 ? { text: t, s: at + k, e: at + k + pick!.length } : { text: t, s: at + tag.length, e: at + tag.length };
}

// 고른 곳을 품은 태그들 (단추가 켜져 보이게). 값이 있는 태그는 가장 안쪽 값
export function tagsAt(text: string, s0: number, e0: number): Map<string, string> {
  const { pairs, s, e } = prep(text, s0, e0);
  const out = new Map<string, string>();
  const inside = pairs.filter((p) => holds(p, s, e)).sort((a, b) => a.o.s - b.o.s);
  for (const p of inside) out.set(p.o.name, p.o.val);
  return out;
}
