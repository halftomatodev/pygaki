// [효과]·[셰이더] 왼쪽의 갤러리 보기: 카드마다 미리보기 그림. 고르면 오른쪽 칸에서 세부 값을 맞춘다.
// 카드는 멈춘 그림(fx/thumbs.ts, WebGL 판 하나로 차례대로 그림)을 보여 주고, 마우스를 올린 카드 하나만 움직인다
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGameFolder, gameFont } from './gameFolder';
import { usePrefs } from './prefs';
import { samplePicture, TextSample } from './EffectsView';
import { shaderThumb, transitionThumb, useThumb, THUMB_WIDTH } from './fx/thumbs';
import { ScreenFxCanvas, screenFxBlocked } from './fx/ScreenFxCanvas';
import { TransitionCanvas } from './fx/TransitionCanvas';
import { webglOk } from './fx/FxCanvas';
import type { ShaderEffect } from './fx/textShaders';
import type { ShaderInfo } from './shader';

// [갤러리] [목록] 고르기 (앱 설정에 기억)
export function GallerySwitch() {
  const gallery = usePrefs((p) => p.gallery);
  const move = usePrefs((p) => p.galleryMove);
  return (
    <>
      {gallery && (
        <button
          className={'gal-move' + (move ? ' on' : '')}
          onClick={() => usePrefs.setState({ galleryMove: !move })}
          title={move ? `움직이는 중: 화면에 보이는 카드 ${MAX_LIVE}개까지 계속 돌아요. 누르면 멈춘 그림으로` : `화면에 보이는 카드를 ${MAX_LIVE}개까지 계속 움직여요 (컴퓨터가 조금 더 일해요)`}
        >
          {move ? '❚❚ 멈추기' : '▶ 움직이기'}
        </button>
      )}
      <span className="view-switch fxv-kind gal-switch">
        <button className={gallery ? 'on' : ''} onClick={() => usePrefs.setState({ gallery: true })} title="미리보기 카드를 여러 개 같이 보며 고르기">▦ 갤러리</button>
        <button className={gallery ? '' : 'on'} onClick={() => usePrefs.setState({ gallery: false })} title="이름만 한 줄씩">☰ 목록</button>
      </span>
    </>
  );
}

// [움직이기]: 화면에 보이는 카드에 차례로 자리를 준다. 움직이는 카드는 저마다 WebGL 판을 써서
// (브라우저가 16개쯤만 허락함) 한 번에 MAX_LIVE개까지만. 스크롤해서 안 보이게 된 카드의 자리는 새로 보인 카드가 받는다
export const MAX_LIVE = 6;
const wanting = new Set<string>(); // 보이는 카드 (보인 차례대로)
const granted = new Set<string>();
const listeners = new Map<string, () => void>();
function regrant() {
  for (const id of [...granted]) if (!wanting.has(id)) granted.delete(id);
  for (const id of wanting) {
    if (granted.size >= MAX_LIVE) break;
    granted.add(id);
  }
  listeners.forEach((f) => f());
}
function useLiveSlot(el: React.RefObject<HTMLElement | null>, on: boolean) {
  const id = useId();
  const [slot, setSlot] = useState(false);
  useEffect(() => {
    if (!on || !el.current) return setSlot(false);
    listeners.set(id, () => setSlot(granted.has(id)));
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) wanting.add(id);
      else wanting.delete(id);
      regrant();
    });
    io.observe(el.current);
    return () => {
      io.disconnect();
      listeners.delete(id);
      wanting.delete(id);
      regrant();
    };
  }, [on, id]);
  return slot;
}

// 카드 하나: 위에 그림, 아래에 이름·표시·단추
export function GalleryCard({ on, off, label, name, top, bottom, still, live, onPick }: {
  on: boolean; // 고른 카드
  off?: boolean; // 꺼 둔 것
  label: string;
  name: string;
  top?: ReactNode; // 이름 줄 오른쪽 (켜기 칸, 표시)
  bottom?: ReactNode; // 둘째 줄 오른쪽 (쓴 곳, 단추)
  still: ReactNode; // 멈춘 그림
  live?: ReactNode; // 마우스를 올렸을 때 움직이는 그림
  onPick(): void;
}) {
  const look = useGameFolder((s) => s.look);
  const [hover, setHover] = useState(false);
  const move = usePrefs((p) => p.galleryMove);
  const card = useRef<HTMLDivElement>(null);
  const slot = useLiveSlot(card, move && !!live);
  const timer = useRef(0);
  // 카드 위를 스쳐 지나갈 때마다 WebGL을 켜지 않게 잠깐 기다린다
  const enter = () => (clearTimeout(timer.current), (timer.current = window.setTimeout(() => setHover(true), 180)));
  const leave = () => (clearTimeout(timer.current), setHover(false));
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div ref={card} className={'gal-card' + (on ? ' on' : '') + (off ? ' off' : '')} onClick={onPick} onMouseEnter={enter} onMouseLeave={leave}>
      <div className="gal-pic" style={{ aspectRatio: `${look.width} / ${look.height}` }}>
        {(hover || slot) && live ? live : still}
      </div>
      <div className="gal-meta">
        <div className="gal-line">
          <span className="fxv-label">{label}</span>
          <span className="grow" />
          {top}
        </div>
        <div className="gal-line">
          <span className="fxv-name">{name}</span>
          <span className="grow" />
          {bottom}
        </div>
      </div>
    </div>
  );
}

