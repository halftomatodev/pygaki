// 위쪽 [셰이더] 화면: 화면 전체에 씌우는 셰이더와, 셰이더가 바뀔 때의 전환을 보고 켜고 끈다 (docs/LINK.md 11장).
// 셰이더 목록은 게임 폴더의 screen_fx/shader_list.json에서 온다. 어느 상자에 걸지와 세부 값은 [대본 편집]의 ◐ 셰이더에서 정한다
import { Hint } from './Help';
import { Card } from './Card';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { useGameFolder } from './gameFolder';
import { PictureSample, SAMPLE_WIDTH, samplePicture } from './EffectsView';
import { shaderEffect } from './fx/textShaders';
import { webglOk } from './fx/FxCanvas';
import { ScreenFxCanvas, ScreenFxKnobs, screenFxBlocked } from './fx/ScreenFxCanvas';
import { SHADER_TRANS, TV_KNOBS, type ShaderInfo } from './shader';
import type { Project } from './types';
import { usePrefs } from './prefs';
import { Resizer } from './Resizer';
import { GalleryCard, GallerySwitch, ShaderLive, ShaderStill, TransitionLive, TransitionStill } from './FxGallery';
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

// 전환을 쓴 상자와 label: "시작할 때"나 "끝날 때"에 고른 곳
function transUses(p: Project, k: string) {
  const rv: { kind: 'box' | 'label'; id: string; title: string; slot: string }[] = [];
  const at = (o: { shader?: { in?: string; out?: string } }) => [o.shader?.in === k && '시작할 때', o.shader?.out === k && '끝날 때'].filter(Boolean).join(', ');
  for (const g of p.labels) if (at(g)) rv.push({ kind: 'label', id: g.id, title: g.title || g.name, slot: at(g) });
  for (const n of p.nodes) if (at(n)) rv.push({ kind: 'box', id: n.id, title: n.title || n.id, slot: at(n) });
  return rv;
}

// TV 꺼짐·켜짐 샘플: 게임과 같은 순서로 (꺼짐 → 검은 화면 → 켜짐). 값을 바꾸면 다시
export function TvSample({ values }: { values: Record<string, number> }) {
  const look = useGameFolder((s) => s.look);
  const v = (k: string) => values[k] ?? TV_KNOBS.find((x) => x[0] === k)![6];
  const [off, black, on] = [v('off_time'), v('black_time'), v('on_time')];
  const total = Math.max(0.05, off + black + on) + 1.2; // 끝나고 잠깐 쉼
  const pct = (t: number) => `${((t / total) * 100).toFixed(2)}%`;
  const line = Math.max(1, v('line'));
  const ly = (line / look.height).toFixed(4);
  const name = ['tv', off, black, on, line, v('flash')].map((x) => String(x).replace('.', '_')).join('_');
  const pic = useMemo(() => samplePicture(SAMPLE_WIDTH, Math.round((SAMPLE_WIDTH * look.height) / look.width), true, null, '샘플 화면').toDataURL(), [look.width, look.height]);
  const flash = 1 + v('flash') * 3;
  const css = `@keyframes ${name} {
    0% { transform: scale(1, 1); filter: brightness(1); }
    ${pct(off * 0.6)} { transform: scale(1, ${ly}); filter: brightness(${flash}); }
    ${pct(off)} { transform: scale(0.004, ${ly}); filter: brightness(${flash}); }
    ${pct(off + black)} { transform: scale(0, ${ly}); filter: brightness(1); }
    ${pct(off + black + on * 0.4)} { transform: scale(1, ${ly}); filter: brightness(2); }
    ${pct(off + black + on)}, 100% { transform: scale(1, 1); filter: brightness(1); }
  }`;
  return (
    <div className="fxv-pic tv-sample" style={{ aspectRatio: `${look.width} / ${look.height}` }}>
      <style>{css}</style>
      <img src={pic} alt="" style={{ animation: `${name} ${total}s linear infinite` }} />
      {v('noise') > 0 && <div className="tv-noise" style={{ opacity: v('noise') * 0.35 }} />}
      <span className="tv-note">비슷한 모양 (게임은 렌파이에서)</span>
    </div>
  );
}

// TV 전환 막대 (셰이더의 ScreenFxKnobs와 같은 모양)
export function TvKnobs({ values, onChange }: { values: Record<string, number>; onChange(key: string, v: number | undefined): void }) {
  return (
    <div className="fx-knobs">
      {TV_KNOBS.map(([key, label, min, max, step, dp, def]) => {
        const set = values[key] !== undefined;
        const v = values[key] ?? def;
        return (
          <label key={key} className={set ? 'set' : ''}>
            <span className="fx-kn" title={key}>{label}</span>
            <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(key, Number(e.target.value))} />
            <span className="fx-kv">{v.toFixed(dp)}</span>
            <button className="fx-x" style={{ visibility: set ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), onChange(key, undefined))}>↺</button>
          </label>
        );
      })}
    </div>
  );
}

