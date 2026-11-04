// showpy 화면의 "커서, 클릭 대기(CTC), 대사 소리" 칸 (게임 안 편집기의 custom_ui 탭, ui_kit 3.15).
// 값은 게임이 갖고 있고 여기서는 custom_ui.set으로 보내기만 한다. 저장은 게임이 custom_ui_layout.rpy에.
// 그림 미리보기는 앱이 프로젝트의 game 폴더에서 그림을 직접 읽어 24fps로 돌린다.
import { useEffect, useMemo, useState } from 'react';
import { desktop } from './desktop';
import { liveSend, useLive, type CustomUIState, type CustomUIValues, type GameFiles } from './showpyLive';

type Key = keyof CustomUIValues;
type AnimKey = 'ctc' | 'cursor';

const set = (key: Key, value: unknown) => liveSend({ cmd: 'custom_ui.set', key, value });
const reset = (key: Key) => liveSend({ cmd: 'custom_ui.reset', key });

const LABEL: Record<AnimKey, string> = { ctc: '클릭 대기 표시', cursor: '커서' };

export function CustomUIPanel({ cu }: { cu: CustomUIState | null | undefined }) {
  const files = useLive((s) => s.files);
  const [slot, setSlot] = useState<{ key: AnimKey; index: number } | null>(null);

  useEffect(() => {
    if (!files) liveSend({ cmd: 'files' });
  }, [files]);

  if (!cu) return <p className="sp-warn">이 게임에는 커서/대사 소리 기능(custom_ui)이 없어요.</p>;
  if (!cu.ok) return <p className="sp-warn">{cu.why || '지금은 쓸 수 없어요.'}</p>;
  if (!cu.values) return <p className="tip">게임의 showpy가 예전 판이에요. ui_kit 3.15 이상에서 여기서 고칠 수 있어요.</p>;

  const v = cu.values;
  const edited = new Set(cu.edited ?? []);
  const fps = cu.fps ?? 24;
  const max = cu.max_frames ?? 12;
  const needReload = (cu.reload_keys ?? []).some((k) => edited.has(k));

  const Mark = ({ k }: { k: Key }) =>
    edited.has(k) ? (
      <button className="sp-undo" title="이 값의 저장 안 한 변경 되돌리기" onClick={() => reset(k)}>
        ● 되돌리기
      </button>
    ) : null;

  return (
    <div className="sp-cu">
      <section>
        <div className="sp-cu-head">
          <b>텍스트 속도</b>
          <Mark k="text_cps" />
        </div>
        <div className="sp-row">
          <Range value={cu.cps ?? 0} min={0} max={100} step={1} onSet={(n) => set('text_cps', Math.round(n))} />
          <span className="sp-cu-val">{cpsLabel(v.text_cps, cu.cps ?? 0)}</span>
          <button disabled={v.text_cps === null} onClick={() => set('text_cps', null)} title="options.rpy 값을 그대로 써요">
            기본값
          </button>
        </div>
      </section>

      <section>
        <div className="sp-cu-head">
          <b>대사 소리</b>
          <Mark k="typing_sound" />
          <Mark k="typing_volume" />
        </div>
        <div className="sp-row">
          <select className="grow" value={v.typing_sound ?? ''} onChange={(e) => set('typing_sound', e.target.value || null)}>
            <option value="">(없음)</option>
            {v.typing_sound && !files?.audio.includes(v.typing_sound) && <option value={v.typing_sound}>{v.typing_sound}</option>}
            {files?.audio.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {cu.playing ? (
            <button onClick={() => liveSend({ cmd: 'custom_ui.stop' })}>멈추기</button>
          ) : (
            <button disabled={!v.typing_sound} onClick={() => liveSend({ cmd: 'custom_ui.listen' })} title="게임에서 1.5초 들려줘요">
              들어보기
            </button>
          )}
        </div>
        <div className="sp-row">
          <span className="sp-cu-lab">음량</span>
          <Range value={v.typing_volume} min={0} max={1} step={0.05} onSet={(n) => set('typing_volume', Math.round(n * 100) / 100)} />
          <span className="sp-cu-val">{Math.round(v.typing_volume * 100)}%</span>
        </div>
      </section>

      {(['ctc', 'cursor'] as AnimKey[]).map((key) => {
        const frames = v[`${key}_frames`];
        const missing = files ? frames.filter((f) => !files.images.includes(f)) : [];
        const hold = v[`${key}_hold`] === 1 ? 1 : 2;
        return (
          <section key={key}>
            <div className="sp-cu-head">
              <label className="sp-check strong">
                <input type="checkbox" checked={v[key]} onChange={(e) => set(key, e.target.checked)} />
                {LABEL[key]}
              </label>
              <Mark k={key} />
              <Mark k={`${key}_frames`} />
              <Mark k={`${key}_hold`} />
              {key === 'cursor' && <Mark k="cursor_mode" />}
              {key === 'cursor' && <Mark k="cursor_hotspot" />}
            </div>
            <div className="sp-seg">
              <button className={hold === 1 ? 'on' : ''} onClick={() => set(`${key}_hold`, 1)}>
                1프레임마다
              </button>
              <button className={hold === 2 ? 'on' : ''} onClick={() => set(`${key}_hold`, 2)}>
                2프레임마다
              </button>
            </div>
            <p className="tip">{speedLabel(frames.length, hold, fps)}</p>
            {key === 'cursor' && (
              <>
                <div className="sp-seg">
                  <button className={v.cursor_mode !== 'hardware' ? 'on' : ''} onClick={() => set('cursor_mode', 'software')} title="렌파이가 화면에 그려요. 24fps가 정확하고 그림 크기 제한이 없어요">
                    소프트웨어 (24fps)
                  </button>
                  <button className={v.cursor_mode === 'hardware' ? 'on' : ''} onClick={() => set('cursor_mode', 'hardware')} title="운영체제가 그려요. 반응이 가장 빠르지만 초당 20프레임까지만">
                    기본 커서 (최대 20fps)
                  </button>
                </div>
                <div className="sp-row">
                  <span className="sp-cu-lab">클릭 기준점</span>
                  <SmallNum value={v.cursor_hotspot[0]} onSet={(n) => set('cursor_hotspot', [n, v.cursor_hotspot[1]])} />
                  <SmallNum value={v.cursor_hotspot[1]} onSet={(n) => set('cursor_hotspot', [v.cursor_hotspot[0], n])} />
                  <span className="tip">그림 왼쪽 위에서 x, y</span>
                </div>
              </>
            )}
            <div className="sp-slots">
              {Array.from({ length: max }, (_, i) => {
                const on = slot?.key === key && slot.index === i;
                if (i < frames.length)
                  return (
                    <button
                      key={i}
                      className={'sp-slot' + (on ? ' on' : '') + (missing.includes(frames[i]) ? ' missing' : '')}
                      title={`${i + 1}번 칸: ${frames[i]}` + (missing.includes(frames[i]) ? ' (게임 폴더에 없는 그림)' : '')}
                      onClick={() => setSlot({ key, index: i })}
                    >
                      <Thumb path={frames[i]} />
                    </button>
                  );
                if (i === frames.length)
                  return (
                    <button key={i} className={'sp-slot add' + (on ? ' on' : '')} title={`${i + 1}번 칸에 그림 넣기`} onClick={() => setSlot({ key, index: i })}>
                      +
                    </button>
                  );
                return <span key={i} className="sp-slot empty" />;
              })}
            </div>
            {missing.length > 0 && <p className="sp-warn">게임 폴더에 없는 그림이 {missing.length}장 있어요. 칸을 눌러 다른 그림으로 바꿔요.</p>}
            {slot?.key === key && (
              <Picker
                files={files}
                label={`${LABEL[key]} ${slot.index + 1}번 칸`}
                frames={frames}
                index={slot.index}
                max={max}
                onPick={(path) => {
                  const fr = [...frames];
                  if (slot.index < fr.length) fr[slot.index] = path;
                  else fr.push(path);
                  set(`${key}_frames`, fr.slice(0, max));
                  // 다음 칸으로 (연달아 고를 수 있게)
                  if (slot.index + 1 < max) setSlot({ key, index: Math.min(slot.index + 1, fr.length) });
                  else setSlot(null);
                }}
                onFill={(imgs) => {
                  set(`${key}_frames`, imgs.slice(0, max));
                  setSlot(null);
                }}
                onClear={() => {
                  set(`${key}_frames`, frames.filter((_, i) => i !== slot.index));
                  setSlot(null);
                }}
                onClose={() => setSlot(null)}
              />
            )}
          </section>
        );
      })}

      <section>
        <div className="sp-cu-head">
          <label className="sp-check strong">
            <input type="checkbox" checked={v.quick_menu} onChange={(e) => set('quick_menu', e.target.checked)} />
            퀵메뉴 (새 게임에서 보임)
          </label>
          <Mark k="quick_menu" />
        </div>
      </section>

      <section>
        <div className="sp-cu-head">
          <b>미리보기</b>
        </div>
        <Preview v={v} cps={cu.cps ?? 0} fps={fps} />
      </section>

      {needReload && <p className="sp-warn">커서나 클릭 대기 표시를 켜고 끈 것, 커서 그림과 방식은 저장하면 게임을 다시 불러온 뒤 적용돼요. (저장할 때 저절로 다시 불러와요)</p>}
    </div>
  );
}

function cpsLabel(raw: number | null, cps: number) {
  const s = cps === 0 ? '한 번에' : `${cps}글자/초`;
  return raw === null ? `options.rpy 값 (${s})` : s;
}

function speedLabel(n: number, hold: number, fps: number) {
  if (!n) return '그림 없음';
  return `초당 ${+(fps / hold).toFixed(2)}장, 한 바퀴 ${((n * hold) / fps).toFixed(2)}초`;
}

// 끄는 동안은 게임에서 오는 값으로 덮지 않는다 (0.1초마다 상태가 와서 손잡이가 튀지 않게)
function Range({ value, min, max, step, onSet }: { value: number; min: number; max: number; step: number; onSet: (n: number) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <input
      type="range"
      className="grow"
      min={min}
      max={max}
      step={step}
      value={drag ?? Math.min(max, Math.max(min, value))}
      onPointerUp={() => setDrag(null)}
      onBlur={() => setDrag(null)}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        setDrag(n);
        onSet(n);
      }}
    />
  );
}

