import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStore } from './store';
import * as ops from './ops';
import type { BoxNode, BoxShader, Line } from './types';
import { shaderLabel } from './shader';
import { isLight, uid } from './util';
import { changeThenFocus } from './actions';
import { FlowMenu } from './FlowMenu';
import { OldAttr, SpeakerSelect, StageFields } from './LineFields';
import { isStage, stageCode } from './stage';
import { actionWords, condWords } from './flags';
import { ActionInput, CondInput } from './FlagFields';
import { hit, keyOf } from './prefs';
import { TagBar, useTagTarget } from './TagBar';
import { TagView } from './textTags';

// 볼 때와 글을 고칠 때 상자 모양이 같다. 고칠 때는 글자 자리가 입력칸으로 바뀌고,
// 줄 종류·순서·삭제 단추는 상자 왼쪽 바깥에, 연출 입력칸은 오른쪽 바깥에 붙는다
export const BoxView = memo(function BoxView({ id, selected }: NodeProps) {
  // 지금 커서가 있는 줄이나 선택지·조건 (그 자리 왼쪽에 단추 묶음이 붙는다)
  const [active, setActive] = useState<string | null>(null);
  const project = useStore((s) => s.project);
  const editing = useStore((s) => s.inlineEdit === id);
  const update = useStore((s) => s.update);
  const tagTarget = useTagTarget((s) => s.id);
  const b = project.nodes.find((n) => n.id === id);
  if (!b) return null;
  // 태그 상자: 이 상자에서 대사·내레이션 글 칸에 커서가 있을 때
  const tagLine = editing && tagTarget?.startsWith('in-') ? b.lines.find((l) => 'in-' + l.id === tagTarget && isSayLine(l)) : undefined;
  const g = project.labels.find((l) => l.id === b.group);
  const isEntry = g?.entry === b.id;
  const isStart = project.project.startNode === b.id;
  const tb = project.layout.direction === 'TB';
  const cls = ['box', selected && 'sel', editing && 'editing'].filter(Boolean).join(' ');
  const onEsc = (e: React.KeyboardEvent) => e.key === 'Escape' && useStore.setState({ inlineEdit: null });
  return (
    <div className={cls + (b.color ? ' own-color' : '')} style={{ '--g': b.color ?? g?.color ?? 'var(--panel)', ...(b.color && { '--own-bt': isLight(b.color) ? '#1c1c1e' : '#ffffff' }) } as React.CSSProperties}>
      {editing && <FlowMenu b={b} />}
      {tagLine && <TagBar targetId={'in-' + tagLine.id} className="tagbar-box" />}
      <Handle type="target" id="in" position={tb ? Position.Top : Position.Left} />
      <div className="box-head">
        <span className="badge" title="렌파이 label">
          {g?.name ?? '?'}
          {!isEntry && <small>.{b.id}</small>}
        </span>
        {isStart && <span className="badge start">시작</span>}
        {editing ? (
          <input
            id={'in-title-' + b.id}
            className="nodrag box-title ed"
            value={b.title}
            placeholder="(제목 없음)"
            onKeyDown={onEsc}
            onChange={(e) => update((p) => void (ops.findBox(p, b.id)!.title = e.target.value), 'title' + b.id)}
          />
        ) : (
          <span className="box-title" data-part="title">{b.title || '(제목 없음)'}</span>
        )}
        <ShaderButton kind="box" id={b.id} own={b.shader} inherited={g?.shader} />
      </div>
      <Lines b={b} editing={editing} active={active} setActive={setActive} />
      <Exits b={b} editing={editing} tb={tb} active={active} setActive={setActive} />
    </div>
  );
});

const isSayLine = (l: Line) => l.type === 'say' || l.type === 'narration';