const TRANS_DESC: Record<string, string> = {
  tv: '화면이 위아래로 눌려 가로선이 되고 점으로 꺼졌다가, 검은 화면 뒤에 다시 켜져요. 검은 화면일 때 셰이더가 바뀌어요.',
  pixelsort: '앞 상자의 마지막 화면이 띠로 늘어나며 깨지고(가로·세로·회전·확산), 깨진 채 멈췄다가 이 상자의 첫 화면으로 뚝 끊어 넘어가요. 셰이더도 끊기는 순간에 바뀌어요.',
  datamosh: '키프레임을 잃은 동영상처럼, 앞 상자의 마지막 화면이 블록째 소용돌이치거나(회전) 바깥으로 끌려가며(확산) 녹고 이 상자 첫 화면의 윤곽이 비쳐요. 그렇게 깨진 채 멈췄다가 이 상자의 첫 화면으로 뚝 끊어 넘어가요. 셰이더도 끊기는 순간에 바뀌어요.',
  static: '앞 상자의 마지막 화면 위로 TV 노이즈가 덮였다가, 걷히면서 이 상자의 첫 화면이 나와요. 노이즈가 가장 진할 때 셰이더가 바뀌어요.',
  calibrate: '앞 상자의 마지막 화면이 지직 끊기고 방송 조정 화면이 잠깐 나왔다가, 다시 끊기며 이 상자의 첫 화면으로 넘어가요. 조정 화면이 끝날 때 셰이더가 바뀌어요.',
  tapestretch: '비디오테이프가 늘어나듯 앞 상자의 마지막 화면이 출렁이며 늘어지고 색이 번지다가, 가장 심할 때 이 상자의 첫 화면과 셰이더로 바뀌어요.',
  blink: '화면이 몇 번 깜빡이고(색은 상자의 효과 파일 값), 가운데 깜빡임 때 이 상자의 첫 화면과 셰이더로 바뀌어요.',
  none: '전환 없이 바로 바뀌어요.',
};

