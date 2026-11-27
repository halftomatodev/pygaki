// 프로젝트 저장 파일(JSON)의 구조. 설계 문서 5장 참고.

// scene/show/hide/music/sound는 렌파이 명령을 몰라도 칸만 채우면 되는 연출 줄
// flag: 플래그 바꾸기 줄 (FEATURE 14). text에 바꾸는 식 (예: love += 1, met_alice = True)을 두고 $ 줄로 내보낸다
// pause: 멈춤 줄, shake: 흔들기 줄 (FEATURE 15)
// hud: HUD 보이기/숨기기 줄 (FEATURE 18). screen에 화면 id, stop이면 숨기기 (show screen / hide screen)
export type LineType = 'narration' | 'say' | 'scene' | 'show' | 'hide' | 'music' | 'sound' | 'fx' | 'command' | 'note' | 'flag' | 'pause' | 'shake' | 'hud' | 'input';
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
  box?: string; // 글 상자 (BOXES): bubble 말풍선 | pill 둥근 테두리 (showpy) | media 그림/영상 
  tail?: string; // 말풍선 꼬리 (TAILS): bottom | top | left | right | none. 비우면 상자 기본
  box_rotate?: number; // 상자와 글 기울기 (도)
  // 그림/영상 상자 (box media, FEATURE 24): 글 뒤에 까는 그림이나 영상 (game 기준 경로). 기본 대사창은 투명해짐
  media?: string;
  media_fit?: 'image'; // 그림 크기 그대로 (없으면 글 크기에 맞춤)
  // 그림의 자리·크기·회전은 pygaki editor에서 정해서 받아 적는다. 글 가운데 기준
  media_x?: number; // 옮김 (픽셀)
  media_y?: number;
  media_zoom?: number; // 배율 (글에 맞춤이면 맞춘 크기에 곱함)
  media_angle?: number; // 그림만 돌리기 (도)
  // 투명 영상 (FEATURE 26): 왼쪽 색 + 오른쪽 투명도 영상인지. 없으면 파일 이름이 mask_로 시작할 때 투명 영상
  media_mask?: boolean;
  media_alpha?: number; // 그림 투명도 0~1 (없으면 1)
  // 글 상자 묶기·네 점 변형·그림 효과 (FEATURE 28). 묶기·변형은 pygaki editor에서 정해서 받아 적는다
  media_link?: number[]; // 글을 그림에 묶음: 묶을 때의 그림 [크기, 회전, 가로 옮김, 세로 옮김]. 그 뒤로 달라진 만큼 글이 따라감
  media_quad?: number[]; // 그림 네 모서리 옮김 8개 (왼위, 오른위, 오른아래, 왼아래의 가로, 세로. 그림 크기에 대한 비율)
  media_text_quad?: number[]; // 글 네 모서리 옮김 8개 (글 크기에 대한 비율)
  media_fx?: string; // 나타날 때 그림 효과. 나타나는 방식과 같은 꼴 img_fx.use("vibrate", 0.6, amount=14)
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
  extend?: boolean; // narration: 앞 대사에 이어서 (FEATURE 36, 원고 extend "글"). 화자·표정은 앞 대사 것
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
  from?: number; // music 틀기·이어 틀기: 곡의 이 초부터 (FEATURE 37, 원고 "<from 초>파일")
  seek?: number; // music: 지금 곡을 다시 틀지 않고 이 초로 옮김 (FEATURE 37, 렌파이 8.6 renpy.music.seek. 8.5에서는 아무 일도 안 함)
  channel?: 'audio'; // sound: audio 채널 (여러 소리가 겹쳐 나옴). 없으면 sound 채널
  secs?: number; // pause: 멈출 초. 없으면 클릭할 때까지
  shake?: ShakeKind; // shake: 세로 vpunch | 가로 hpunch | 번쩍 flash (없으면 vpunch)
  zorder?: number; // show: 앞뒤 (숫자가 클수록 앞)
  screen?: string; // hud: 보이거나 숨길 화면 id (project.screens)
  behind?: string; // show: 이 태그의 그림 뒤에
  // 플래그 입력 (FEATURE 30, 31, input 줄): text는 묻는 글, flag는 친 값을 넣을 글자·숫자 플래그 id. length는 FEATURE 30의 최대 글자 수(읽을 때 플래그 ui.len으로 옮김). 비우면 플래그의 처음 값
  flag?: string;
  length?: number;
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
  media?: ChoiceMedia; // 글 뒤 그림/영상 (FEATURE 24, pygaki 플러그인)
}

