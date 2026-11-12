// [효과] 화면의 [셰이더] 칸: 화면 전체에 씌우는 셰이더를 보고, 켜고 끈다 (docs/LINK.md 11장).
// 목록은 게임 폴더의 screen_fx/shader_list.json에서 온다. 어느 상자에 걸지는 [대본 편집]의 ◐ 셰이더에서 정한다
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { useGameFolder } from './gameFolder';
import { SAMPLE_WIDTH, samplePicture } from './EffectsView';
import { webglOk } from './fx/FxCanvas';
import { ScreenFxCanvas, ScreenFxKnobs, screenFxBlocked } from './fx/ScreenFxCanvas';
import type { ShaderInfo } from './shader';
import { setShaderOn, shaderBlocked, shaderCatalog, shaderUses, type ShaderCard, type ShaderUse } from './shaderLib';

// 막대 묶음에서 사람이 읽을 이름만 꺼낸다: [묶음 이름, [[값 이름, 보일 글, …], …]]
function groupNames(groups: unknown[]): [string, string[]][] {
  const rv: [string, string[]][] = [];
  for (const g of groups) {
    if (!Array.isArray(g) || !Array.isArray(g[1])) continue;
    rv.push([String(g[0]), g[1].filter((r) => Array.isArray(r) && typeof r[1] === 'string').map((r) => String((r as unknown[])[1]))]);
  }
  return rv;
}

// 셰이더 샘플: 샘플 그림(또는 고른 그림)에 게임과 같은 셰이더 코드를 씌워 계속 그린다
function ShaderSample({ info, args, picture }: { info: ShaderInfo; args: Record<string, unknown>; picture: HTMLImageElement | null }) {
  const look = useGameFolder((s) => s.look);
  const [bad, setBad] = useState<string | null>(null);
  const pic = useMemo(() => samplePicture(SAMPLE_WIDTH, Math.round((SAMPLE_WIDTH * look.height) / look.width), true, picture, '샘플 화면'), [look.width, look.height, picture]);
  const why = screenFxBlocked(info);
  return (
    <div className="fxv-pic" style={{ aspectRatio: `${look.width} / ${look.height}` }}>
      {webglOk && !bad && !why && <ScreenFxCanvas info={info} args={args} picture={pic} size={[look.width, look.height]} onFail={(e) => setBad(String((e as any)?.message ?? e).split('\n')[0])} />}
      {why && <div className="fxv-bad">{why}. 상자에 건 뒤 [▶ 렌파이에서 실행]으로 게임에서 봐요.</div>}
      {bad && <div className="fxv-bad">이 셰이더를 앱에서 그리지 못했어요. 게임에서는 될 수 있어요.<br />{bad}</div>}
      {!webglOk && <div className="fxv-bad">이 브라우저는 WebGL이 안 돼서 셰이더 샘플을 볼 수 없어요.</div>}
    </div>
  );
}

