// 플래그 카드(오른쪽 칸 맨 위, 늘 보임)와 조건 칸, 바꾸기 칸 (FEATURE 14)
import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { Card } from './Card';
import type { Flag, FlagKind } from './types';
import { uid } from './util';
import { actionText, condSnippet, exprNames, fitInit, flagNameProblem, flagUses, KIND_LABEL, newFlagName, parseAction, renameFlag, type Op } from './flags';

export function FlagsCard() {
  const flags = useStore((s) => s.project.variables);
  const update = useStore((s) => s.update);
  const add = () =>
    update((p) => {
      p.variables.push({ id: uid('v'), name: newFlagName(p), kind: 'bool', init: false });
    });
  return (
    <Card
      id="i-flags"
      title={<>플래그 {flags.length > 0 && <span className="count">{flags.length}</span>}</>}
      hint="이야기가 기억하는 값 (만났는지, 호감도 등). 선택지의 조건·고르면, 조건 분기, 플래그 바꾸기 줄에서 써요. 원고 맨 위에 default로 처음 값을 적어요"
      topic="플래그"
      extra={<button onClick={add}>+ 추가</button>}
    >
      {!flags.length && <p className="tip">플래그가 없어요. [+ 추가]로 만들어요 (예: met_alice 켜짐/꺼짐, love 숫자).</p>}
      {flags.map((f) => (
        <FlagRow key={f.id} f={f} />
      ))}
    </Card>
  );
}

function FlagRow({ f }: { f: Flag }) {
  const update = useStore((s) => s.update);
  const project = useStore((s) => s.project);
  const [name, setName] = useState(f.name);
  useEffect(() => setName(f.name), [f.name]);
  const why = flagNameProblem(project, name, f.id);
  const uses = flagUses(project, f.name);
  const set = (fn: (x: Flag) => void, key?: string) => update((p) => fn(p.variables.find((v) => v.id === f.id)!), key);

  // 이름은 입력을 마쳤을 때 확정하고, 쓰인 곳(조건, 고르면, 바꾸기 줄)도 같이 바꾼다
  const commit = () => {
    if (name === f.name) return;
    if (why) {
      alert(`"${name}"는 플래그 이름으로 쓸 수 없어요: ${why}`);
      return setName(f.name);
    }
    update((p) => {
      renameFlag(p, f.name, name);
      p.variables.find((v) => v.id === f.id)!.name = name;
    });
  };
  const remove = () => {
    if (uses.length && !confirm(`"${f.name}"를 ${uses.length}곳에서 쓰고 있어요. 그래도 지울까요? (쓴 곳의 식은 그대로 남아요)`)) return;
    update((p) => void (p.variables = p.variables.filter((v) => v.id !== f.id)));
  };
  const go = (id: string) => {
    useStore.getState().select([id]);
    useStore.getState().focusNodes([id]);
  };
  const boxName = (id: string) => {
    const n = project.nodes.find((x) => x.id === id);
    return n?.title || id;
  };

  return (
    <div className="flag">
      <div className="item">
        <input className={'fname' + (why ? ' invalid' : '')} value={name} spellCheck={false} onChange={(e) => setName(e.target.value.replace(/\s/g, '_'))} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} title={why || '렌파이 변수 이름 (영문·숫자·_)'} />
        <select value={f.kind} onChange={(e) => set((x) => void ((x.kind = e.target.value as FlagKind), (x.init = fitInit(x.kind, x.init))))} title="종류">
          {(Object.keys(KIND_LABEL) as FlagKind[]).map((k) => (
            <option key={k} value={k}>{KIND_LABEL[k]}</option>
          ))}
        </select>
        <InitInput f={f} set={set} />
        <button className="x" onClick={remove} title="삭제">✕</button>
      </div>
      <input className="fnote" value={f.note ?? ''} placeholder="메모 (예: 앨리스를 만났는지)" onChange={(e) => set((x) => void (e.target.value ? (x.note = e.target.value) : delete x.note), 'fnote' + f.id)} />
      <div className="flag-uses">
        {!uses.length && <span className="tip">아직 안 씀</span>}
        {uses.map((u, i) => (
          <button key={i} className={'flag-use' + (u.write ? ' w' : '')} onClick={() => go(u.nodeId)} title={(u.write ? '바꾸는 곳' : '보는 곳') + ' · 누르면 그 상자로'}>
            {u.write ? '✎' : '?'} {boxName(u.nodeId)} · {u.where}
          </button>
        ))}
      </div>
    </div>
  );
}

function InitInput({ f, set }: { f: Flag; set: (fn: (x: Flag) => void, key?: string) => void }) {
  if (f.kind === 'bool')
    return (
      <select className="finit" value={f.init ? '1' : ''} onChange={(e) => set((x) => void (x.init = !!e.target.value))} title="처음 값">
        <option value="">처음 꺼짐</option>
        <option value="1">처음 켜짐</option>
      </select>
    );
  if (f.kind === 'int')
    return <input className="finit" type="number" value={Number(f.init)} onChange={(e) => set((x) => void (x.init = fitInit('int', e.target.value)), 'finit' + f.id)} title="처음 값" />;
  return <input className="finit" value={String(f.init)} placeholder="처음 글" onChange={(e) => set((x) => void (x.init = e.target.value), 'finit' + f.id)} title="처음 값" />;
}

