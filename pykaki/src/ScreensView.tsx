// 위쪽 [화면] 탭 (FEATURE 17): 배경·그림 버튼·글 버튼·글·그림을 끌어 놓아 렌파이 screen을 만든다.
// 버튼마다 누르면 돌려줄 값(_return)을 정하고, 대본의 흐름 "화면 부르기"가 그 값마다 갈래를 낸다. 원고는 game/pykaki_screens.rpy
// HUD (FEATURE 18): 대사가 흐르는 동안 떠 있는 화면. 크기·붙일 자리, 플래그 값 글([love])·막대, 보이는 조건, 버튼으로 플래그 바꾸기·상자로 가기·다른 HUD 열고 닫기
// 끌어 놓기 (FEATURE 19): 글·그림에 "끌 수 있음", 항목 "놓는 곳"(받는 것, 놓으면 할 일). HUD 틀은 [+ HUD 틀에서] 메뉴(설명 카드에 렌파이 영상)
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Card } from './Card';
import { Hint } from './Help';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { pictureOf, useGameFolder } from './gameFolder';
import type { Project, ScreenAct, ScreenDef, ScreenItem, ScreenItemKind } from './types';
import { uid } from './util';
import { lookSize, actOf, addHudTemplate, ANCHORS, BAR_H, BAR_W, canDrag, DROP_H, DROP_W, hasAct, HUD_H, HUD_TEMPLATES, HUD_W, hudPos, hudTemplateCode, isDragged, isHud, newScreenName, screenNameProblem, SCREENS_FILE, screensCode, type HudTemplate } from './screens';
import { PickMenu, type PickEntry } from './FlagMenu';
import { ActionInput, CondInput, firstAction } from './FlagFields';
import { evalExpr, initVars, UNKNOWN, type Vars } from './trace';
import { FlagWidget } from './FlagWidget';
import { flagUi, strOptions, LOOK_LABEL } from './flagUi';

export const useScreenSel = create<{ id: string | null; item: string | null }>(() => ({ id: null, item: null }));

const KIND: Record<ScreenItemKind, string> = { imagebutton: '그림 버튼', textbutton: '글 버튼', text: '글', image: '그림', bar: '막대', drop: '놓는 곳', look: '플래그 꼴' };

