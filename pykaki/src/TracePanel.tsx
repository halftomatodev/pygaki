// 플래그 따라가 보기 (3단계): 시작 상자부터 선택지를 골라 가며 플래그 값과 조건 분기 갈래를 본다. 대본은 고치지 않는다
import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import type { BoxNode, Flag, Project } from './types';
import { parseAction } from './flags';
import { applyAction, boxActions, evalExpr, initVars, showVal, UNKNOWN, type Vars } from './trace';
import { flagUi, uiMax, uiMin } from './flagUi';
import { useGameFolder } from './gameFolder';
import { ScreenArt } from './ScreensView';
import { isHud } from './screens';

interface Change { name: string; from: string; to: string }
// huds: HUD 줄로 띄워 둔 화면 id (FEATURE 18. 게임 내내 띄우는 HUD는 따로)
// miss·hint: 정답 입력 다시 묻기(FEATURE 33)에서 이 상자에서 틀린 횟수와 지금 보이는 힌트
interface Step { box: string; vars: Vars; changes: Change[]; via: string; stack: (string | null)[]; huds: string[]; miss?: number; hint?: string }

// 친 글을 게임과 같은 규칙으로 플래그 값으로 (flags.ts inputCode, 정답 입력의 친 값).
// 숫자는 숫자일 때만 최솟값~최댓값으로 맞추고 아니면 그대로. 글자는 앞뒤 빈칸을 빼고, emptyInit이면 비울 때 처음 값
function typedValue(f: Flag, typed: string, cur: unknown, emptyInit: boolean) {
  const t = typed.trim();
  if (f.kind === 'int') {
    if (!/^-?\d+$/.test(t)) return cur;
    const u = flagUi(f);
    return Math.max(uiMin(u), Math.min(uiMax(u), parseInt(t, 10)));
  }
  return t || (emptyInit ? String(f.init ?? '') : '');
}

