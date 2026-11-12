import { useStore } from './store';
import { Inspector } from './Inspector';
import { Player } from './Player';
import { FoldAll, FoldScope } from './Card';

// 오른쪽 칸: 왼쪽 칸과 같은 카드 모양. 탭 없이 고른 것을 보여 준다
// (상자를 누르면 상자 카드들, ◐ 셰이더를 누르면 셰이더 카드들, 플레이 중이면 플레이 카드)
export function RightPanel() {
  const tab = useStore((s) => s.tab);
  const playing = useStore((s) => s.playing);
  const showPlay = playing && tab === 'play';
  return (
    <div className="right-panel">
      <div className="right-scroll" hidden={showPlay}>
        <FoldScope name="right">
        <FoldAll />
        {playing && (
          <section className="sec play-back">
            <span>플레이 중이에요</span>
            <button onClick={() => useStore.setState({ tab: 'play' })}>▶ 플레이로 돌아가기</button>
          </section>
        )}
        <Inspector />
        </FoldScope>
      </div>
      {/* 플레이 상태를 유지하려고 닫아도 지우지 않는다 */}
      <div className="tab-body play-card" hidden={!showPlay}>
        <div className="play-head">
          <b>플레이</b>
          <button onClick={() => useStore.setState({ tab: 'edit' })} title="플레이는 그대로 두고 상자 편집 카드를 봐요">상자 편집 보기</button>
        </div>
        <Player active={showPlay} />
      </div>
    </div>
  );
}