// HUD 틀 영상: src/hudclips/<틀 id>.webm (렌파이 8.5.3에서 찍음, 빌드에 들어감)
const HUD_CLIPS = import.meta.glob('./hudclips/*.webm', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const tplEntries = (): PickEntry[] =>
  HUD_TEMPLATES.map((t) => ({ ...t, chips: t.flags, code: hudTemplateCode(t.id), clip: HUD_CLIPS[`./hudclips/${t.id}.webm`], foot: '누르거나 Enter: 이 HUD와 플래그 만들기' }));

// 화면을 부르는 상자들 (HUD는 HUD 줄이 있는 상자)
const usesOf = (p: Project, id: string) =>
  p.nodes.filter((n) => (n.exit.type === 'screen' && n.exit.screen === id) || n.lines.some((l) => l.type === 'hud' && l.screen === id));

// 글 속 [플래그]를 값으로 (미리 보기)
const fillFlags = (t: string, vars: Vars) => t.replace(/\[([A-Za-z_]\w*)\]/g, (m, n) => (n in vars ? String(vars[n] === true ? 'True' : vars[n] === false ? 'False' : vars[n]) : m));
const shown = (it: ScreenItem, vars: Vars) => {
  if (!it.cond?.trim()) return true;
  const v = evalExpr(it.cond, vars);
  return v === UNKNOWN ? null : !!v;
};

export function ScreensView() {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const sel = useScreenSel();
  const screens = project.screens ?? [];
  const sc = screens.find((s) => s.id === sel.id) ?? screens[0];
  const item = sc?.items.find((it) => it.id === sel.item) ?? null;

  const updScreen = (fn: (s: ScreenDef, p: Project) => void, key?: string) =>
    update((p) => {
      const s = p.screens?.find((x) => x.id === sc?.id);
      if (s) fn(s, p);
    }, key);
  const updItem = (id: string, fn: (it: ScreenItem) => void, key?: string) =>
    updScreen((s) => {
      const it = s.items.find((x) => x.id === id);
      if (it) fn(it);
    }, key);

  const addScreen = () => {
    const id = uid('s');
    update((p) => {
      p.screens ??= [];
      const name = newScreenName(p);
      p.screens.push({ id, name, title: '새 화면 ' + (p.screens.length + 1), items: [] });
    });
    useScreenSel.setState({ id, item: null });
  };
  const tplBtn = useRef<HTMLButtonElement>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const addTemplate = (t: HudTemplate) => {
    let id = '';
    update((p) => void (id = addHudTemplate(p, t)));
    useScreenSel.setState({ id, item: null });
  };
  const look = useGameFolder((s) => s.look);
  const addItem = (kind: ScreenItemKind) => {
    if (!sc) return;
    const id = uid('i');
    const n = sc.items.length;
    const hud = isHud(sc);
    // 새 것은 왼쪽 위부터 아래로 차례로 (겹치지 않게). HUD는 HUD 칸 안에서
    const it: ScreenItem = hud
      ? { id, kind, x: 12 + Math.floor(n / 4) * 140, y: 10 + (n % 4) * 36 }
      : { id, kind, x: Math.round(look.width * 0.1) + Math.floor(n / 6) * 300, y: Math.round(look.height * 0.15) + (n % 6) * Math.round(look.height * 0.12) };
    if (kind === 'textbutton') Object.assign(it, { text: '버튼 ' + (n + 1) }, hud ? { act: 'flag', acts: [firstAction(project.variables)].filter(Boolean) } : { value: 'b' + (n + 1) });
    if (kind === 'imagebutton') Object.assign(it, { image: '' }, hud ? { act: 'flag', acts: [firstAction(project.variables)].filter(Boolean) } : { value: 'b' + (n + 1) });
    if (kind === 'text') it.text = '글';
    if (kind === 'drop') Object.assign(it, { text: '놓는 곳', w: DROP_W, h: DROP_H, accept: null }, hud ? { act: 'flag', acts: [firstAction(project.variables)].filter(Boolean) } : { value: 'd' + (n + 1) });
    if (kind === 'look') it.flag = project.variables[0]?.name ?? '';
    if (kind === 'bar') Object.assign(it, { flag: project.variables.find((f) => f.kind === 'int')?.name ?? '', max: 10, w: hud ? Math.min(BAR_W, (sc.w ?? HUD_W) - 24) : BAR_W, h: BAR_H });
    updScreen((s) => void s.items.push(it));
    useScreenSel.setState({ id: sc.id, item: id });
  };

  return (
    <div className="sp-view scv">
      <div className="scv-list">
        <div className="row">
          <b>화면</b>
          <Hint text="렌파이 screen을 그림으로 만들어요. 대본의 상자 흐름에서 [▣ 화면 부르기]로 띄우고, 누른 버튼의 값에 따라 갈래가 나뉘어요" topic="화면 만들기" />
          <span className="grow" />
          <button onClick={addScreen}>+ 새 화면</button>
        </div>
        <button ref={tplBtn} className="scv-tpl" aria-haspopup="menu" aria-expanded={tplOpen} onClick={() => setTplOpen((v) => !v)} title="HUD 틀: 필요한 플래그도 같이 만들어요 (같은 이름이 있으면 그대로 써요)">
          + HUD 틀에서 <span aria-hidden>▾</span>
        </button>
        {tplOpen && tplBtn.current && (
          <PickMenu
            anchor={tplBtn.current}
            items={tplEntries()}
            placeholder="어떤 HUD를 만들까요?"
            section="HUD 틀에서 만들기"
            empty="맞는 틀이 없어요"
            onPick={(e) => (setTplOpen(false), addTemplate(e.id as HudTemplate))}
            onClose={() => setTplOpen(false)}
          />
        )}
        {screens.map((s) => (
          <button key={s.id} className={'scv-item' + (s.id === sc?.id ? ' on' : '')} onClick={() => useScreenSel.setState({ id: s.id, item: null })}>
            <span>{s.title || s.name}</span>
            <code>{s.name}</code>
            <span className="tip">{isHud(s) ? `HUD · ${s.items.length}개 · 쓰는 상자 ${usesOf(project, s.id).length}${s.overlay ? ' · 게임 내내' : ''}` : `${s.items.length}개 · 부르는 상자 ${usesOf(project, s.id).length}`}</span>
          </button>
        ))}
        {!screens.length && <p className="tip">아직 화면이 없어요. [+ 새 화면]으로 만들어요.</p>}
      </div>
      <div className="scv-main">
        {sc ? (
          <>
            <div className="row scv-tools">
              <button onClick={() => addItem('textbutton')}>+ 글 버튼</button>
              <button onClick={() => addItem('imagebutton')}>+ 그림 버튼</button>
              <button onClick={() => addItem('text')}>+ 글</button>
              <button onClick={() => addItem('image')}>+ 그림</button>
              <button onClick={() => addItem('bar')} title="숫자 플래그의 값을 막대로 보여요">+ 막대</button>
              <button onClick={() => addItem('look')} title="플래그 카드에서 만든 꼴(레벨·슬라이더·스위치·풀다운)과 꾸미기를 그대로 가져와요">+ 플래그 꼴</button>
              <button onClick={() => addItem('drop')} title="끌 수 있는 글·그림을 여기에 놓으면 할 일을 정해요 (끌어 놓기)">+ 놓는 곳</button>
              <span className="tip">끌어서 옮겨요 · 방향키로 1px (Shift: 10px){isHud(sc) ? ' · HUD 빈 곳을 끌면 HUD가 옮겨져요' : ''}</span>
            </div>
            <Stage
              sc={sc}
              sel={item?.id ?? null}
              onMove={(id, x, y) => updItem(id, (it) => ((it.x = x), (it.y = y)), 'scr-move' + id)}
              onMoveHud={(dx, dy) => updScreen((s) => ((s.dx = dx), (s.dy = dy)), 'scr-hudmove' + sc.id)}
            />
          </>
        ) : (
          <p className="tip scv-empty">왼쪽 [+ 새 화면]으로 시작해요.</p>
        )}
      </div>
      <div className="scv-side">
        {sc && <ScreenCard sc={sc} updScreen={updScreen} />}
        {sc && item && <ItemCard sc={sc} it={item} upd={(fn, key) => updItem(item.id, fn, key)} remove={() => (updScreen((s) => void (s.items = s.items.filter((x) => x.id !== item.id))), useScreenSel.setState({ item: null }))} dup={() => {
          const id = uid('i');
          updScreen((s) => void s.items.push({ ...item, id, x: item.x + 20, y: item.y + 20 }));
          useScreenSel.setState({ item: id });
        }} />}
        {sc && <CodeCard sc={sc} />}
      </div>
    </div>
  );
}

// 게임 화면 크기 그대로의 무대를 칸 폭에 맞춰 줄여 그린다
function Stage({ sc, sel, onMove, onMoveHud }: { sc: ScreenDef; sel: string | null; onMove: (id: string, x: number, y: number) => void; onMoveHud: (dx: number, dy: number) => void }) {
  const look = useGameFolder((s) => s.look);
  const project = useStore((s) => s.project);
  const vars = initVars(project);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / look.width, (el.clientHeight || 9999) / look.height));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [look.width, look.height]);

  // 방향키로 고른 것 옮기기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel || (e.target as HTMLElement).closest('input, textarea, select')) return;
      const it = sc.items.find((x) => x.id === sel);
      if (!it) return;
      const d = e.shiftKey ? 10 : 1;
      const m: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
      const v = m[e.key];
      if (!v) return;
      e.preventDefault();
      onMove(it.id, it.x + v[0], it.y + v[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, sc]);

  // HUD 빈 곳을 끌면 HUD 자리(dx, dy)가 옮겨진다
  const dragHud = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();
    useScreenSel.setState({ item: null });
    const sx = e.clientX, sy = e.clientY, ox = sc.dx ?? 0, oy = sc.dy ?? 0;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => onMoveHud(Math.round(ox + (ev.clientX - sx) / scale), Math.round(oy + (ev.clientY - sy) / scale));
    const up = () => (el.removeEventListener('pointermove', mv), el.removeEventListener('pointerup', up));
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
  };

  return (
    <div className="scv-stage-wrap" ref={wrap}>
      <div
        className={'scv-stage' + (isHud(sc) ? ' hud' : '')}
        style={{ width: look.width * scale, height: look.height * scale }}
        onPointerDown={(e) => e.target === e.currentTarget && useScreenSel.setState({ item: null })}
      >
        {isHud(sc) && <span className="scv-see tip">HUD는 대사가 흐르는 동안 게임 화면 위에 떠 있어요</span>}
        <ScreenArt sc={sc} scale={scale} vars={vars} sel={sel} onMove={onMove} onHudDown={dragHud} />
      </div>
    </div>
  );
}

