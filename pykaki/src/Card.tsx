// 왼쪽·오른쪽 칸과 GUI 편집 칸이 같이 쓰는 카드. 접으면 이름만 남고 하늘색 톤이 된다.
// 접은 카드는 이 브라우저에 기억한다 (localStorage `pygaki-folded`, 카드 id → 접힘).
import type { ReactNode } from 'react';
import { create } from 'zustand';

const KEY = 'pygaki-folded';

function load(): Record<string, boolean> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v === 'object') return v;
    // 예전 판에서 기억한 것 (스크립트는 펼쳐야 보였고, 사용법은 접을 수 있었다)
    const old: Record<string, boolean> = {};
    if (localStorage.getItem('pygaki-script-open') !== '1') old.script = true;
    if (localStorage.getItem('pygaki-usage-closed') === '1') old.usage = true;
    return old;
  } catch {
    return {};
  }
}

export const useFolded = create<Record<string, boolean>>(load);
useFolded.subscribe((v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // 기억 못 해도 이번 창에서는 접힌다
  }
});

export const toggleFold = (id: string, def = false) => useFolded.setState((s) => ({ [id]: !(s[id] ?? def) }));

interface Props {
  id: string; // 접은 것을 기억할 이름
  title: ReactNode;
  extra?: ReactNode; // 제목 오른쪽 단추 (+ 추가 등). 접었을 때는 숨긴다
  defFolded?: boolean;
  className?: string;
  domId?: string;
  children?: ReactNode;
}

export function Card({ id, title, extra, defFolded = false, className = '', domId, children }: Props) {
  const folded = useFolded((s) => s[id] ?? defFolded);
  return (
    <section className={'sec card' + (folded ? ' folded' : '') + (className ? ' ' + className : '')} id={domId}>
      <h3>
        <span className="card-title" onDoubleClick={() => toggleFold(id, defFolded)}>
          {title}
        </span>
        <span className="card-acts">
          {!folded && extra}
          <button className="fold-btn" onClick={() => toggleFold(id, defFolded)} title={folded ? '펼쳐요' : '이름만 남기고 접어요'}>
            {folded ? '펼치기' : '접기'}
          </button>
        </span>
      </h3>
      {!folded && children}
    </section>
  );
}