// 전환 칸: TV 꺼짐·켜짐, 그림 전환 둘, 없음. 세부 값은 상자마다 [대본 편집]에서
function TransList({ bar }: { bar: ReactNode }) {
  const project = useStore((s) => s.project);
  const [picked, setPicked] = useState('tv');
  const [vals, setVals] = useState<Record<string, number>>({});
  const [replay, setReplay] = useState(0);
  const gallery = usePrefs((p) => p.gallery);
  const fxSeq = useGameFolder((s) => s.fxSeq);
  const uses = transUses(project, picked);
  const imgFx = picked === 'tv' || picked === 'none' ? undefined : shaderEffect(picked);
  const goTo = (u: { kind: 'box' | 'label'; id: string }) => {
    useLive.setState({ view: 'script' });
    const s = useStore.getState();
    if (u.kind === 'box') s.focusNodes([u.id]);
    else s.focusNodes(project.nodes.filter((n) => n.group === u.id).map((n) => n.id));
    if (s.shaderOf?.kind !== u.kind || s.shaderOf.id !== u.id) s.openShader(u.kind, u.id);
  };
  const put = (k: string, v: number | undefined) =>
    setVals((o) => {
      const n = { ...o };
      if (v === undefined) delete n[k];
      else n[k] = v;
      return n;
    });
  return (
    <div className="sp-view fxv">
      <div className="fxv-list">
        <div className="fxv-bar">
          {bar}
          <span className="grow" />
          <GallerySwitch />
        </div>
        <div className="fxv-cards">
          <h4>셰이더가 바뀔 때 <span className="tip">{SHADER_TRANS.length}</span><Hint text="상자나 label의 ◐ 셰이더 → 시작할 때, 끝날 때에서 골라요" topic="셰이더 (상자" /></h4>
          {gallery && (
            <div className="gal-grid">
              {SHADER_TRANS.map(([k, t]) => {
                const n = transUses(project, k).length;
                const e = k === 'tv' || k === 'none' ? undefined : shaderEffect(k);
                const pe = e?.kind === 'transition' ? e : null;
                return (
                  <GalleryCard
                    key={k}
                    on={picked === k}
                    label={t}
                    name={k}
                    onPick={() => setPicked(k)}
                    bottom={n > 0 && <span className="fxv-uses" title="이 전환을 고른 상자와 label">{n}곳</span>}
                    still={k === 'tv' ? <TvSample values={vals} /> : pe ? <TransitionStill effect={pe} args={{}} picture={null} seq={fxSeq} /> : <div className="gal-msg">{k === 'none' ? '바로 바뀌어요' : '효과 폴더에 없어요'}</div>}
                    live={pe && <TransitionLive effect={pe} args={{}} picture={null} />}
                  />
                );
              })}
            </div>
          )}
          {!gallery && SHADER_TRANS.map(([k, t]) => {
            const n = transUses(project, k).length;
            return (
              <div key={k} className={'fxv-card' + (picked === k ? ' on' : '')} onClick={() => setPicked(k)}>
                <span className="fxv-label">{t}</span>
                <span className="fxv-name">{k}</span>
                <span className="grow" />
                {n > 0 && <span className="fxv-uses" title="이 전환을 고른 상자와 label">{n}곳</span>}
              </div>
            );
          })}
        </div>
      </div>
      <Resizer size="fxSideW" grow={-1} className="right" />
      {/* 오른쪽 칸도 대본 편집처럼 카드: 샘플 / 세부 값 / 쓰인 곳 */}
      <div className="fxv-side">
        <Card id="tr-sample" title={<>{SHADER_TRANS.find(([k]) => k === picked)?.[1]} <span className="fxv-name">{picked}</span></>}>
        <p className="tip">{TRANS_DESC[picked]}</p>
        {picked === 'tv' && (
          <>
            <TvSample values={vals} />
            <div className="fxv-row">
              <span className="grow" />
              {Object.keys(vals).length > 0 && <button onClick={() => setVals({})}>값 모두 기본으로</button>}
            </div>
          </>
        )}
        {picked !== 'tv' && picked !== 'none' && (imgFx?.kind === 'transition' ? (
          <PictureSample key={picked + replay} effect={imgFx} args={{}} time={imgFx.time} picture={null} onReplay={() => setReplay((v) => v + 1)} />
        ) : (
          <p className="tip warn-text">효과 폴더에 {picked}이 없어요 ([효과]에서 넣기). 없으면 TV 꺼짐·켜짐으로 내보내요.</p>
        ))}
        </Card>
        {picked === 'tv' && (
          <Card id="tr-knobs" title="세부 값" hint="여기 값은 구경용이라 저장하지 않아요. 상자마다 ◐ 셰이더에서 정해요" topic="셰이더 (상자">
            <TvKnobs values={vals} onChange={put} />
          </Card>
        )}
        <Card id="tr-uses" title={<>쓰인 곳 <span className="tip">{uses.length ? `${uses.length}곳` : '대본에서 안 써요'}</span></>}>
        {uses.slice(0, 30).map((u) => (
          <div className="fxv-use" key={u.kind + u.id}>
            <span className="fxv-use-box">{u.kind === 'box' ? '상자' : 'label'} · {u.slot}</span>
            <span className="fxv-use-text">{u.title}</span>
            <button onClick={() => goTo(u)} title="[대본 편집]에서 그 상자(label)의 셰이더 칸을 열어요">보기</button>
          </div>
        ))}
        {uses.length > 30 && <p className="tip">… 외 {uses.length - 30}곳</p>}
        </Card>
      </div>
    </div>
  );
}

// 위쪽 [셰이더] 화면: [셰이더] / [전환]
export function ShadersView() {
  const [part, setPart] = useState<'shader' | 'trans'>('shader');
  const bar = (
    <span className="view-switch fxv-kind">
      <button className={part === 'shader' ? 'on' : ''} onClick={() => setPart('shader')} title="화면 전체에 씌우는 셰이더">셰이더</button>
      <button className={part === 'trans' ? 'on' : ''} onClick={() => setPart('trans')} title="셰이더가 바뀔 때의 모양">전환</button>
    </span>
  );
  return part === 'shader' ? <ShaderList bar={bar} /> : <TransList bar={bar} />;
}

