// 투명 영상 만들기 창 (데스크톱 앱만, Modal Dialog 꼴). 그림/영상 칸의 [🎞]에서 연다.
// 투명 webm, 움직이는 GIF·WebP·PNG, PNG 연속 그림, 초록 화면 영상을 렌파이가 쓰는
// "왼쪽 색 + 오른쪽 투명도" webm으로 바꿔 game/movies/mask_이름.webm에 저장한다 (계산은 maskVideo/convert.ts).
// 빈 상태 → 파일 고르기(또는 끌어 놓기) → 방식·세기·크기 고르며 미리보기 → [만들기] → 진행 막대 → 결과 미리보기
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { desktop } from './desktop';
import { scanFolder } from './gameFolder';
import { useStore } from './store';
import {
  animType, audioSupported, composeFrame, countAt, cutRange, encodeSupported, isImageName, isVideoName, makeCanvases, makeMaskWebm, MaskError, naturalSort, openSource, outSize,
  type Canvases, type FrameFile, type Look, type Opened, type Source,
} from './maskVideo/convert';
import { MaskMovie } from './maskVideo/MaskMovie';

export const useMaskDialog = create<{ open: boolean; onDone?: (rel: string) => void; doneLabel?: string }>(() => ({ open: false }));
// onDone: 다 만들고 [doneLabel](기본 "이 칸에 넣기")을 누르면 game 기준 경로를 받음
export const openMaskDialog = (onDone?: (rel: string) => void, doneLabel?: string) => useMaskDialog.setState({ open: true, onDone, doneLabel });

const SIZES: [number, string][] = [[0, '원본 크기'], [1080, '높이 1080'], [720, '높이 720'], [540, '높이 540'], [360, '높이 360']];
const DEFAULT_LOOK: Look = { mode: 'alpha', key: [0, 200, 60], tol: 0.18, soft: 0.1, despill: true, height: 0, fps: 30, first: 0, last: -1, sound: true };
const PREVIEW_W = 420;
const CMP_SECS = 2; // 크기 견본은 앞 2초만 구워서 파일 크기를 어림함

interface Sample {
  height: number; // SIZES 값 (0은 원본)
  label: string;
  w: number;
  h: number;
  url?: string;
  est?: number; // 다 만들 때의 파일 크기 어림 (바이트)
}