// 선택지 글 뒤 그림/영상 (game 기준 경로). 하나라도 있으면 기본 버튼 배경이 없어짐
export interface ChoiceMedia {
  idle?: string; // 평소
  hover?: string; // 마우스를 올렸을 때 (없으면 평소 것)
  select?: string; // 고르고 확정할 때 잠깐
  time?: number; // select를 보여 주는 초 (없으면 0.5)
  fit?: 'image'; // 그림 크기 그대로 (없으면 글 크기에 맞춤)
  // 자리·크기·회전은 pygaki editor에서 정해서 받아 적는다. 선택지 가운데 기준, 세 그림에 같이
  x?: number;
  y?: number;
  zoom?: number; // 배율
  angle?: number; // 도
  // 묶기·네 점 변형·그림 효과 (FEATURE 28): SayStyle의 media_link, media_quad, media_text_quad, media_fx와 같음
  link?: number[];
  quad?: number[];
  text_quad?: number[];
  fx?: string;
}

// 조건 분기의 갈래 하나 (FEATURE 13). cond는 렌파이 조건식 그대로 (예: love >= 5)
export interface Branch {
  id: string;
  cond: string;
  target: string | null;
}

// 정답 입력의 다시 묻기 (FEATURE 33)
export interface AnswerRetry {
  tries: number;
  hints: string[];
  who: string | null;
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
export type ScreenItemKind = 'imagebutton' | 'textbutton' | 'text' | 'image' | 'bar' | 'drop' | 'look' | 'voice'; // drop: 놓는 곳 (FEATURE 19). look: 플래그 꼴 (FEATURE 21, 꼴·꾸미기는 플래그 카드의 것). voice: 음성 빛 (FEATURE 34)
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
  flag?: string; // bar, look: 플래그 이름
  max?: number; // bar: 꽉 찬 값 (없으면 10)
  w?: number; // bar: 크기 (px)
  h?: number;
  bgColor?: string; // bar: 빈 쪽 색 (color는 찬 쪽). drop: 칸 색
  // 끌어 놓기 (FEATURE 19, 렌파이 Drag): text·image는 drag면 끌 수 있고 놓으면 제자리로. drop(놓는 곳)은 w·h 칸, 글 text, 놓으면 act(버튼과 같음)
  drag?: boolean;
  accept?: string | null; // drop: 받는 것 (끌 수 있는 항목 id). 없으면 아무거나
  // FEATURE 29: 버튼 상태 (미니맵 등). 글 버튼은 image·hover가 기본·올렸을 때 배경 그림(비우면 배경 없음, 글자 색만)
  selected?: string; // 고른 상태가 되는 조건 (렌파이 selected, 예: place == "부엌")
  selImage?: string; // 고른 상태 그림 (그림 버튼) 또는 배경 그림 (글 버튼)
  selColor?: string; // 글 버튼: 고른 상태 글자 색
  // FEATURE 29: 보이는 조건이 바뀔 때 (인벤토리 등). 렌파이 showif + 나타날 때·사라질 때 ATL
  anim?: 'fade' | 'slide' | 'rise' | 'pop';
  sfxIn?: string; // 나타날 때 효과음 (game 기준 경로)
  sfxOut?: string; // 사라질 때 효과음
  edit?: boolean; // look (FEATURE 22): 게임에서 꼴로 플래그 값을 바꿀 수 있음 (슬라이더·막대는 끌기, 칸·별은 누르기, 스위치는 누르기, 풀다운·콤보는 펼쳐서 고르기). 없으면 보이기만
  z?: number; // 앞뒤 (FEATURE 35): 클수록 앞, 같으면 넣은 차례. 없으면 0. 끌어 놓기 항목은 draggroup 한 층 (screens.ts drawOrder)
  voice?: VoiceGlow; // voice (FEATURE 34): 음성이 나오는 동안 소리 크기에 맞춰 움직이는 빛. 크기는 w·h
}
// 음성 빛 (FEATURE 34). 비운 값은 처음 값 (screens.ts VOICE_DEF)
export type VoiceShape = 'line' | 'ring' | 'orb'; // 아래 띠(대사 상자 아래) | 테두리 | 둥근 빛
export type VoicePalette = 'colorful' | 'ocean' | 'sunset' | 'candy' | 'forest' | 'mono';
export interface VoiceGlow {
  shape?: VoiceShape;
  palette?: VoicePalette;
  strength?: number; // 0~1 진하기
  gain?: number; // 소리를 키우는 정도 (0.5~3)
  idle?: number; // 음성이 없을 때 남는 빛 (0이면 숨음, 0~0.5)
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
  cw?: number; // 스크롤 (FEATURE 23): HUD 안쪽 크기 (px). 크기보다 크면 끌기·휠로 넘겨 봄 (렌파이 viewport). 없으면 스크롤 없음
  ch?: number;
}