// 따라가 보기의 입력칸: Enter나 [넣기]로 보냄
function TypeRow({ label, init, onSubmit, button = '넣기', hint }: { label: string; init: string; onSubmit: (t: string) => void; button?: string; hint?: string }) {
  const [t, setT] = useState(init);
  return (
    <div className="tr-type" title={hint}>
      <span className="tip">{label}</span>
      <input value={t} onChange={(ev) => setT(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && onSubmit(t)} />
      <button onClick={() => onSubmit(t)}>{button}</button>
    </div>
  );
}

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

// 상자의 ✎ 플래그 입력 줄: 게임처럼 값을 쳐서 넣어 봄 (치지 않으면 그대로 지나감)
function InputLines({ p, b, step, set, n }: { p: Project; b?: BoxNode; step: Step; set: (s: Step) => void; n: number }) {
  const rows = (b?.lines ?? []).flatMap((l) => {
    const f = l.type === 'input' && l.flag ? p.variables.find((v) => v.id === l.flag) : undefined;
    return f ? [{ l, f }] : [];
  });
  if (!rows.length) return null;
  return (
    <div className="tr-inputs">
      {rows.map(({ l, f }) => (
        <TypeRow
          key={n + ':' + l.id}
          label={`✎ ${l.text || '플래그 입력'} → ${f.name}`}
          init={step.vars[f.name] == null ? '' : String(step.vars[f.name])}
          hint="게임처럼 넣어요 (글자는 비우면 처음 값, 숫자는 범위 안으로). 안 치면 값은 그대로"
          onSubmit={(t) => {
            const from = step.vars[f.name];
            const to = typedValue(f, t, from, true);
            if (to === from) return;
            set({ ...step, vars: { ...step.vars, [f.name]: to as never }, changes: [...step.changes, { name: f.name, from: from === undefined ? '없음' : showVal(from as never), to: showVal(to as never) }] });
          }}
        />
      ))}
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
    if (e.type === 'answer') {
      // 정답 입력 (FEATURE 32): 답을 쳐 보거나 정답 단추를 누름. 친 값 플래그에 그 글을 넣음
      const keep = project.variables.find((f) => f.id === e.keep);
      const keepActs = (t: string) => {
        if (!keep) return [];
        const v = typedValue(keep, t, cur.vars[keep.name], false);
        return v === cur.vars[keep.name] ? [] : [`${keep.name} = ${JSON.stringify(v)}`];
      };
      // 게임과 같은 견주기: 정확히가 아니면 띄어쓰기를 빼고 소문자로
      const norm = (x: string) => (e.exact ? x.trim() : x.replace(/\s+/g, '').toLowerCase());
      const match = (t: string) => {
        const a = norm(t);
        for (const c of e.cases) {
          if (c.text.split('/').map(norm).filter(Boolean).includes(a)) return c;
          const f = project.variables.find((v) => v.id === c.flag);
          const fv = f ? cur.vars[f.name] : UNKNOWN;
          if (f && fv !== UNKNOWN && fv !== null && norm(String(fv)) !== '' && norm(String(fv)) === a) return c;
        }
        return null;
      };
      // 틀림: 다시 묻기(FEATURE 33)면 기회가 남은 동안 이 상자에 머물며 힌트를 보임
      const wrong = (via: string, pre: string[]) => {
        const rt = e.retry;
        if (!rt) return go(e.else, via, { pre });
        const miss = (cur.miss ?? 0) + 1;
        if (rt.tries > 0 && miss >= rt.tries) return go(e.else, `${via} · 기회 ${rt.tries}번을 다 씀`, { pre });
        const hints = rt.hints.filter((h) => h.trim());
        const vars = { ...cur.vars };
        const changes = [...cur.changes];
        run(pre, vars, changes);
        setEnded(null);
        setSteps([...steps.slice(0, -1), { ...cur, vars, changes, miss, hint: hints.length ? hints[Math.min(miss, hints.length) - 1] : undefined, via: `${via} · ${miss}번 틀림` }]);
      };
      const rt = e.retry;
      const who = rt?.who ? project.characters.find((c) => c.id === rt.who)?.name ?? rt.who : '';
      return (
        <div className="tr-opts">
          <div className="tip">정답 입력: {e.ask || '(묻는 글 없음)'}</div>
          {rt && (
            <div className="tip">
              ↻ 틀리면 다시 묻기 · {cur.miss ?? 0}번 틀림{rt.tries > 0 ? ` / 기회 ${rt.tries}번` : ' (맞힐 때까지)'}
            </div>
          )}
          {cur.hint && (
            <div className="tr-hint">
              {who && <b>{who} </b>}
              {cur.hint}
            </div>
          )}
          <TypeRow
            key={steps.length + ':' + (cur.miss ?? 0)}
            label="답 쳐 보기"
            init=""
            button="맞혀 보기"
            hint="게임처럼 견줘서 맞는 갈래로 가요"
            onSubmit={(t) => {
              const c = match(t);
              if (c) go(c.target, `"${t.trim()}" 맞음`, { pre: keepActs(t) });
              else wrong(`"${t.trim()}" 틀림`, keepActs(t));
            }}
          />
          {e.cases.map((c) => {
            const first = c.text.split('/').map((x) => x.trim()).find(Boolean) ?? '';
            const f = project.variables.find((v) => v.id === c.flag);
            const shown = first || f?.name || '';
            return (
              <button key={c.id} className="tr-opt" onClick={() => go(c.target, `정답 "${shown}"`, { pre: keep?.kind === 'str' && first ? keepActs(first) : [] })}>
                ✎ {c.text || '(글 없음)'}{f ? ` · 플래그 ${f.name} 값` : ''} <span className="tip">→ {name(c.target)}</span>
              </button>
            );
          })}
          <button className="tr-opt" onClick={() => wrong('정답 입력의 틀림', [])}>
            틀림 <span className="tip">→ {rt && !(rt.tries > 0 && (cur.miss ?? 0) + 1 >= rt.tries) ? '다시 묻기' : name(e.else)}</span>
          </button>
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
        {!ended && <InputLines p={project} b={b} step={cur} set={(st) => setSteps([...steps.slice(0, -1), st])} n={steps.length} />}
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
