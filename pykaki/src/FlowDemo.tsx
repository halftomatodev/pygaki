// 다음 흐름 창의 툴팁 견본: 작은 상자와 선이 움직이는 그림 (SVG 애니메이션, 파일 없음, 화면 테마 색을 따라감)
// 태그 상자 툴팁(TagDemo)처럼 그 자리에서 돈다. 아래에 내보내는 원고 몇 줄을 같이 보여 준다
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface FlowTip {
  label: string;
  desc: string;
  code: string; // 내보낸 원고 (몇 줄)
  demo: ReactNode;
}

const DUR = '3.6s';

// 상자 하나: 둥근 네모와 대사 줄 두 개
function Box({ x, y, w = 64, on, label, appear }: { x: number; y: number; w?: number; on?: boolean; label?: string; appear?: [string, string] }) {
  return (
    <g opacity={appear ? 0 : 1}>
      {appear && <animate attributeName="opacity" values={appear[0]} keyTimes={appear[1]} dur={DUR} repeatCount="indefinite" />}
      <rect x={x} y={y} width={w} height={26} rx={6} className={'fd-box' + (on ? ' on' : '')} />
      <rect x={x + 7} y={y + 7} width={w - 22} height={3} rx={1.5} className="fd-bar" />
      <rect x={x + 7} y={y + 15} width={w - 32} height={3} rx={1.5} className="fd-bar" />
      {label && (
        <text x={x + w / 2} y={y - 4} className="fd-label" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

// 선을 따라 지나가는 점 (begin: 0~1, 한 바퀴 가운데 지나가는 때)
function Dot({ path, from, to }: { path: string; from: number; to: number }) {
  const v = `0;0;1;1`;
  const k = `0;${from};${to};1`;
  return (
    <circle r={3.5} className="fd-dot">
      <animateMotion path={path} dur={DUR} repeatCount="indefinite" keyPoints={v} keyTimes={k} calcMode="linear" />
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${from};${from + 0.01};${to};${to + 0.01};1`} dur={DUR} repeatCount="indefinite" />
    </circle>
  );
}

// 선이 그려지며 나타남
function Line({ d, from, to, dashed }: { d: string; from: number; to: number; dashed?: boolean }) {
  return (
    <path d={d} className={'fd-line' + (dashed ? ' dash' : '')} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1}>
      <animate attributeName="stroke-dashoffset" values="1;1;0;0" keyTimes={`0;${from};${to};1`} dur={DUR} repeatCount="indefinite" />
    </path>
  );
}

const svg = (children: ReactNode) => (
  <svg className="fd-svg" viewBox="0 0 260 100" aria-hidden="true">
    {children}
  </svg>
);

const NEXT = svg(
  <>
    <Box x={18} y={37} on label="이 상자" />
    <Line d="M84,50 L174,50" from={0.1} to={0.4} />
    <Dot path="M84,50 L174,50" from={0.4} to={0.6} />
    <Box x={176} y={37} label="다음 상자" appear={['0;0;1;1', '0;0.35;0.45;1']} />
  </>
);

const RETURN = svg(
  <>
    <Box x={98} y={14} on label="" />
    <Line d="M130,42 L130,64" from={0.1} to={0.3} />
    <g opacity={0}>
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.3;0.4;1" dur={DUR} repeatCount="indefinite" />
      <rect x={110} y={66} width={40} height={20} rx={10} className="fd-end" />
      <text x={130} y={80} className="fd-end-t" textAnchor="middle">■ 끝</text>
    </g>
    <text x={168} y={80} className="fd-label" opacity={0}>
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.45;0.55;1" dur={DUR} repeatCount="indefinite" />
      부른 곳으로 돌아감
    </text>
  </>
);

const MENU = svg(
  <>
    <Box x={8} y={37} on />
    <g className="fd-chip">
      <rect x={82} y={18} width={62} height={16} rx={8} />
      <text x={113} y={30} textAnchor="middle">◆ 빌려준다</text>
    </g>
    <g className="fd-chip">
      <rect x={82} y={66} width={62} height={16} rx={8} />
      <text x={113} y={78} textAnchor="middle">◆ 모른 척</text>
    </g>
    <path d="M72,46 L82,26 M72,54 L82,74" className="fd-line still" />
    <Line d="M144,26 L186,26" from={0.05} to={0.2} />
    <Line d="M144,74 L186,74" from={0.05} to={0.2} />
    <Box x={188} y={13} label="" />
    <Box x={188} y={61} label="" />
    <Dot path="M72,46 L82,26 L186,26" from={0.25} to={0.45} />
    <Dot path="M72,54 L82,74 L186,74" from={0.65} to={0.85} />
  </>
);

const IF = svg(
  <>
    <Box x={6} y={37} on />
    <path d="M70,50 L92,50" className="fd-line still" />
    <g className="fd-diamond">
      <path d="M118,34 L144,50 L118,66 L92,50 z" />
      <text x={118} y={54} textAnchor="middle">?</text>
    </g>
    <Line d="M144,50 L162,26 L188,26" from={0.05} to={0.2} />
    <Line d="M144,50 L162,74 L188,74" from={0.05} to={0.2} dashed />
    <text x={168} y={20} className="fd-label">love ≥ 5</text>
    <text x={168} y={92} className="fd-label">그 밖</text>
    <Box x={190} y={13} />
    <Box x={190} y={61} />
    <Dot path="M70,50 L92,50 L144,50 L162,26 L188,26" from={0.25} to={0.45} />
    <Dot path="M70,50 L92,50 L144,50 L162,74 L188,74" from={0.65} to={0.85} />
  </>
);

const GO = svg(
  <>
    <Box x={96} y={6} w={68} on />
    {/* 쓰던 상자의 커서 */}
    <rect x={150} y={13} width={1.6} height={11} className="fd-caret">
      <animate attributeName="opacity" values="1;0;1;0;1;0;0" keyTimes="0;0.08;0.16;0.24;0.32;0.4;1" dur={DUR} repeatCount="indefinite" />
    </rect>
    <Line d="M130,32 L130,64" from={0.38} to={0.5} />
    <Box x={96} y={66} w={68} appear={['0;0;1;1', '0;0.45;0.52;1']} />
    {/* 새 상자에서 이어 쓰는 커서 */}
    <rect x={104} y={73} width={1.6} height={11} className="fd-caret" opacity={0}>
      <animate attributeName="opacity" values="0;0;1;0;1;0;1" keyTimes="0;0.55;0.62;0.7;0.78;0.86;1" dur={DUR} repeatCount="indefinite" />
    </rect>
  </>
);

export const FLOW_TIPS: Record<string, FlowTip> = {
  'type:next': {
    label: '→ 다음 상자로',
    desc: '이 상자가 끝나면 선으로 이은 상자로 넘어가요. 이을 곳은 캔버스에서 선을 끌어 붙여요.',
    code: 'jump 다음_상자',
    demo: NEXT,
  },
  'type:return': {
    label: '■ 끝',
    desc: '이야기가 여기서 끝나요. call로 불려 온 장면이면 부른 곳으로 돌아가요.',
    code: 'return',
    demo: RETURN,
  },
  'type:menu': {
    label: '◆ 선택지',
    desc: '플레이어가 고른 문구에 따라 다른 상자로 가요. 선택지마다 보이는 조건과 고르면 바꿀 플래그도 정할 수 있어요.',
    code: 'menu:\n    "우산을 빌려준다":\n        jump 빌려준다\n    "모른 척한다":\n        jump 모른_척',
    demo: MENU,
  },
  'type:if': {
    label: '◇ 조건 분기',
    desc: '플래그 값에 따라 저절로 갈래가 나뉘어요. 위 조건부터 보고, 모두 아니면 "그 밖"으로 가요.',
    code: 'if love >= 5:\n    jump 고백\nelse:\n    jump 평범한_끝',
    demo: IF,
  },
  go: {
    label: '↪ 다음 상자로 이어 쓰기',
    desc: '이어진 상자가 있으면 그 상자로, 없으면 아래에 새 상자를 만들어 이어 놓고 바로 거기서 써요.',
    code: '',
    demo: GO,
  },
};

// 창은 캔버스 안이라 오른쪽 칸에 가려질 수 있어서, 툴팁은 화면 맨 위에 띄운다 (창 오른쪽, 자리가 없으면 왼쪽)
export function FlowTipView({ k, anchor }: { k: string; anchor: HTMLElement | null }) {
  const t = FLOW_TIPS[k];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const a = anchor?.getBoundingClientRect();
    const w = ref.current?.offsetWidth ?? 280;
    const h = ref.current?.offsetHeight ?? 260;
    if (!a) return;
    const left = a.right + 10 + w <= window.innerWidth - 8 ? a.right + 10 : Math.max(8, a.left - 10 - w);
    const top = Math.max(8, Math.min(a.top, window.innerHeight - h - 8));
    // 창이 움직이면(캔버스 이동, 창 크기) 다시 그릴 때 따라간다. 같으면 그대로 둔다
    setPos((o) => (o && Math.abs(o.left - left) < 1 && Math.abs(o.top - top) < 1 ? o : { left, top }));
  });
  // 대본 화면을 감추면(다른 화면으로) 툴팁도 감춘다
  if (!t || !anchor?.offsetParent) return null;
  return createPortal(
    <div ref={ref} className="tb-tip fm-tip" style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
      <div className="tb-tip-head">
        <b>{t.label}</b>
      </div>
      <div className="tb-tip-desc">{t.desc}</div>
      <div className="fd-demo">{t.demo}</div>
      {t.code && <pre className="fd-code">{t.code}</pre>}
    </div>,
    document.body,
  );
}