// 정답 입력의 갈래 하나 (FEATURE 32). text: 정답 글 (여러 개는 / 로 나눔), flag: 그 플래그의 값도 정답 (플래그 id)
export interface AnswerCase {
  id: string;
  text: string;
  flag?: string;
  target: string | null;
}

export type Exit =
  | { type: 'next'; target: string | null }
  | { type: 'if'; branches: Branch[]; else: string | null }
  | { type: 'menu'; choices: Choice[]; ask?: MenuAsk }
  | { type: 'call'; target: string | null; then: string | null }
  | { type: 'screen'; screen: string | null; outs: ScreenOut[]; else: string | null }
  // 정답 입력 (FEATURE 32): 플레이어가 답을 치고, 맞는 갈래로 (위부터). 어느 것도 아니면 else (틀림).
  // ask: 묻는 글. keep: 친 값을 넣을 글자·숫자 플래그 id. exact: 띄어쓰기·대소문자까지 똑같아야 정답 (없으면 무시). length: 최대 글자 수
  // retry (FEATURE 33): 틀리면 이 자리에서 다시 묻기. tries 번 틀리면 else로 (0이면 맞힐 때까지), 틀릴 때마다 hints[틀린 횟수-1] (넘치면 마지막), who 힌트 화자 (null 내레이션)
  | { type: 'answer'; ask: string; cases: AnswerCase[]; else: string | null; keep?: string; exact?: true; length?: number; retry?: AnswerRetry }
  | { type: 'return' };

export type ExitType = Exit['type'];

// 상자나 label에 거는 셰이더 두 자리 (showpy screen_fx.shaders). 상자에 없으면 label 것을, label에도 없으면 게임 설정대로
export interface BoxShader {
  a: string; // 1번: none | ascii | vhs_crt | retro_term | gameboy |...
  b: string; // 2번
  in?: string; // 이 셰이더가 시작할 때 전환: tv | pixelsort | datamosh | none. 예전 대본에는 fade나 빈 값(게임 설정대로)도 있다
  out?: string; // 이 셰이더가 끝날 때 전환
  va?: Record<string, unknown>; // 1번 셰이더의 세부 값 (이 상자·label에서만. 없으면 게임 설정대로)
  vb?: Record<string, unknown>; // 2번 셰이더의 세부 값
  tv?: Record<string, number>; // TV 전환의 세부 값 (시작할 때와 끝날 때 같이 씀)
  time?: number; // 그림 전환(pixelsort, datamosh)의 초. 없으면 그 효과 파일의 @time (시작할 때와 끝날 때 같이 씀)
  iv?: Record<string, Record<string, number | string>>; // 그림 전환의 값 {효과 이름: {값 이름: 값}}. 예: {datamosh: {mode: 1}} (방향), {blink: {count: 5, color: "#ff0000"}} (FEATURE 12, 색은 글자)
}

// 상자에 거는 커서·클릭 대기 그림 (pygaki 플러그인  custom_ui.scene, LINK.md 2장).
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
  w?: number; // 캔버스 상자 폭 (px, 오른쪽 아래 손잡이로 끌어 정함). 없으면 기본 폭. 원고와는 상관없음
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
  persist?: true; // 게임 밖에도 남김 (FEATURE 30): 원고에서 persistent.이름 (엔딩 모으기, 회차). 대본에는 이름만
  ui?: FlagUi; // 플래그 카드·견본에서 보이는 꼴 (FEATURE 20). 없으면 종류로 정함 (flagUi.ts)
}

