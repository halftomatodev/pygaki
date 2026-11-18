// 조건 분기 칸 (세션 84): 대본 편집 오른쪽 칸에서 ◇ 조건 분기를 한눈에 보는 트리 (Tree View).
// 플래그(노랑) → ◇ 상자(보라) → 갈래 조건(파랑) → 갈 상자(초록). 시험 값(플래그 카드에서 끈 값)으로 지금 가는 갈래에 ✓.
// 켜면 선택지의 보이는 조건(◆)도 같이. 상자 이름을 누르면 캔버스에서 그 상자로. 갈 곳을 고르는 칸(TargetSelect)은 같은 요약(branchSummary)을 맨 위 묶음으로 보여 줌
import { useState } from 'react';
import { useStore } from './store';
import type { BoxNode, Project } from './types';
import { Card } from './Card';
import { exprNames } from './flags';
import { takenBranch, testVars, useFlagTest } from './flagUi';
import { evalExpr, UNKNOWN } from './trace';

interface Fork {
  node: BoxNode;
  kind: 'if' | 'menu';
  arms: { id: string; cond: string; text?: string; target: string | null; ok: boolean | null }[];
}

// 상자의 갈래들 (◇ 조건 분기는 그 밖까지, 선택지는 조건이 있는 것만)
function forksOf(p: Project, choices: boolean, vars: ReturnType<typeof testVars>): Fork[] {
  const out: Fork[] = [];
  for (const n of p.nodes) {
    const e = n.exit;
    if (e.type === 'if') {
      const t = takenBranch(p, n.id, vars);
      out.push({ node: n, kind: 'if', arms: [...e.branches.map((b) => ({ id: b.id, cond: b.cond, target: b.target, ok: t === null ? null : t === b.id })), { id: 'else', cond: '', target: e.else, ok: t === null ? null : t === 'else' }] });
    } else if (choices && e.type === 'menu') {
      const arms = e.choices.filter((c) => c.condition?.trim()).map((c) => {
        const v = evalExpr(c.condition!, vars);
        return { id: c.id, cond: c.condition!, text: c.text, target: c.target, ok: v === UNKNOWN ? null : !!v };
      });
      if (arms.length) out.push({ node: n, kind: 'menu', arms });
    }
  }
  return out;
}

// 갈래 조건이 보는 플래그 이름 (차례대로, 겹치지 않게)
const forkFlags = (p: Project, f: Fork) => {
  const known = new Set(p.variables.map((v) => v.name));
  const names: string[] = [];
  for (const a of f.arms) for (const x of exprNames(a.cond)) if (known.has(x) && !names.includes(x)) names.push(x);
  return names;
};

// 고르는 칸에 보일 한 줄 요약: "love >= 2 / trust >= 2 / 그 밖"
export function branchSummary(n: BoxNode): string {
  if (n.exit.type !== 'if') return '';
  return [...n.exit.branches.map((b) => b.cond.trim() || '(빈 조건)'), '그 밖'].join(' / ');
}

export function BranchCard() {
  const project = useStore((s) => s.project);
  const vals = useFlagTest((s) => s.vals);
  const [label, setLabel] = useState('');
  const [choices, setChoices] = useState(false);
  const vars = testVars(project, vals);
  const forks = forksOf(project, choices, vars).filter((f) => !label || f.node.group === label);
  // ◇ 조건 분기나 조건 있는 선택지가 하나도 없으면 칸을 안 보임
  const any = project.nodes.some((n) => n.exit.type === 'if' || (n.exit.type === 'menu' && n.exit.choices.some((c) => c.condition?.trim())));
  if (!any) return null;
  // 플래그 묶음: 보는 플래그 이름들이 같은 갈래끼리 (이름 순서는 처음 나온 대로). 플래그를 안 보는 것은 "플래그 없음"
  const groups = new Map<string, Fork[]>();
  for (const f of forks) {
    const k = forkFlags(project, f).join(' · ') || '';
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  const title = (id: string | null) => (id ? project.nodes.find((x) => x.id === id)?.title || id : null);
  const go = (id: string) => (useStore.getState().select([id]), useStore.getState().focusNodes([id]));
  return (
    <Card id="r-branch" title="조건 분기" hint="대본의 ◇ 조건 분기를 플래그 → 상자 → 갈래 조건 → 갈 상자 차례로 보여요. ✓는 플래그 카드의 시험 값으로 지금 가는 갈래예요. 상자 이름을 누르면 캔버스에서 그 상자로 가요" topic="조건 분기">
      <div className="row bt-tools">
        <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="장면 거르기">
          <option value="">모든 장면</option>
          {project.labels.map((g) => (
            <option key={g.id} value={g.id}>{g.title || g.name}</option>
          ))}
        </select>
        <label className="check" title="선택지의 보이는 조건(◆)도 같이 보여요">
          <input type="checkbox" checked={choices} onChange={(e) => setChoices(e.target.checked)} />
          선택지 조건도
        </label>
      </div>
      {!forks.length && <p className="tip">{label ? '이 장면에는 조건 분기가 없어요.' : '아직 조건 분기가 없어요. 상자의 [다음 흐름]에서 ◇ 조건 분기를 골라요.'}</p>}
      <ul className="bt" role="tree" aria-label="조건 분기">
        {[...groups].map(([k, fs]) => (
          <li key={k} role="treeitem" aria-expanded="true" className="bt-li">
            <span className="bt-pill bt-flag">{k ? k.split(' · ').map((x) => <code key={x}>{x}</code>) : <span className="tip">플래그 없음</span>}</span>
            <ul role="group">
              {fs.map((f) => (
                <li key={f.node.id + f.kind} role="treeitem" aria-expanded="true" className="bt-li">
                  <button className="bt-pill bt-box" onClick={() => go(f.node.id)} title="캔버스에서 이 상자로">
                    {f.kind === 'if' ? '◇' : '◆'} {f.node.title || f.node.id}
                  </button>
                  <ul role="group">
                    {f.arms.map((a) => (
                      <li key={a.id} role="treeitem" className={'bt-li bt-arm' + (a.ok ? ' ok' : a.ok === false ? ' no' : '')}>
                        <span className="bt-pill bt-cond">
                          {a.ok && <span className="bt-ok" title="시험 값으로 지금 이 갈래">✓</span>}
                          {a.id === 'else' ? <span className="bt-else">그 밖</span> : <code>{a.cond || '(빈 조건)'}</code>}
                          {a.text && <span className="bt-text">{a.text}</span>}
                        </span>
                        <span className="bt-arrow" aria-hidden>→</span>
                        {title(a.target) ? (
                          <button className="bt-pill bt-to" onClick={() => go(a.target!)} title="캔버스에서 이 상자로">{title(a.target)}</button>
                        ) : (
                          <span className="bt-pill bt-to none">이을 상자 없음</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}
