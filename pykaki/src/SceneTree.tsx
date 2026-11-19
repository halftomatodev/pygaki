// 왼쪽 칸의 장면·캐릭터 트리 (세션 82, UI_PLAN 정할 것 B "섞기"). 패턴: Tree View (WAI-ARIA treeview)
// 장면(label) 아래에 그 장면의 상자, 캐릭터 아래에 캐릭터. 줄은 글만 보이고, ✎(또는 더블클릭·F2)로 그 자리에서 고친다.
// 상자 줄을 누르면 캔버스에서 그 상자를 고르고 그쪽으로 옮긴다. 캔버스에서 상자를 고르면 그 장면이 펴지고 줄이 보이게 스크롤된다.
// 키보드: ↑↓ 줄 옮기기, → 펴기·첫 줄로, ← 접기·부모로, Enter 고르기(가지는 펴고 접기), F2 고치기, Home·End.
// 렌파이 원래 말(label, define)은 쉬운 말 옆에 회색 작은 글로 (정할 것 E)
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useStore } from './store';
import { Hint } from './Help';
import * as ops from './ops';
import type { BoxNode, Character, LabelGroup } from './types';
import { IDENT, RESERVED } from './util';

const OPEN_KEY = 'pygaki-tree-open';
type Open = Record<string, boolean>;
const ROOT_SCENES = 'scenes';
const ROOT_CHARS = 'chars';

function loadOpen(): Open {
  try {
    const v = JSON.parse(localStorage.getItem(OPEN_KEY) ?? 'null');
    if (v && typeof v === 'object') return v;
  } catch {
    // 기억 못 해도 처음 모습으로
  }
  return { [ROOT_SCENES]: true, [ROOT_CHARS]: true };
}

// 보이는 줄 하나 (키보드 이동에 쓰는 납작한 목록)
interface Row {
  key: string; // 'scenes' | 'chars' | 'g:<id>' | 'b:<id>' | 'c:<i>'
  parent: string | null;
  branch: boolean;
}

const byPos = (a: BoxNode, b: BoxNode) => a.pos.y - b.pos.y || a.pos.x - b.pos.x;

