// [효과] 화면: 글자 효과와 그림 효과를 한곳에서 보고, 켜고 끄고, 넣고 뺀다 (docs/EFFECTS_TAB_SPEC.md 3장).
// 목록과 파일 다루기는 effectsLib.ts가 하고, 여기는 화면만 그린다. 샘플에서 맞춘 값은 저장하지 않는다 (값은 대사 줄마다 정함)
import { useMemo, useRef, useState } from 'react';
import readme from '../../showpy/game/ui_kit/effects/README.md?raw';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { folderReady, gameFont, useGameFolder } from './gameFolder';
import { addEffectFile, addFromLibrary, allPacks, effectCatalog, effectUses, removeEffectFile, setEffectOn, type EffectCard, type EffectUse, type FxKind } from './effectsLib';
import { EFFECTS, TRANSITIONS, effectKnobs, formatEffect, imageFxCode } from './stage';
import { parseTextShader, previewPack } from './fx/textShaders';
import { FxCanvas, webglOk } from './fx/FxCanvas';
import { Glyphs, useReveal } from './PlayStage';
import { parseTagged } from './textTags';

const SOURCE_LABEL: Record<EffectCard['source'], string> = { renpy: '렌파이', base: '기본', project: '프로젝트', library: '모음' };
const SAMPLE_CPS = 30;
const SAMPLE_TEXT = '안녕, 반가워!';
// 효과 폴더 README의 "클로드에게 새 효과를 부탁할 때" 글 (사본을 두지 않고 그 파일에서 꺼낸다)
const REQUEST_TEXT = /## 클로드에게[\s\S]*?```text\r?\n([\s\S]*?)```/.exec(readme)?.[1].trim() ?? '';

// 글자 효과 샘플: 대사 미리보기와 같은 그리기(FxCanvas). 셰이더 코드가 틀리면 이유를 보여 준다
function TextSample({ spec, name, text, onReplay }: { spec: string; name: string; text: string; onReplay(): void }) {
  const look = useGameFolder((s) => s.look);
  const parsed = useMemo(() => parseTagged(text.trim() ? text : SAMPLE_TEXT, false, gameFont), [text]);
  const { shown, click, fast, limit, holding } = useReveal(parsed, SAMPLE_CPS);
  const [bad, setBad] = useState<string | null>(null);
  const ts = useMemo(() => {
    if (!webglOk || bad) return null;
    try {
      return parseTextShader(spec, true);
    } catch (e: any) {
      return null;
    }
  }, [spec, bad]);
  const inner = useRef<HTMLDivElement>(null);
  return (
    <div
      className="preview fxv-stage"
      title="클릭: 다시 보기"
      style={{ '--game-font': `${gameFont(look.font) ?? 'var(--font)'}, var(--font)` } as React.CSSProperties}
      onClick={() => click() || onReplay()}
    >
      <div
        ref={inner}
        className={'preview-text ' + (ts ? 'fx-gl' : 'fx-' + name + (fast ? ' fast' : ''))}
        style={{ color: look.textColor, '--txt': look.textColor, '--cd': `${1 / SAMPLE_CPS}s` } as React.CSSProperties}
      >
        <Glyphs parsed={parsed} shown={shown} />
      </div>
      {ts && (
        <FxCanvas
          target={inner}
          ts={ts}
          parsed={parsed}
          shown={shown}
          limit={limit}
          holding={holding}
          fast={fast}
          cps={SAMPLE_CPS}
          onFail={(e) => setBad(String((e as any)?.message ?? e).split('\n')[0])}
        />
      )}
      {bad && <div className="fxv-bad">이 효과의 셰이더 코드를 그리지 못했어요. 게임에서도 오류가 날 수 있어요.<br />{bad}</div>}
      {!webglOk && <div className="fxv-bad">이 브라우저는 WebGL이 안 돼서 비슷한 모양으로 보여요.</div>}
    </div>
  );
}

