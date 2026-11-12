import { useEffect, useRef } from 'react';
import { useStore } from './store';
import * as ops from './ops';
import type { BoxNode, ExitType, Line, Project } from './types';
import { uid } from './util';
import { LineLook, SpeakerSelect, StageFields, useLineDrag } from './LineFields';
import { isStage } from './stage';
import { hit } from './prefs';
import { ShaderPanel } from './ShaderPanel';

export type Upd = (fn: (b: BoxNode, p: Project) => void, key?: string) => void;

export function Inspector() {
  const ids = useStore((s) => s.selectedIds);
  const project = useStore((s) => s.project);
  const shaderOf = useStore((s) => s.shaderOf);
  if (shaderOf) return <ShaderPanel />;
  if (!ids.length)
    return (
      <div className="insp">
        <section className="sec">
          <h3>상자 편집</h3>
          <p className="tip">상자를 한 번 클릭하면 여기서 label, 대사, 다음 흐름을 고쳐요. 쓰는 법은 왼쪽 칸 아래의 [사용법]에 있어요.</p>
        </section>
      </div>
    );
  if (ids.length > 1) return <MultiInspector ids={ids} />;
  const b = project.nodes.find((n) => n.id === ids[0]);
  return b ? <BoxInspector b={b} /> : null;
}

function MultiInspector({ ids }: { ids: string[] }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  return (
    <div className="insp">
      <section className="sec">
      <h3>상자 {ids.length}개 선택</h3>
      <div className="row">
        <label>label</label>
        <select
          value=""
          onChange={(e) =>
            update((p) => {
              const gid = e.target.value === '__new' ? ops.addGroup(p) : e.target.value;
              ops.setGroup(p, ids, gid);
            })
          }
        >
          <option value="">같은 label로 묶기…</option>
          {project.labels.map((g) => (
            <option key={g.id} value={g.id}>{g.title ? `${g.title} (${g.name})` : g.name}</option>
          ))}
          <option value="__new">+ 새 label로 묶기</option>
        </select>
      </div>
      <div className="row">
        <button className="danger" onClick={() => confirm(`상자 ${ids.length}개를 지울까요?`) && (update((p) => ops.deleteBoxes(p, ids)), useStore.getState().select([]))}>
          선택한 상자 삭제
        </button>
      </div>
      <p className="tip">왼쪽 "상자와 정렬"의 [선택 정렬]로 이 상자들만 흐름 순서로 정렬할 수 있어요.</p>
      </section>
    </div>
  );
}

function BoxInspector({ b }: { b: BoxNode }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const upd: Upd = (fn, key) => update((p) => fn(ops.findBox(p, b.id)!, p), key);
  const g = project.labels.find((l) => l.id === b.group);
  const drag = useLineDrag((from, to) => upd((x) => ops.moveLine(x, from, to)));
  // 글자 효과 칸: 지금 쓰는 대사 줄, 그 줄이 대사가 아니면 상자의 첫 대사 줄
  const isSay = (l: Line) => l.type === 'say' || l.type === 'narration';
  const activeLine = useStore((s) => s.activeLine);
  const lookLine = b.lines.find((l) => l.id === activeLine && isSay(l)) ?? b.lines.find(isSay);

  const addLine = () => {
    const last = b.lines[b.lines.length - 1];
    const nl: Line = { id: uid('l'), type: last?.type === 'say' ? 'say' : 'narration', who: last?.type === 'say' ? last.who : undefined, text: '' };
    upd((x) => void x.lines.push(nl));
    useStore.setState({ focusLineId: nl.id });
  };

  return (
    <div className="insp">
      <section className="sec">
      <h3>상자</h3>
      <input id="ed-title" className="title" value={b.title} placeholder="상자 제목 (예: 우산을 빌려준다)" onChange={(e) => upd((x) => void (x.title = e.target.value), 'title' + b.id)} />
      <div className="row">
        <label>label</label>
        <select
          value={b.group}
          onChange={(e) =>
            update((p) => {
              const gid = e.target.value === '__new' ? ops.addGroup(p) : e.target.value;
              ops.setGroup(p, [b.id], gid);
            })
          }
        >
          {project.labels.map((l) => (
            <option key={l.id} value={l.id}>{l.title ? `${l.title} (${l.name})` : l.name}</option>
          ))}
          <option value="__new">+ 새 label로 분리</option>
        </select>
        <span className="tip">{g?.entry === b.id ? 'label의 첫 상자' : `→ ${g?.name}.${b.id}`}</span>
      </div>
      <div className="row">
        {g?.entry !== b.id && <button onClick={() => update((p) => void (p.labels.find((l) => l.id === b.group)!.entry = b.id))}>label의 첫 상자로</button>}
        {project.project.startNode !== b.id && <button onClick={() => update((p) => void (p.project.startNode = b.id))}>시작 상자로</button>}
        <button onClick={() => useStore.getState().startPlay(b.id)}>▶ 여기서 플레이</button>
        <button className="danger" onClick={() => (update((p) => ops.deleteBoxes(p, [b.id])), useStore.getState().select([]))}>삭제</button>
      </div>
      </section>

      {lookLine && (
        <section className="sec look-panel">
          <LineLook l={lookLine} set={(fn, key) => upd((x) => fn(x.lines.find((l) => l.id === lookLine.id)!), key)} />
        </section>
      )}

      <section className="sec">
      <h3>대사</h3>
      {b.lines.map((l, i) => (
        <LineRow key={l.id} l={l} i={i} upd={upd} drag={drag} />
      ))}
      <div className="row">
        <button onClick={addLine}>+ 줄 추가</button>
        <span className="tip">Ctrl+Enter: 같은 화자로 아래에 새 줄</span>
      </div>
      </section>

      <section className="sec">
      <h3>다음 흐름</h3>
      <ExitEditor b={b} upd={upd} />
      </section>
    </div>
  );
}

