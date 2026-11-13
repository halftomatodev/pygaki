// 오른쪽 칸(상자 편집)의 배경 / 그림·영상 / 소리 카드. 연결한 게임 폴더의 파일을 눌러서 줄로 넣는다.
// 줄은 대사 사이 차례가 중요해서 대사 카드에 그대로 있고, 여기서는 "지금 쓰는 줄 바로 앞"(없으면 상자 끝)에 넣기만 한다.
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { imageNameOf, movieNameOf, pictureOf, scanFolder, soundUrl, useGameFolder } from './gameFolder';
import { desktop } from './desktop';
import { useStore } from './store';
import type { BoxNode, Line, LineType } from './types';
import { uid } from './util';
import type { Upd } from './Inspector';
import { GoHere, MoveBtn, PickBand } from './PickPos';

type Kind = 'bg' | 'pic' | 'sound';
const TYPES: Record<Kind, LineType[]> = { bg: ['scene'], pic: ['show', 'hide'], sound: ['sound', 'music'] };

export function StageCards({ b, upd, use }: { b: BoxNode; upd: Upd; use: (id: string) => string }) {
  const activeLine = useStore((s) => s.activeLine);
  const add = (l: Omit<Line, 'id' | 'text'>) => {
    const nl: Line = { id: uid('l'), text: '', ...l };
    upd((x) => {
      const i = x.lines.findIndex((y) => y.id === activeLine);
      if (i >= 0) x.lines.splice(i, 0, nl);
      else x.lines.push(nl);
    });
  };
  return (
    <>
      <Card id="i-bg" title="배경 (그림, 영상)" className={use('i-bg')}>
        <Used b={b} kind="bg" />
        <BgPicker add={add} />
      </Card>
      <Card id="i-pic" title="그림, 영상" className={use('i-pic')}>
        <CharPics b={b} add={add} />
        <Used b={b} kind="pic" />
        <PicPicker add={add} />
      </Card>
      <Card id="i-sound" title="효과음, 음악" className={use('i-sound')}>
        <Used b={b} kind="sound" />
        <SoundPicker add={add} />
      </Card>
    </>
  );
}

