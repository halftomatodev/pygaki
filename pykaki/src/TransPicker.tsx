// 배경·보이기·숨기기 줄의 "나타나는 방식" 고르기 창 (세션 34).
// [효과] 화면의 그림 효과와 같은 목록(effectCatalog)에 샘플을 붙여 보여 준다. 게임의 효과 폴더에 있는 것만 (숨긴 것은 빠짐).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { effectCatalog, type EffectCard } from './effectsLib';
import { PictureSample, SOURCE_LABEL } from './EffectsView';
import { shaderEffect } from './fx/textShaders';
import { imageFxCode, parseImageFx } from './stage';
import { useGameFolder } from './gameFolder';

const BASIC: [string, string, string][] = [
  ['', '바로', '전환 없이 바로 나와요'],
  ['dissolve', '서서히', '렌파이 기본 dissolve'],
  ['fade', '검게 페이드', '렌파이 기본 fade: 검게 됐다가 나와요'],
];

interface Props {
  value: string | undefined;
  onPick(v: string): void;
  className?: string;
}

export function TransPicker({ value, onPick, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; top: number; maxH: number } | null>(null);
  useGameFolder((f) => f.fxSeq); // 효과를 넣거나 끄면 목록을 다시 그린다
  const cards = open ? effectCatalog().filter((c) => c.kind === 'transition') : [];
  const ready = cards.filter((c) => c.ready && c.on);

  const cur = parseImageFx(value)?.name;
  const curLabel =
    BASIC.find(([k]) => k === (value ?? ''))?.[1] ??
    (cur ? (effectCatalog().find((c) => c.kind === 'transition' && c.name === cur)?.label ?? cur) : value ?? '바로');

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !box.current?.contains(e.target as Node) && !pop.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), setOpen(false));
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key, true);
    };
  }, [open]);

  // 칸 밖으로 잘리지 않게 창 위에 띄운다 (단추 아래, 모자라면 위로)
  const toggle = () => {
    if (open) return setOpen(false);
    const r = box.current!.getBoundingClientRect();
    const W = 280;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const maxH = Math.min(440, Math.max(below, above));
    const top = below >= Math.min(440, above) ? r.bottom + 4 : Math.max(8, r.top - 4 - maxH);
    setAt({ left, top, maxH });
    setOpen(true);
  };
  const pick = (v: string) => {
    onPick(v);
    setOpen(false);
  };
  const pickCard = (c: EffectCard) => pick(imageFxCode(c.name));

  // 샘플: 마우스를 올린 효과, 없으면 지금 고른 효과
  const show = hover ?? cur ?? null;
  const fx = show ? shaderEffect(show, true) : undefined;
  const row = (key: string, label: string, tag: string, on: boolean, click: () => void, title?: string, name?: string) => (
    <button key={key} className={'tp-item' + (on ? ' on' : '')} title={title} onMouseEnter={() => setHover(name ?? null)} onClick={click}>
      <span className="tp-label">{label}</span>
      <span className="sp-badge">{tag}</span>
    </button>
  );

  return (
    <div className={'tp ' + className} ref={box}>
      <button className="tp-btn" title="나타나는 방식: 눌러서 [효과] 화면의 그림 효과 가운데서 골라요" onClick={toggle}>
        {curLabel} ▾
      </button>
      {open && at && createPortal(
        <div className="tp-pop" ref={pop} style={{ left: at.left, top: at.top, maxHeight: at.maxH }} onMouseLeave={() => setHover(null)}>
          <div className="tp-sample">
            {fx?.kind === 'transition' ? (
              <PictureSample key={fx.name} effect={fx} args={{}} time={fx.time} picture={null} onReplay={() => setHover((h) => h)} />
            ) : (
              <div className="tp-nosample">{show === null ? '효과에 마우스를 올리면 샘플이 돌아요' : '렌파이 기본 전환이에요'}</div>
            )}
          </div>
          <div className="tp-list">
            <div className="tp-sub">기본</div>
            {BASIC.map(([k, label, title]) => row('b' + k, label, '렌파이', (value ?? '') === k, () => pick(k), title))}
            <div className="tp-sub">그림 효과</div>
            {!ready.length && <p className="tip">게임에 그림 효과가 없어요.</p>}
            {ready.map((c) => row(c.name, c.label, SOURCE_LABEL[c.source], cur === c.name, () => pickCard(c), c.name, c.name))}
            {value && !BASIC.some(([k]) => k === value) && !cur && <p className="tip">지금 값: {value}</p>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
