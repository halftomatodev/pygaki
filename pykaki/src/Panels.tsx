import { Inspector } from './Inspector';
import { FoldAll, FoldScope } from './Card';
import { FlagsCard } from './FlagFields';
import { BranchCard } from './BranchTree';

// 오른쪽 칸: 왼쪽 칸과 같은 카드 모양. 탭 없이 고른 것을 보여 준다
// (상자를 누르면 상자 카드들, ◐ 셰이더를 누르면 셰이더 카드들). 플래그 카드와 조건 분기 칸(BranchTree)은 맨 위에 늘 보인다
export function RightPanel() {
  return (
    <div className="right-panel">
      <div className="right-scroll">
        <FoldScope name="right">
          <FoldAll side="right" />
          <div className="insp flags-top">
            <FlagsCard />
            <BranchCard />
          </div>
          <Inspector />
        </FoldScope>
      </div>
    </div>
  );
}
