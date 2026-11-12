// 대본 편집에서 게임으로 가는 단추 (데스크톱 앱 + 게임 연결일 때만).
// [렌파이에서 여기로 이동]: 원고를 내보내고 게임을 그 줄(상자면 상자의 첫 줄)로 옮긴다.
// [위치 옮기기]: 거기에 더해 게임 안 GUI 편집기의 대사(선택지, 이미지/영상) 탭을 연다.
// 게임 창에서 끌어서 옮기고 저장하면 지금처럼 showpy_inbox.json으로 받아 적는다 (LINK.md 3장, 9장).
import { create } from 'zustand';
import { isDesktop } from './desktop';
import { exportedBoxLineOf, exportedLineOf } from './files';
import { RPY_FILE } from './gameFolder';
import { liveSend, useLive } from './showpyLive';
import { useStore } from './store';

export type PickTab = 'say' | 'choice' | 'stage';
export type Where = { line: string } | { box: string };

// 마지막으로 [위치 옮기기]를 누른 줄: 저장 띠를 그 줄 아래에 띄운다
const usePicked = create<{ key: string | null }>(() => ({ key: null }));
const keyOf = (w: Where) => ('line' in w ? 'l:' + w.line : 'b:' + w.box);

// 게임과 이어져서 단추를 누를 수 있는지
export const useGameReady = () => useLive((s) => isDesktop && s.on);
export const GAME_OFF_TIP = '앱에서 [▶ 렌파이에서 실행]으로 게임을 켜고 연결하면 눌러요';

async function goto(w: Where): Promise<number | null> {
  const line = 'line' in w ? await exportedLineOf(w.line) : await exportedBoxLineOf(w.box);
  if (line == null) {
    useStore.getState().say(`원고(${RPY_FILE})를 이 대본으로 내보내지 못해서 게임을 옮기지 않았어요. 검사 카드나 Ctrl+E를 확인해 주세요`);
    return null;
  }
  liveSend({ cmd: 'goto', where: 'line', file: 'game/' + RPY_FILE, line });
  return line;
}

export async function gotoInGame(w: Where) {
  if ((await goto(w)) != null) useStore.getState().say('게임을 이 자리로 옮겼어요');
}

export async function pickInGame(w: Where, tab: PickTab) {
  const line = await goto(w);
  if (line == null) return;
  usePicked.setState({ key: keyOf(w) });
  liveSend({ cmd: 'panel', hide: !useLive.getState().gamePanel });
  // 게임이 그 줄로 간 뒤에 탭을 연다 (그 화면에서만 쓸 수 있는 탭이라).
  // 이미지/영상 탭은 그 줄을 골라 달라고 줄 번호도 보낸다 (ui_kit 4.8. 예전 판은 line을 모르고 그냥 연다)
  const extra = tab === 'stage' ? { file: RPY_FILE, line } : {};
  setTimeout(() => liveSend({ cmd: 'editor', open: true, tab, ...extra }), 700);
}

// [렌파이에서 여기로 이동]. short면 줄마다 붙는 짧은 이름
export function GoHere({ where, short }: { where: Where; short?: boolean }) {
  const ready = useGameReady();
  if (short && !ready) return null;
  return (
    <button className="go-here" disabled={!ready} onClick={() => gotoInGame(where)} title={ready ? '게임을 이 자리로 옮겨요' : GAME_OFF_TIP}>
      {short ? '여기로 이동' : '렌파이에서 여기로 이동'}
    </button>
  );
}

// [위치 옮기기]. 연결 안 됐으면 숨긴다
export function MoveBtn({ where, tab, what }: { where: Where; tab: PickTab; what: string }) {
  const ready = useGameReady();
  const linked = useStore((s) => !!s.project.settings.renpyLink); // 받아 적기는 플러그인 연결을 켠 원고만
  if (!ready || !linked) return null;
  return (
    <button className="move-pos" onClick={() => pickInGame(where, tab)} title={`게임을 이 줄로 옮기고 GUI 편집기의 ${what} 탭을 열어요. 게임 창에서 끌어서 정해요`}>
      위치 옮기기
    </button>
  );
}

// [위치 옮기기]를 누른 줄 아래에 뜨는 "끌어 옮기고 저장" 띠
export function PickBand({ where, tab, what }: { where: Where; tab: PickTab; what: string }) {
  const st = useLive((s) => (s.on ? s.st : null));
  const mine = usePicked((p) => p.key === keyOf(where));
  if (!mine || !st?.editor.open || st.editor.tab !== tab) return null;
  return (
    <div className="pick-pos">
      <span>게임 창에서 {what}를 끌어 옮기고 저장해요{st.editor.pending ? ` (저장할 것 ${st.editor.pending})` : ''}</span>
      <button className="primary" disabled={!st.editor.pending} onClick={() => liveSend({ cmd: 'save' })}>저장</button>
      <button onClick={() => liveSend({ cmd: 'editor', open: false })}>끝내기</button>
    </div>
  );
}

// 연결 안 됐을 때 카드 아래에 한 줄
export function GameOffTip({ what }: { what: string }) {
  const ready = useGameReady();
  if (ready || !isDesktop) return null;
  return <p className="tip">{what}: 게임과 연결하면 줄마다 [여기로 이동] [위치 옮기기]가 생겨요.</p>;
}
