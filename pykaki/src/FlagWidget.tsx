// 플래그의 꼴 (FEATURE 20, 29): 레벨 인디케이터(이어진 막대, 칸 막대, 별), 스위치, 체크박스, 라디오, 풀다운.
// 플래그 카드에서는 끌거나 눌러 시험 값을 바꾸고, 용례 메뉴의 견본에서는 저절로 움직인다. 부품마다 색이나 그림(게임 그림)으로 꾸민다
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPE } from 'react';
import type { FlagUi } from './types';
import { cornerOf, partColor, uiMax, uiMin } from './flagUi';
import { usePic } from './ScreensView';
import type { Val } from './trace';

const PARTS = ['fill', 'track', 'border', 'on', 'off', 'thumb', 'box', 'text', 'mark', 'ring', 'dot'] as const;

// 부품마다 그림 주소 (훅 수가 늘 같게 부품 이름을 다 부름)
function useSkin(ui: FlagUi) {
  const pics: Record<string, string | null> = {};
  for (const p of PARTS) pics[p] = usePic(ui.skin?.[p]?.image ?? ''); // eslint-disable-line react-hooks/rules-of-hooks
  const paint = (part: string): CSSProperties => (pics[part] ? { backgroundImage: `url("${pics[part]}")`, backgroundSize: '100% 100%', backgroundColor: 'transparent' } : { background: partColor(ui, part) });
  return { pics, paint, color: (part: string) => partColor(ui, part) };
}

interface Props {
  ui: FlagUi;
  value: Val;
  onChange?: (v: Val) => void; // 없으면 보기만
  options?: string[]; // 라디오·풀다운의 고를 값
  label?: string; // 읽어 주는 이름 (플래그 이름)
  marks?: { value: number; label: string; ok: boolean; n?: number }[]; // 숫자 꼴 위의 조건 눈금 (2단계, Steps 꼴)
  onMark?: (i: number, v: number) => void; // 눈금을 끌면 그 조건의 기준 값
}

export function FlagWidget(props: Props) {
  const { ui } = props;
  if (ui.look === 'switch') return <SwitchLook {...props} />;
  if (ui.look === 'checkbox') return <CheckLook {...props} />;
  if (ui.look === 'radio') return <RadioLook {...props} />;
  if (ui.look === 'pulldown') return <TextLook {...props} />;
  return <NumberLook {...props} />;
}

function NumberLook({ ui, value, onChange, label, marks, onMark }: Props) {
  const { pics, paint, color } = useSkin(ui);
  const ref = useRef<HTMLDivElement>(null);
  const lo = uiMin(ui), hi = uiMax(ui);
  const n = typeof value === 'number' && Number.isFinite(value) ? value : lo;
  const v = Math.min(hi, Math.max(lo, n));
  const frac = (v - lo) / (hi - lo);
  const steps = hi - lo;
  const set = (x: number) => onChange?.(Math.round(Math.min(hi, Math.max(lo, x))));

  // 끌기: 누른 자리와 끄는 자리로 값. 별은 칸마다 한 값
  const at = (e: { clientX: number }) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
    return ui.look === 'level' && ui.style === 'rating' ? lo + Math.ceil(t * steps) : lo + t * steps;
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

  let body;
  if (ui.look === 'level' && ui.style === 'rating') {
    const count = Math.min(steps, 10);
    const per = steps / count;
    body = (
      <div className="fw-stars">
        {Array.from({ length: count }, (_, i) => {
          const on = v >= lo + (i + 1) * per;
          const pic = on ? pics.on : pics.off;
          return pic ? <img key={i} src={pic} alt="" draggable={false} /> : <span key={i} style={{ color: color(on ? 'on' : 'off') }}>★</span>;
        })}
      </div>
    );
  } else {
    const discrete = ui.style === 'discrete';
    const count = Math.min(steps, 20);
    body = (
      <div className={'fw-level' + (discrete ? ' discrete' : '')} style={{ ...paint('track'), borderColor: color('border') }}>
        {discrete ? (
          Array.from({ length: count }, (_, i) => <span key={i} className="fw-seg" style={(i + 1) / count <= frac + 1e-9 ? paint('fill') : undefined} />)
        ) : (
          <span className="fw-fill" style={{ ...paint('fill'), width: frac * 100 + '%' }} />
        )}
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
      <span className="fw-val">
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

function SwitchLook({ ui, value, onChange, label }: Props) {
  const { pics, paint } = useSkin(ui);
  const on = value === true;
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={'fw-switch c-' + cornerOf(ui) + (on ? ' on' : '')} style={paint(on ? 'on' : 'off')} disabled={!onChange} onClick={() => onChange?.(!on)}>
      {pics.thumb ? <img className="fw-knob img" src={pics.thumb} alt="" draggable={false} /> : <span className="fw-knob" style={paint('thumb')} />}
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

// 체크박스: 상자(체크되면 "체크된 상자")와 체크 마크. 마크가 그림이 아니면 ✓ 선
function CheckLook({ ui, value, onChange, label }: Props) {
  const { pics, paint, color } = useSkin(ui);
  const on = value === true;
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} className={'fw-check c-' + cornerOf(ui) + (on ? ' on' : '')} disabled={!onChange} onClick={() => onChange?.(!on)}>
      <span className="fw-cbox" style={{ ...paint(on && (pics.on || ui.skin?.on?.color || !pics.box) ? 'on' : 'box'), borderColor: on ? 'transparent' : color('border') }}>
        {pics.mark ? (
          <img className="fw-cmark" src={pics.mark} alt="" draggable={false} />
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
  const { pics, paint, color } = useSkin(ui);
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
            <span className="fw-ring" style={pics[ring] ? paint(ring) : { borderColor: color(ring), background: '#fff' }}>
              {pics.dot ? <img className="fw-dot" src={pics.dot} alt="" draggable={false} /> : <span className="fw-dot" style={{ background: color('dot') }} />}
            </span>
            <span style={ui.skin?.text?.color ? { color: color('text') } : undefined}>{o === '' ? '(빈 글)' : o}</span>
          </button>
        );
      })}
    </span>
  );
}
