// 폴더 관리 (데스크톱 앱만): 툴바 [폴더 관리]를 누르면 뜨는 메뉴 (Command Palette 꼴).
// 대본 편집기의 기능마다 쓰는 폴더를 모아 두고, 고르면 탐색기로 연다. game 안의 폴더가 아직 없으면 만들고 연다.
// 위아래 화살표로 고르고 Enter로 열기, 찾기 칸에 치면 걸러짐, Esc나 바깥을 누르면 닫힘
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { desktop } from './desktop';
import { useStore } from './store';

interface Place {
  id: string;
  icon: string;
  title: string;
  rel?: string; // 프로젝트 폴더 기준 ('' = 프로젝트). 없으면 place
  place?: 'appSettings' | 'renpySaves'; // 프로젝트 밖
  use: string; // 이 폴더를 쓰는 기능
  sec: string;
}

const PLACES: Place[] = [
  { sec: '프로젝트', id: 'project', icon: '📁', title: '프로젝트 폴더', rel: '', use: '대본 파일(.flow.json), 오류 기록(traceback.txt, log.txt)' },
  { sec: '프로젝트', id: 'game', icon: '🎮', title: 'game 폴더', rel: 'game', use: '내보낸 원고(script_flow.rpy), 화면(pykaki_screens.rpy), 게임 설정' },
  { sec: '그림과 소리', id: 'images', icon: '🖼', title: '그림', rel: 'game/images', use: '배경(bg), 캐릭터, 기타 그림. 대사·선택지 뒤 그림' },
  { sec: '그림과 소리', id: 'movies', icon: '🎞', title: '영상', rel: 'game/movies', use: '대사·선택지 뒤 영상(webm). 밖에서 고른 영상을 여기로 복사' },
  { sec: '그림과 소리', id: 'audio', icon: '🎵', title: '음악, 효과음', rel: 'game/audio', use: '음악·효과음 줄, 대사 소리' },
  { sec: '그림과 소리', id: 'voice', icon: '🎙', title: '음성', rel: 'game/audio/voice', use: '대사 음성 (이름 규칙: 캐릭터_label_번호)' },
  { sec: '꾸미기', id: 'fonts', icon: '🔤', title: '글꼴', rel: 'game/fonts', use: '대사·이름·선택지 글꼴' },
  { sec: '꾸미기', id: 'gui', icon: '🧩', title: 'UI 그림 (gui)', rel: 'game/gui', use: '대사창(textbox.png), 이름 칸, 버튼 그림' },
  { sec: '꾸미기', id: 'cursor', icon: '🖱', title: '커서 그림', rel: 'game/gui/cursor', use: '상자의 커서 (폴더 하나가 커서 하나)' },
  { sec: '꾸미기', id: 'ctc', icon: '⏳', title: '클릭 대기 그림', rel: 'game/gui/ctc', use: '상자의 클릭 대기 표시 (폴더 하나가 표시 하나)' },
  { sec: '꾸미기', id: 'effects', icon: '✨', title: '글자 효과, 그림 전환', rel: 'game/ui_kit/effects', use: '[효과] 탭의 효과 파일(.glsl)' },
  { sec: '꾸미기', id: 'shaders', icon: '🌈', title: '화면 셰이더', rel: 'game/screen_fx', use: '[셰이더] 탭의 화면 효과' },
  { sec: '기록', id: 'saves', icon: '💾', title: '렌파이 세이브', place: 'renpySaves', use: '게임의 세이브, 설정 (게임을 한 번 켜면 생김)' },
  { sec: '기록', id: 'app', icon: '⚙', title: 'pygaki 앱 설정', place: 'appSettings', use: '앱 설정, 창 자리' },
];

type Stat = { exists: boolean; path?: string };

