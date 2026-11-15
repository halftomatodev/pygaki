// 위쪽 [화면] 탭 (FEATURE 17): 배경·그림 버튼·글 버튼·글·그림을 끌어 놓아 렌파이 screen을 만든다.
// 버튼마다 누르면 돌려줄 값(_return)을 정하고, 대본의 흐름 "화면 부르기"가 그 값마다 갈래를 낸다. 원고는 game/pykaki_screens.rpy
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Card } from './Card';
import { Hint } from './Help';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { pictureOf, useGameFolder } from './gameFolder';
import type { Project, ScreenDef, ScreenItem, ScreenItemKind } from './types';
import { uid } from './util';
import { newScreenName, screenNameProblem, SCREENS_FILE, screensCode } from './screens';

export const useScreenSel = create<{ id: string | null; item: string | null }>(() => ({ id: null, item: null }));

const KIND: Record<ScreenItemKind, string> = { imagebutton: '그림 버튼', textbutton: '글 버튼', text: '글', image: '그림' };
const isBtn = (k: ScreenItemKind) => k === 'imagebutton' || k === 'textbutton';

// 화면을 부르는 상자들
const usesOf = (p: Project, id: string) => p.nodes.filter((n) => n.exit.type === 'screen' && n.exit.screen === id);

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
  const look = useGameFolder((s) => s.look);
  const addItem = (kind: ScreenItemKind) => {
    if (!sc) return;
    const id = uid('i');
    const n = sc.items.length;
    // 새 것은 왼쪽 위부터 아래로 차례로 (겹치지 않게)
    const it: ScreenItem = { id, kind, x: Math.round(look.width * 0.1) + Math.floor(n / 6) * 300, y: Math.round(look.height * 0.15) + (n % 6) * Math.round(look.height * 0.12) };
    if (kind === 'textbutton') Object.assign(it, { text: '버튼 ' + (n + 1), value: 'b' + (n + 1) });
    if (kind === 'imagebutton') Object.assign(it, { image: '', value: 'b' + (n + 1) });
    if (kind === 'text') it.text = '글';
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
        {screens.map((s) => (
          <button key={s.id} className={'scv-item' + (s.id === sc?.id ? ' on' : '')} onClick={() => useScreenSel.setState({ id: s.id, item: null })}>
            <span>{s.title || s.name}</span>
            <code>{s.name}</code>
            <span className="tip">{s.items.length}개 · 부르는 상자 {usesOf(project, s.id).length}</span>
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
              <span className="tip">끌어서 옮겨요 · 방향키로 1px (Shift: 10px)</span>
            </div>
            <Stage sc={sc} sel={item?.id ?? null} onMove={(id, x, y) => updItem(id, (it) => ((it.x = x), (it.y = y)), 'scr-move' + id)} />
          </>
        ) : (
          <p className="tip scv-empty">왼쪽 [+ 새 화면]으로 시작해요.</p>
        )}
      </div>
      <div className="scv-side">
        {sc && <ScreenCard sc={sc} updScreen={updScreen} />}
        {sc && item && <ItemCard it={item} upd={(fn, key) => updItem(item.id, fn, key)} remove={() => (updScreen((s) => void (s.items = s.items.filter((x) => x.id !== item.id))), useScreenSel.setState({ item: null }))} dup={() => {
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
function Stage({ sc, sel, onMove }: { sc: ScreenDef; sel: string | null; onMove: (id: string, x: number, y: number) => void }) {
  const look = useGameFolder((s) => s.look);
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

  const bgColor = sc.bg?.startsWith('#') ? sc.bg : undefined;
  const bgPic = usePic(sc.bg && !sc.bg.startsWith('#') ? sc.bg : '');

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

  return (
    <div className="scv-stage-wrap" ref={wrap}>
      <div
        className="scv-stage"
        style={{ width: look.width * scale, height: look.height * scale, background: bgColor ?? undefined }}
        onPointerDown={(e) => e.target === e.currentTarget && useScreenSel.setState({ item: null })}
      >
        {bgPic && <img className="scv-bg" src={bgPic} alt="" style={{ transform: `scale(${scale})` }} draggable={false} />}
        {!sc.bg && <span className="scv-see tip">배경 없음: 게임에서는 아래 화면이 그대로 보여요</span>}
        {sc.items.map((it) => (
          <StageItem key={it.id} it={it} scale={scale} on={it.id === sel} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

function usePic(name: string) {
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

function StageItem({ it, scale, on, onMove }: { it: ScreenItem; scale: number; on: boolean; onMove: (id: string, x: number, y: number) => void }) {
  const look = useGameFolder((s) => s.look);
  const pic = usePic(it.kind === 'imagebutton' || it.kind === 'image' ? it.image ?? '' : '');
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
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
  let body;
  if (it.kind === 'imagebutton' || it.kind === 'image')
    body = pic ? <img src={pic} alt="" draggable={false} style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }} onLoad={(e) => {
      const im = e.currentTarget;
      im.parentElement!.style.width = im.naturalWidth * scale + 'px';
      im.parentElement!.style.height = im.naturalHeight * scale + 'px';
    }} /> : <span className="scv-noimg">{it.image?.trim() || '그림 이름 없음'}</span>;
  else body = <span style={{ fontSize: size, color: it.color ?? (it.kind === 'textbutton' ? '#aaaaaa' : look.textColor) }}>{it.text || ' '}</span>;
  return (
    <div className={'scv-el k-' + it.kind + (on ? ' on' : '')} style={{ left: it.x * scale, top: it.y * scale }} onPointerDown={down} title={isBtn(it.kind) ? `${KIND[it.kind]} · 값 ${it.value ?? ''}` : KIND[it.kind]}>
      {body}
      {isBtn(it.kind) && <span className="scv-val">{it.value || '값 없음'}</span>}
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
  return (
    <Card id="scr-screen" title="화면" hint="이름은 렌파이 screen 이름이에요 (영문). 원고에는 call screen 이름" topic="화면 만들기">
      <input className="title" value={sc.title} placeholder="화면 제목 (예: 방 고르기)" onChange={(e) => updScreen((s) => void (s.title = e.target.value), 'scr-title' + sc.id)} />
      <div className="row">
        <label>이름</label>
        <input className={'grow' + (prob ? ' invalid' : '')} value={sc.name} onChange={(e) => updScreen((s) => void (s.name = e.target.value.trim()), 'scr-name' + sc.id)} />
      </div>
      {prob && <p className="tip warn-text">{prob}</p>}
      <div className="row">
        <label>배경</label>
        <select value={!sc.bg ? '' : color ? 'color' : 'image'} onChange={(e) => updScreen((s) => {
          if (e.target.value === '') delete s.bg;
          else if (e.target.value === 'color') s.bg = '#202028';
          else s.bg = images.find((n) => n.startsWith('bg ')) ?? 'bg ';
        })}>
          <option value="">없음 (아래 화면이 보임)</option>
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
      <ImageList />
      <div className="tip">
        부르는 상자:{' '}
        {uses.length
          ? uses.map((n) => (
              <button key={n.id} className="linklike" onClick={() => (useLive.setState({ view: 'script' }), useStore.getState().select([n.id]), useStore.getState().focusNodes([n.id]))}>
                {n.title || n.id}
              </button>
            ))
          : '없음 (상자의 다음 흐름에서 [▣ 화면 부르기])'}
      </div>
      <div className="row">
        <button
          className="danger"
          onClick={() =>
            confirm(`화면 "${sc.title || sc.name}"을 지울까요?${uses.length ? `\n부르는 상자 ${uses.length}개는 "화면 없음"이 돼요.` : ''}`) &&
            (update((p) => {
              p.screens = p.screens?.filter((x) => x.id !== sc.id);
              for (const n of p.nodes) if (n.exit.type === 'screen' && n.exit.screen === sc.id) n.exit.screen = null;
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

function ItemCard({ it, upd, remove, dup }: { it: ScreenItem; upd: (fn: (it: ScreenItem) => void, key?: string) => void; remove: () => void; dup: () => void }) {
  const num = (k: 'x' | 'y' | 'size', ph: string) => (
    <input
      type="number"
      className="sf-num"
      placeholder={ph}
      value={it[k] ?? ''}
      onChange={(e) =>
        upd((x) => {
          const n = Math.round(Number(e.target.value));
          if (k === 'size') {
            if (e.target.value === '' || !(n > 0)) delete x.size;
            else x.size = Math.min(n, 300);
          } else x[k] = Number.isFinite(n) ? n : 0;
        }, 'scr-' + k + it.id)
      }
    />
  );
  const col = (k: 'color' | 'hoverColor', title: string) => (
    <span className="sf-color" title={title}>
      <input type="color" value={it[k] ?? '#ffffff'} onChange={(e) => upd((x) => void (x[k] = e.target.value), 'scr-' + k + it.id)} />
      {it[k] && <button onClick={() => upd((x) => void delete x[k])}>✕</button>}
    </span>
  );
  return (
    <Card id="scr-item" title={KIND[it.kind]} hint={isBtn(it.kind) ? '누르면 화면이 닫히고 "돌려줄 값"이 대본으로 가요. 같은 값의 버튼은 같은 갈래로 가요' : undefined} topic="화면 만들기">
      {(it.kind === 'textbutton' || it.kind === 'text') && (
        <div className="row">
          <label>글</label>
          <input className="grow" value={it.text ?? ''} onChange={(e) => upd((x) => void (x.text = e.target.value), 'scr-text' + it.id)} />
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
      {isBtn(it.kind) && (
        <div className="row">
          <label>돌려줄 값</label>
          <input className={'grow' + (it.value?.trim() ? '' : ' invalid')} value={it.value ?? ''} placeholder="예: door" onChange={(e) => upd((x) => void (x.value = e.target.value), 'scr-val' + it.id)} />
        </div>
      )}
      {(it.kind === 'textbutton' || it.kind === 'text') && (
        <div className="row">
          <label>글자</label>
          {num('size', '크기')}
          {col('color', '글자 색')}
          {it.kind === 'textbutton' && col('hoverColor', '올렸을 때 글자 색')}
        </div>
      )}
      <div className="row">
        <label>자리</label>
        {num('x', 'x')}
        {num('y', 'y')}
        <span className="tip">왼쪽 위 (px)</span>
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
