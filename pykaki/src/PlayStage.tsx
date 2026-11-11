// 플레이 화면: 게임 해상도 그대로 그린 뒤 창 크기에 맞춰 줄인다. 값은 연결한 game 폴더(gui.rpy 등)에서 읽는다
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Line } from './types';
import type { PStage, Sprite } from './playEngine';
import { transInfo } from './playEngine';
import { boxTail, lineCps } from './stage';
import { shaderTags } from './tagEdit';
import type { SayStyle } from './types';
import { parseTagged, type Tagged } from './textTags';
import { gameFont, pictureOf, useGameFolder, type GameLook } from './gameFolder';
import { FxCanvas, webglOk } from './fx/FxCanvas';
import { IMAGE_FX, parseTextShader, type ShaderEffect, type TextShader } from './fx/textShaders';
import { TransitionCanvas, type Picture } from './fx/TransitionCanvas';

// 줄마다 고른 글꼴. 못 읽으면 게임 기본 글꼴로 보인다
const fontStack = (path?: string) => {
  const f = gameFont(path);
  return f ? `${f}, var(--game-font)` : undefined;
};

// 게임 화면 크기를 창에 맞추는 틀
export function GameFrame({ look, full, onClick, children, top }: { look: GameLook; full: boolean; onClick?: () => void; children: ReactNode; top?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = box.w && box.h ? Math.min(box.w / look.width, box.h / look.height) : 0;
  return (
    <div
      ref={ref}
      className={'pframe' + (full ? ' full' : '')}
      style={full ? undefined : { aspectRatio: `${look.width} / ${look.height}` }}
      onClick={onClick}
    >
      <div
        className="game"
        style={{
          width: look.width,
          height: look.height,
          '--game-font': `${gameFont(look.font) ?? 'var(--font)'}, var(--font)`,
          transform: `translate(${(box.w - look.width * s) / 2}px, ${(box.h - look.height * s) / 2}px) scale(${s})`,
        } as React.CSSProperties}
      >
        {children}
      </div>
      {top}
    </div>
  );
}

function usePicture(name: string) {
  const media = useGameFolder((s) => s.media); // 폴더를 다시 읽으면 다시 찾는다
  const [pic, setPic] = useState<{ url: string; video: boolean } | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    pictureOf(name).then((p) => alive && setPic(p));
    return () => void (alive = false);
  }, [name, media]);
  return pic;
}

// 그림의 자리. 정하는 순서: 원고의 at → (상자, 태그) → (태그) → 가운데
function placeOf(s: Sprite, look: GameLook): React.CSSProperties {
  const pos = s.pos ?? look.placed[s.box + '|' + s.tag] ?? look.placed[s.tag];
  if (s.at === 'left') return { left: 0, bottom: 0 };
  if (s.at === 'right') return { right: 0, bottom: 0 };
  if (pos) return { left: pos[0], top: pos[1], translate: '-50% -100%' };
  return { left: look.width / 2, bottom: 0, translate: '-50% 0' };
}

// ── 그림 효과 (효과 폴더의 @transition, img_fx.use) ──
// 게임처럼 화면 전체를 앞 장면에서 새 장면으로 바꾼다: 두 장면을 그림 한 장씩으로 만들어 같은 셰이더 코드로 그린다 (fx/TransitionCanvas).
// 그리는 동안 밑의 그림 겹은 이미 새 장면이고, 캔버스가 그 위를 덮는다. WebGL이 안 되거나 효과를 못 그리면 서서히 바뀌기로 보인다
const BROKEN_FX = new WeakSet<ShaderEffect>();

// "img_fx.use("bands", 1.2, count=10, color="#c2185b")" → 효과, 걸리는 초, 고친 값. 그릴 수 없으면 null
function imageFx(trans?: string) {
  if (!trans || !webglOk) return null;
  const m = /^img_fx\.use\(\s*"(\w+)"\s*(.*)\)\s*$/.exec(trans);
  const effect = m && IMAGE_FX.find((e) => e.name === m[1]);
  if (!m || !effect || BROKEN_FX.has(effect)) return null;
  const args: Record<string, string> = {};
  let time = effect.time;
  for (const part of m[2].split(',').map((p) => p.trim()).filter(Boolean)) {
    const i = part.indexOf('=');
    const [k, v] = i < 0 ? ['time', part] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    if (k !== 'time') args[k] = v;
    else if (!isNaN(Number(v))) time = Number(v);
  }
  return { effect, time, args };
}

