// 상자 안 편집과 오른쪽 편집 탭이 함께 쓰는 줄 입력 부품
import { useEffect, useState } from 'react';
import { useStore } from './store';
import * as ops from './ops';
import type { ImageKind, Line, LineFx, SayStyle } from './types';
import { EFFECTS, FX_BASE, FX_CURSOR, FX_OVERLAY, FX_TRANS, FX_WARP, POSITIONS, STAGE_LABEL, STAGE_TYPES, TRANSITIONS, fxArgs, lineCps, stageCode } from './stage';
import { useGameFolder, writePreview, type PreviewResult } from './gameFolder';
import { LinePreview } from './PlayStage';

type SetLine = (fn: (x: Line) => void, key?: string) => void;

// 줄 종류(화자) 고르기
export function SpeakerSelect({ l, set, className }: { l: Line; set: SetLine; className?: string }) {
  const chars = useStore((s) => s.project.characters);
  const val = ops.speakerValue(l);
  return (
    <select className={className} value={val} onChange={(e) => set((x) => ops.setSpeaker(x, e.target.value))}>
      <optgroup label="대사">
        <option value="narration">내레이션</option>
        {chars.map((c) => (
          <option key={c.id} value={'say:' + c.id}>{c.name}</option>
        ))}
        {l.type === 'say' && !chars.some((c) => c.id === l.who) && <option value={val}>? {l.who}</option>}
      </optgroup>
      <optgroup label="연출">
        {/* 화면 효과는 렌파이 편집기에서 고친다. 예전에 넣은 줄만 그대로 보여 준다 */}
        {STAGE_TYPES.filter((t) => t !== 'fx' || l.type === 'fx').map((t) => (
          <option key={t} value={t}>{STAGE_LABEL[t]}</option>
        ))}
      </optgroup>
      <optgroup label="기타">
        <option value="command">⚙ 직접 명령</option>
        <option value="note"># 메모</option>
      </optgroup>
    </select>
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
  const fonts = useGameFolder((f) => f.media.fonts);
  const linked = useStore((v) => !!v.project.settings.renpyLink);
  const put = (key: keyof SayStyle, v: string | number | undefined, mergeKey?: string) =>
    set((x) => {
      const say: SayStyle = { ...(x.say ?? {}) };
      if (v === undefined || v === '') delete say[key];
      else (say as Record<string, unknown>)[key] = v;
      if (Object.keys(say).length) x.say = say;
      else delete x.say;
    }, mergeKey);
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
  const font = (key: 'font' | 'name_font', placeholder: string) => (
    <input className="sf-in" list={fonts.length ? `sug-fonts-${l.id}` : undefined} placeholder={placeholder} value={s[key] ?? ''} onChange={(e) => put(key, e.target.value.trim(), key + l.id)} />
  );
  const pos = (x: 'x' | 'name_x', y: 'y' | 'name_y', what: string) =>
    s[x] !== undefined || s[y] !== undefined ? (
      <span className="sf-pos" title={`showpy 편집기에서 정한 ${what} 위치예요. 대사창 왼쪽 위 기준이에요.`}>
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
        {num('cps', lineCps(s) !== undefined ? String(lineCps(s)) : '글자/초', '1초에 나오는 글자 수. 효과를 고르면 기본값을 써요. 효과가 없고 비워 두면 게임 설정을 따라요', 500)}
        <select title="등장 효과" value={s.effect ?? ''} onChange={(e) => put('effect', e.target.value)}>
          {EFFECTS.map(([k, t]) => (
            <option key={k} value={k}>{t}</option>
          ))}
        </select>
        {color('color', '글자 색')}
        {font('font', '글꼴 파일')}
      </div>
      {l.type === 'say' && (
        <div className="sf-row">
          {num('name_size', '이름 크기', '이름 글자 크기', 200)}
          {color('name_color', '이름 색')}
          {font('name_font', '이름 글꼴 파일')}
        </div>
      )}
      {fonts.length > 0 && (
        <datalist id={`sug-fonts-${l.id}`}>
          {fonts.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
      {posWhat || posName ? <div className="sf-row">{posWhat}{posName}</div> : linked && <p className="tip">위치와 화면 효과는 렌파이 편집기의 대사 탭에서 정해요.</p>}
    </>
  );
}

// 오른쪽 편집 탭의 글자 효과 칸. 글 칸에는 글만 남기려고 줄 밖으로 뺐고, 집중 모드에서는 패널과 함께 숨는다
// 화면 효과는 렌파이 편집기에서 고치고, 여기서는 받아 적은 값을 보여 주기만 한다
// [렌파이에서 보기]를 켰는지. 이 브라우저에만 기억한다
const LIVE_KEY = 'pykaki-live-preview';
const readLive = () => {
  try {
    return localStorage.getItem(LIVE_KEY) === '1';
  } catch {
    return false;
  }
};

export function LineLook({ l, set }: { l: Line; set: SetLine }) {
  const fx = fxArgs(l.fx);
  const tagsOn = useStore((s) => s.project.settings.allowTextTags);
  const folder = useGameFolder((f) => f.name);
  const [live, setLive] = useState(readLive);
  const [sent, setSent] = useState<PreviewResult>('ok'); // 마지막으로 미리보기 파일에 쓴 결과
  const preview = () => {
    const cps = lineCps(l.say);
    return {
      enabled: true,
      line: l.id,
      text: tagsOn ? l.text : l.text.replace(/\{/g, '{{'),
      say: { ...l.say, ...(cps !== undefined ? { cps } : {}) },
    };
  };
  // 클릭 안에서 부르면 폴더 권한 창을 띄울 수 있다
  const send = async (ask: boolean) => setSent(await writePreview(live ? preview() : { enabled: false }, ask));
  const toggleLive = async (on: boolean) => {
    setLive(on);
    try {
      localStorage.setItem(LIVE_KEY, on ? '1' : '0');
    } catch {
      /* 이번 창에서만 기억 */
    }
    const r = await writePreview(on ? preview() : { enabled: false }, true);
    setSent(on ? r : 'ok');
  };

  // 줄이나 값이 바뀌면 잠깐 기다렸다가 미리보기 파일에 적는다. 글자/초는 실제로 내보낼 값으로
  const sayKey = JSON.stringify(l.say ?? {});
  useEffect(() => {
    if (!live || !folder) return;
    const t = setTimeout(() => void send(false), 300);
    return () => clearTimeout(t);
  }, [live, folder, l.id, l.text, sayKey, tagsOn]);

  return (
    <div className="look">
      <div className="look-title">글자 모양, 속도, 등장 효과</div>
      <LinePreview line={l} tagsOn={tagsOn} />
      {l.say?.effect && <EffectClip effect={l.say.effect} />}
      {folder && (
        <div className="live-row">
          <label className="live-toggle" title="개발 모드로 켜 둔 렌파이 게임 화면 위에 이 줄이 진짜 효과로 나와요">
            <input type="checkbox" checked={live} onChange={(e) => void toggleLive(e.target.checked)} /> 렌파이에서 보기
          </label>
          {live && sent === 'denied' && (
            <span className="live-warn">
              폴더 권한이 없어 렌파이로 못 보내요 <button className="primary" onClick={() => void send(true)}>권한 허용</button>
            </span>
          )}
          {live && sent === 'error' && (
            <span className="live-warn">
              미리보기 파일을 못 썼어요 <button className="primary" onClick={() => void send(true)}>다시 쓰기</button>
            </span>
          )}
        </div>
      )}
      <SayFields l={l} set={set} />
      {fx.length > 0 && <div className="sf-pos" title="렌파이 편집기의 대사 탭에서 고쳐요">{fx.join(', ')}</div>}
    </div>
  );
}

// 렌파이 견본: 효과마다 렌파이에서 찍어 둔 짧은 영상 (public/effects, tools/record_effect_clips.py로 만듦)
function EffectClip({ effect }: { effect: string }) {
  const [missing, setMissing] = useState<string | null>(null);
  const name = effect.split(':')[0];
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
  const chars = useStore((s) => s.project.characters);
  const words = (n: string) => n.split(' ');
  const bg = media.images.filter((n) => words(n)[0] === 'bg' && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  const attr = media.images.filter((n) => words(n)[0] === l.who && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  const etc = media.images.filter((n) => words(n)[0] !== 'bg' && !chars.some((c) => c.id === words(n)[0]));
  return { bg, attr, etc, audio: media.audio };
}

export function StageFields({ l, set, firstId, nd = '' }: { l: Line; set: SetLine; firstId?: string; nd?: string }) {
  const chars = useStore((s) => s.project.characters);
  const linked = useStore((s) => !!s.project.settings.renpyLink);
  const sug = useSuggest(l);
  const kind = l.kind ?? 'char';
  const { code, problem } = stageCode(l);
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
  const trans = pick(TRANSITIONS, l.trans, (x, v) => void (x.trans = v || undefined), '나타나는 방식');

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
        {pick([['', '틀기'], ['stop', '멈추기']], l.stop ? 'stop' : '', (x, v) => void (v ? (x.stop = true) : delete x.stop), '틀기/멈추기')}
        {!l.stop && field('file', '파일 이름 (예: rain.ogg)', firstId, 'wide')}
      </>
    );
  else body = field('file', '파일 이름 (예: door.ogg)', firstId, 'wide');

  return (
    <div className="sf">
      <div className="sf-row">{body}</div>
      <code className={'sf-code' + (code ? '' : ' todo')} title="내보낼 렌파이 명령">{code ?? problem}</code>
    </div>
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