const Msg = ({ children }: { children: ReactNode }) => <div className="gal-msg">{children}</div>;
const Shot = ({ v }: { v: string | Error | null }) =>
  !webglOk ? <Msg>WebGL이 안 돼요</Msg> : v instanceof Error ? <Msg>앱에서 못 그려요</Msg> : v ? <img src={v} alt="" draggable={false} /> : <div className="gal-wait" />;

// 그림 열쇠: 고른 샘플 그림이 바뀌면 다시 그린다
const picKey = (p: HTMLImageElement | null) => (p ? p.src : '-');

// ── 화면 셰이더 ──
export function ShaderStill({ info, args, picture, seq }: { info: ShaderInfo; args: Record<string, unknown>; picture: HTMLImageElement | null; seq: number }) {
  const look = useGameFolder((s) => s.look);
  const why = screenFxBlocked(info);
  const v = useThumb(['sh', info.id, JSON.stringify(args), look.width, look.height, picKey(picture), seq].join('|'), why || !webglOk ? null : () => {
    const pic = samplePicture(THUMB_WIDTH, Math.round((THUMB_WIDTH * look.height) / look.width), true, picture, '샘플 화면');
    return shaderThumb(info, args, pic, [look.width, look.height]);
  });
  if (why) return <Msg>{info.extra ? '게임에서만 보여요' : '셰이더 코드가 없어요'}</Msg>;
  return <Shot v={v} />;
}
export function ShaderLive({ info, args, picture }: { info: ShaderInfo; args: Record<string, unknown>; picture: HTMLImageElement | null }) {
  const look = useGameFolder((s) => s.look);
  const [bad, setBad] = useState(false);
  const pic = useMemo(() => samplePicture(THUMB_WIDTH, Math.round((THUMB_WIDTH * look.height) / look.width), true, picture, '샘플 화면'), [look.width, look.height, picture]);
  if (bad || screenFxBlocked(info) || !webglOk) return null;
  return <ScreenFxCanvas info={info} args={args} picture={pic} size={[look.width, look.height]} onFail={() => setBad(true)} />;
}

// ── 그림 효과 (앞 그림 → 새 그림) ──
function usePair(picture: HTMLImageElement | null) {
  const look = useGameFolder((s) => s.look);
  return useMemo(() => {
    const h = Math.round((THUMB_WIDTH * look.height) / look.width);
    return [samplePicture(THUMB_WIDTH, h, false, null), samplePicture(THUMB_WIDTH, h, true, picture)] as const;
  }, [look.width, look.height, picture]);
}
export function TransitionStill({ effect, args, picture, seq }: { effect: ShaderEffect; args: Record<string, string>; picture: HTMLImageElement | null; seq: number }) {
  const look = useGameFolder((s) => s.look);
  const [old, next] = usePair(picture);
  const v = useThumb(['tr', effect.name, JSON.stringify(args), look.width, look.height, picKey(picture), seq].join('|'), webglOk ? () => transitionThumb(effect, args, old, next, [look.width, look.height]) : null);
  return <Shot v={v} />;
}
// 마우스를 올린 동안 되풀이
export function TransitionLive({ effect, args, time, picture }: { effect: ShaderEffect; args: Record<string, string>; time?: number; picture: HTMLImageElement | null }) {
  const look = useGameFolder((s) => s.look);
  const [old, next] = usePair(picture);
  const [round, setRound] = useState(0);
  const [bad, setBad] = useState(false);
  const t = useRef(0);
  useEffect(() => () => clearTimeout(t.current), []);
  if (bad || !webglOk) return null;
  return (
    <TransitionCanvas
      key={round}
      effect={effect}
      args={args}
      time={time}
      old={old}
      next={next}
      size={[look.width, look.height]}
      onDone={() => (t.current = window.setTimeout(() => setRound((v) => v + 1), 700))}
      onFail={() => setBad(true)}
    />
  );
}