// 지금 쓰는 대사 줄의 캐릭터 그림(표정). 대사 줄은 글만 고치고, 표정은 여기서 골라 그 대사 바로 앞에 보이기 줄로 넣는다
function CharPics({ b, add }: { b: BoxNode; add: (l: Omit<Line, 'id' | 'text'>) => void }) {
  const activeLine = useStore((s) => s.activeLine);
  const chars = useStore((s) => s.project.characters);
  const images = useGameFolder((s) => s.media.images);
  const linked = useGameFolder((s) => !!s.name);
  const l = b.lines.find((x) => x.id === activeLine);
  if (!l || l.type !== 'say' || !l.who) return null;
  const who = l.who;
  const c = chars.find((x) => x.id === who);
  const names = images.filter((n) => words(n)[0] === who);
  const put = (attr: string) => add({ type: 'show', kind: 'char', who, attr: attr || undefined });
  return (
    <div className="sc-char">
      <div className="sc-char-h">{c?.name ?? who}의 그림 · 지금 쓰는 대사 바로 앞에 넣어요</div>
      {linked && names.length ? (
        <div className="sc-grid">
          {names.map((n) => (
            <button key={n} onClick={() => put(words(n).slice(1).join(' '))} title={n}>
              <Pic name={n} />
              <span>{words(n).slice(1).join(' ') || '(기본)'}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="tip">{linked ? `images 폴더에 "${who}"로 시작하는 그림이 없어요 (예: "${who} smile.png").` : '프로젝트 연결 안 됨'}</p>
      )}
      <TextAdd placeholder={`표정 (예: smile) → show ${who} smile`} onAdd={put} />
    </div>
  );
}

// 이 상자에 이미 있는 그 종류 줄. 누르면 그 줄 칸으로 간다
function Used({ b, kind }: { b: BoxNode; kind: Kind }) {
  const rows = b.lines.map((l, i) => [l, i] as const).filter(([l]) => TYPES[kind].includes(l.type));
  if (!rows.length) return <p className="tip">이 상자에는 아직 없어요.</p>;
  return (
    <div className="sc-used">
      {rows.map(([l, i]) => (
        <div key={l.id} className="sc-row">
          <div className="sc-row-top">
            <button className="sc-go" onClick={() => useStore.setState({ focusLineId: l.id, activeLine: l.id })} title="그 줄로 가요">
              <span className="sc-n">{i + 1}</span>
              {lineText(l)}
            </button>
            {(l.type === 'show' || l.type === 'scene') && <MoveBtn where={{ line: l.id }} tab="stage" what="이미지/영상" />}
            <GoHere where={{ line: l.id }} short />
          </div>
          {(l.type === 'show' || l.type === 'scene') && <PickBand where={{ line: l.id }} tab="stage" what="그림" />}
        </div>
      ))}
    </div>
  );
}

function lineText(l: Line) {
  if (l.type === 'scene') return '배경 ' + (l.image || '(검은 화면)');
  if (l.type === 'show') return '보이기 ' + (l.kind === 'char' || !l.kind ? [l.who, l.attr].filter(Boolean).join(' ') : l.image ?? '');
  if (l.type === 'hide') return '숨기기 ' + (l.kind === 'bg' ? '배경' : l.kind === 'etc' ? l.image ?? '' : l.who ?? '');
  if (l.type === 'music') return l.stop ? '음악 멈추기' : '음악 ' + (l.file ?? '');
  return '효과음 ' + (l.file ?? '');
}

const words = (n: string) => n.split(' ');

// [📂 파일 고르기] (앱): 탐색기로 고른 파일의 game 기준 경로. game 밖이면 묻고 images·movies·audio로 복사한다
async function pickGameFile(kind: 'image' | 'sound'): Promise<string | null> {
  const r = await desktop?.pickFile?.(kind).catch((e) => (alert('파일을 고르지 못했어요: ' + e.message), null));
  if (!r) return null;
  const dir = kind === 'sound' ? 'audio' : /\.webm$/i.test(r.name) ? 'movies' : 'images';
  if (r.rel) {
    if (kind === 'sound' || /^(images|movies)\//.test(r.rel)) return r.rel;
    alert(`${r.rel}은(는) images, movies 폴더 밖이라 렌파이가 그림 이름으로 못 찾아요. game/${dir} 폴더 안의 파일을 골라 주세요.`);
    return null;
  }
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
// game 기준 경로 → 렌파이 그림 이름 ("images/bg room.png" → "bg room")
const imageOfPath = (rel: string) => {
  const file = rel.split('/').pop()!;
  return rel.startsWith('movies/') ? movieNameOf(file) : imageNameOf(file);
};

function PickFile({ kind, onPick }: { kind: 'image' | 'sound'; onPick: (rel: string) => void }) {
  if (!desktop?.pickFile) return null;
  return (
    <button className="sc-pickfile" onClick={() => void pickGameFile(kind).then((rel) => rel && onPick(rel))} title={kind === 'sound' ? '탐색기 창에서 소리 파일을 골라요' : '탐색기 창에서 그림·영상 파일을 골라요'}>
      📂 파일 고르기
    </button>
  );
}

function BgPicker({ add }: { add: (l: Omit<Line, 'id' | 'text'>) => void }) {
  const images = useGameFolder((s) => s.media.images);
  const names = images.filter((n) => words(n)[0] === 'bg' && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  const fromFile = (rel: string) => {
    const n = imageOfPath(rel);
    if (words(n)[0] === 'bg' && words(n).length > 1) add({ type: 'scene', image: words(n).slice(1).join(' ') });
    else alert(`배경 그림은 파일 이름이 bg로 시작해야 해요 (예: "bg room.png"). 이 파일의 렌파이 이름은 "${n}"이라 배경으로 쓸 수 없어요. [그림, 영상] 카드에서 넣거나 파일 이름을 바꿔 주세요.`);
  };
  return (
    <>
      <PickFile kind="image" onPick={fromFile} />
      <Grid names={names} pic={(n) => 'bg ' + n} onPick={(n) => add({ type: 'scene', image: n })} empty="images 폴더에 bg로 시작하는 그림·영상이 없어요." />
      <TextAdd placeholder="배경 이름 (예: room)" onAdd={(n) => add({ type: 'scene', image: n })} extra={<button onClick={() => add({ type: 'scene', image: '' })}>검은 화면</button>} />
    </>
  );
}

function PicPicker({ add }: { add: (l: Omit<Line, 'id' | 'text'>) => void }) {
  const images = useGameFolder((s) => s.media.images);
  const chars = useStore((s) => s.project.characters);
  const names = images.filter((n) => words(n)[0] !== 'bg');
  const show = (n: string) => {
    const [head, ...rest] = words(n);
    if (chars.some((c) => c.id === head)) add({ type: 'show', kind: 'char', who: head, attr: rest.join(' ') || undefined });
    else add({ type: 'show', kind: 'etc', image: n });
  };
  return (
    <>
      <PickFile kind="image" onPick={(rel) => show(imageOfPath(rel))} />
      <Grid names={names} pic={(n) => n} onPick={show} empty="images, movies 폴더에 배경 말고 다른 그림·영상이 없어요." />
      <TextAdd placeholder="이미지 이름 (예: mina smile)" onAdd={show} />
    </>
  );
}

function SoundPicker({ add }: { add: (l: Omit<Line, 'id' | 'text'>) => void }) {
  const audio = useGameFolder((s) => s.media.audio);
  const [music, setMusic] = useState(false);
  const put = (f: string) => add({ type: music ? 'music' : 'sound', file: f });
  return (
    <>
      <div className="seg sc-seg">
        <button className={music ? '' : 'on'} onClick={() => setMusic(false)}>효과음 (한 번)</button>
        <button className={music ? 'on' : ''} onClick={() => setMusic(true)}>음악 (계속)</button>
      </div>
      <PickFile kind="sound" onPick={(rel) => put(rel.startsWith('audio/') ? rel.slice(6) : rel)} />
      {audio.length ? (
        <div className="sc-sounds">
          {audio.map((f) => (
            <div key={f} className="sc-sound">
              <Listen file={f} />
              <button className="sc-sname" onClick={() => put(f)} title="이 소리 줄을 넣어요">{f}</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="tip">{useGameFolder.getState().name ? 'audio 폴더에 소리 파일이 없어요.' : '프로젝트 연결 안 됨'}</p>
      )}
      <TextAdd placeholder="파일 이름 (예: door.ogg)" onAdd={put} extra={music ? <button onClick={() => add({ type: 'music', stop: true })}>음악 멈추기</button> : undefined} />
    </>
  );
}

// 그림·영상 이름 격자 (작은 그림과 이름). 폴더를 연결하지 않았으면 안내만
function Grid({ names, pic, onPick, empty }: { names: string[]; pic: (n: string) => string; onPick: (n: string) => void; empty: string }) {
  const linked = useGameFolder((s) => !!s.name);
  if (!linked) return <p className="tip">프로젝트 연결 안 됨</p>;
  if (!names.length) return <p className="tip">{empty}</p>;
  return (
    <div className="sc-grid">
      {names.map((n) => (
        <button key={n} onClick={() => onPick(n)} title={n}>
          <Pic name={pic(n)} />
          <span>{n}</span>
        </button>
      ))}
    </div>
  );
}

function Pic({ name }: { name: string }) {
  const [p, setP] = useState<{ url: string; video: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    pictureOf(name).then((v) => live && setP(v));
    return () => void (live = false);
  }, [name]);
  if (!p) return <i className="sc-pic" />;
  return p.video ? <video className="sc-pic" src={p.url} muted /> : <img className="sc-pic" src={p.url} alt="" />;
}

let playing: HTMLAudioElement | null = null;
function Listen({ file }: { file: string }) {
  const play = async () => {
    playing?.pause();
    const url = await soundUrl(file);
    if (!url) return;
    playing = new Audio(url);
    playing.play().catch(() => {});
  };
  return (
    <button className="sc-play" onClick={play} title="들어 보기">
      ▶
    </button>
  );
}

function TextAdd({ placeholder, onAdd, extra }: { placeholder: string; onAdd: (v: string) => void; extra?: React.ReactNode }) {
  const [v, setV] = useState('');
  const go = () => {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV('');
  };
  return (
    <div className="row sc-add">
      <input className="grow" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
      <button className="primary" disabled={!v.trim()} onClick={go}>넣기</button>
      {extra}
    </div>
  );
}
