// 플래그 설계 창 (2단계 표): 캔버스 아래쪽에 붙는 시트. 세로 = 플래그, 가로 = 대본 흐름 순서의 상자.
// 칸에는 그 상자가 바꾸는 것(✎ +1, 켜기)과 보는 것(? ≥ 2, 켜짐). 칸을 누르면 그 자리에서 고치고 더하는 팝오버.
// 상자 이름을 누르면 위 캔버스가 그 상자로. 결과는 지금 있는 선택지·조건 분기·플래그 바꾸기 줄 그대로라 저장 형식은 안 바뀐다
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import type { BoxNode, Flag, Project } from './types';
import { uid } from './util';
import { actionText, condSnippet, condText, firstClause, KIND_LABEL, parseCond } from './flags';
import { ActionInput, CondInput } from './FlagFields';
import { buildDesign, cellKey, isWrite, shortOf, valuesText, type DUse } from './flagTable';
import { FlagWizard } from './FlagWizard';

const close = () => useStore.setState({ showDesign: false });
const titleOf = (b: BoxNode) => b.title || b.id;
const go = (id: string) => {
  useStore.getState().select([id]);
  useStore.getState().focusNodes([id]);
};
// 이 플래그를 처음 바꿀 때의 식 (켜기, +1, 빈 글)
const firstAct = (f: Flag) => actionText(f.kind === 'bool' ? { name: f.name, op: '=', value: 'True' } : f.kind === 'int' ? { name: f.name, op: '+=', value: '1' } : { name: f.name, op: '=', value: '""' });
// 조건에 이 플래그 조각을 더함 (읽을 수 있으면 "그리고"로, 못 읽는 식이면 글 끝에 and)
const addClause = (cond: string | null | undefined, f: Flag) => {
  const c = parseCond(cond ?? '');
  if (c) return condText({ ...c, clauses: [...c.clauses, firstClause(f)] });
  return `${cond} and ${condSnippet(f)}`;
};

