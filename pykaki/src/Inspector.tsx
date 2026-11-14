import { useEffect, useRef, useState } from 'react';
import { Hint } from './Help';
import { useStore } from './store';
import * as ops from './ops';
import type { BoxNode, Choice, ExitType, Line, Project } from './types';
import { uid } from './util';
import { Card } from './Card';
import { LineLook, OldAttr, SpeakerSelect, StageFields, useLineDrag } from './LineFields';
import { isStage } from './stage';
import { hit } from './prefs';
import { ShaderPanel } from './ShaderPanel';
import { StageCards } from './StageCards';
import { CursorCard, SayUiCard } from './UiPanel';
import { ActionInput, CondInput, firstAction } from './FlagFields';
import { GameOffTip, GoHere, MoveBtn, PickBand, useSidePop } from './PickPos';

const USED_CARD: Partial<Record<Line['type'], string>> = { scene: 'i-bg', show: 'i-pic', hide: 'i-pic', sound: 'i-sound', music: 'i-sound' };

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
          <p className="tip">상자를 골라 주세요.<Hint text="상자를 한 번 클릭하면 여기서 label, 대사, 다음 흐름을 고쳐요. 쓰는 법은 위쪽 [도움말]" topic="대본 쓰기" /></p>
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
      <h3>상자 {ids.length}개 선택<Hint text="왼쪽 상자와 정렬의 [선택 정렬]로 이 상자들만 정렬해요" topic="정리" /></h3>
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
  // 지금 쓰는 줄과 이어진 카드에 "사용 중" 녹색 톤 (대사를 쓰면 대사·글자 효과, 연출 줄이면 그 종류 카드)
  const act = b.lines.find((l) => l.id === activeLine);
  const used = new Set<string>(!act ? [] : isSay(act) ? ['i-lines', 'i-look'] : ['i-lines', ...(USED_CARD[act.type] ? [USED_CARD[act.type]!] : [])]);
  const use = (id: string) => (used.has(id) ? 'in-use' : '');

  const addLine = () => {
    const last = b.lines[b.lines.length - 1];
    const nl: Line = { id: uid('l'), type: last?.type === 'say' ? 'say' : 'narration', who: last?.type === 'say' ? last.who : undefined, text: '' };
    upd((x) => void x.lines.push(nl));
    useStore.setState({ focusLineId: nl.id });
  };

  const addFlagLine = () => {
    const nl: Line = { id: uid('l'), type: 'flag', text: firstAction(project.variables) };
    upd((x) => void x.lines.push(nl));
  };

  return (
    <div className="insp">
      <Card id="i-box" title="상자">
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
        <GoHere where={{ box: b.id }} />
        <button className="danger" onClick={() => (update((p) => ops.deleteBoxes(p, [b.id])), useStore.getState().select([]))}>삭제</button>
      </div>
      </Card>

      {lookLine && (
        <Card id="i-look" title="글자 효과" className={'look-panel ' + use('i-look')}>
          <LineLook l={lookLine} set={(fn, key) => upd((x) => fn(x.lines.find((l) => l.id === lookLine.id)!), key)} />
        </Card>
      )}
      {lookLine && (
        <SayUiCard l={lookLine} b={b} className={use('i-look')} set={(fn, key) => upd((x) => fn(x.lines.find((l) => l.id === lookLine.id)!), key)} setBox={(fn) => upd((x) => fn(x))} />
      )}

      <Card id="i-lines" title="대사" className={use('i-lines')}>
      {b.lines.map((l, i) => (
        <LineRow key={l.id} l={l} i={i} upd={upd} drag={drag} />
      ))}
      <div className="row">
        <button onClick={addLine}>+ 줄 추가</button>
        <button onClick={addFlagLine} title="이 자리에서 플래그를 바꿔요 (예: met_alice 켜기, love +1)">+ 플래그 바꾸기</button>
        <span className="tip">Ctrl+Enter: 같은 화자로 아래에 새 줄</span>
      </div>
      <GameOffTip what="대사" />
      </Card>

      <StageCards b={b} upd={upd} use={use} />

      <CursorCard b={b} />

      <Card id="i-exit" title="다음 흐름">
      <ExitEditor b={b} upd={upd} />
      </Card>
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
  const isSay = l.type === 'say' || l.type === 'narration';
  const movable = l.type === 'show' || l.type === 'scene'; // 숨기기 줄은 자리가 없어서 뺌
  const pop = useSidePop();

  const onKey = (e: React.KeyboardEvent) => {
    if (!hit(e, 'newLine')) return;
    e.preventDefault();
    const nl: Line = { id: uid('l'), type: l.type === 'say' ? 'say' : 'narration', who: l.type === 'say' ? l.who : undefined, text: '' };
    upd((x) => void x.lines.splice(i + 1, 0, nl));
    useStore.setState({ focusLineId: nl.id });
  };

  const placeholder =({ narration: '내레이션', say: '대사', command: '렌파이 명령 (예: show alice smile / scene bg room / play music "a.ogg")', note: '작가용 메모 (주석으로 내보내요)' } as Record<string, string>)[l.type];

  return (
    <div className={'line t-' + l.type + (isStage(l.type) ? ' t-stage' : '') + drag.cls(i)} {...drag.row(i)} ref={pop.ref} {...pop.rowProps}>
      <pop.Pop>
        {isSay && <MoveBtn where={{ line: l.id }} tab="say" what="대사" />}
        {movable && <MoveBtn where={{ line: l.id }} tab="stage" what="이미지/영상" />}
        <GoHere where={{ line: l.id }} short />
      </pop.Pop>
      <div className="line-top">
        <span className="grip" {...drag.grip(i)}>⠿</span>
        <SpeakerSelect l={l} set={set} />
        <button title="줄 삭제" onClick={() => upd((x) => void x.lines.splice(i, 1))}>✕</button>
        {l.type === 'say' && l.attr && <OldAttr attr={l.attr} clear={() => upd((x) => void delete x.lines[i].attr)} />}
      </div>
      <div className="line-body">
        {isStage(l.type) ? (
          <StageFields l={l} set={set} />
        ) : l.type === 'flag' ? (
          <ActionInput id={'ed-' + l.id} value={l.text} onChange={(v) => upd((x) => void (x.lines[i].text = v), 'text' + l.id)} />
        ) : (
          <textarea id={'ed-' + l.id} ref={ref} rows={1} value={l.text} placeholder={placeholder} data-tags={isSay ? '1' : undefined} onFocus={() => useStore.setState({ activeLine: l.id })} onKeyDown={onKey} onChange={(e) => upd((x) => void (x.lines[i].text = e.target.value), 'text' + l.id)} />
        )}
      </div>
      {isSay && <PickBand where={{ line: l.id }} tab="say" what="대사" />}
      {movable && <PickBand where={{ line: l.id }} tab="stage" what="그림" />}
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

// 선택지 한 줄: 문구, 갈 곳. [⚑]를 누르면 보이는 조건과 고르면 바꾸기 (FEATURE 14)
function ChoiceRow({ b, c, i, upd }: { b: BoxNode; c: Choice; i: number; upd: Upd }) {
  const flags = useStore((s) => s.project.variables);
  const has = !!c.condition || c.actions.length > 0;
  const [open, setOpen] = useState(has);
  const setC = (fn: (x: Choice) => void, key?: string) => upd((x) => void (x.exit.type === 'menu' && fn(x.exit.choices[i])), key);
  return (
    <div className={'choice-box' + (open ? ' open' : '')}>
      <div className="choice-ed">
        <input id={'ed-' + c.id} value={c.text} placeholder={`선택지 ${i + 1} 문구`} onChange={(ev) => setC((x) => void (x.text = ev.target.value), 'choice' + c.id)} />
        <TargetSelect self={b.id} value={c.target} onChange={(v) => upd((x) => ops.setLink(x, 'c:' + c.id, v))} />
        <button className={'flag-btn' + (has ? ' on' : '')} onClick={() => setOpen(!open)} title="플래그: 보이는 조건, 고르면 바꾸기">⚑</button>
        <button disabled={i === 0} onClick={() => upd((x) => { const cs = (x.exit as any).choices; cs.splice(i - 1, 0, ...cs.splice(i, 1)); })}>↑</button>
        <button onClick={() => upd((x) => void (x.exit as any).choices.splice(i, 1))}>✕</button>
      </div>
      {open && (
        <div className="choice-flags">
          <div className="cf-row">
            <span className="cf-kw">보이는 조건</span>
            <CondInput value={c.condition ?? ''} placeholder="비우면 늘 보여요 (예: love >= 5)" onChange={(v) => setC((x) => void (x.condition = v.trim() ? v : null), 'ccond' + c.id)} />
          </div>
          {c.actions.map((a, k) => (
            <div className="cf-row" key={k}>
              <span className="cf-kw">{k === 0 ? '고르면' : ''}</span>
              <ActionInput value={a} onChange={(v) => setC((x) => void (x.actions[k] = v), 'cact' + c.id + k)} />
              <button className="x" title="빼기" onClick={() => setC((x) => void x.actions.splice(k, 1))}>✕</button>
            </div>
          ))}
          <div className="cf-row">
            <span className="cf-kw">{c.actions.length ? '' : '고르면'}</span>
            <button onClick={() => setC((x) => void x.actions.push(firstAction(flags)))}>+ 플래그 바꾸기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExitEditor({ b, upd }: { b: BoxNode; upd: Upd }) {
  const e = b.exit;
  const linkedOn = useStore((s) => !!s.project.settings.renpyLink);
  const last = b.lines[b.lines.length - 1]?.id;
  return (
    <div className="exit-ed">
      <div className="row">
        <select value={e.type} onChange={(ev) => upd((x) => ops.setExitType(x, ev.target.value as ExitType))}>
          <option value="next">→ 다음 상자로 (jump)</option>
          <option value="menu">◆ 선택지 (menu)</option>
          <option value="if">◇ 조건 분기 (if)</option>
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
            <label>복귀 후<Hint text="call한 장면이 return으로 끝나면 이 상자로. 비우면 여기서도 return" topic="흐름 잇기" /></label>
            <TargetSelect self={b.id} value={e.then} onChange={(v) => upd((x) => ops.setLink(x, 'then', v))} />
          </div>
        </>
      )}
      {e.type === 'menu' && (
        <>
          {e.choices.map((c, i) => (
            <ChoiceRow key={c.id} b={b} c={c} i={i} upd={upd} />
          ))}
          <button onClick={() => upd((x) => void (x.exit as any).choices.push(ops.newChoice()))}>+ 선택지 추가</button>
          {/* 게임은 이 상자의 마지막 줄로 가요. 한 번 넘기면 선택지가 나와요 */}
          {linkedOn && last && (
            <>
              <div className="row">
                <MoveBtn where={{ line: last }} tab="choice" what="선택지" />
              </div>
              <PickBand where={{ line: last }} tab="choice" what="선택지" />
            </>
          )}
        </>
      )}
      {e.type === 'if' && (
        <>
          {e.branches.map((c, i) => (
            <div className="choice-ed" key={c.id}>
              <span className="br-kw">{i === 0 ? '만약' : '아니고'}</span>
              <CondInput id={'ed-' + c.id} value={c.cond} placeholder="조건 (예: love >= 5)" onChange={(v) => upd((x) => void (x.exit.type === 'if' && (x.exit.branches[i].cond = v)), 'branch' + c.id)} />
              <TargetSelect self={b.id} value={c.target} onChange={(v) => upd((x) => ops.setLink(x, 'b:' + c.id, v))} />
              <button disabled={i === 0} onClick={() => upd((x) => { if (x.exit.type === 'if') { const cs = x.exit.branches; cs.splice(i - 1, 0, ...cs.splice(i, 1)); } })}>↑</button>
              <button disabled={e.branches.length < 2} onClick={() => upd((x) => void (x.exit.type === 'if' && x.exit.branches.splice(i, 1)))}>✕</button>
            </div>
          ))}
          <button onClick={() => upd((x) => void (x.exit.type === 'if' && x.exit.branches.push(ops.newBranch())))}>+ 조건 추가</button>
          <div className="row">
            <label>그 밖<Hint text="위 조건이 모두 아니면 이 상자로. 렌파이 조건식을 그대로 써요 (예: love >= 5, met_alice, not rich)" topic="흐름 잇기" /></label>
            <TargetSelect self={b.id} value={e.else} onChange={(v) => upd((x) => ops.setLink(x, 'else', v))} />
          </div>
        </>
      )}
      {e.type === 'return' && <p className="tip">여기서 끝 (call로 불렸으면 부른 곳으로)</p>}
    </div>
  );
}
