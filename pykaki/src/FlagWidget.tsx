// 플래그의 꼴 (FEATURE 20, 29): 레벨 인디케이터(이어진 막대, 칸 막대, 칸형), 스위치, 체크박스, 라디오, 풀다운.
// 플래그 카드에서는 끌거나 눌러 시험 값을 바꾸고, 용례 메뉴의 견본에서는 저절로 움직인다. 부품마다 색이나 그림·영상(게임 폴더)으로 꾸민다.
// 막대 짜임 (FEATURE 29, HUD 요소 데모): 프레임(9-slice) 안쪽 여백에 트랙 → 채움(정상·경고·위험, 자르기·늘이기·타일) → 끝 장식 → 광택
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPE, type ReactNode } from 'react';
import type { FlagUi } from './types';
import { cornerOf, levelState, partColor, SHIFT_CSS, statePart, uiMax, uiMin } from './flagUi';
import { useMediaPic } from './ScreensView';
import type { Val } from './trace';

const PARTS = ['fill', 'fillWarn', 'fillCrit', 'track', 'border', 'tip', 'gloss', 'on', 'onWarn', 'onCrit', 'off', 'thumb', 'thumbOn', 'box', 'text', 'mark', 'ring', 'dot'] as const;
type Pic = { url: string; video: boolean } | null;

// 부품마다 그림·영상 (훅 수가 늘 같게 부품 이름을 다 부름)
function useSkin(ui: FlagUi) {
  const pics: Record<string, Pic> = {};
  for (const p of PARTS) pics[p] = useMediaPic(ui.skin?.[p]?.image ?? ''); // eslint-disable-line react-hooks/rules-of-hooks
  const paint = (part: string): CSSProperties => (pics[part] && !pics[part]!.video ? { backgroundImage: `url("${pics[part]!.url}")`, backgroundSize: '100% 100%', backgroundColor: 'transparent' } : { background: partColor(ui, part) });
  return { pics, paint, color: (part: string) => partColor(ui, part) };
}

// 그림이나 영상 하나 (늘여 맞춤). 영상은 반복·소리 없이
function Media({ p, className, style }: { p: NonNullable<Pic>; className?: string; style?: CSSProperties }) {
  return p.video ? <video className={className} style={style} src={p.url} autoPlay loop muted playsInline /> : <img className={className} style={style} src={p.url} alt="" draggable={false} />;
}
// 칸을 덮는 부품 한 겹: 그림·영상이면 그것, 아니면 색 (color가 false면 안 그림)
function Layer({ p, color, className = '', style, children }: { p: Pic; color: string | false; className?: string; style?: CSSProperties; children?: ReactNode }) {
  if (!p && color === false) return null;
  return (
    <span className={'fw-ly ' + className} style={{ ...(!p && color ? { background: color } : null), ...style }}>
      {p && <Media p={p} />}
      {children}
    </span>
  );
}

interface Props {
  ui: FlagUi;
  value: Val;
  onChange?: (v: Val) => void; // 없으면 보기만
  options?: string[]; // 라디오·풀다운의 고를 값
  label?: string; // 읽어 주는 이름 (플래그 이름)
  marks?: { value: number; label: string; ok: boolean; n?: number }[]; // 숫자 꼴 위의 조건 눈금 (2단계, Steps 꼴)
  onMark?: (i: number, v: number) => void; // 눈금을 끌면 그 조건의 기준 값
  len?: number; // 입력칸: 최대 글자 수
  height?: number; // 숫자 꼴 막대 높이 (px). 화면 탭 무대는 항목 높이, 없으면 카드용 작은 높이
}

export function FlagWidget(props: Props) {
  const { ui } = props;
  if (ui.look === 'switch') return <SwitchLook {...props} />;
  if (ui.look === 'checkbox') return <CheckLook {...props} />;
  if (ui.look === 'radio') return <RadioLook {...props} />;
  if (ui.look === 'pulldown') return <TextLook {...props} />;
  if (ui.look === 'input') return <InputLook {...props} />;
  return <NumberLook {...props} />;
}

const cellCount = (ui: FlagUi, steps: number) => Math.max(1, Math.min(Number.isFinite(ui.cells) && ui.cells! > 0 ? Math.round(ui.cells!) : steps, 20));

