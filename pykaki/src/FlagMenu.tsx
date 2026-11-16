// 플래그 새로 만들기 메뉴 (Command Palette 꼴): 찾기 칸 + 용례 목록. 줄에 올리면 옆에 설명 카드(Hover Card)로 영상과 쓰는 곳.
// 위아래 화살표로 고르고 Enter로 만들기, Esc나 바깥을 누르면 닫힘. [화면] 탭의 [+ HUD 틀에서]도 같은 메뉴(PickMenu)를 쓴다
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FLAG_RECIPES, type DemoStep } from './flagRecipes';
import type { FlagKind, FlagUi } from './types';
import { FlagWidget } from './FlagWidget';
import { flagUi } from './flagUi';

// 메뉴 한 줄과 설명 카드에 들어가는 것
export interface PickEntry {
  id: string;
  icon: string;
  title: string;
  kindHint: string; // 메뉴 줄 오른쪽 작은 글
  desc: string;
  chips: string[]; // 카드 머리의 플래그 이름
  write: string[]; // ✎ 바꾸는 곳
  read: string[]; // ? 보는 곳
  code: string;
  clip?: string; // 영상 url
  demo?: { flags: { name: string; kind: FlagKind; ui?: FlagUi }[]; steps: DemoStep[] }; // 움직이는 견본 (있으면 영상 대신)
  foot: string; // 카드 바닥 글
}

export function FlagMenu({ anchor, onPick, onClose }: { anchor: HTMLElement; onPick: (r: (typeof FLAG_RECIPES)[number]) => void; onClose: () => void }) {
  const items: PickEntry[] = FLAG_RECIPES.map((r) => ({ ...r, clip: r.demo ? undefined : r.clip, demo: r.demo && { flags: r.flags, steps: r.demo }, chips: r.flags.map((f) => f.name), foot: r.flags.length > 1 ? `누르거나 Enter: 플래그 ${r.flags.length}개 만들기` : '누르거나 Enter: 플래그 만들기' }));
  return <PickMenu anchor={anchor} items={items} first={1} placeholder="어떤 플래그를 만들까요?" section="용례에서 만들기" empty="맞는 용례가 없어요" onPick={(e) => onPick(FLAG_RECIPES.find((r) => r.id === e.id)!)} onClose={onClose} />;
}

export function PickMenu({ anchor, items, first = 0, placeholder, section, empty, onPick, onClose }: { anchor: HTMLElement; items: PickEntry[]; first?: number; placeholder: string; section: string; empty: string; onPick: (e: PickEntry) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(first); // 플래그 메뉴는 처음에 첫 용례(호감도)를 보여 줌
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const list = items.filter((r) => !q.trim() || (r.title + r.kindHint + r.desc + r.chips.join(' ')).toLowerCase().includes(q.trim().toLowerCase()));
  const sel = list[Math.min(cur, list.length - 1)];

  // 단추 아래, 화면 밖으로 나가지 않게 (오른쪽 칸 단추라 오른쪽 끝을 맞춤)
  useLayoutEffect(() => {
    const a = anchor.getBoundingClientRect();
    const w = box.current?.offsetWidth ?? 300;
    const h = box.current?.offsetHeight ?? 320;
    const left = Math.max(8, Math.min(a.right - w, window.innerWidth - w - 8));
    const top = a.bottom + 6 + h <= window.innerHeight - 8 ? a.bottom + 6 : Math.max(8, a.top - 6 - h);
    setPos((o) => (o && Math.abs(o.left - left) < 1 && Math.abs(o.top - top) < 1 ? o : { left, top }));
  });

  // 닫으면 초점을 [+ 추가] 단추로 되돌림. 바깥을 눌러 초점이 다른 칸으로 갔으면 그대로 둠
  const close = () => {
    onClose();
    setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body || box.current?.contains(a)) anchor.focus();
    });
  };

  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !anchor.contains(t)) close();
    };
    window.addEventListener('mousedown', down, true);
    return () => window.removeEventListener('mousedown', down, true);
  });

  const key = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return; // 한글을 짜는 중의 Enter·화살표는 입력기 몫
    if (e.key === 'ArrowDown') setCur((i) => (Math.min(i, list.length - 1) + 1) % Math.max(1, list.length));
    else if (e.key === 'ArrowUp') setCur((i) => (Math.min(i, list.length - 1) - 1 + list.length) % Math.max(1, list.length));
    else if (e.key === 'Enter') sel && onPick(sel);
    else if (e.key === 'Escape') close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return createPortal(
    <div ref={box} className="fmenu" style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }} onKeyDown={key}>
      <div className="fmenu-search">
        <input autoFocus value={q} placeholder={placeholder} spellCheck={false} onChange={(e) => (setQ(e.target.value), setCur(0))} />
        <kbd>Esc</kbd>
      </div>
      <div className="fmenu-sec">{section}</div>
      <div className="fmenu-list" role="menu">
        {list.map((r, i) => (
          <button key={r.id} role="menuitem" className={'fmenu-item' + (r === sel ? ' cur' : '')} onMouseEnter={() => setCur(i)} onClick={() => onPick(r)}>
            <span className="fmenu-icon">{r.icon}</span>
            <span className="fmenu-title">{r.title}</span>
            <span className="fmenu-hint">{r.kindHint}</span>
          </button>
        ))}
        {!list.length && <div className="fmenu-empty">{empty}</div>}
      </div>
      <div className="fmenu-keys">
        <span><kbd>↑</kbd><kbd>↓</kbd> 고르기</span>
        <span><kbd>Enter</kbd> 만들기</span>
        <span><kbd>Esc</kbd> 닫기</span>
      </div>
      {sel && <RecipeCard r={sel} menu={box.current} />}
    </div>,
    document.body,
  );
}

