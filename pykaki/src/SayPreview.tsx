// 대사 미리보기: 글자 효과 카드의 미리보기와 [효과] 화면 샘플이 같이 쓴다 (예전 PyKaki 안 플레이 화면에서 남긴 부분)
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Line, SayStyle } from './types';
import { boxTail, isMovieFile, lineCps, mediaMasked } from './stage';
import { MaskMovie } from './maskVideo/MaskMovie';
import { shaderTags } from './tagEdit';
import { parseTagged, type Tagged } from './textTags';
import { useStore } from './store';
import { fillFlags } from './flags';
import { testVars, useFlagTest } from './flagUi';
import { fileUrl, gameFont, useGameFolder, type GameLook } from './gameFolder';
import { FxCanvas, webglOk } from './fx/FxCanvas';
import { parseTextShader, type TextShader } from './fx/textShaders';

// 줄마다 고른 글꼴. 못 읽으면 게임 기본 글꼴로 보인다
const fontStack = (path?: string) => {
  const f = gameFont(path);
  return f ? `${f}, var(--game-font)` : undefined;
};


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
  // {clear}(지우고 이어서): 그 뒤 글자가 나오기 시작하면 앞 글은 자리는 둔 채 안 보이게 (렌파이 원고도 같음, tagEdit.splitClear)
  const cut = parsed.clears.reduce((m, c) => (shown > c ? Math.max(m, c) : m), 0);
  return (
    <>
      {parsed.glyphs.map((g, i) =>
        i < cut && g.ch !== '\n' ? (
          <span key={i} data-i={i} className="ch on" style={{ ...g.style, visibility: 'hidden' }}>
            {g.ch}
          </span>
        ) : g.ch === '\n' ? (
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
// 그림/영상 상자 (FEATURE 24): 게임 폴더의 파일을 글 뒤에 깐다. 글에 맞춤이면 늘리고, 그림 크기 그대로면 가운데에
export function useGameFileUrl(path?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const seq = useGameFolder((s) => s.name);
  useEffect(() => {
    let live = true;
    setUrl(null);
    if (path) void fileUrl(path).then((u) => live && setUrl(u)).catch(() => {});
    return () => void (live = false);
  }, [path, seq]);
  return url;
}
// 자리·크기·회전(게임 안 편집 화면에서 받아 적은 값)은 글 가운데 기준으로 옮기고 돌린다
// 네 점 변형 (FEATURE 28): 가운데 기준 w×h 사각형의 네 모서리를 q(크기에 대한 비율)만큼 옮기는 CSS matrix3d. 플러그인 text_box.rpy quad_homography와 같은 식
export function quadMatrix(q: number[] | undefined, w: number, h: number): string {
  if (!q || q.length !== 8 || !q.some((n) => Math.abs(n) > 1e-4) || w < 1 || h < 1) return '';
  const rx = -w / 2, ry = -h / 2;
  const [x0, y0] = [rx + q[0] * w, ry + q[1] * h];
  const [x1, y1] = [rx + w + q[2] * w, ry + q[3] * h];
  const [x2, y2] = [rx + w + q[4] * w, ry + h + q[5] * h];
  const [x3, y3] = [rx + q[6] * w, ry + h + q[7] * h];
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = Math.abs(den) < 1e-9 ? 0 : (sx * dy2 - dx2 * sy) / den;
  const hh = Math.abs(den) < 1e-9 ? 0 : (dx1 * sy - sx * dy1) / den;
  const m = [[x1 - x0 + g * x1, x3 - x0 + hh * x3, x0], [y1 - y0 + g * y1, y3 - y0 + hh * y3, y0], [g, hh, 1]];
  const n = [[1 / w, 0, -rx / w], [0, 1 / h, -ry / h], [0, 0, 1]];
  const H = m.map((r) => [0, 1, 2].map((j) => r[0] * n[0][j] + r[1] * n[1][j] + r[2] * n[2][j]));
  return ` matrix3d(${[H[0][0], H[1][0], 0, H[2][0], H[0][1], H[1][1], 0, H[2][1], 0, 0, 1, 0, H[0][2], H[1][2], 0, H[2][2]].join(',')})`;
}

export function MediaBg({ path, fit, x, y, zoom, angle, mask, alpha, quad }: { path?: string; fit?: 'image'; x?: number; y?: number; zoom?: number; angle?: number; mask?: boolean; alpha?: number; quad?: number[] }) {
  const url = useGameFileUrl(path);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const measure = (el: HTMLElement | null) => {
    if (!el || !quad) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w !== size[0] || h !== size[1]) requestAnimationFrame(() => setSize([w, h]));
  };
  if (!url) return null;
  const cls = 'media-bg' + (fit === 'image' ? ' natural' : '');
  const move = `translate(${x ?? 0}px, ${y ?? 0}px) rotate(${angle ?? 0}deg) scale(${zoom ?? 1})` + quadMatrix(quad, size[0], size[1]);
  const style = { transform: fit === 'image' ? `translate(-50%, -50%) ${move}` : move, opacity: alpha ?? 1 };
  // 투명 영상(왼쪽 색 + 오른쪽 투명도)은 두 쪽을 합쳐서 보여 준다
  if (mediaMasked(path, mask)) return <MaskMovie src={url} className={cls} style={style} />;
  return isMovieFile(path) ? <video ref={measure} className={cls} style={style} src={url} autoPlay loop muted playsInline /> : <img ref={measure} className={cls} style={style} src={url} alt="" />;
}
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
  const project = useStore((s) => s.project);
  const vals = useFlagTest((s) => s.vals);
  // 플래그 값 [이름]은 처음 값(시험 값이 있으면 그 값)으로
  const text = line.text.trim() ? (project.variables.length ? fillFlags(line.text, testVars(project, vals)) : line.text) : '효과 미리보기';
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
        {style.box === 'media' && <MediaBg path={style.media} fit={style.media_fit} x={style.media_x} y={style.media_y} zoom={style.media_zoom} angle={style.media_angle} mask={style.media_mask} alpha={style.media_alpha} quad={style.media_quad} />}
        <Glyphs parsed={parsed} shown={shown} />
      </div>
      {ts && <FxCanvas target={inner} ts={ts} tagTs={tagTs} parsed={parsed} shown={shown} limit={limit} holding={holding} fast={fast} cps={cps} onFail={onFail} />}
      <button className="preview-again" title="다시 보기" onClick={(e) => (e.stopPropagation(), onReplay())}>↺</button>
    </div>
  );
}