function NumberLook({ ui, value, onChange, label, marks, onMark, height }: Props) {
  const { pics, color } = useSkin(ui);
  const ref = useRef<HTMLDivElement>(null);
  const lo = uiMin(ui), hi = uiMax(ui);
  const n = typeof value === 'number' && Number.isFinite(value) ? value : lo;
  const v = Math.min(hi, Math.max(lo, n));
  const frac = (v - lo) / (hi - lo);
  const steps = hi - lo;
  const set = (x: number) => onChange?.(Math.round(Math.min(hi, Math.max(lo, x))));
  const st = levelState(ui, v);
  const cells = ui.style === 'rating';

  // 끌기: 누른 자리와 끄는 자리로 값. 칸형은 칸마다 그 칸까지 찬 값
  const at = (e: { clientX: number }) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
    if (!cells) return lo + t * steps;
    const c = cellCount(ui, steps);
    return lo + Math.ceil((Math.ceil(t * c) * steps) / c);
  };
  const down = (e: RPE<HTMLDivElement>) => {
    if (!onChange || e.button !== 0) return;
    e.preventDefault();
    ref.current!.focus();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    set(at(e));
    const mv = (ev: PointerEvent) => set(at(ev));
    const up = () => (el.removeEventListener('pointermove', mv), el.removeEventListener('pointerup', up));
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
  };
  const key = (e: KeyboardEvent) => {
    if (!onChange) return;
    const k = e.key;
    const d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : k === 'PageUp' ? Math.max(1, Math.round(steps / 10)) : k === 'PageDown' ? -Math.max(1, Math.round(steps / 10)) : 0;
    if (d) set(v + d);
    else if (k === 'Home') set(lo);
    else if (k === 'End') set(hi);
    else return;
    e.preventDefault();
  };
  const aria = { role: 'slider', tabIndex: onChange ? 0 : -1, 'aria-label': label, 'aria-valuemin': lo, 'aria-valuemax': hi, 'aria-valuenow': v, 'aria-readonly': !onChange || undefined };

  // 지금 단계의 채움 (제 것이 없으면 정상 채움 그림의 색조만 바꿈)
  const fillOf = (base: 'fill' | 'on') => {
    const sp = statePart(ui, base, st);
    return { p: pics[sp.part], color: color(sp.part), filter: sp.shift ? SHIFT_CSS[sp.shift] : undefined };
  };

  let body;
  if (cells) {
    // 칸형: 칸마다 빈칸 위에 채움을 그 칸 몫만큼 잘라 덮음 (한 칸이 여러 값이면 반 칸도)
    const count = cellCount(ui, steps);
    const per = steps / count;
    const fl = fillOf('on');
    const h = height ?? 18;
    body = (
      <div className="fw-cells" style={{ gap: ui.gap ?? 2, height: h }}>
        {Array.from({ length: count }, (_, i) => {
          const f = Math.min(1, Math.max(0, (v - lo) / per - i));
          const sym = (c: string) => <span className="fw-sym" style={{ color: c, fontSize: h }}>★</span>;
          return (
            <span key={i} className="fw-cell" style={{ width: h }}>
              {pics.off ? <Layer p={pics.off} color={false} /> : sym(color('off'))}
              <span className="fw-ly fw-cut" style={{ clipPath: `inset(0 ${(1 - f) * 100}% 0 0)`, filter: fl.filter }}>
                {fl.p ? <Media p={fl.p} /> : sym(fl.color)}
              </span>
            </span>
          );
        })}
      </div>
    );
  } else {
    const discrete = ui.style === 'discrete';
    const pad = Math.max(0, ui.pad ?? (discrete ? 2 : 1));
    const h = height ?? (pics.border ? 16 : 12);
    const fl = fillOf('fill');
    const bp = pics.border;
    // 프레임: 9-slice면 border-image (그림만), 아니면 늘인 그림·영상이나 색
    const frame = bp && !bp.video && ui.slice ? (
      <span className="fw-ly" style={{ borderStyle: 'solid', borderWidth: ui.slice, borderColor: 'transparent', borderImage: `url("${bp.url}") ${ui.slice} fill / ${ui.slice}px stretch`, boxSizing: 'border-box' }} />
    ) : (
      <Layer p={bp} color={color('border')} />
    );
    let fill;
    if (discrete) {
      const count = Math.min(steps, 20);
      fill = (
        <span className="fw-segs">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="fw-seg">
              <Layer p={pics.track} color={color('track')} />
              {(i + 1) / count <= frac + 1e-9 && <Layer p={fl.p} color={fl.color} style={{ filter: fl.filter }} />}
            </span>
          ))}
        </span>
      );
    } else {
      const tile = ui.fit === 'tile' && fl.p && !fl.p.video;
      const cut: CSSProperties = { clipPath: `inset(0 ${(1 - frac) * 100}% 0 0)`, filter: fl.filter };
      fill = (
        <>
          <Layer p={pics.track} color={color('track')} />
          {ui.fit === 'stretch' ? (
            <span className="fw-ly fw-grow" style={{ width: frac * 100 + '%', filter: fl.filter }}>
              <Layer p={fl.p} color={fl.color} />
            </span>
          ) : tile ? (
            <span className="fw-ly fw-cut" style={{ ...cut, backgroundImage: `url("${fl.p!.url}")`, backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%' }} />
          ) : (
            <Layer p={fl.p} color={fl.color} className="fw-cut" style={cut} />
          )}
          {pics.tip && (
            <span className="fw-tip" style={{ left: frac * 100 + '%', height: ui.tip ?? h }}>
              <Media p={pics.tip} />
            </span>
          )}
          {pics.gloss && <Layer p={pics.gloss} color={false} />}
        </>
      );
    }
    body = (
      <div className={'fw-level' + (discrete ? ' discrete' : '')} style={{ height: h }}>
        {frame}
        <span className="fw-in" style={{ inset: pad }}>
          {fill}
        </span>
      </div>
    );
  }
  return (
    <div className={'fw-num c-' + cornerOf(ui) + (onChange ? ' live' : '') + (marks?.length ? ' marked' : '')}>
      <div ref={ref} className="fw-area" {...aria} onPointerDown={down} onKeyDown={key}>
        {body}
        {marks?.map((m, i) => (
          <span
            key={i}
            className={'fw-mark' + (m.ok ? ' ok' : '') + (onMark ? ' grab' : '')}
            style={{ left: ((Math.min(hi, Math.max(lo, m.value)) - lo) / (hi - lo)) * 100 + '%' }}
            title={m.label + (onMark ? ' · 끌면 기준 값이 바뀌어요' : '')}
            onPointerDown={(e) => {
              if (!onMark || e.button !== 0) return;
              e.preventDefault();
              e.stopPropagation();
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              const mv = (ev: PointerEvent) => onMark(i, Math.round(Math.min(hi, Math.max(lo, lo + ((ev.clientX - ref.current!.getBoundingClientRect().left) / Math.max(1, ref.current!.getBoundingClientRect().width)) * steps))));
              const up = () => (el.removeEventListener('pointermove', mv), el.removeEventListener('pointerup', up));
              el.addEventListener('pointermove', mv);
              el.addEventListener('pointerup', up);
            }}
          >
            {m.ok ? '✓' : (m.n ?? i + 1)}
          </span>
        ))}
      </div>
      <span className={'fw-val' + (st ? ' st' + st : '')} title={st === 2 ? '위험' : st === 1 ? '경고' : undefined}>
        {onChange ? <NumInput value={v} lo={lo} hi={hi} label={label} onChange={set} /> : v}
        <small> / {hi}</small>
      </span>
    </div>
  );
}