function LineRow({ l, i, upd, drag }: { l: Line; i: number; upd: Upd; drag: ReturnType<typeof useLineDrag> }) {
  const focusLineId = useStore((s) => s.focusLineId);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusLineId !== l.id) return;
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: 'nearest' });
    useStore.setState({ focusLineId: null });
  }, [focusLineId, l.id]);

  const set = (fn: (x: Line) => void, key?: string) => upd((x) => fn(x.lines[i]), key);

  const onKey = (e: React.KeyboardEvent) => {
    if (!hit(e, 'newLine')) return;
    e.preventDefault();
    const nl: Line = { id: uid('l'), type: l.type === 'say' ? 'say' : 'narration', who: l.type === 'say' ? l.who : undefined, text: '' };
    upd((x) => void x.lines.splice(i + 1, 0, nl));
    useStore.setState({ focusLineId: nl.id });
  };

  const placeholder =({ narration: '내레이션', say: '대사', command: '렌파이 명령 (예: show alice smile / scene bg room / play music "a.ogg")', note: '작가용 메모 (주석으로 내보내요)' } as Record<string, string>)[l.type];

  return (
    <div className={'line t-' + l.type + (isStage(l.type) ? ' t-stage' : '') + drag.cls(i)} {...drag.row(i)}>
      <div className="line-top">
        <span className="grip" {...drag.grip(i)}>⠿</span>
        <SpeakerSelect l={l} set={set} />
        <button title="줄 삭제" onClick={() => upd((x) => void x.lines.splice(i, 1))}>✕</button>
        {l.type === 'say' && <input className="attr" placeholder="속성(표정)" value={l.attr ?? ''} onChange={(e) => upd((x) => void (x.lines[i].attr = e.target.value), 'attr' + l.id)} />}
      </div>
      <div className="line-body">
        {isStage(l.type) ? (
          <StageFields l={l} set={set} />
        ) : (
          <textarea id={'ed-' + l.id} ref={ref} rows={1} value={l.text} placeholder={placeholder} data-tags={l.type === 'say' || l.type === 'narration' ? '1' : undefined} onFocus={() => useStore.setState({ activeLine: l.id })} onKeyDown={onKey} onChange={(e) => upd((x) => void (x.lines[i].text = e.target.value), 'text' + l.id)} />
        )}
      </div>
    </div>
  );
}

function TargetSelect({ value, onChange, self }: { value: string | null; onChange: (v: string | null) => void; self: string }) {
  const project = useStore((s) => s.project);
  const name = (gid: string) => project.labels.find((l) => l.id === gid)?.name ?? '?';
  return (
    <select className="target" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">(연결 안 됨)</option>
      {project.labels.map((g) => (
        <optgroup key={g.id} label={g.title ? `${g.title} (${g.name})` : g.name}>
          {project.nodes
            .filter((n) => n.group === g.id)
            .map((n) => (
              <option key={n.id} value={n.id}>
                {n.title || n.id}
                {n.id === self ? ' (자기 자신)' : ''} · {name(n.group)}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

export function ExitEditor({ b, upd }: { b: BoxNode; upd: Upd }) {
  const e = b.exit;
  return (
    <div className="exit-ed">
      <div className="row">
        <select value={e.type} onChange={(ev) => upd((x) => ops.setExitType(x, ev.target.value as ExitType))}>
          <option value="next">→ 다음 상자로 (jump)</option>
          <option value="menu">◆ 선택지 (menu)</option>
          <option value="call">⤷ call 후 계속</option>
          <option value="return">■ 끝 (return)</option>
        </select>
      </div>
      {e.type === 'next' && (
        <div className="row">
          <label>다음</label>
          <TargetSelect self={b.id} value={e.target} onChange={(v) => upd((x) => ops.setLink(x, 'next', v))} />
        </div>
      )}
      {e.type === 'call' && (
        <>
          <div className="row">
            <label>call</label>
            <TargetSelect self={b.id} value={e.target} onChange={(v) => upd((x) => ops.setLink(x, 'call', v))} />
          </div>
          <div className="row">
            <label>복귀 후</label>
            <TargetSelect self={b.id} value={e.then} onChange={(v) => upd((x) => ops.setLink(x, 'then', v))} />
          </div>
          <p className="tip">call한 장면이 return으로 끝나면 "복귀 후" 상자로 이어져요. 비워 두면 여기서도 return해요.</p>
        </>
      )}
      {e.type === 'menu' && (
        <>
          {e.choices.map((c, i) => (
            <div className="choice-ed" key={c.id}>
              <input id={'ed-' + c.id} value={c.text} placeholder={`선택지 ${i + 1} 문구`} onChange={(ev) => upd((x) => void ((x.exit as any).choices[i].text = ev.target.value), 'choice' + c.id)} />
              <TargetSelect self={b.id} value={c.target} onChange={(v) => upd((x) => ops.setLink(x, 'c:' + c.id, v))} />
              <button disabled={i === 0} onClick={() => upd((x) => { const cs = (x.exit as any).choices; cs.splice(i - 1, 0, ...cs.splice(i, 1)); })}>↑</button>
              <button onClick={() => upd((x) => void (x.exit as any).choices.splice(i, 1))}>✕</button>
            </div>
          ))}
          <button onClick={() => upd((x) => void (x.exit as any).choices.push(ops.newChoice()))}>+ 선택지 추가</button>
        </>
      )}
      {e.type === 'return' && <p className="tip">이 상자에서 흐름이 끝나요. call로 불린 장면이면 부른 곳으로 돌아가요.</p>}
    </div>
  );
}
