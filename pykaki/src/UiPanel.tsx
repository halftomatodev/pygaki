// 대본 편집 오른쪽 카드 둘:
// - 대사 소리와 속도: 지금 쓰는 대사·내레이션 줄 하나에 (SayStyle.sound, cps). 없으면 캐릭터 → 게임 처음 값
// - 커서와 클릭 대기(CTC): 상자 하나에 (boxUi.ts). 없으면 게임 처음 값
// 카드 맨 아래 [⚠ 모든 상자에 적용] [⚠ 전부 삭제]는 셰이더 카드도 같이 쓴다 (AllRow)
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { applyAll, clearAll, dropKey, sceneSupported, uiCount, uiLabel, type UiKey } from './boxUi';
import { fileUrl, soundUrl, useGameFolder } from './gameFolder';
import { useStore } from './store';
import { lineCps } from './stage';
import type { BoxNode, Line, Project, SayStyle } from './types';

type Owner = { kind: 'box' | 'label'; id: string };
type SetLine = (fn: (x: Line) => void, key?: string) => void;
type SayKey = 'cps' | 'sound';

const isSay = (l: Line) => l.type === 'say' || l.type === 'narration';
const ownerOf = (p: Project, o: Owner) => (o.kind === 'box' ? p.nodes.find((n) => n.id === o.id) : p.labels.find((g) => g.id === o.id));

function putSay(x: Line, k: SayKey, v: SayStyle[SayKey] | undefined) {
  const say: SayStyle = { ...(x.say ?? {}) };
  if (v === undefined) delete say[k];
  else (say as Record<string, unknown>)[k] = v;
  if (Object.keys(say).length) x.say = say;
  else delete x.say;
}

// 대사 소리와 속도: 줄 하나
export function SayUiCard({ l, b, set, setBox, className }: { l: Line; b: BoxNode; set: SetLine; setBox: (fn: (b: BoxNode) => void) => void; className?: string }) {
  const s = l.say ?? {};
  const linked = useStore((st) => !!st.project.settings.renpyLink);
  const sayLines = b.lines.filter(isSay);
  const row = (k: SayKey, label: string, now: string, body: React.ReactNode, first: SayStyle[SayKey]) => (
    <div className="ui-row">
      <div className="row">
        <label>{label}</label>
        <div className="seg ui-seg">
          <button className={k in s ? '' : 'on'} onClick={() => k in s && set((x) => putSay(x, k, undefined))}>따름</button>
          <button className={k in s ? 'on' : ''} onClick={() => !(k in s) && set((x) => putSay(x, k, first))}>이 대사에</button>
        </div>
      </div>
      {k in s ? body : <p className="tip ui-now">지금: {now}</p>}
    </div>
  );
  const auto = lineCps(s, l.text);
  // 이 줄의 속도와 소리를 이 상자의 다른 대사·내레이션 줄에도 (이 줄에 없는 값은 그 줄들에서도 지움)
  const toAll = () => {
    setBox((x) => {
      for (const y of x.lines) if (isSay(y)) for (const k of ['cps', 'sound'] as SayKey[]) putSay(y, k, s[k]);
    });
    useStore.getState().say('이 대사의 속도와 소리를 이 상자의 모든 대사에 걸었어요');
  };
  return (
    <Card id="i-say" title="대사 소리와 속도" className={className} hint="지금 쓰는 대사 한 줄에 걸어요. 정하지 않으면 캐릭터 → 게임 처음 값" topic="대사 소리와 속도">
      {row('cps', '텍스트 속도', auto !== undefined ? `1초에 ${auto}글자 (등장 효과의 기본값)` : '게임 설정', <CpsField v={s.cps} set={(v) => set((x) => putSay(x, 'cps', v), 'saycps' + l.id)} />, auto ?? 30)}
      {row('sound', '대사 소리', '캐릭터 → 게임 처음 값', <SoundField v={s.sound} set={(v) => set((x) => putSay(x, 'sound', v))} />, '')}
      {!linked && 'sound' in s && <p className="tip warn-text">대사 소리는 pygaki 플러그인 연결을 켜야 내보내요.</p>}
      {sayLines.length > 1 && (
        <div className="all-row">
          <button onClick={toAll} title="이 대사의 속도와 소리를 이 상자의 다른 대사·내레이션 줄에도 똑같이 걸어요 (↶ 되돌리기로 돌아와요)">
            이 상자의 모든 대사에 ({sayLines.length})
          </button>
        </div>
      )}
    </Card>
  );
}

