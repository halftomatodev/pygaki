// 찾기·바꾸기 (3단계, Ctrl+F): 대사·내레이션, 선택지 문구, 선택지 질문, 상자 제목에서 글을 찾고 바꾼다
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store';
import type { Project } from './types';

type Kind = 'line' | 'choice' | 'ask' | 'title';
interface Hit { kind: Kind; box: string; id: string; text: string; at: number }
const KIND_LABEL: Record<Kind, string> = { line: '대사', choice: '선택지', ask: '질문', title: '상자 제목' };

const close = () => useStore.setState({ showFind: false });

function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 찾은 곳 (글 하나에 여러 번 있으면 여러 개)
function findAll(p: Project, q: string, cs: boolean, kinds: Set<Kind>): Hit[] {
  if (!q) return [];
  const re = new RegExp(escRe(q), cs ? 'g' : 'gi');
  const out: Hit[] = [];
  const add = (kind: Kind, box: string, id: string, text: string) => {
    if (!kinds.has(kind)) return;
    for (const m of text.matchAll(re)) out.push({ kind, box, id, text, at: m.index ?? 0 });
  };
  for (const b of p.nodes) {
    add('title', b.id, b.id, b.title);
    for (const l of b.lines) if (l.type === 'say' || l.type === 'narration') add('line', b.id, l.id, l.text);
    if (b.exit.type === 'menu') {
      if (b.exit.ask) add('ask', b.id, b.id, b.exit.ask.text);
      for (const c of b.exit.choices) add('choice', b.id, c.id, c.text);
    }
  }
  return out;
}

// p 안의 그 글을 바꾸기 (at 자리 하나, 또는 at이 없으면 모두)
function replaceIn(p: Project, h: Pick<Hit, 'kind' | 'box' | 'id'>, fn: (t: string) => string) {
  const b = p.nodes.find((n) => n.id === h.box);
  if (!b) return;
  if (h.kind === 'title') b.title = fn(b.title);
  else if (h.kind === 'line') {
    const l = b.lines.find((x) => x.id === h.id);
    if (l) l.text = fn(l.text);
  } else if (b.exit.type === 'menu') {
    if (h.kind === 'ask' && b.exit.ask) b.exit.ask.text = fn(b.exit.ask.text);
    const c = b.exit.choices.find((x) => x.id === h.id);
    if (h.kind === 'choice' && c) c.text = fn(c.text);
  }
}

export function FindPanel() {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const [q, setQ] = useState('');
  const [rep, setRep] = useState('');
  const [cs, setCs] = useState(false);
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(['line', 'choice', 'ask', 'title']));
  const [cur, setCur] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => findAll(project, q, cs, kinds), [project, q, cs, kinds]);
  const at = hits.length ? Math.min(cur, hits.length - 1) : -1;

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  const show = (i: number) => {
    const h = hits[i];
    if (!h) return;
    setCur(i);
    useStore.getState().select([h.box]);
    useStore.getState().focusNodes([h.box]);
    if (h.kind === 'line') useStore.setState({ focusLineId: h.id, activeLine: h.id });
  };
  const step = (d: number) => hits.length && show((at + d + hits.length) % hits.length);

  const replaceOne = () => {
    const h = hits[at];
    if (!h) return;
    update((p) =>
      replaceIn(p, h, (t) => {
        const seg = t.slice(h.at, h.at + q.length);
        const ok = cs ? seg === q : seg.toLowerCase() === q.toLowerCase();
        return ok ? t.slice(0, h.at) + rep + t.slice(h.at + q.length) : t;
      }),
    );
  };
  const replaceAll = () => {
    if (!hits.length) return;
    const re = new RegExp(escRe(q), cs ? 'g' : 'gi');
    const seen = new Set<string>();
    const n = hits.length;
    update((p) => {
      for (const h of hits) {
        const k = h.kind + h.box + h.id;
        if (seen.has(k)) continue;
        seen.add(k);
        replaceIn(p, h, (t) => t.replace(re, () => rep));
      }
    });
    useStore.getState().say(`${n}곳을 바꿨어요 (Ctrl+Z로 되돌려요)`);
  };
  const toggle = (k: Kind) => {
    const s = new Set(kinds);
    if (s.has(k)) s.delete(k);
    else s.add(k);
    setKinds(s);
  };

  return (
    <div
      className="float-panel find"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div className="fp-head">
        <b>찾기·바꾸기</b>
        <span className="tip">{q ? (hits.length ? `${at + 1} / ${hits.length}` : '없어요') : ''}</span>
        <span className="sp" />
        <button onClick={close} title="닫기 (Esc)">✕</button>
      </div>
      <div className="fp-body">
        <div className="row">
          <input ref={input} className="grow" placeholder="찾을 글" value={q} onChange={(e) => (setQ(e.target.value), setCur(0))} onKeyDown={(e) => e.key === 'Enter' && step(e.shiftKey ? -1 : at < 0 ? 0 : 1)} />
          <button onClick={() => step(-1)} disabled={!hits.length} title="앞 (Shift+Enter)">↑</button>
          <button onClick={() => step(1)} disabled={!hits.length} title="다음 (Enter)">↓</button>
        </div>
        <div className="row">
          <input className="grow" placeholder="바꿀 글" value={rep} onChange={(e) => setRep(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && replaceOne()} />
          <button onClick={replaceOne} disabled={at < 0}>바꾸기</button>
          <button onClick={replaceAll} disabled={!hits.length}>모두 바꾸기</button>
        </div>
        <div className="row fp-opts">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <label key={k}>
              <input type="checkbox" checked={kinds.has(k)} onChange={() => toggle(k)} /> {KIND_LABEL[k]}
            </label>
          ))}
          <label title="대문자와 소문자를 가려요">
            <input type="checkbox" checked={cs} onChange={(e) => setCs(e.target.checked)} /> Aa
          </label>
        </div>
        <div className="fp-list">
          {hits.slice(0, 300).map((h, i) => {
            const box = project.nodes.find((n) => n.id === h.box);
            const a = Math.max(0, h.at - 16);
            return (
              <button key={i} className={'fp-hit' + (i === at ? ' on' : '')} onClick={() => show(i)}>
                <span className="tip">{KIND_LABEL[h.kind]} · {box?.title || h.box}</span>
                <span className="fp-text">
                  {a > 0 ? '…' : ''}
                  {h.text.slice(a, h.at)}
                  <mark>{h.text.slice(h.at, h.at + q.length)}</mark>
                  {h.text.slice(h.at + q.length, h.at + q.length + 30)}
                </span>
              </button>
            );
          })}
          {hits.length > 300 && <p className="tip">… {hits.length - 300}곳 더</p>}
        </div>
      </div>
    </div>
  );
}
