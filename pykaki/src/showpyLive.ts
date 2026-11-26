// showpy 실시간 연결 (데스크톱 앱 전용). 게임이 보내는 상태를 받아 두고, 명령을 보낸다.
// 형식은 저장소 맨 위 docs/LINK.md 9장. 연결은 app/main.cjs가 맺고 여기는 받기만 한다.
import { getLang } from './i18n';
import { create } from 'zustand';
import { desktop } from './desktop';
import { usePrefs } from './prefs';

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
  effect?: string | null; // 글자 효과 
  kind?: 'item' | 'label'; // label = 제목, 부제 
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
  background?: string | null; // 이 메뉴의 배경 그림/영상. 없으면 타이틀 검은 화면, ESC 메뉴 투명
  effects?: [string | null, string][]; // 고를 수 있는 글자 효과 [이름, 표시]
}
export interface EditorTab {
  id: string;
  label: string;
  ok: boolean;
  why: string;
}
// 커서, 클릭 대기, 대사 소리 (custom_ui 탭)
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
  cursor_lines?: CursorLines | null; // pygaki plugin pygaki 플러그인: 커서와 셰이더 '여기에서부터'
}
export interface CursorLines {
  choices: [string, string][]; // [자리, 이름] effect / overlay / top
  now: string; // 칸에 보이는 자리 (고른 것, 없으면 게임의 지금 값)
  picked: boolean;
  file: string | null;
  line: number | null; // 고른 줄
  follow: boolean;
  here: [string, number] | null; // 게임의 지금 줄
  rows: { line: number; text: string; sel: boolean; here: boolean; dirty: boolean }[];
  have: string[]; // 고른 줄 위에 이미 있는 커서 줄
  pending: boolean;
  changes: { line: number; target: [string, number]; label: string; kind: 'code' | 'say'; pending: boolean }[];
}
// 게임 안 편집기 패널을 통째로. k: h 가로 / v 세로 / g 격자 / t 글 / b 버튼 / bar 막대 / in 입력칸 / img 그림 / col 색 견본
// / sp 가로 줄의 빈 칸(w 게임 픽셀). 어느 것이든 i가 있으면 그만큼 들여씀 (게임 픽셀)
export type MirrorNode = (
  | { k: 'h' | 'v' | 'g'; c: MirrorNode[] }
  | { k: 'sp'; w: number }
  | { k: 't'; t: string; c?: string }
  | { k: 'b'; id: string; t: string; on: boolean; ok: boolean; c?: MirrorNode[] }
  | { k: 'bar'; id: string; r: number; v: number; s: number }
  | { k: 'in'; id: string; t: string; w?: number } // w: 넓은 글 칸 (여러 줄)
  | { k: 'img'; p: string }
  | { k: 'col'; v: string | null }
) & { i?: number };
export interface PanelState {
  tab: string | null;
  body: MirrorNode | null;
  popup: MirrorNode | null;
  popup_kind: string | null;
}
export interface GameFiles {
  audio: string[];
  images: string[];
  movies?: string[]; // pygaki 플러그인
}
export interface GameState {
  where: { file: string | null; line: number; screens: string[]; main_menu: boolean; menu: boolean };
  editor: { open: boolean; tab: string | null; hide_panel: boolean; view?: GameView; bands?: boolean; message: string; pending: number; tabs: EditorTab[]; info: string[] };
  title: TitleState | null;
  custom_ui?: CustomUIState | null; // pygaki 플러그인
  panel?: PanelState | null; // pygaki 플러그인. 편집기가 열려 있고 게임 안 패널이 숨어 있을 때만
  splash?: SplashPages | null; // pygaki 플러그인 (페이지 목록). 없으면 예전 판
}

// 스플래시 페이지 (LINK.md 9장). new는 splash_config.rpy에 없고 편집기에서 만든 페이지
// keys: 조작 안내 화면(표가 있는 첫 페이지). 앱 목록에서 그 아래에 [단축키 수정]
export interface SplashPages { pages: { id: string; title: string; new: boolean; keys?: boolean }[]; cur: string | null }