// 상자 아래 다음 흐름. 선택지와 조건 갈래는 대사 줄처럼 커서가 들어가면 왼쪽 바깥에 ⠿ ＋ ✕ 묶음이 붙고,
// ⠿로 끌어 순서를 바꾼다. 선은 선택지·갈래 id에 붙어 있어서 순서를 바꿔도 끊기지 않는다. "그 밖"은 늘 맨 끝
function Exits({ b, editing, tb, active, setActive }: { b: BoxNode; editing: boolean; tb: boolean } & ActiveProps) {
  const update = useStore((s) => s.update);
  const wrap = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(null);
  const ex = b.exit;
  const isMenu = ex.type === 'menu';
  const rows: { id: string }[] = ex.type === 'menu' ? ex.choices : ex.type === 'if' ? ex.branches : [];
  // 고칠 갈래 목록 (선택지면 choices, 조건이면 branches)
  const list = (p: Parameters<Parameters<typeof update>[0]>[0]): { id: string }[] | null => {
    const x = ops.findBox(p, b.id)!.exit;
    return x.type === 'menu' ? x.choices : x.type === 'if' ? x.branches : null;
  };
  const drag = usePtrDrag(wrap, '[data-row]', (from, to) => update((p) => void (list(p) && ops.moveIn(list(p)!, from, to))));
  const onEsc = (e: React.KeyboardEvent) => e.key === 'Escape' && useStore.setState({ inlineEdit: null });

  const ai = editing ? rows.findIndex((r) => r.id === active) : -1;

  // 단추 묶음이 지금 갈래 높이를 따라가게 (상자 안 좌표)
  useLayoutEffect(() => {
    const row = ai >= 0 ? (wrap.current?.querySelector(`[data-row="${rows[ai].id}"]`) as HTMLElement | null) : null;
    const t = row ? row.offsetTop : null;
    if (t !== top) setTop(t);
  });

  const focus = (id: string) => requestAnimationFrame(() => document.getElementById('in-' + id)?.focus());
  const addAfter = (i: number) => {
    const c = isMenu ? ops.newChoice() : ops.newBranch();
    changeThenFocus(() => update((p) => void list(p)?.splice(i + 1, 0, c as never)), 'in-' + c.id);
  };
  // 하나 지우기. 커서는 앞 갈래(없으면 다음)로. 마지막 하나를 지우면 선택지·조건 분기 자체를 없애고
  // "→ 다음"으로 돌린다(그 갈래가 이어져 있던 상자로 이어짐). 커서는 상자 마지막 줄로
  const remove = (i: number) => {
    if (rows.length <= 1) {
      const last = b.lines[b.lines.length - 1];
      changeThenFocus(() => {
        setActive(null);
        update((p) => ops.setExitType(ops.findBox(p, b.id)!, 'next'));
      }, 'in-' + (last ? last.id : 'title-' + b.id));
      return;
    }
    const near = rows[i - 1] ?? rows[i + 1];
    update((p) => {
      const a = list(p);
      if (a && a.length > 1) a.splice(i, 1);
    });
    if (near) {
      setActive(near.id);
      focus(near.id);
    }
  };
  const rowProps = (id: string, i: number, cls: string) => ({
    className: cls + drag.cls(i, rows.length) + (editing && id === active ? ' active' : ''),
    'data-part': id,
    'data-row': id,
    onFocus: editing ? () => setActive(id) : undefined,
  });

  return (
    <>
      <div className="box-exit" ref={wrap}>
        {ex.type === 'next' && (
          <>
            <div className="exit-label">→ 다음{!ex.target && <span className="todo"> (연결 안 됨)</span>}</div>
            <Handle type="source" id="next" position={tb ? Position.Bottom : Position.Right} />
          </>
        )}
        {ex.type === 'menu' &&
          ex.choices.map((c, i) => (
            <div key={c.id} {...rowProps(c.id, i, 'choice')}>
              <span {...drag.grip(i)} className="grip pl-grip nodrag nopan">⠿</span>
              ◆{' '}
              {editing ? (
                <input
                  id={'in-' + c.id}
                  className="nodrag ed"
                  value={c.text}
                  placeholder={`선택지 ${i + 1}`}
                  onKeyDown={(e) => {
                    onEsc(e);
                    // 빈 선택지에서 BackSpace: 그 선택지를 지우고 앞 선택지로
                    if (e.key === 'Backspace' && !c.text && ex.choices.length > 1) {
                      e.preventDefault();
                      remove(i);
                    }
                  }}
                  onChange={(e) => update((p) => void ((ops.findBox(p, b.id)!.exit as any).choices[i].text = e.target.value), 'choice' + c.id)}
                />
              ) : (
                c.text || <i className="todo">(빈 선택지)</i>
              )}
              {(c.condition || c.actions.length > 0) && <ChoiceFlags cond={c.condition} actions={c.actions} />}
              <Handle type="source" id={'c:' + c.id} position={Position.Right} />
            </div>
          ))}
        {editing && ex.type === 'menu' && (
          <button className="nodrag faint-add" onClick={() => addAfter(ex.choices.length - 1)}>
            + 선택지
          </button>
        )}
        {ex.type === 'if' && (
          <>
            {ex.branches.map((c, i) => (
              <div key={c.id} {...rowProps(c.id, i, 'choice branch')}>
                <span {...drag.grip(i)} className="grip pl-grip nodrag nopan">⠿</span>
                <span className="br-kw">{i === 0 ? '만약' : '아니고'}</span>
                {editing ? (
                  <CondInput
                    id={'in-' + c.id}
                    className="nodrag"
                    compact
                    value={c.cond}
                    placeholder="조건 (예: love >= 5)"
                    onChange={(v) =>
                      update((p) => {
                        const x = ops.findBox(p, b.id)!.exit;
                        if (x.type === 'if') x.branches[i].cond = v;
                      }, 'branch' + c.id)
                    }
                  />
                ) : (
                  <span className="br-cond" title={c.cond}>{c.cond ? condWords(c.cond) : <i className="todo">(빈 조건)</i>}</span>
                )}
                <Handle type="source" id={'b:' + c.id} position={Position.Right} />
              </div>
            ))}
            {editing && (
              <button className="nodrag faint-add" onClick={() => addAfter(ex.branches.length - 1)}>
                + 조건
              </button>
            )}
            <div className="choice branch else" data-part="else">
              <span className="br-kw">그 밖</span>
              {!ex.else && <span className="todo"> (연결 안 됨)</span>}
              <Handle type="source" id="else" position={Position.Right} />
            </div>
          </>
        )}
        {ex.type === 'call' && (
          <>
            <div className="exit-label call">
              ⤷ call{!ex.target && <span className="todo"> (대상 없음)</span>} · 복귀 후{!ex.then && ' return'}
            </div>
            <Handle type="source" id="call" className="h-call" position={tb ? Position.Bottom : Position.Right} style={tb ? { left: '30%' } : { top: '75%' }} />
            <Handle type="source" id="then" position={tb ? Position.Bottom : Position.Right} style={tb ? { left: '70%' } : { top: '90%' }} />
          </>
        )}
        {ex.type === 'return' && <div className="exit-label end">■ 끝 (return)</div>}
      </div>
      {ai >= 0 && top !== null && (
        <div className="side side-l side-exit nodrag" style={{ top }}>
          <span {...drag.grip(ai)}>⠿</span>
          <span className="side-kind">{isMenu ? '◆ 선택지' : '◇ 조건'}</span>
          <button className="nodrag" title={isMenu ? '아래에 새 선택지' : '아래에 새 조건'} onClick={() => addAfter(ai)}>＋</button>
          <button
            className="nodrag"
            title={rows.length > 1 ? (isMenu ? '이 선택지 지우기 (빈 칸에서 BackSpace도 돼요)' : '이 조건 지우기') : isMenu ? '선택지 없애기 (→ 다음 상자로)' : '조건 분기 없애기 (→ 다음 상자로)'}
            onClick={() => remove(ai)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// 상자와 label 오른쪽 위의 [셰이더] 버튼. 누르면 오른쪽 편집 칸이 셰이더 고르기로 바뀐다
// 정해 둔 셰이더가 있으면 켜진 색, label 것을 따르는 상자는 흐린 테두리
function ShaderButton({ kind, id, own, inherited }: { kind: 'box' | 'label'; id: string; own?: BoxShader; inherited?: BoxShader }) {
  const open = useStore((s) => s.shaderOf?.kind === kind && s.shaderOf.id === id);
  const eff = own ?? inherited ?? null;
  const title = (own ? `셰이더: ${shaderLabel(own)}` : inherited ? `셰이더: label을 따름 (${shaderLabel(inherited)})` : '셰이더: 정하지 않음') + '\n눌러서 오른쪽에서 골라요';
  return (
    <button
      className={'nodrag sh-btn' + (own ? ' set' : inherited ? ' inh' : '') + (open ? ' open' : '')}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        useStore.getState().openShader(kind, id);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {eff ? `◐ ${shaderLabel(eff)}` : '◐ 셰이더'}
    </button>
  );
}

const STAGE_ICON: Record<string, string> = { scene: '🖼', show: '🧍', hide: '🙈', music: '🎵', sound: '🔊', fx: '✨' };

interface ActiveProps {
  active: string | null;
  setActive: (id: string | null) => void;
}

function Lines({ b, editing, active, setActive }: { b: BoxNode; editing: boolean } & ActiveProps) {
  const update = useStore((s) => s.update);
  const upd = (fn: (x: BoxNode) => void, key?: string) => update((p) => fn(ops.findBox(p, b.id)!), key);
  const [top, setTop] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = usePtrDrag(wrap, '[data-line]', (from, to) => upd((x) => ops.moveIn(x.lines, from, to)));

  const ai = editing ? b.lines.findIndex((l) => l.id === active) : -1;
  const al = ai >= 0 ? b.lines[ai] : null;

  // 오른쪽 글자 효과 칸이 지금 쓰는 줄을 따라가게 알린다
  useEffect(() => {
    if (editing && active && b.lines.some((l) => l.id === active)) useStore.setState({ activeLine: active });
  }, [editing, active]);

  // 단추 묶음이 지금 줄 높이를 따라 내려가게 한다 (상자 안 좌표라 확대해도 그대로)
  useLayoutEffect(() => {
    const row = al && (wrap.current?.querySelector(`[data-line="${al.id}"]`) as HTMLElement | null);
    const t = row ? row.offsetTop : null;
    if (t !== top) setTop(t);
  });

  const addAfter = (i: number, like?: Line) => {
    const nl: Line = { id: uid('l'), type: like && (like.type === 'say' || like.type === 'narration') ? like.type : 'narration', who: like?.who, text: '' };
    changeThenFocus(() => upd((x) => void x.lines.splice(i + 1, 0, nl)), 'in-' + nl.id);
  };

  const remove = (i: number) => {
    const next = b.lines[i + 1] ?? b.lines[i - 1];
    upd((x) => void x.lines.splice(i, 1));
    if (next) changeThenFocus(() => setActive(next.id), 'in-' + next.id);
  };

  const onKey = (e: React.KeyboardEvent, i: number, l: Line) => {
    if (e.key === 'Escape') useStore.setState({ inlineEdit: null });
    else if (hit(e, 'newLine')) {
      e.preventDefault();
      addAfter(i, l);
    }
  };

  const setLine = (i: number) => (fn: (x: Line) => void, key?: string) => upd((x) => fn(x.lines[i]), key);

  return (
    <div className="box-lines" ref={wrap}>
      {b.lines.map((l, i) => (
        <LineRow
          key={l.id}
          l={l}
          editing={editing}
          active={editing && l.id === active}
          cls={drag.cls(i, b.lines.length)}
          grip={drag.grip(i)}
          onFocus={() => setActive(l.id)}
          onKey={(e) => onKey(e, i, l)}
          onText={(v) => upd((x) => void (x.lines[i].text = v), 'text' + l.id)}
        />
      ))}
      {!b.lines.length && <div className="more">대사 없음</div>}

      {editing && al && top !== null && (
        <>
          <div className="side side-l nodrag" style={{ top }} key="l">
            <span {...drag.grip(ai)}>⠿</span>
            <SpeakerSelect className="nodrag" l={al} set={setLine(ai)} />
            {al.type === 'say' && al.attr && <OldAttr attr={al.attr} clear={() => upd((x) => void delete x.lines[ai].attr)} />}
            <button className="nodrag" title="아래에 새 줄" onClick={() => addAfter(ai, al)}>＋</button>
            <button className="nodrag" title="줄 삭제" onClick={() => remove(ai)}>✕</button>
          </div>
          {isStage(al.type) && (
            <div className="side side-r nodrag" style={{ top }}>
              <StageFields l={al} nd="nodrag" set={setLine(ai)} />
            </div>
          )}
          {al.type === 'flag' && (
            <div className="side side-r nodrag" style={{ top }}>
              <ActionInput value={al.text} onChange={(v) => upd((x) => void (x.lines[ai].text = v), 'text' + al.id)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 상자 안 줄 순서 바꾸기: 손잡이(⠿)를 누른 채 끌어 놓는다. 캔버스 안이라 HTML 끌어 놓기 대신 포인터로 한다
// (React Flow의 상자 끌기·화면 이동과 겹치지 않게). 볼 때도 고칠 때도 된다
// 선택지·조건 갈래도 같은 것으로 끈다 (sel로 고를 줄을 찾는다)
function usePtrDrag(wrap: React.RefObject<HTMLDivElement>, sel: string, move: (from: number, to: number) => void) {
  const [st, setSt] = useState<{ from: number; to: number | null } | null>(null);
  const grip = (i: number) => ({
    className: 'grip nodrag nopan',
    title: '끌어서 순서 바꾸기',
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      let to: number | null = null;
      setSt({ from: i, to });
      const onMove = (ev: PointerEvent) => {
        const rows = [...(wrap.current?.querySelectorAll<HTMLElement>(sel) ?? [])];
        let k = rows.findIndex((r) => {
          const rc = r.getBoundingClientRect();
          return ev.clientY < rc.top + rc.height / 2;
        });
        if (k < 0) k = rows.length;
        if (k !== to) setSt({ from: i, to: (to = k) });
      };
      const onUp = () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        if (to !== null && to !== i && to !== i + 1) move(i, to);
        setSt(null);
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
  });
  const cls = (i: number, n: number) => {
    if (!st) return '';
    const real = st.to !== null && st.to !== st.from && st.to !== st.from + 1;
    return (st.from === i ? ' dragging' : '') + (real && st.to === i ? ' drop-before' : '') + (real && st.to === n && i === n - 1 ? ' drop-after' : '');
  };
  return { grip, cls };
}

interface RowProps {
  l: Line;
  editing: boolean;
  active: boolean;
  cls: string;
  grip: object;
  onFocus: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  onText: (v: string) => void;
}

// 줄 하나. 볼 때와 고칠 때 같은 자리에 같은 크기로 그린다
function LineRow({ l, editing, active, cls, grip, onFocus, onKey, onText }: RowProps) {
  const ch = useStore((s) => (l.type === 'say' ? s.project.characters.find((c) => c.id === l.who) : undefined));
  const tagsOn = useStore((s) => s.project.settings.allowTextTags);
  const project = useStore((s) => (l.type === 'flag' ? s.project : null));
  // 플래그 바꾸기 줄은 글을 쓰지 않아 연출 줄처럼 그린다 (오른쪽 칸에서 고름)
  const stage = isStage(l.type) || l.type === 'flag';
  const kind = l.type === 'flag' ? 'pl-stage pl-flag' : stage ? 'pl-stage' : l.type === 'command' ? 'cmd' : l.type === 'note' ? 'note' : l.type === 'narration' ? 'narr' : 'say';
  const empty = { narration: '(빈 내레이션)', say: '(빈 대사)', command: '(빈 명령)', note: '(빈 메모)' }[l.type as 'say'];

  let body;
  if (l.type === 'flag')
    body = <span className="pl-text">⚑ {l.text.trim() ? <code>{actionWords(project!, l.text)}</code> : <i className="todo">(플래그를 고르세요)</i>}</span>;
  else if (stage) {
    const { code, problem } = stageCode(l);
    body = (
      <span className="pl-text">
        {STAGE_ICON[l.type]} {code ? <code>{code}</code> : <i className="todo">({problem})</i>}
      </span>
    );
  } else if (editing)
    body = (
      <textarea
        id={'in-' + l.id}
        className="nodrag nowheel pl-text ed"
        rows={1}
        value={l.text}
        placeholder={empty}
        data-tags={isSayLine(l) ? '1' : undefined}
        onKeyDown={onKey}
        onChange={(e) => onText(e.target.value)}
      />
    );
  else body = <span className="pl-text">{!l.text ? <i className="todo">{empty}</i> : tagsOn && isSayLine(l) && l.text.includes('{') ? <TagView text={l.text} /> : l.text}</span>;

  return (
    <div
      className={'pl ' + kind + (editing ? ' nodrag' : '') + (active ? ' active' : '') + cls}
      data-part={l.id}
      data-line={l.id}
      onFocus={editing ? onFocus : undefined}
      // 연출 줄은 글을 쓰지 않으니 줄 자체가 포커스를 받는다
      id={editing && stage ? 'in-' + l.id : undefined}
      tabIndex={editing && stage ? 0 : undefined}
      onKeyDown={editing && stage ? onKey : undefined}
    >
      <span {...grip} className="grip pl-grip nodrag nopan">⠿</span>
      {l.type === 'say' && (
        <span className={'who' + (ch ? '' : ' unknown')} style={{ '--c': ch?.color ?? '#ef4444' } as React.CSSProperties}>
          {ch?.name ?? l.who ?? '?'}
        </span>
      )}
      {l.type === 'say' && l.attr && <span className="attr">({l.attr})</span>}
      {l.type === 'note' && <span className="mark">#</span>}
      {body}
    </div>
  );
}

// 상자 안 선택지의 플래그 표시: 보이는 조건과 고르면 바꾸기
function ChoiceFlags({ cond, actions }: { cond: string | null; actions: string[] }) {
  const project = useStore((s) => s.project);
  return (
    <span className="ch-flags">
      {cond && <span className="ch-cond" title={'이 조건일 때만 보여요: ' + cond}>if {condWords(cond)}</span>}
      {actions.filter((a) => a.trim()).map((a, i) => (
        <span key={i} className="ch-act" title="고르면 바뀌어요">⚑ {actionWords(project, a)}</span>
      ))}
    </span>
  );
}

export function GroupFrame({ data }: NodeProps) {
  const g = useStore((s) => s.project.labels.find((l) => l.id === (data as any).groupId));
  if (!g) return null;
  // label 배경은 label 색 그대로 칠한다. 제목 글자는 배경 밝기에 맞춰 검정/흰색
  return (
    <div className="frame" style={{ '--g': g.color, '--gt': isLight(g.color) ? '#1c1c1e' : '#ffffff' } as React.CSSProperties}>
      <span title="클릭: 이 label의 상자 모두 선택">
        {g.title ? `${g.title} · ` : ''}
        <code>{g.name}</code>
      </span>
      <ShaderButton kind="label" id={g.id} own={g.shader} />
    </div>
  );
}