export function ShadersView({ bar }: { bar: ReactNode }) {
  const project = useStore((s) => s.project);
  const say = useStore((s) => s.say);
  const fxSeq = useGameFolder((s) => s.fxSeq);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState('');
  const [args, setArgs] = useState<Record<string, Record<string, unknown>>>({}); // 샘플에서만 쓰는 값: 셰이더 이름 → { 값 이름: 값 }
  const [picture, setPicture] = useState<HTMLImageElement | null>(null); // 샘플 그림 (저장하지 않음)
  const picPick = useRef<HTMLInputElement>(null);
  const pickPicture = (f: File | undefined) => {
    if (picPick.current) picPick.current.value = '';
    if (!f) return;
    const img = new Image();
    img.onload = () => setPicture(img);
    img.onerror = () => say('그림을 읽지 못했어요: ' + f.name);
    img.src = URL.createObjectURL(f);
  };
  useEffect(() => {
    let live = true;
    void shaderBlocked().then((why) => live && setBlocked(why ?? ''));
    return () => void (live = false);
  }, [fxSeq]);

  const cards = useMemo(() => shaderCatalog(project), [project, fxSeq]);
  const q = query.trim().toLowerCase();
  const shown = cards.filter((c) => !q || c.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.id.includes(q));
  const sel = cards.find((c) => c.id === picked) ?? shown[0] ?? null;
  const uses = sel ? shaderUses(project, sel.id) : [];
  const mine = (sel && args[sel.id]) || {};
  const putArg = (key: string, v: unknown | undefined) =>
    sel &&
    setArgs((all) => {
      const next = { ...(all[sel.id] ?? {}) };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return { ...all, [sel.id]: next };
    });

  const toggle = async (c: ShaderCard) => {
    setBusy(true);
    const r = await setShaderOn(c.id, !c.on);
    setBusy(false);
    if (!r.ok) say(r.why);
    else say(c.on ? `"${c.label}"을(를) 껐어요. 고르는 목록에서만 빠지고, 이미 정한 상자는 그대로 돌아요` : `"${c.label}"을(를) 켰어요`);
  };
  const goTo = (u: ShaderUse) => {
    useLive.setState({ view: 'script' });
    const s = useStore.getState();
    if (u.kind === 'box') s.focusNodes([u.id]);
    else s.focusNodes(project.nodes.filter((n) => n.group === u.id).map((n) => n.id));
    if (s.shaderOf?.kind !== u.kind || s.shaderOf.id !== u.id) s.openShader(u.kind, u.id);
  };

  return (
    <div className="sp-view fxv">
      <div className="fxv-list">
        <div className="fxv-bar">
          {bar}
          <input className="fxv-find" placeholder="찾기 (이름)" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {blocked && <p className="tip fxv-note">{blocked}. 지금은 구경만 할 수 있어요.</p>}
        <div className="fxv-cards">
          <h4>{blocked ? '기본 셰이더' : '이 프로젝트에 있는 것'} <span className="tip">{shown.length}</span></h4>
          {shown.map((c) => (
            <div key={c.id} className={'fxv-card' + (sel?.id === c.id ? ' on' : '') + (c.on ? '' : ' off')} onClick={() => setPicked(c.id)}>
              <input
                type="checkbox"
                checked={c.on}
                disabled={!!blocked || busy}
                title={blocked || (c.on ? '끄기: 고르는 목록에서만 빠져요. 이미 정한 상자는 그대로 돌아요' : '켜기: 고르는 목록에 다시 나와요')}
                onClick={(e) => e.stopPropagation()}
                onChange={() => void toggle(c)}
              />
              <span className="fxv-label">{c.label}</span>
              <span className="fxv-name">{c.id}</span>
              {!c.on && <span className="sp-badge">끔</span>}
              <span className="grow" />
              {c.uses > 0 && <span className="fxv-uses" title="이 셰이더를 건 상자와 label">{c.uses}곳</span>}
              {c.overlay_only && <span className="sp-badge" title="다른 셰이더 위에 덧씌우는 용도로 만든 셰이더예요">덮개</span>}
            </div>
          ))}
          {!shown.length && <p className="tip">{q ? '찾는 셰이더가 없어요.' : '셰이더가 없어요.'}</p>}
          <p className="tip">게임에 새 셰이더를 넣었으면 게임을 한 번 켠 뒤 위쪽 [다시 읽기]를 누르면 여기에 나와요.</p>
        </div>
      </div>
      <div className="fxv-side">
        {!sel ? (
          <p className="tip">왼쪽에서 셰이더를 골라 주세요.</p>
        ) : (
          <>
            <h3>
              {sel.label} <span className="fxv-name">{sel.id}</span>
            </h3>
            <p className="tip">
              화면 전체에 씌우는 셰이더{sel.name !== sel.label ? ` · ${sel.name}` : ''}
              {!sel.on ? ' · 꺼 둠 (고르는 목록에 안 나와요)' : ''}
            </p>
            <ShaderSample key={sel.id + '|' + fxSeq} info={sel} args={mine} picture={picture} />
            <div className="fxv-row">
              <b>샘플 그림</b>
              <button title="셰이더를 씌워 볼 그림 파일을 골라요 (저장하지 않아요)" onClick={() => picPick.current?.click()}>고르기</button>
              {picture && <button onClick={() => setPicture(null)}>기본 그림</button>}
              <span className="grow" />
              {Object.keys(mine).length > 0 && <button onClick={() => setArgs((all) => ({ ...all, [sel.id]: {} }))}>값 모두 기본으로</button>}
              <input ref={picPick} type="file" accept="image/*" hidden onChange={(e) => pickPicture(e.target.files?.[0])} />
            </div>
            <p className="tip">어느 상자에 걸지는 [대본 편집]에서 상자나 label의 ◐ 셰이더로 정해요.</p>
            <h4>세부 값 <span className="tip">여기서 맞춘 값은 저장하지 않아요 (구경용)</span></h4>
            {screenFxBlocked(sel) ? (
              groupNames(sel.groups).map(([title, names]) => (
                <div className="fxv-use" key={title}>
                  <span className="fxv-use-box">{title}</span>
                  <span className="fxv-use-text">{names.join(', ')}</span>
                </div>
              ))
            ) : (
              <ScreenFxKnobs info={sel} values={mine} onChange={putArg} />
            )}
            <h4>쓰인 곳 <span className="tip">{uses.length ? `${uses.length}곳` : '대본에서 안 써요'}</span></h4>
            {uses.slice(0, 30).map((u) => (
              <div className="fxv-use" key={u.kind + u.id}>
                <span className="fxv-use-box">{u.kind === 'box' ? '상자' : 'label'} · {u.slot}번</span>
                <span className="fxv-use-text">{u.title}</span>
                <button onClick={() => goTo(u)} title="[대본 편집]에서 그 상자(label)의 셰이더 칸을 열어요">보기</button>
              </div>
            ))}
            {uses.length > 30 && <p className="tip">… 외 {uses.length - 30}곳</p>}
          </>
        )}
      </div>
    </div>
  );
}
