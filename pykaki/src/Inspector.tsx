import { useEffect, useRef, useState } from 'react';
import { Hint } from './Help';
import { useStore } from './store';
import * as ops from './ops';
import type { BoxNode, Choice, ChoiceMedia, ExitType, Line, Project } from './types';
import { MediaField, MediaGroupFields, MediaPlace } from './MediaField';
import { uid } from './util';
import { Card } from './Card';
import { LineLook, OldAttr, SpeakerSelect, StageFields, useLineDrag, InputFields } from './LineFields';
import { isStage } from './stage';
import { hit } from './prefs';
import { ShaderPanel } from './ShaderPanel';
import { StageCards } from './StageCards';
import { branchSummary } from './BranchTree';
import { VoiceCard } from './VoiceCard';
import { syncOuts } from './screens';
import { useLive } from './showpyLive';
import { useGameFolder } from './gameFolder';
import { useScreenSel } from './ScreensView';
import { CursorCard, SayUiCard } from './UiPanel';
import { ActionInput, CondInput, firstAction } from './FlagFields';
import { GameOffTip, GoHere, MoveBtn, PickBand, useSidePop } from './PickPos';

const USED_CARD: Partial<Record<Line['type'], string>> = { scene: 'i-bg', show: 'i-pic', hide: 'i-pic', sound: 'i-sound', music: 'i-sound' };

export type Upd = (fn: (b: BoxNode, p: Project) => void, key?: string) => void;

export function Inspector() {
  const ids = useStore((s) => s.selectedIds);
  const project = useStore((s) => s.project);
  const shaderOf = useStore((s) => s.shaderOf);
  const hudOf = useStore((s) => s.hudOf);
  if (shaderOf) return <ShaderPanel />;
  if (hudOf) return <LabelHudPanel />;
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
  const drag = useLineDrag((from, to) => upd((x) => ops.moveIn(x.lines, from, to)));
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
  // 멈춤·흔들기 줄: 지금 쓰는 줄 바로 뒤에 (없으면 상자 끝)
  const huds = (project.screens ?? []).filter((s) => s.kind === 'hud');
  const addStageLine = (type: 'pause' | 'shake' | 'input') => {
    const nl: Line = { id: uid('l'), type, text: '' };
    upd((x) => {
      const i = x.lines.findIndex((y) => y.id === activeLine);
      x.lines.splice(i >= 0 ? i + 1 : x.lines.length, 0, nl);
    });
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
        <button onClick={() => useStore.setState({ showTrace: b.id })} title="이 상자부터 플래그 값과 갈래를 따라가 봐요 (플래그는 처음 값부터)">▶ 따라가 보기</button>
        <button className="danger" onClick={() => (update((p) => ops.deleteBoxes(p, [b.id])), useStore.getState().select([]))}>삭제</button>
      </div>
      </Card>

      <HudCard b={b} upd={upd} huds={huds} />

      {lookLine && (
        <Card id="i-look" title="글자 효과" className={'look-panel ' + use('i-look')}>
          <LineLook l={lookLine} set={(fn, key) => upd((x) => fn(x.lines.find((l) => l.id === lookLine.id)!), key)} />
        </Card>
      )}
      {lookLine && (
        <SayUiCard l={lookLine} b={b} className={use('i-look')} set={(fn, key) => upd((x) => fn(x.lines.find((l) => l.id === lookLine.id)!), key)} setBox={(fn) => upd((x) => fn(x))} />
      )}

      <Card id="i-lines" title="대사" className={use('i-lines')}>
      {b.lines.map((l, i) => (l.type === 'hud' ? null : <LineRow key={l.id} l={l} i={i} upd={upd} drag={drag} />))}
      <div className="row">
        <button onClick={addLine}>+ 줄 추가</button>
        <button onClick={addFlagLine} title="이 자리에서 플래그를 바꿔요 (예: met_alice 켜기, love +1)">+ 플래그 바꾸기</button>
        <button onClick={() => addStageLine('pause')} title="지금 쓰는 줄 뒤에서 잠깐 멈춰요 (초, 또는 클릭할 때까지)">+ 멈춤</button>
        <button onClick={() => addStageLine('shake')} title="지금 쓰는 줄 뒤에서 화면을 흔들거나 번쩍여요">+ 흔들기</button>
        <button onClick={() => addStageLine('input')} title="지금 쓰는 줄 뒤에서 플레이어가 플래그 값(이름, 숫자)을 쳐요. 글자 플래그는 대사에서 [이름]으로 보여요">+ 플래그 입력</button>
        <span className="tip">Ctrl+Enter: 같은 화자로 아래에 새 줄</span>
      </div>
      <GameOffTip what="대사" />
      </Card>

      <VoiceCard b={b} upd={upd} />

      <StageCards b={b} upd={upd} use={use} />

      <CursorCard b={b} />

      <Card id="i-exit" title="다음 흐름">
      <ExitEditor b={b} upd={upd} />
      </Card>
    </div>
  );
}

