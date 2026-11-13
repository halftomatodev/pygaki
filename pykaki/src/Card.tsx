// 왼쪽·오른쪽 칸과 GUI 편집 칸이 같이 쓰는 카드. 접으면 이름만 남고 하늘색 톤이 된다.
// 접은 카드는 이 브라우저에 기억한다 (localStorage `pygaki-folded`, 카드 id → 접힘).
// 왼쪽 칸 카드(FRESH)는 기억을 안 쓰고 켤 때마다 접혀서 시작한다.
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { Hint } from './Help';

const KEY = 'pygaki-folded';
export const FRESH = ['labels', 'chars', 'warn', 'project', 'script', 'settings', 'usage'];

function load(): Record<string, boolean> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v === 'object') {
      for (const id of FRESH) delete v[id];
      return v;
    }
    // 예전 판에서 기억한 것 (스크립트는 펼쳐야 보였고, 사용법은 접을 수 있었다)
    const old: Record<string, boolean> = {};
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

// [모두 접기] 단추가 그 칸에 지금 보이는 카드를 알게: 칸(FoldScope)마다 카드 id → 기본 접힘
const Scope = createContext<string | null>(null);
const useMounted = create<Record<string, Record<string, boolean>>>(() => ({}));

export function FoldScope({ name, children }: { name: string; children: ReactNode }) {
  return <Scope.Provider value={name}>{children}</Scope.Provider>;
}

// 칸 맨 위 오른쪽의 [모두 접기]↔[모두 펼치기] 하나. 펼친 카드가 하나라도 있으면 모두 접기
export function FoldAll() {
  const scope = useContext(Scope);
  const cards = useMounted((m) => (scope ? m[scope] : undefined));
  const folded = useFolded();
  const ids = Object.keys(cards ?? {});
  if (!ids.length) return null;
  const anyOpen = ids.some((id) => !(folded[id] ?? cards![id]));
  const all = () => useFolded.setState(Object.fromEntries(ids.map((id) => [id, anyOpen])));
  return (
    <div className="fold-all">
      <button className="fold-btn" onClick={all} title={anyOpen ? '이 칸의 카드를 모두 이름만 남기고 접어요' : '이 칸의 카드를 모두 펼쳐요'}>
        {anyOpen ? '모두 접기' : '모두 펼치기'}
      </button>
    </div>
  );
}

interface Props {
  id: string; // 접은 것을 기억할 이름
  title: ReactNode;
  extra?: ReactNode; // 제목 오른쪽 단추 (+ 추가 등). 접었을 때는 숨긴다
  defFolded?: boolean;
  className?: string;
  domId?: string;
  children?: ReactNode;
  hint?: string; // 제목 옆 ⓘ에 올리면 나오는 짧은 설명
  topic?: string; // ⓘ를 누르면 열 도움말 항목 (제목의 일부)
}

export function Card({ id, title, extra, defFolded = false, className = '', domId, children, hint, topic }: Props) {
  const folded = useFolded((s) => s[id] ?? defFolded);
  const scope = useContext(Scope);
  useEffect(() => {
    if (!scope) return;
    useMounted.setState((m) => ({ [scope]: { ...m[scope], [id]: defFolded } }));
    return () =>
      useMounted.setState((m) => {
        const c = { ...m[scope] };
        delete c[id];
        return { [scope]: c };
      });
  }, [scope, id, defFolded]);
  return (
    <section className={'sec card' + (folded ? ' folded' : '') + (className ? ' ' + className : '')} id={domId}>
      <h3>
        <span className="card-title" onDoubleClick={() => toggleFold(id, defFolded)}>
          {title}
          {hint && <Hint text={hint} topic={topic} />}
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