// 장면을 그릴 그림. 폴더를 다시 읽으면 버린다
let picsFor: unknown = null;
const PICS = new Map<string, Picture | null>();
const PENDING = new Map<string, Promise<Picture | null>>();
function loadPicture(name: string): Promise<Picture | null> {
  const media = useGameFolder.getState().media;
  if (media !== picsFor) (picsFor = media), PICS.clear(), PENDING.clear();
  if (PICS.has(name)) return Promise.resolve(PICS.get(name)!);
  let p = PENDING.get(name);
  if (!p) {
    p = pictureOf(name)
      .then((pic) =>
        !pic
          ? null
          : new Promise<Picture | null>((done) => {
              const el = pic.video ? Object.assign(document.createElement('video'), { muted: true, preload: 'auto' }) : new Image();
              el.addEventListener(pic.video ? 'loadeddata' : 'load', () => done(el));
              el.addEventListener('error', () => done(null));
              el.src = pic.url;
            }),
      )
      .catch(() => null)
      .then((r) => {
        if (picsFor === media) PICS.set(name, r);
        return r;
      });
    PENDING.set(name, p);
  }
  return p;
}
const sceneSprites = (st: PStage | null) => (st ? [st.bg, ...st.sprites].filter((s): s is Sprite => !!s) : []);
const picturesReady = (st: PStage | null) => picsFor === useGameFolder.getState().media && sceneSprites(st).every((s) => PICS.has(s.name));

// 장면을 그림 한 장으로 (다 읽은 그림만 그린다). 자리는 placeOf와 같다
function paintScene(st: PStage | null, look: GameLook) {
  const c = document.createElement('canvas');
  c.width = look.width;
  c.height = look.height;
  const g = c.getContext('2d')!;
  const back = g.createLinearGradient(0, 0, 0, look.height); // .game의 바탕
  back.addColorStop(0, '#2b3047');
  back.addColorStop(1, '#1a1d2b');
  g.fillStyle = back;
  g.fillRect(0, 0, look.width, look.height);
  for (const s of sceneSprites(st)) {
    const pic = PICS.get(s.name);
    if (!pic) continue;
    const [w, h] = pic instanceof HTMLVideoElement ? [pic.videoWidth, pic.videoHeight] : pic instanceof HTMLImageElement ? [pic.naturalWidth, pic.naturalHeight] : [pic.width, pic.height];
    const pos = s.pos ?? look.placed[s.box + '|' + s.tag] ?? look.placed[s.tag];
    let xy = [look.width / 2 - w / 2, look.height - h];
    if (s === st!.bg) xy = [0, 0];
    else if (s.at === 'left') xy = [0, look.height - h];
    else if (s.at === 'right') xy = [look.width - w, look.height - h];
    else if (pos) xy = [pos[0] - w / 2, pos[1] - h];
    try {
      g.drawImage(pic, xy[0], xy[1]);
    } catch {
      // 못 그리는 그림은 건너뛴다
    }
  }
  return c;
}

// 이번 걸음에 새로 걸린 그림 효과 (여러 개면 마지막 것 하나로 앞 장면 → 새 장면)
function freshImageFx(before: PStage | null, stage: PStage) {
  const had = new Set(sceneSprites(before).map((s) => s.key));
  const fresh = [...stage.leaving, ...sceneSprites(stage).filter((s) => !had.has(s.key))];
  for (let i = fresh.length - 1; i >= 0; i--) {
    const fx = imageFx(fresh[i].trans);
    if (fx) return fx;
  }
  return null;
}