// 설명 카드: 메뉴 왼쪽(자리가 없으면 오른쪽)에 붙어서, 고른 줄이 바뀌면 내용만 바뀜
function RecipeCard({ r, menu }: { r: PickEntry; menu: HTMLElement | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<'left' | 'right'>('left');
  useLayoutEffect(() => {
    const m = menu?.getBoundingClientRect();
    const w = ref.current?.offsetWidth ?? 300;
    if (m) setSide(m.left - 10 - w >= 8 ? 'left' : 'right');
  });
  return (
    <div ref={ref} className={'fmenu-card ' + side}>
      <div className="fmenu-card-head">
        <span className="fmenu-icon">{r.icon}</span>
        <b>{r.title}</b>
        <span className="fmenu-chips">
          {r.chips.map((f) => (
            <code key={f}>{f}</code>
          ))}
        </span>
      </div>
      <p className="fmenu-desc">{r.desc}</p>
      {r.demo && <RecipeDemo key={r.id} demo={r.demo} />}
      {r.clip && (
        <div className="clip fmenu-clip">
          <video key={r.id} src={r.clip} autoPlay loop muted playsInline />
          <span>렌파이 견본</span>
        </div>
      )}
      {(r.write.length > 0 || r.read.length > 0) && (
        <ul className="fmenu-uses">
          {r.write.map((w) => (
            <li key={w} className="w">✎ {w}</li>
          ))}
          {r.read.map((w) => (
            <li key={w}>? {w}</li>
          ))}
        </ul>
      )}
      <pre className="fd-code">{r.code}</pre>
      <div className="fmenu-foot">{r.foot}</div>
    </div>
  );
}

// 움직이는 견본 (FEATURE 20): 걸음마다 꼴의 값이 바뀌고, 그 아래에 그 값을 만든 식과 보이는 대사·선택지. 끝나면 처음부터
function RecipeDemo({ demo }: { demo: NonNullable<PickEntry['demo']> }) {
  const [i, setI] = useState(0);
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % demo.steps.length), 1500);
    return () => clearInterval(t);
  }, [demo, reduce]);
  const s = demo.steps[Math.min(i, demo.steps.length - 1)];
  return (
    <div className="fdemo" aria-label="견본">
      <div className="fdemo-looks">
        {demo.flags.map((f) => (
          <div key={f.name} className="fdemo-look">
            <code>{f.name}</code>
            <FlagWidget ui={flagUi(f)} value={s.vals[f.name] ?? (f.kind === 'bool' ? false : f.kind === 'int' ? 0 : '')} options={flagUi(f).options} label={f.name} />
          </div>
        ))}
      </div>
      <div className="fdemo-step">
        <pre className="fdemo-code">{s.code}</pre>
        {s.say && <div className="fdemo-say">{s.say}</div>}
        {s.choice && <div className={'fdemo-choice' + (s.choice.open ? ' open' : '')}>{s.choice.open ? '◆' : '🔒'} {s.choice.text}</div>}
      </div>
      <div className="fdemo-dots">
        {demo.steps.map((_, k) => (
          <button key={k} className={k === i ? 'on' : ''} aria-label={`${k + 1}번째`} onClick={() => setI(k)} />
        ))}
      </div>
    </div>
  );
}