function SmallNum({ value, onSet }: { value: number; onSet: (n: number) => void }) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <input
      className="sp-small-num"
      type="number"
      step={1}
      value={txt ?? String(value)}
      onFocus={() => setTxt(String(value))}
      onBlur={() => setTxt(null)}
      onChange={(e) => {
        setTxt(e.target.value);
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n)) onSet(n);
      }}
    />
  );
}

// ── 그림 읽기 (game 폴더 기준 경로). 렌파이 압축 파일(.rpa) 안의 그림은 읽지 못해 이름만 보여준다 ──

const urls = new Map<string, Promise<string | null>>();
const MIME: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif' };

function imageUrl(path: string): Promise<string | null> {
  let p = urls.get(path);
  if (!p) {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    p = desktop
      ? desktop.read('game/' + path).then((b) => (b ? URL.createObjectURL(new Blob([b as BlobPart], { type: MIME[ext] ?? 'image/png' })) : null), () => null)
      : Promise.resolve(null);
    urls.set(path, p);
  }
  return p;
}

function useImage(path: string | null) {
  const [url, setUrl] = useState<{ path: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    imageUrl(path).then((u) => alive && setUrl({ path, url: u }));
    return () => void (alive = false);
  }, [path]);
  return url && url.path === path ? url.url : undefined;
}

