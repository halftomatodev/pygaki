// [글꼴] 화면: 게임 폴더의 글꼴을 보고, 넣고, 기본 글꼴(대사·이름·메뉴·선택지)로 정하고, 안 쓰는 것은 뺀다.
// 파일 다루기와 계산은 fontsLib.ts, 글꼴 파일 읽기는 fontInfo.ts. 데스크톱 앱에서만 (웹 개발 서버는 안내만).
// 꼴: 왼쪽 목록(리스트) + 오른쪽 카드(견본, 글자, 기본 글꼴, 정보, 쓰인 곳). 빈 목록은 Empty State, 경고는 Inline Alert
import { useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Resizer } from './Resizer';
import { useStore } from './store';
import { useLive } from './showpyLive';
import { isDesktop, desktop } from './desktop';
import { gameFont, useGameFolder } from './gameFolder';
import { coverage, missingChars, type FontInfo } from './fontInfo';
import {
  dropFont, fontInfoOf, fontUses, gameFonts, pickFont, readGui, readRoles, removable, removeFont, roleFile, ROLES, RENPY_DEFAULT_FONT, scriptText, setRole, usedAnywhere,
  type FontUses, type RoleId, type RoleValue,
} from './fontsLib';

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파';
const SAMPLES = ['가나다라마바사 아자차카타파하', 'あいうえお カタカナ 漢字', 'The quick brown fox 0123456789'];
const mb = (n: number) => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB');
const fileName = (p: string) => p.split('/').pop() ?? p;

// 라이선스 글로 대강 가름. 확실하지 않으면 ''
function licenseKind(i: FontInfo | null): { ok: boolean; text: string } | null {
  const t = (i?.license ?? '') + ' ' + (i?.licenseUrl ?? '');
  if (/open font license|scripts\.sil\.org\/ofl|openfontlicense|\bOFL\b/i.test(t)) return { ok: true, text: 'SIL 오픈 폰트 라이선스(OFL): 게임에 넣어 배포해도 돼요 (글꼴만 따로 팔면 안 돼요)' };
  if (/apache license/i.test(t)) return { ok: true, text: '아파치 라이선스: 게임에 넣어 배포해도 돼요' };
  if (/microsoft supplied font|you may use this font to display and print content/i.test(t)) return { ok: false, text: '윈도우에 든 글꼴이에요. 게임에 넣어 배포하면 안 될 수 있어요' };
  return null;
}

interface Loaded { size: number; info: FontInfo | null }

// 글꼴에 없는 글자는 렌파이처럼 네모로 (브라우저는 다른 글꼴로 대신 그려서 있는 것처럼 보이니까)
function Tofu({ text, info }: { text: string; info: FontInfo | null }) {
  if (!info) return <>{text}</>;
  const out: React.ReactNode[] = [];
  let run = '';
  let k = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c <= 0x20 || info.has(c)) run += ch;
    else {
      if (run) out.push(run), (run = '');
      out.push(<span key={k++} className="fov-tofu" title={`이 글꼴에 없는 글자: ${ch}`}>□</span>);
    }
  }
  if (run) out.push(run);
  return <>{out}</>;
}