// 수치 칸: 꼴 옆에서 값을 바로 침. 치는 중에는 빈 칸·"-"도 두고, 숫자가 되면 바로 바꾸고(범위 안으로), 칸을 떠나면 지금 값으로 맞춤
function NumInput({ value, lo, hi, label, onChange }: { value: number; lo: number; hi: number; label?: string; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!typing) setDraft(String(value));
  }, [value, typing]);
  return (
    <input
      className="fw-input"
      type="number"
      inputMode="numeric"
      min={lo}
      max={hi}
      step={1}
      value={draft}
      aria-label={label ? `${label} 값` : '값'}
      title={`${lo}~${hi}`}
      onFocus={() => setTyping(true)}
      onBlur={() => (setTyping(false), setDraft(String(value)))}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        e.stopPropagation(); // 화살표 키가 꼴이나 캔버스로 가지 않게
      }}
    />
  );
}

// 스위치: 트랙 꺼짐 위에 켜짐이 서서히 겹치고, 썸이 옮겨 가며 켜짐 썸(있으면)으로 바뀜
function SwitchLook({ ui, value, onChange, label }: Props) {
  const { pics, color } = useSkin(ui);
  const on = value === true;
  const thumbOn = pics.thumbOn || ui.skin?.thumbOn?.color;
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={'fw-switch c-' + cornerOf(ui) + (on ? ' on' : '')} disabled={!onChange} onClick={() => onChange?.(!on)}>
      <Layer p={pics.off} color={color('off')} className="fw-trk" />
      <Layer p={pics.on} color={color('on')} className="fw-trk fw-x" />
      <span className="fw-knob">
        <Layer p={pics.thumb} color={color('thumb')} className={thumbOn ? 'fw-kx0' : ''} />
        {thumbOn && <Layer p={pics.thumbOn} color={color('thumbOn')} className="fw-kx" />}
      </span>
      <span className="fw-sw-text">{on ? '켜짐' : '꺼짐'}</span>
    </button>
  );
}

