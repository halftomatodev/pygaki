// 플래그 설계 마법사 (2단계 "틀에서 만들기"): 플래그 설계 시트의 오른쪽 칸. 계산은 flagWiz.ts
// 단계(Steps 꼴): 틀 → 플래그 → 바꾸는 곳 → 보는 곳 → 확인. [만들기]는 update 한 번이라 실행 취소 한 번에 되돌아간다
import { useMemo, useState } from 'react';
import { useStore } from './store';
import type { BoxNode, Project } from './types';
import { KIND_LABEL } from './flags';
import { flowOrder } from './flagTable';
import { allChoices, applyPlan, canBranch, makePlan, nameCheck, planWarnings, recipeOf, routeValues, startState, stepProblem, WIZ_RECIPES, WIZ_SHAPES, type WizState } from './flagWiz';

const STEPS = ['틀', '플래그', '바꾸는 곳', '보는 곳', '확인'];
const titleOf = (b: BoxNode) => b.title || b.id;
const go = (id: string) => {
  useStore.getState().select([id]);
  useStore.getState().focusNodes([id]);
};

export function FlagWizard({ onClose }: { onClose: () => void }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizState | null>(null);
  const set = (fn: (x: WizState) => void) => setS((o) => (o ? (() => { const n = structuredClone(o); fn(n); return n; })() : o));
  const pickRecipe = (id: string) => {
    setS(s?.recipe === id ? s : startState(project, id, useStore.getState().selectedIds));
    setStep(1);
  };
  const why = s && step >= 1 && step <= 3 ? stepProblem(project, s, step) : '';
  const make = () => {
    if (!s) return;
    const plan = makePlan(project, s);
    let touched: string[] = [];
    update((p) => void (touched = applyPlan(p, plan)));
    useStore.getState().say('틀대로 만들었어요. Ctrl+Z 한 번이면 되돌아가요');
    if (touched.length) useStore.getState().focusNodes(touched);
    onClose();
  };

  return (
    <div className="fwiz" role="region" aria-label="틀에서 만들기">
      <div className="fwiz-head">
        <b>틀에서 만들기</b>
        <span className="sp" />
        <button className="fwiz-x" onClick={onClose} title="마법사 닫기 (Esc)">✕</button>
      </div>
      <ol className="fwiz-steps">
        {STEPS.map((t, i) => (
          <li key={t} className={i < step ? 'done' : i === step ? 'now' : ''} aria-current={i === step ? 'step' : undefined}>
            <button disabled={i > step || (i > 0 && !s)} onClick={() => setStep(i)} title={t}>
              <span className="dot">{i < step ? '✓' : String(i + 1)}</span>
              <span className="nm">{t}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="fwiz-body">
        {step === 0 && <RecipeStep cur={s?.recipe} onPick={pickRecipe} />}
        {s && step === 1 && <NameStep p={project} s={s} set={set} />}
        {s && step === 2 && <WriteStep p={project} s={s} set={set} />}
        {s && step === 3 && <ReadStep p={project} s={s} set={set} />}
        {s && step === 4 && <ConfirmStep p={project} s={s} />}
      </div>
      <div className="fwiz-foot">
        {why && <span className="fwiz-why">{why}</span>}
        <span className="sp" />
        {step > 0 && <button onClick={() => setStep(step - 1)}>이전</button>}
        {step > 0 && step < 4 && (
          <button className="primary" disabled={!!why} onClick={() => setStep(step + 1)}>
            다음
          </button>
        )}
        {step === 4 && (
          <button className="primary" onClick={make} title="플래그와 바꾸는 곳, 보는 곳을 한 번에 넣어요 (실행 취소 한 번)">
            만들기
          </button>
        )}
      </div>
    </div>
  );
}

function RecipeStep({ cur, onPick }: { cur?: string; onPick: (id: string) => void }) {
  return (
    <div className="fwiz-list">
      <p className="tip">어떤 플래그를 짤지 골라요. 틀대로 플래그, 바꾸는 곳, 보는 곳을 한 번에 넣어요.</p>
      {WIZ_RECIPES.map((r) => (
        <button key={r.id} className={'fwiz-recipe' + (cur === r.id ? ' on' : '')} onClick={() => onPick(r.id)}>
          <span className="ic">{r.icon}</span>
          <span className="tx">
            <b>{r.title}</b>
            <span className="tip">{r.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

type StepProps = { p: Project; s: WizState; set: (fn: (x: WizState) => void) => void };

function NameStep({ p, s, set }: StepProps) {
  const r = recipeOf(s.recipe);
  return (
    <div className="fwiz-list">
      <p className="tip">{r.desc}</p>
      {r.flags.map((f, i) => {
        const w = nameCheck(p, s, i);
        return (
          <div key={i} className="fwiz-field">
            <label>
              <span className="lb">{r.flags.length > 1 ? `플래그 ${i + 1} 이름` : '플래그 이름'}</span>
              <input value={s.names[i]} spellCheck={false} onChange={(e) => set((x) => void (x.names[i] = e.target.value))} />
              <span className="fd-kind">{KIND_LABEL[f.kind]}</span>
            </label>
            {w === 'reuse' ? <div className="tip">이미 있는 플래그를 써요</div> : w ? <div className="fwiz-bad">{w}</div> : <div className="tip">{f.note}</div>}
          </div>
        );
      })}
    </div>
  );
}

// 흐름 순서의 상자 (닿지 않는 상자도 뒤에)
const useOrder = (p: Project) => useMemo(() => flowOrder(p).order, [p]);

function WriteStep({ p, s, set }: StepProps) {
  const r = recipeOf(s.recipe);
  const sh = WIZ_SHAPES[s.recipe];
  const order = useOrder(p);
  const sel = useStore((x) => x.selectedIds);
  if (sh.write === 'boxes') {
    const on = (id: string) => s.picks.some((x) => x.boxId === id);
    return (
      <div className="fwiz-list">
        <p className="tip">{`${s.names[0]}을(를) 켤 상자를 골라요. 상자 끝에 ⚑ 플래그 바꾸기 줄(켜기)이 들어가요.`}</p>
        {order.map((b) => (
          <label key={b.id} className={'fwiz-pick' + (sel.includes(b.id) ? ' sel' : '')}>
            <input type="checkbox" checked={on(b.id)} onChange={() => set((x) => void (x.picks = on(b.id) ? x.picks.filter((y) => y.boxId !== b.id) : [...x.picks, { boxId: b.id, flag: 0 }]))} />
            <span className="nm">{titleOf(b)}</span>
            <button className="fwiz-go" onClick={(e) => (e.preventDefault(), go(b.id))} title="캔버스에서 이 상자 보기">보기</button>
          </label>
        ))}
      </div>
    );
  }
  const list = allChoices(p);
  const byBox = order.map((b) => ({ b, cs: list.filter((x) => x.box.id === b.id).map((x) => x.choice) })).filter((x) => x.cs.length);
  const pickOf = (id: string) => s.picks.find((x) => x.choiceId === id);
  const toggle = (id: string, flag: number) =>
    set((x) => {
      const cur = x.picks.find((y) => y.choiceId === id);
      x.picks = x.picks.filter((y) => y.choiceId !== id);
      if (!cur || cur.flag !== flag) x.picks.push({ choiceId: id, flag });
    });
  const how = r.flags[0].kind === 'int' ? '+1' : r.flags[0].kind === 'bool' ? '켜기' : '글자 기억';
  return (
    <div className="fwiz-list">
      <p className="tip">{r.flags.length > 1 ? '선택지마다 어느 플래그를 올릴지 골라요 (+1).' : `${s.names[0]}을(를) 바꿀 선택지를 골라요 (${how}). 캔버스에서 고른 상자가 진하게 보여요.`}</p>
      {!byBox.length && <p className="fwiz-bad">대본에 선택지가 없어요. 상자의 다음 흐름을 선택지로 바꾼 뒤 다시 와요.</p>}
      {byBox.map(({ b, cs }) => (
        <div key={b.id} className={'fwiz-group' + (sel.includes(b.id) ? ' sel' : '')}>
          <button className="fwiz-gname" onClick={() => go(b.id)} title="캔버스에서 이 상자 보기">{titleOf(b)}</button>
          {cs.map((c) => {
            const pk = pickOf(c.id);
            const text = c.text || '(빈 선택지)';
            if (r.flags.length > 1)
              return (
                <div key={c.id} className="fwiz-pick">
                  <span className="nm">{`◆ ${text}`}</span>
                  <span className="fwiz-seg" role="group">
                    {s.names.map((n, i) => (
                      <button key={i} className={pk?.flag === i ? 'on' : ''} aria-pressed={pk?.flag === i} onClick={() => toggle(c.id, i)}>{n || '?'}</button>
                    ))}
                  </span>
                </div>
              );
            return (
              <label key={c.id} className="fwiz-pick">
                <input type="checkbox" checked={!!pk} onChange={() => toggle(c.id, 0)} />
                <span className="nm">{`◆ ${text}`}</span>
                {pk && s.recipe === 'route' && (
                  <input className="fwiz-val" value={pk.value ?? ''} placeholder="기억할 글자 (예: sea)" spellCheck={false} onChange={(e) => set((x) => void (x.picks.find((y) => y.choiceId === c.id)!.value = e.target.value))} />
                )}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BoxSelect({ p, value, onChange, filter, empty }: { p: Project; value: string | null; onChange: (v: string | null) => void; filter?: (b: BoxNode) => boolean; empty: string }) {
  const order = useOrder(p);
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{empty}</option>
      {order.filter((b) => !filter || filter(b)).map((b) => (
        <option key={b.id} value={b.id}>{titleOf(b)}</option>
      ))}
    </select>
  );
}

function ReadStep({ p, s, set }: StepProps) {
  const r = recipeOf(s.recipe);
  const sh = WIZ_SHAPES[s.recipe];
  const order = useOrder(p);
  const sel = useStore((x) => x.selectedIds);
  const isInt = r.flags[0].kind === 'int';
  const thr = isInt && (
    <label className="fwiz-field row">
      <span className="lb">기준 값</span>
      <input type="number" value={s.threshold} onChange={(e) => set((x) => void (x.threshold = Math.round(Number(e.target.value) || 0)))} />
      <span className="tip">{`${s.names.filter(Boolean).join(', ')} ≥ ${s.threshold}이면`}</span>
    </label>
  );
  if (sh.read === 'conds') {
    const list = allChoices(p);
    const on = (id: string) => s.readChoices.includes(id);
    return (
      <div className="fwiz-list">
        <p className="tip">{isInt ? `${s.names[0]}이(가) 기준 값 이상일 때만 보일 선택지를 골라요. 아니면 그 선택지가 숨어요.` : `${s.names[0]}이(가) 켜졌을 때만 보일 선택지를 골라요. 아니면 그 선택지가 숨어요.`}</p>
        {thr}
        {order.map((b) => {
          const cs = list.filter((x) => x.box.id === b.id);
          if (!cs.length) return null;
          return (
            <div key={b.id} className={'fwiz-group' + (sel.includes(b.id) ? ' sel' : '')}>
              <button className="fwiz-gname" onClick={() => go(b.id)} title="캔버스에서 이 상자 보기">{titleOf(b)}</button>
              {cs.map(({ choice: c }) => (
                <label key={c.id} className="fwiz-pick">
                  <input type="checkbox" checked={on(c.id)} onChange={() => set((x) => void (x.readChoices = on(c.id) ? x.readChoices.filter((y) => y !== c.id) : [...x.readChoices, c.id]))} />
                  <span className="nm">{`◆ ${c.text || '(빈 선택지)'}`}</span>
                  {c.condition && <span className="tip">{`지금 조건: ${c.condition}`}</span>}
                </label>
              ))}
            </div>
          );
        })}
      </div>
    );
  }
  const box = s.readBox ? p.nodes.find((b) => b.id === s.readBox) : undefined;
  const selBox = p.nodes.find((b) => sel.includes(b.id) && canBranch(b));
  const setBox = (id: string | null) =>
    set((x) => {
      x.readBox = id;
      const b = p.nodes.find((y) => y.id === id);
      x.elseTarget = b?.exit.type === 'next' ? b.exit.target : null;
    });
  const rows = s.recipe === 'route' ? routeValues(s).map((v) => `${s.names[0]} = "${v}"이면`) : (sh.rows ?? []);
  return (
    <div className="fwiz-list">
      <p className="tip">갈라질 상자를 골라요. 그 상자의 대사가 끝나면 ◇ 조건 분기로 값에 따라 다른 상자로 가요.</p>
      <div className="fwiz-field">
        <span className="lb">갈라질 상자</span>
        <span className="fwiz-inline">
          <BoxSelect p={p} value={s.readBox} onChange={setBox} filter={canBranch} empty="(상자 고르기)" />
          {selBox && selBox.id !== s.readBox && <button onClick={() => setBox(selBox.id)} title="캔버스에서 고른 상자를 써요">{`캔버스의 "${titleOf(selBox)}"`}</button>}
        </span>
        <div className="tip">
          {box?.exit.type === 'if' ? '이미 조건 분기인 상자예요. 새 갈래를 맨 앞에 더해요.' : box?.exit.type === 'return' ? '끝나는 상자예요. "그 밖"을 비워 두면 지금처럼 끝나요([검사]에는 이을 곳으로 보여요).' : '다음 흐름이 선택지, call, 화면인 상자는 고를 수 없어요.'}
        </div>
      </div>
      {thr}
      {rows.map((t, i) => (
        <label key={i} className="fwiz-field row">
          <span className="lb">{s.recipe === 'route' ? t : s.recipe === 'met_once' ? `${s.names[0]} 켜짐 (${t})` : s.recipe === 'ending' && i === 0 ? `둘 다 넉넉 (${t})` : s.recipe === 'ending' ? `${s.names[0]}만 넉넉 (${t})` : `기준 값 이상 (${t})`}</span>
          <BoxSelect p={p} value={s.targets[i] ?? null} onChange={(v) => set((x) => void (x.targets[i] = v))} empty="(나중에 잇기)" />
        </label>
      ))}
      {box?.exit.type !== 'if' && (
        <label className="fwiz-field row">
          <span className="lb">그 밖</span>
          <BoxSelect p={p} value={s.elseTarget} onChange={(v) => set((x) => void (x.elseTarget = v))} empty="(나중에 잇기)" />
        </label>
      )}
    </div>
  );
}

function ConfirmStep({ p, s }: { p: Project; s: WizState }) {
  const plan = useMemo(() => makePlan(p, s), [p, s]);
  const warns = useMemo(() => planWarnings(p, plan, s.names.map((x) => x.trim())), [p, plan, s.names]);
  const choiceText = (id: string) => allChoices(p).find((x) => x.choice.id === id);
  const boxTitle = (id: string | null) => {
    const b = id ? p.nodes.find((x) => x.id === id) : undefined;
    return b ? titleOf(b) : '(나중에 잇기)';
  };
  return (
    <div className="fwiz-list">
      <p className="tip">이렇게 넣어요. 만든 뒤에도 표의 칸을 눌러 고칠 수 있어요.</p>
      <ul className="fwiz-sum">
        {plan.flags.map((f) => (
          <li key={f.name}>{`플래그 ${f.name} (${KIND_LABEL[f.kind]}) 새로 만들기`}</li>
        ))}
        {plan.acts.map((a, i) => {
          const c = choiceText(a.choiceId);
          return <li key={'a' + i} className="w">{`✎ ${c ? titleOf(c.box) : ''} ◆ "${c?.choice.text || '(빈 선택지)'}" 고르면 ${a.act}`}</li>;
        })}
        {plan.lines.map((l, i) => (
          <li key={'l' + i} className="w">{`✎ ${boxTitle(l.boxId)} 상자 끝 ⚑ ${l.act}`}</li>
        ))}
        {plan.conds.map((c, i) => {
          const x = choiceText(c.choiceId);
          return <li key={'c' + i} className="r">{`? ${x ? titleOf(x.box) : ''} ◆ "${x?.choice.text || '(빈 선택지)'}" 보이는 조건 ${c.cond}`}</li>;
        })}
        {plan.branch && (
          <li className="r">
            {`? ${boxTitle(plan.branch.boxId)} 상자 ◇ 조건 분기`}
            <ul>
              {plan.branch.rows.map((x, i) => (
                <li key={i}>{`${x.cond} → ${boxTitle(x.target)}`}</li>
              ))}
              {p.nodes.find((b) => b.id === plan.branch!.boxId)?.exit.type !== 'if' && <li>{`그 밖 → ${boxTitle(plan.branch.else)}`}</li>}
            </ul>
          </li>
        )}
      </ul>
      {warns.map((w) => (
        <div key={w} className="fd-pop-warn">{`⚠ ${w}`}</div>
      ))}
    </div>
  );
}