export function SceneTree() {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const selected = useStore((s) => s.selectedIds);
  const [open, setOpen] = useState<Open>(loadOpen);
  const [focus, setFocus] = useState<string>(ROOT_SCENES);
  const [editing, setEditing] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open));
    } catch {
      // 저장 못 해도 이번 창에서는 그대로
    }
  }, [open]);

  const boxesOf = useMemo(() => {
    const m = new Map<string, BoxNode[]>();
    for (const n of project.nodes) {
      const list = m.get(n.group) ?? [];
      list.push(n);
      m.set(n.group, list);
    }
    for (const list of m.values()) list.sort(byPos);
    return m;
  }, [project.nodes]);

  // 캔버스에서 상자를 고르면 그 장면을 펴고 줄이 보이게
  const first = selected[0];
  useEffect(() => {
    if (!first) return;
    const n = useStore.getState().project.nodes.find((x) => x.id === first);
    if (!n) return;
    setOpen((o) => (o[ROOT_SCENES] && o['g:' + n.group] ? o : { ...o, [ROOT_SCENES]: true, ['g:' + n.group]: true }));
    requestAnimationFrame(() => refs.current.get('b:' + first)?.scrollIntoView({ block: 'nearest' }));
  }, [first]);

  const rows = useMemo(() => {
    const r: Row[] = [{ key: ROOT_SCENES, parent: null, branch: true }];
    if (open[ROOT_SCENES])
      for (const g of project.labels) {
        r.push({ key: 'g:' + g.id, parent: ROOT_SCENES, branch: true });
        if (open['g:' + g.id]) for (const b of boxesOf.get(g.id) ?? []) r.push({ key: 'b:' + b.id, parent: 'g:' + g.id, branch: false });
      }
    r.push({ key: ROOT_CHARS, parent: null, branch: true });
    if (open[ROOT_CHARS]) project.characters.forEach((_, i) => r.push({ key: 'c:' + i, parent: ROOT_CHARS, branch: false }));
    return r;
  }, [project.labels, project.characters, boxesOf, open]);

  const cur = rows.some((r) => r.key === focus) ? focus : rows[0].key;
  const toggle = (key: string, v?: boolean) => setOpen((o) => ({ ...o, [key]: v ?? !o[key] }));
  const move = (key: string) => {
    setFocus(key);
    // 고치기를 마친 직후에는 줄이 아직 다시 그려지지 않았으니 다음 프레임에
    const el = refs.current.get(key);
    if (el) el.focus();
    else requestAnimationFrame(() => refs.current.get(key)?.focus());
  };
  const goBox = (id: string) => {
    useStore.getState().select([id]);
    useStore.getState().focusNodes([id]);
  };
  const activate = (r: Row) => {
    if (r.key.startsWith('b:')) goBox(r.key.slice(2));
    else if (r.branch) toggle(r.key);
    else setEditing(r.key);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing || (e.target as HTMLElement).closest('input, button')) return;
    const i = rows.findIndex((r) => r.key === cur);
    const r = rows[i];
    if (!r) return;
    const k = e.key;
    if (k === 'ArrowDown' && i < rows.length - 1) move(rows[i + 1].key);
    else if (k === 'ArrowUp' && i > 0) move(rows[i - 1].key);
    else if (k === 'Home') move(rows[0].key);
    else if (k === 'End') move(rows[rows.length - 1].key);
    else if (k === 'ArrowRight' && r.branch) {
      if (!open[r.key]) toggle(r.key, true);
      else if (rows[i + 1]?.parent === r.key) move(rows[i + 1].key);
    } else if (k === 'ArrowLeft') {
      if (r.branch && open[r.key]) toggle(r.key, false);
      else if (r.parent) move(r.parent);
    } else if (k === 'Enter' || k === ' ') activate(r);
    else if (k === 'F2' && (r.key.startsWith('g:') || r.key.startsWith('c:'))) setEditing(r.key);
    else return;
    e.preventDefault();
  };

  const addLabel = () => {
    let id = '';
    update((p) => void (id = ops.addGroup(p)));
    setOpen((o) => ({ ...o, [ROOT_SCENES]: true }));
    setEditing('g:' + id);
  };
  const addChar = () => {
    let i = 0;
    update((p) => {
      let n = p.characters.length + 1;
      while (p.characters.some((c) => c.id === 'c' + n)) n++;
      p.characters.push({ id: 'c' + n, name: '새 캐릭터', color: '#c8c8ff' });
      i = p.characters.length - 1;
    });
    setOpen((o) => ({ ...o, [ROOT_CHARS]: true }));
    setEditing('c:' + i);
  };

  // 줄 하나의 공통 틀: 들여쓰기, ▸, 키보드 초점(roving tabindex)
  const row = (key: string, level: number, body: ReactNode, opts: { branch?: boolean; sel?: boolean; testid: string; onClick?: () => void; onDouble?: () => void }) => (
    <div
      key={key}
      ref={(el) => void (el ? refs.current.set(key, el) : refs.current.delete(key))}
      role="treeitem"
      aria-level={level}
      aria-expanded={opts.branch ? !!open[key] : undefined}
      aria-selected={opts.sel || undefined}
      tabIndex={cur === key ? 0 : -1}
      className={'tree-row' + (opts.sel ? ' sel' : '') + (opts.branch ? ' branch' : '')}
      style={{ paddingLeft: 4 + (level - 1) * 14 }}
      data-testid={opts.testid}
      onFocus={() => setFocus(key)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, input, .hint-i')) return;
        opts.onClick?.();
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('button, input')) return;
        opts.onDouble?.();
      }}
    >
      <span className="tree-car" aria-hidden>
        {opts.branch ? '▸' : ''}
      </span>
      {body}
    </div>
  );

  const out: ReactNode[] = [];
  out.push(
    row(
      ROOT_SCENES,
      1,
      <>
        <span className="tree-name strong">장면</span>
        <span className="tree-orig">label</span>
        <Hint text="상자를 묶는 장면. 렌파이 label 하나가 돼요" topic="label(장면) 관리" />
        <span className="sp" />
        <button className="tree-add" onClick={addLabel} data-testid="tree-add-label" title="새 장면(label) 만들기">
          + 장면
        </button>
      </>,
      { branch: true, testid: 'tree-scenes', onClick: () => toggle(ROOT_SCENES) },
    ),
  );
  if (open[ROOT_SCENES])
    for (const g of project.labels) {
      const key = 'g:' + g.id;
      const boxes = boxesOf.get(g.id) ?? [];
      out.push(
        editing === key ? (
          <LabelEdit key={key} g={g} onDone={() => (setEditing(null), move(key))} />
        ) : (
          row(key, 2, <LabelLine g={g} count={boxes.length} onEdit={() => setEditing(key)} />, {
            branch: true,
            testid: 'tree-label-' + g.name,
            onClick: () => toggle(key),
            onDouble: () => setEditing(key),
          })
        ),
      );
      if (open[key])
        for (const b of boxes)
          out.push(
            row(
              'b:' + b.id,
              3,
              <>
                <span className="tree-box" aria-hidden />
                <span className={'tree-name' + (b.title ? '' : ' none')} title={b.title || undefined}>{b.title || '(제목 없음)'}</span>
              </>,
              { sel: selected.includes(b.id), testid: 'tree-box-' + b.id, onClick: () => goBox(b.id) },
            ),
          );
    }
  out.push(
    row(
      ROOT_CHARS,
      1,
      <>
        <span className="tree-name strong">캐릭터</span>
        <span className="tree-orig">define</span>
        <Hint text="대사를 말할 캐릭터. 내레이션은 등록하지 않아도 돼요" topic="캐릭터 등록" />
        <span className="sp" />
        <button className="tree-add" onClick={addChar} data-testid="tree-add-char" title="새 캐릭터 만들기">
          + 캐릭터
        </button>
      </>,
      { branch: true, testid: 'tree-chars', onClick: () => toggle(ROOT_CHARS) },
    ),
  );
  if (open[ROOT_CHARS]) {
    if (!project.characters.length) out.push(<p key="c-none" className="tip tree-empty">캐릭터가 없어요. [+ 캐릭터]로 만들어요.</p>);
    project.characters.forEach((c, i) => {
      const key = 'c:' + i;
      out.push(
        editing === key ? (
          <CharEdit key={key} c={c} i={i} onDone={() => (setEditing(null), move(key))} />
        ) : (
          row(key, 2, <CharLine c={c} i={i} onEdit={() => setEditing(key)} />, { testid: 'tree-char-' + c.id, onDouble: () => setEditing(key) })
        ),
      );
    });
  }

  return (
    <div className="scene-tree" role="tree" aria-label="장면과 캐릭터" data-testid="scene-tree" onKeyDown={onKey}>
      {out}
    </div>
  );
}

