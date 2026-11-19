// 접어 둔 창의 작은 끈적한 방울 하나 (세션 93, 사용자 요청). 태그 상자는 보라 [⋯], 다음 흐름은 녹색 [→].
// 왼쪽 [⠿ ✕], 오른쪽 [✓ ✕] 방울처럼 천천히 일렁이고(useDrift), 마우스를 올리면 무엇인지와 펼치는 단축키가 뜬다(.tip).
// 누르면(또는 단축키) 펼쳐진다. 눌러도 글 칸의 커서는 그대로 남는다
import { Liquid } from 'liquid-gooey';
import { DRIFT_TR, useDrift } from './LineChip';

export const PILL_FILL = { purple: '#8b5cf6', green: '#22a565' } as const;

export function GooPill({ color, label, tip, onOpen, seed = 0 }: { color: keyof typeof PILL_FILL; label: string; tip: string; onOpen: () => void; seed?: number }) {
  const [d] = useDrift(1, seed);
  const fill = PILL_FILL[color];
  return (
    <div className="goo-pill nodrag nopan" onDoubleClick={(e) => e.stopPropagation()}>
      <Liquid className="gp-liquid" blur={4} contrast={18} fill={fill} shadow={`0 3px 10px color-mix(in srgb, ${fill} 35%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.35)`}>
        <Liquid.Item x={d.x} y={d.y} transition={DRIFT_TR}>
          <button type="button" className="gp-btn tip" data-tip={tip} aria-label={tip} onMouseDown={(e) => e.preventDefault()} onClick={onOpen}>
            {label}
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  );
}
