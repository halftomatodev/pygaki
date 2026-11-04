// showpy 실시간 연결 (데스크톱 앱 전용). 게임이 보내는 상태를 받아 두고, 명령을 보낸다.
// 형식은 저장소 맨 위 docs/LINK.md 9장. 연결은 app/main.cjs가 맺고 여기는 받기만 한다.
import { create } from 'zustand';
import { desktop } from './desktop';

export interface TitleLook {
  rotate: number;
  skew: number;
  zoom: number;
  size: number | null;
  font: string | null;
  color: string | null;
}
export interface TitleItem extends TitleLook {
  id: string;
  text: string;
  x: number;
  y: number;
  anchor: [number, number];
  hover: TitleLook & { offset: [number, number] };
  edited: boolean;
}
export interface TitleState {
  ok: boolean;
  menu: 'title' | 'pause';
  sel: number;
  mode: 'base' | 'hover';
  scope: 'item' | 'all';
  items: TitleItem[];
  common: Record<string, unknown>;
  common_edited: boolean;
}
export interface EditorTab {
  id: string;
  label: string;
  ok: boolean;
  why: string;
}
export interface GameState {
  where: { file: string | null; line: number; screens: string[]; main_menu: boolean; menu: boolean };
  editor: { open: boolean; tab: string | null; hide_panel: boolean; message: string; pending: number; tabs: EditorTab[]; info: string[] };
  title: TitleState | null;
}

interface S {
  view: 'script' | 'showpy';
  on: boolean; // 게임과 붙어 있음
  showpy: string | null; // 게임의 ui_kit 버전
  st: GameState | null;
  err: string | null;
  section: string;
}

export const useLive = create<S>(() => ({ view: 'script', on: false, showpy: null, st: null, err: null, section: 'title' }));

export const liveSend = (cmd: Record<string, unknown>) => {
  if (!desktop || !useLive.getState().on) return;
  void desktop.liveSend(cmd);
};

let started = false;
export function startLive() {
  if (!desktop || started) return;
  started = true;
  const status = (s: { on: boolean; showpy: string | null }) => useLive.setState(s.on ? s : { ...s, st: null });
  void desktop.liveStatus().then(status);
  desktop.onLiveStatus(status);
  desktop.onLive((m) => {
    if (m?.type === 'state') useLive.setState({ st: m as GameState, err: null });
    else if (m?.type === 'error') useLive.setState({ err: String(m.text) });
  });
}