// ── 장면 줄과 고치기 ──

function LabelLine({ g, count, onEdit }: { g: LabelGroup; count: number; onEdit: () => void }) {
  const update = useStore((s) => s.update);
  const ids = useStore((s) => s.project.nodes).filter((n) => n.group === g.id).map((n) => n.id);
  const focusAll = () => {
    if (!ids.length) return;
    useStore.getState().select(ids);
    useStore.getState().focusNodes(ids);
  };
  return (
    <>
      <span className="tree-dot" style={{ background: g.color }} aria-hidden />
      <span className="tree-name" title={g.title ? `${g.title} (${g.name})` : g.name}>{g.title || g.name}</span>
      {g.title && <span className="tree-orig mono">{g.name}</span>}
      <span className="sp" />
      <span className="tree-acts">
        <button onClick={onEdit} title="이름·제목·색 고치기 (F2, 더블클릭)" aria-label="장면 고치기" data-testid="tree-edit">
          ✎
        </button>
        <button
          className="x"
          disabled={!!count}
          onClick={() => update((p) => void (p.labels = p.labels.filter((l) => l.id !== g.id)))}
          title={count ? '상자가 남아 있으면 지울 수 없어요' : '장면 지우기'}
          aria-label="장면 지우기"
          data-testid="tree-del"
        >
          ✕
        </button>
      </span>
      <button className="tree-count" onClick={focusAll} disabled={!count} title="이 장면의 상자들로 이동하고 모두 선택">
        {count}
      </button>
    </>
  );
}

