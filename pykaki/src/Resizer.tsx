// 칸 사이 경계: 끌면 그 칸의 너비가 바뀐다. 더블클릭하면 처음 크기로. 잠그면 안 움직인다 (prefs.ts SIZES)
// 대본 편집, GUI 편집, 효과, 셰이더 화면이 같은 모양을 쓴다
import { SIZES, clampSize, usePrefs, type SizeKey } from './prefs';

// size: 바꿀 칸 너비, grow: 오른쪽으로 끌면 커지는 칸이면 1 (왼쪽 칸), 작아지면 -1 (오른쪽 칸)
export function Resizer({ size, grow, className }: { size: SizeKey; grow: 1 | -1; className?: string }) {
  const lock = usePrefs((p) => p.sizeLock);
  const onDown = (e: React.PointerEvent) => {
    if (lock || e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = usePrefs.getState()[size];
    const move = (ev: PointerEvent) => usePrefs.setState({ [size]: clampSize(size, w0 + (ev.clientX - x0) * grow) });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('resizing');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    document.body.classList.add('resizing');
  };
  return (
    <div
      className={'resizer ' + (className ?? '') + (lock ? ' locked' : '')}
      onPointerDown={onDown}
      onDoubleClick={() => !lock && usePrefs.setState({ [size]: SIZES[size].def })}
      title={lock ? '칸 크기를 잠갔어요 ([대본 편집] 왼쪽 칸 [설정]에서 풀어요)' : '끌어서 칸 너비 바꾸기 · 더블클릭: 처음 크기로'}
    />
  );
}
