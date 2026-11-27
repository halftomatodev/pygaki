// 상자 안 편집과 오른쪽 편집 탭이 함께 쓰는 줄 입력 부품
import { useState } from 'react';
import { useStore } from './store';
import * as ops from './ops';
import type { ImageKind, Line, LineFx, SayStyle } from './types';
import { shaderEffect } from './fx/textShaders';
import { BOXES, EFFECTS, effectKnobs, R86_TIP, knobNum, knobText, formatEffect, formatImageFx, parseEffect, parseImageFx, type EffectKnob, type EffectPart, FX_BASE, TAILS, FX_CURSOR, FX_OVERLAY, FX_TRANS, FX_WARP, isMaskName, isMovieFile, mediaMasked, POSITIONS, SHAKES, STAGE_LABEL, STAGE_TYPES, DEFAULT_FADEOUT, fxArgs, imageName, stageCode } from './stage';
import { useGameFolder } from './gameFolder';
import { LinePreview } from './SayPreview';
import { TransPicker } from './TransPicker';
import { TagBar, useTagTarget } from './TagBar';
import { MediaField, MediaGroupFields, MediaPlace } from './MediaField';
import { uid } from './util';
import { freeFlagName } from './flagRecipes';
import { canInput, flagUi, uiMax, uiMin } from './flagUi';
import { FontSelect } from './FontSelect';

type SetLine = (fn: (x: Line) => void, key?: string) => void;

// 줄 종류(화자) 고르기는 LineTypeMenu.tsx (세션 90, 끈적하게 펼쳐지는 세 칸)
export { SpeakerSelect } from './LineTypeMenu';

// 예전 판에서 대사 줄에 넣은 표정(attr). 대사 줄은 글만 고치고, 표정 그림은 [그림, 영상] 카드에서 보이기 줄로 넣는다.
// 예전 값은 내보내기에 그대로 남고, 여기서 눌러 뺄 수 있다
export function OldAttr({ attr, clear }: { attr: string; clear: () => void }) {
  return (
    <button className="nodrag old-attr" title={`예전에 이 대사 줄에 넣은 표정이에요 (${attr}). 표정은 [그림, 영상] 카드에서 그림 줄로 넣어요. 누르면 이 줄에서 빼요`} onClick={clear}>
      표정 {attr} ✕
    </button>
  );
}

// 연출 줄의 입력칸. 명령을 몰라도 고르고 채우기만 하면 된다
// 대사 줄과 화면 효과 줄이 함께 쓰는 showpy 값 칸
export function FxFields({ l, set, nd = '' }: { l: Line; set: SetLine; nd?: string }) {
  const f = l.fx ?? {};
  const sel = (key: Exclude<keyof LineFx, 'exclude'>, items: [string, string][], title: string) => (
    <select
      className={nd}
      title={title}
      value={f[key] ?? ''}
      onChange={(e) =>
        set((x) => {
          const v = { ...(x.fx ?? {}) };
          if (e.target.value) v[key] = e.target.value;
          else delete v[key];
          if (Object.keys(v).length) x.fx = v;
          else delete x.fx;
        })
      }
    >
      {items.map(([k, t]) => (
        <option key={k} value={k}>{t}</option>
      ))}
    </select>
  );
  return (
    <>
      {sel('fx', FX_BASE, '화면 효과')}
      {sel('transition', FX_TRANS, '전환')}
      {sel('overlay', FX_OVERLAY, 'VHS 덮개')}
      {sel('warp', FX_WARP, '덮개 휘어짐')}
      {sel('cursor', FX_CURSOR, '커서 자리')}
    </>
  );
}