let fxRunSeq = 0;
function SceneFx({ stage, look }: { stage: PStage; look: GameLook }) {
  const media = useGameFolder((s) => s.media);
  const seen = useRef<{ stage: PStage; before: PStage | null } | null>(null);
  if (seen.current?.stage !== stage) seen.current = { stage, before: seen.current?.stage ?? null };
  const before = seen.current.before;
  const [run, setRun] = useState<{ id: number; stage: PStage; fx: NonNullable<ReturnType<typeof imageFx>>; old: Picture; next: Picture | null } | null>(null);

  // 지금 장면의 그림을 미리 읽어 둔다 (다음 전환의 앞 장면을 기다리지 않고 그리게)
  useEffect(() => {
    for (const s of sceneSprites(stage)) void loadPicture(s.name);
  }, [stage, media]);

  useLayoutEffect(() => {
    const fx = freshImageFx(before, stage);
    if (!fx) return setRun(null);
    let alive = true;
    const id = ++fxRunSeq;
    const old = picturesReady(before) ? paintScene(before, look) : null;
    setRun(old && { id, stage, fx, old, next: null });
    Promise.all([...sceneSprites(before), ...sceneSprites(stage)].map((s) => loadPicture(s.name))).then(
      () => alive && setRun({ id, stage, fx, old: old ?? paintScene(before, look), next: paintScene(stage, look) }),
    );
    return () => void (alive = false);
  }, [stage]);

  if (!run || run.stage !== stage) return null;
  return (
    <TransitionCanvas
      key={run.id}
      className="fx-canvas-scene"
      effect={run.fx.effect}
      args={run.fx.args}
      time={run.fx.time}
      old={run.old}
      next={run.next}
      size={[look.width, look.height]}
      onDone={() => setRun(null)}
      onFail={(e) => {
        console.warn('그림 효과를 못 그려서 서서히 바뀌기로 보여요', e);
        BROKEN_FX.add(run.fx.effect);
        setRun(null);
      }}
    />
  );
}

function Layer({ s, look, bg, leaving }: { s: Sprite; look: GameLook; bg?: boolean; leaving?: boolean }) {
  const pic = usePicture(s.name);
  const gl = !!imageFx(s.trans); // 그림 효과는 SceneFx가 화면 전체로 그린다
  const info = gl ? null : transInfo(s.trans);
  const style: React.CSSProperties = bg ? { left: 0, top: 0 } : placeOf(s, look);
  const anim = info ? ` ${leaving ? 'tout' : 'tin'}-${info.kind}` : '';
  const vars = info ? ({ '--dur': info.dur + 's' } as React.CSSProperties) : undefined;
  if (pic === undefined || (gl && leaving)) return null;
  return (
    <div className={'layer' + anim} style={{ ...style, ...vars }}>
      {!pic ? (
        <span className={'noimg' + (bg ? ' bg' : '')}>{s.name}</span>
      ) : pic.video ? (
        <video src={pic.url} autoPlay loop muted playsInline />
      ) : (
        <img src={pic.url} alt={s.name} draggable={false} />
      )}
    </div>
  );
}

export function Scene({ stage, look }: { stage: PStage; look: GameLook }) {
  const leavingBg = stage.leaving.filter((s) => s.tag === 'bg');
  const leavingOther = stage.leaving.filter((s) => s.tag !== 'bg');
  return (
    <>
      {leavingBg.map((s) => <Layer key={s.key} s={s} look={look} bg leaving />)}
      {stage.bg && <Layer key={stage.bg.key} s={stage.bg} look={look} bg />}
      {leavingOther.map((s) => <Layer key={s.key} s={s} look={look} leaving />)}
      {stage.sprites.map((s) => <Layer key={s.key} s={s} look={look} />)}
      {stage.fade && <div key={stage.fade} className="fade-black" />}
      <SceneFx stage={stage} look={look} />
    </>
  );
}

export interface SayBoxHandle { click(): boolean } // 아직 다 안 나왔으면 다 보여 주고 true