const hex = (c: [number, number, number]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const unhex = (s: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
const mb = (n: number) => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + 'MB';
// 결과 이름: 확장자와 앞의 mask_, 그림 연속의 끝 번호를 떼고 파일 이름에 못 쓰는 글자는 _
function baseName(name: string, frames: boolean) {
  let b = name.replace(/\.[^.]+$/, '').replace(/^mask_/i, '');
  if (frames) b = b.replace(/[\s_.-]*\d+$/, '') || 'frames';
  return b.replace(/[\\/:*?"<>|]/g, '_').trim() || 'movie';
}

interface Picked {
  name: string;
  size: number;
  load: () => Promise<Blob>;
}

const mime = (n: string) => (isVideoName(n) ? 'video/' + (/\.webm$/i.test(n) ? 'webm' : 'mp4') : animType(n) ?? 'image/jpeg');

// 고른 파일들 → 원본. 영상 하나 | 움직이는 그림 하나 | 그림 여러 장
async function toSource(files: Picked[]): Promise<Source> {
  if (!files.length) throw new MaskError('고른 파일이 없어요');
  if (files.length === 1) {
    const f = files[0];
    if (isVideoName(f.name)) return { kind: 'video', name: f.name, blob: await f.load() };
    if (animType(f.name)) return { kind: 'anim', name: f.name, blob: await f.load(), type: animType(f.name)! };
    throw new MaskError('그림 한 장은 투명 영상으로 바꿀 수 없어요. 그림 연속이면 여러 장을 한꺼번에 골라 주세요');
  }
  if (files.some((f) => !isImageName(f.name))) throw new MaskError('영상은 하나만 골라 주세요. 여러 장은 그림(PNG 연속)만 돼요');
  const sorted = naturalSort(files);
  const frames: FrameFile[] = sorted.map((f) => ({ name: f.name, load: f.load }));
  return { kind: 'frames', name: sorted[0].name, files: frames };
}

export function MaskVideoDialog() {
  const { open, onDone, doneLabel } = useMaskDialog();
  if (!open) return null;
  return <Dialog onDone={onDone} doneLabel={doneLabel} />;
}

function Dialog({ onDone, doneLabel }: { onDone?: (rel: string) => void; doneLabel?: string }) {
  const [op, setOp] = useState<Opened | null>(null);
  const [srcInfo, setSrcInfo] = useState('');
  const [kind, setKind] = useState<Source['kind']>('video');
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [name, setName] = useState('');
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState<'' | 'open' | 'make' | 'cmp'>('');
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [err, setErr] = useState('');
  const [prog, setProg] = useState({ done: 0, count: 0 });
  const [result, setResult] = useState<{ rel: string; url: string; size: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const [canSound, setCanSound] = useState(true);
  const preview = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const cancel = useRef(false);
  const opener = useRef(document.activeElement as HTMLElement | null);
  const opRef = useRef<Opened | null>(null);
  opRef.current = op;

  const close = () => {
    if (busy === 'make' || busy === 'cmp') return;
    useMaskDialog.setState({ open: false, onDone: undefined });
    setTimeout(() => opener.current?.focus?.());
  };
  useEffect(() => () => opRef.current?.close(), []);
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result]);
  // 견본 영상 주소는 다음 비교나 창을 닫을 때 한꺼번에 풂 (견본이 하나씩 늘 때마다 풀면 앞 견본이 사라짐)
  const sampleUrls = useRef<string[]>([]);
  const dropSamples = () => {
    sampleUrls.current.forEach((u) => URL.revokeObjectURL(u));
    sampleUrls.current = [];
  };
  useEffect(() => dropSamples, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), close());
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  });

  // 원본 열기
  const load = async (files: Picked[]) => {
    setErr('');
    setBusy('open');
    setResult(null);
    try {
      const src = await toSource(files);
      const o = await openSource(src, look.fps);
      await idle();
      op?.close();
      setSamples(null);
      setOp(o);
      setFrame(Math.floor(o.count / 2));
      const frames = src.kind === 'frames';
      setKind(src.kind);
      setName(baseName(src.name, frames));
      // 투명한 곳이 없고 가장자리에 고른 색이 깔렸으면 색 빼기로
      const keyMode = !o.hasAlpha && !!o.edgeColor;
      setLook((l) => ({ ...l, mode: o.hasAlpha ? 'alpha' : keyMode ? 'key' : l.mode, key: o.edgeColor ?? l.key, fps: frames ? l.fps : o.fps, first: 0, last: -1 }));
      if (o.audio) setCanSound(await audioSupported(Math.min(2, o.audio.numberOfChannels)));
      const total = files.reduce((a, f) => a + f.size, 0);
      setSrcInfo(`${frames ? `그림 ${files.length}장` : files[0].name} · ${o.width}×${o.height} · ${mb(total)}`);
    } catch (e: any) {
      setErr(e instanceof MaskError ? e.message : '파일을 읽지 못했어요: ' + (e?.message ?? e));
    } finally {
      setBusy('');
    }
  };

  const pick = async () => {
    const r = await desktop?.pickMaskSource?.().catch((e) => (setErr('파일을 고르지 못했어요: ' + e.message), null));
    if (!r?.length) return;
    await load(r.map((f) => ({ name: f.name, size: f.size, load: async () => new Blob([await desktop!.readPicked!(f.token)], { type: mime(f.name) }) })));
  };
  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const fs = [...e.dataTransfer.files];
    if (fs.length) void load(fs.map((f) => ({ name: f.name, size: f.size, load: async () => f })));
  };

  // 미리보기: 고른 프레임을 작은 크기로 꾸며서 체크 무늬 위에. 바뀔 때마다 마지막 요청만 그림
  const want = useRef(0);
  const drawing = useRef(false);
  const pcv = useRef<Canvases | null>(null);
  const paint = (cv: Canvases) => {
    const p = preview.current;
    const s = strip.current;
    if (p) {
      if (p.width !== cv.w || p.height !== cv.h) (p.width = cv.w), (p.height = cv.h);
      const x = p.getContext('2d')!;
      x.clearRect(0, 0, cv.w, cv.h);
      x.drawImage(cv.src, 0, 0);
    }
    if (s) {
      const w = 240;
      const h = Math.max(1, Math.round((cv.h * w) / (cv.w * 2)));
      if (s.width !== w || s.height !== h) (s.width = w), (s.height = h);
      s.getContext('2d')!.drawImage(cv.out, 0, 0, w, h);
    }
  };
  // 그리는 동안 바뀐 값은 latest에만 두고, 다 그린 뒤 마지막 값으로 한 번 더 그린다.
  // (세션 131: 예전에는 그리는 중에 바뀌면 옛 값으로 끝없이 다시 그려서, 막대를 끌면 영상 찾기가 겹쳐 앱 창이 죽었음)
  const latest = useRef<{ id: number; op: Opened; look: Look; frame: number } | null>(null);
  useEffect(() => {
    if (!op || busy) {
      latest.current = null; // 만드는 동안은 미리보기를 멈춤 (같은 영상을 찾아가니까)
      return;
    }
    latest.current = { id: ++want.current, op, look, frame };
    if (drawing.current) return;
    drawing.current = true;
    void (async () => {
      let done = 0;
      try {
        while (latest.current && latest.current.id !== done) {
          const q = latest.current;
          done = q.id;
          const { w, h } = outSize(q.op, Math.round((q.op.height * Math.min(PREVIEW_W, q.op.width)) / q.op.width));
          if (!pcv.current || pcv.current.w !== w || pcv.current.h !== h) pcv.current = makeCanvases(w, h);
          await composeFrame(q.op, Math.min(q.frame, countAt(q.op, q.look.fps) - 1), q.look, pcv.current);
          if (latest.current?.op === q.op) paint(pcv.current);
        }
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        drawing.current = false;
      }
    })();
  }, [op, look, frame, busy]);
  // 만들기·견본 굽기 전에 그리던 미리보기가 끝나기를 기다림
  const idle = async () => {
    latest.current = null;
    while (drawing.current) await new Promise((r) => setTimeout(r, 10));
  };

  const rel = `movies/mask_${name || 'movie'}.webm`;
  const make = async () => {
    if (!op || !desktop) return;
    setErr('');
    const out = outSize(op, look.height);
    if (!(await encodeSupported(out.w, out.h))) return setErr('이 크기로는 영상을 만들 수 없어요. 크기를 줄여 보세요');
    if (await desktop.stat('game/' + rel).catch(() => null)) {
      if (!confirm(`game/${rel}이(가) 이미 있어요. 덮어쓸까요?`)) return;
    }
    cancel.current = false;
    setBusy('make');
    await idle();
    const [a, b] = cutRange(op, look);
    setProg({ done: 0, count: b - a + 1 });
    try {
      let n = 0;
      const bytes = await makeMaskWebm(op, { ...look, sound: look.sound && canSound }, (p, cv) => {
        setProg(p);
        if (n++ % 4 === 0) paint(cv);
      }, () => cancel.current);
      await desktop.write('game/' + rel, bytes);
      await scanFolder().catch(() => {});
      setResult({ rel, url: URL.createObjectURL(new Blob([bytes], { type: 'video/webm' })), size: bytes.length });
      useStore.getState().say(`game/${rel}을(를) 만들었어요`);
    } catch (e: any) {
      if (!cancel.current) setErr(e instanceof MaskError ? e.message : '만들지 못했어요: ' + (e?.message ?? e));
    } finally {
      setBusy('');
    }
  };

  // 크기 견본 비교: 크기마다 자른 구간의 앞 몇 초를 구워 보고, 그 크기로 전부 만들 때의 파일 크기를 어림한다
  const compare = async () => {
    if (!op) return;
    const [a, b] = cutRange(op, look);
    const n = Math.min(b - a + 1, Math.max(1, Math.round(CMP_SECS * look.fps)));
    dropSamples();
    const list: Sample[] = SIZES.filter(([h]) => !h || h < op.height).map(([h, t]) => ({ height: h, label: t, ...outSize(op, h) }));
    setSamples(list);
    setErr('');
    cancel.current = false;
    setBusy('cmp');
    await idle();
    setProg({ done: 0, count: n * list.length });
    const secs = (b - a + 1) / look.fps;
    try {
      for (let k = 0; k < list.length; k++) {
        const bytes = await makeMaskWebm(op, { ...look, height: list[k].height, sound: false, first: a, last: a + n - 1 }, (p) => setProg({ done: k * n + p.done, count: n * list.length }), () => cancel.current);
        // 소리는 128kbps 어림
        const est = bytes.length * ((b - a + 1) / n) + (look.sound && canSound && op.audio ? (128000 / 8) * secs : 0);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'video/webm' }));
        sampleUrls.current.push(url);
        list[k] = { ...list[k], url, est };
        setSamples([...list]);
      }
    } catch (e: any) {
      if (!cancel.current) setErr(e instanceof MaskError ? e.message : '견본을 만들지 못했어요: ' + (e?.message ?? e));
      else setSamples(null);
    } finally {
      setBusy('');
    }
  };

  // 영상은 1초 장 수를 바꾸면 자른 자리(프레임 번호)도 같은 때로 옮김
  const set = (p: Partial<Look>) =>
    setLook((l) => {
      const n = { ...l, ...p };
      if (p.fps && p.fps !== l.fps && op?.durationMs) {
        const k = p.fps / l.fps;
        n.first = Math.round(l.first * k);
        n.last = l.last < 0 ? -1 : Math.round(l.last * k);
        setFrame((f) => Math.round(f * k));
      }
      return n;
    });
  const out = op ? outSize(op, look.height) : null;
  const count = op ? countAt(op, look.fps) : 0;
  const [cutA, cutB] = op ? cutRange(op, look) : [0, 0];
  const cut = cutA > 0 || cutB < count - 1;
  const fr = Math.min(frame, count - 1);
  const secs = op ? ((cutB - cutA + 1) / (look.fps || op.fps)).toFixed(1) : '';
  const at = (i: number) => (op?.durationMs || kind === 'frames' ? `${(i / look.fps).toFixed(2)}초` : `${i + 1}장`);

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal mask-dlg" role="dialog" aria-modal="true" aria-label="투명 영상 만들기" onDragOver={(e) => (e.preventDefault(), setDrag(true))} onDragLeave={() => setDrag(false)} onDrop={drop}>
        <div className="mask-head">
          <h3>투명 영상 만들기</h3>
          <span className="sp" />
          <button className="mask-x" title="닫기 (Esc)" disabled={busy === 'make'} onClick={close}>✕</button>
        </div>
        <p className="mask-lead">렌파이는 투명한 webm을 그대로 못 틀어요. 왼쪽에 색, 오른쪽에 투명도를 담은 영상으로 바꿔서 game/movies 폴더에 mask_로 시작하는 이름으로 저장해요. 이름이 mask_로 시작하면 pygaki 플러그인이 저절로 투명하게 보여 줘요.</p>

        {!op ? (
          <button className={'mask-empty' + (drag ? ' drag' : '')} disabled={busy === 'open'} onClick={() => void pick()}>
            <span className="mask-empty-icon">🎞</span>
            <b>{busy === 'open' ? '읽는 중…' : '파일 고르기'}</b>
            <span>또는 여기로 끌어 놓기</span>
            <small>투명 webm · 움직이는 GIF·WebP·PNG · PNG 연속 그림(여러 장을 한꺼번에) · 초록 화면 영상(mp4, webm)</small>
          </button>
        ) : (
          <div className="mask-body">
            <div className="mask-view">
              <div className={'mask-stage' + (drag ? ' drag' : '')}>
                <canvas ref={preview} />
              </div>
              <div className="mask-scrub">
                <div className="mask-range">
                  <input type="range" min={0} max={count - 1} value={fr} disabled={!!busy} onChange={(e) => setFrame(Number(e.target.value))} title="미리 볼 프레임" />
                  {count > 1 && <div className="mask-cut" style={{ left: `${(cutA / (count - 1)) * 100}%`, right: `${100 - (cutB / (count - 1)) * 100}%` }} />}
                </div>
                <span className="mask-num">{`${fr + 1} / ${count}`}</span>
              </div>
              <div className="mask-trim" title="만들 구간: 위 막대로 자리를 고르고 눌러요. 쓰지 않는 앞뒤를 잘라 내요">
                <button disabled={!!busy || fr > cutB} onClick={() => set({ first: fr })}>⇤ 여기부터</button>
                <button disabled={!!busy || fr < cutA} onClick={() => set({ last: fr })}>여기까지 ⇥</button>
                <span className="mask-dim">{cut ? `${at(cutA)} ~ ${at(cutB)}` : '처음부터 끝까지'}</span>
                {cut && <button disabled={!!busy} onClick={() => set({ first: 0, last: -1 })} title="자르지 않고 다 써요">자르기 없애기</button>}
              </div>
              <div className="mask-strip" title="실제로 저장되는 꼴: 왼쪽 색, 오른쪽 투명도(흰색이 보이는 곳)">
                <canvas ref={strip} />
                <small>저장되는 꼴 (왼쪽 색, 오른쪽 투명도)</small>
              </div>
            </div>

            <div className="mask-side">
              <div className="mask-field">
                <label>원본</label>
                <div className="mask-src">
                  <span title={srcInfo}>{srcInfo}</span>
                  <button disabled={!!busy} onClick={() => void pick()}>다른 파일…</button>
                </div>
              </div>

              <div className="mask-field">
                <label>투명하게 할 곳</label>
                <div className="seg" role="radiogroup">
                  <button role="radio" aria-checked={look.mode === 'alpha'} className={look.mode === 'alpha' ? 'on' : ''} disabled={!!busy} onClick={() => set({ mode: 'alpha' })} title="원본에 들어 있는 투명도를 그대로 써요 (투명 webm, 투명 PNG·GIF)">원본 투명도</button>
                  <button role="radio" aria-checked={look.mode === 'key'} className={look.mode === 'key' ? 'on' : ''} disabled={!!busy} onClick={() => set({ mode: 'key' })} title="초록 화면처럼 한 가지 색으로 깔린 바탕을 빼요">색 빼기</button>
                </div>
                {look.mode === 'alpha' && !op.hasAlpha && (
                  <div className="mask-alert">이 원본에는 투명한 곳이 없어요. 바탕이 초록 화면이면 [색 빼기]를 골라요.</div>
                )}
              </div>

              {look.mode === 'key' && (
                <>
                  <div className="mask-field">
                    <label>뺄 색</label>
                    <div className="mask-row">
                      <input type="color" value={hex(look.key)} disabled={!!busy} onChange={(e) => set({ key: unhex(e.target.value) })} title="바탕 색. 가장자리 색을 저절로 찾아 넣어요" />
                      <code>{hex(look.key)}</code>
                      {op.edgeColor && hex(op.edgeColor) !== hex(look.key) && (
                        <button disabled={!!busy} onClick={() => set({ key: op.edgeColor! })} title="원본 가장자리에 깔린 색으로">가장자리 색</button>
                      )}
                    </div>
                  </div>
                  <div className="mask-field">
                    <label>세기</label>
                    <div className="mask-row">
                      <input type="range" min={0} max={0.6} step={0.01} value={look.tol} disabled={!!busy} onChange={(e) => set({ tol: Number(e.target.value) })} title="클수록 바탕과 비슷한 색까지 더 많이 빼요" />
                      <span className="mask-num">{Math.round(look.tol * 100)}</span>
                    </div>
                  </div>
                  <div className="mask-field">
                    <label>가장자리</label>
                    <div className="mask-row">
                      <input type="range" min={0.01} max={0.4} step={0.01} value={look.soft} disabled={!!busy} onChange={(e) => set({ soft: Number(e.target.value) })} title="클수록 가장자리가 부드럽게 비쳐요" />
                      <span className="mask-num">{Math.round(look.soft * 100)}</span>
                    </div>
                  </div>
                  <label className="mask-check">
                    <input type="checkbox" checked={look.despill} disabled={!!busy} onChange={(e) => set({ despill: e.target.checked })} />
                    가장자리에 묻은 바탕 색 걷어 내기
                  </label>
                </>
              )}

              <div className="mask-field">
                <label>크기</label>
                <div className="mask-row">
                  <select value={look.height} disabled={!!busy} onChange={(e) => set({ height: Number(e.target.value) })}>
                    {SIZES.filter(([h]) => !h || h < op.height).map(([h, t]) => (
                      <option key={h} value={h}>{t}</option>
                    ))}
                  </select>
                  {out && <span className="mask-dim">{`${out.w}×${out.h}, 파일은 ${out.w * 2}×${out.h}`}</span>}
                </div>
                <button className="mask-cmp-btn" disabled={!!busy} onClick={() => void compare()} title={`크기마다 앞 ${CMP_SECS}초를 구워서 화질과 파일 크기를 나란히 보여 줘요`}>크기 견본 비교…</button>
              </div>

              <div className="mask-field">
                <label>1초 장 수</label>
                <div className="mask-row">
                  <input type="number" className="sf-num" min={1} max={60} value={look.fps} disabled={!!busy || kind === 'anim'} onChange={(e) => set({ fps: Math.max(1, Math.min(60, Math.round(Number(e.target.value)) || 30)) })} title="1초에 몇 장씩 넘길지. 영상은 원본 값으로 채워 두고, 줄이면 파일이 작아져요. 움직이는 그림은 원본 그대로예요" />
                  <span className="mask-dim">{`${secs}초`}</span>
                </div>
              </div>

              {op.audio && (
                <div className="mask-field">
                  <label>소리</label>
                  <label className="mask-check" title="원본 영상의 소리를 같이 넣어요. 렌파이에서 영상이 보일 때 같이 나요">
                    <input type="checkbox" checked={look.sound && canSound} disabled={!!busy || !canSound} onChange={(e) => set({ sound: e.target.checked })} />
                    {canSound ? `소리 넣기 (${op.audio.numberOfChannels > 1 ? '스테레오' : '모노'})` : '이 앱에서는 소리를 넣지 못해요'}
                  </label>
                </div>
              )}

              <div className="mask-field">
                <label>저장할 이름</label>
                <div className="mask-row mask-name">
                  <span>movies/mask_</span>
                  <input value={name} spellCheck={false} disabled={!!busy} onChange={(e) => setName(e.target.value.replace(/[\\/:*?"<>|]/g, '_'))} />
                  <span>.webm</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {op && samples && (
          <div className="mask-cmp">
            <div className="mask-cmp-head">
              <b>크기 견본</b>
              <span className="mask-dim">{`앞 ${CMP_SECS}초로 어림한 파일 크기${look.sound && canSound && op.audio ? ' (소리 포함)' : ''}. 눌러서 고르면 그 크기로 만들어요`}</span>
              <span className="sp" />
              <button className="mask-x" title="견본 닫기" disabled={busy === 'cmp'} onClick={() => setSamples(null)}>✕</button>
            </div>
            <div className="mask-cmp-list" role="radiogroup" aria-label="크기 견본">
              {samples.map((x) => (
                <button key={x.height} role="radio" aria-checked={look.height === x.height} className={'mask-cmp-card' + (look.height === x.height ? ' on' : '')} disabled={!x.url} onClick={() => set({ height: x.height })}>
                  <div className="mask-done-view">{x.url ? <MaskMovie src={x.url} maxW={200} /> : <span className="mask-cmp-wait">굽는 중…</span>}</div>
                  <b>{x.label}</b>
                  <span className="mask-dim">{`${x.w}×${x.h}${x.est !== undefined ? ` · 약 ${mb(x.est)}` : ''}`}</span>
                </button>
              ))}
            </div>
            {(() => {
              const x = samples.find((y) => y.height === look.height && y.url);
              return x ? (
                <div className="mask-cmp-zoom">
                  <div className="mask-cmp-big mask-done-view" title="가운데를 원본 크기로 늘여 보여 줘요. 작은 크기일수록 흐려져요">
                    <MaskMovie key={x.url} src={x.url!} maxW={x.w} style={{ width: op.width }} />
                  </div>
                  <span className="mask-dim">{`${x.label}의 가운데를 원본 크기(${op.width}×${op.height})로 늘여 본 모습`}</span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {err && <div className="mask-alert err" role="alert">{err}</div>}

        {result && (
          <div className="mask-done">
            <div className="mask-done-view">
              <MaskMovie src={result.url} maxW={200} />
            </div>
            <div>
              <b>만들었어요</b>
              <code>{`game/${result.rel}`}</code>
              <small>{`${mb(result.size)}. 대사·선택지 그림 칸에 넣거나, 대본에서 show 줄로 보여요.`}</small>
            </div>
          </div>
        )}

        <div className="mask-foot">
          {busy === 'make' || busy === 'cmp' ? (
            <>
              <div className="mask-prog" role="progressbar" aria-valuemin={0} aria-valuemax={prog.count} aria-valuenow={prog.done}>
                <div style={{ width: `${(prog.done / Math.max(1, prog.count)) * 100}%` }} />
              </div>
              <span className="mask-num">{busy === 'cmp' ? `견본 ${prog.done} / ${prog.count}` : `${prog.done} / ${prog.count}`}</span>
              <button onClick={() => (cancel.current = true)}>멈추기</button>
            </>
          ) : (
            <>
              {result && <button onClick={() => void desktop?.openFolder('game/movies', true)}>폴더 열기</button>}
              <span className="sp" />
              <button onClick={close}>{result ? '닫기' : '취소'}</button>
              {result && onDone ? (
                <button className="primary solid" onClick={() => (onDone(result.rel), close())}>{doneLabel ?? '이 칸에 넣기'}</button>
              ) : (
                <button className="primary solid" disabled={!op || !!busy || !name} onClick={() => void make()}>{result ? '다시 만들기' : '만들기'}</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
