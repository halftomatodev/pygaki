// 판단 인스펙터 (플래그 꼴 2단계): ◇ 조건 분기 상자마다 숫자 플래그의 꼴(시험 값)과 갈래(판단)를 묶음으로 보여 줌.
// 판단은 종류(모두 넉넉, 하나라도, 합, 가장 큰 값)를 골라 더하고, 지금 시험 값으로 어느 갈래로 가서 무슨 대사가 나오는지 보여 줌
import { useState } from 'react';
import { useStore } from './store';
import type { Flag, Project } from './types';
import { CondInput } from './FlagFields';
import { FlagWidget } from './FlagWidget';
import { firstSay, flagUi, judgeBoxes, judgeCond, JUDGE_HINT, JUDGE_LABEL, takenBranch, testValue, testVars, useFlagTest, type JudgeKind } from './flagUi';
import { newBranch } from './ops';
import type { Val } from './trace';

export function JudgeInspector() {
  const project = useStore((s) => s.project);
  const nums = project.variables.filter((f) => f.kind === 'int');
  const used = judgeBoxes(project);
  const others = project.nodes.filter((n) => n.exit.type === 'if' && !used.some((u) => u.nodeId === n.id));
  const [extra, setExtra] = useState<string[]>([]); // 플래그를 아직 안 쓰는 ◇ 상자를 골라 연 것
  if (nums.length < 1 || (!used.length && !others.length)) return null;
  const shown = [...used.map((u) => u.nodeId), ...extra.filter((id) => others.some((n) => n.id === id))];
  const rest = others.filter((n) => !shown.includes(n.id));
  return (
    <div className="judge" aria-label="판단">
      <div className="judge-head">
        <b>판단</b>
        <span className="tip">숫자 플래그로 갈래를 나누는 ◇ 조건 분기</span>
      </div>
      {shown.map((id) => (
        <JudgeBox key={id} nodeId={id} />
      ))}
      {rest.length > 0 && (
        <select className="judge-open" value="" onChange={(e) => e.target.value && setExtra((x) => [...x, e.target.value])} title="플래그를 아직 안 쓰는 ◇ 조건 분기 상자에 판단을 더해요">
          <option value="">+ ◇ 상자 열기</option>
          {rest.map((n) => (
            <option key={n.id} value={n.id}>{n.title || n.id}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function JudgeBox({ nodeId }: { nodeId: string }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const vals = useFlagTest((s) => s.vals);
  const [open, setOpen] = useState(true);
  const n = project.nodes.find((x) => x.id === nodeId);
  if (!n || n.exit.type !== 'if') return null;
  const e = n.exit;
  const nums = project.variables.filter((f) => f.kind === 'int');
  const involved = nums.filter((f) => e.branches.some((b) => new RegExp(`(?<![A-Za-z0-9_])${f.name}(?![A-Za-z0-9_])`).test(b.cond)));
  const vars = testVars(project, vals);
  const taken = takenBranch(project, nodeId, vars);
  const title = (id: string | null) => (id ? project.nodes.find((x) => x.id === id)?.title || id : '(이을 상자 없음)');
  const go = (id: string) => (useStore.getState().select([id]), useStore.getState().focusNodes([id]));
  const ifOf = (p: Project) => {
    const x = p.nodes.find((y) => y.id === nodeId)!.exit;
    return x.type === 'if' ? x : null;
  };
  const setTest = (f: Flag, v: Val) => useFlagTest.setState((s) => ({ vals: { ...s.vals, [f.id]: v } }));

  return (
    <section className="judge-box">
      <header>
        <button className="judge-fold" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? '▾' : '▸'}</button>
        <button className="linklike" onClick={() => go(nodeId)} title="누르면 그 상자로">◇ {n.title || nodeId}</button>
      </header>
      {open && (
        <>
          {involved.map((f) => (
            <div key={f.id} className="judge-look">
              <code>{f.name}</code>
              <FlagWidget ui={flagUi(f)} value={testValue(f, vals)} onChange={(v) => setTest(f, v)} label={f.name} />
            </div>
          ))}
          <ol className="judge-rules">
            {e.branches.map((b, i) => (
              <li key={b.id} className={taken === b.id ? 'on' : ''}>
                <span className="judge-n">{i === 0 ? 'if' : 'elif'}</span>
                <CondInput compact value={b.cond} onChange={(v) => update((p) => void (ifOf(p)!.branches[i].cond = v), 'jcond' + b.id)} />
                <span className="judge-to">→ {title(b.target)}</span>
                {i > 0 && (
                  <button className="x" title="위로 (위 갈래부터 봐요)" onClick={() => update((p) => { const br = ifOf(p)!.branches; [br[i - 1], br[i]] = [br[i], br[i - 1]]; })}>↑</button>
                )}
                {taken === b.id && <span className="judge-say">✓ {firstSay(project, b.target) || title(b.target)}</span>}
              </li>
            ))}
            <li className={taken === 'else' ? 'on' : ''}>
              <span className="judge-n">else</span>
              <span className="judge-to">→ {title(e.else)}</span>
              {taken === 'else' && <span className="judge-say">✓ {firstSay(project, e.else) || title(e.else)}</span>}
            </li>
          </ol>
          <JudgeAdd nums={nums} def={involved} onAdd={(cond) => update((p) => void ifOf(p)!.branches.push(newBranch(null, cond)))} />
        </>
      )}
    </section>
  );
}

// 판단 더하기: 종류, 플래그(여럿), 기준 값 → 새 갈래 (이을 상자는 캔버스에서 선으로)
function JudgeAdd({ nums, def, onAdd }: { nums: Flag[]; def: Flag[]; onAdd: (cond: string) => void }) {
  const [kind, setKind] = useState<JudgeKind>('all');
  const [pick, setPick] = useState<string[]>(() => (def.length ? def : nums.slice(0, 2)).map((f) => f.name));
  const [at, setAt] = useState(2);
  const cond = judgeCond(kind, pick, at);
  return (
    <div className="judge-add">
      <select value={kind} onChange={(e) => setKind(e.target.value as JudgeKind)} title={JUDGE_HINT[kind]}>
        {(Object.keys(JUDGE_LABEL) as JudgeKind[]).map((k) => (
          <option key={k} value={k}>{JUDGE_LABEL[k]}</option>
        ))}
      </select>
      <span className="judge-flags">
        {nums.map((f) => (
          <label key={f.id} className={'chip' + (pick.includes(f.name) ? ' on' : '')}>
            <input type="checkbox" checked={pick.includes(f.name)} onChange={(e) => setPick((x) => (e.target.checked ? [...x, f.name] : x.filter((y) => y !== f.name)))} />
            {f.name}
          </label>
        ))}
      </span>
      {kind !== 'top' || pick.length < 2 ? (
        <label className="judge-at">
          기준 <input type="number" value={at} onChange={(e) => setAt(Math.round(Number(e.target.value) || 0))} />
        </label>
      ) : null}
      <code className="judge-prev" title={JUDGE_HINT[kind]}>{cond || '플래그를 골라요'}</code>
      <button disabled={!cond} onClick={() => onAdd(cond)} title="이 판단을 맨 아래 갈래로 더해요. 이을 상자는 캔버스에서 선으로 이어요">+ 판단 더하기</button>
    </div>
  );
}