// 글자를 속도(글자/초)와 멈춤 태그에 맞춰 하나씩 내보낸다. 대사창과 미리보기가 함께 쓴다
export function useReveal(parsed: Tagged, cps: number, wait = 0) {
  const total = parsed.glyphs.length;
  const anyRate = cps > 0 || parsed.glyphs.some((g) => g.fixed && g.rate > 0);
  const [passed, setPassed] = useState(0); // 지나온 멈춤 수
  const stop = parsed.stops[passed];
  const limit = stop ? stop.at : total; // 지금 나올 수 있는 데까지
  const [shown, setShown] = useState(() => (anyRate ? parsed.fastTo : Math.max(parsed.fastTo, parsed.stops[0]?.at ?? total)));
  const [holding, setHolding] = useState(wait > 0);
  const [fast, setFast] = useState(false); // 클릭으로 한 번에 보였으면 등장 효과 없이 (렌파이와 같음)
  const done = shown >= total && !stop;

  // 앞 줄의 전환이 끝날 때까지 글자를 기다린다
  useEffect(() => {
    if (!holding) return;
    const t = setTimeout(() => setHolding(false), wait * 1000);
    return () => clearTimeout(t);
  }, [holding, wait]);

  useEffect(() => {
    if (holding || done) return;
    if (shown >= limit) {
      // {w=1.0}은 기다렸다 넘어가고, {w}는 클릭을 기다린다
      if (stop?.sec == null) return;
      const t = setTimeout(() => setPassed((v) => v + 1), stop.sec * 1000);
      return () => clearTimeout(t);
    }
    const g = parsed.glyphs[shown];
    const rate = g.fixed ? g.rate : cps * g.rate;
    if (rate <= 0) return setShown(limit);
    const t = setTimeout(() => setShown((v) => v + 1), 1000 / rate);
    return () => clearTimeout(t);
  }, [shown, limit, holding, done, cps]);

  // 아직 다 안 나왔으면 다 보여 주고 true
  const click = () => {
    if (holding) return setHolding(false), true;
    if (shown < limit) return setShown(limit), setFast(true), true;
    if (stop) return setPassed((v) => v + 1), true;
    return false;
  };
  return { shown: holding ? 0 : shown, done, click, fast, limit, holding };
}

// 글자마다 다른 값(0~1). showpy 셰이더와 같은 식이라 같은 글자는 같은 쪽으로 흩어진다
const rand = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed) * 43758.5453;
  return v - Math.floor(v);
};

export function Glyphs({ parsed, shown }: { parsed: Tagged; shown: number }) {
  return (
    <>
      {parsed.glyphs.map((g, i) =>
        g.ch === '\n' ? (
          <br key={i} />
        ) : (
          <span
            key={i}
            data-i={i}
            className={'ch' + (i < shown ? ' on' : i === shown ? ' next' : '')}
            style={{ ...g.style, '--i': i, '--r1': rand(i, 1) * 2 - 1, '--r2': rand(i, 2) * 2 - 1, '--r3': rand(i, 3) * 2 - 1, '--r4': rand(i, 4) } as React.CSSProperties}
          >
            {g.ch}
          </span>
        ),
      )}
    </>
  );
}

// 등장 효과의 길이는 글자 수로 정해져 있어서, 한 글자 시간을 CSS에 넘긴다
const charTime = (cps: number) => ({ '--cd': cps > 0 ? `${1 / cps}s` : '0s' }) as React.CSSProperties;
const fxClass = (effect: string | undefined, fast: boolean) => 'fx-' + (effect || 'none') + (fast ? ' fast' : '');
// 글 상자 (showpy text_box.rpy 흉내): 말풍선, 둥근 테두리. 셰이더로 그릴 때는 글자 자리가 어긋나서 기울이지 않는다
const boxClass = (s: SayStyle) => (s.box ? ` sbox sbox-${s.box} tail-${boxTail(s)}` : '');
const boxTilt = (s: SayStyle, gl: boolean): React.CSSProperties => (s.box && s.box_rotate && !gl ? { transform: `rotate(${s.box_rotate}deg)` } : {});
// 말풍선은 글 색을 따로 안 적으면 어두운 글 (showpy bubble text_color 기본)
const boxColor = (s: SayStyle, base: string) => s.color ?? (s.box === 'bubble' ? '#222222' : base);

