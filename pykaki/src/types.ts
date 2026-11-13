// 프로젝트 저장 파일(JSON)의 구조. 설계 문서 5장 참고.

// scene/show/hide/music/sound는 렌파이 명령을 몰라도 칸만 채우면 되는 연출 줄
export type LineType = 'narration' | 'say' | 'scene' | 'show' | 'hide' | 'music' | 'sound' | 'fx' | 'command' | 'note';

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
  stop?: boolean; // music: 멈추기
  fx?: LineFx; // say, narration, fx 줄 (showpy 연결을 켰을 때만 내보낸다)
  say?: SayStyle; // say, narration 줄 (showpy 연결을 켰을 때만 내보낸다)
}

export interface Choice {
  id: string;
  text: string;
  target: string | null;
  mode: 'jump';
  condition: string | null; // 2단계(플래그)용, 지금은 null
  actions: string[]; // 2단계(플래그)용, 지금은 비어 있음
}

export type Exit =
  | { type: 'next'; target: string | null }
  | { type: 'menu'; choices: Choice[] }
  | { type: 'call'; target: string | null; then: string | null }
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
  iv?: Record<string, Record<string, number>>; // 그림 전환의 값 {효과 이름: {값 이름: 값}}. 예: {datamosh: {mode: 1}} (방향)
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
}

export interface Project {
  format: 'renpy-flow';
  version: 1;
  // 쓴 판 (저장할 때 붙임, 없으면 예전 파일). needs: 이 대본을 읽는 데 필요한 기능 판 (src/version.ts FEATURE)
  app?: { by: string; build: string; needs: number };
  project: { title: string; startNode: string | null };
  characters: Character[];
  variables: unknown[];
  labels: LabelGroup[];
  layout: { direction: 'TB' | 'LR' };
  settings: Settings;
  nodes: BoxNode[];
}
