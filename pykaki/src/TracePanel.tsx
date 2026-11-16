// 플래그 따라가 보기 (3단계): 시작 상자부터 선택지를 골라 가며 플래그 값과 조건 분기 갈래를 본다. 대본은 고치지 않는다
import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import type { BoxNode, Project } from './types';
import { parseAction } from './flags';
import { applyAction, boxActions, evalExpr, initVars, showVal, UNKNOWN, type Vars } from './trace';
import { useGameFolder } from './gameFolder';
import { ScreenArt } from './ScreensView';
import { isHud } from './screens';

interface Change { name: string; from: string; to: string }
// huds: HUD 줄로 띄워 둔 화면 id (FEATURE 18. 게임 내내 띄우는 HUD는 따로)
interface Step { box: string; vars: Vars; changes: Change[]; via: string; stack: (string | null)[]; huds: string[] }

const close = () => useStore.setState({ showTrace: null });
const titleOf = (b?: BoxNode) => (b ? b.title || b.id : '(없는 상자)');

// 바꾸는 식들을 적용하고 바뀐 것을 적는다
function run(acts: string[], vars: Vars, changes: Change[]) {
  for (const a of acts) {
    const n = parseAction(a)?.name ?? '';
    const from = n in vars ? showVal(vars[n]) : '없음';
    const r = applyAction(a, vars);
    if (r) changes.push({ name: r.name, from, to: showVal(r.value) });
  }
}

function enter(p: Project, box: string, vars0: Vars, via: string, stack: (string | null)[], pre: string[] = [], huds0: string[] = []): Step {
  const vars = { ...vars0 };
  const changes: Change[] = [];
  run(pre, vars, changes);
  const b = p.nodes.find((n) => n.id === box);
  if (b) run(boxActions(b), vars, changes);
  let huds = huds0;
  for (const l of b?.lines ?? [])
    if (l.type === 'hud' && l.screen) huds = l.stop ? huds.filter((x) => x !== l.screen) : huds.includes(l.screen) ? huds : [...huds, l.screen];
  return { box, vars, changes, via, stack, huds };
}

// 지금 떠 있는 HUD를 지금 플래그 값으로 (게임 화면을 줄여서)
function HudPeek({ p, step }: { p: Project; step: Step }) {
  const look = useGameFolder((s) => s.look);
  const list = (p.screens ?? []).filter((s) => isHud(s) && (s.overlay || step.huds.includes(s.id))).sort((a, b) => (a.zorder ?? 0) - (b.zorder ?? 0));
  if (!list.length) return null;
  const W = 300;
  const scale = W / look.width;
  return (
    <div title={'떠 있는 HUD: ' + list.map((s) => s.title || s.name).join(', ')}>
      <div className="tip">떠 있는 HUD: {list.map((s) => s.title || s.name).join(', ')}</div>
      <div className="tr-hud" style={{ width: W, height: look.height * scale }}>
        {list.map((s) => (
          <ScreenArt key={s.id} sc={s} scale={scale} vars={step.vars} />
        ))}
      </div>
    </div>
  );
}

