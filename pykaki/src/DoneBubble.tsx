// 상자 안에서 대사를 쓰는 동안 그 줄 높이에 맞춰 상자 바깥 오른쪽에 끈적하게(liquid-gooey) 톡 튀어나오는 작은 푸른 방울 둘 [✓ ✕] (세션 90).
// 세션 91(사용자 손그림): 대사를 가리지 않게 상자 밖(.side-r 자리, 글 줄에는 .side-r가 없음), 글자 없이 표시만, 왼쪽 방울(LineChip)처럼
// 천천히 일렁이고(useDrift) 마우스를 올리면 단축키 안내가 뜬다.
// [✓]는 Ctrl+Enter(같은 화자로 아래에 새 줄)와 같고, [✕]는 Esc(상자 편집 끝내기)와 같다. 친 글은 늘 저장돼 있어서 취소해도 글은 그대로다.
// 줄을 옮기면 새 줄에서 다시 튀어나온다(key가 줄 id)
import { useEffect, useState } from 'react';
import { Liquid } from 'liquid-gooey';
import { keyOf } from './prefs';
import { DRIFT_TR, useDrift } from './LineChip';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function DoneBubble({ top, onDone, onCancel }: { top: number; onDone: () => void; onCancel: () => void }) {
  const [out, setOut] = useState(reduced());
  const [settled, setSettled] = useState(false); // 튀어나온 뒤에 일렁이기 시작
  const [a, b] = useDrift(2, 5);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOut(true));
    const t = setTimeout(() => setSettled(true), 600);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, []);
  const keep = (e: React.MouseEvent) => e.preventDefault(); // 눌러도 글 칸의 커서를 빼앗지 않음
  const pos = (d: { x: number; y: number }, dx: number) => (!out ? { x: dx, y: 0, scale: 0.3 } : settled ? { x: d.x, y: d.y, scale: 1 } : { x: 0, y: 0, scale: 1 });
  const pa = pos(a, -18), pb = pos(b, -40);
  return (
    <div className="done-bubble nodrag nopan" style={{ top }} onDoubleClick={(e) => e.stopPropagation()}>
      <Liquid className="db-liquid" blur={4} contrast={18} fill="#2f8cff" shadow="0 3px 10px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)">
        <Liquid.Item {...pa} transition={settled ? DRIFT_TR : 'bouncy'}>
          <button type="button" className="db-btn tip" data-tip={`완료 · ${keyOf('newLine')}`} aria-label="완료" onMouseDown={keep} onClick={onDone}>
            ✓
          </button>
        </Liquid.Item>
        <Liquid.Item {...pb} transition={settled ? DRIFT_TR : 'bouncy'} delay={settled ? 0 : 70}>
          <button type="button" className="db-btn tip" data-tip="취소 · Esc" aria-label="취소" onMouseDown={keep} onClick={onCancel}>
            ✕
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  );
}