// 커서와 클릭 대기: 상자 하나
export function CursorCard({ b }: { b: BoxNode }) {
  const update = useStore((st) => st.update);
  const linked = useStore((st) => !!st.project.settings.renpyLink);
  const mine = b.ui ?? {};
  const old = linked && !sceneSupported();
  const setK = (k: UiKey, v: string | undefined, key?: string) =>
    update((p) => {
      const x = p.nodes.find((n) => n.id === b.id)!;
      if (v === undefined) dropKey(x, k);
      else x.ui = { ...(x.ui ?? {}), [k]: v };
    }, key);
  const row = (k: UiKey, label: string) => (
    <div className="ui-row">
      <div className="row">
        <label>{label}</label>
        <div className="seg ui-seg">
          <button className={k in mine ? '' : 'on'} onClick={() => k in mine && setK(k, undefined)}>게임 처음 값</button>
          <button className={k in mine ? 'on' : ''} onClick={() => !(k in mine) && setK(k, useGameFolder.getState().media.frames?.[k][0]?.dir ?? `gui/${k}`)}>이 상자에</button>
        </div>
      </div>
      {k in mine ? <FramesField k={k} v={mine[k]} set={(v, key) => setK(k, v, key && key + b.id)} /> : <p className="tip ui-now">지금: {uiLabel(undefined)}</p>}
    </div>
  );
  return (
    <Card id="i-cursor" title="커서와 클릭 대기 (CTC)" hint="이 상자에서만 걸려요. 정하지 않은 상자는 게임 처음 값. game/gui/ctc, gui/cursor 안의 그림 폴더를 이름 차례로 돌려요" topic="대사 소리와 속도">
      {row('ctc', '클릭 대기')}
      {row('cursor', '커서')}
      {old && <p className="tip warn-text">예전 플러그인이라 상자마다 못 바꿔요 (ui_kit 4.7부터).</p>}
      {!linked && b.ui && <p className="tip warn-text">pygaki 플러그인 연결을 켜야 내보내요.</p>}
      <AllRow what="커서와 클릭 대기" keys={['ctc', 'cursor']} so={{ kind: 'box', id: b.id }} />
    </Card>
  );
}

function CpsField({ v, set }: { v: number | undefined; set: (v: number) => void }) {
  const n = v ?? 30;
  return (
    <div className="row ui-cps">
      <input type="range" min={0} max={120} step={1} value={n} onChange={(e) => set(Number(e.target.value))} />
      <span className="ui-val">{n === 0 ? '한 번에' : `1초에 ${n}글자`}</span>
    </div>
  );
}

