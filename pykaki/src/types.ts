// 프로젝트 저장 파일(JSON)의 구조. 설계 문서 5장 참고.

// scene/show/hide/music/sound는 렌파이 명령을 몰라도 칸만 채우면 되는 연출 줄
// flag: 플래그 바꾸기 줄 (FEATURE 14). text에 바꾸는 식 (예: love += 1, met_alice = True)을 두고 $ 줄로 내보낸다
// pause: 멈춤 줄, shake: 흔들기 줄 (FEATURE 15)
// hud: HUD 보이기/숨기기 줄 (FEATURE 18). screen에 화면 id, stop이면 숨기기 (show screen / hide screen)
export type LineType = 'narration' | 'say' | 'scene' | 'show' | 'hide' | 'music' | 'sound' | 'fx' | 'command' | 'note' | 'flag' | 'pause' | 'shake' | 'hud';
export type ShakeKind = 'vpunch' | 'hpunch' | 'flash';

// showpy 화면 효과 값. 대사 줄은 괄호로, 연출 줄(fx)은 명령으로 내보낸다. 빈 칸은 안 내보낸다
export interface LineFx {
  fx?: string; // ascii | retro_term | gameboy | none | default
  transition?: string; // tv | fade | none
  overlay?: string; // on | off
  warp?: string; // 0~5 | default
  cursor?: string; // effect | overlay | top | default
  exclude?: string[]; // 효과에서 뺄 글자: say | choice | screens
}

// 대사 한 줄의 글자 모양. showpy 대사 괄호로 내보낸다. 빈 칸은 안 내보낸다
export interface SayStyle {
  size?: number;
  font?: string; // game 폴더 기준 글꼴 파일
  color?: string; // #rrggbb
  cps?: number; // 1초에 나오는 글자 수
  sound?: string; // 대사 소리 (game 기준 경로, 예: audio/type.ogg). ''이면 이 줄은 끔, 없으면 캐릭터 → 게임 처음 값 (FEATURE 10, cb_typing_sound=)
  effect?: string; // 등장 효과 (EFFECTS). 두 개를 겹치면 "slidein|shake"
  box?: string; // 글 상자 (BOXES): bubble 말풍선 | pill 둥근 테두리 (showpy ui_kit 4.0)
  tail?: string; // 말풍선 꼬리 (TAILS): bottom | top | left | right | none. 비우면 상자 기본
  box_rotate?: number; // 상자와 글 기울기 (도)
  name_size?: number;
  name_font?: string;
  name_color?: string;
  // 위치는 showpy 편집기에서 정해서 받아 적는다. 대사창 기준 좌표
  x?: number;
  y?: number;
  name_x?: number;
  name_y?: number;
}

export type ImageKind = 'char' | 'bg' | 'etc';

export interface Line {
  id: string;
  type: LineType;
  who?: string; // say, 캐릭터 show/hide일 때 캐릭터 id
  attr?: string; // say, 캐릭터 show일 때 이미지 속성(표정 등)
  text: string; // 연출 줄에서는 쓰지 않는다
  kind?: ImageKind; // show/hide: 이미지 종류
  image?: string; // scene/배경: bg 뒤 이름, 기타: 이미지 이름
  at?: string; // show: left | right (비우면 가운데)
  trans?: string; // scene/show/hide: dissolve | fade (비우면 바로)
  file?: string; // music/sound: 파일 이름
  stop?: boolean; // music, sound: 멈추기
  // 음악·효과음 세부 (FEATURE 15). 없으면 예전처럼 (시작은 바로, 멈출 때 1초 페이드아웃, 반복은 게임 기본)
  fadein?: number; // music: 시작할 때 페이드인 초
  fadeout?: number; // music, sound 멈추기: 페이드아웃 초 (없으면 1초)
  queue?: boolean; // music: 지금 곡이 끝나면 이어 틀기 (queue music)
  loop?: boolean; // music: true면 loop, false면 noloop, 없으면 게임 기본
  channel?: 'audio'; // sound: audio 채널 (여러 소리가 겹쳐 나옴). 없으면 sound 채널
  secs?: number; // pause: 멈출 초. 없으면 클릭할 때까지
  shake?: ShakeKind; // shake: 세로 vpunch | 가로 hpunch | 번쩍 flash (없으면 vpunch)
  zorder?: number; // show: 앞뒤 (숫자가 클수록 앞)
  screen?: string; // hud: 보이거나 숨길 화면 id (project.screens)
  behind?: string; // show: 이 태그의 그림 뒤에
  // 음성 (FEATURE 16, say 줄). vno: label 안 음성 번호 (한 번 매기면 그대로). voice: 직접 고른 파일 (audio 기준), ''이면 이 줄은 음성 없음, 없으면 이름 규칙으로
  vno?: number;
  voice?: string;
  fx?: LineFx; // say, narration, fx 줄 (showpy 연결을 켰을 때만 내보낸다)
  say?: SayStyle; // say, narration 줄 (showpy 연결을 켰을 때만 내보낸다)
}