function TextLook({ ui, value, onChange, options = [], label }: Props) {
  const { paint, color } = useSkin(ui);
  const s = typeof value === 'string' ? value : '';
  const style: CSSProperties = { ...paint('box'), color: color('text'), borderColor: color('border') };
  const list = options.includes(s) ? options : [s, ...options];
  return (
    <select className={'fw-pull c-' + cornerOf(ui)} aria-label={label} style={style} value={s} disabled={!onChange} onChange={(e) => onChange?.(e.target.value)}>
      {list.map((o) => (
        <option key={o} value={o}>{o === '' ? '(빈 글)' : o}</option>
      ))}
    </select>
  );
}

// 입력칸 (FEATURE 31): 플레이어가 치는 칸. 글자는 그대로, 숫자는 범위 안 정수로 (치는 중에는 빈 칸·"-"도 둠)
function InputLook({ ui, value, onChange, label, len }: Props) {
  const { paint, color } = useSkin(ui);
  const num = typeof value === 'number';
  const [draft, setDraft] = useState(String(value ?? ''));
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!typing) setDraft(String(value ?? ''));
  }, [value, typing]);
  const style: CSSProperties = { ...paint('box'), color: color('text'), borderColor: color('border') };
  return (
    <input
      className={'fw-pull fw-type c-' + cornerOf(ui)}
      style={style}
      value={draft}
      readOnly={!onChange}
      maxLength={len}
      inputMode={num ? 'numeric' : undefined}
      placeholder={num ? `${uiMin(ui)}~${uiMax(ui)}` : '(빈 글)'}
      aria-label={label}
      spellCheck={false}
      onFocus={() => setTyping(true)}
      onBlur={() => (setTyping(false), setDraft(String(value ?? '')))}
      onChange={(e) => {
        const t = num ? e.target.value.replace(/[^\d-]/g, '') : e.target.value;
        setDraft(t);
        if (!num) return onChange?.(t);
        if (/^-?\d+$/.test(t)) onChange?.(Math.min(uiMax(ui), Math.max(uiMin(ui), Number(t))));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        e.stopPropagation(); // 글 치는 키가 캔버스 단축키로 가지 않게
      }}
    />
  );
}

// 체크박스: 상자(체크되면 "체크된 상자")와 체크 마크. 마크가 그림이 아니면 ✓ 선
function CheckLook({ ui, value, onChange, label }: Props) {
  const { pics, color } = useSkin(ui);
  const on = value === true;
  const useOn = on && (pics.on || ui.skin?.on?.color || !pics.box); // 상자 그림만 있으면 체크돼도 그 그림
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} className={'fw-check c-' + cornerOf(ui) + (on ? ' on' : '')} disabled={!onChange} onClick={() => onChange?.(!on)}>
      <span className="fw-cbox" style={{ borderColor: useOn || pics.box ? 'transparent' : color('border') }}>
        <Layer p={useOn ? pics.on : pics.box} color={color(useOn ? 'on' : 'box')} />
        {pics.mark ? (
          <Media p={pics.mark} className="fw-cmark" />
        ) : (
          <svg className="fw-cmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={color('mark')} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </span>
      <span className="fw-sw-text">{on ? '켜짐' : '꺼짐'}</span>
    </button>
  );
}

// 라디오: 고를 값마다 링 + 선택 점 + 글. 같은 플래그는 하나만 고름 (방향키로 옮김)
function RadioLook({ ui, value, onChange, options = [], label }: Props) {
  const { pics, color } = useSkin(ui);
  const s = typeof value === 'string' ? value : '';
  const list = options.length ? (options.includes(s) || s === '' ? options : [s, ...options]) : s ? [s] : [];
  const move = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d || !onChange || !list.length) return;
    e.preventDefault();
    const n = (i + d + list.length) % list.length;
    onChange(list[n]);
    ((e.currentTarget as HTMLElement).parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };
  if (!list.length) return <span className="fw-radio-empty">(고를 값 없음)</span>;
  return (
    <span className={'fw-radio' + (onChange ? ' live' : '')} role="radiogroup" aria-label={label}>
      {list.map((o, i) => {
        const on = o === s;
        const ring = on ? 'on' : 'ring';
        return (
          <button key={o} type="button" role="radio" aria-checked={on} tabIndex={on || (!list.includes(s) && i === 0) ? 0 : -1} className={on ? 'on' : ''} disabled={!onChange} onClick={() => onChange?.(o)} onKeyDown={(e) => move(e, i)}>
            <span className="fw-ring" style={pics[ring] ? { borderColor: 'transparent' } : { borderColor: color(ring), background: '#fff' }}>
              {pics[ring] && <Layer p={pics[ring]} color={false} />}
              {pics.dot ? <Media p={pics.dot} className="fw-dot" /> : <span className="fw-dot" style={{ background: color('dot') }} />}
            </span>
            <span style={ui.skin?.text?.color ? { color: color('text') } : undefined}>{o === '' ? '(빈 글)' : o}</span>
          </button>
        );
      })}
    </span>
  );
}
