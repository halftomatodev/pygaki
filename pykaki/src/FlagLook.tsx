// 플래그 카드의 꼴 줄 (FEATURE 20): 꼴(끌어서 시험 값) + [꼴 ▾] 팝오버(꼴 고르기, 최솟값·최댓값, 고를 값, 부품 꾸미기) + "이 값일 때" 미리보기
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import type { Flag, FlagLook, FlagUi, LevelStyle } from './types';
import { FlagWidget } from './FlagWidget';
import { flagEffects, flagMarks, setMarkValue, flagUi, LOOK_LABEL, looksFor, skinParts, STYLE_LABEL, strOptions, testValue, testVars, uiMax, uiMin, useFlagTest } from './flagUi';
import { useGameFolder } from './gameFolder';
import type { Val } from './trace';

export function FlagLookRow({ f }: { f: Flag }) {
  const project = useStore((s) => s.project);
  const vals = useFlagTest((s) => s.vals);
  const btn = useRef<HTMLButtonElement>(null);
  const [pop, setPop] = useState(false);
  const ui = flagUi(f);
  const value = testValue(f, vals);
  const changed = f.id in vals && vals[f.id] !== f.init;
  const setTest = (v: Val) => useFlagTest.setState((s) => ({ vals: { ...s.vals, [f.id]: v } }));
  const reset = () =>
    useFlagTest.setState((s) => {
      const n = { ...s.vals };
      delete n[f.id];
      return { vals: n };
    });
  const tv = testVars(project, vals);
  const allFx = flagEffects(project, f, tv);
  // 조건 눈금: 번호는 기준 값 차례
  const raw = flagMarks(project, f, tv);
  const order = raw.map((_, i) => i).sort((a, b) => raw[a].value - raw[b].value);
  const marks = raw.map((m, i) => ({ ...m, n: order.indexOf(i) + 1 }));
  const update = useStore((s) => s.update);
  const moveMark = (i: number, v: number) => raw[i] && raw[i].value !== v && update((p) => setMarkValue(p, raw[i].ref, v), 'fmark' + f.id + i);
  const cur = order.find((i) => !marks[i].ok);
  // 눈금으로 보이는 조건은 아래 목록에서 뺌 (같은 상자의 같은 자리)
  const effects = allFx.filter((x) => x.at === 'act' || !raw.some((m) => m.ref.nodeId === x.nodeId && m.ref.at === x.at));
  const go = (id: string) => (useStore.getState().select([id]), useStore.getState().focusNodes([id]));
  const boxName = (id: string) => project.nodes.find((n) => n.id === id)?.title || id;

  return (
    <div className="flag-look">
      <div className="flag-look-row">
        <FlagWidget ui={ui} value={value} onChange={setTest} options={f.kind === 'str' ? strOptions(project, f) : undefined} label={f.name} marks={marks} onMark={moveMark} />
        <span className="sp" />
        {changed && (
          <button className="linklike" onClick={reset} title="시험 값을 처음 값으로 (시험 값은 저장되지 않아요)">처음 값으로</button>
        )}
        <button ref={btn} className={'flag-look-btn' + (pop ? ' on' : '')} onClick={() => setPop((v) => !v)} title="꼴 고르기, 최솟값·최댓값, 꾸미기">
          {LOOK_LABEL[ui.look]} ▾
        </button>
        {pop && btn.current && <LookPop f={f} anchor={btn.current} onClose={() => setPop(false)} />}
      </div>
      {marks.length > 0 && (
        <ol className="fw-steps" aria-label="조건 눈금">
          {order.map((i) => {
            const m = marks[i];
            return (
              <li key={i} className={(m.ok ? 'ok' : '') + (m.open ? ' open' : '')} aria-current={i === cur ? 'step' : undefined}>
                <span className="n">{m.ok ? '✓' : m.n}</span>
                <code>{f.name} {m.label}</code>
                <span className="fe-text0">{m.ref.at === 'choice' ? '◆ ' : '◇ '}{m.text}</span>
                <span className="st">{m.ref.at === 'choice' ? (m.open ? '열림' : m.open === false ? '잠김' : '?') : m.open ? '이 갈래' : ''}</span>
              </li>
            );
          })}
        </ol>
      )}
      {effects.length > 0 && (
        <ul className="flag-effects" aria-label="이 값일 때">
          {effects.map((x, i) => (
            <li key={i} className={'fe-' + x.at + (x.at !== 'act' ? (x.ok ? ' ok' : x.ok === false ? ' no' : '') : '')}>
              <button className="linklike fe-box" onClick={() => go(x.nodeId)} title="누르면 그 상자로">{boxName(x.nodeId)}</button>
              {x.at === 'choice' && (
                <>
                  <code>{x.expr}</code>
                  <span className="fe-res">{x.ok ? '보임' : x.ok === false ? '숨음' : '?'}</span>
                  <span className="fe-text">◆ {x.text || '(빈 선택지)'}</span>
                </>
              )}
              {x.at === 'branch' && (
                <>
                  <code>if {x.expr}</code>
                  <span className="fe-res">{x.ok ? '이 갈래' : x.ok === false ? '안 감' : '?'}</span>
                  {x.say && <span className="fe-text">{x.say}</span>}
                </>
              )}
              {x.at === 'act' && (
                <>
                  <span className="fe-where">{x.where}</span>
                  <code>{x.expr}</code>
                  <span className="fe-res">→ {x.after}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 꼴 팝오버 (Popover): 꼴, 레벨 모양, 최솟값·최댓값, 고를 값(글자), 부품마다 색·그림
function LookPop({ f, anchor, onClose }: { f: Flag; anchor: HTMLElement; onClose: () => void }) {
  const update = useStore((s) => s.update);
  const project = useStore((s) => s.project);
  const images = useGameFolder((s) => s.media.images);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [opt, setOpt] = useState('');
  const ui = flagUi(f);
  const key = 'flook' + f.id;
  // 고치면 저장된 꼴이 없던 플래그도 지금 보이는 꼴로 시작
  const set = (fn: (u: FlagUi) => void, k?: string) =>
    update((p) => {
      const x = p.variables.find((v) => v.id === f.id)!;
      const u: FlagUi = structuredClone(flagUi(x));
      fn(u);
      x.ui = u;
    }, k);

  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect();
    const w = box.current?.offsetWidth ?? 320;
    const h = box.current?.offsetHeight ?? 300;
    const left = Math.max(8, Math.min(a.right - w, window.innerWidth - w - 8));
    const top = a.bottom + 6 + h <= window.innerHeight - 8 ? a.bottom + 6 : Math.max(8, a.top - 6 - h);
    setPos((o) => (o && Math.abs(o.left - left) < 1 && Math.abs(o.top - top) < 1 ? o : { left, top }));
  });
  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
      anchor.focus();
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', esc, true);
    return () => (window.removeEventListener('mousedown', down, true), window.removeEventListener('keydown', esc, true));
  });

  const looks = looksFor(f.kind);
  const opts = ui.options ?? [];
  const found = f.kind === 'str' ? strOptions(project, f).filter((o) => !opts.includes(o) && o !== '') : [];
  const addOpt = (o: string) => {
    const t = o.trim();
    if (!t || opts.includes(t)) return;
    set((u) => void (u.options = [...(u.options ?? []), t]));
  };

  return createPortal(
    <div ref={box} className="fd-pop flook-pop" style={pos ?? { opacity: 0 }} role="dialog" aria-label={`${f.name} 꼴`}>
      <div className="fd-pop-head">
        <b>{f.name}</b>
        <span className="sp" />
        <span className="tip">꼴은 플래그 카드와 견본에서 보이는 모양이에요</span>
      </div>
      {looks.length > 1 && (
        <div className="flook-seg" role="radiogroup" aria-label="꼴">
          {looks.map((l) => (
            <button key={l} role="radio" aria-checked={ui.look === l} className={ui.look === l ? 'on' : ''} onClick={() => set((u) => void (u.look = l as FlagLook))}>
              {LOOK_LABEL[l]}
            </button>
          ))}
        </div>
      )}
      {ui.look === 'level' && (
        <div className="flook-seg" role="radiogroup" aria-label="레벨 모양">
          {(Object.keys(STYLE_LABEL) as LevelStyle[]).map((s) => (
            <button key={s} role="radio" aria-checked={(ui.style ?? 'continuous') === s} className={(ui.style ?? 'continuous') === s ? 'on' : ''} onClick={() => set((u) => void (u.style = s))}>
              {STYLE_LABEL[s]}
            </button>
          ))}
        </div>
      )}
      {f.kind === 'int' && (
        <div className="flook-row">
          <label>
            최솟값 <input type="number" value={uiMin(ui)} onChange={(e) => set((u) => void (u.min = Math.round(Number(e.target.value) || 0)), key + 'min')} />
          </label>
          <label>
            최댓값 <input type="number" value={uiMax(ui)} onChange={(e) => set((u) => void (u.max = Math.round(Number(e.target.value) || 0)), key + 'max')} />
          </label>
          {ui.look === 'level' && ui.style === 'rating' && uiMax(ui) - uiMin(ui) > 10 && <span className="tip">별은 10개까지 (한 별이 여러 값)</span>}
        </div>
      )}
      {f.kind === 'str' && (
        <div className="flook-opts">
          <span className="flook-sub">고를 값</span>
          <span className="flook-chips">
            {opts.map((o) => (
              <span key={o} className="chip">
                {o}
                <button className="x" aria-label={`${o} 빼기`} onClick={() => set((u) => void (u.options = (u.options ?? []).filter((x) => x !== o)))}>✕</button>
              </span>
            ))}
            {found.map((o) => (
              <button key={o} className="chip add" title="대본에서 찾은 글이에요. 누르면 목록에 넣어요" onClick={() => addOpt(o)}>+ {o}</button>
            ))}
          </span>
          <input value={opt} placeholder="값 더하기 (Enter)" onChange={(e) => setOpt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && (addOpt(opt), setOpt(''))} />
        </div>
      )}
      <div className="flook-skin">
        <span className="flook-sub">꾸미기</span>
        {skinParts(ui).map(([part, label, def]) => {
          const s = ui.skin?.[part] ?? {};
          const color = s.color || def;
          const putPart = (fn: (x: { color?: string; image?: string }) => void, k?: string) =>
            set((u) => {
              const skin = (u.skin ??= {});
              const x = (skin[part] ??= {});
              fn(x);
              if (!x.color) delete x.color;
              if (!x.image) delete x.image;
              if (!x.color && !x.image) delete skin[part];
              if (!Object.keys(skin).length) delete u.skin;
            }, k);
          return (
            <div key={part} className="flook-part">
              <span className="flook-plabel">{label}</span>
              <input type="color" aria-label={`${label} 색`} value={color.slice(0, 7)} onChange={(e) => putPart((x) => void (x.color = e.target.value + color.slice(7)), key + part + 'c')} />
              <input className="flook-hex" aria-label={`${label} 색 (#rrggbbaa)`} value={color} spellCheck={false} onChange={(e) => /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(e.target.value) && putPart((x) => void (x.color = e.target.value), key + part + 'h')} />
              <input className="flook-img" aria-label={`${label} 그림`} value={s.image ?? ''} placeholder="그림 (게임 폴더)" list="flook-images" spellCheck={false} onChange={(e) => putPart((x) => void (x.image = e.target.value.trim()), key + part + 'i')} />
              {(s.color || s.image) && <button className="x" title="기본으로" onClick={() => putPart((x) => void (delete x.color, delete x.image))}>↺</button>}
            </div>
          );
        })}
        <datalist id="flook-images">
          {images.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <span className="tip">그림을 넣으면 그 부품을 그림으로 그려요(늘여 맞춤). 그림은 연결한 게임 폴더에서 찾아요</span>
      </div>
    </div>,
    document.body,
  );
}