// 화면 하나를 그린다 (무대에서는 끌어 옮기고, 따라가 보기에서는 보기만). vars: 글 속 [플래그]와 보이는 조건, 막대에 쓸 값
export function ScreenArt({ sc, scale, vars, sel = null, onMove, onHudDown }: { sc: ScreenDef; scale: number; vars: Vars; sel?: string | null; onMove?: (id: string, x: number, y: number) => void; onHudDown?: (e: React.PointerEvent<HTMLDivElement>) => void }) {
  const look = useGameFolder((s) => s.look);
  const bgColor = sc.bg?.startsWith('#') ? sc.bg : undefined;
  const bgPic = usePic(sc.bg && !sc.bg.startsWith('#') ? sc.bg : '');
  const hud = isHud(sc);
  const box = hud ? hudPos(sc, look.width, look.height) : { x: 0, y: 0, w: look.width, h: look.height };
  const alpha = (sc.bgAlpha ?? 100) / 100;
  return (
    <div
      className={'scv-art' + (hud ? ' hud' : '') + (onMove ? '' : ' still')}
      style={{ left: box.x * scale, top: box.y * scale, width: box.w * scale, height: box.h * scale }}
      onPointerDown={hud ? onHudDown : undefined}
    >
      {bgColor && <div className="scv-bgc" style={{ background: bgColor, opacity: alpha }} />}
      {bgPic && <img className="scv-bg" src={bgPic} alt="" style={{ transform: `scale(${scale})`, opacity: alpha }} draggable={false} />}
      {!sc.bg && !hud && onMove && <span className="scv-see tip">배경 없음: 게임에서는 아래 화면이 그대로 보여요</span>}
      {sc.items.map((it) => {
        const v = shown(it, vars);
        if (v === false && !onMove) return null;
        return <StageItem key={it.id} sc={sc} it={it} scale={scale} on={it.id === sel} onMove={onMove} vars={vars} hidden={v === false} />;
      })}
    </div>
  );
}