// 대사 줄의 글자 모양 칸. 위치는 showpy 편집기에서 받아 적은 값을 보여 주기만 한다
export function SayFields({ l, set }: { l: Line; set: SetLine }) {
  const s = l.say ?? {};
  useGameFolder((f) => f.fxSeq); // 효과 폴더를 다시 읽으면 효과 목록도 다시 그린다
  const put = (key: keyof SayStyle, v: string | number | undefined, mergeKey?: string) =>
    set((x) => {
      const say: SayStyle = { ...(x.say ?? {}) };
      if (v === undefined || v === '') delete say[key];
      else (say as Record<string, unknown>)[key] = v;
      if (Object.keys(say).length) x.say = say;
      else delete x.say;
    }, mergeKey);
  // 등장 효과 1번, 2번: 두 효과가 같이 돈다 ("앞|뒤", 렌파이 텍스트 셰이더 문법). 값은 "이름:u__값=…"
  const parts = parseEffect(s.effect);
  const [openKnobs, setOpenKnobs] = useState<Record<number, boolean>>({});
  const putParts = (next: EffectPart[], mergeKey?: string) => put('effect', formatEffect(next), mergeKey);
  const pickFx = (i: number, name: string) => {
    const next = parts.slice(0, 2);
    if (!name) next.splice(i, 1);
    else next[i] = { name, args: [] };
    putParts(next);
  };
  // v가 undefined면 그 값을 지워 기본값으로
  const putArg = (i: number, key: string, v: string | undefined) => {
    const next = parts.map((p) => ({ ...p, args: [...p.args] }));
    const args = next[i].args.filter(([k]) => k !== key);
    if (v !== undefined) args.push([key, v]);
    next[i].args = args;
    putParts(next, `fx${i}${key}${l.id}`);
  };
  const fxSlot = (i: number) => {
    const p = parts[i];
    if (i === 1 && !parts[0]) return null;
    const other = parts[1 - i]?.name;
    const knobs = p ? effectKnobs(p.name) : [];
    const changed = p ? p.args.filter(([k]) => k).length : 0;
    return (
      <div className="fx-slot" key={i}>
        <div className="fx-head">
          <span className="fx-no">{`${i + 1}번`}</span>
          <select title={i ? '2번 효과: 1번과 같이 돌아요 (렌파이 effect="앞|뒤")' : '등장 효과'} value={p?.name ?? ''} onChange={(e) => pickFx(i, e.target.value)}>
            <option value="">{i ? '없음 (겹치지 않음)' : '효과 없음'}</option>
            {EFFECTS.filter(([k]) => k && k !== other).map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
            {p && !EFFECTS.some(([k]) => k === p.name) && <option value={p.name}>{p.name}</option>}
          </select>
          {p && knobs.length > 0 && (
            <button className={'fx-more' + (openKnobs[i] ? ' on' : '')} title="이 효과의 세부 값을 막대로 고쳐요" onClick={() => setOpenKnobs((o) => ({ ...o, [i]: !o[i] }))}>
              세부 값{changed ? ` (${changed})` : ''}
            </button>
          )}
          {p && <button className="fx-x" title={`${i + 1}번 효과 빼기`} onClick={() => pickFx(i, '')}>✕</button>}
        </div>
        {p && openKnobs[i] && knobs.length > 0 && (
          <div className="fx-knobs">
            {knobs.map((k) => {
              const set = p.args.find(([key]) => key === k.key)?.[1];
              const v = set ?? k.def;
              return (
                <label key={k.key} className={set !== undefined ? 'set' : ''}>
                  <span className="fx-kn" title={k.key}>{k.label}</span>{k.r86 && <span className="fx-86" title={R86_TIP}>8.6</span>}
                  {k.kind === 'color' ? (
                    <input type="color" value={v.slice(0, 7)} onChange={(e) => putArg(i, k.key, e.target.value)} />
                  ) : k.toggle ? (
                    <input type="checkbox" checked={knobNum(v) !== 0} onChange={(e) => putArg(i, k.key, e.target.checked ? '1.0' : undefined)} />
                  ) : (
                    <>
                      <input type="range" min={k.min} max={k.max} step={k.step} value={knobNum(v)} onChange={(e) => putArg(i, k.key, knobText(k, Number(e.target.value)))} />
                      <span className="fx-kv">{knobNum(v)}</span>
                    </>
                  )}
                  <button className="fx-x" style={{ visibility: set !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), putArg(i, k.key, undefined))}>↺</button>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const num = (key: 'size' | 'cps' | 'name_size', placeholder: string, title: string, max: number) => (
    <input
      type="number"
      className="sf-num"
      min={1}
      max={max}
      title={title}
      placeholder={placeholder}
      value={s[key] ?? ''}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value));
        put(key, n > 0 ? Math.min(n, max) : undefined, key + l.id);
      }}
    />
  );
  const color = (key: 'color' | 'name_color', title: string) => (
    <span className="sf-color">
      <input type="color" title={title} value={s[key] ?? '#ffffff'} onChange={(e) => put(key, e.target.value, key + l.id)} />
      {s[key] && <button title={title + ' 지우기'} onClick={() => put(key, undefined)}>✕</button>}
    </span>
  );
  const font = (key: 'font' | 'name_font', title: string) => (
    <FontSelect className="sf-in" title={title} empty={key === 'font' ? '글꼴: 기본' : '이름 글꼴: 기본'} value={s[key]} onSet={(v) => put(key, v)} />
  );
  const pos = (x: 'x' | 'name_x', y: 'y' | 'name_y', what: string) =>
    s[x] !== undefined || s[y] !== undefined ? (
      <span className="sf-pos" title={`게임 안 pygaki editor에서 정한 ${what} 위치예요. 대사창 왼쪽 위 기준이에요.`}>
        {what} 위치 {s[x] ?? '-'}, {s[y] ?? '-'}
        <button
          title="위치 지우기"
          onClick={() =>
            set((v) => {
              const say: SayStyle = { ...(v.say ?? {}) };
              delete say[x];
              delete say[y];
              if (Object.keys(say).length) v.say = say;
              else delete v.say;
            })
          }
        >✕</button>
      </span>
    ) : null;
  const posWhat = pos('x', 'y', '대사');
  const posName = pos('name_x', 'name_y', '이름');
  return (
    <>
      <div className="sf-row">
        {num('size', '크기', '글자 크기', 200)}
        {color('color', '글자 색')}
        {font('font', '글꼴 파일')}
      </div>
      <div className="fx-slots">
        {fxSlot(0)}
        {fxSlot(1)}
      </div>
      <BoxFields l={l} set={set} />
      {l.type === 'say' && (
        <div className="sf-row">
          {num('name_size', '이름 크기', '이름 글자 크기', 200)}
          {color('name_color', '이름 색')}
          {font('name_font', '이름 글꼴 파일')}
        </div>
      )}
      {(posWhat || posName) && <div className="sf-row">{posWhat}{posName}</div>}
    </>
  );
}

// 글 상자 칸 (말풍선, 둥근 테두리, 그림/영상): 오른쪽 편집 탭과 상자 안 편집의 태그 상자가 함께 쓴다
export function BoxFields({ l, set }: { l: Line; set: SetLine }) {
  const s = l.say ?? {};
  const oldGroup = useGameFolder((f) => f.mediaGroup === false);
  const put = (key: keyof SayStyle, v: string | number | undefined, mergeKey?: string) =>
    set((x) => {
      const say: SayStyle = { ...(x.say ?? {}) };
      if (v === undefined || v === '') delete say[key];
      else (say as Record<string, unknown>)[key] = v;
      if (Object.keys(say).length) x.say = say;
      else delete x.say;
    }, mergeKey);
  // 상자를 없애면 꼬리, 기울기도 지운다
  const putBox = (b: string) =>
    set((x) => {
      const say: SayStyle = { ...(x.say ?? {}) };
      if (b) say.box = b;
      else {
        delete say.box;
        delete say.tail;
        delete say.box_rotate;
      }
      // 그림/영상 상자의 값은 그 상자일 때만, 말풍선 꼬리는 그림 상자에 없음
      if (b !== 'media') for (const k of ['media', 'media_fit', 'media_x', 'media_y', 'media_zoom', 'media_angle', 'media_mask', 'media_alpha', 'media_link', 'media_quad', 'media_text_quad', 'media_fx'] as const) delete say[k];
      else delete say.tail;
      if (Object.keys(say).length) x.say = say;
      else delete x.say;
    });
  return (
    <>
      <div className="sf-row">
        <select title="글 상자: 대사 글을 둘러싸는 상자 (pygaki 플러그인이 있어야 내보내요)" value={s.box ?? ''} onChange={(e) => putBox(e.target.value)}>
          {BOXES.map(([k, t]) => (
            <option key={k} value={k}>{t}</option>
          ))}
        </select>
        {s.box && (
          <>
            {s.box !== 'media' && <select title="말풍선 꼬리 방향" value={s.tail ?? ''} onChange={(e) => put('tail', e.target.value)}>
              {TAILS.map(([k, t]) => (
                <option key={k} value={k}>{t}</option>
              ))}
            </select>}
            <input
              type="number"
              className="sf-num"
              min={-45}
              max={45}
              title="상자와 글 기울기 (도). 0이면 똑바로"
              placeholder="기울기"
              value={s.box_rotate ?? ''}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                put('box_rotate', n ? Math.max(-45, Math.min(45, n)) : undefined, 'box_rotate' + l.id);
              }}
            />
          </>
        )}
      </div>
      {s.box === 'media' && (
        <div className="sf-row media-row">
          <MediaField value={s.media} placeholder="그림·영상 파일 (예: images/say/cloud.png)" title="글 뒤에 깔 그림이나 영상 (game 폴더 기준). 기본 대사창과 이름 칸 배경은 없어져요" onChange={(v) => put('media', v, 'media' + l.id)} />
          <select title="그림 크기" value={s.media_fit ?? ''} onChange={(e) => set((x) => {
            const say: SayStyle = { ...(x.say ?? {}) };
            if (e.target.value === 'image') say.media_fit = 'image';
            else delete say.media_fit;
            delete say.media_zoom; // 글에 맞춤과 그림 크기 그대로는 배율 뜻이 달라서
            x.say = say;
          })}>
            <option value="">글에 맞춤</option>
            <option value="image">그림 크기 그대로</option>
          </select>
          <MediaPlace m={{ x: s.media_x, y: s.media_y, zoom: s.media_zoom, angle: s.media_angle }} onClear={() => set((x) => {
            const say: SayStyle = { ...(x.say ?? {}) };
            for (const k of ['media_x', 'media_y', 'media_zoom', 'media_angle'] as const) delete say[k];
            x.say = say;
          })} />
        </div>
      )}
      {s.box === 'media' && (
        <MediaGroupFields
          g={{ link: s.media_link, quad: s.media_quad, text_quad: s.media_text_quad, fx: s.media_fx }}
          place={{ x: s.media_x, y: s.media_y, zoom: s.media_zoom, angle: s.media_angle }}
          old={oldGroup}
          onChange={(fn, key) => set((x) => {
            const say: SayStyle = { ...(x.say ?? {}) };
            const g = { link: say.media_link, quad: say.media_quad, text_quad: say.media_text_quad, fx: say.media_fx };
            fn(g);
            const put = <K extends 'media_link' | 'media_quad' | 'media_text_quad' | 'media_fx'>(k: K, v: SayStyle[K]) => (v === undefined ? delete say[k] : (say[k] = v));
            put('media_link', g.link);
            put('media_quad', g.quad);
            put('media_text_quad', g.text_quad);
            put('media_fx', g.fx);
            x.say = say;
          }, key && key + l.id)}
        />
      )}
      {s.box === 'media' && s.media && (
        <div className="sf-row media-row">
          {isMovieFile(s.media) && (
            <label className="sf-check" title="왼쪽에 색, 오른쪽에 투명도(흰색이 보이는 곳)를 담은 영상이에요. 이름이 mask_로 시작하면 저절로 켜져요. 투명 webm은 [🎞]로 바꿔요">
              <input
                type="checkbox"
                checked={mediaMasked(s.media, s.media_mask)}
                onChange={(e) => set((x) => {
                  const say: SayStyle = { ...(x.say ?? {}) };
                  // 이름으로 정해지는 값과 같으면 적지 않는다
                  if (e.target.checked === isMaskName(say.media)) delete say.media_mask;
                  else say.media_mask = e.target.checked;
                  x.say = say;
                })}
              />
              투명 영상
            </label>
          )}
          <input
            type="number"
            className="sf-num"
            min={0}
            max={1}
            step={0.1}
            title="그림 투명도 (0 ~ 1). 비우면 1, 0이면 안 보여요"
            placeholder="투명도"
            value={s.media_alpha ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : Math.max(0, Math.min(1, Number(e.target.value)));
              put('media_alpha', v === undefined || v >= 1 || isNaN(v) ? undefined : Math.round(v * 100) / 100, 'media_alpha' + l.id);
            }}
          />
        </div>
      )}
    </>
  );
}

// 오른쪽 편집 탭의 글자 효과 칸. 글 칸에는 글만 남기려고 줄 밖으로 뺐고, 집중 모드에서는 패널과 함께 숨는다
// 화면 효과는 렌파이 편집기에서 고치고, 여기서는 받아 적은 값을 보여 주기만 한다
export function LineLook({ l, set }: { l: Line; set: SetLine }) {
  const fx = fxArgs(l.fx);
  const tagsOn = useStore((s) => s.project.settings.allowTextTags);
  const tagHere = useTagTarget((s) => s.id === 'ed-' + l.id);

  return (
    <div className="look">
      {tagHere && <TagBar targetId={'ed-' + l.id} className="tagbar-look" />}
      <LinePreview line={l} tagsOn={tagsOn} />
      {l.say?.effect && <EffectClip effect={l.say.effect} />}
      <SayFields l={l} set={set} />
      {fx.length > 0 && <div className="sf-pos" title="렌파이 편집기의 대사 탭에서 고쳐요">{fx.join(', ')}</div>}
    </div>
  );
}

// 렌파이 견본: 효과마다 렌파이에서 찍어 둔 짧은 영상 (public/effects, tools/record_effect_clips.py로 만듦)
function EffectClip({ effect }: { effect: string }) {
  const [missing, setMissing] = useState<string | null>(null);
  const name = effect.split('|')[0].split(':')[0];
  if (missing === name) return null;
  return (
    <div className="clip" title="렌파이에서 찍은 견본이에요. 문장은 예시예요">
      <video key={name} src={`effects/${name}.webm`} autoPlay loop muted playsInline onError={() => setMissing(name)} />
      <span>렌파이 견본</span>
    </div>
  );
}

// 연결한 game 폴더의 파일 이름을 칸의 추천 목록으로
function useSuggest(l: Line) {
  const media = useGameFolder((s) => s.media);
  useGameFolder((s) => s.fxSeq);
  const chars = useStore((s) => s.project.characters);
  const words = (n: string) => n.split(' ');
  const bg = media.images.filter((n) => words(n)[0] === 'bg' && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  const attr = media.images.filter((n) => words(n)[0] === l.who && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  const etc = media.images.filter((n) => words(n)[0] !== 'bg' && !chars.some((c) => c.id === words(n)[0]));
  return { bg, attr, etc, audio: media.audio };
}

// 플래그 입력 줄 (FEATURE 30, 31): 묻는 글과 넣을 플래그(글자·숫자). 최대 글자 수·범위는 플래그 카드의 [꼴 ▾] 입력칸에서
export function InputFields({ l, set, nd = '' }: { l: Line; set: SetLine; nd?: string }) {
  const flags = useStore((s) => s.project.variables);
  const update = useStore((s) => s.update);
  const can = flags.filter(canInput);
  const cur = flags.find((f) => f.id === l.flag);
  // 칠 플래그가 없을 때: "주인공 이름" 플래그(입력칸 꼴)를 만들어 바로 고름
  const make = () => {
    const id = uid('v');
    update((p) => {
      p.variables.push({ id, name: freeFlagName(p, 'pname'), kind: 'str', init: '주인공', note: '주인공 이름', ui: { look: 'input', len: 12 } });
      for (const n of p.nodes) for (const x of n.lines) if (x.id === l.id) x.flag = id;
    });
  };
  const hint = !cur ? '' : cur.kind === 'int' ? `숫자만, ${uiMin(flagUi(cur))}~${uiMax(flagUi(cur))}. 잘못 치면 값 그대로` : `안 치면 "${String(cur.init ?? '')}". 대사에서 [${cur.name}]`;
  return (
    <div className="sf">
      <div className="sf-row">
        <select className={nd} value={cur ? cur.id : ''} onChange={(e) => (e.target.value === '+' ? make() : set((x) => void (x.flag = e.target.value || undefined)))} aria-label="넣을 플래그" title="플레이어가 친 값을 이 플래그에 넣어요 (글자·숫자 플래그)">
          <option value="">넣을 플래그</option>
          {can.map((f) => <option key={f.id} value={f.id}>{f.name}{f.note ? ` (${f.note})` : ''}</option>)}
          {cur && !canInput(cur) && <option value={cur.id}>? {cur.name} (켜짐/꺼짐은 못 침)</option>}
          <option value="+">+ 새 이름 플래그</option>
        </select>
        <input className={'sf-in wide ' + nd} value={l.text} placeholder="묻는 글 (예: 이름이 뭐야?)" onChange={(e) => set((x) => void (x.text = e.target.value), 'text' + l.id)} aria-label="묻는 글" />
      </div>
      {cur ? <span className="sf-code">{hint}</span> : <span className="sf-code todo">친 값을 넣을 플래그를 골라 주세요</span>}
    </div>
  );
}

export function StageFields({ l, set, firstId, nd = '' }: { l: Line; set: SetLine; firstId?: string; nd?: string }) {
  const chars = useStore((s) => s.project.characters);
  const linked = useStore((s) => !!s.project.settings.renpyLink);
  const sug = useSuggest(l);
  const [picOpen, setPicOpen] = useState(false);
  const kind = l.kind ?? 'char';
  const screens = useStore((s) => s.project.screens);
  const { code, problem } = stageCode(l, screens);
  const listId = (k: string) => (useGameFolder.getState().name ? `sug-${k}-${l.id}` : undefined);
  const field = (k: 'image' | 'attr' | 'file', placeholder: string, id?: string, cls = '') => (
    <>
      <input id={id} list={listId(k)} className={nd + ' sf-in ' + cls} placeholder={placeholder} value={l[k] ?? ''} onChange={(e) => set((x) => void (x[k] = e.target.value), k + l.id)} />
      {listId(k) && (
        <datalist id={listId(k)}>
          {(k === 'file' ? sug.audio : k === 'attr' ? sug.attr : l.type === 'scene' || kind === 'bg' ? sug.bg : sug.etc).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
    </>
  );
  const pick = (items: [string, string][], v: string | undefined, fn: (x: Line, v: string) => void, title: string) => (
    <select className={nd} title={title} value={v ?? ''} onChange={(e) => set((x) => fn(x, e.target.value))}>
      {items.map(([k, t]) => (
        <option key={k} value={k}>{t}</option>
      ))}
      {/* showpy에서 넣은 전환(stage.move 등)처럼 목록에 없는 값도 그대로 보여 준다 */}
      {v && !items.some(([k]) => k === v) && <option value={v}>{v}</option>}
    </select>
  );
  // 초·숫자 칸: 비우면 값을 지운다 (처음 값으로)
  const numIn = (k: 'fadein' | 'fadeout' | 'secs' | 'zorder' | 'from' | 'seek', placeholder: string, title: string, o: { min?: number; max?: number; step?: number } = {}) => (
    <input
      type="number"
      className={nd + ' sf-num sf-sec'}
      min={o.min ?? 0}
      max={o.max ?? 60}
      step={o.step ?? 0.1}
      title={title}
      placeholder={placeholder}
      value={l[k] ?? ''}
      onChange={(e) =>
        set((x) => {
          const t = e.target.value.trim();
          const n = Number(t);
          if (t === '' || !Number.isFinite(n)) {
            if (k === 'seek') x.seek = 0; // 자리 옮기기 줄은 비우면 0초 (지우면 틀기 줄이 됨)
            else delete x[k];
          }
          else x[k] = Math.max(o.min ?? 0, Math.min(o.max ?? 60, k === 'zorder' ? Math.round(n) : Math.round(n * 100) / 100));
        }, k + l.id)
      }
    />
  );
  const kindSel = pick([['char', '캐릭터'], ['bg', '배경'], ['etc', '기타']], kind, (x, v) => void (x.kind = v as ImageKind), '이미지 종류');
  const charSel = (
    <select id={firstId} className={nd + (l.who ? '' : ' invalid')} value={l.who ?? ''} onChange={(e) => set((x) => void (x.who = e.target.value || undefined))}>
      <option value="">캐릭터 선택</option>
      {chars.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
      {l.who && !chars.some((c) => c.id === l.who) && <option value={l.who}>? {l.who}</option>}
    </select>
  );
  // 그림 효과(img_fx.use)는 목록에 값을 뗀 이름으로 보이고, 걸리는 시간과 세부 값은 [세부 값] 막대로 고친다
  const picUse = parseImageFx(l.trans);
  const picFx = picUse ? shaderEffect(picUse.name) : undefined;
  const picKnobs: EffectKnob[] = picUse && picFx?.kind === 'transition'
    ? [{ key: 'time', label: '걸리는 시간(초)', kind: 'num', min: 0.1, max: 3, step: 0.1, def: String(picFx.time) }, ...effectKnobs(picUse.name).map((k) => ({ ...k, key: k.key.replace(/^u__/, '') }))]
    : [];
  const picSet = (key: string) => (key === 'time' ? picUse?.time : picUse?.args.find(([k]) => k === key)?.[1]);
  const picChanged = picKnobs.filter((k) => picSet(k.key) !== undefined).length;
  const putPic = (key: string, v: string | undefined) =>
    set((x) => {
      const u = parseImageFx(x.trans);
      if (!u) return;
      if (key === 'time') u.time = v;
      else {
        u.args = u.args.filter(([k]) => k !== key);
        if (v !== undefined) u.args.push([key, v]);
      }
      x.trans = formatImageFx(u);
    }, `pic${key}${l.id}`);
  const trans = (
    <>
      <TransPicker className={nd} value={l.trans} onPick={(v) => set((x) => void (x.trans = v || undefined))} />
      {picKnobs.length > 0 && (
        <button className={nd + ' fx-more' + (picOpen ? ' on' : '')} title="이 그림 효과의 걸리는 시간과 세부 값을 막대로 고쳐요" onClick={() => setPicOpen(!picOpen)}>
          세부 값{picChanged ? ` (${picChanged})` : ''}
        </button>
      )}
    </>
  );
  const picPanel = picOpen && picKnobs.length > 0 && (
    <div className={'fx-knobs sf-knobs ' + nd}>
      {picKnobs.map((k) => {
        const cur = picSet(k.key);
        const v = cur ?? k.def;
        return (
          <label key={k.key} className={cur !== undefined ? 'set' : ''}>
            <span className="fx-kn" title={k.key}>{k.label}</span>{k.r86 && <span className="fx-86" title={R86_TIP}>8.6</span>}
            {k.kind === 'color' ? (
              <input type="color" value={v.slice(0, 7)} onChange={(e) => putPic(k.key, e.target.value)} />
            ) : (
              <>
                <input type="range" min={k.min} max={k.max} step={k.step} value={knobNum(v)} data-knob={k.key} onChange={(e) => putPic(k.key, knobText(k, Number(e.target.value)))} />
                <span className="fx-kv">{knobNum(v)}</span>
              </>
            )}
            <button className="fx-x" style={{ visibility: cur !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), putPic(k.key, undefined))}>↺</button>
          </label>
        );
      })}
    </div>
  );

  let body;
  if (l.type === 'scene') body = <>{field('image', '배경 이름 (예: room) · 비우면 검은 화면', firstId, 'wide')}{trans}</>;
  else if (l.type === 'show')
    body = (
      <>
        {kindSel}
        {kind === 'char' ? <>{charSel}{field('attr', '표정 (예: smile)', undefined, 'short')}</> : field('image', kind === 'bg' ? '배경 이름 (예: room)' : '이미지 이름', firstId)}
        {/* showpy 연결을 켜면 위치는 렌파이 편집기에서만 정한다. 예전에 적은 값만 지울 수 있게 보여 준다 */}
        {(!linked || l.at) && pick(POSITIONS, l.at, (x, v) => void (x.at = v || undefined), '위치')}
        {trans}
        <LayerPick l={l} set={set} nd={nd} numIn={numIn} />
      </>
    );
  else if (l.type === 'hide')
    body = (
      <>
        {kindSel}
        {kind === 'char' ? charSel : kind === 'etc' ? field('image', '이미지 이름', firstId) : <span className="tip">배경을 지워요</span>}
        {trans}
      </>
    );
  else if (l.type === 'fx') body = <FxFields l={l} set={set} nd={nd} />;
  else if (l.type === 'music')
    body = (
      <>
        {pick([['', '틀기'], ['queue', '이어 틀기'], ['stop', '멈추기'], ['seek', '자리 옮기기']], l.stop ? 'stop' : l.seek !== undefined ? 'seek' : l.queue ? 'queue' : '', (x, v) => {
          if (v === 'stop') x.stop = true;
          else delete x.stop;
          if (v === 'queue') x.queue = true;
          else delete x.queue;
          if (v === 'seek') x.seek = x.seek ?? 0;
          else delete x.seek;
        }, '틀기: 지금 곡을 끊고 바로 / 이어 틀기: 지금 곡이 끝나면 (queue) / 멈추기 / 자리 옮기기: 지금 곡을 다시 틀지 않고 그 초로 (렌파이 8.6부터)')}
        {l.seek !== undefined && !l.stop && numIn('seek', '0초', '지금 나오는 곡을 이 초로 옮겨요. 곡은 끊기지 않아요. 렌파이 8.6부터 돼요 (8.5 게임에서는 아무 일도 안 해요)', { max: 3600 })}
        {l.seek !== undefined && !l.stop && <span className="tip" title={R86_TIP}>초로 · 8.6</span>}
        {!l.stop && l.seek === undefined && field('file', '파일 이름 (예: rain.ogg)', firstId, 'wide')}
        {!l.stop && l.seek === undefined && numIn('from', '처음부터', '곡의 이 초부터 틀어요. 비우면 처음부터 (반복하면 다시 이 초부터)', { max: 3600 })}
        {!l.stop && l.seek === undefined && numIn('fadein', '페이드인 0초', '시작할 때 소리가 커지는 초. 비우면 바로 (0초)', { max: 30 })}
        {!l.stop && l.seek === undefined && pick([['', '반복 게임 기본'], ['loop', '반복 켬'], ['noloop', '반복 끔']], l.loop === true ? 'loop' : l.loop === false ? 'noloop' : '', (x, v) => void (v ? (x.loop = v === 'loop') : delete x.loop), '곡이 끝나면 다시 틀지. 게임 기본은 음악은 반복해요')}
        {l.stop && numIn('fadeout', `페이드아웃 ${DEFAULT_FADEOUT}초`, `멈출 때 소리가 줄어드는 초. 비우면 ${DEFAULT_FADEOUT}초, 0이면 바로`, { max: 30 })}
      </>
    );
  else if (l.type === 'sound')
    body = (
      <>
        {pick([['', '틀기'], ['stop', '멈추기']], l.stop ? 'stop' : '', (x, v) => void (v ? (x.stop = true) : delete x.stop), '틀기/멈추기 (멈추기는 그 채널에서 나는 소리를 멈춰요)')}
        {pick([['', '하나씩 (sound)'], ['audio', '겹쳐 나옴 (audio)']], l.channel, (x, v) => void (v ? (x.channel = 'audio') : delete x.channel), '하나씩: 새 효과음이 앞 효과음을 끊어요 / 겹쳐 나옴: 여러 소리가 같이 나요')}
        {!l.stop && field('file', '파일 이름 (예: door.ogg)', firstId, 'wide')}
        {l.stop && numIn('fadeout', `페이드아웃 ${DEFAULT_FADEOUT}초`, `멈출 때 소리가 줄어드는 초. 비우면 ${DEFAULT_FADEOUT}초, 0이면 바로`, { max: 30 })}
      </>
    );
  else if (l.type === 'pause') body = <>{numIn('secs', '클릭할 때까지', '멈출 초. 비우면 플레이어가 클릭할 때까지 멈춰요', { max: 600 })}<span className="tip">초</span></>;
  else if (l.type === 'shake') body = pick(SHAKES, l.shake ?? 'vpunch', (x, v) => void (v === 'vpunch' ? delete x.shake : (x.shake = v as Line['shake'])), '화면 흔들기');
  else if (l.type === 'hud') {
    // HUD 보이기/숨기기 (FEATURE 18): [화면] 탭에서 HUD로 만든 화면을 고른다
    const huds = (screens ?? []).filter((s) => s.kind === 'hud');
    const cur = screens?.find((s) => s.id === l.screen);
    body = (
      <>
        {pick([['', '보이기'], ['stop', '숨기기']], l.stop ? 'stop' : '', (x, v) => void (v ? (x.stop = true) : delete x.stop), '보이기: 이 줄부터 HUD가 떠 있어요 (show screen) / 숨기기: 내려요 (hide screen)')}
        <select id={firstId} className={cur ? '' : 'invalid'} value={cur?.id ?? ''} onChange={(e) => set((x) => void (e.target.value ? (x.screen = e.target.value) : delete x.screen))} title="[화면] 탭에서 HUD로 만든 화면">
          <option value="">{huds.length ? 'HUD 고르기' : 'HUD가 없어요 ([화면] 탭)'}</option>
          {cur && cur.kind !== 'hud' && <option value={cur.id}>{cur.title || cur.name} (전체 화면)</option>}
          {huds.map((s) => (
            <option key={s.id} value={s.id}>{s.title || s.name}</option>
          ))}
        </select>
      </>
    );
  }
  else body = null;

  return (
    <div className="sf">
      <div className="sf-row">{body}</div>
      {(l.type === 'scene' || l.type === 'show' || l.type === 'hide') && picPanel}
      <code className={'sf-code' + (code ? '' : ' todo')} title="내보낼 렌파이 명령">{code ?? problem}</code>
    </div>
  );
}

// 보이기 줄의 앞뒤: 기본 / 맨 앞(zorder 숫자) / 이 그림 뒤에(behind 태그). 뒤에 둘 태그는 대본의 보이기 줄과 캐릭터에서 고른다
function LayerPick({ l, set, nd, numIn }: { l: Line; set: SetLine; nd: string; numIn: (k: 'zorder', placeholder: string, title: string, o?: { min?: number; max?: number; step?: number }) => JSX.Element }) {
  const tags = useStore((s) => {
    const own = imageName(l).split(' ')[0];
    const out = new Set<string>(s.project.characters.map((c) => c.id));
    for (const n of s.project.nodes) for (const y of n.lines) if (y.type === 'show') out.add(imageName(y).split(' ')[0]);
    out.delete(own);
    out.delete('');
    return [...out].sort().join(' ');
  });
  const mode = l.behind !== undefined ? 'behind' : l.zorder !== undefined ? 'zorder' : '';
  const listId = `sug-behind-${l.id}`;
  return (
    <>
      <select
        className={nd}
        title="앞뒤: 다른 그림과 겹칠 때 어느 쪽이 앞인지. 기본은 나중에 보인 그림이 앞"
        value={mode}
        onChange={(e) =>
          set((x) => {
            delete x.zorder;
            delete x.behind;
            if (e.target.value === 'zorder') x.zorder = 10;
            if (e.target.value === 'behind') x.behind = tags.split(' ')[0] ?? '';
          })
        }
      >
        <option value="">앞뒤 기본</option>
        <option value="zorder">맨 앞 (숫자)</option>
        <option value="behind">이 그림 뒤에</option>
      </select>
      {mode === 'zorder' && numIn('zorder', '10', '숫자가 클수록 앞이에요 (기본 그림은 0)', { min: -100, max: 100, step: 1 })}
      {mode === 'behind' && (
        <>
          <input className={nd + ' sf-in short'} list={listId} placeholder="태그 (예: mina)" value={l.behind ?? ''} onChange={(e) => set((x) => void (x.behind = e.target.value.trim()), 'behind' + l.id)} />
          <datalist id={listId}>
            {tags.split(' ').filter(Boolean).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </>
      )}
    </>
  );
}

// 줄을 끌어서 순서 바꾸기. 손잡이(⠿)만 끌 수 있고, 줄 위에 놓으면 위/아래 절반에 따라 앞/뒤로 들어간다
export function useLineDrag(move: (from: number, to: number) => void) {
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<{ i: number; after: boolean } | null>(null);
  const reset = () => (setFrom(null), setOver(null));

  const grip = (i: number) => ({
    draggable: true,
    title: '끌어서 순서 바꾸기',
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-pykaki-line', String(i));
      const row = e.currentTarget.closest('[data-row]');
      if (row) e.dataTransfer.setDragImage(row, 12, 12);
      setFrom(i);
    },
    onDragEnd: reset,
  });

  const row = (i: number) => ({
    'data-row': i,
    onDragOver: (e: React.DragEvent<HTMLElement>) => {
      if (from === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const r = e.currentTarget.getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      if (over?.i !== i || over.after !== after) setOver({ i, after });
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      if (from === null || !over) return;
      e.preventDefault();
      const to = over.i + (over.after ? 1 : 0);
      if (to !== from && to !== from + 1) move(from, to);
      reset();
    },
  });

  const cls = (i: number) => (from === i ? ' dragging' : '') + (over?.i === i && from !== null ? (over.after ? ' drop-after' : ' drop-before') : '');
  return { grip, row, cls };
}