function LabelEdit({ g, onDone }: { g: LabelGroup; onDone: () => void }) {
  const update = useStore((s) => s.update);
  const labels = useStore((s) => s.project.labels);
  const bad = !IDENT.test(g.name) || RESERVED.has(g.name) || labels.some((o) => o.id !== g.id && o.name === g.name);
  const set = (fn: (x: LabelGroup) => void, key?: string) => update((p) => fn(p.labels.find((l) => l.id === g.id)!), key);
  const keys = (e: KeyboardEvent) => (e.key === 'Enter' || e.key === 'Escape') && (e.preventDefault(), onDone());
  return (
    <div className="tree-edit" style={{ borderLeftColor: g.color }} data-testid={'tree-label-edit-' + g.name} onKeyDown={keys}>
      <div className="item">
        <input type="color" value={g.color} onChange={(e) => set((x) => void (x.color = e.target.value), 'gcolor' + g.id)} aria-label="장면 색" />
        <input autoFocus className={'gname' + (bad ? ' invalid' : '')} value={g.name} onChange={(e) => set((x) => void (x.name = e.target.value.replace(/\s/g, '_')), 'gname' + g.id)} title="렌파이 label 이름 (영문·숫자·_)" aria-label="label 이름" />
        <button onClick={onDone} title="다 고쳤어요 (Enter)" data-testid="tree-edit-done">
          ✓
        </button>
      </div>
      <input className="gtitle" value={g.title} onChange={(e) => set((x) => void (x.title = e.target.value), 'gtitle' + g.id)} placeholder="표시 제목 (한글 가능)" aria-label="표시 제목" />
    </div>
  );
}

// ── 캐릭터 줄과 고치기 ──

function CharLine({ c, i, onEdit }: { c: Character; i: number; onEdit: () => void }) {
  const update = useStore((s) => s.update);
  const remove = () => {
    const used = useStore.getState().project.nodes.some((n) => n.lines.some((l) => l.who === c.id));
    if (used && !confirm(`${c.name}의 대사가 남아 있어요. 그래도 지울까요? (대사는 "등록되지 않은 화자"로 남아요)`)) return;
    update((p) => void p.characters.splice(i, 1));
  };
  return (
    <>
      <span className="tree-dot round" style={{ background: c.color }} aria-hidden />
      <span className="tree-name" title={`${c.name} (${c.id})`}>{c.name}</span>
      <span className="tree-orig mono">{c.id}</span>
      <span className="sp" />
      <span className="tree-acts">
        <button onClick={onEdit} title="이름·변수·색 고치기 (F2, 더블클릭)" aria-label="캐릭터 고치기" data-testid="tree-edit">
          ✎
        </button>
        <button className="x" onClick={remove} title="캐릭터 지우기" aria-label="캐릭터 지우기" data-testid="tree-del">
          ✕
        </button>
      </span>
    </>
  );
}

function CharEdit({ c, i, onDone }: { c: Character; i: number; onDone: () => void }) {
  const update = useStore((s) => s.update);
  const chars = useStore((s) => s.project.characters);
  const [id, setId] = useState(c.id);
  useEffect(() => setId(c.id), [c.id]);
  const bad = !IDENT.test(id) || RESERVED.has(id) || chars.some((o, j) => j !== i && o.id === id);

  // id는 마칠 때 확정하고, 그 캐릭터의 대사도 같이 바꾼다
  const commit = () => {
    if (id === c.id) return true;
    if (bad) {
      alert(`"${id}"는 캐릭터 id로 쓸 수 없어요 (영문·숫자·_ , 중복 불가)`);
      setId(c.id);
      return false;
    }
    update((p) => {
      p.characters[i].id = id;
      for (const n of p.nodes) for (const l of n.lines) if (l.type === 'say' && l.who === c.id) l.who = id;
    });
    return true;
  };
  const done = () => commit() && onDone();
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return e.preventDefault(), setId(c.id), onDone();
    if (e.key === 'Enter') e.preventDefault(), done();
  };
  return (
    <div className="tree-edit" style={{ borderLeftColor: c.color }} data-testid={'tree-char-edit-' + c.id} onKeyDown={keys}>
      <div className="item">
        <input type="color" value={c.color} onChange={(e) => update((p) => void (p.characters[i].color = e.target.value), 'ccolor' + i)} aria-label="캐릭터 색" />
        <input autoFocus value={c.name} onChange={(e) => update((p) => void (p.characters[i].name = e.target.value), 'cname' + i)} placeholder="표시 이름" aria-label="표시 이름" />
        <button onClick={done} title="다 고쳤어요 (Enter)" data-testid="tree-edit-done">
          ✓
        </button>
      </div>
      <input className={'cid' + (bad ? ' invalid' : '')} value={id} onChange={(e) => setId(e.target.value)} onBlur={commit} title="렌파이 변수 이름 (예: a, alice)" aria-label="변수 이름" />
    </div>
  );
}