export function TracePanel() {
  const project = useStore((s) => s.project);
  const from = useStore((s) => s.showTrace);
  const start = from || project.project.startNode || project.nodes[0]?.id || '';
  const first = () => [enter(project, start, initVars(project), from ? '고른 상자부터' : '대본 시작', [])];
  const [steps, setSteps] = useState<Step[]>(first);
  const [ended, setEnded] = useState<string | null>(null);
  useEffect(() => {
    setSteps(first());
    setEnded(null);
  }, [from]);
  const cur = steps[steps.length - 1];
  const b = project.nodes.find((n) => n.id === cur.box);

  // 캔버스에서 지금 상자를 고르고 보이게
  useEffect(() => {
    if (!b) return;
    useStore.getState().select([b.id]);
    useStore.getState().focusNodes([b.id]);
  }, [cur.box, steps.length]);

  const go = (target: string | null, via: string, opt: { pre?: string[]; push?: string | null; pop?: boolean } = {}) => {
    let stack = cur.stack;
    if (opt.push !== undefined) stack = [...stack, opt.push];
    if (!target) {
      setEnded(via);
      return;
    }
    setEnded(null);
    setSteps([...steps, enter(project, target, cur.vars, via, stack, opt.pre, cur.huds)]);
  };
  const back = () => {
    if (ended) return setEnded(null);
    if (steps.length > 1) setSteps(steps.slice(0, -1));
  };

  const exits = useMemo(() => {
    if (!b) return null;
    const e = b.exit;
    const name = (id: string | null) => (id ? titleOf(project.nodes.find((n) => n.id === id)) : '연결 안 됨');
    if (e.type === 'next') return <button className="primary" onClick={() => go(e.target, '다음으로')}>→ {name(e.target)}</button>;
    if (e.type === 'return') {
      const st = cur.stack;
      if (!st.length) return <button onClick={() => go(null, '끝 (return)')}>■ 끝</button>;
      const ret = st[st.length - 1];
      return (
        <button
          className="primary"
          onClick={() => {
            const stack = st.slice(0, -1);
            if (!ret) return setEnded('call한 곳으로 돌아갔지만 "복귀 후"가 없어서 끝');
            setSteps([...steps, enter(project, ret, cur.vars, 'call에서 돌아옴', stack, [], cur.huds)]);
          }}
        >
          ⤶ call한 곳으로: {name(ret)}
        </button>
      );
    }
    if (e.type === 'call') return <button className="primary" onClick={() => go(e.target, 'call', { push: e.then })}>⤷ call {name(e.target)} (돌아오면 {name(e.then)})</button>;
    if (e.type === 'menu')
      return (
        <div className="tr-opts">
          {e.ask?.text && <div className="tip">질문: {e.ask.text}</div>}
          {e.choices.map((c) => {
            const v = c.condition ? evalExpr(c.condition, cur.vars) : true;
            const st = v === UNKNOWN ? 'unk' : v ? 'on' : 'off';
            return (
              <button key={c.id} className={'tr-opt ' + st} disabled={st === 'off'} title={c.condition ? `보이는 조건: ${c.condition} → ${showVal(v)}` : '늘 보임'} onClick={() => go(c.target, `선택지 "${c.text}"`, { pre: c.actions })}>
                ◆ {c.text || '(빈 선택지)'} <span className="tip">→ {name(c.target)}{st === 'off' ? ' · 안 보임' : st === 'unk' ? ' · 조건 알 수 없음' : ''}{c.actions.filter(Boolean).length ? ` · ${c.actions.filter(Boolean).join(', ')}` : ''}</span>
              </button>
            );
          })}
        </div>
      );
    if (e.type === 'screen') {
      const sc = project.screens?.find((s) => s.id === e.screen);
      return (
        <div className="tr-opts">
          <div className="tip">화면 "{sc ? sc.title || sc.name : '(없음)'}"에서 누를 버튼</div>
          {e.outs.map((o) => (
            <button key={o.id} className="tr-opt" onClick={() => go(o.target, `화면 값 "${o.value}"`)}>
              ▣ {o.value} <span className="tip">→ {name(o.target)}</span>
            </button>
          ))}
          <button className="tr-opt" onClick={() => go(e.else, '화면의 그 밖')}>그 밖 <span className="tip">→ {name(e.else)}</span></button>
        </div>
      );
    }
    // 조건 분기: 위에서부터 첫 참인 갈래. 앞에 알 수 없는 조건이 있으면 정하지 않고 모두 고를 수 있게
    let pick: string | null | undefined;
    let unsure = false;
    for (const br of e.branches) {
      const v = evalExpr(br.cond, cur.vars);
      if (v === UNKNOWN) {
        unsure = true;
        break;
      }
      if (v) {
        pick = br.id;
        break;
      }
    }
    if (pick === undefined && !unsure) pick = 'else';
    return (
      <div className="tr-opts">
        {e.branches.map((br, i) => {
          const v = evalExpr(br.cond, cur.vars);
          return (
            <button key={br.id} className={'tr-opt' + (pick === br.id ? ' pick' : '')} onClick={() => go(br.target, `조건 "${br.cond}"`)}>
              {i ? '아니고' : '만약'} <code>{br.cond || '(빈 조건)'}</code> = {showVal(v)} <span className="tip">→ {name(br.target)}</span>
            </button>
          );
        })}
        <button className={'tr-opt' + (pick === 'else' ? ' pick' : '')} onClick={() => go(e.else, '조건 분기의 그 밖')}>
          그 밖 <span className="tip">→ {name(e.else)}</span>
        </button>
        {unsure && <div className="tip warn-text">알 수 없는 조건이 있어서 갈래를 정하지 못했어요. 골라 주세요.</div>}
      </div>
    );
  }, [b, cur, steps, project]);

  const names = [...new Set([...project.variables.map((f) => f.name), ...Object.keys(cur.vars)])];
  return (
    <div className="float-panel trace">
      <div className="fp-head">
        <b>플래그 따라가 보기</b>
        <span className="tip">대본은 그대로예요</span>
        <span className="sp" />
        <button onClick={back} disabled={steps.length < 2 && !ended} title="한 걸음 뒤로">↶</button>
        <button onClick={() => (setSteps(first()), setEnded(null))} title="처음부터">처음부터</button>
        <button onClick={close} title="닫기 (Esc)">✕</button>
      </div>
      <div className="fp-body">
        <div className="tr-path">
          {steps.map((s, i) => (
            <span key={i} className={i === steps.length - 1 ? 'cur' : ''} title={s.via}>
              {i ? ' › ' : ''}
              {titleOf(project.nodes.find((n) => n.id === s.box))}
            </span>
          ))}
        </div>
        <div className="tr-now">
          <b>{titleOf(b)}</b> <span className="tip">({cur.via})</span>
          {cur.changes.length > 0 && (
            <ul className="tr-changes">
              {cur.changes.map((c, i) => (
                <li key={i}>
                  <code>{c.name}</code> {c.from} → <b>{c.to}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        <HudPeek p={project} step={cur} />
        {ended ? <p className="tip">끝났어요: {ended}</p> : exits}
        <table className="tr-vars">
          <tbody>
            {names.map((n) => {
              const changed = cur.changes.some((c) => c.name === n);
              return (
                <tr key={n} className={changed ? 'changed' : ''}>
                  <td><code>{n}</code></td>
                  <td>{showVal(n in cur.vars ? cur.vars[n] : UNKNOWN)}</td>
                </tr>
              );
            })}
            {!names.length && (
              <tr>
                <td className="tip">플래그가 없어요. 오른쪽 [플래그] 카드에서 더해요</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