function SoundField({ v, set }: { v: string | undefined; set: (v: string) => void }) {
  const audio = useGameFolder((st) => st.media.audio);
  const files = audio.map((f) => 'audio/' + f);
  const listen = async () => {
    if (!v) return;
    const url = (await fileUrl(v)) ?? (await soundUrl(v));
    if (url) new Audio(url).play().catch(() => {});
  };
  return (
    <div className="row">
      <select value={v ?? ''} onChange={(e) => set(e.target.value)}>
        <option value="">끔 (소리 없음)</option>
        {files.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
        {v && !files.includes(v) && <option value={v}>{v}</option>}
      </select>
      <button disabled={!v} onClick={listen} title="들어 보기">▶</button>
    </div>
  );
}

function FramesField({ k, v, set }: { k: UiKey; v: string | undefined; set: (v: string, key?: string) => void }) {
  const sets = useGameFolder((st) => st.media.frames?.[k] ?? []);
  const linked = useGameFolder((st) => !!st.name);
  return (
    <>
      {sets.length > 0 && (
        <div className="ui-frames">
          {sets.map((f) => (
            <button key={f.dir} className={f.dir === v ? 'on' : ''} onClick={() => set(f.dir)} title={`${f.dir} (${f.n}장)`}>
              <Thumb path={f.first} />
              <span>{f.dir.replace(`gui/${k}`, '') || '기본'}</span>
            </button>
          ))}
        </div>
      )}
      {!sets.length && <p className="tip">{linked ? `game/gui/${k} 안에 그림이 없어요.` : '프로젝트 연결 안 됨'}</p>}
      <div className="row">
        <input placeholder={`그림 폴더 (예: gui/${k}/heart)`} value={v ?? ''} onChange={(e) => set(e.target.value.trim().replace(/\/+$/, ''), 'ui' + k)} />
      </div>
    </>
  );
}

function Thumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fileUrl(path).then((u) => live && setUrl(u));
    return () => void (live = false);
  }, [path]);
  return url ? <img src={url} alt="" /> : <i />;
}

// 카드 맨 아래: 이 상자·label의 값을 대본 전체에 걸기 / 대본 전체에서 지우기. 되돌리기(↶)로 돌아온다
// keys를 주면 상자의 커서·클릭 대기(모든 상자에), apply를 주면 셰이더(모든 label에)
export function AllRow({ what, keys, so, apply, clear, count, has }: {
  what: string;
  keys?: UiKey[];
  so: Owner;
  apply?: (p: Project) => void;
  clear?: (p: Project) => void;
  count?: (p: Project) => number;
  has?: boolean;
}) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const owner = ownerOf(project, so);
  const boxUi = (o: unknown) => (so.kind === 'box' ? (o as BoxNode | undefined)?.ui : undefined);
  const n = count ? count(project) : (keys ?? []).reduce((m, k) => Math.max(m, uiCount(project, k)), 0);
  const mineHas = has ?? (keys ?? []).some((k) => !!boxUi(owner) && k in boxUi(owner)!);
  const where = keys ? '모든 상자' : '모든 label';
  const doApply = () => {
    const note = keys ? '다른 상자에 정한 값은 이 값으로 바뀌어요' : `상자마다 따로 정한 ${what}는 지워져요`;
    if (!confirm(`이 ${so.kind === 'box' ? '상자' : 'label'}의 ${what}를 ${where}에 걸까요?\n${note}. (↶ 되돌리기로 돌아와요)`)) return;
    update((p) => {
      if (apply) return apply(p);
      const vals = boxUi(ownerOf(p, so)) ?? {};
      for (const k of keys ?? []) if (vals[k] !== undefined) applyAll(p, k, vals[k]!);
    });
    useStore.getState().say(`${what}를 ${where}에 걸었어요`);
  };
  const doClear = () => {
    if (!confirm(`대본 전체(${n}곳)에서 ${what}를 지울까요?\n게임 처음 값으로 돌아가요. (↶ 되돌리기로 돌아와요)`)) return;
    update((p) => {
      if (clear) return clear(p);
      for (const k of keys ?? []) clearAll(p, k);
    });
    useStore.getState().say(`대본 전체에서 ${what}를 지웠어요`);
  };
  return (
    <div className="all-row">
      <button disabled={!mineHas} onClick={doApply} title={mineHas ? `이 값을 대본의 ${where}에 걸어요` : '먼저 이 상자나 label에 값을 정해요'}>
        <WarnIcon /> 모든 상자에 적용
      </button>
      <button className="danger" disabled={!n} onClick={doClear} title="대본 전체에서 이 값을 지워요">
        <WarnIcon /> 전부 삭제{n ? ` (${n})` : ''}
      </button>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg className="warn-ico" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M8 1.5 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}