// 등장 효과를 WebGL로 그릴 수 있으면 셰이더를, 아니면 null (CSS 흉내로 그림)
// 글의 일부에만 건 효과({shader=이름})가 있으면 그 글자들만 그 효과로 그린다. 줄에 효과가 없으면 나머지 글자는 한 글자씩 나오기로
function useShader(effect: string | undefined, parsed: Tagged) {
  const [failed, setFailed] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(parsed.glyphs.map((g) => g.shader).filter((v): v is string => !!v))].sort().join('\n'), [parsed]);
  const key = (effect ?? '') + '\n' + tags;
  const fxSeq = useGameFolder((s) => s.fxSeq); // 효과 폴더를 다시 읽으면 태그의 효과도 다시 찾는다
  const { ts, tagTs } = useMemo(() => {
    const none = { ts: null, tagTs: undefined };
    const base = effect || (tags ? 'typewriter' : '');
    if (!base || !webglOk || failed === key) return none;
    try {
      const ts = parseTextShader(base);
      if (!ts) return none;
      const tagTs = new Map<string, TextShader>();
      for (const v of tags ? tags.split('\n') : []) {
        try {
          const t = parseTextShader(v);
          if (t) tagTs.set(v, t);
        } catch {
          // 값이 틀린 태그는 줄의 효과로 그린다 (검사 탭이 알려 준다)
        }
      }
      return { ts, tagTs: tagTs.size ? tagTs : undefined };
    } catch {
      return none;
    }
  }, [key, failed, fxSeq]);
  const onFail = (e: unknown) => {
    console.warn('WebGL 효과를 못 그려서 CSS로 보여요', e);
    setFailed(key);
  };
  return { ts, tagTs, onFail };
}

// 설정 카드의 미리보기: 렌파이를 켜지 않고 이 줄의 글자 효과를 본다. 글자는 칸에 꽉 차게 맞춘다
export function LinePreview({ line, tagsOn }: { line: Line; tagsOn: boolean }) {
  const look = useGameFolder((s) => s.look);
  const [replay, setReplay] = useState(0);
  const cps = lineCps(line.say, tagsOn ? line.text : undefined) ?? look.textCps;
  // 값을 바꾸면 처음부터 다시 나온다
  return <PreviewBody key={[line.id, line.say?.effect, cps, replay, tagsOn ? shaderTags(line.text).join('|') : ''].join('|')} line={line} tagsOn={tagsOn} cps={cps} look={look} onReplay={() => setReplay((v) => v + 1)} />;
}

const PREVIEW_MIN = 11;
const PREVIEW_MAX = 60;

function PreviewBody({ line, tagsOn, cps, look, onReplay }: { line: Line; tagsOn: boolean; cps: number; look: GameLook; onReplay(): void }) {
  const text = line.text.trim() ? line.text : '효과 미리보기';
  const parsed = useMemo(() => parseTagged(text, tagsOn, gameFont), [text, tagsOn]);
  const { shown, click, fast, limit, holding } = useReveal(parsed, cps);
  const { ts, tagTs, onFail } = useShader(line.say?.effect, parsed);
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const style = line.say ?? {};

  // 칸에 들어가는 가장 큰 글자 크기를 찾는다. 아직 안 나온 글자도 자리를 차지해서 크기가 흔들리지 않는다
  useLayoutEffect(() => {
    const b = box.current;
    const t = inner.current;
    if (!b || !t) return;
    let lo = PREVIEW_MIN;
    let hi = PREVIEW_MAX;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      t.style.fontSize = mid + 'px';
      if (t.scrollHeight <= b.clientHeight && t.scrollWidth <= b.clientWidth) lo = mid;
      else hi = mid - 1;
    }
    t.style.fontSize = lo + 'px';
  }, [text, style.font, style.box, tagsOn]);

  return (
    <div
      ref={box}
      className="preview"
      title="클릭: 다시 보기"
      style={{ '--game-font': `${gameFont(look.font) ?? 'var(--font)'}, var(--font)` } as React.CSSProperties}
      onClick={() => click() || onReplay()}
    >
      <div
        ref={inner}
        className={'preview-text ' + (ts ? 'fx-gl' : fxClass(style.effect, fast)) + boxClass(style)}
        style={{ color: boxColor(style, look.textColor), '--txt': boxColor(style, look.textColor), fontFamily: fontStack(style.font), ...charTime(cps), ...boxTilt(style, !!ts) } as React.CSSProperties}
      >
        <Glyphs parsed={parsed} shown={shown} />
      </div>
      {ts && <FxCanvas target={inner} ts={ts} tagTs={tagTs} parsed={parsed} shown={shown} limit={limit} holding={holding} fast={fast} cps={cps} onFail={onFail} />}
      <button className="preview-again" title="다시 보기" onClick={(e) => (e.stopPropagation(), onReplay())}>↺</button>
    </div>
  );
}