export interface Choice {
  id: string;
  text: string;
  target: string | null;
  mode: 'jump';
  condition: string | null; // 보이는 조건 (렌파이 조건식, 예: love >= 5). 비우면 늘 보임 (FEATURE 14)
  actions: string[]; // 고르면 바꾸는 식 (예: love += 1, met_alice = True). 선택지 아래 $ 줄로 (FEATURE 14)
}

// 조건 분기의 갈래 하나 (FEATURE 13). cond는 렌파이 조건식 그대로 (예: love >= 5)
export interface Branch {
  id: string;
  cond: string;
  target: string | null;
}

// 선택지 위에 보이는 질문 대사 (FEATURE 15). who가 null이면 내레이션. 글이 비면 내보내지 않는다
export interface MenuAsk {
  who: string | null;
  text: string;
}

// 화면 부르기 (FEATURE 17): call screen 뒤 _return 값마다 갈래. outs는 화면의 버튼 값을 따라 저절로 맞춘다 (screens.ts)
export interface ScreenOut {
  id: string;
  value: string;
  target: string | null;
}

// 화면 만들기 탭에서 만든 렌파이 screen (FEATURE 17). game/pykaki_screens.rpy로 내보낸다
// bar: 플래그 값 막대 (FEATURE 18). HUD의 항목은 x, y가 HUD 왼쪽 위 기준
export type ScreenItemKind = 'imagebutton' | 'textbutton' | 'text' | 'image' | 'bar';
// 버튼을 누르면 (FEATURE 18): return 값 돌려주기 (전체 화면만, 없으면 이것) | flag 플래그 바꾸기 | jump 상자로 가기 | toggle 다른 HUD 열고 닫기
export type ScreenAct = 'return' | 'flag' | 'jump' | 'toggle';
export type ScreenAnchor = 'tl' | 't' | 'tr' | 'l' | 'c' | 'r' | 'bl' | 'b' | 'br';
export interface ScreenItem {
  id: string;
  kind: ScreenItemKind;
  x: number; // 게임 화면 기준 왼쪽 위 (px)
  y: number;
  image?: string; // imagebutton, image: 렌파이 그림 이름 (예: door, bg room)
  hover?: string; // imagebutton: 마우스를 올렸을 때 그림 (비우면 idle 그대로)
  text?: string; // textbutton, text
  size?: number; // 글자 크기
  color?: string; // 글자 색 #rrggbb
  hoverColor?: string; // textbutton: 마우스를 올렸을 때 글자 색
  value?: string; // 버튼: 누르면 돌려줄 값 (_return)
  // FEATURE 18
  cond?: string; // 보이는 조건 (렌파이 조건식). 비우면 늘 보임 (if 블록으로)
  act?: ScreenAct; // 버튼을 누르면. 없으면 return
  acts?: string[]; // act flag: 바꾸는 식 (예: love += 1)
  target?: string | null; // act jump: 갈 상자 id
  screen?: string | null; // act toggle: 열고 닫을 화면 id
  flag?: string; // bar: 플래그 이름
  max?: number; // bar: 꽉 찬 값 (없으면 10)
  w?: number; // bar: 크기 (px)
  h?: number;
  bgColor?: string; // bar: 빈 쪽 색 (color는 찬 쪽)
}
export interface ScreenDef {
  id: string;
  name: string; // 렌파이 screen 이름
  title: string; // 화면 표시용
  bg?: string; // 배경: 그림 이름 또는 #rrggbb 색. 비우면 아래 화면이 그대로 보임
  items: ScreenItem[];
  // HUD (FEATURE 18): 대사가 흐르는 동안 떠 있는 화면 (modal 없음, show screen). 없으면 전체 화면 (call screen)
  kind?: 'hud';
  w?: number; // HUD 크기 (px)
  h?: number;
  anchor?: ScreenAnchor; // 게임 화면의 어디에 붙이는지 (없으면 tl)
  dx?: number; // 붙인 곳에서 옮긴 만큼 (px)
  dy?: number;
  bgAlpha?: number; // 배경 투명도 0~100 (없으면 100)
  zorder?: number; // 겹치는 차례 (클수록 앞)
  overlay?: boolean; // 게임 내내 띄우기 (config.overlay_screens)
}

export type Exit =
  | { type: 'next'; target: string | null }
  | { type: 'if'; branches: Branch[]; else: string | null }
  | { type: 'menu'; choices: Choice[]; ask?: MenuAsk }
  | { type: 'call'; target: string | null; then: string | null }
  | { type: 'screen'; screen: string | null; outs: ScreenOut[]; else: string | null }
  | { type: 'return' };

