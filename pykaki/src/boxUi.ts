// 상자·label의 대사 소리·속도, 커서, 클릭 대기 (types.ts BoxUi). 셰이더(shader.ts)와 같은 규칙:
// 값마다 상자 → label → 게임 처음 값. 원고에는 상자 첫 줄에 $ custom_ui.scene(...)으로, 속도는 대사 줄의 cps=로 (LINK.md 2장)
import type { BoxNode, BoxUi, Project } from './types';
import { useGameFolder } from './gameFolder';

export type UiKey = keyof BoxUi;
export const UI_KEYS: UiKey[] = ['cps', 'sound', 'ctc', 'cursor'];
const SCENE_KEYS: UiKey[] = ['sound', 'ctc', 'cursor']; // custom_ui.scene에 적는 것 (cps는 대사 줄에)

export function uiOfBox(p: Project, b: BoxNode): BoxUi {
  const g = p.labels.find((x) => x.id === b.group)?.ui ?? {};
  const m = b.ui ?? {};
  const out: BoxUi = {};
  for (const k of UI_KEYS) {
    const v = k in m ? m[k] : g[k];
    if (v !== undefined) (out as any)[k] = v;
  }
  return out;
}

// 이 값이 상자에서 왔나, label에서 왔나, 게임 처음 값인가
export function uiFrom(p: Project, b: BoxNode | null, gid: string, k: UiKey): 'box' | 'label' | 'game' {
  if (b?.ui && k in b.ui) return 'box';
  if (p.labels.find((x) => x.id === gid)?.ui && k in p.labels.find((x) => x.id === gid)!.ui!) return 'label';
  return 'game';
}

export const usesSceneUi = (p: Project) => [...p.nodes, ...p.labels].some((x) => x.ui && SCENE_KEYS.some((k) => k in x.ui!));
export const usesUi = (p: Project, k: UiKey) => [...p.nodes, ...p.labels].some((x) => x.ui && k in x.ui);
export const uiCount = (p: Project, k: UiKey) => [...p.nodes, ...p.labels].filter((x) => x.ui && k in x.ui).length;

// 게임의 pygaki 플러그인이 custom_ui.scene을 아는지 (ui_kit 4.7부터. 폴더를 연결하지 않았으면 안다고 본다)
export const sceneSupported = () => useGameFolder.getState().sceneUi !== false;

const py = (s: string) => JSON.stringify(s);

// 상자 첫 줄. 이 상자에 걸리는 값이 하나도 없으면 $ custom_ui.scene() (게임 처음 값으로 되돌림)
export function sceneCode(u: BoxUi): string {
  const a: string[] = [];
  if (u.sound !== undefined) a.push(`typing_sound=${u.sound ? py(u.sound) : 'None'}`);
  if (u.ctc) a.push(`ctc=${py(u.ctc)}`);
  if (u.cursor) a.push(`cursor=${py(u.cursor)}`);
  return `$ custom_ui.scene(${a.join(', ')})`;
}

// 칸에 보일 이름
export function uiLabel(k: UiKey, v: BoxUi[UiKey]): string {
  if (v === undefined) return '게임 처음 값';
  if (k === 'cps') return v === 0 ? '한 번에' : `1초에 ${v}글자`;
  if (k === 'sound') return v ? String(v) : '끔';
  return String(v);
}

// 모든 label에 이 값을 걸고 상자마다 따로 정한 것은 지운다 / 대본 전체에서 지운다
export function applyAll(p: Project, k: UiKey, v: BoxUi[UiKey]) {
  for (const n of p.nodes) dropKey(n, k);
  for (const g of p.labels) g.ui = { ...(g.ui ?? {}), [k]: v };
}
export function clearAll(p: Project, k: UiKey) {
  for (const x of [...p.nodes, ...p.labels]) dropKey(x, k);
}
export function dropKey(x: { ui?: BoxUi }, k: UiKey) {
  if (!x.ui) return;
  delete x.ui[k];
  if (!Object.keys(x.ui).length) delete x.ui;
}
