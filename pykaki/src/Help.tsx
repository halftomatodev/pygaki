// 도움말: 화면의 긴 설명은 모두 여기로 모은다. 내용은 docs/GUIDE.md 그대로 (빌드할 때 가져옴, 문서와 늘 같음)
// - 화면에는 ⓘ(Hint)만 두고, 마우스를 올리면 짧은 설명, 누르면 도움말의 그 항목이 열린다
// - 메뉴 [도움말]이나 F1로 연다
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import guide from '../docs/GUIDE.md?raw';

// 열린 도움말과 볼 항목 (항목은 제목의 일부 글자. 예: "셰이더")
export const useHelp = create<{ open: boolean; topic: string; n: number }>(() => ({ open: false, topic: '', n: 0 }));
export const openHelp = (topic = '') => useHelp.setState((s) => ({ open: true, topic, n: s.n + 1 }));

// 칸 이름 옆의 ⓘ. 올리면 짧은 설명(text), 누르면 도움말의 topic 항목
// 설명은 칸의 스크롤에 잘리지 않게 화면 맨 위 층(HintTip)에 그린다
const useTip = create<{ text: string; x: number; y: number } | null>(() => null);

export function Hint({ text, topic }: { text: string; topic?: string }) {
  return (
    <span
      className="hint-i"
      aria-label={text}
      role="button"
      tabIndex={-1}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        useTip.setState({ text, x: r.left + r.width / 2, y: r.bottom }, true);
      }}
      onMouseLeave={() => useTip.setState(null, true)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        useTip.setState(null, true);
        openHelp(topic ?? '');
      }}
    >
      i
    </span>
  );
}

export function HintTip() {
  const tip = useTip();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!tip || !ref.current) return setPos(null);
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, tip.x - w / 2));
    const below = tip.y + 6;
    const top = below + h > window.innerHeight - 8 ? tip.y - 14 - 6 - h : below;
    setPos({ left, top });
  }, [tip]);
  if (!tip) return null;
  return (
    <div ref={ref} className="hint-tip" style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}>
      {tip.text}
    </div>
  );
}

// ---------- GUIDE.md → 화면 ----------
type Sec = { id: string; level: number; title: string; lines: string[] };

const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

function sections(md: string): Sec[] {
  const rv: Sec[] = [{ id: 's0', level: 1, title: '처음에', lines: [] }];
  let fence = false;
  for (const line of md.split(/\r?\n/)) {
    if (line.startsWith('```')) fence = !fence;
    const h = !fence && /^(#{1,3}) (.+)$/.exec(line);
    if (h) {
      if (h[1].length === 1) continue; // 맨 위 제목
      rv.push({ id: 's' + rv.length, level: h[1].length, title: plain(h[2]), lines: [] });
    } else rv[rv.length - 1].lines.push(line);
  }
  return rv.filter((s) => s.lines.some((l) => l.trim() && l.trim() !== '---') || s.level === 2);
}

// 글 속 **굵게**, `코드`, [글](주소)(주소는 빼고 글만)
function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={key + '-' + i++}>{inline(m[1], i)}</b>);
    else if (m[2] !== undefined) out.push(<code key={key + '-' + i++}>{m[2]}</code>);
    else out.push(m[3]);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function Body({ lines }: { lines: string[] }) {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) code.push(lines[i]);
      i++;
      out.push(<pre key={i} className="rpy small">{code.join('\n')}</pre>);
    } else if (l.startsWith('|')) {
      const rows: string[][] = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) {
        if (/^\|[\s:|-]+\|$/.test(lines[i])) continue;
        rows.push(lines[i].replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      }
      out.push(
        <table key={i}>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => (ri === 0 ? <th key={ci}>{inline(c)}</th> : <td key={ci}>{inline(c)}</td>))}</tr>
            ))}
          </tbody>
        </table>,
      );
    } else if (/^\s*([-*]|\d+\.) /.test(l)) {
      const items: [number, string][] = [];
      for (; i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i]); i++) {
        const m = /^(\s*)(?:[-*]|\d+\.) (.*)$/.exec(lines[i])!;
        items.push([Math.floor(m[1].length / 2), m[2]]);
        // 다음 줄이 들여 쓴 이어지는 글이면 붙인다
        while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*([-*]|\d+\.) /.test(lines[i + 1])) items[items.length - 1][1] += ' ' + lines[++i].trim();
      }
      out.push(
        <ul key={i}>
          {items.map(([d, t], k) => (
            <li key={k} style={d ? { marginLeft: d * 16 } : undefined}>{inline(t)}</li>
          ))}
        </ul>,
      );
    } else if (l.startsWith('>')) {
      out.push(<blockquote key={i}>{inline(l.replace(/^>\s?/, ''))}</blockquote>);
      i++;
    } else if (!l.trim() || l.trim() === '---') {
      i++;
    } else {
      const para: string[] = [];
      for (; i < lines.length && lines[i].trim() && !/^(\s*([-*]|\d+\.) |\||```|>)/.test(lines[i]); i++) para.push(lines[i].trim());
      out.push(<p key={i}>{inline(para.join(' '))}</p>);
    }
  }
  return <>{out}</>;
}

const SECS = sections(guide);

export function HelpModal() {
  const { open, topic, n } = useHelp();
  const [q, setQ] = useState('');
  const [cur, setCur] = useState('s0');
  const bodyRef = useRef<HTMLDivElement>(null);

  // ⓘ로 열면 그 항목으로 (제목에 topic이 든 첫 항목)
  useEffect(() => {
    if (!open) return;
    setQ('');
    const t = topic.trim();
    const hit = t ? SECS.find((s) => s.title.includes(t)) : undefined;
    setCur(hit?.id ?? 's0');
  }, [open, topic, n]);
  useEffect(() => {
    if (open && !q) bodyRef.current?.querySelector('#help-' + cur)?.scrollIntoView({ block: 'start' });
  }, [cur, open, q]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && useHelp.setState({ open: false });
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return SECS;
    return SECS.filter((s) => (s.title + '\n' + s.lines.join('\n')).toLowerCase().includes(t));
  }, [q]);

  if (!open) return null;
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && useHelp.setState({ open: false })}>
      <div className="modal help-modal">
        <div className="help-head">
          <h3>도움말</h3>
          <input placeholder="찾기" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <button onClick={() => useHelp.setState({ open: false })}>닫기</button>
        </div>
        <div className="help-main">
          <nav className="help-toc">
            {shown.map((s) => (
              <button key={s.id} className={(s.id === cur ? 'on ' : '') + 'lv' + s.level} onClick={() => (setQ(''), setCur(s.id))}>
                {s.title}
              </button>
            ))}
            {!shown.length && <span className="tip">찾는 글이 없어요.</span>}
          </nav>
          <div className="help-body" ref={bodyRef}>
            {shown.map((s) => (
              <section key={s.id} id={'help-' + s.id}>
                {s.level === 2 ? <h2>{s.title}</h2> : <h3>{s.title}</h3>}
                <Body lines={s.lines} />
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