export function FontsView() {
  const say = useStore((s) => s.say);
  const project = useStore((s) => s.project);
  const media = useGameFolder((s) => s.media);
  const folderName = useGameFolder((s) => s.name);
  const fonts = useMemo(() => gameFonts(), [media]);
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [text, setText] = useState('');
  const [px, setPx] = useState(32);
  const [roles, setRoles] = useState<Record<RoleId, RoleValue> | null>(null);
  const [loaded, setLoaded] = useState<Record<string, Loaded | null>>({});
  const [uses, setUses] = useState<FontUses | null>(null);
  const [seq, setSeq] = useState(0); // 넣기·빼기·기본 글꼴을 바꾼 뒤 다시 읽기

  // gui.rpy의 기본 글꼴
  useEffect(() => {
    if (isDesktop) void readGui().then((g) => setRoles(readRoles(g)));
  }, [media, seq]);
  // 글꼴 정보: 차례로 읽어 둔다 (한글 표시, 크기)
  useEffect(() => {
    if (!isDesktop) return;
    let stop = false;
    void (async () => {
      for (const f of fonts) {
        if (stop) return;
        const v = await fontInfoOf(f).catch(() => null);
        if (!stop) setLoaded((o) => ({ ...o, [f]: v }));
      }
    })();
    return () => void (stop = true);
  }, [fonts, seq]);

  const q = query.trim().toLowerCase();
  const shown = fonts.filter((f) => !q || f.toLowerCase().includes(q) || (loaded[f]?.info?.family ?? '').toLowerCase().includes(q));
  const sel = (picked && fonts.includes(picked) ? picked : null) ?? shown[0] ?? null;
  const cur = sel ? loaded[sel] : undefined;
  const info = cur?.info ?? null;

  useEffect(() => {
    setUses(null);
    if (sel && roles) void fontUses(project, sel, roles).then(setUses);
  }, [sel, roles, project, seq]);

  const allText = useMemo(() => scriptText(project), [project]);
  const cov = useMemo(() => (info ? coverage(info) : []), [info]);
  const miss = useMemo(() => (info ? missingChars(info, allText) : null), [info, allText]);
  const fam = sel ? gameFont(sel) : undefined;
  const roleOf = (f: string) => (roles ? ROLES.filter((r) => { const x = roleFile(roles, r.id); return !!x && x.toLowerCase() === f.toLowerCase(); }) : []);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      say('글꼴: ' + String(e?.message ?? e));
    } finally {
      setBusy(false);
      setSeq((v) => v + 1);
    }
  };
  const afterAdd = async (rel: string | null | undefined) => {
    if (!rel) return;
    setPicked(rel);
    const v = await fontInfoOf(rel);
    const c = v?.info ? coverage(v.info) : [];
    const noHangul = c.find((x) => x.id === 'hangul' && !x.ok);
    say(`글꼴을 넣었어요: game/${rel}` + (noHangul ? ' (이 글꼴에는 한글이 거의 없어요)' : ''));
  };
  const add = () => act(async () => afterAdd(await pickFont()));
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const files = [...e.dataTransfer.files];
    if (!files.length) return;
    void act(async () => {
      for (const f of files) {
        const r = await dropFont(f);
        if (r.why) say(`${f.name}: ${r.why}`);
        else await afterAdd(r.rel);
      }
    });
  };
  const putRole = (id: RoleId, value: string | { same: RoleId }) =>
    act(async () => {
      const backup = await setRole(id, value);
      const r = ROLES.find((x) => x.id === id)!;
      say(`${r.label} 기본 글꼴을 바꿨어요 (game/gui.rpy). 켜 둔 게임은 Shift+R로 다시 읽어요` + (backup ? ` · 예전 gui.rpy는 ${backup}` : ''));
    });
  const remove = () =>
    sel &&
    act(async () => {
      if (!confirm(`${sel} 글꼴을 뺄까요?\n파일은 프로젝트 폴더의 ui_kit_backup/fonts/에 남겨 둬요.`)) return;
      const at = await removeFont(sel);
      setPicked(null);
      say(`글꼴을 뺐어요. 백업: ${at}`);
    });
  const goTo = (u: { nodeId: string; lineId: string }) => {
    useLive.setState({ view: 'script' });
    useStore.getState().select([u.nodeId]);
    useStore.getState().focusNodes([u.nodeId]);
    useStore.setState({ tab: 'edit', hideRight: false, focusLineId: u.lineId });
  };

  if (!isDesktop)
    return (
      <div className="sp-view fov">
        <div className="fov-empty">
          <div className="fov-empty-icon">🔤</div>
          <p>글꼴 관리는 pygaki 앱에서 렌파이 프로젝트를 열었을 때 써요.</p>
        </div>
      </div>
    );

  // 기본 글꼴 줄: 자리마다 지금 글꼴. 파일이 없거나 한글이 없으면 알림
  const roleRows = roles && (
    <div className="fov-roles">
      {ROLES.map((r) => {
        const v = roles[r.id];
        const f = roleFile(roles, r.id);
        const sameAs = v && 'same' in v ? ROLES.find((x) => x.id === v.same)!.label : null;
        const exists = !f || f === RENPY_DEFAULT_FONT || fonts.some((x) => x.toLowerCase() === f.toLowerCase());
        const li = f ? loaded[fonts.find((x) => x.toLowerCase() === f.toLowerCase()) ?? ''] : undefined;
        const noHangul = (f === RENPY_DEFAULT_FONT) || (li?.info && !coverage(li.info).find((c) => c.id === 'hangul')!.ok);
        return (
          <div key={r.id} className={'fov-role' + (f && sel && f.toLowerCase() === sel.toLowerCase() ? ' on' : '')} title={r.tip} onClick={() => f && fonts.includes(f) && setPicked(f)}>
            <span className="fov-role-label">{r.label}</span>
            <span className="fov-role-font">
              {f ? (f === RENPY_DEFAULT_FONT ? f + ' (렌파이 기본)' : f) : v && 'expr' in v ? v.expr : '(gui.rpy에 없음)'}
              {sameAs && <span className="tip">{` · ${sameAs}와 같게`}</span>}
            </span>
            {!exists && <span className="fov-warn" title="game 폴더에 이 파일이 없어요. 게임이 켜지지 않을 수 있어요">⚠ 파일 없음</span>}
            {exists && noHangul && <span className="fov-warn" title="이 글꼴에는 한글이 거의 없어서 한글이 네모로 나와요">⚠ 한글 없음</span>}
          </div>
        );
      })}
    </div>
  );

  const row = (f: string) => {
    const l = loaded[f];
    const c = l?.info ? coverage(l.info) : null;
    const rs = roleOf(f);
    return (
      <div key={f} className={'fxv-card fov-card' + (sel === f ? ' on' : '')} onClick={() => setPicked(f)}>
        <span className="fov-aa" style={{ fontFamily: `${gameFont(f)}, var(--font)` }}><Tofu text="가A" info={l?.info ?? null} /></span>
        <span className="fov-text">
          <span className="fxv-label">{l?.info?.family || fileName(f)}</span>
          <span className="fxv-name">{f}</span>
        </span>
        <span className="grow" />
        {rs.map((r) => <span key={r.id} className="sp-badge fov-role-tag">{r.label}</span>)}
        {l === null || (l && !l.info) ? <span className="fov-warn">못 읽음</span> : c && !c.find((x) => x.id === 'hangul')!.ok && <span className="fov-warn" title="한글이 거의 없는 글꼴이에요">한글 없음</span>}
        {l && <span className="fov-size">{mb(l.size)}</span>}
      </div>
    );
  };

  return (
    <div
      className={'sp-view fxv fov' + (drag ? ' drag' : '')}
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes('Files')) (e.preventDefault(), setDrag(true));
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={onDrop}
    >
      <div className="fxv-list">
        <div className="fxv-bar">
          <button className="primary" disabled={busy} onClick={add} title="탐색기 창에서 글꼴 파일(.ttf, .otf, .ttc)을 골라 game/fonts에 넣어요. 파일을 이 화면에 끌어다 놓아도 돼요">+ 글꼴 넣기</button>
          <input className="fxv-find" placeholder="찾기 (이름)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="grow" />
          <button onClick={() => void desktop!.openFolder('game/fonts', true)} title="game/fonts 폴더를 탐색기로 열어요 (없으면 만들어요)">폴더 열기</button>
        </div>
        <div className="fxv-cards">
          <h4>기본 글꼴 <span className="tip">game/gui.rpy · 오른쪽 [기본 글꼴로]에서 바꿔요</span></h4>
          {roleRows}
          <h4>{`${folderName ?? '게임'}의 글꼴`} <span className="tip">{fonts.length}</span></h4>
          {shown.map(row)}
          {!fonts.length && (
            <div className="fov-empty">
              <div className="fov-empty-icon">🔤</div>
              <p>아직 넣은 글꼴이 없어요. 글꼴 파일을 넣으면 대사·이름·선택지에 쓸 수 있어요.</p>
              <button className="primary" disabled={busy} onClick={add}>+ 글꼴 넣기</button>
              <p className="tip">.ttf, .otf, .ttc 파일을 이 화면에 끌어다 놓아도 돼요</p>
            </div>
          )}
          {fonts.length > 0 && !shown.length && <p className="tip">찾는 글꼴이 없어요.</p>}
        </div>
      </div>
      <Resizer size="fxSideW" grow={-1} className="right" />
      <div className="fxv-side">
        {!sel ? (
          <Card id="fo-none" title="견본">
            <p className="tip">왼쪽에서 글꼴을 고르거나 새로 넣어 주세요.</p>
          </Card>
        ) : (
          <>
            <Card id="fo-sample" title={<>{info?.family || fileName(sel)} <span className="fxv-name">{sel}</span></>}>
              {cur && !info && <div className="fov-alert bad">⚠ 이 파일을 글꼴로 읽지 못했어요. 렌파이에서도 오류가 날 수 있어요.</div>}
              {info && <p className="tip">□는 이 글꼴에 없는 글자예요. 게임에서도 네모로 나와요.</p>}
              <div className="fov-sample" style={{ fontFamily: `${fam}, var(--font)`, fontSize: px }}>
                <div><Tofu text={text.trim() || SAMPLE} info={info} /></div>
                {SAMPLES.map((s) => <div key={s} className="fov-sample-sub"><Tofu text={s} info={info} /></div>)}
              </div>
              <div className="fxv-row">
                <b>견본 글</b>
                <input className="grow" value={text} placeholder={SAMPLE} onChange={(e) => setText(e.target.value)} />
              </div>
              <div className="fxv-row">
                <b>크기</b>
                <input className="grow" type="range" min={12} max={72} value={px} onChange={(e) => setPx(Number(e.target.value))} />
                <span className="fx-kv">{px}</span>
              </div>
            </Card>
            {info && (
              <Card id="fo-glyphs" title="들어 있는 글자" hint="렌파이는 글꼴에 없는 글자를 네모(□)로 그려요" topic="글꼴 관리">
                <div className="fov-cov">
                  {cov.map((c) => (
                    <span key={c.id} className={'fov-cov-item' + (c.ok ? ' ok' : ' no')} title={`${c.have.toLocaleString()} / ${c.total.toLocaleString()}자`}>
                      {c.ok ? '✓' : '✕'} {c.label} <span className="tip">{`${c.have.toLocaleString()}자`}</span>
                    </span>
                  ))}
                </div>
                {miss && miss.total > 0 ? (
                  <div className="fov-alert warn">
                    {`⚠ 대본에 쓴 글자 중 이 글꼴에 없는 글자 ${miss.total}자:`} <span className="fov-miss">{miss.chars.join(' ')}{miss.total > miss.chars.length ? ' …' : ''}</span>
                    <div className="tip">이 글꼴로 그 글자를 쓰면 네모로 나와요. 다른 글꼴을 쓰거나 글자를 바꿔요.</div>
                  </div>
                ) : (
                  allText.trim() && <p className="tip">대본에 쓴 글자는 모두 들어 있어요.</p>
                )}
              </Card>
            )}
            <Card id="fo-roles" title="기본 글꼴로" hint="게임 전체의 기본 글꼴이에요. 한 줄만 다르게 하려면 대사 줄의 글꼴 칸이나 {font=} 태그를 써요" topic="글꼴 관리">
              <div className="fov-role-btns">
                {ROLES.map((r) => {
                  const on = roles && roleFile(roles, r.id)?.toLowerCase() === sel.toLowerCase();
                  return (
                    <button key={r.id} className={on ? 'on' : ''} disabled={busy || !!on || !roles} title={r.tip} onClick={() => putRole(r.id, sel)}>
                      {on ? '✓ ' : ''}{r.label}
                    </button>
                  );
                })}
              </div>
              {roles && roles.choice && !('same' in roles.choice) && (
                <p className="tip">
                  선택지 글꼴이 따로 정해져 있어요. <button className="link" disabled={busy} onClick={() => putRole('choice', { same: 'text' })}>대사와 같게</button>
                </p>
              )}
              <p className="tip">gui.rpy의 그 줄만 바꿔요. 처음 바꿀 때 예전 파일을 ui_kit_backup/gui/에 남겨요.</p>
            </Card>
            <Card id="fo-info" title="정보">
              <div className="fov-info">
                <span>파일</span><span>game/{sel}{cur ? ` · ${mb(cur.size)}` : ''}</span>
                {info?.style && (<><span>모양</span><span>{info.style}</span></>)}
                {info && info.faces > 1 && (<><span>글꼴 수</span><span>{`${info.faces}개 묶음 (.ttc) · 렌파이는 첫 글꼴을 써요`}</span></>)}
                {info && (<><span>글자 수</span><span>{`${info.count.toLocaleString()}자`}</span></>)}
              </div>
              {(() => {
                const k = licenseKind(info);
                return k ? <div className={'fov-alert ' + (k.ok ? 'ok' : 'warn')}>{k.ok ? 'ℹ' : '⚠'} {k.text}</div> : <p className="tip">배포하기 전에 글꼴의 라이선스를 확인해 주세요.</p>;
              })()}
              {info?.license && <details className="fov-lic"><summary>글꼴에 적힌 라이선스</summary><p>{info.license}</p>{info.licenseUrl && <p className="fxv-name">{info.licenseUrl}</p>}{info.copyright && <p className="tip">{info.copyright}</p>}</details>}
              {cur && cur.size > 8 * 1024 * 1024 && <p className="tip">큰 글꼴이에요. 게임 배포 파일이 그만큼 커져요.</p>}
            </Card>
            <Card id="fo-uses" title={<>쓰인 곳 <span className="tip">{!uses ? '세는 중…' : usedAnywhere(uses) ? '' : '어디에도 안 써요'}</span></>}>
              {uses && uses.roles.length > 0 && <p>{'기본 글꼴: '}{uses.roles.map((id) => ROLES.find((r) => r.id === id)!.label).join(', ')}</p>}
              {uses?.lines.slice(0, 30).map((u) => {
                const n = project.nodes.find((x) => x.id === u.nodeId);
                const l = n?.lines.find((x) => x.id === u.lineId);
                const c = !l && n?.exit.type === 'menu' ? n.exit.choices.find((x) => x.id === u.lineId) : null;
                return (
                  <div className="fxv-use" key={u.lineId}>
                    <span className="fxv-use-box">{n?.title || '(이름 없는 상자)'}</span>
                    <span className="fxv-use-text">{(l?.text ?? c?.text ?? '').slice(0, 40)}</span>
                    <button onClick={() => goTo(u)} title="[대본 편집]에서 이 줄이 든 상자로 가요">보기</button>
                  </div>
                );
              })}
              {uses && uses.lines.length > 30 && <p className="tip">{`… 외 ${uses.lines.length - 30}줄`}</p>}
              {uses?.files.map((f) => (
                <div className="fxv-use" key={f.file}>
                  <span className="fxv-use-box">게임 코드</span>
                  <span className="fxv-use-text">{`game/${f.file} (${f.n}곳)`}</span>
                </div>
              ))}
              {removable(sel) ? (
                <div className="fxv-row">
                  <span className="grow" />
                  <button disabled={busy || !uses || usedAnywhere(uses)} title={uses && usedAnywhere(uses) ? '쓰는 곳이 있어서 뺄 수 없어요' : '이 글꼴을 game/fonts에서 빼요 (ui_kit_backup/fonts/에 남김)'} onClick={remove}>
                    글꼴 빼기
                  </button>
                </div>
              ) : (
                <p className="tip">game 폴더 바로 아래의 글꼴은 여기서 빼지 않아요.</p>
              )}
            </Card>
          </>
        )}
      </div>
      {drag && <div className="fov-drop">여기에 놓으면 game/fonts에 넣어요</div>}
    </div>
  );
}