export function usePic(name: string) {
  const [url, setUrl] = useState<string | null>(null);
  const seq = useGameFolder((s) => s.fxSeq);
  useEffect(() => {
    let live = true;
    if (!name.trim()) return setUrl(null);
    pictureOf(name.trim()).then((p) => live && setUrl(p && !p.video ? p.url : null));
    return () => void (live = false);
  }, [name, seq]);
  return url;
}

const ACT_TAG: Record<ScreenAct, string> = { return: '값', flag: '⚑', jump: '→', toggle: '⇆' };

function StageItem({ sc, it, scale, on, onMove, vars, hidden }: { sc: ScreenDef; it: ScreenItem; scale: number; on: boolean; onMove?: (id: string, x: number, y: number) => void; vars: Vars; hidden: boolean }) {
  const look = useGameFolder((s) => s.look);
  const project = useStore((s) => s.project);
  const pic = usePic(it.kind === 'imagebutton' || it.kind === 'image' ? it.image ?? '' : '');
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onMove) return;
    e.preventDefault();
    e.stopPropagation();
    useScreenSel.setState({ item: it.id });
    const sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => onMove(it.id, Math.round(ox + (ev.clientX - sx) / scale), Math.round(oy + (ev.clientY - sy) / scale));
    const up = () => (el.removeEventListener('pointermove', mv), el.removeEventListener('pointerup', up));
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
  };
  const size = (it.size ?? look.textSize) * scale;
  const act = actOf(sc, it);
  let body;
  if (it.kind === 'imagebutton' || it.kind === 'image')
    body = pic ? <img src={pic} alt="" draggable={false} style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }} onLoad={(e) => {
      const im = e.currentTarget;
      im.parentElement!.style.width = im.naturalWidth * scale + 'px';
      im.parentElement!.style.height = im.naturalHeight * scale + 'px';
    }} /> : <span className="scv-noimg">{it.image?.trim() || '그림 이름 없음'}</span>;
  else if (it.kind === 'bar') {
    const max = it.max && it.max > 0 ? it.max : 10;
    const v = it.flag && typeof vars[it.flag] === 'number' ? (vars[it.flag] as number) : 0;
    const fill = Math.max(0, Math.min(1, v / max));
    body = (
      <span className="scv-bar" style={{ width: (it.w ?? BAR_W) * scale, height: (it.h ?? BAR_H) * scale, background: it.bgColor ?? '#00000080' }}>
        <span style={{ width: fill * 100 + '%', background: it.color ?? '#e0607a' }} />
        {!it.flag && <em>플래그 없음</em>}
      </span>
    );
  } else if (it.kind === 'look') {
    const f = project.variables.find((v) => v.name === it.flag);
    const [w, h] = lookSize(project, it);
    body = f ? (
      <span className="scv-look" style={{ width: w * scale, height: h * scale }}>
        <span style={{ width: w, height: h, transform: `scale(${scale})` }}>
          <FlagWidget ui={flagUi(f)} value={f.name in vars ? vars[f.name] : (f.init as never)} options={f.kind === 'str' ? strOptions(project, f) : undefined} label={f.name} />
        </span>
      </span>
    ) : (
      <span className="scv-noimg">플래그 없음</span>
    );
  } else if (it.kind === 'drop')
    body = (
      <span className="scv-drop" style={{ width: (it.w ?? DROP_W) * scale, height: (it.h ?? DROP_H) * scale, background: it.bgColor ?? '#ffffff26', fontSize: size, color: it.color ?? look.textColor }}>
        {fillFlags(it.text || '', vars)}
      </span>
    );
  else body = <span style={{ fontSize: size, color: it.color ?? (it.kind === 'textbutton' ? '#aaaaaa' : look.textColor) }}>{fillFlags(it.text || ' ', vars)}</span>;
  const tag = hasAct(it.kind) ? (act === 'return' ? it.value || '값 없음' : ACT_TAG[act]) : null;
  return (
    <div
      className={'scv-el k-' + it.kind + (on ? ' on' : '') + (hidden ? ' off' : '') + (onMove ? '' : ' still')}
      style={{ left: it.x * scale, top: it.y * scale }}
      onPointerDown={down}
      title={(hasAct(it.kind) ? (act === 'return' ? `${KIND[it.kind]} · 값 ${it.value ?? ''}` : KIND[it.kind]) : KIND[it.kind]) + (isDragged(it) ? ' · 끌 수 있음' : '') + (it.kind === 'look' && it.edit ? ' · 게임에서 바꿀 수 있음' : '') + (it.cond ? ` · 보이는 조건 ${it.cond}${hidden ? ' (지금 안 보임)' : ''}` : '')}
    >
      {body}
      {onMove && tag && <span className={'scv-val' + (act === 'return' ? '' : ' act')}>{tag}</span>}
      {onMove && it.cond && <span className="scv-cond">?</span>}
      {onMove && isDragged(it) && <span className="scv-drag" title="게임에서 끌 수 있어요">✋</span>}
      {onMove && it.kind === 'look' && it.edit && <span className="scv-drag" title="게임에서 꼴로 값을 바꿔요">✋</span>}
    </div>
  );
}

