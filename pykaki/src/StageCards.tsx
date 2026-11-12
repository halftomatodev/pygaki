// 오른쪽 칸(상자 편집)의 배경 / 그림·영상 / 소리 카드. 연결한 게임 폴더의 파일을 눌러서 줄로 넣는다.
// 줄은 대사 사이 차례가 중요해서 대사 카드에 그대로 있고, 여기서는 "지금 쓰는 줄 바로 앞"(없으면 상자 끝)에 넣기만 한다.
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { pictureOf, soundUrl, useGameFolder } from './gameFolder';
import { useStore } from './store';
import type { BoxNode, Line, LineType } from './types';
import { uid } from './util';
import type { Upd } from './Inspector';

type Kind = 'bg' | 'pic' | 'sound';
const TYPES: Record<Kind, LineType[]> = { bg: ['scene'], pic: ['show', 'hide'], sound: ['sound', 'music'] };

export function StageCards({ b, upd }: { b: BoxNode; upd: Upd }) {
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
      <Card id="i-bg" title="배경 (그림, 영상)">
        <Used b={b} kind="bg" />
        <BgPicker add={add} />
      </Card>
      <Card id="i-pic" title="그림, 영상">
        <Used b={b} kind="pic" />
        <PicPicker add={add} />
      </Card>
      <Card id="i-sound" title="효과음, 음악">
        <Used b={b} kind="sound" />
        <SoundPicker add={add} />
      </Card>
    </>
  );
}

// 이 상자에 이미 있는 그 종류 줄. 누르면 그 줄 칸으로 간다
function Used({ b, kind }: { b: BoxNode; kind: Kind }) {
  const rows = b.lines.map((l, i) => [l, i] as const).filter(([l]) => TYPES[kind].includes(l.type));
  if (!rows.length) return <p className="tip">이 상자에는 아직 없어요.</p>;
  return (
    <div className="sc-used">
      {rows.map(([l, i]) => (
        <button key={l.id} onClick={() => useStore.setState({ focusLineId: l.id, activeLine: l.id })} title="그 줄로 가요">
          <span className="sc-n">{i + 1}</span>
          {lineText(l)}
        </button>
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

function BgPicker({ add }: { add: (l: Omit<Line, 'id' | 'text'>) => void }) {
  const images = useGameFolder((s) => s.media.images);
  const names = images.filter((n) => words(n)[0] === 'bg' && words(n).length > 1).map((n) => words(n).slice(1).join(' '));
  return (
    <>
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
        <p className="tip">{useGameFolder.getState().name ? 'audio 폴더에 소리 파일이 없어요.' : '렌파이 프로젝트를 연결하면 audio 폴더의 소리를 골라요.'}</p>
      )}
      <TextAdd placeholder="파일 이름 (예: door.ogg)" onAdd={put} extra={music ? <button onClick={() => add({ type: 'music', stop: true })}>음악 멈추기</button> : undefined} />
    </>
  );
}

// 그림·영상 이름 격자 (작은 그림과 이름). 폴더를 연결하지 않았으면 안내만
function Grid({ names, pic, onPick, empty }: { names: string[]; pic: (n: string) => string; onPick: (n: string) => void; empty: string }) {
  const linked = useGameFolder((s) => !!s.name);
  if (!linked) return <p className="tip">렌파이 프로젝트를 연결하면 game 폴더의 그림·영상을 눌러서 골라요.</p>;
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
