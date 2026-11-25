// 상자 안에서 고치는 줄 왼쪽에 붙는 작은 끈적한 방울 (세션 91, 사용자 손그림. 예전 단추 묶음 [⠿ 줄 종류 ＋ ✕]를 바꾼 것).
// 손잡이와 줄 삭제(✕)만 둔다: 새 줄은 Ctrl+Enter, 줄 종류는 Alt+←(또는 손잡이를 끌지 않고 톡 누름).
// 손잡이 표시는 세션 102부터 ←(사용자: 위 ↑ 글꼴 버블, 오른쪽 → 흐름 버블과 같이 펼치는 쪽 화살표. 끌기는 그대로).
// 켜져 있는 동안 방울들이 천천히 조금씩 떠다니며 붙었다 떨어진다(liquid-gooey, fluid motion). 움직임 줄이기 설정이면 가만히 있다.
// 오른쪽 완료/취소 방울(DoneBubble)도 같은 useDrift를 쓴다. 마우스를 올리면 곧바로 작은 안내(.tip, data-tip)가 뜬다
import { useEffect, useState } from 'react';
import { Liquid } from 'liquid-gooey';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEP = 2400; // 한 번 떠가는 시간(ms). 느리게
export const DRIFT_TR = { duration: STEP, ease: 'ease-in-out' };

// 방울 n개가 걸음마다 다른, 그러나 늘 같은 작은 어긋남(px)으로 떠다닌다. seed로 방울 묶음마다 다르게
export function useDrift(n: number, seed = 0) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const kick = requestAnimationFrame(() => setT(1));
    const id = setInterval(() => setT((v) => v + 1), STEP);
    return () => {
      cancelAnimationFrame(kick);
      clearInterval(id);
    };
  }, []);
  return Array.from({ length: n }, (_, k) =>
    t ? { x: Math.sin(t * 1.7 + (k + seed) * 2.1) * 2.2, y: Math.cos(t * 1.3 + (k + seed) * 3.7) * 1.6 } : { x: 0, y: 0 },
  );
}

export function LineChip({ grip, onDelete, extra }: { grip: { title?: string }; onDelete: () => void; extra?: React.ReactNode }) {
  const [a, b] = useDrift(2);
  return (
    <div className="line-chip nodrag nopan" onDoubleClick={(e) => e.stopPropagation()}>
      {extra}
      <Liquid className="lc-liquid" blur={4} contrast={18} fill="var(--panel)" shadow="0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px var(--line)">
        <Liquid.Item x={a.x} y={a.y} transition={DRIFT_TR}>
          <span {...grip} title={undefined} data-tip={grip.title} className="grip lc-btn lc-arrow tip nodrag nopan">←</span>
        </Liquid.Item>
        <Liquid.Item x={b.x} y={b.y} transition={DRIFT_TR}>
          <button type="button" className="lc-btn tip nodrag" data-tip="줄 삭제" aria-label="줄 삭제" onMouseDown={(e) => e.preventDefault()} onClick={onDelete}>
            ✕
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  );
}
