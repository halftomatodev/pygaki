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
// 커서, 클릭 대기, 대사 소리 (custom_ui 탭, ui_kit 3.15)
export interface CustomUIValues {
  text_cps: number | null;
  typing_sound: string | null;
  typing_volume: number;
  ctc: boolean;
  ctc_frames: string[];
  ctc_hold: number;
  cursor: boolean;
  cursor_frames: string[];
  cursor_hold: number;
  cursor_mode: 'software' | 'hardware';
  cursor_hotspot: [number, number];
  quick_menu: boolean;
}
export interface CustomUIState {
  ok: boolean;
  why: string;
  values?: CustomUIValues;
  edited?: string[];
  cps?: number; // 지금 쓰는 글자 속도 (text_cps가 비면 환경설정 값)
  reload_keys?: string[];
  fps?: number;
  max_frames?: number;
  playing?: boolean;
}
export interface GameFiles {
  audio: string[];
  images: string[];
}
export interface GameState {
  where: { file: string | null; line: number; screens: string[]; main_menu: boolean; menu: boolean };
  editor: { open: boolean; tab: string | null; hide_panel: boolean; message: string; pending: number; tabs: EditorTab[]; info: string[] };
  title: TitleState | null;
  custom_ui?: CustomUIState | null; // ui_kit 3.15부터
}

interface S {
  view: 'script' | 'showpy';
  on: boolean; // 게임과 붙어 있음
  showpy: string | null; // 게임의 ui_kit 버전
  st: GameState | null;
  files: GameFiles | null; // 게임 폴더의 소리, 그림 파일 (렌파이 list_files, game 기준)
  err: string | null;
  section: string;
}

export const useLive = create<S>(() => ({ view: 'script', on: false, showpy: null, st: null, files: null, err: null, section: 'title' }));

export const liveSend = (cmd: Record<string, unknown>) => {
  if (!desktop || !useLive.getState().on) return;
  void desktop.liveSend(cmd);
};

let started = false;
export function startLive() {
  if (!desktop || started) return;
  started = true;
  const status = (s: { on: boolean; showpy: string | null }) =>
    useLive.setState(s.on ? { on: s.on, showpy: s.showpy } : { on: false, showpy: s.showpy, st: null, files: null });
  const take = (m: any) => {
    if (m?.type === 'state') useLive.setState({ st: m as GameState, err: null });
    else if (m?.type === 'files') useLive.setState({ files: { audio: m.audio ?? [], images: m.images ?? [] } });
    else if (m?.type === 'error') useLive.setState({ err: String(m.text) });
  };
  desktop.onLiveStatus(status);
  desktop.onLive(take);
  // 화면이 뜨기 전에 온 상태와 파일 목록 (게임은 바뀔 때만 다시 보냄)
  void desktop.liveStatus().then((s) => {
    status(s);
    if (s.on) for (const m of s.last ?? []) if (!(m.type === 'state' && useLive.getState().st)) take(m);
  });
}
