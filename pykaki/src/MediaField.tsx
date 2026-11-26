// 그림/영상 파일 칸 (FEATURE 24): 대사·선택지 뒤에 까는 파일 (game 기준 경로).
// 글로 치거나 [📂]로 고름(앱). game 밖 파일은 묻고 game/images 또는 game/movies로 복사한다
import { useState } from 'react';
import { desktop } from './desktop';
import { shaderEffect } from './fx/textShaders';
import { TransPicker } from './TransPicker';
import { openMaskDialog } from './MaskVideoDialog';
import { scanFolder } from './gameFolder';
import { effectKnobs, knobNum, knobText, formatImageFx, hasQuad, isMovieFile, parseImageFx, type EffectKnob } from './stage';
import { useStore } from './store';

export async function pickMediaFile(): Promise<string | null> {
  const r = await desktop?.pickFile?.('image').catch((e) => (alert('파일을 고르지 못했어요: ' + e.message), null));
  if (!r) return null;
  if (r.rel) return r.rel;
  const dir = isMovieFile(r.name) ? 'movies' : 'images';
  if (!r.token || !confirm(`${r.name}은(는) 이 게임 폴더 밖에 있어요. game/${dir} 폴더로 복사해서 쓸까요?`)) return null;
  try {
    const rel = await desktop!.importFile!(r.token, dir);
    await scanFolder().catch(() => {});
    useStore.getState().say(`${rel}(으)로 복사했어요`);
    return rel;
  } catch (e: any) {
    alert('파일을 복사하지 못했어요: ' + e.message);
    return null;
  }
}

// pygaki editor에서 정한 그림의 자리·크기·회전. 보여 주고 지우기만 한다
export function MediaPlace({ m, onClear }: { m: { x?: number; y?: number; zoom?: number; angle?: number }; onClear: () => void }) {
  // 화면 글 사전이 글 조각마다 바꾸므로 조각을 따로 둔다
  const parts: string[] = [];
  if (m.x || m.y) parts.push(`옮김 ${m.x ?? 0}, ${m.y ?? 0}`);
  if (m.zoom && m.zoom !== 1) parts.push(`${m.zoom}배`);
  if (m.angle) parts.push(`${m.angle}도`);
  if (!parts.length)
    return <span className="sf-pos sf-hint" title="게임 안 pygaki editor(F9)에서 그림을 끌어 옮기고, 휠로 키우고, Q/E로 돌려요. 저장하면 여기로 받아 적어요">자리·크기는 게임에서</span>;
  return (
    <span className="sf-pos" title="게임 안 pygaki editor에서 정한 그림 자리·크기·회전이에요. 글 가운데 기준이에요">
      <span>그림</span>
      {parts.map((t) => <span key={t}>{t}</span>)}
      <button title="그림 자리·크기·회전 지우기" onClick={onClear}>✕</button>
    </span>
  );
}

export function MediaField({ value, onChange, placeholder, title }: { value?: string; onChange: (v: string | undefined) => void; placeholder: string; title: string }) {
  return (
    <>
      <input className="sf-in" value={value ?? ''} placeholder={placeholder} title={title} spellCheck={false} onChange={(e) => onChange(e.target.value.trim() || undefined)} />
      {desktop?.pickFile && (
        <button title="탐색기 창에서 그림·영상 파일을 골라요" onClick={() => void pickMediaFile().then((rel) => rel && onChange(rel))}>
          📂
        </button>
      )}
      {desktop?.pickMaskSource && (
        <button title="투명 영상 만들기: 투명 webm, GIF, PNG 연속 그림, 초록 화면 영상을 렌파이가 쓰는 투명 영상으로 바꿔 이 칸에 넣어요" onClick={() => openMaskDialog((rel) => onChange(rel))}>
          🎞
        </button>
      )}
      {value && (
        <button title="지우기" onClick={() => onChange(undefined)}>
          ✕
        </button>
      )}
    </>
  );
}

