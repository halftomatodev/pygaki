// 셰이더 칸 아래 카드 둘: 대사 소리와 속도 / 커서와 클릭 대기(CTC). 상자나 label마다 정한다 (boxUi.ts).
// 카드 맨 아래 [⚠ 모든 상자에 적용] [⚠ 전부 삭제]는 셰이더 카드도 같이 쓴다 (AllRow).
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { applyAll, clearAll, dropKey, sceneSupported, uiCount, uiFrom, uiLabel, uiOfBox, type UiKey } from './boxUi';
import { fileUrl, soundUrl, useGameFolder } from './gameFolder';
import { useStore } from './store';
import type { BoxNode, BoxUi, Project } from './types';

type Owner = { kind: 'box' | 'label'; id: string };

const ownerOf = (p: Project, o: Owner) => (o.kind === 'box' ? p.nodes.find((n) => n.id === o.id) : p.labels.find((g) => g.id === o.id));

export function UiCards({ so }: { so: Owner }) {
  const project = useStore((s) => s.project);
  const linked = !!project.settings.renpyLink;
  const owner = ownerOf(project, so);
  if (!owner) return null;
  const box = so.kind === 'box' ? project.nodes.find((n) => n.id === so.id) ?? null : null;
  const gid = box ? box.group : so.id;
  const now = box ? uiOfBox(project, box) : { ...(owner.ui ?? {}) };
  const mine = owner.ui ?? {};
  const old = linked && !sceneSupported();

  const row = (k: UiKey, label: string, body: React.ReactNode) => (
    <div className="ui-row">
      <div className="row">
        <label>{label}</label>
        <Follow so={so} k={k} set={k in mine} />
      </div>
      {k in mine ? body : <p className="tip ui-now">지금: {uiLabel(k, now[k])}{from(project, box, gid, k)}</p>}
    </div>
  );

  return (
    <>
      <Card id="s-say" title="대사 소리와 속도">
        {row('cps', '텍스트 속도', <CpsField so={so} v={mine.cps} />)}
        {row('sound', '대사 소리', <SoundField so={so} v={mine.sound} />)}
        <p className="tip">정하지 않은 값은 {box ? 'label 것을, label에도 없으면 ' : ''}게임 처음 값([GUI 편집] → 게임 처음 값)을 써요. 속도는 그 줄에 따로 정한 속도가 먼저예요.</p>
        {old && <p className="tip warn-text">이 게임의 pygaki 플러그인은 예전 판이라 대사 소리를 상자마다 바꾸지 못해요(속도는 돼요). ui_kit 4.7부터 돼요.</p>}
        <AllRow what="대사 소리와 속도" keys={['cps', 'sound']} so={so} />
      </Card>
      <Card id="s-cursor" title="커서와 클릭 대기 (CTC)">
        {row('ctc', '클릭 대기', <FramesField so={so} k="ctc" v={mine.ctc} />)}
        {row('cursor', '커서', <FramesField so={so} k="cursor" v={mine.cursor} />)}
        <p className="tip">그림 묶음은 game/gui/ctc, game/gui/cursor 안의 폴더예요. 폴더 하나에 그림을 이름 차례(1, 2, 3…)로 넣어요. 게임 처음 값에서 켜 둔 것만 바뀌고, 커서는 소프트웨어 커서일 때만 바뀌어요.</p>
        {old && <p className="tip warn-text">이 게임의 pygaki 플러그인은 예전 판이라 상자마다 바꾸지 못해요. ui_kit 4.7부터 돼요.</p>}
        <AllRow what="커서와 클릭 대기" keys={['ctc', 'cursor']} so={so} />
      </Card>
    </>
  );
}

function from(p: Project, box: BoxNode | null, gid: string, k: UiKey) {
  return uiFrom(p, box, gid, k) === 'label' ? ' (label 것)' : '';
}

// 정하기 / 따르기 단추
function Follow({ so, k, set }: { so: Owner; k: UiKey; set: boolean }) {
  const update = useStore((s) => s.update);
  const project = useStore((s) => s.project);
  const start = () =>
    update((p) => {
      const o = ownerOf(p, so)!;
      const box = so.kind === 'box' ? p.nodes.find((n) => n.id === so.id) : null;
      // 처음 정할 때는 지금 걸린 값(label 것)에서 시작한다
      const cur = box ? uiOfBox(p, box)[k] : undefined;
      const first: BoxUi[UiKey] = cur ?? (k === 'cps' ? 30 : k === 'sound' ? '' : useGameFolder.getState().media.frames?.[k as 'ctc' | 'cursor'][0]?.dir ?? `gui/${k}`);
      o.ui = { ...(o.ui ?? {}), [k]: first };
    });
  return (
    <div className="seg ui-seg">
      <button className={set ? '' : 'on'} onClick={() => set && update((p) => dropKey(ownerOf(p, so)!, k))}>
        {so.kind === 'box' ? '따름' : '게임 처음 값'}
      </button>
      <button className={set ? 'on' : ''} onClick={() => !set && start()}>
        {so.kind === 'box' ? '이 상자에' : '이 label에'}
      </button>
    </div>
  );
}