export function FlagDesign() {
  const project = useStore((s) => s.project);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<{ flag: string; box: string; el: HTMLElement } | null>(null);
  const [wiz, setWiz] = useState(false); // 오른쪽 칸 [틀에서 만들기]
  const d = useMemo(() => buildDesign(project, all), [project, all]);
  const flags = project.variables;

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || open || document.querySelector('.modal')) return;
      const a = document.activeElement;
      if (a && a !== document.body && !a.closest('.fdesign')) return; // 다른 칸에서 쓰던 Esc는 그쪽 몫
      if (wiz) return setWiz(false); // 마법사 먼저
      close();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, wiz]);

  return (
    <div className={'fdesign' + (wiz ? ' with-wiz' : '')} role="region" aria-label="플래그 설계">
      <div className="fp-head">
        <b>플래그 설계</b>
        <span className="tip">✎ 바꾸는 곳, ? 보는 곳. 칸을 눌러 고쳐요</span>
        <span className="sp" />
        <label className="fd-all" title="플래그를 안 쓰는 상자도 흐름 순서대로 보여요">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> 모든 상자
        </label>
        <button className={wiz ? 'on' : ''} aria-pressed={wiz} onClick={() => setWiz((v) => !v)} title="용례(호감도, 잠긴 선택지 등)를 틀로 플래그와 바꾸는 곳, 보는 곳을 한 번에 넣어요">틀에서 만들기</button>
        <button onClick={() => useStore.setState({ showTrace: '' })} title="대본 시작부터 선택지를 골라 가며 플래그 값과 조건 분기 갈래를 봐요">▶ 따라가 보기</button>
        <button onClick={close} title="닫기 (Esc)">✕</button>
      </div>
      <div className="fd-main">
      {!flags.length ? (
        <div className="fd-empty">
          <p>플래그가 없어요. [틀에서 만들기]나 오른쪽 플래그 카드의 [+ 추가]에서 용례를 골라 만들면 여기에 줄이 생겨요.</p>
        </div>
      ) : (
        <div className="fd-scroll">
          <table className="fd-table">
            <thead>
              <tr>
                <th className="fd-corner">플래그</th>
                {d.boxes.map((b) => (
                  <th key={b.id} className={'fd-box' + (d.unreached.has(b.id) ? ' unreached' : '')}>
                    <button onClick={() => go(b.id)} title={(d.unreached.has(b.id) ? '대본 시작에서 닿지 않는 상자 · ' : '') + '누르면 캔버스가 이 상자로'}>
                      {titleOf(b)}
                    </button>
                  </th>
                ))}
                {!d.boxes.length && <th className="fd-box tip">아직 플래그를 쓰는 상자가 없어요</th>}
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => {
                const notes = d.notes.get(f.name);
                return (
                  <tr key={f.id}>
                    <th className="fd-flag">
                      <div className="fd-fname">
                        <code>{f.name}</code>
                        <span className="fd-kind">{KIND_LABEL[f.kind]}</span>
                      </div>
                      <div className="fd-range" title="대본 어디선가 가질 수 있는 값 (갈래를 모두 지난다고 보고 셈)">{valuesText(d.values.get(f.name), f.kind)}</div>
                      {notes?.map((n) => (
                        <div key={n} className="fd-note">⚠ {n}</div>
                      ))}
                    </th>
                    {d.boxes.map((b) => {
                      const k = cellKey(f.name, b.id);
                      const us = d.cells.get(k);
                      const warn = d.cellNotes.get(k);
                      const on = open?.flag === f.name && open.box === b.id;
                      return (
                        <td key={b.id} className={'fd-cell' + (us ? ' used' : '') + (warn ? ' warn' : '') + (on ? ' on' : '')}>
                          <button onClick={(e) => setOpen(on ? null : { flag: f.name, box: b.id, el: e.currentTarget })} title={warn ? '⚠ ' + warn : us ? '눌러서 고쳐요' : '눌러서 이 상자에 바꾸기·조건을 더해요'}>
                            {us?.map((u, i) => (
                              <span key={i} className={'fd-use ' + (isWrite(u) ? 'w' : 'r')}>
                                {isWrite(u) ? '✎' : '?'} {shortOf(u, f.name)}
                              </span>
                            ))}
                            {warn && <span className="fd-warn">⚠</span>}
                          </button>
                        </td>
                      );
                    })}
                    {!d.boxes.length && <td />}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {wiz && <FlagWizard onClose={() => setWiz(false)} />}
      </div>
      {open && (() => {
        const f = flags.find((x) => x.name === open.flag);
        const b = project.nodes.find((x) => x.id === open.box);
        if (!f || !b) return null;
        return <CellPop f={f} b={b} uses={d.cells.get(cellKey(f.name, b.id)) ?? []} warn={d.cellNotes.get(cellKey(f.name, b.id))} anchor={open.el} onClose={() => setOpen(null)} />;
      })()}
    </div>
  );
}

// 칸 하나를 고치는 팝오버: 쓰임마다 고르는 칸, 아래에 더하기
function CellPop({ f, b, uses, warn, anchor, onClose }: { f: Flag; b: BoxNode; uses: DUse[]; warn?: string; anchor: HTMLElement; onClose: () => void }) {
  const update = useStore((s) => s.update);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // 칸 위쪽에 (시트가 아래에 붙어 있어서), 모자라면 아래. 화면 밖으로 안 나가게
  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect();
    const w = box.current?.offsetWidth ?? 320;
    const h = box.current?.offsetHeight ?? 200;
    const left = Math.max(8, Math.min(a.left, window.innerWidth - w - 8));
    const top = a.top - 6 - h >= 8 ? a.top - 6 - h : Math.min(a.bottom + 6, window.innerHeight - h - 8);
    setPos((o) => (o && Math.abs(o.left - left) < 1 && Math.abs(o.top - top) < 1 ? o : { left, top }));
  });
  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
      anchor.focus();
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('keydown', key, true);
    };
  });

  const node = (p: Project) => p.nodes.find((n) => n.id === b.id)!;
  const choiceOf = (p: Project, id: string) => {
    const e = node(p).exit;
    return e.type === 'menu' ? e.choices.find((c) => c.id === id) : undefined;
  };
  const key = (u: DUse) => 'fd' + b.id + JSON.stringify(u).slice(0, 60);

  const row = (u: DUse, i: number) => {
    switch (u.at) {
      case 'line':
        return (
          <div key={i} className="fd-row">
            <span className="fd-where">⚑ 플래그 바꾸기 줄</span>
            <ActionInput value={u.text} onChange={(v) => update((p) => void (node(p).lines.find((l) => l.id === u.lineId)!.text = v), key(u))} />
            <button className="x" title="이 줄 지우기" onClick={() => update((p) => void (node(p).lines = node(p).lines.filter((l) => l.id !== u.lineId)))}>✕</button>
          </div>
        );
      case 'cmd':
        return (
          <div key={i} className="fd-row">
            <span className="fd-where">명령 줄 (상자에서 고쳐요)</span>
            <code className="fd-code">{u.text}</code>
          </div>
        );
      case 'act':
        return (
          <div key={i} className="fd-row">
            <span className="fd-where">{`◆ "${u.choice || '(빈 선택지)'}" 고르면`}</span>
            <ActionInput value={u.text} onChange={(v) => update((p) => void (choiceOf(p, u.choiceId)!.actions[u.idx] = v), key(u))} />
            <button className="x" title="이 바꾸기 빼기" onClick={() => update((p) => void choiceOf(p, u.choiceId)!.actions.splice(u.idx, 1))}>✕</button>
          </div>
        );
      case 'cond':
        return (
          <div key={i} className="fd-row">
            <span className="fd-where">{`◆ "${u.choice || '(빈 선택지)'}" 보이는 조건`}</span>
            <CondInput compact value={u.text} onChange={(v) => update((p) => void (choiceOf(p, u.choiceId)!.condition = v.trim() ? v : null), key(u))} />
          </div>
        );
      case 'branch':
        return (
          <div key={i} className="fd-row">
            <span className="fd-where">{`◇ 조건 분기 ${u.idx + 1}번 갈래`}</span>
            <CondInput compact value={u.text} onChange={(v) => update((p) => {
              const e = node(p).exit;
              if (e.type === 'if') e.branches.find((x) => x.id === u.branchId)!.cond = v;
            }, key(u))} />
          </div>
        );
    }
  };

  const e = b.exit;
  const addLine = () => update((p) => void node(p).lines.push({ id: uid('l'), type: 'flag', text: firstAct(f) }));
  return createPortal(
    <div ref={box} className="fd-pop" style={pos ?? { opacity: 0 }} role="dialog" aria-label="칸 고치기">
      <div className="fd-pop-head">
        <code>{f.name}</code> <b>{titleOf(b)}</b>
        <span className="sp" />
        <button className="fd-goto" onClick={() => go(b.id)} title="캔버스에서 이 상자 보기">상자 보기</button>
      </div>
      {warn && <div className="fd-pop-warn">⚠ {warn}</div>}
      {uses.map(row)}
      <div className="fd-add">
        <div className="fd-sec">더하기</div>
        <button onClick={addLine} title="상자 끝에 플래그 바꾸기 줄을 넣어요">✎ 상자 끝에 바꾸기 줄</button>
        {e.type === 'menu' &&
          e.choices.map((c) => (
            <span key={c.id} className="fd-addrow">
              <button onClick={() => update((p) => void choiceOf(p, c.id)!.actions.push(firstAct(f)))} title="이 선택지를 고르면 플래그를 바꿔요">{`✎ "${c.text || '(빈 선택지)'}" 고르면`}</button>
              <button onClick={() => update((p) => void (choiceOf(p, c.id)!.condition = addClause(c.condition, f)))} title="이 플래그 값에 따라 선택지를 보이게 해요">{`? 보이는 조건`}</button>
            </span>
          ))}
        {e.type === 'if' &&
          e.branches.map((br, i) => (
            <button key={br.id} onClick={() => update((p) => {
              const x = node(p).exit;
              if (x.type === 'if') {
                const t = x.branches.find((y) => y.id === br.id)!;
                t.cond = t.cond.trim() ? addClause(t.cond, f) : condText({ join: 'and', clauses: [firstClause(f)] });
              }
            })} title="이 갈래 조건에 이 플래그를 더해요">{`? 조건 분기 ${i + 1}번 갈래에`}</button>
          ))}
      </div>
    </div>,
    document.body,
  );
}
