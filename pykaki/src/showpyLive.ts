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
  effect?: string | null; // 글자 효과 (ui_kit 3.19)
  kind?: 'item' | 'label'; // label = 제목, 부제 (ui_kit 3.19)
  name?: string;
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
  background?: string | null; // 이 메뉴의 배경 그림/영상 (ui_kit 3.19). 없으면 타이틀 검은 화면, ESC 메뉴 투명
  effects?: [string | null, string][]; // 고를 수 있는 글자 효과 [이름, 표시]
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
// 게임 안 편집기 패널을 통째로 (ui_kit 3.16). k: h 가로 / v 세로 / g 격자 / t 글 / b 버튼 / bar 막대 / in 입력칸 / img 그림 / col 색 견본
export type MirrorNode =
  | { k: 'h' | 'v' | 'g'; c: MirrorNode[] }
  | { k: 't'; t: string; c?: string }
  | { k: 'b'; id: string; t: string; on: boolean; ok: boolean; c?: MirrorNode[] }
  | { k: 'bar'; id: string; r: number; v: number; s: number }
  | { k: 'in'; id: string; t: string }
  | { k: 'img'; p: string }
  | { k: 'col'; v: string | null };
export interface PanelState {
  tab: string | null;
  body: MirrorNode | null;
  popup: MirrorNode | null;
  popup_kind: string | null;
}
export interface GameFiles {
  audio: string[];
  images: string[];
  movies?: string[]; // ui_kit 3.19부터
}
export interface GameState {
  where: { file: string | null; line: number; screens: string[]; main_menu: boolean; menu: boolean };
  editor: { open: boolean; tab: string | null; hide_panel: boolean; message: string; pending: number; tabs: EditorTab[]; info: string[] };
  title: TitleState | null;
  custom_ui?: CustomUIState | null; // ui_kit 3.15부터
  panel?: PanelState | null; // ui_kit 3.16부터. 편집기가 열려 있고 게임 안 패널이 숨어 있을 때만
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
  // [대본] 화면으로 가면 앱에서 연 편집기를 닫는다 (열려 있으면 게임 입력이 편집기로 가서 게임이 안 넘어감)
  useLive.subscribe((s, prev) => {
    if (prev.view === 'showpy' && s.view !== 'showpy' && s.st?.editor.open && s.st.editor.hide_panel) liveSend({ cmd: 'editor', open: false });
  });
  const status = (s: { on: boolean; showpy: string | null }) =>
    useLive.setState(s.on ? { on: s.on, showpy: s.showpy } : { on: false, showpy: s.showpy, st: null, files: null });
  const take = (m: any) => {
    if (m?.type === 'state') useLive.setState({ st: m as GameState, err: null });
    else if (m?.type === 'files') useLive.setState({ files: { audio: m.audio ?? [], images: m.images ?? [], movies: m.movies ?? [] } });
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