interface S {
  view: 'script' | 'showpy' | 'effects' | 'shaders' | 'screens' | 'fonts'; // 대본 편집 / GUI 편집 / 효과 / 셰이더 / 화면 만들기 / 글꼴
  gamePanel: GameView; // 게임 창 pygaki editor 패널: 축약형 / 대형 / 숨김 (앱이 기억함, F9로 돎)
  on: boolean; // 게임과 붙어 있음
  reloading: boolean; // 게임이 원고를 다시 읽는 중이라 잠깐 끊김 (게임 수정 중)
  showpy: string | null; // 게임의 ui_kit 버전
  st: GameState | null;
  files: GameFiles | null; // 게임 폴더의 소리, 그림 파일 (렌파이 list_files, game 기준)
  err: string | null;
  section: string;
  want?: { tab: string; n: number } | null; // 게임이 열어 달라고 한 탭 (ShowpyView가 그 칸을 고름)
}

// 게임 창 pygaki editor 패널 (pygaki v1.9): compact 축약형 / full 대형 / hidden 숨김. 게임 창과 앱의 F9가 이 차례로 돈다.
// 이 앱(창)에 붙는 설정이라 localStorage에 둔다 (예전 값 show/hide도 읽음)
export type GameView = 'compact' | 'full' | 'hidden';
export const GAME_VIEWS: GameView[] = ['compact', 'full', 'hidden'];
export const GAME_VIEW_LABEL: Record<GameView, string> = { compact: '축약형', full: '대형', hidden: '숨김' };
export const nextGameView = (v: GameView): GameView => GAME_VIEWS[(GAME_VIEWS.indexOf(v) + 1) % GAME_VIEWS.length];
// 게임에 보내는 panel 명령. 예전 플러그인은 hide만 봄
export const panelCmd = (v: GameView) => ({ cmd: 'panel', mode: v, hide: v === 'hidden' });
const PANEL_KEY = 'pygaki-game-panel';
const loadGamePanel = (): GameView => {
  try {
    const v = localStorage.getItem(PANEL_KEY);
    if (v === 'compact' || v === 'full' || v === 'hidden') return v;
    return v === 'show' ? 'compact' : 'hidden';
  } catch {
    return 'hidden';
  }
};
const keepGamePanel = (v: GameView) => {
  useLive.setState({ gamePanel: v });
  try {
    localStorage.setItem(PANEL_KEY, v);
  } catch {
    // 못 적어도 이번 창에서는 그대로
  }
};

export const useLive = create<S>(() => ({ view: 'script', gamePanel: loadGamePanel(), on: false, reloading: false, showpy: null, st: null, files: null, err: null, section: 'title' }));

export const liveSend = (cmd: Record<string, unknown>) => {
  if (!desktop || !useLive.getState().on) return;
  void desktop.liveSend(cmd);
};

// 게임 창 pygaki editor 패널 모양을 정하고 기억한다
export function setGamePanel(v: GameView) {
  keepGamePanel(v);
  liveSend(panelCmd(v));
}
// 게임 화면 가장자리의 붉은 경계선 (이름은 예전 그대로 bands). 환경 설정에 두고, 붙을 때와 바뀔 때 게임에 보낸다. 게임 창의 F8도 여기로 돌아옴
const bandsOn = () => usePrefs.getState().gameBands !== false;
export function toggleGameBands() {
  const on = !bandsOn();
  usePrefs.setState({ gameBands: on });
  if (!useLive.getState().on) return on ? '게임 화면 경계선을 켰어요 (게임과 연결되면 보내요)' : '게임 화면 경계선을 껐어요 (게임과 연결되면 보내요)';
  return on ? '게임 화면 가장자리에 붉은 경계선을 켜요 (게임 안 pygaki editor를 열었을 때)' : '게임 화면 경계선을 꺼요';
}

// F9 (게임 창의 F9와 같음): 편집 화면이 꺼져 있으면 축약형으로 켜고, 켜져 있으면 축약형 → 대형 → 숨김. 끄기는 게임 창 Esc
export function toggleGamePanel() {
  const s = useLive.getState();
  if (!s.on) return '게임이 연결되지 않았어요. 런처에서 게임을 켜 두면 저절로 붙어요.';
  const e = s.st?.editor;
  const v: GameView = !e?.open ? 'compact' : nextGameView(e.view ?? (e.hide_panel ? 'hidden' : 'compact'));
  setGamePanel(v);
  if (!e?.open) liveSend({ cmd: 'editor', open: true });
  return `게임 창 pygaki editor: ${GAME_VIEW_LABEL[v]}`;
}