// 플래그의 꼴 (FEATURE 20, 29): 숫자는 레벨 인디케이터, 켜짐/꺼짐은 스위치·체크박스, 글자는 라디오·풀다운.
// 예전 슬라이더는 레벨, 콤보박스는 풀다운으로 읽음 (flagUi.ts normalizeUi)
// 입력칸 (FEATURE 31): 글자·숫자 플래그를 플레이어가 쳐서 정함 (대본의 플래그 입력 줄, HUD에서 게임에서 바꾸기)
export type FlagLook = 'level' | 'switch' | 'checkbox' | 'radio' | 'pulldown' | 'input';
export type LevelStyle = 'continuous' | 'discrete' | 'rating';
export interface FlagSkinPart {
  color?: string; // #rrggbb 또는 #rrggbbaa
  image?: string; // 게임 그림 이름 (예: heart) 또는 game 기준 파일 경로 (예: images/ui/heart.png, movies/mask_fire.webm. 영상은 반복·소리 없이, mask_는 투명 영상)
}
export interface FlagUi {
  look: FlagLook;
  style?: LevelStyle; // 레벨 인디케이터: 이어진 막대 | 칸 막대 | 별(기호)
  min?: number; // 숫자: 가장 작은 값 (없으면 0)
  max?: number; // 숫자: 가장 큰 값 (없으면 10)
  options?: string[]; // 글자: 고를 값 목록
  skin?: Record<string, FlagSkinPart>; // 부품마다 색·그림 (부품 이름은 flagUi.ts SKIN_PARTS)
  corner?: FlagCorner; // 모서리 (FEATURE 23): 없으면 둥글게. 각지게, 알약(높이의 반)
  // FEATURE 29 (레벨 인디케이터, HUD 요소 데모의 짜임): 경고·위험 임계와 방향, 막대의 프레임 9-slice·여백·채움 맞춤·끝 장식, 칸의 수·간격
  warn?: number; // 이 값 이하(dir high면 이상)면 경고 채움. 없으면 경고 없음
  crit?: number; // 위험 채움
  dir?: 'high'; // 없으면 낮을수록 위험 (HP), high면 높을수록 위험 (과열)
  slice?: number; // 프레임 그림 9-slice 모서리 (px). 없으면 늘여 맞춤
  pad?: number; // 프레임 안쪽 여백 (px). 없으면 1
  fit?: 'stretch' | 'tile'; // 채움 그림: 없으면 자르기(원본 폭에서 값만큼 보임), 늘이기, 타일 반복
  tip?: number; // 끝 장식 높이 (px). 없으면 막대 높이
  cells?: number; // 별(칸형) 칸 수. 없으면 범위만큼 (10개까지). 한 칸이 여러 값이면 칸 안쪽을 잘라 보임
  gap?: number; // 칸 간격 (px). 없으면 2
  len?: number; // 입력칸 (FEATURE 31, 글자): 칠 수 있는 최대 글자 수. 없으면 렌파이 기본. 숫자는 최솟값·최댓값 자릿수
}
export type FlagCorner = 'square' | 'pill';

export interface Character {
  id: string; // 렌파이 변수 이름
  name: string;
  color: string;
  nameBefore?: string; // 표시 이름을 플래그 값 "[pname]"으로 잇기 전 이름. 잇기를 빼면 이 이름으로 돌림 (FlagLook InputKnobs)
}

export interface LabelGroup {
  id: string;
  name: string; // 렌파이 label 이름
  title: string; // 화면 표시용
  color: string;
  entry: string | null;
  shader?: BoxShader; // 이 label의 상자 모두에 거는 셰이더
  hud?: LabelHud[]; // 이 label의 상자 모두에서 HUD 보이기/숨기기 (FEATURE 27). 상자가 같은 HUD를 정하면 상자 것
}

// label의 HUD 하나 (FEATURE 27): screen = 화면 id (project.screens), stop이면 숨기기
export interface LabelHud {
  screen: string;
  stop?: boolean;
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
