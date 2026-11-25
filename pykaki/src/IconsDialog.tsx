// 아이콘 창 (데스크톱 앱만, Modal Dialog 꼴). 툴바 둘째 줄 [폴더 관리 ▾] 옆 [아이콘]에서 연다.
// 렌파이 게임을 배포할 때 쓰는 두 아이콘을 고른다 (계산은 icons/iconFiles.ts):
// - 창 아이콘: game/gui/window_icon.png (options.rpy config.window_icon이 가리키는 PNG). 게임 창 제목줄·작업 표시줄
// - exe 아이콘: 프로젝트 폴더의 icon.ico. 렌파이 런처 [배포판 만들기]가 윈도우 exe에 넣음
// 둘 다 정사각형 256×256 이상 (정사각형이 아니면 투명 여백으로 채울 수 있음). PNG·JPEG·WebP, exe 칸은.ico도 그대로.
// 칸마다 따로 고르거나 [그림 하나로 둘 다]. [저장]하면 예전 파일을 ui_kit_backup/icons/에 남기고 덮어씀
import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { desktop } from './desktop';
import {
  IconError, makeIco, makeWindowPng, pngSize, previewUrl, problem, readSource, windowTarget, icoSizes, type Source,
} from './icons/iconFiles';

export const useIconsDialog = create<{ open: boolean }>(() => ({ open: false }));
export const openIconsDialog = () => useIconsDialog.setState({ open: true });

type Slot = 'window' | 'exe';
const EXE_REL = 'icon.ico';

interface Pending {
  src: Source;
  pad: boolean;
}
interface Current {
  url: string | null; // 지금 파일 (없으면 null)
  info: string;
}

const two = (n: number) => String(n).padStart(2, '0');
const stamp = () => {
  const t = new Date();
  return `${t.getFullYear()}${two(t.getMonth() + 1)}${two(t.getDate())}-${two(t.getHours())}${two(t.getMinutes())}${two(t.getSeconds())}`;
};
const dec = new TextDecoder('utf-8', { ignoreBOM: true });
const blobUrl = (b: Uint8Array, type: string) => URL.createObjectURL(new Blob([b as BlobPart], { type }));

async function readOptions() {
  const b = await desktop!.read('game/options.rpy');
  return b ? dec.decode(b) : null;
}

// 고친 파일의 예전 것을 남김. 남긴 자리 (없던 파일이면 null)
async function backup(rel: string): Promise<string | null> {
  const old = await desktop!.read(rel);
  if (!old) return null;
  const name = rel.split('/').pop()!;
  const dot = name.lastIndexOf('.');
  const to = `ui_kit_backup/icons/${name.slice(0, dot)}.${stamp()}${name.slice(dot)}`;
  await desktop!.write(to, old);
  return to;
}

export function IconsDialog() {
  const open = useIconsDialog((s) => s.open);
  if (!open || !desktop) return null;
  return <Dialog />;
}