// ── 글자 효과 ──
// 글자가 반쯤 나온 한 장을 찍어 둔다. 사진사(TextPhotographer) 하나가 화면 밖에서 차례대로 돌려 찍는다
type TextJob = { key: string; spec: string; name: string; text: string; done(v: string | null): void };
const textQueue: TextJob[] = [];
const textShots = new Map<string, string>();
let wakePhotographer: (() => void) | null = null;

export function TextStill({ spec, name, text }: { spec: string; name: string; text: string }) {
  const look = useGameFolder((s) => s.look);
  const key = [spec, text, look.font, look.textColor, look.width, look.height].join('|');
  const [shot, setShot] = useState(() => textShots.get(key) ?? null);
  useEffect(() => {
    const had = textShots.get(key);
    if (had) return setShot(had);
    setShot(null);
    if (!webglOk) return;
    let live = true;
    const job: TextJob = { key, spec, name, text, done: (v) => live && v && setShot(v) };
    textQueue.push(job);
    wakePhotographer?.();
    return () => {
      live = false;
      const i = textQueue.indexOf(job);
      if (i >= 0) textQueue.splice(i, 1);
    };
  }, [key]);
  if (shot) return <img src={shot} alt="" draggable={false} />;
  return (
    <div className="gal-text" style={{ color: look.textColor, fontFamily: `${gameFont(look.font) ?? 'var(--font)'}, var(--font)` }}>
      {text.trim() || '안녕, 반가워!'}
    </div>
  );
}

// 갤러리에 하나만 둔다. 카드와 같은 크기의 무대를 화면 밖에 두고 글자 효과를 돌려 반쯤 나온 순간을 그림으로
export function TextPhotographer() {
  const look = useGameFolder((s) => s.look);
  const [job, setJob] = useState<TextJob | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const taken = useRef(false);
  useEffect(() => {
    const next = () => setJob((cur) => cur ?? textQueue.shift() ?? null);
    wakePhotographer = next;
    next();
    return () => void (wakePhotographer = null);
  }, []);
  // 오래 걸리면(창이 안 보여 그리기가 멈춤 등) 이번 것은 건너뛴다
  useEffect(() => {
    if (!job) return;
    taken.current = false;
    const t = setTimeout(() => finish(null), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);
  const finish = (v: string | null) => {
    if (!job || taken.current) return;
    taken.current = true;
    if (v) textShots.set(job.key, v);
    job.done(v);
    setTimeout(() => setJob(textQueue.shift() ?? null), 30);
  };
  const onFrame = (c: HTMLCanvasElement, slow: number, maxTime: number) => {
    if (taken.current || !box.current) return;
    if (maxTime > 0 && slow < maxTime * 0.55) return;
    const stage = box.current.querySelector('.fxv-stage') as HTMLElement | null;
    if (!stage) return;
    // 그린 바로 그 차례에 옮겨 그린다 (그다음에는 WebGL 판이 비워짐)
    const k = 2;
    const out = document.createElement('canvas');
    out.width = stage.clientWidth * k;
    out.height = stage.clientHeight * k;
    const g = out.getContext('2d')!;
    g.fillStyle = '#15171f';
    g.fillRect(0, 0, out.width, out.height);
    g.drawImage(c, c.offsetLeft * k, c.offsetTop * k, c.offsetWidth * k, c.offsetHeight * k);
    finish(out.toDataURL('image/png'));
  };
  if (!job) return null;
  return (
    <div className="gal-photographer" aria-hidden>
      <div ref={box} className="gal-pic" style={{ aspectRatio: `${look.width} / ${look.height}` }}>
        <div className="gal-textlive">
          <TextSample key={job.key} spec={job.spec} name={job.name} text={job.text} onReplay={() => {}} onFrame={onFrame} />
        </div>
      </div>
    </div>
  );
}

// 마우스를 올린 동안 되풀이 (글자가 다 나오면 잠깐 쉬고 다시)
export function TextLive({ spec, name, text }: { spec: string; name: string; text: string }) {
  const [round, setRound] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRound((v) => v + 1), Math.max(1800, [...text].length * 33 + 1400));
    return () => clearInterval(t);
  }, [text]);
  return (
    <div className="gal-textlive">
      <TextSample key={round} spec={spec} name={name} text={text} onReplay={() => setRound((v) => v + 1)} />
    </div>
  );
}