// 조건 칸: 렌파이 조건식을 그대로 쓰고, 옆 [플래그 ▾]로 이름을 골라 넣는다. 플래그 카드에 없는 이름이면 빨간 테두리
export function CondInput({ value, onChange, id, placeholder, className = '' }: { value: string; onChange: (v: string) => void; id?: string; placeholder?: string; className?: string }) {
  const flags = useStore((s) => s.project.variables);
  const chars = useStore((s) => s.project.characters);
  const ref = useRef<HTMLInputElement>(null);
  const unknown = exprNames(value).filter((n) => !flags.some((f) => f.name === n) && !chars.some((c) => c.id === n));
  const insert = (fid: string) => {
    const f = flags.find((x) => x.id === fid);
    if (!f) return;
    const el = ref.current;
    const at = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? at;
    const before = value.slice(0, at).replace(/\s+$/, '');
    const after = value.slice(end).replace(/^\s+/, '');
    const needAnd = before && !/(\band|\bor|\bnot|[(=<>!])$/.test(before);
    onChange([before, needAnd ? 'and' : '', condSnippet(f), after].filter(Boolean).join(' '));
    requestAnimationFrame(() => el?.focus());
  };
  return (
    <span className={'cond-in ' + className}>
      <input ref={ref} id={id} className={'br-cond' + (unknown.length ? ' invalid' : '')} spellCheck={false} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} title={unknown.length ? `플래그 카드에 없는 이름: ${unknown.join(', ')}` : '렌파이 조건식 (예: love >= 5, met_alice, not rich)'} />
      {flags.length > 0 && (
        <select className="flag-pick" value="" onChange={(e) => insert(e.target.value)} title="플래그를 골라 조건에 넣어요">
          <option value="">플래그 ▾</option>
          {flags.map((f) => (
            <option key={f.id} value={f.id}>{f.name} ({KIND_LABEL[f.kind]})</option>
          ))}
        </select>
      )}
    </span>
  );
}

// 바꾸기 칸 하나: [플래그] [어떻게] [값]. 이 모양으로 읽을 수 없는 식은 글 칸으로 그대로 고친다
export function ActionInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const flags = useStore((s) => s.project.variables);
  const a = parseAction(value);
  const f = a ? flags.find((x) => x.name === a.name) : undefined;
  const [raw, setRaw] = useState(false);
  if (raw || !flags.length || (value.trim() && !f))
    return (
      <span className="act-in">
        <input id={id} className={'br-cond' + (value.trim() && !a ? ' invalid' : '')} spellCheck={false} value={value} placeholder={flags.length ? '바꾸는 식 (예: love += 1)' : '플래그 카드에서 먼저 플래그를 만들어요'} onChange={(e) => onChange(e.target.value)} />
        {flags.length > 0 && raw && <button title="고르는 칸으로" onClick={() => setRaw(false)}>▾</button>}
      </span>
    );
  const pick = (fid: string) => {
    const nf = flags.find((x) => x.id === fid);
    if (!nf) return;
    onChange(actionText(nf.kind === 'bool' ? { name: nf.name, op: '=', value: 'True' } : nf.kind === 'int' ? { name: nf.name, op: '+=', value: '1' } : { name: nf.name, op: '=', value: '""' }));
  };
  const op = a?.op ?? '=';
  const setOp = (o: Op) => a && onChange(actionText({ ...a, op: o }));
  const setVal = (v: string) => a && onChange(actionText({ ...a, value: v }));
  const strVal = (v: string) => '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const unStr = (v: string) => {
    const m = /^"(.*)"$/.exec(v);
    return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : v;
  };
  return (
    <span className="act-in">
      <select id={id} value={f?.id ?? ''} onChange={(e) => pick(e.target.value)} title="바꿀 플래그">
        {!f && <option value="">플래그 고르기</option>}
        {flags.map((x) => (
          <option key={x.id} value={x.id}>{x.name}</option>
        ))}
      </select>
      {f?.kind === 'bool' && (
        <select value={a?.value === 'False' ? 'False' : a?.value === 'True' ? 'True' : a?.value === `not ${f.name}` ? 'flip' : ''} onChange={(e) => setVal(e.target.value === 'flip' ? `not ${f.name}` : e.target.value)}>
          {!['True', 'False', `not ${f.name}`].includes(a?.value ?? '') && <option value="">{a?.value}</option>}
          <option value="True">켜기</option>
          <option value="False">끄기</option>
          <option value="flip">뒤집기</option>
        </select>
      )}
      {f?.kind === 'int' && (
        <>
          <select value={op} onChange={(e) => setOp(e.target.value as Op)}>
            <option value="+=">더하기 +</option>
            <option value="-=">빼기 −</option>
            <option value="=">정하기 =</option>
          </select>
          <input type="number" className="act-num" value={Number.isFinite(parseFloat(a?.value ?? '')) ? parseFloat(a!.value) : ''} onChange={(e) => setVal(e.target.value || '0')} />
        </>
      )}
      {f?.kind === 'str' && <input className="act-str" value={unStr(a?.value ?? '')} placeholder="글" onChange={(e) => setVal(strVal(e.target.value))} />}
      <button title="식으로 직접 쓰기" onClick={() => setRaw(true)}>{'{ }'}</button>
    </span>
  );
}

// 값을 고르기 전 처음 식 (플래그 카드의 첫 플래그)
export function firstAction(flags: Flag[]) {
  const f = flags[0];
  if (!f) return '';
  return actionText(f.kind === 'bool' ? { name: f.name, op: '=', value: 'True' } : f.kind === 'int' ? { name: f.name, op: '+=', value: '1' } : { name: f.name, op: '=', value: '""' });
}

