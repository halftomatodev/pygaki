// 대사 미리보기: 글자 효과 카드의 미리보기와 [효과] 화면 샘플이 같이 쓴다 (예전 PyKaki 안 플레이 화면에서 남긴 부분)
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Line, SayStyle } from './types';
import { boxTail, lineCps } from './stage';
import { shaderTags } from './tagEdit';
import { parseTagged, type Tagged } from './textTags';
import { gameFont, useGameFolder, type GameLook } from './gameFolder';
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