function ShaderList({ bar }: { bar: ReactNode }) {
  const project = useStore((s) => s.project);
  const say = useStore((s) => s.say);
  const fxSeq = useGameFolder((s) => s.fxSeq);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('');
  const [busy, setBusy] = useState(false);
  const gallery = usePrefs((p) => p.gallery);
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
    else say(c.on ? `"${c.label}"을(를) 숨겼어요. 고르는 목록에서만 빠지고, 이미 정한 상자는 그대로 돌아요` : `"${c.label}"의 숨김을 풀었어요`);
  };
  const check = (c: ShaderCard) => (
      <button
        className={'fxv-hide' + (c.on ? '' : ' on')}
        disabled={!!blocked || busy}
        title={blocked || (c.on ? '숨김: 고르는 목록에서만 빠져요. 이미 정한 상자는 그대로 돌아요' : '숨김 해제: 고르는 목록에 다시 나와요')}
        onClick={(e) => (e.stopPropagation(), void toggle(c))}
      >
        {c.on ? '숨김' : '숨김 해제'}
      </button>
  );
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
          <span className="grow" />
          <GallerySwitch />
        </div>
        {blocked && <p className="tip fxv-note">{blocked}. 지금은 구경만 할 수 있어요.</p>}
        <div className="fxv-cards">
          <h4>{blocked ? '기본 셰이더' : '이 프로젝트에 있는 것'} <span className="tip">{shown.length}</span><Hint text="새 셰이더는 게임을 한 번 켠 뒤 [다시 읽기]로 나와요" topic="셰이더" /></h4>
          {gallery ? (
            <div className="gal-grid">
              {shown.map((c) => (
                <GalleryCard
                  key={c.id}
                  on={sel?.id === c.id}
                  off={!c.on}
                  label={c.label}
                  name={c.id}
                  onPick={() => setPicked(c.id)}
                  top={
                    <>
                      {!c.on && <span className="sp-badge">숨김</span>}
                      {c.overlay_only && <span className="sp-badge" title="다른 셰이더 위에 덧씌우는 용도로 만든 셰이더예요">덮개</span>}
                      {check(c)}
                    </>
                  }
                  bottom={c.uses > 0 && <span className="fxv-uses" title="이 셰이더를 건 상자와 label">{c.uses}곳</span>}
                  still={<ShaderStill info={c} args={args[c.id] ?? {}} picture={picture} seq={fxSeq} />}
                  live={!screenFxBlocked(c) && <ShaderLive info={c} args={args[c.id] ?? {}} picture={picture} />}
                />
              ))}
            </div>
          ) : (
            shown.map((c) => (
            <div key={c.id} className={'fxv-card' + (sel?.id === c.id ? ' on' : '') + (c.on ? '' : ' off')} onClick={() => setPicked(c.id)}>
              {check(c)}
              <span className="fxv-label">{c.label}</span>
              <span className="fxv-name">{c.id}</span>
              {!c.on && <span className="sp-badge">숨김</span>}
              <span className="grow" />
              {c.uses > 0 && <span className="fxv-uses" title="이 셰이더를 건 상자와 label">{c.uses}곳</span>}
              {c.overlay_only && <span className="sp-badge" title="다른 셰이더 위에 덧씌우는 용도로 만든 셰이더예요">덮개</span>}
            </div>
            ))
          )}
          {!shown.length && <p className="tip">{q ? '찾는 셰이더가 없어요.' : '셰이더가 없어요.'}</p>}
        </div>
      </div>
      <Resizer size="fxSideW" grow={-1} className="right" />
      <div className="fxv-side">
        {!sel ? (
          <Card id="sh-none" title="샘플">
            <p className="tip">왼쪽에서 셰이더를 골라 주세요.</p>
          </Card>
        ) : (
          <>
            <Card id="sh-sample" title={<>{sel.label} <span className="fxv-name">{sel.id}</span></>}>
            <p className="tip">
              화면 전체에 씌우는 셰이더{sel.name !== sel.label ? ` · ${sel.name}` : ''}
              {!sel.on ? ' · 숨겨 둠 (고르는 목록에 안 나와요)' : ''}
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
            </Card>
            <Card id="sh-knobs" title="세부 값" hint="여기 값은 구경용이라 저장하지 않아요. 상자마다 ◐ 셰이더에서 정해요" topic="셰이더 (상자">
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
            </Card>
            <Card id="sh-uses" title={<>쓰인 곳 <span className="tip">{uses.length ? `${uses.length}곳` : '대본에서 안 써요'}</span></>}>
            {uses.slice(0, 30).map((u) => (
              <div className="fxv-use" key={u.kind + u.id}>
                <span className="fxv-use-box">{u.kind === 'box' ? '상자' : 'label'} · {u.slot}번</span>
                <span className="fxv-use-text">{u.title}</span>
                <button onClick={() => goTo(u)} title="[대본 편집]에서 그 상자(label)의 셰이더 칸을 열어요">보기</button>
              </div>
            ))}
            {uses.length > 30 && <p className="tip">… 외 {uses.length - 30}곳</p>}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