// 빼기 창: 이 파일에 든 효과가 대본에 쓰였으면 무엇으로 바꿀지 고른다
function RemoveDialog({ file, cards, onClose }: { file: string; cards: EffectCard[]; onClose(): void }) {
  const say = useStore((s) => s.say);
  const inside = cards.filter((c) => c.file === file && c.source === 'project');
  const used = inside.filter((c) => c.uses > 0);
  const [to, setTo] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const gone = (v: string) => inside.some((c) => v === c.name || v === imageFxCode(c.name));
  const choices = (kind: FxKind) => (kind === 'effect' ? EFFECTS.map(([k, t]): [string, string] => [k, k ? t : '효과 없이']) : TRANSITIONS).filter(([k]) => !gone(k));
  const run = async (replace?: Record<string, string>) => {
    setBusy(true);
    const r = await removeEffectFile(file, replace);
    setBusy(false);
    if (!r.ok) return say(r.why);
    say(`${file}을(를) 뺐어요. 백업: ${r.backup}` + (r.changed ? ` · 대본 ${r.changed}줄을 바꿨어요` : '') + (r.left ? ` · 글에 직접 적은 ${r.left}줄은 그대로예요` : ''));
    onClose();
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>효과 빼기: {file}</h3>
        <p className="tip">
          효과 파일을 게임의 효과 폴더에서 지워요. 지운 파일은 프로젝트 폴더의 ui_kit_backup/effects에 남겨요. 게임은 껐다 켜야 반영돼요.
        </p>
        {inside.map((c) => (
          <div className="fxv-rm-row" key={c.name}>
            <b>{c.label}</b> <span className="fxv-name">{c.name}</span>
            <span className="grow" />
            {c.uses > 0 ? (
              <>
                <span>대본 {c.uses}줄에서 씀 →</span>
                <select value={to[c.name] ?? ''} onChange={(e) => setTo((v) => ({ ...v, [c.name]: e.target.value }))} title="바꾸고 뺄 때 이 효과 대신 넣을 것">
                  {choices(c.kind).map(([k, t]) => (
                    <option key={k} value={k}>{t}</option>
                  ))}
                </select>
              </>
            ) : (
              <span className="tip">대본에서 안 씀</span>
            )}
          </div>
        ))}
        {used.length > 0 && <p className="tip warn-text">그냥 빼면 그 줄은 게임에서 "모르는 효과" 오류가 나요 (그림 효과는 배포판에서 서서히 바뀌기로 보여요).</p>}
        <div className="row end">
          <button onClick={onClose}>취소</button>
          {used.length > 0 ? (
            <>
              <button className="danger" disabled={busy} onClick={() => run()}>그냥 빼기</button>
              <button className="primary" disabled={busy} onClick={() => run(Object.fromEntries(used.map((c) => [c.name, to[c.name] ?? ''])))}>다른 효과로 바꾸고 빼기</button>
            </>
          ) : (
            <button className="danger" disabled={busy} onClick={() => run()}>빼기</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EffectsView() {
  const project = useStore((s) => s.project);
  const say = useStore((s) => s.say);
  const fxSeq = useGameFolder((s) => s.fxSeq);
  const hasShowpy = useGameFolder((s) => s.hasShowpy);
  const fxErrors = useGameFolder((s) => s.fxErrors);
  const [kind, setKind] = useState<FxKind>('effect');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Record<FxKind, string>>({ effect: '', transition: '' });
  const [args, setArgs] = useState<Record<string, Record<string, string>>>({}); // 샘플에서만 쓰는 값: 효과 이름 → { u__값: 값 }
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replay, setReplay] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const filePick = useRef<HTMLInputElement>(null);

  const cards = useMemo(() => effectCatalog(project), [project, fxSeq]);
  // 프로젝트를 연결하지 않았으면 구경만 한다
  const blocked = !folderReady() ? '프로젝트를 연결하면 쓸 수 있어요' : !hasShowpy ? '이 게임에 pygaki 플러그인(ui_kit 폴더)이 없어요' : '';
  const q = query.trim().toLowerCase();
  const shownCards = cards.filter((c) => c.kind === kind && (!q || c.label.toLowerCase().includes(q) || c.name.includes(q)));
  const here = shownCards.filter((c) => c.ready);
  const library = shownCards.filter((c) => !c.ready);
  const sel = cards.find((c) => c.kind === kind && c.name === picked[kind]) ?? here[0] ?? library[0] ?? null;

  // 아직 넣지 않은 효과도 샘플로 돌릴 수 있게 올려 둔다
  const sampleError = useMemo(() => {
    if (!sel || sel.ready || !sel.file) return null;
    const pack = allPacks().find((p) => p.name === sel.file);
    if (!pack) return null;
    try {
      previewPack(pack.name, pack.text);
      return null;
    } catch (e: any) {
      return String(e?.message ?? e);
    }
  }, [sel?.name, sel?.ready, fxSeq]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const toggle = (c: EffectCard) =>
    act(async () => {
      const r = await setEffectOn(c.name, !c.on);
      if (!r.ok) say(r.why);
      else say(c.on ? `"${c.label}"을(를) 껐어요. 고르는 목록에서만 빠지고, 이미 쓴 줄은 그대로 돌아요` : `"${c.label}"을(를) 켰어요`);
    });
  // 같은 이름의 파일이 있으면 물어보고 바꿔 넣는다
  const put = (file: string, add: (overwrite: boolean) => ReturnType<typeof addEffectFile>) =>
    act(async () => {
      let r = await add(false);
      if (!r.ok && r.exists && confirm(`효과 폴더에 ${file}이(가) 이미 있어요. 바꿔 넣을까요?`)) r = await add(true);
      if (!r.ok) return void (r.exists || alert('넣지 못했어요.\n' + r.why));
      const first = r.effects[0];
      say(`${r.file}을(를) 넣었어요: ${r.effects.map((e) => e.label).join(', ')}. 게임은 껐다 켜면 반영돼요`);
      if (first) {
        setKind(first.kind);
        setPicked((v) => ({ ...v, [first.kind]: first.name }));
      }
    });
  const addFiles = async (files: FileList | null) => {
    for (const f of [...(files ?? [])]) {
      const body = await f.text();
      await put(f.name, (overwrite) => addEffectFile(f.name, body, { overwrite }));
    }
    if (filePick.current) filePick.current.value = '';
  };
  const copyRequest = () =>
    navigator.clipboard.writeText(REQUEST_TEXT).then(
      () => say('새 효과 요청문을 복사했어요. 만들고 싶은 모양과 같이 클로드에게 주세요'),
      () => alert(REQUEST_TEXT),
    );
  const goTo = (u: EffectUse) => {
    useLive.setState({ view: 'script' });
    useStore.getState().select([u.nodeId]);
    useStore.getState().focusNodes([u.nodeId]);
    useStore.setState({ tab: 'edit', hideRight: false, focusLineId: u.lineId });
  };

  const row = (c: EffectCard) => (
    <div key={c.name} className={'fxv-card' + (sel?.name === c.name ? ' on' : '') + (c.ready && !c.on ? ' off' : '')} onClick={() => setPicked((v) => ({ ...v, [kind]: c.name }))}>
      {c.ready ? (
        <input
          type="checkbox"
          checked={c.on}
          disabled={!!blocked || busy}
          title={blocked || (c.on ? '끄기: 고르는 목록에서만 빠져요. 이미 쓴 줄은 그대로 돌아요' : '켜기: 고르는 목록에 다시 나와요')}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggle(c)}
        />
      ) : (
        <span className="fxv-plus">＋</span>
      )}
      <span className="fxv-label">{c.label}</span>
      <span className="fxv-name">{c.name}</span>
      {c.ready && !c.on && <span className="sp-badge">끔</span>}
      <span className="grow" />
      {c.uses > 0 && <span className="fxv-uses" title="대본에서 이 효과를 쓴 줄">{c.uses}줄</span>}
      <span className="sp-badge">{SOURCE_LABEL[c.source]}</span>
      {c.source === 'project' && c.file && (
        <button className="danger" disabled={!!blocked || busy} title={blocked || `${c.file}을(를) 효과 폴더에서 빼요`} onClick={(e) => (e.stopPropagation(), setRemoving(c.file!))}>
          빼기
        </button>
      )}
      {!c.ready && c.file && (
        <button
          className="primary"
          disabled={!!blocked || busy}
          title={blocked || `${c.file}을(를) 이 게임의 효과 폴더에 넣어요`}
          onClick={(e) => (e.stopPropagation(), void put(c.file!, (overwrite) => addFromLibrary(c.file!, { overwrite })))}
        >
          넣기
        </button>
      )}
    </div>
  );

  const knobs = sel?.kind === 'effect' ? effectKnobs(sel.name, true) : [];
  const mine = (sel && args[sel.name]) || {};
  const spec = sel ? formatEffect([{ name: sel.name, args: Object.entries(mine) }]) ?? sel.name : '';
  const putArg = (key: string, v: string | undefined) =>
    sel &&
    setArgs((all) => {
      const next = { ...(all[sel.name] ?? {}) };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return { ...all, [sel.name]: next };
    });
  const uses = sel ? effectUses(project, sel.kind, sel.name) : [];
  const lineOf = (u: EffectUse) => {
    const n = project.nodes.find((x) => x.id === u.nodeId);
    const l = n?.lines.find((x) => x.id === u.lineId);
    return { box: n?.title || '(이름 없는 상자)', text: (l?.text || l?.image || l?.type || '').slice(0, 40) };
  };

  return (
    <div className="sp-view fxv">
      <div className="fxv-list">
        <div className="fxv-bar">
          <span className="view-switch fxv-kind">
            <button className={kind === 'effect' ? 'on' : ''} onClick={() => setKind('effect')} title="대사 글자가 나오는 모양">글자 효과</button>
            <button className={kind === 'transition' ? 'on' : ''} onClick={() => setKind('transition')} title="배경, 캐릭터가 나타나는 모양">그림 효과</button>
          </span>
          <input className="fxv-find" placeholder="찾기 (이름)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="grow" />
          <button disabled={!!blocked || busy} title={blocked || '가진 .glsl 효과 파일을 검사해서 이 게임의 효과 폴더에 넣어요'} onClick={() => filePick.current?.click()}>파일 넣기</button>
          <button title="클로드에게 새 효과를 부탁할 때 같이 줄 글을 복사해요 (앱은 밖으로 통신하지 않아요)" onClick={copyRequest}>새 효과 요청문 복사</button>
          <input ref={filePick} type="file" accept=".glsl" multiple hidden onChange={(e) => void addFiles(e.target.files)} />
        </div>
        {blocked && <p className="tip fxv-note">{blocked}. 지금은 구경만 할 수 있어요.</p>}
        {fxErrors.length > 0 && <p className="tip warn-text fxv-note">효과 폴더에서 못 읽은 파일: {fxErrors.map(([f, why]) => `${f} (${why})`).join(' / ')}</p>}
        <div className="fxv-cards">
          <h4>{blocked ? '쓸 수 있는 효과' : '이 프로젝트에 있는 것'} <span className="tip">{here.length}</span></h4>
          {here.map(row)}
          {!here.length && <p className="tip">{q ? '찾는 효과가 없어요.' : kind === 'transition' ? '그림 효과 파일이 없어요. 아래 모음에서 넣을 수 있어요.' : '효과가 없어요.'}</p>}
          {library.length > 0 && (
            <>
              <h4>효과 모음 (아직 안 넣은 것) <span className="tip">{library.length}</span></h4>
              {library.map(row)}
            </>
          )}
        </div>
      </div>
      <div className="fxv-side">
        {!sel ? (
          <p className="tip">왼쪽에서 효과를 골라 주세요.</p>
        ) : (
          <>
            <h3>
              {sel.label} <span className="fxv-name">{sel.name}</span>
            </h3>
            <p className="tip">
              {SOURCE_LABEL[sel.source]} 효과{sel.file ? ` · ${sel.file}` : ''}
              {!sel.ready ? ' · 아직 이 게임에 넣지 않았어요' : !sel.on ? ' · 꺼 둠 (고르는 목록에 안 나와요)' : ''}
            </p>
            {sel.kind === 'effect' ? (
              sampleError ? (
                <p className="tip warn-text">이 파일은 샘플을 돌릴 수 없어요: {sampleError}</p>
              ) : (
                <>
                  <TextSample key={[spec, text, replay, fxSeq].join('|')} spec={spec} name={sel.name} text={text} onReplay={() => setReplay((v) => v + 1)} />
                  <div className="fxv-row">
                    <b>샘플 글</b>
                    <input className="grow" value={text} placeholder={SAMPLE_TEXT} onChange={(e) => setText(e.target.value)} />
                    <button onClick={() => setReplay((v) => v + 1)}>다시 보기</button>
                  </div>
                  {knobs.length > 0 && (
                    <>
                      <h4>세부 값 <span className="tip">여기서 맞춘 값은 저장하지 않아요. 값은 [대본 편집]의 대사 줄마다 정해요</span></h4>
                      <div className="fx-knobs">
                        {knobs.map((k) => {
                          const set = mine[k.key];
                          const v = set ?? k.def;
                          return (
                            <label key={k.key} className={set !== undefined ? 'set' : ''}>
                              <span className="fx-kn" title={k.key}>{k.label}</span>
                              {k.kind === 'color' ? (
                                <input type="color" value={v.slice(0, 7)} onChange={(e) => putArg(k.key, e.target.value)} />
                              ) : (
                                <>
                                  <input type="range" min={k.min} max={k.max} step={k.step} value={Number(v)} onChange={(e) => putArg(k.key, String(Number(e.target.value)))} />
                                  <span className="fx-kv">{Number(v)}</span>
                                </>
                              )}
                              <button className="fx-x" style={{ visibility: set !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), putArg(k.key, undefined))}>↺</button>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )
            ) : (
              <p className="tip fxv-todo">그림 효과는 아직 여기서 돌려 볼 수 없어요. 배경·보이기 줄의 "나타나는 방식"에서 고르고 게임에서 확인해요.</p>
            )}
            <h4>쓰인 곳 <span className="tip">{uses.length ? `대본 ${uses.length}줄` : '대본에서 안 써요'}</span></h4>
            {uses.slice(0, 30).map((u) => {
              const { box, text } = lineOf(u);
              return (
                <div className="fxv-use" key={u.lineId}>
                  <span className="fxv-use-box">{box}</span>
                  <span className="fxv-use-text">{text}</span>
                  <button onClick={() => goTo(u)} title="[대본 편집]에서 이 줄이 든 상자로 가요">보기</button>
                </div>
              );
            })}
            {uses.length > 30 && <p className="tip">… 외 {uses.length - 30}줄</p>}
          </>
        )}
      </div>
      {removing && <RemoveDialog file={removing} cards={cards} onClose={() => setRemoving(null)} />}
    </div>
  );
}