let started = false;
export function startLive() {
  if (!desktop || started) return;
  started = true;
  window.addEventListener('pygaki-lang', () => liveSend({ cmd: 'lang', lang: getLang() }));
  // [대본] 화면으로 가면 앱에서 연 편집기를 닫는다 (열려 있으면 게임 입력이 편집기로 가서 게임이 안 넘어감)
  useLive.subscribe((s, prev) => {
    if (prev.view === 'showpy' && s.view !== 'showpy' && s.st?.editor.open && s.st.editor.hide_panel) liveSend({ cmd: 'editor', open: false });
  });
  const status = (s: { on: boolean; reloading?: boolean; showpy: string | null }) => {
    const was = useLive.getState().on;
    const reloadingBefore = useLive.getState().reloading;
    // 다시 읽는 동안은 파일 목록을 그대로 둠 (다시 붙으면 새로 옴)
    if (s.on) useLive.setState({ on: true, reloading: false, showpy: s.showpy });
    else if (s.reloading) useLive.setState({ on: false, reloading: true, showpy: s.showpy, st: null });
    else useLive.setState({ on: false, reloading: false, showpy: s.showpy, st: null, files: null });
    // 새로 붙으면 기억해 둔 보이기/숨기기를 게임에 알려 줌 (게임은 붙을 때마다 숨김으로 시작)
    if (s.on && !was) liveSend(panelCmd(useLive.getState().gamePanel));
    if (s.on && !was) liveSend({ cmd: 'bands', on: bandsOn() });
    // pygaki editor 언어는 앱 언어를 따름 (pygaki v1.9). 앱에서 언어를 바꾸면 아래 'pygaki-lang'에서 다시 보냄
    if (s.on && !was) liveSend({ cmd: 'lang', lang: getLang() });
    // 새로 붙으면(다시 읽은 뒤는 빼고) 설정에 따라 앱 창을 게임 창 옆으로. 게임 창이 뜰 때까지 조금 기다림
    if (s.on && !was && !reloadingBefore && usePrefs.getState().snapGame) setTimeout(() => void desktop?.snapToGame?.(), 1500);
  };
  const take = (m: any) => {
    if (m?.type === 'state') useLive.setState({ st: m as GameState, err: null });
    else if (m?.type === 'files') useLive.setState({ files: { audio: m.audio ?? [], images: m.images ?? [], movies: m.movies ?? [] } });
    else if (m?.type === 'error') useLive.setState({ err: String(m.text) });
    // 게임 창에서 F9로 바꿈 
    else if (m?.type === 'panel') keepGamePanel(m.mode === 'compact' || m.mode === 'full' || m.mode === 'hidden' ? m.mode : m.hide ? 'hidden' : 'compact');
    // 게임 창에서 F8로 바꿈. 게임이 이미 그 값이라 다시 보내지 않음
    else if (m?.type === 'bands') {
      bandsEcho = !!m.on;
      usePrefs.setState({ gameBands: !!m.on });
    }
    // pygaki editor의 [pygaki 앱에서 고르기]: [GUI 편집]의 그 탭으로
    else if (m?.type === 'open' && typeof m.tab === 'string') useLive.setState({ view: 'showpy', want: { tab: m.tab, n: Date.now() } });
  };
  // 환경 설정에서 바꾸면 게임에 보냄
  let bandsEcho: boolean | null = null;
  usePrefs.subscribe((p, prev) => {
    const on = p.gameBands !== false;
    if (on === (prev.gameBands !== false)) return;
    if (bandsEcho === on) {
      bandsEcho = null;
      return;
    }
    bandsEcho = null;
    liveSend({ cmd: 'bands', on });
  });
  desktop.onLiveStatus(status);
  desktop.onLive(take);
  // 화면이 뜨기 전에 온 상태와 파일 목록 (게임은 바뀔 때만 다시 보냄)
  void desktop.openTab?.().then((t: string | null) => t && take({ type: 'open', tab: t }));
  void desktop.liveStatus().then((s) => {
    status(s);
    if (s.on) for (const m of s.last ?? []) if (!(m.type === 'state' && useLive.getState().st)) take(m);
  });
}
