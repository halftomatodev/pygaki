// 태그 상자 툴팁의 견본: 견본 글에 태그를 넣어 대사 미리보기처럼 한 글자씩 보여 준다 (GIF 파일 없이 그 자리에서 돌림)
// 클릭 대기({w}, {p})는 잠깐 ▼를 보여 주고 저절로 넘어가고, 다 나오면 조금 쉬었다가 처음부터 다시
import { useEffect, useMemo, useState } from 'react';
import { parseTagged } from './textTags';
import { Glyphs, useReveal } from './SayPreview';
import { gameFont, useGameFolder } from './gameFolder';

const DEMO_CPS = 14; // 견본 글의 보통 속도 (글자/초)

export interface Tip {
  label: string;
  code: string; // 넣는 태그
  desc: string;
  demo?: string; // 견본 글 (태그 포함)
  next?: string; // {nw} 견본: 다 나오면 클릭 없이 바로 보이는 다음 줄
}

export function TagDemo({ text, next }: { text: string; next?: string }) {
  const look = useGameFolder((s) => s.look);
  const [step, setStep] = useState(0); // 짝수: 첫 줄, 홀수: {nw} 다음 줄
  const second = step % 2 === 1;
  return (
    <div className="tb-demo" style={{ '--game-font': `${gameFont(look.font) ?? 'var(--font)'}, var(--font)`, color: look.textColor } as React.CSSProperties}>
      <DemoLine
        key={text + '\n' + step}
        text={second && next ? next : text}
        onDone={() => setStep((v) => v + (next ? 1 : 2))}
      />
      {second && <span className="tb-demo-note">클릭 없이 다음 줄</span>}
    </div>
  );
}

function DemoLine({ text, onDone }: { text: string; onDone(): void }) {
  const parsed = useMemo(() => parseTagged(text, true, gameFont), [text]);
  const { shown, done, click, limit } = useReveal(parsed, DEMO_CPS);
  const waiting = !done && shown >= limit && parsed.stops.some((s) => s.at === limit && s.sec == null);

  useEffect(() => {
    // 클릭 대기: ▼를 보여 주고 대신 눌러 준다
    if (waiting) {
      const t = setTimeout(click, 900);
      return () => clearTimeout(t);
    }
    // 다 나오면: {nw}는 바로, 아니면 쉬었다가
    if (done) {
      const t = setTimeout(onDone, parsed.noWait ? 150 : 1600);
      return () => clearTimeout(t);
    }
  }, [waiting, done]);

  return (
    <div className="preview-text fx-none" style={{ '--cd': `${1 / DEMO_CPS}s` } as React.CSSProperties}>
      <Glyphs parsed={parsed} shown={shown} />
      {(waiting || (done && !parsed.noWait)) && <span className="tb-demo-ctc">▼</span>}
    </div>
  );
}