export function Thumb({ path }: { path: string }) {
  const url = useImage(path);
  if (url) return <img src={url} alt="" draggable={false} />;
  return <span className="sp-thumb-name">{url === null ? path.split('/').pop() : ''}</span>;
}

// ── 그림 고르기 ──

const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

function Picker(props: {
  files: GameFiles | null;
  label: string;
  frames: string[];
  index: number;
  max: number;
  onPick: (path: string) => void;
  onFill: (imgs: string[]) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { files, frames, index } = props;
  const folders = useMemo(() => {
    const seen = new Map<string, number>();
    for (const f of files?.images ?? []) seen.set(dirOf(f), (seen.get(dirOf(f)) ?? 0) + 1);
    // gui 폴더 먼저, 나머지는 이름 순
    const gui = (d: string) => Number(!(d === 'gui' || d.startsWith('gui/')));
    return [...seen.keys()].sort((a, b) => gui(a) - gui(b) || (a < b ? -1 : a > b ? 1 : 0));
  }, [files]);
  const near = frames[index] ?? frames[frames.length - 1];
  const [folder, setFolder] = useState<string | null>(near !== undefined ? dirOf(near) : null);
  const cur = folder ?? folders[0] ?? null;
  const imgs = (files?.images ?? []).filter((f) => dirOf(f) === cur);

  return (
    <div className="sp-picker">
      <div className="sp-row">
        <b className="grow">그림 고르기 - {props.label}</b>
        <button onClick={() => liveSend({ cmd: 'files' })} title="게임 폴더에 그림을 새로 넣었으면 눌러요">
          목록 새로
        </button>
        <button onClick={props.onClose}>닫기</button>
      </div>
      {!files ? (
        <p className="tip">게임에서 파일 목록을 받는 중...</p>
      ) : !folders.length ? (
        <p className="tip">game 폴더에 그림이 없어요.</p>
      ) : (
        <>
          <div className="sp-folders">
            {folders.map((d) => (
              <button key={d} className={d === cur ? 'on' : ''} onClick={() => setFolder(d)}>
                {d || 'game'}
              </button>
            ))}
          </div>
          <div className="sp-pick-grid">
            {imgs.map((f) => (
              <button key={f} className={f === frames[index] ? 'on' : ''} title={f} onClick={() => props.onPick(f)}>
                <Thumb path={f} />
                <span>{f.split('/').pop()}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="sp-row">
        <button disabled={!imgs.length} onClick={() => props.onFill(imgs)}>
          이 폴더 통째로 넣기 (최대 {props.max}장)
        </button>
        <button disabled={index >= frames.length} onClick={props.onClear}>
          이 칸 비우기
        </button>
      </div>
      {imgs.length > props.max && <p className="tip">이 폴더는 그림이 {imgs.length}장이라 통째로 넣으면 앞의 {props.max}장만 들어가요.</p>}
    </div>
  );
}

// ── 미리보기: 글자 속도와 클릭 대기 표시, 커서 (게임과 같은 24fps) ──

function useFrame(n: number, hold: number, fps: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (n < 2) return setI(0);
    const t0 = performance.now();
    const id = setInterval(() => setI(Math.floor(((performance.now() - t0) / 1000) * (fps / hold)) % n), 1000 / fps);
    return () => clearInterval(id);
  }, [n, hold, fps]);
  return n ? i % n : 0;
}

function Anim({ frames, hold, fps }: { frames: string[]; hold: number; fps: number }) {
  const i = useFrame(frames.length, hold, fps);
  if (!frames.length) return <span className="tip">(그림 없음)</span>;
  return (
    <span className="sp-anim">
      <Thumb path={frames[i]} />
    </span>
  );
}

const SAMPLE = '텍스트 속도와 클릭 대기 표시를 미리 봅니다. 가나다라마바사.';

function Preview({ v, cps, fps }: { v: CustomUIValues; cps: number; fps: number }) {
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(SAMPLE.length);
  useEffect(() => {
    if (!cps) return setShown(SAMPLE.length);
    setShown(0);
    const t0 = performance.now();
    const id = setInterval(() => {
      const n = Math.floor(((performance.now() - t0) / 1000) * cps);
      setShown(Math.min(n, SAMPLE.length));
      if (n >= SAMPLE.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [cps, run]);
  const done = shown >= SAMPLE.length;
  return (
    <div className="sp-preview">
      <div className="sp-preview-text">
        {SAMPLE.slice(0, shown)}
        {done && v.ctc && <Anim frames={v.ctc_frames} hold={v.ctc_hold} fps={fps} />}
      </div>
      <div className="sp-row">
        <button onClick={() => setRun((r) => r + 1)}>글자 다시 보기</button>
        <span className="grow" />
        <span className="sp-cu-lab">커서</span>
        {v.cursor ? <Anim frames={v.cursor_frames} hold={v.cursor_hold} fps={fps} /> : <span className="tip">(끔)</span>}
      </div>
    </div>
  );
}