export type ExitType = Exit['type'];

// 상자나 label에 거는 셰이더 두 자리 (showpy screen_fx.shaders). 상자에 없으면 label 것을, label에도 없으면 게임 설정대로
export interface BoxShader {
  a: string; // 1번: none | ascii | vhs_crt | retro_term | gameboy | ...
  b: string; // 2번
  in?: string; // 이 셰이더가 시작할 때 전환: tv | pixelsort | datamosh | none. 예전 대본에는 fade나 빈 값(게임 설정대로)도 있다
  out?: string; // 이 셰이더가 끝날 때 전환
  va?: Record<string, unknown>; // 1번 셰이더의 세부 값 (이 상자·label에서만. 없으면 게임 설정대로)
  vb?: Record<string, unknown>; // 2번 셰이더의 세부 값
  tv?: Record<string, number>; // TV 전환의 세부 값 (시작할 때와 끝날 때 같이 씀)
  time?: number; // 그림 전환(pixelsort, datamosh)의 초. 없으면 그 효과 파일의 @time (시작할 때와 끝날 때 같이 씀)
  iv?: Record<string, Record<string, number | string>>; // 그림 전환의 값 {효과 이름: {값 이름: 값}}. 예: {datamosh: {mode: 1}} (방향), {blink: {count: 5, color: "#ff0000"}} (FEATURE 12, 색은 글자)
}

// 상자에 거는 커서·클릭 대기 그림 (pygaki 플러그인 ui_kit 4.7 custom_ui.scene, LINK.md 2장).
// 값마다 따로: 상자에 없으면 게임 처음 값(GUI 편집 → 게임 처음 값). 앞 상자 것을 이어받지 않는다.
// 대사 소리와 속도는 대사 줄마다(SayStyle.sound, cps). FEATURE 9까지의 상자·label cps, sound와 label ui는
// 열 때 normalizeProject가 줄과 상자로 옮겨 적는다 (sample.ts moveUi)
export interface BoxUi {
  ctc?: string; // 클릭 대기 표시 그림 폴더 (game 기준, 예: gui/ctc/heart)
  cursor?: string; // 커서 그림 폴더 (game 기준, 예: gui/cursor/hand)
}

export interface BoxNode {
  id: string;
  group: string; // LabelGroup.id
  color?: string; // 상자 색. 없으면 label 색을 따른다
  shader?: BoxShader; // 이 상자의 셰이더. 없으면 label 것을 따른다
  ui?: BoxUi; // 이 상자의 커서, 클릭 대기. 값마다 없으면 게임 처음 값
  title: string;
  pos: { x: number; y: number };
  lines: Line[];
  exit: Exit;
}

// 플래그 = 렌파이 변수 (FEATURE 14). 원고 맨 위에 default name = init 으로 내보낸다
export type FlagKind = 'bool' | 'int' | 'str';
export interface Flag {
  id: string;
  name: string; // 렌파이 변수 이름
  kind: FlagKind; // 켜짐/꺼짐 | 숫자 | 글자
  init: boolean | number | string; // 처음 값
  note?: string; // 작가 메모 (원고에 주석으로)
}

export interface Character {
  id: string; // 렌파이 변수 이름
  name: string;
  color: string;
}

export interface LabelGroup {
  id: string;
  name: string; // 렌파이 label 이름
  title: string; // 화면 표시용
  color: string;
  entry: string | null;
  shader?: BoxShader; // 이 label의 상자 모두에 거는 셰이더
}

export interface Settings {
  escapeBrackets: boolean; // [ → [[
  allowTextTags: boolean; // false면 { → {{
  escapePercent: boolean; // % → %%
  renpyLink: boolean; // showpy 연결: 상자마다 label, 줄 표시, 플러그인 문법을 내보낸다
  voice?: boolean; // 음성 쓰기 (FEATURE 16): 대사마다 음성 번호를 매기고 voice 줄을 내보낸다
}

export interface Project {
  format: 'renpy-flow';
  version: 1;
  // 쓴 판 (저장할 때 붙임, 없으면 예전 파일). needs: 이 대본을 읽는 데 필요한 기능 판 (src/version.ts FEATURE)
  app?: { by: string; build: string; needs: number };
  project: { title: string; startNode: string | null };
  characters: Character[];
  screens?: ScreenDef[]; // 화면 만들기 (FEATURE 17)
  variables: Flag[]; // 플래그 (FEATURE 14. 그 전에는 늘 빈 배열)
  labels: LabelGroup[];
  layout: { direction: 'TB' | 'LR' };
  settings: Settings;
  nodes: BoxNode[];
}