// 글 상자 묶기·네 점 변형·그림 효과 (FEATURE 28). 대사·선택지가 같이 씀.
// 🔗 단추로 글을 그림에 묶고(묶을 때의 그림 크기·회전·옮김을 적어 둠), 네 점 변형은 pygaki editor에서 정해 받아 적은 것을 보여 주고 지우기만,
// 그림 효과는 나타나는 방식과 같은 고르기 창(렌파이 기본 전환은 빼고)과 [세부 값] 막대
export interface MediaGroup { link?: number[]; quad?: number[]; text_quad?: number[]; fx?: string }
export function MediaGroupFields({ g, place, onChange, old }: { g: MediaGroup; place: { x?: number; y?: number; zoom?: number; angle?: number }; onChange: (fn: (g: MediaGroup) => void, key?: string) => void; old?: boolean }) {
  const [open, setOpen] = useState(false);
  const linked = !!g.link;
  const warped = hasQuad(g.quad) || hasQuad(g.text_quad);
  const use = parseImageFx(g.fx);
  const fx = use ? shaderEffect(use.name) : undefined;
  const knobs: EffectKnob[] = use && fx?.kind === 'transition'
    ? [{ key: 'time', label: '걸리는 시간(초)', kind: 'num', min: 0.1, max: 3, step: 0.1, def: String(fx.time) }, ...effectKnobs(use.name).map((k) => ({ ...k, key: k.key.replace(/^u__/, '') }))]
    : [];
  const cur = (key: string) => (key === 'time' ? use?.time : use?.args.find(([k]) => k === key)?.[1]);
  const changed = knobs.filter((k) => cur(k.key) !== undefined).length;
  const putKnob = (key: string, v: string | undefined) =>
    onChange((m) => {
      const u = parseImageFx(m.fx);
      if (!u) return;
      if (key === 'time') u.time = v;
      else {
        u.args = u.args.filter(([k]) => k !== key);
        if (v !== undefined) u.args.push([key, v]);
      }
      m.fx = formatImageFx(u);
    }, 'mfx' + key);
  return (
    <>
      <div className="sf-row media-row">
        <button
          className={'media-link' + (linked ? ' on' : '')}
          aria-pressed={linked}
          title={linked
            ? '글이 그림에 묶여 있어요. 그림의 크기, 회전, 옮김, 네 점 변형, 그림 효과를 글도 같이 받아요. 누르면 풀어요'
            : '글을 그림에 묶어요. 지금 그림 값을 기준으로, 그 뒤로 바꾼 크기, 회전, 옮김, 네 점 변형, 그림 효과를 글도 같이 받아요'}
          onClick={() => onChange((m) => {
            if (m.link) delete m.link;
            else m.link = [place.zoom ?? 1, place.angle ?? 0, place.x ?? 0, place.y ?? 0];
          })}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M6.6 9.4a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.9.9M9.4 6.6a3 3 0 0 0-4.2 0L2.9 8.9a3 3 0 0 0 4.2 4.2l.9-.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {linked ? '글 묶음' : '글 묶기'}
        </button>
        {warped ? (
          <span className="sf-pos" title="게임 안 pygaki editor(F9)에서 모서리 점을 끌어 정한 네 점 변형이에요">
            <span>네 점 변형</span>
            {hasQuad(g.quad) && <span>그림</span>}
            {hasQuad(g.text_quad) && <span>글</span>}
            <button title="네 점 변형 지우기" onClick={() => onChange((m) => { delete m.quad; delete m.text_quad; })}>✕</button>
          </span>
        ) : (
          <span className="sf-pos sf-hint" title="게임 안 pygaki editor(F9) [그림]에서 모서리 점(분홍 그림, 하늘색 글)을 끌면 네 점 변형이 돼요. 저장하면 여기로 받아 적어요">네 점 변형은 게임에서</span>
        )}
      </div>
      <div className="sf-row media-row">
        <span className="sf-lab" title="글 상자가 나타날 때의 그림 효과예요. 묶었으면 글도 같이 받아요">나타날 때</span>
        <TransPicker noBasic value={g.fx} onPick={(v) => onChange((m) => void (v ? (m.fx = v) : delete m.fx))} />
        {knobs.length > 0 && (
          <button className={'fx-more' + (open ? ' on' : '')} title="이 그림 효과의 걸리는 시간과 세부 값을 막대로 고쳐요" onClick={() => setOpen(!open)}>
            세부 값{changed ? ` (${changed})` : ''}
          </button>
        )}
        {old && (linked || warped || g.fx) && <span className="sf-hint" title="게임의 pygaki 플러그인이 예전 판이라 이 값은 내보내지 않아요. 런처의 [플러그인 올리기]로 올려 주세요">플러그인 올려야 함</span>}
      </div>
      {open && knobs.length > 0 && (
        <div className="fx-knobs sf-knobs">
          {knobs.map((k) => {
            const c = cur(k.key);
            const v = c ?? k.def;
            return (
              <label key={k.key} className={c !== undefined ? 'set' : ''}>
                <span className="fx-kn" title={k.key}>{k.label}</span>
                {k.kind === 'color' ? (
                  <input type="color" value={v.slice(0, 7)} onChange={(e) => putKnob(k.key, e.target.value)} />
                ) : (
                  <>
                    <input type="range" min={k.min} max={k.max} step={k.step} value={knobNum(v)} onChange={(e) => putKnob(k.key, knobText(k, Number(e.target.value)))} />
                    <span className="fx-kv">{knobNum(v)}</span>
                  </>
                )}
                <button className="fx-x" style={{ visibility: c !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), putKnob(k.key, undefined))}>↺</button>
              </label>
            );
          })}
        </div>
      )}
    </>
  );
}