function Dialog() {
  const [winRel, setWinRel] = useState('gui/window_icon.png');
  const [cur, setCur] = useState<Record<Slot, Current>>({ window: { url: null, info: '읽는 중…' }, exe: { url: null, info: '읽는 중…' } });
  const [pend, setPend] = useState<Partial<Record<Slot, Pending>>>({});
  const [errs, setErrs] = useState<Partial<Record<Slot, string>>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<string[] | null>(null);
  const [drag, setDrag] = useState<Slot | null>(null);
  const [reload, setReload] = useState(0);
  const opener = useRef(document.activeElement as HTMLElement | null);

  const close = () => {
    if (busy) return;
    useIconsDialog.setState({ open: false });
    setTimeout(() => opener.current?.focus?.());
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), close());
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  });

  // 지금 아이콘 읽기
  useEffect(() => {
    let live = true;
    const urls: string[] = [];
    void (async () => {
      const options = await readOptions().catch(() => null);
      const rel = windowTarget(options).rel;
      const wb = await desktop!.read('game/' + rel).catch(() => null);
      const eb = await desktop!.read(EXE_REL).catch(() => null);
      if (!live) return;
      setWinRel(rel);
      const next: Record<Slot, Current> = { window: { url: null, info: '' }, exe: { url: null, info: '' } };
      if (wb) {
        const s = pngSize(wb);
        next.window = { url: blobUrl(wb, 'image/png'), info: s ? `있음 · ${s[0]}×${s[1]}` : '있음' };
        urls.push(next.window.url!);
      } else next.window = { url: null, info: '없음 · 렌파이가 창 아이콘 없이 켜요' };
      if (eb) {
        let sizes = '';
        try {
          sizes = ' · ' + icoSizes(eb).join(', ');
        } catch {
          sizes = ' · 읽지 못하는 파일';
        }
        next.exe = { url: blobUrl(eb, 'image/x-icon'), info: '있음' + sizes };
        urls.push(next.exe.url!);
      } else next.exe = { url: null, info: '없음 · 렌파이 기본 아이콘이 들어가요' };
      setCur(next);
    })();
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [reload]);

  // 원본 받기 (slots: 넣을 칸들)
  const take = async (slots: Slot[], name: string, bytes: Uint8Array) => {
    setErr('');
    setDone(null);
    try {
      const src = await readSource(name, bytes);
      const np = { ...pend };
      const ne = { ...errs };
      for (const s of slots) {
        if (src.kind === 'ico' && s === 'window') {
          if (slots.length > 1) {
            ne.window = '창 아이콘은 .ico를 쓸 수 없어서 exe 칸에만 넣었어요';
            continue;
          }
        }
        np[s] = { src, pad: src.w !== src.h };
        delete ne[s];
      }
      setPend(np);
      setErrs(ne);
    } catch (e) {
      const msg = e instanceof IconError ? e.message : String((e as Error)?.message ?? e);
      const ne = { ...errs };
      for (const s of slots) ne[s] = msg;
      setErrs(ne);
    }
  };

  const pick = async (slots: Slot[]) => {
    const r = await desktop!.pickFile?.('icon');
    if (!r) return;
    const bytes = r.rel ? await desktop!.read('game/' + r.rel) : await desktop!.readPicked!(r.token!);
    if (!bytes) return setErr('고른 파일을 읽지 못했어요');
    await take(slots, r.name, bytes);
  };

  const drop = (slots: Slot[]) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(null);
    const f = e.dataTransfer.files[0];
    if (f) await take(slots, f.name, new Uint8Array(await f.arrayBuffer()));
  };

  const probs: Record<Slot, string | null> = {
    window: pend.window ? problem(pend.window.src, pend.window.pad, true) : null,
    exe: pend.exe ? problem(pend.exe.src, pend.exe.pad, false) : null,
  };
  const ready = (Object.keys(pend) as Slot[]).filter((s) => !probs[s]);

  const save = async () => {
    setBusy(true);
    setErr('');
    const out: string[] = [];
    try {
      if (pend.window && !probs.window) {
        const options = await readOptions();
        const t = windowTarget(options);
        const png = await makeWindowPng(pend.window.src);
        const rel = 'game/' + t.rel;
        const b = await backup(rel);
        await desktop!.write(rel, png);
        out.push(`창 아이콘 → ${rel}` + (b ? ` (예전 것은 ${b})` : ''));
        if (t.options !== null) {
          const ob = await backup('game/options.rpy');
          await desktop!.write('game/options.rpy', t.options);
          out.push(`options.rpy의 config.window_icon을 "${t.rel}"로` + (ob ? ` (예전 것은 ${ob})` : ''));
        }
      }
      if (pend.exe && !probs.exe) {
        const ico = await makeIco(pend.exe.src);
        const b = await backup(EXE_REL);
        await desktop!.write(EXE_REL, ico);
        out.push(`exe 아이콘 → ${EXE_REL}` + (b ? ` (예전 것은 ${b})` : ''));
      }
      setPend({});
      setDone(out);
      setReload((n) => n + 1);
    } catch (e) {
      setErr('저장하지 못했어요: ' + String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const setPad = (s: Slot, pad: boolean) => setPend((p) => (p[s] ? { ...p, [s]: { ...p[s]!, pad } } : p));
  const unpick = (s: Slot) => setPend((p) => {
    const n = { ...p };
    delete n[s];
    return n;
  });

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal icon-dlg" role="dialog" aria-modal="true" aria-label="아이콘">
        <div className="mask-head">
          <h3>아이콘</h3>
          <span className="sp" />
          <button className="mask-x" title="닫기 (Esc)" disabled={busy} onClick={close}>✕</button>
        </div>
        <p className="mask-lead">게임을 배포할 때 쓰는 아이콘이에요. 둘 다 정사각형 256×256 이상인 PNG, JPEG, WebP 그림을 골라요. 투명한 바탕을 쓰려면 PNG나 WebP로. 크기별 그림은 pygaki가 만들어요.</p>
        <div className="icon-both">
          <button disabled={busy} onClick={() => void pick(['window', 'exe'])} onDragOver={(e) => e.preventDefault()} onDrop={drop(['window', 'exe'])} title="같은 그림으로 창 아이콘과 exe 아이콘을 한꺼번에 (끌어 놓아도 돼요)">
            그림 하나로 둘 다 고르기…
          </button>
        </div>

        <div className="icon-cards">
          <IconCard
            slot="window"
            title="창 아이콘"
            where={`game/${winRel}`}
            use="게임 창의 제목줄과 작업 표시줄. 게임을 다시 켜면 바뀌어요"
            need="PNG, JPEG, WebP. 정사각형 256×256 이상 (1024보다 크면 1024로 줄여 PNG로 저장)"
            cur={cur.window}
            pend={pend.window}
            prob={probs.window}
            err={errs.window}
            sizes={[64, 32]}
            busy={busy}
            drag={drag === 'window'}
            onDrag={(on) => setDrag(on ? 'window' : null)}
            onDrop={drop(['window'])}
            onPick={() => void pick(['window'])}
            onPad={(v) => setPad('window', v)}
            onUnpick={() => unpick('window')}
          />
          <IconCard
            slot="exe"
            title="윈도우 exe 아이콘"
            where={EXE_REL}
            use="탐색기에서 보이는 게임 exe 파일의 아이콘. 렌파이 런처 [배포판 만들기] 때 exe에 들어가요"
            need="PNG, JPEG, WebP. 정사각형 256×256 이상 → 16~256 크기를 담은 .ico로. 이미 만든 .ico(256 포함)는 그대로"
            cur={cur.exe}
            pend={pend.exe}
            prob={probs.exe}
            err={errs.exe}
            sizes={[48, 32, 16]}
            busy={busy}
            drag={drag === 'exe'}
            onDrag={(on) => setDrag(on ? 'exe' : null)}
            onDrop={drop(['exe'])}
            onPick={() => void pick(['exe'])}
            onPad={(v) => setPad('exe', v)}
            onUnpick={() => unpick('exe')}
          />
        </div>

        {err && <div className="mask-alert err" role="alert">{err}</div>}
        {done && (
          <div className="mask-done icon-done">
            <div>
              <b>저장했어요</b>
              {done.map((d) => (
                <small key={d}>{d}</small>
              ))}
            </div>
          </div>
        )}

        <div className="mask-foot">
          <button disabled={busy} onClick={() => void desktop!.openFolder('', false)}>프로젝트 폴더 열기</button>
          <span className="sp" />
          <button disabled={busy} onClick={close}>{done && !ready.length ? '닫기' : '취소'}</button>
          <button className="primary solid" disabled={busy || !ready.length} onClick={() => void save()}>{busy ? '저장하는 중…' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}

function IconCard(p: {
  slot: Slot;
  title: string;
  where: string;
  use: string;
  need: string;
  cur: Current;
  pend?: Pending;
  prob: string | null;
  err?: string;
  sizes: number[];
  busy: boolean;
  drag: boolean;
  onDrag: (on: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onPick: () => void;
  onPad: (v: boolean) => void;
  onUnpick: () => void;
}) {
  const src = p.pend?.src;
  // 새로 고른 그림의 미리보기 (크게 하나 + 실제로 보이는 작은 크기들)
  const views = useMemo(() => {
    if (!src || p.prob) return null;
    if (!src.bmp) return null;
    return { big: previewUrl(src, 128)!, small: p.sizes.map((s) => [s, previewUrl(src, s)!] as const) };
  }, [src, p.pend?.pad, p.prob]);
  const icoUrl = useMemo(() => (src?.raw ? blobUrl(src.raw, 'image/x-icon') : null), [src]);
  useEffect(() => () => void (icoUrl && URL.revokeObjectURL(icoUrl)), [icoUrl]);
  const bigUrl = views?.big ?? icoUrl ?? (!src ? p.cur.url : null);

  return (
    <section
      className={'icon-card' + (p.drag ? ' drag' : '') + (src ? ' picked' : '')}
      aria-label={p.title}
      onDragOver={(e) => (e.preventDefault(), p.onDrag(true))}
      onDragLeave={() => p.onDrag(false)}
      onDrop={p.onDrop}
    >
      <div className="icon-card-head">
        <b>{p.title}</b>
        <code>{p.where}</code>
      </div>
      <p className="icon-use">{p.use}</p>
      <div className="icon-view">
        <div className="icon-big checker">{bigUrl ? <img src={bigUrl} alt="" /> : <span className="icon-none">없음</span>}</div>
        <div className="icon-smalls">
          {p.sizes.map((s) => {
            const u = views?.small.find(([z]) => z === s)?.[1] ?? icoUrl ?? (!src ? p.cur.url : null);
            return (
              <div key={s} className="icon-small" title={`${s}×${s}로 보일 때`}>
                <div className="checker" style={{ width: s, height: s }}>{u && <img src={u} alt="" width={s} height={s} />}</div>
                <small>{s}</small>
              </div>
            );
          })}
        </div>
      </div>
      <div className="icon-state">
        {src ? (
          <span title={src.name}>{`새로 고름 · ${src.name} · ${src.kind === 'ico' ? '.ico ' + src.icoSizes!.join(', ') : `${src.w}×${src.h}`}`}</span>
        ) : (
          <span>{`지금 · ${p.cur.info}`}</span>
        )}
      </div>
      <p className="icon-need">{p.need}</p>
      {src && src.kind !== 'ico' && src.w !== src.h && (
        <label className="mask-check">
          <input type="checkbox" checked={p.pend!.pad} disabled={p.busy} onChange={(e) => p.onPad(e.target.checked)} />
          투명 여백으로 정사각형 만들기
        </label>
      )}
      {src && src.kind === 'jpeg' && !p.prob && <div className="mask-alert">JPEG는 투명한 곳이 없어서 아이콘 바탕이 네모로 보여요. 둥근 아이콘이면 투명 PNG를 골라요.</div>}
      {src && src.kind !== 'jpeg' && !src.alpha && !p.prob && <div className="mask-alert">이 그림에는 투명한 곳이 없어서 아이콘이 네모로 보여요.</div>}
      {(p.prob || p.err) && <div className="mask-alert err" role="alert">{p.prob ?? p.err}</div>}
      <div className="icon-card-foot">
        <button disabled={p.busy} onClick={p.onPick}>그림 고르기…</button>
        {src && <button disabled={p.busy} onClick={p.onUnpick} title="고른 것을 버리고 지금 아이콘 그대로">되돌리기</button>}
      </div>
    </section>
  );
}
