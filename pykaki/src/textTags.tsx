// 렌파이 텍스트 태그 일부를 흉내 내서 보여 준다: {b} {i} {u} {s} {color=} {size=} {p} {w} {nw} {fast} {a=}
import type { CSSProperties, ReactNode } from 'react';
import { tokenize } from './tagEdit';

// 플레이 화면용: 글자 하나씩으로 나눈다. 언제 멈출지(stops)와 글자별 속도도 함께
// shader: 이 글자에만 거는 등장 효과 ({shader=이름}글{/shader}. 가장 안쪽 것)
export interface Glyph { ch: string; style: CSSProperties; rate: number; shader?: string } // rate: 글자 속도 배율, 또는 fixed면 글자/초
export interface Stop { at: number; sec: number | null } // at번째 글자 앞에서 멈춤. sec가 null이면 클릭할 때까지
export interface Tagged { glyphs: (Glyph & { fixed: boolean })[]; stops: Stop[]; noWait: boolean; fastTo: number }

export function parseTagged(text: string, tagsOn: boolean, fontOf: (path: string) => string | undefined): Tagged {
  const out: Tagged = { glyphs: [], stops: [], noWait: false, fastTo: 0 };
  const stack: { name: string; style: CSSProperties; rate?: number; fixed?: boolean; shader?: string }[] = [];
  const add = (s: string) => {
    let rate = 1;
    let fixed = false;
    let shader: string | undefined;
    const style: CSSProperties = {};
    for (const e of stack) {
      Object.assign(style, e.style);
      if (e.rate !== undefined) (rate = e.rate, (fixed = !!e.fixed));
      if (e.shader) shader = e.shader;
    }
    for (const ch of Array.from(s)) out.glyphs.push({ ch, style, rate, fixed, shader });
  };
  if (!tagsOn) return add(text), out;

  for (let i = 0; i < text.length; ) {
    if (text.startsWith('{{', i)) {
      add('{');
      i += 2;
      continue;
    }
    if (text[i] !== '{') {
      const j = text.indexOf('{', i);
      const end = j < 0 ? text.length : j;
      add(text.slice(i, end));
      i = end;
      continue;
    }
    const j = text.indexOf('}', i);
    if (j < 0) {
      add(text.slice(i));
      break;
    }
    const tag = text.slice(i + 1, j);
    i = j + 1;
    if (tag.startsWith('/')) {
      const name = tag.slice(1);
      for (let k = stack.length - 1; k >= 0; k--) if (stack[k].name === name || !name) {
        stack.splice(k, 1);
        break;
      }
      continue;
    }
    const eq = tag.indexOf('=');
    const name = eq < 0 ? tag : tag.slice(0, eq);
    const val = eq < 0 ? '' : tag.slice(eq + 1);
    const push = (style: CSSProperties, rate?: number, fixed?: boolean) => stack.push({ name, style, rate, fixed });
    if (name === 'b') push({ fontWeight: 'bold' });
    else if (name === 'i') push({ fontStyle: 'italic' });
    else if (name === 'u' || name === 'a') push({ textDecoration: 'underline' });
    else if (name === 's') push({ textDecoration: 'line-through' });
    else if (name === 'color') push({ color: val });
    else if (name === 'alpha') push({ opacity: Number(val.replace(/^[*+-]/, '')) || undefined });
    else if (name === 'font') push({ fontFamily: fontOf(val) });
    else if (name === 'k') push({ letterSpacing: Number(val) || undefined });
    else if (name === 'rt') push({ fontSize: '0.5em', verticalAlign: 'super' }); // 루비는 위에 올리지 못하고 작은 글로만
    else if (name === 'rb') push({});
    else if (name === 'shader') stack.push({ name, style: {}, shader: val.trim() });
    else if (name === 'size') {
      const m = /^([*+-]?)([\d.]+)$/.exec(val);
      const n = m ? Number(m[2]) : 0;
      push(!m ? {} : m[1] === '*' ? { fontSize: n + 'em' } : m[1] === '+' ? { fontSize: `calc(1em + ${n}px)` } : m[1] === '-' ? { fontSize: `calc(1em - ${n}px)` } : { fontSize: n });
    } else if (name === 'cps') {
      if (val.startsWith('*')) push({}, Number(val.slice(1)) || 1);
      else push({}, Number(val) || 0, true);
    } else if (name === 'w' || name === 'p') {
      out.stops.push({ at: out.glyphs.length, sec: val ? Number(val) : null });
      if (name === 'p') add('\n');
    } else if (name === 'nw') out.noWait = true;
    else if (name === 'fast') out.fastTo = out.glyphs.length;
    else if (!['image', 'space', 'vspace', 'rt', 'rb', 'art', 'done'].includes(name)) add('{' + tag + '}');
  }
  return out;
}

// 선택지 글처럼 한 번에 보이는 글: 대사와 같은 읽기(parseTagged)로 모양만 입힌다. 멈춤, 속도, 효과 태그는 뜻이 없어 넘긴다
export function renderTagged(text: string, tagsOn: boolean, fontOf: (path: string) => string | undefined = () => undefined): ReactNode[] {
  if (!tagsOn) return [text];
  const out: ReactNode[] = [];
  let buf = '';
  let style: CSSProperties | undefined;
  let k = 0;
  const flush = () => {
    if (buf) out.push(<span key={k++} style={style}>{buf}</span>);
    buf = '';
  };
  for (const g of parseTagged(text, true, fontOf).glyphs) {
    if (g.style !== style) (flush(), (style = g.style));
    if (g.ch === '\n') (flush(), out.push(<br key={k++} />));
    else buf += g.ch;
  }
  flush();
  return out;
}

// 상자 보기 화면용: 태그 글자는 흐리게 그대로 두고, 안쪽 글에 모양을 입힌다.
// 고칠 때(textarea)와 같은 자리, 같은 크기여야 해서 글자 수와 크기는 바꾸지 않는다 (굵게는 폭이 안 변하는 그림자로)
const VIEW_STYLE: Record<string, (v: string) => CSSProperties> = {
  b: () => ({ textShadow: '0.4px 0 0 currentColor, -0.4px 0 0 currentColor' }),
  i: () => ({ fontStyle: 'italic' }),
  u: () => ({ textDecoration: 'underline' }),
  a: () => ({ textDecoration: 'underline' }),
  s: () => ({ textDecoration: 'line-through' }),
  color: (v) => ({ color: v }),
  alpha: (v) => (/^(?:0|1|0?\.\d+)$/.test(v) ? { opacity: Math.max(0.15, Number(v)) } : {}), // 다 안 보이면 고칠 수 없으니 조금은 남긴다
};

export function TagView({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const stack: { name: string; style: CSSProperties }[] = [];
  tokenize(text).forEach((t, k) => {
    const raw = text.slice(t.s, t.e);
    if (t.k === 'text' || t.k === 'esc') {
      const deco = stack.map((x) => x.style.textDecoration).filter(Boolean).join(' ');
      const style = Object.assign({}, ...stack.map((x) => x.style), deco ? { textDecoration: deco } : {});
      out.push(<span key={k} style={style}>{raw}</span>);
      return;
    }
    out.push(<span key={k} className={'tg' + (t.k === 'self' ? ' tg-stop' : '')}>{raw}</span>);
    if (t.k === 'open') stack.push({ name: t.name, style: VIEW_STYLE[t.name]?.(t.val) ?? {} });
    else if (t.k === 'close') stack.pop();
  });
  return <>{out}</>;
}