export function FolderMenu({ anchor, onClose }: { anchor: HTMLElement; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(0);
  const [stat, setStat] = useState<Record<string, Stat>>({});
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const t = q.trim().toLowerCase();
  const list = PLACES.filter((p) => !t || (p.title + p.use + (p.rel ?? '')).toLowerCase().includes(t));
  const sel = list[Math.min(cur, list.length - 1)];

  // 폴더가 있는지 (없으면 "만들고 열기")
  useEffect(() => {
    let live = true;
    void Promise.all(
      PLACES.map(async (p): Promise<[string, Stat]> => {
        if (p.place) {
          const r = await desktop!.placeInfo?.(p.place).catch(() => null);
          return [p.id, r ? { exists: r.exists, path: r.path } : { exists: false }];
        }
        const st = await desktop!.stat(p.rel!).catch(() => null);
        return [p.id, { exists: !!st?.dir }];
      }),
    ).then((r) => live && setStat(Object.fromEntries(r)));
    return () => void (live = false);
  }, []);

  // 단추 아래, 화면 밖으로 나가지 않게
  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect();
    const w = box.current?.offsetWidth ?? 340;
    const h = box.current?.offsetHeight ?? 420;
    const left = Math.max(8, Math.min(a.left, window.innerWidth - w - 8));
    const top = a.bottom + 6 + h <= window.innerHeight - 8 ? a.bottom + 6 : Math.max(8, a.top - 6 - h);
    setPos((o) => (o && Math.abs(o.left - left) < 1 && Math.abs(o.top - top) < 1 ? o : { left, top }));
  });

  const close = () => {
    onClose();
    setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body || box.current?.contains(a)) anchor.focus();
    });
  };

  useEffect(() => {
    const down = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!box.current?.contains(n) && !anchor.contains(n)) close();
    };
    window.addEventListener('mousedown', down, true);
    return () => window.removeEventListener('mousedown', down, true);
  });

  const open = async (p: Place) => {
    const err = p.place ? await desktop!.openPlace?.(p.place) : await desktop!.openFolder(p.rel!, true);
    if (err) useStore.getState().say(`${p.title}: ${err}`);
    else close();
  };

  const key = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') setCur((i) => (Math.min(i, list.length - 1) + 1) % Math.max(1, list.length));
    else if (e.key === 'ArrowUp') setCur((i) => (Math.min(i, list.length - 1) - 1 + list.length) % Math.max(1, list.length));
    else if (e.key === 'Enter') sel && void open(sel);
    else if (e.key === 'Escape') close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const hint = (p: Place) => {
    const s = stat[p.id];
    if (!s) return '';
    if (p.place) return s.exists ? '' : '아직 없음';
    return s.exists ? '' : '없음, 만들고 열기';
  };

  return createPortal(
    <div ref={box} className="fmenu folder-menu" role="dialog" aria-label="폴더 관리" style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }} onKeyDown={key}>
      <div className="fmenu-search">
        <input autoFocus value={q} placeholder="어느 폴더를 열까요?" spellCheck={false} onChange={(e) => (setQ(e.target.value), setCur(0))} />
        <kbd>Esc</kbd>
      </div>
      <div className="fmenu-list" role="menu">
        {list.map((p, i) => (
          <div key={p.id} style={{ display: 'contents' }}>
            {(i === 0 || list[i - 1].sec !== p.sec) && <div className="fmenu-sec">{p.sec}</div>}
            <button role="menuitem" className={'fmenu-item' + (p === sel ? ' cur' : '') + (stat[p.id] && !stat[p.id].exists ? ' missing' : '')} title={p.use} onMouseEnter={() => setCur(i)} onClick={() => void open(p)}>
              <span className="fmenu-icon">{p.icon}</span>
              <span className="fmenu-title">{p.title}</span>
              <span className="fmenu-hint">{hint(p) || (p.place ? '' : p.rel || '/')}</span>
            </button>
          </div>
        ))}
        {!list.length && <div className="fmenu-empty">맞는 폴더가 없어요</div>}
      </div>
      {sel && (
        <div className="folder-use">
          <b>쓰는 곳</b> {sel.use}
          {stat[sel.id]?.path && <code>{stat[sel.id].path}</code>}
        </div>
      )}
      <div className="fmenu-keys">
        <span><kbd>↑</kbd><kbd>↓</kbd> 고르기</span>
        <span><kbd>Enter</kbd> 탐색기로 열기</span>
        <span><kbd>Esc</kbd> 닫기</span>
      </div>
    </div>,
    document.body,
  );
}