const useSet = (so: Owner) => {
  const update = useStore((s) => s.update);
  return (k: UiKey, v: BoxUi[UiKey], key?: string) => update((p) => void (ownerOf(p, so)!.ui = { ...(ownerOf(p, so)!.ui ?? {}), [k]: v }), key);
};

function CpsField({ so, v }: { so: Owner; v: number | undefined }) {
  const set = useSet(so);
  const n = v ?? 30;
  return (
    <div className="row ui-cps">
      <input type="range" min={0} max={120} step={1} value={n} onChange={(e) => set('cps', Number(e.target.value), 'uicps' + so.id)} />
      <span className="ui-val">{uiLabel('cps', n)}</span>
    </div>
  );
}

function SoundField({ so, v }: { so: Owner; v: string | undefined }) {
  const set = useSet(so);
  const audio = useGameFolder((s) => s.media.audio);
  const files = audio.map((f) => 'audio/' + f);
  const listen = async () => {
    if (!v) return;
    const url = (await fileUrl(v)) ?? (await soundUrl(v));
    if (url) new Audio(url).play().catch(() => {});
  };
  return (
    <div className="row">
      <select value={v ?? ''} onChange={(e) => set('sound', e.target.value)}>
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

function FramesField({ so, k, v }: { so: Owner; k: 'ctc' | 'cursor'; v: string | undefined }) {
  const set = useSet(so);
  const sets = useGameFolder((s) => s.media.frames?.[k] ?? []);
  const linked = useGameFolder((s) => !!s.name);
  return (
    <>
      {sets.length > 0 && (
        <div className="ui-frames">
          {sets.map((f) => (
            <button key={f.dir} className={f.dir === v ? 'on' : ''} onClick={() => set(k, f.dir)} title={`${f.dir} (${f.n}장)`}>
              <Thumb path={f.first} />
              <span>{f.dir.replace(`gui/${k}`, '') || '기본'}</span>
            </button>
          ))}
        </div>
      )}
      {!sets.length && <p className="tip">{linked ? `game/gui/${k} 안에 그림이 없어요.` : '렌파이 프로젝트를 연결하면 그림 묶음을 눌러서 골라요.'}</p>}
      <div className="row">
        <input placeholder={`그림 폴더 (예: gui/${k}/heart)`} value={v ?? ''} onChange={(e) => set(k, e.target.value.trim().replace(/\/+$/, ''), 'ui' + k + so.id)} />
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

// 카드 맨 아래: 이 상자·label의 값을 대본 전체(모든 label)에 걸기 / 대본 전체에서 지우기. 되돌리기(↶)로 돌아온다
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
  const n = count ? count(project) : (keys ?? []).reduce((m, k) => Math.max(m, uiCount(project, k)), 0);
  const mineHas = has ?? (keys ?? []).some((k) => owner?.ui && k in owner.ui);
  const doApply = () => {
    if (!confirm(`이 ${so.kind === 'box' ? '상자' : 'label'}의 ${what}를 모든 label에 걸까요?\n상자마다 따로 정한 ${what}는 지워져요. (↶ 되돌리기로 돌아와요)`)) return;
    update((p) => {
      if (apply) return apply(p);
      const o = ownerOf(p, so);
      const box = so.kind === 'box' ? p.nodes.find((x) => x.id === so.id) : null;
      const vals = box ? uiOfBox(p, box) : { ...(o?.ui ?? {}) };
      for (const k of keys ?? []) if (vals[k] !== undefined) applyAll(p, k, vals[k]);
    });
    useStore.getState().say(`${what}를 모든 label에 걸었어요`);
  };
  const doClear = () => {
    if (!confirm(`대본 전체(상자와 label ${n}곳)에서 ${what}를 지울까요?\n게임 처음 값으로 돌아가요. (↶ 되돌리기로 돌아와요)`)) return;
    update((p) => {
      if (clear) return clear(p);
      for (const k of keys ?? []) clearAll(p, k);
    });
    useStore.getState().say(`대본 전체에서 ${what}를 지웠어요`);
  };
  return (
    <div className="all-row">
      <button disabled={!mineHas} onClick={doApply} title={mineHas ? '이 값을 대본의 모든 label에 걸어요' : '먼저 이 상자나 label에 값을 정해요'}>
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
