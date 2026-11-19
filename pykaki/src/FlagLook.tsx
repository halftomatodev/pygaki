// 플래그 카드의 꼴 줄 (FEATURE 20): 꼴(끌어서 시험 값) + [꼴 ▾] 팝오버(꼴 고르기, 최솟값·최댓값, 고를 값, 부품 꾸미기) + "이 값일 때" 미리보기
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import type { Character, Flag, FlagLook, FlagUi, LevelStyle } from './types';
import { FlagWidget } from './FlagWidget';
import { CORNER_LABEL, cornerOf, flagEffects, flagMarks, setMarkValue, flagUi, inputLen, LOOK_LABEL, looksFor, skinParts, STYLE_LABEL, strOptions, testValue, testVars, uiMax, uiMin, useFlagTest } from './flagUi';
import { useGameFolder } from './gameFolder';
import { desktop } from './desktop';
import { pickMediaFile } from './MediaField';
import { openMaskDialog } from './MaskVideoDialog';
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
        <FlagWidget ui={ui} value={value} onChange={setTest} options={f.kind === 'str' ? strOptions(project, f) : undefined} label={f.name} marks={marks} onMark={moveMark} len={inputLen(f)} />
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
export function LookPop({ f, anchor, onClose }: { f: Flag; anchor: HTMLElement; onClose: () => void }) {
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
        <span className="tip">꼴은 플래그 카드, 견본, HUD에서 같이 쓰는 모양이에요</span>
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
      {!(ui.look === 'level' && ui.style === 'rating') && (
        <div className="flook-seg" role="radiogroup" aria-label="모서리" title="게임 화면(HUD)의 꼴도 같은 모서리로 그려요. 그림을 넣은 부품은 그림 그대로예요">
          {(Object.keys(CORNER_LABEL) as (keyof typeof CORNER_LABEL)[]).map((c) => (
            <button key={c} role="radio" aria-checked={cornerOf(ui) === c} className={cornerOf(ui) === c ? 'on' : ''} onClick={() => set((u) => void (c === 'round' ? delete u.corner : (u.corner = c)))}>
              {CORNER_LABEL[c]}
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
        </div>
      )}
      {ui.look === 'level' && <LevelKnobs ui={ui} set={set} k={key} />}
      {ui.look === 'input' && <InputKnobs f={f} ui={ui} set={set} k={key} />}
      {f.kind === 'str' && ui.look !== 'input' && (
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
        {skinParts(ui).map(([part, label, def, hint]) => {
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
              <span className="flook-plabel" title={hint}>{label}{hint && <i className="flook-hint" aria-hidden>ⓘ</i>}</span>
              {def ? (
                <>
                  <input type="color" aria-label={`${label} 색`} value={color.slice(0, 7)} onChange={(e) => putPart((x) => void (x.color = e.target.value + color.slice(7)), key + part + 'c')} />
                  <input className="flook-hex" aria-label={`${label} 색 (#rrggbbaa)`} value={color} spellCheck={false} onChange={(e) => /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(e.target.value) && putPart((x) => void (x.color = e.target.value), key + part + 'h')} />
                </>
              ) : (
                <span className="flook-noc">그림만</span>
              )}
              <input className="flook-img" aria-label={`${label} 그림`} value={s.image ?? ''} placeholder="그림·영상 (게임 폴더)" list="flook-images" spellCheck={false} onChange={(e) => putPart((x) => void (x.image = e.target.value.trim()), key + part + 'i')} />
              {desktop?.pickFile && (
                <button className="x" title="탐색기에서 그림·영상(PNG, JPG, WebP, WebM 등)을 골라요. 게임 폴더 밖이면 game/images·movies로 복사해요" onClick={() => void pickMediaFile().then((rel) => rel && putPart((x) => void (x.image = rel)))}>📂</button>
              )}
              {desktop?.pickMaskSource && (
                <button className="x" title="GIF·투명 webm·PNG 연속 그림을 렌파이가 쓰는 투명 영상으로 바꿔 넣어요 (렌파이는 GIF를 움직이지 못해요)" onClick={() => openMaskDialog((rel) => putPart((x) => void (x.image = rel)))}>🎞</button>
              )}
              {(s.color || s.image) && <button className="x" title="기본으로" onClick={() => putPart((x) => void (delete x.color, delete x.image))}>↺</button>}
            </div>
          );
        })}
        <datalist id="flook-images">
          {images.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <span className="tip">그림·영상을 넣으면 그 부품을 그것으로 그려요(늘여 맞춤). 영상은 반복·소리 없이 돌고, GIF는 🎞로 투명 영상으로 바꿔 넣어요. "그림만" 부품은 비우면 안 그려요</span>
      </div>
    </div>,
    document.body,
  );
}

// 레벨 인디케이터 세부 (FEATURE 29): 경고·위험 임계와 방향, 막대의 프레임 9-slice·여백·채움 방식·끝 장식 높이, 칸형의 칸 수·간격
function LevelKnobs({ ui, set, k }: { ui: FlagUi; set: (fn: (u: FlagUi) => void, k?: string) => void; k: string }) {
  const num = (field: 'warn' | 'crit' | 'slice' | 'pad' | 'tip' | 'cells' | 'gap', label: string, title: string, min = 0) => (
    <label title={title}>
      {label}{' '}
      <input type="number" min={min} value={ui[field] ?? ''} placeholder="-" onChange={(e) => set((u) => void (e.target.value.trim() === '' ? delete u[field] : (u[field] = Math.max(min, Math.round(Number(e.target.value) || 0)))), k + field)} />
    </label>
  );
  const bar = ui.style !== 'rating';
  return (
    <>
      <div className="flook-row">
        {num('warn', '경고', '이 값에 닿으면 경고 채움으로 그려요. 비우면 경고 없음', -9999)}
        {num('crit', '위험', '이 값에 닿으면 위험 채움으로 그려요. 비우면 위험 없음', -9999)}
        <select aria-label="위험 방향" value={ui.dir ?? 'low'} onChange={(e) => set((u) => void (e.target.value === 'high' ? (u.dir = 'high') : delete u.dir))}>
          <option value="low">낮을수록 위험 (HP)</option>
          <option value="high">높을수록 위험 (과열)</option>
        </select>
      </div>
      {bar ? (
        <div className="flook-row">
          {num('slice', '9-slice', '프레임 그림의 모서리 크기(px). 정하면 늘여도 모서리가 그대로예요. 비우면 그림을 통째로 늘여요')}
          {num('pad', '여백', '프레임 안쪽 여백(px). 비우면 1 (칸 막대는 2)')}
          {ui.style !== 'discrete' && (
            <>
              <select aria-label="채움 방식" title="채움 그림을 어떻게 보일지" value={ui.fit ?? 'clip'} onChange={(e) => set((u) => void (e.target.value === 'clip' ? delete u.fit : (u.fit = e.target.value as 'stretch' | 'tile')))}>
                <option value="clip">자르기 (원본 폭)</option>
                <option value="stretch">늘이기</option>
                <option value="tile">타일 반복</option>
              </select>
              {num('tip', '끝 높이', '끝 장식 높이(px). 비우면 막대 높이')}
            </>
          )}
        </div>
      ) : (
        <div className="flook-row">
          {num('cells', '칸 수', '비우면 최솟값~최댓값만큼(20칸까지). 한 칸이 여러 값이면 칸 안쪽을 잘라 반 칸도 보여요', 1)}
          {num('gap', '간격', '칸 사이 간격(px). 비우면 2')}
        </div>
      )}
    </>
  );
}

// 입력칸 세부 (FEATURE 31): 글자는 최대 글자 수와 이 값을 이름으로 쓰는 캐릭터. 어디서 치게 할지 안내
function InputKnobs({ f, ui, set, k }: { f: Flag; ui: FlagUi; set: (fn: (u: FlagUi) => void, k?: string) => void; k: string }) {
  const chars = useStore((s) => s.project.characters);
  const update = useStore((s) => s.update);
  const tag = `[${f.name}]`;
  const named = chars.filter((c) => c.name === tag);
  const others = chars.filter((c) => c.name !== tag);
  // 이을 때 원래 이름을 적어 두고, 빼면 그 이름으로 돌림. 적어 둔 이름이 없으면(세션 87 전 파일) 플래그의 처음 값, 그것도 없으면 변수 이름
  const backName = (c: Character) => c.nameBefore?.trim() || String(f.init ?? '').trim() || c.id;
  const setName = (id: string, on: boolean) =>
    update((p) => {
      const c = p.characters.find((x) => x.id === id);
      if (!c) return;
      if (on) {
        if (c.name !== tag) c.nameBefore = c.name;
        c.name = tag;
      } else {
        c.name = backName(c);
        delete c.nameBefore;
      }
    });
  return (
    <>
      {f.kind === 'str' && (
        <div className="flook-row">
          <label title="플레이어가 칠 수 있는 최대 글자 수. 비우면 렌파이 기본">
            최대 글자 수 <input type="number" min={1} max={99} value={ui.len ?? ''} placeholder="-" onChange={(e) => set((u) => void (e.target.value.trim() === '' ? delete u.len : (u.len = Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 1))))), k + 'len')} />
          </label>
        </div>
      )}
      {f.kind === 'str' && chars.length > 0 && (
        <div className="flook-opts">
          <span className="flook-sub" title="캐릭터 표시 이름을 이 플래그 값으로 해요. 플레이어가 친 이름이 대사 이름 칸에 보여요">이름으로 쓰는 캐릭터</span>
          <span className="flook-chips">
            {named.map((c) => (
              <span key={c.id} className="chip">
                {c.id}
                <button className="x" aria-label={`${c.id} 빼기`} title={`표시 이름을 "${backName(c)}"로 돌려요`} onClick={() => setName(c.id, false)}>✕</button>
              </span>
            ))}
            {others.length > 0 && (
              <select value="" aria-label="이름으로 쓰는 캐릭터 더하기" onChange={(e) => e.target.value && setName(e.target.value, true)}>
                <option value="">+ 캐릭터</option>
                {others.map((c) => <option key={c.id} value={c.id}>{c.id}{c.name ? ` (${c.name})` : ''}</option>)}
              </select>
            )}
          </span>
        </div>
      )}
      <span className="tip">
        {f.kind === 'int' ? `숫자만 칠 수 있고 ${uiMin(ui)}~${uiMax(ui)} 안으로 맞춰요. 잘못 치면 값이 그대로예요. ` : `비워 두고 끝내면 처음 값 "${String(f.init ?? '')}"이 돼요. 대사에서는 ${tag}로 보여요. `}
        대본에서는 상자 편집의 [+ 플래그 입력] 줄, 게임 화면에서는 [화면] 탭 HUD에 이 꼴을 놓고 [게임에서 바꿀 수 있음]을 켜요
      </span>
    </>
  );
}