type HudPick = '' | 'show' | 'hide';
const HUD_PICKS = [['', '그대로'], ['show', '보이기'], ['hide', '숨기기']] as const;
const HUD_WORD: Record<HudPick, string> = { '': '그대로', show: '보이기', hide: '숨기기' };

// HUD마다 [그대로 | 보이기 | 숨기기] 줄들 (상자 HUD 카드와 label HUD 칸이 같이 씀). inh: label에서 정한 것 (상자에서만)
function HudRows({ huds, state, choose, inh }: { huds: NonNullable<Project['screens']>; state: (id: string) => HudPick; choose: (id: string, v: HudPick) => void; inh?: (id: string) => HudPick }) {
  if (!huds.length)
    return (
      <div className="row">
        <span className="tip">HUD가 없어요. [화면] 탭에서 화면을 HUD로 만들어 주세요.</span>
        <button onClick={() => useLive.setState({ view: 'screens' })}>[화면] 탭으로</button>
      </div>
    );
  return (
    <>
      {huds.map((h) => {
        const v = state(h.id);
        const from = !v && inh ? inh(h.id) : '';
        return (
          <div className="row hud-row" key={h.id}>
            <label title={h.name}>
              {h.title || h.name}
              {from && (
                <small className="hud-inh">
                  label: <span>{HUD_WORD[from]}</span>
                </small>
              )}
            </label>
            <span className="seg-switch hud-seg">
              {HUD_PICKS.map(([k, t]) => (
                <button key={k} className={v === k ? 'on' : ''} onClick={() => choose(h.id, k)}>{t}</button>
              ))}
            </span>
          </div>
        );
      })}
    </>
  );
}

// 이 상자에서 HUD 보이기/숨기기 (세션 79, 상자 머리 [HUD] 단추와 짝). HUD마다 [그대로 | 보이기 | 숨기기].
// 고르면 그 HUD의 hud 줄을 모두 지우고 상자 맨 앞에 하나만 둔다. 화면을 안 고른 hud 줄(예전 것)도 이때 지운다.
// "그대로"이면 label에서 정한 것을 따른다 (FEATURE 27)
function HudCard({ b, upd, huds }: { b: BoxNode; upd: Upd; huds: NonNullable<Project['screens']> }) {
  const g = useStore((s) => s.project.labels.find((x) => x.id === b.group));
  const hl = b.lines.filter((l) => l.type === 'hud');
  const known = (l: Line) => huds.some((h) => h.id === l.screen);
  const stray = hl.filter((l) => !known(l)).length;
  const state = (id: string): HudPick => {
    const last = [...hl].reverse().find((l) => l.screen === id);
    return !last ? '' : last.stop ? 'hide' : 'show';
  };
  const inh = (id: string): HudPick => {
    const h = g?.hud?.find((x) => x.screen === id);
    return !h ? '' : h.stop ? 'hide' : 'show';
  };
  const choose = (id: string, v: HudPick) =>
    upd((x) => {
      x.lines = x.lines.filter((l) => l.type !== 'hud' || (l.screen !== id && known(l)));
      if (!v) return;
      let at = 0;
      while (x.lines[at]?.type === 'hud') at++;
      x.lines.splice(at, 0, { id: uid('l'), type: 'hud', text: '', screen: id, ...(v === 'hide' && { stop: true }) });
    });
  const clean = () => upd((x) => void (x.lines = x.lines.filter((l) => l.type !== 'hud' || known(l))));
  return (
    <Card id="i-hud" domId="card-hud" title="HUD" hint="이 상자가 시작될 때 HUD를 띄우거나 내려요 (show screen / hide screen). 그대로면 label에서 정한 것을, 그것도 없으면 앞 상자의 HUD가 이어져요" topic="HUD">
      <HudRows huds={huds} state={state} choose={choose} inh={inh} />
      {stray > 0 && (
        <div className="row">
          <span className="tip">{`HUD를 안 고른 예전 줄이 ${stray}개 있어요`}</span>
          <button onClick={clean}>지우기</button>
        </div>
      )}
    </Card>
  );
}