// 대사창
export const SayBox = forwardRef<SayBoxHandle, {
  line: Line;
  who: { name: string; color?: string } | null;
  look: GameLook;
  tagsOn: boolean;
  wait: number;
  onDone(done: boolean): void;
  onNoWait(): void;
  onEdit(): void;
}>(function SayBox({ line, who, look, tagsOn, wait, onDone, onNoWait, onEdit }, ref) {
  const style = line.say ?? {};
  const parsed = useMemo(() => parseTagged(line.text, tagsOn, gameFont), [line.text, tagsOn]);
  const cps = lineCps(style, tagsOn ? line.text : undefined) ?? look.textCps;
  const { shown, done, click, fast, limit, holding } = useReveal(parsed, cps, wait);
  const { ts, tagTs, onFail } = useShader(style.effect, parsed);
  const sayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onDone(done);
    if (done && parsed.noWait) onNoWait();
  }, [done]);

  useImperativeHandle(ref, () => ({ click }));

  const size = style.size ?? look.textSize;
  const windowTop = (look.height - look.textboxHeight) * look.textboxYalign;
  return (
    <div
      className="textbox"
      title="클릭: 다음, 더블클릭: 이 줄 편집"
      onDoubleClick={(e) => (e.stopPropagation(), onEdit())}
      style={{
        top: windowTop,
        height: look.textboxHeight,
        backgroundImage: look.textbox ? `url(${look.textbox})` : undefined,
        backgroundColor: look.textbox ? undefined : 'rgba(0,0,0,.62)',
      }}
    >
      {who && (
        <div
          className="name"
          style={{
            left: style.name_x ?? look.nameX,
            top: style.name_y ?? look.nameY,
            fontSize: style.name_size ?? look.nameSize,
            color: style.name_color ?? who.color ?? look.textColor,
            fontFamily: fontStack(style.name_font),
            backgroundImage: look.namebox ? `url(${look.namebox})` : undefined,
          }}
        >
          {who.name}
        </div>
      )}
      <div
        ref={sayRef}
        className={'say ' + (ts ? 'fx-gl' : fxClass(style.effect, fast)) + boxClass(style)}
        style={{
          left: style.x ?? look.dialogueX,
          top: style.y ?? look.dialogueY,
          width: style.box ? undefined : look.dialogueWidth,
          maxWidth: style.box ? look.dialogueWidth : undefined,
          fontSize: size,
          color: boxColor(style, look.textColor),
          '--txt': boxColor(style, look.textColor),
          fontFamily: fontStack(style.font),
          ...charTime(cps),
          ...boxTilt(style, !!ts),
        } as React.CSSProperties}
      >
        <Glyphs parsed={parsed} shown={shown} />
      </div>
      {ts && <FxCanvas target={sayRef} ts={ts} tagTs={tagTs} parsed={parsed} shown={shown} limit={limit} holding={holding} fast={fast} cps={cps} onFail={onFail} />}
    </div>
  );
});