function ScreenCard({ sc, updScreen }: { sc: ScreenDef; updScreen: (fn: (s: ScreenDef, p: Project) => void, key?: string) => void }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const images = useGameFolder((s) => s.media.images);
  const prob = screenNameProblem(project, sc);
  const uses = usesOf(project, sc.id);
  const color = !!sc.bg?.startsWith('#');
  const hud = isHud(sc);
  const num = (k: 'w' | 'h' | 'dx' | 'dy' | 'zorder', ph: string, title: string, min?: number) => (
    <input
      type="number"
      className="sf-num"
      placeholder={ph}
      title={title}
      value={sc[k] ?? ''}
      onChange={(e) =>
        updScreen((s) => {
          const n = Math.round(Number(e.target.value));
          if (e.target.value === '' || !Number.isFinite(n)) delete s[k];
          else s[k] = min !== undefined ? Math.max(min, n) : n;
        }, 'scr-' + k + sc.id)
      }
    />
  );
  return (
    <Card id="scr-screen" title="화면" hint={hud ? '이름은 렌파이 screen 이름이에요 (영문). 원고에는 show screen 이름' : '이름은 렌파이 screen 이름이에요 (영문). 원고에는 call screen 이름'} topic="화면 만들기">
      <input className="title" value={sc.title} placeholder="화면 제목 (예: 방 고르기)" onChange={(e) => updScreen((s) => void (s.title = e.target.value), 'scr-title' + sc.id)} />
      <div className="row">
        <label>이름</label>
        <input className={'grow' + (prob ? ' invalid' : '')} value={sc.name} onChange={(e) => updScreen((s) => void (s.name = e.target.value.trim()), 'scr-name' + sc.id)} />
      </div>
      {prob && <p className="tip warn-text">{prob}</p>}
      <div className="row">
        <label>종류</label>
        <select
          className="grow"
          value={hud ? 'hud' : ''}
          title="전체 화면: 화면을 막고 버튼을 누를 때까지 기다려요 (call screen) / HUD: 대사가 흐르는 동안 옆에 떠 있어요 (show screen)"
          onChange={(e) =>
            updScreen((s) => {
              if (e.target.value === 'hud') {
                s.kind = 'hud';
                s.w ??= HUD_W;
                s.h ??= HUD_H;
                // 값을 돌려주던 버튼은 HUD에서 할 일이 없어서 플래그 바꾸기로
                for (const it of s.items) if (hasAct(it.kind) && (it.act ?? 'return') === 'return') it.act = 'flag';
              } else delete s.kind;
            })
          }
        >
          <option value="">전체 화면 (call screen)</option>
          <option value="hud">HUD (show screen)</option>
        </select>
      </div>
      {hud && (
        <>
          <div className="row">
            <label>크기</label>
            {num('w', String(HUD_W), '가로 (px)', 20)}
            {num('h', String(HUD_H), '세로 (px)', 20)}
            <span className="tip">px</span>
          </div>
          <div className="row">
            <label>붙일 곳</label>
            <span className="scv-anchor" role="radiogroup" aria-label="붙일 곳">
              {ANCHORS.map(([k, n]) => (
                <button key={k} role="radio" aria-checked={(sc.anchor ?? 'tl') === k} className={(sc.anchor ?? 'tl') === k ? 'on' : ''} title={n} onClick={() => updScreen((s) => void (k === 'tl' ? delete s.anchor : (s.anchor = k)))} />
              ))}
            </span>
            <span className="grow" />
          </div>
          <div className="row">
            <label>옮기기</label>
            {num('dx', '0', '붙인 곳에서 가로로 (px, 왼쪽은 −)')}
            {num('dy', '0', '붙인 곳에서 세로로 (px, 위는 −)')}
            <span className="tip">px</span>
          </div>
          <div className="row">
            <label>앞뒤</label>
            {num('zorder', '0', 'zorder: 숫자가 클수록 다른 화면보다 앞에')}
            <span className="tip">클수록 앞 (zorder)</span>
          </div>
          <label className="check">
            <input type="checkbox" checked={!!sc.overlay} onChange={(e) => updScreen((s) => void (e.target.checked ? (s.overlay = true) : delete s.overlay))} />
            게임 내내 띄우기 <span className="tip">(HUD 줄 없이 늘 떠 있어요, config.overlay_screens)</span>
          </label>
        </>
      )}
      <div className="row">
        <label>배경</label>
        <select value={!sc.bg ? '' : color ? 'color' : 'image'} onChange={(e) => updScreen((s) => {
          if (e.target.value === '') delete s.bg;
          else if (e.target.value === 'color') s.bg = '#202028';
          else s.bg = images.find((n) => n.startsWith('bg ')) ?? 'bg ';
        })}>
          <option value="">{hud ? '없음 (투명)' : '없음 (아래 화면이 보임)'}</option>
          <option value="color">색</option>
          <option value="image">그림</option>
        </select>
        {color && <input type="color" value={sc.bg!.slice(0, 7)} onChange={(e) => updScreen((s) => void (s.bg = e.target.value), 'scr-bg' + sc.id)} />}
        {sc.bg && !color && (
          <>
            <input className="grow" list="scv-images" value={sc.bg} placeholder="그림 이름 (예: bg room)" onChange={(e) => updScreen((s) => void (s.bg = e.target.value), 'scr-bg' + sc.id)} />
          </>
        )}
      </div>
      {sc.bg && (
        <div className="row">
          <label>진하기</label>
          <input type="range" className="grow" min={0} max={100} step={5} value={sc.bgAlpha ?? 100} onChange={(e) => updScreen((s) => void (Number(e.target.value) >= 100 ? delete s.bgAlpha : (s.bgAlpha = Number(e.target.value))), 'scr-alpha' + sc.id)} />
          <span className="tip">{sc.bgAlpha ?? 100}%</span>
        </div>
      )}
      <ImageList />
      <div className="tip">
        {hud ? 'HUD 줄이 있는 상자' : '부르는 상자'}:{' '}
        {uses.length
          ? uses.map((n) => (
              <button key={n.id} className="linklike" onClick={() => (useLive.setState({ view: 'script' }), useStore.getState().select([n.id]), useStore.getState().focusNodes([n.id]))}>
                {n.title || n.id}
              </button>
            ))
          : hud
            ? sc.overlay ? '없음 (게임 내내 떠 있어요)' : '없음 (상자의 대사 칸에서 [+ HUD] 줄을 넣어요)'
            : '없음 (상자의 다음 흐름에서 [▣ 화면 부르기])'}
      </div>
      <div className="row">
        <button
          className="danger"
          onClick={() =>
            confirm(`화면 "${sc.title || sc.name}"을 지울까요?${uses.length ? `\n쓰는 상자 ${uses.length}개는 "화면 없음"이 돼요.` : ''}`) &&
            (update((p) => {
              p.screens = p.screens?.filter((x) => x.id !== sc.id);
              for (const n of p.nodes) {
                if (n.exit.type === 'screen' && n.exit.screen === sc.id) n.exit.screen = null;
                for (const l of n.lines) if (l.type === 'hud' && l.screen === sc.id) delete l.screen;
              }
              for (const s of p.screens ?? []) for (const it of s.items) if (it.screen === sc.id) it.screen = null;
              if (!p.screens?.length) delete p.screens;
            }),
            useScreenSel.setState({ id: null, item: null }))
          }
        >
          화면 지우기
        </button>
      </div>
    </Card>
  );
}