// label의 [♡ HUD] 단추를 누르면 오른쪽 편집 칸이 이걸로 바뀐다 (FEATURE 27). 셰이더 고르기 칸(ShaderPanel)과 같은 자리.
// 여기서 정한 것은 그 label의 상자마다 첫머리에 show/hide screen으로 나가고, 상자에서 같은 HUD를 정하면 상자 것
export function LabelHudPanel() {
  const id = useStore((s) => s.hudOf)!;
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const g = project.labels.find((x) => x.id === id);
  const close = () => useStore.setState({ hudOf: null });
  if (!g) return null;
  const huds = (project.screens ?? []).filter((s) => s.kind === 'hud');
  const nBoxes = project.nodes.filter((n) => n.group === g.id).length;
  const state = (sid: string): HudPick => {
    const h = g.hud?.find((x) => x.screen === sid);
    return !h ? '' : h.stop ? 'hide' : 'show';
  };
  const choose = (sid: string, v: HudPick) =>
    update((p) => {
      const x = p.labels.find((l) => l.id === id);
      if (!x) return;
      const list = (x.hud ?? []).filter((h) => h.screen !== sid);
      if (v) list.push({ screen: sid, ...(v === 'hide' && { stop: true }) });
      if (list.length) x.hud = list;
      else delete x.hud;
    });
  const stray = (g.hud ?? []).filter((h) => !huds.some((s) => s.id === h.screen)).length;
  const clean = () =>
    update((p) => {
      const x = p.labels.find((l) => l.id === id);
      if (!x?.hud) return;
      x.hud = x.hud.filter((h) => huds.some((s) => s.id === h.screen));
      if (!x.hud.length) delete x.hud;
    });
  return (
    <div className="insp shader-panel">
      <Card id="s-label-hud" title="HUD" hint="이 label의 상자마다 시작할 때 HUD를 띄우거나 내려요 (show screen / hide screen). 상자에서 같은 HUD를 정하면 상자 것을 따라요" topic="HUD" extra={<button onClick={close}>닫기</button>}>
        <p className="tip">{g.title ? `${g.title} (${g.name})` : g.name}{` · 상자 ${nBoxes}개`}</p>
        <HudRows huds={huds} state={state} choose={choose} />
        {stray > 0 && (
          <div className="row">
            <span className="tip">{`지운 HUD를 고른 것이 ${stray}개 있어요`}</span>
            <button onClick={clean}>지우기</button>
          </div>
        )}
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
  const voiceOn = useStore((s) => !!s.project.settings.voice);

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
        {voiceOn && l.type === 'say' && l.vno && <span className="vc-chip" title="음성 번호 (아래 [음성] 카드)">🎙{String(l.vno).padStart(3, '0')}</span>}
      </div>
      {/* 연출·플래그 줄은 고르는 칸이라 칸을 감싼 곳에서 Ctrl+Enter를 받음 (글 칸은 자기 onKeyDown) */}
      <div className="line-body" onKeyDown={isStage(l.type) || l.type === 'flag' || l.type === 'input' ? onKey : undefined}>
        {isStage(l.type) ? (
          <StageFields l={l} set={set} />
        ) : l.type === 'input' ? (
          <InputFields l={l} set={set} />
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
  const forks = project.nodes.filter((n) => n.exit.type === 'if' && n.id !== self);
  return (
    <select className="target" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">(연결 안 됨)</option>
      {/* 조건 분기가 있는 상자를 맨 위에 모음 (조건 분기 칸과 같은 요약). 아래 장면 목록에도 그대로 있음 */}
      {forks.length > 0 && (
        <optgroup label="◇ 조건 분기 상자">
          {forks.map((n) => (
            <option key={'f' + n.id} value={n.id}>
              ◇ {n.title || n.id} · {branchSummary(n)}
            </option>
          ))}
        </optgroup>
      )}
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
  const m = c.media ?? {};
  const oldGroup = useGameFolder((f) => f.mediaGroup === false);
  const hasMedia = !!(m.idle || m.hover || m.select);
  const [openMedia, setOpenMedia] = useState(hasMedia);
  const setC = (fn: (x: Choice) => void, key?: string) => upd((x) => void (x.exit.type === 'menu' && fn(x.exit.choices[i])), key);
  // 뒤 그림 값 하나 바꾸기. 다 비면 media를 지움
  const putM = (k: keyof ChoiceMedia, v: ChoiceMedia[keyof ChoiceMedia] | undefined, key?: string) =>
    setC((x) => {
      const nm: ChoiceMedia = { ...(x.media ?? {}) };
      if (v === undefined || v === '') delete nm[k];
      else (nm as Record<string, unknown>)[k] = v;
      if (k === 'fit') delete nm.zoom; // 글에 맞춤과 그림 크기 그대로는 배율 뜻이 달라서
      if (Object.keys(nm).length) x.media = nm;
      else delete x.media;
    }, key);
  return (
    <div className={'choice-box' + (open ? ' open' : '')}>
      <div className="choice-ed">
        <input id={'ed-' + c.id} value={c.text} placeholder={`선택지 ${i + 1} 문구`} onChange={(ev) => setC((x) => void (x.text = ev.target.value), 'choice' + c.id)} />
        <TargetSelect self={b.id} value={c.target} onChange={(v) => upd((x) => ops.setLink(x, 'c:' + c.id, v))} />
        <button className={'flag-btn' + (has ? ' on' : '')} onClick={() => setOpen(!open)} title="플래그: 보이는 조건, 고르면 바꾸기">⚑</button>
        <button className={'flag-btn' + (hasMedia ? ' on' : '')} onClick={() => setOpenMedia(!openMedia)} title="글 뒤 그림/영상: 평소, 마우스를 올렸을 때, 고르고 확정할 때 (pygaki 플러그인 연결을 켜야 내보내요)">🖼</button>
        <button disabled={i === 0} onClick={() => upd((x) => { const cs = (x.exit as any).choices; cs.splice(i - 1, 0, ...cs.splice(i, 1)); })}>↑</button>
        <button onClick={() => upd((x) => void (x.exit as any).choices.splice(i, 1))}>✕</button>
      </div>
      {openMedia && (
        <div className="choice-flags">
          <div className="cf-row media-row">
            <span className="cf-kw">평소</span>
            <MediaField value={m.idle} placeholder="글 뒤 그림·영상 (예: images/choice/paper.png)" title="평소 선택지 글 뒤에 깔 그림이나 영상. 그림을 쓰면 기본 버튼 배경이 없어져요" onChange={(v) => putM('idle', v, 'cmi' + c.id)} />
          </div>
          <div className="cf-row media-row">
            <span className="cf-kw">올렸을 때</span>
            <MediaField value={m.hover} placeholder="비우면 평소 그림 그대로" title="마우스를 올렸을 때(키보드로 골랐을 때) 글 뒤 그림이나 영상" onChange={(v) => putM('hover', v, 'cmh' + c.id)} />
          </div>
          <div className="cf-row media-row">
            <span className="cf-kw">확정할 때</span>
            <MediaField value={m.select} placeholder="비우면 바로 넘어가요" title="눌러서 고르면 이 그림을 잠깐 보여 준 뒤 넘어가요" onChange={(v) => putM('select', v, 'cms' + c.id)} />
            {m.select && (
              <input type="number" className="sf-num" min={0} max={10} step={0.1} title="확정 그림을 보여 주는 초 (기본 0.5)" placeholder="0.5초" value={m.time ?? ''}
                onChange={(e) => { const n = Math.round(Number(e.target.value) * 10) / 10; putM('time', e.target.value === '' || !(n >= 0) ? undefined : Math.min(n, 10), 'cmt' + c.id); }} />
            )}
          </div>
          <div className="cf-row media-row">
            <span className="cf-kw">크기</span>
            <select value={m.fit ?? ''} onChange={(e) => putM('fit', e.target.value === 'image' ? 'image' : undefined)}>
              <option value="">글에 맞춤</option>
              <option value="image">그림 크기 그대로</option>
            </select>
            <MediaPlace m={m} onClear={() => setC((x) => {
              if (!x.media) return;
              const nm: ChoiceMedia = { ...x.media };
              for (const k of ['x', 'y', 'zoom', 'angle'] as const) delete nm[k];
              x.media = nm;
            })} />
          </div>
          <MediaGroupFields g={m} place={m} old={oldGroup} onChange={(fn, key) => setC((x) => {
            if (!x.media) return;
            const nm: ChoiceMedia = { ...x.media };
            fn(nm);
            x.media = nm;
          }, key && key + c.id)} />
        </div>
      )}
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

// 화면 부르기 (FEATURE 17): 부를 화면, 돌려준 값마다 갈 상자, 그 밖
function ScreenExitEditor({ b, upd }: { b: BoxNode; upd: Upd }) {
  const screens = useStore((s) => s.project.screens ?? []);
  if (b.exit.type !== 'screen') return null;
  const e = b.exit;
  return (
    <>
      <div className="row">
        <label>화면<Hint text="[화면] 탭에서 만든 화면을 띄우고, 누른 버튼의 값에 따라 갈래가 나뉘어요. 갈래는 화면의 버튼 값을 따라 저절로 생겨요" topic="화면 만들기" /></label>
        <select value={e.screen ?? ''} onChange={(ev) => upd((x, p) => {
          if (x.exit.type !== 'screen') return;
          x.exit.screen = ev.target.value || null;
          syncOuts(p, x);
        })}>
          <option value="">화면 고르기…</option>
          {/* HUD는 부르는 화면이 아니라 📟 HUD 줄로 띄운다 (FEATURE 18). 예전에 고른 것만 보여 준다 */}
          {screens.filter((s) => s.kind !== 'hud' || s.id === e.screen).map((s) => (
            <option key={s.id} value={s.id}>{s.title || s.name}{s.kind === 'hud' ? ' (HUD)' : ''}</option>
          ))}
        </select>
        <button onClick={() => (useLive.setState({ view: 'screens' }), useScreenSel.setState({ id: e.screen }))} title="[화면] 탭에서 이 화면을 고쳐요">화면 고치기</button>
      </div>
      {!screens.length && <p className="tip">아직 화면이 없어요. 위쪽 [화면] 탭에서 만들어요.</p>}
      {e.outs.map((o) => (
        <div className="choice-ed" key={o.id}>
          <span className="br-kw">값 {o.value}</span>
          <TargetSelect self={b.id} value={o.target} onChange={(v) => upd((x) => ops.setLink(x, 's:' + o.id, v))} />
        </div>
      ))}
      <div className="row">
        <label>그 밖<Hint text="어느 값에도 안 맞으면 이 상자로" topic="화면 만들기" /></label>
        <TargetSelect self={b.id} value={e.else} onChange={(v) => upd((x) => ops.setLink(x, 'else', v))} />
      </div>
    </>
  );
}

// 정답 입력 (FEATURE 32): 묻는 글, 정답마다 (글 / 플래그 값) 갈 상자, 틀림, 친 값 넣을 플래그, 정확히
function AnswerExitEditor({ b, upd }: { b: BoxNode; upd: Upd }) {
  const vars = useStore((s) => s.project.variables);
  if (b.exit.type !== 'answer') return null;
  const e = b.exit;
  const typable = vars.filter((f) => f.kind === 'str' || f.kind === 'int');
  const put = (fn: (x: Extract<BoxNode['exit'], { type: 'answer' }>) => void, key?: string) => upd((x) => void (x.exit.type === 'answer' && fn(x.exit)), key);
  const flagSel = (value: string | undefined, onChange: (v: string | undefined) => void, none: string, title: string) => (
    <select title={title} value={value ?? ''} onChange={(ev) => onChange(ev.target.value || undefined)}>
      <option value="">{none}</option>
      {typable.map((f) => (
        <option key={f.id} value={f.id}>{f.name}{f.note ? ` (${f.note})` : ''}</option>
      ))}
      {value && !typable.some((f) => f.id === value) && <option value={value}>? 없는 플래그</option>}
    </select>
  );
  return (
    <>
      <div className="row">
        <label>묻는 글<Hint text="플레이어에게 보이는 질문이에요 (예: 범인의 이름은?). 글 속 [이름]은 플래그 값으로 보여요" topic="흐름 잇기" /></label>
        <input id={'ed-ask-' + b.id} className="grow" value={e.ask} placeholder="범인의 이름은?" onChange={(ev) => put((x) => void (x.ask = ev.target.value), 'ask' + b.id)} />
      </div>
      {e.cases.map((c, i) => (
        <div className="answer-ed" key={c.id}>
          <div className="choice-ed">
            <span className="br-kw">정답</span>
            <input id={'ed-' + c.id} value={c.text} placeholder="철수 / 김철수 (여러 개는 / 로)" onChange={(ev) => put((x) => void (x.cases[i].text = ev.target.value), 'answer' + c.id)} />
            <button disabled={i === 0} onClick={() => put((x) => void x.cases.splice(i - 1, 0, ...x.cases.splice(i, 1)))}>↑</button>
            <button disabled={e.cases.length < 2} onClick={() => put((x) => void x.cases.splice(i, 1))}>✕</button>
          </div>
          <div className="choice-ed answer-sub">
            {flagSel(c.flag, (v) => put((x) => void (v ? (x.cases[i].flag = v) : delete x.cases[i].flag)), '플래그 값도 정답: 없음', '이 플래그의 값도 정답이에요 (게임마다 바뀌는 답, 예: 이번 판의 범인)')}
            <TargetSelect self={b.id} value={c.target} onChange={(v) => upd((x) => ops.setLink(x, 'a:' + c.id, v))} />
          </div>
        </div>
      ))}
      <button onClick={() => put((x) => void x.cases.push(ops.newAnswer()))} title="다른 답이면 다른 상자로 (예: 틀린 범인을 고르면 나쁜 엔딩)">+ 정답 추가</button>
      <div className="row">
        <label>틀림<Hint text="어느 정답에도 안 맞으면 이 상자로. 이 상자로 다시 이으면 맞힐 때까지 다시 물어요" topic="흐름 잇기" /></label>
        <TargetSelect self={b.id} value={e.else} onChange={(v) => upd((x) => ops.setLink(x, 'else', v))} />
      </div>
      <div className="row">
        <label>친 값<Hint text="플레이어가 친 글을 이 플래그에 넣어요. 대사에서 [이름]으로 보여 줄 수 있어요 (숫자 플래그는 숫자만)" topic="흐름 잇기" /></label>
        {flagSel(e.keep, (v) => put((x) => void (v ? (x.keep = v) : delete x.keep)), '남기지 않음', '친 값을 넣을 플래그')}
      </div>
      <div className="row">
        <label className="pick">
          <input type="checkbox" checked={!!e.exact} onChange={(ev) => put((x) => void (ev.target.checked ? (x.exact = true) : delete x.exact))} /> 띄어쓰기·대소문자까지 똑같아야 정답
        </label>
      </div>
      <div className="row">
        <label className="pick">최대 글자 수</label>
        <input type="number" min={1} max={200} style={{ width: 70 }} value={e.length ?? ''} placeholder="없음" onChange={(ev) => put((x) => { const n = Math.round(Number(ev.target.value)); if (n > 0) x.length = n; else delete x.length; }, 'alen' + b.id)} />
      </div>
      {!e.exact && <p className="tip">"김 철수", "KIM"처럼 띄어쓰기·대소문자가 달라도 맞다고 봐요.</p>}
    </>
  );
}

// 선택지 위 질문 대사 (FEATURE 15): 화자와 글. 글을 비우면 질문 없이 선택지만 나와요
function MenuAskRow({ b, upd }: { b: BoxNode; upd: Upd }) {
  const chars = useStore((s) => s.project.characters);
  const ask = b.exit.type === 'menu' ? b.exit.ask : undefined;
  const put = (fn: (a: { who: string | null; text: string }) => void, key?: string) =>
    upd((x) => {
      if (x.exit.type !== 'menu') return;
      const a = { who: x.exit.ask?.who ?? null, text: x.exit.ask?.text ?? '' };
      fn(a);
      if (a.text || a.who) x.exit.ask = a;
      else delete x.exit.ask;
    }, key);
  return (
    <div className="choice-ed menu-ask">
      <select title="질문하는 사람" value={ask?.who ?? ''} onChange={(ev) => put((a) => void (a.who = ev.target.value || null))}>
        <option value="">내레이션</option>
        {chars.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        {ask?.who && !chars.some((c) => c.id === ask.who) && <option value={ask.who}>? {ask.who}</option>}
      </select>
      <input id={'ed-ask-' + b.id} className="grow" value={ask?.text ?? ''} placeholder="질문 대사 (비우면 없음, 선택지와 같이 보여요)" onChange={(ev) => put((a) => void (a.text = ev.target.value), 'ask' + b.id)} />
      <Hint text="선택지가 나오는 동안 대사창에 남는 질문이에요 (예: 우산을 빌려줄까?). 렌파이 menu: 바로 아래 대사 줄로 내보내요" topic="흐름 잇기" />
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
          <option value="screen">▣ 화면 부르기 (call screen)</option>
          <option value="answer">✎ 정답 입력 (주관식)</option>
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
          <MenuAskRow b={b} upd={upd} />
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
      {e.type === 'screen' && <ScreenExitEditor b={b} upd={upd} />}
      {e.type === 'answer' && <AnswerExitEditor b={b} upd={upd} />}
      {e.type === 'return' && <p className="tip">여기서 끝 (call로 불렸으면 부른 곳으로)</p>}
    </div>
  );
}
