// 상자의 커서, 클릭 대기 (types.ts BoxUi). 값마다 상자 → 게임 처음 값 (앞 상자 것을 이어받지 않음).
// 원고에는 상자 첫 줄에 $ custom_ui.scene(...)으로 (LINK.md 2장). 대사 소리와 속도는 대사 줄마다(SayStyle.sound, cps)
import type { BoxNode, BoxUi, Project } from './types';
import { useGameFolder } from './gameFolder';

export type UiKey = keyof BoxUi;
export const UI_KEYS: UiKey[] = ['ctc', 'cursor'];

export const uiOfBox = (b: BoxNode): BoxUi => ({ ...(b.ui ?? {}) });

export const usesSceneUi = (p: Project) => p.nodes.some((x) => x.ui && UI_KEYS.some((k) => k in x.ui!));
export const uiCount = (p: Project, k: UiKey) => p.nodes.filter((x) => x.ui && k in x.ui).length;

// 게임의 pygaki 플러그인이 custom_ui.scene을 아는지 (ui_kit 4.7부터. 폴더를 연결하지 않았으면 안다고 본다)
export const sceneSupported = () => useGameFolder.getState().sceneUi !== false;

const py = (s: string) => JSON.stringify(s);

// 상자 첫 줄. 이 상자에 정한 값이 하나도 없으면 $ custom_ui.scene() (게임 처음 값으로 되돌림)
export function sceneCode(u: BoxUi): string {
  const a: string[] = [];
  if (u.ctc) a.push(`ctc=${py(u.ctc)}`);
  if (u.cursor) a.push(`cursor=${py(u.cursor)}`);
  return `$ custom_ui.scene(${a.join(', ')})`;
}

// 칸에 보일 이름
export function uiLabel(v: string | undefined): string {
  return v === undefined ? '게임 처음 값' : v;
}

// 모든 상자에 이 값을 건다 / 대본 전체에서 지운다
export function applyAll(p: Project, k: UiKey, v: string) {
  for (const n of p.nodes) n.ui = { ...(n.ui ?? {}), [k]: v };
}
export function clearAll(p: Project, k: UiKey) {
  for (const x of p.nodes) dropKey(x, k);
}
export function dropKey(x: { ui?: BoxUi }, k: UiKey) {
  if (!x.ui) return;
  delete x.ui[k];
  if (!Object.keys(x.ui).length) delete x.ui;
}
