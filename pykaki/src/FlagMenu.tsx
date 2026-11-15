// 플래그 새로 만들기 메뉴 (Command Palette 꼴): 찾기 칸 + 용례 목록. 줄에 올리면 옆에 설명 카드(Hover Card)로 영상과 쓰는 곳.
// 위아래 화살표로 고르고 Enter로 만들기, Esc나 바깥을 누르면 닫힘
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FLAG_RECIPES, type FlagRecipe } from './flagRecipes';

export function FlagMenu({ anchor, onPick, onClose }: { anchor: HTMLElement; onPick: (r: FlagRecipe) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(1); // 처음엔 첫 용례(호감도)를 보여 줌
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const list = FLAG_RECIPES.filter((r) => !q.trim() || (r.title + r.kindHint + r.desc + r.flags.map((f) => f.name).join(' ')).toLowerCase().includes(q.trim().toLowerCase()));
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

  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    window.addEventListener('mousedown', down, true);
    return () => window.removeEventListener('mousedown', down, true);
  }, [anchor, onClose]);

  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setCur((i) => (Math.min(i, list.length - 1) + 1) % Math.max(1, list.length));
    else if (e.key === 'ArrowUp') setCur((i) => (Math.min(i, list.length - 1) - 1 + list.length) % Math.max(1, list.length));
    else if (e.key === 'Enter') sel && onPick(sel);
    else if (e.key === 'Escape') onClose();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return createPortal(
    <div ref={box} className="fmenu" style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }} onKeyDown={key}>
      <div className="fmenu-search">
        <input autoFocus value={q} placeholder="어떤 플래그를 만들까요?" spellCheck={false} onChange={(e) => (setQ(e.target.value), setCur(0))} />
        <kbd>Esc</kbd>
      </div>
      <div className="fmenu-sec">용례에서 만들기</div>
      <div className="fmenu-list" role="menu">
        {list.map((r, i) => (
          <button key={r.id} role="menuitem" className={'fmenu-item' + (r === sel ? ' cur' : '')} onMouseEnter={() => setCur(i)} onClick={() => onPick(r)}>
            <span className="fmenu-icon">{r.icon}</span>
            <span className="fmenu-title">{r.title}</span>
            <span className="fmenu-hint">{r.kindHint}</span>
          </button>
        ))}
        {!list.length && <div className="fmenu-empty">맞는 용례가 없어요</div>}
      </div>
      {sel && <RecipeCard r={sel} menu={box.current} />}
    </div>,
    document.body,
  );
}

// 설명 카드: 메뉴 왼쪽(자리가 없으면 오른쪽)에 붙어서, 고른 줄이 바뀌면 내용만 바뀜
function RecipeCard({ r, menu }: { r: FlagRecipe; menu: HTMLElement | null }) {
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
          {r.flags.map((f) => (
            <code key={f.name}>{f.name}</code>
          ))}
        </span>
      </div>
      <p className="fmenu-desc">{r.desc}</p>
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
      <div className="fmenu-foot">누르거나 Enter: 플래그 {r.flags.length > 1 ? `${r.flags.length}개` : ''} 만들기</div>
    </div>
  );
}