function ImageList() {
  const images = useGameFolder((s) => s.media.images);
  return (
    <datalist id="scv-images">
      {images.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}

const ACT_LABEL: [ScreenAct, string][] = [['return', '값 돌려주기'], ['flag', '플래그 바꾸기'], ['jump', '상자로 가기'], ['toggle', 'HUD 열고 닫기']];

function ItemCard({ sc, it, upd, remove, dup }: { sc: ScreenDef; it: ScreenItem; upd: (fn: (it: ScreenItem) => void, key?: string) => void; remove: () => void; dup: () => void }) {
  const project = useStore((s) => s.project);
  const hud = isHud(sc);
  const act = actOf(sc, it);
  const num = (k: 'x' | 'y' | 'size' | 'w' | 'h' | 'max', ph: string, title?: string) => (
    <input
      type="number"
      className="sf-num"
      placeholder={ph}
      title={title}
      value={it[k] ?? ''}
      onChange={(e) =>
        upd((x) => {
          const n = Math.round(Number(e.target.value));
          if (k === 'x' || k === 'y') x[k] = Number.isFinite(n) ? n : 0;
          else if (e.target.value === '' || !(n > 0)) delete x[k];
          else x[k] = Math.min(n, k === 'size' ? 300 : k === 'max' ? 100000 : 4000);
        }, 'scr-' + k + it.id)
      }
    />
  );
  const col = (k: 'color' | 'hoverColor' | 'bgColor', title: string) => (
    <span className="sf-color" title={title}>
      <input type="color" value={(it[k] ?? '#ffffff').slice(0, 7)} onChange={(e) => upd((x) => void (x[k] = e.target.value), 'scr-' + k + it.id)} />
      {it[k] && <button onClick={() => upd((x) => void delete x[k])}>✕</button>}
    </span>
  );
  const ints = project.variables.filter((f) => f.kind === 'int');
  const drop = it.kind === 'drop';
  const hint = drop
    ? '끌 수 있는 글·그림을 여기에 놓으면 할 일을 해요. 놓은 것은 제자리로 돌아가요'
    : !hasAct(it.kind)
    ? it.kind === 'text' ? '글에 [플래그 이름]을 넣으면 게임에서 그 값이 보여요 (예: 호감도 [love])' : undefined
    : act === 'return' ? '누르면 화면이 닫히고 "돌려줄 값"이 대본으로 가요. 같은 값의 버튼은 같은 갈래로 가요'
    : act === 'flag' ? '누르면 플래그가 바뀌어요. 대사는 그대로 이어져요'
    : act === 'jump' ? '누르면 그 상자로 가요 (지금 대사는 끊겨요)'
    : '누르면 다른 HUD가 떴다가, 다시 누르면 내려가요';
  const drags = sc.items.filter(isDragged);
  return (
    <Card id="scr-item" title={KIND[it.kind]} hint={hint} topic="화면 만들기">
      {(it.kind === 'textbutton' || it.kind === 'text' || drop) && (
        <div className="row">
          <label>글</label>
          <input className="grow" value={it.text ?? ''} onChange={(e) => upd((x) => void (x.text = e.target.value), 'scr-text' + it.id)} />
          {project.variables.length > 0 && (
            <select className="flag-pick" value="" title="플래그 값을 글에 넣어요 ([이름])" onChange={(e) => e.target.value && upd((x) => void (x.text = (x.text ?? '') + `[${e.target.value}]`))}>
              <option value="">플래그 ▾</option>
              {project.variables.map((f) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
      {(it.kind === 'imagebutton' || it.kind === 'image') && (
        <div className="row">
          <label>그림</label>
          <input className="grow" list="scv-images" value={it.image ?? ''} placeholder="그림 이름 (예: door)" onChange={(e) => upd((x) => void (x.image = e.target.value), 'scr-img' + it.id)} />
        </div>
      )}
      {it.kind === 'imagebutton' && (
        <div className="row">
          <label>올렸을 때</label>
          <input className="grow" list="scv-images" value={it.hover ?? ''} placeholder="비우면 그대로 (예: door hover)" onChange={(e) => upd((x) => void (e.target.value ? (x.hover = e.target.value) : delete x.hover), 'scr-hover' + it.id)} />
        </div>
      )}
      {it.kind === 'look' && (
        <>
          <div className="row">
            <label>플래그</label>
            <select className={'grow' + (project.variables.some((f) => f.name === it.flag) ? '' : ' invalid')} value={it.flag ?? ''} onChange={(e) => upd((x) => void (x.flag = e.target.value))}>
              {!project.variables.some((f) => f.name === it.flag) && <option value={it.flag ?? ''}>{project.variables.length ? '플래그 고르기' : '플래그가 없어요 (플래그 카드)'}</option>}
              {project.variables.map((f) => (
                <option key={f.id} value={f.name}>{f.name} · {LOOK_LABEL[flagUi(f).look]}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <label>크기</label>
            {num('w', String(lookSize(project, { ...it, w: undefined, h: undefined })[0]), '가로 (px). 비우면 꼴의 기본 크기')}
            {num('h', String(lookSize(project, { ...it, w: undefined, h: undefined })[1]), '세로 (px)')}
          </div>
          <label className="check" title="켜면 플레이어가 꼴로 값을 바꿔요. 슬라이더·이어진 막대는 끌기, 칸 막대·별은 칸 누르기, 스위치는 누르기, 풀다운·콤보는 펼쳐서 고르기(콤보는 글도 침)">
            <input type="checkbox" checked={!!it.edit} onChange={(e) => upd((x) => void (e.target.checked ? (x.edit = true) : delete x.edit))} />
            게임에서 바꿀 수 있음
          </label>
          <p className="tip">꼴과 꾸미기(색·그림)는 플래그 카드의 [꼴 ▾]에서 고쳐요. 여기서는 게임 화면에서의 자리와 크기만 정해요. {it.edit ? '게임에서 플레이어가 꼴로 값을 바꿔요(최솟값~최댓값, 롤백하면 되돌아감)' : '게임에서는 값을 보여 주기만 해요'}</p>
        </>
      )}
      {it.kind === 'bar' && (
        <>
          <div className="row">
            <label>플래그</label>
            <select className={'grow' + (ints.some((f) => f.name === it.flag) ? '' : ' invalid')} value={it.flag ?? ''} onChange={(e) => upd((x) => void (x.flag = e.target.value))} title="숫자 플래그">
              {!ints.some((f) => f.name === it.flag) && <option value={it.flag ?? ''}>{ints.length ? '숫자 플래그 고르기' : '숫자 플래그가 없어요 (플래그 카드)'}</option>}
              {ints.map((f) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <label>꽉 찬 값</label>
            {num('max', '10', '이 값이면 막대가 꽉 차요')}
          </div>
          <div className="row">
            <label>크기</label>
            {num('w', String(BAR_W), '가로 (px)')}
            {num('h', String(BAR_H), '세로 (px)')}
            {col('color', '찬 쪽 색')}
            {col('bgColor', '빈 쪽 색')}
          </div>
        </>
      )}
      {drop && (
        <>
          <div className="row">
            <label>크기</label>
            {num('w', String(DROP_W), '가로 (px)')}
            {num('h', String(DROP_H), '세로 (px)')}
            {col('bgColor', '칸 색')}
          </div>
          <div className="row">
            <label>받는 것</label>
            <select className="grow" value={drags.some((d) => d.id === it.accept) ? it.accept! : ''} onChange={(e) => upd((x) => void (x.accept = e.target.value || null))} title="이것을 놓을 때만 할 일을 해요">
              <option value="">끌 수 있는 것 아무거나</option>
              {drags.map((d) => (
                <option key={d.id} value={d.id}>{d.kind === 'image' ? d.image || KIND.image : d.text || KIND.text}</option>
              ))}
            </select>
          </div>
          {!drags.length && <p className="tip">이 화면에 끌 수 있는 것이 없어요. 글·그림 항목에서 [끌 수 있음]을 켜요</p>}
        </>
      )}
      {hasAct(it.kind) && (
        <div className="row">
          <label>{drop ? '놓으면' : '누르면'}</label>
          <select className="grow" value={act} onChange={(e) => upd((x) => {
            const v = e.target.value as ScreenAct;
            x.act = v;
            if (v === 'flag' && !x.acts?.length) x.acts = [firstAction(project.variables)].filter(Boolean);
            if (v === 'jump') x.target ??= null;
            if (v === 'toggle') x.screen ??= null;
          })}>
            {ACT_LABEL.filter(([k]) => k !== 'return' || !hud).map(([k, n]) => (
              <option key={k} value={k}>{n}</option>
            ))}
          </select>
        </div>
      )}
      {hasAct(it.kind) && act === 'return' && (
        <div className="row">
          <label>돌려줄 값</label>
          <input className={'grow' + (it.value?.trim() ? '' : ' invalid')} value={it.value ?? ''} placeholder="예: door" onChange={(e) => upd((x) => void (x.value = e.target.value), 'scr-val' + it.id)} />
        </div>
      )}
      {hasAct(it.kind) && act === 'flag' && (
        <>
          {(it.acts ?? []).map((a, k) => (
            <div className="row" key={k}>
              <ActionInput value={a} onChange={(v) => upd((x) => void (x.acts![k] = v), 'scr-act' + it.id + k)} />
              <button className="x" title="빼기" onClick={() => upd((x) => void x.acts!.splice(k, 1))}>✕</button>
            </div>
          ))}
          <div className="row">
            <button onClick={() => upd((x) => void (x.acts ??= []).push(firstAction(project.variables)))}>+ 바꾸기 더하기</button>
          </div>
        </>
      )}
      {hasAct(it.kind) && act === 'jump' && (
        <div className="row">
          <label>갈 상자</label>
          <select className={'grow' + (project.nodes.some((n) => n.id === it.target) ? '' : ' invalid')} value={it.target ?? ''} onChange={(e) => upd((x) => void (x.target = e.target.value || null))}>
            <option value="">상자 고르기</option>
            {project.labels.map((g) => (
              <optgroup key={g.id} label={g.title || g.name}>
                {project.nodes.filter((n) => n.group === g.id).map((n) => (
                  <option key={n.id} value={n.id}>{n.title || n.id}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
      {hasAct(it.kind) && act === 'toggle' && (
        <div className="row">
          <label>열 HUD</label>
          <select className={'grow' + (project.screens?.some((s) => s.id === it.screen && isHud(s)) ? '' : ' invalid')} value={it.screen ?? ''} onChange={(e) => upd((x) => void (x.screen = e.target.value || null))}>
            <option value="">HUD 고르기</option>
            {(project.screens ?? []).filter((s) => isHud(s) && s.id !== sc.id).map((s) => (
              <option key={s.id} value={s.id}>{s.title || s.name}</option>
            ))}
          </select>
        </div>
      )}
      {(it.kind === 'textbutton' || it.kind === 'text' || drop) && (
        <div className="row">
          <label>글자</label>
          {num('size', '크기')}
          {col('color', '글자 색')}
          {it.kind === 'textbutton' && col('hoverColor', '올렸을 때 글자 색')}
        </div>
      )}
      {canDrag(it.kind) && (
        <label className="check" title="게임에서 끌어 옮길 수 있어요. 놓는 곳에 놓으면 그 할 일을 하고, 놓은 뒤에는 제자리로 돌아가요">
          <input type="checkbox" checked={!!it.drag} onChange={(e) => upd((x) => void (e.target.checked ? (x.drag = true) : delete x.drag))} />
          끌 수 있음 <span className="tip">(놓으면 제자리로)</span>
        </label>
      )}
      <div className="row">
        <label>보이는 조건</label>
        <CondInput compact value={it.cond ?? ''} placeholder="비우면 늘 보여요 (예: has_key)" onChange={(v) => upd((x) => void (v.trim() ? (x.cond = v) : delete x.cond), 'scr-cond' + it.id)} />
      </div>
      <div className="row">
        <label>자리</label>
        {num('x', 'x')}
        {num('y', 'y')}
        <span className="tip">{hud ? 'HUD 왼쪽 위에서 (px)' : '왼쪽 위 (px)'}</span>
      </div>
      <div className="row">
        <button onClick={dup}>복제</button>
        <button className="danger" onClick={remove}>지우기</button>
      </div>
    </Card>
  );
}

function CodeCard({ sc }: { sc: ScreenDef }) {
  const project = useStore((s) => s.project);
  const code = screensCode({ ...project, screens: [sc] }).split('\n').slice(3).join('\n');
  return (
    <Card id="scr-code" title={`${SCREENS_FILE}에 들어가는 글`} defFolded>
      <pre className="scv-code">{code}</pre>
    </Card>
  );
}
