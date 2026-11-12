// 대사·선택지 위치를 대본 편집에서 고르기 (데스크톱 앱 + 게임 연결일 때만).
// 누르면 원고를 내보내고 게임을 그 줄로 옮긴 뒤, 게임 안 GUI 편집기의 대사(선택지) 탭을 연다.
// 게임 창에서 끌어서 옮기고 저장하면 지금처럼 showpy_inbox.json으로 받아 적는다 (LINK.md 3장, 9장).
import { isDesktop } from './desktop';
import { exportedLineOf } from './files';
import { RPY_FILE } from './gameFolder';
import { liveSend, useLive } from './showpyLive';
import { useStore } from './store';

export function PickPos({ lineId, tab, what }: { lineId: string | undefined; tab: 'say' | 'choice'; what: string }) {
  const on = useLive((s) => s.on);
  const st = useLive((s) => s.st);
  if (!isDesktop) return null;
  if (!on) return <p className="tip">{what} 위치는 앱에서 게임과 연결하면 여기서 게임 화면으로 가서 끌어서 정해요.</p>;
  const editing = !!st?.editor.open && st.editor.tab === tab;
  const go = async () => {
    if (!lineId) return;
    const line = await exportedLineOf(lineId);
    if (line == null) {
      useStore.getState().say(`원고(${RPY_FILE})를 이 대본으로 내보내지 못해서 게임을 옮기지 않았어요. 검사 카드나 Ctrl+E를 확인해 주세요`);
      return;
    }
    liveSend({ cmd: 'goto', where: 'line', file: 'game/' + RPY_FILE, line });
    liveSend({ cmd: 'panel', hide: !useLive.getState().gamePanel });
    // 게임이 그 줄로 간 뒤에 탭을 연다 (그 화면에서만 쓸 수 있는 탭이라)
    setTimeout(() => liveSend({ cmd: 'editor', open: true, tab }), 700);
  };
  return (
    <div className="pick-pos">
      {editing ? (
        <>
          <span>게임 창에서 {what}를 끌어 옮기고 저장해요{st?.editor.pending ? ` (저장할 것 ${st.editor.pending})` : ''}</span>
          <button className="primary" disabled={!st?.editor.pending} onClick={() => liveSend({ cmd: 'save' })}>저장</button>
          <button onClick={() => liveSend({ cmd: 'editor', open: false })}>끝내기</button>
        </>
      ) : (
        <button className="primary" disabled={!lineId} onClick={go} title={`게임을 이 줄로 옮기고 GUI 편집기의 ${what} 탭을 열어요. 게임 창에서 끌어서 정해요`}>
          🎯 게임에서 {what} 위치 고르기
        </button>
      )}
    </div>
  );
}
