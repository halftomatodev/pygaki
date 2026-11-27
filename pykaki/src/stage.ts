// 연출 줄(scene/show/hide/music/sound): 칸에 적은 값 → 렌파이 명령 한 줄
import type { Line, LineFx, LineType, SayStyle, ScreenDef, ShakeKind } from './types';
import { IMAGE_FX, RENPY_SHADERS, SHOWPY_SHADERS, shaderEffect } from './fx/textShaders';
import { shaderTags } from './tagEdit';

export const STAGE_TYPES: LineType[] = ['scene', 'show', 'hide', 'music', 'sound', 'pause', 'shake', 'hud', 'fx'];
export const isStage = (t: LineType) => STAGE_TYPES.includes(t);

// 줄 종류 칸이 좁아서 짧게. 실제 명령은 칸 아래에 따로 보여 준다
export const STAGE_LABEL: Record<string, string> = {
  scene: '🖼 배경',
  show: '🧍 보이기',
  hide: '🙈 숨기기',
  music: '🎵 음악',
  sound: '🔊 효과음',
  pause: '⏸ 멈춤',
  shake: '💥 흔들기',
  hud: '📟 HUD',
  fx: '✨ 화면 효과',
};
export const STAGE_ICON: Record<string, string> = { scene: '🖼', show: '🧍', hide: '🙈', music: '🎵', sound: '🔊', pause: '⏸', shake: '💥', hud: '📟', fx: '✨' };

// 흔들기 줄 (FEATURE 15). 렌파이에 번쩍(flash) 전환은 없어서 흰색 Fade로 쓴다
export const SHAKES: [ShakeKind, string][] = [['vpunch', '세로로 흔들기'], ['hpunch', '가로로 흔들기'], ['flash', '흰색 번쩍']];
export const FLASH_CODE = 'Fade(0.1, 0.0, 0.5, color="#fff")';
const shakeCode = (k?: ShakeKind) => (k === 'flash' ? FLASH_CODE : k ?? 'vpunch');
// 초: 1 → "1.0", 0.5 → "0.5" (렌파이 원고에서 초인 것이 보이게)
export const secs = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
// 멈출 때 페이드아웃 초 (없으면 1초, 예전 판과 같게)
export const DEFAULT_FADEOUT = 1;

// 뒤쪽은 효과 폴더의 그림 전환 (showpy img_fx.use). refreshEffects가 채운다
const BASE_TRANSITIONS: [string, string][] = [['', '바로'], ['dissolve', '서서히'], ['fade', '검게 페이드']];
export const TRANSITIONS: [string, string][] = [...BASE_TRANSITIONS];
export const imageFxCode = (name: string) => `img_fx.use("${name}")`;
// 그림 효과와 고친 값: img_fx.use("bands", 1.2, count=10, color="#c2185b") ↔ { name, time, args }. 값 이름은 u__ 없이 적는다
export interface ImageFxUse { name: string; time?: string; args: [string, string][] }
export function parseImageFx(trans?: string): ImageFxUse | null {
  const m = /^img_fx\.use\(\s*"(\w+)"\s*(.*)\)\s*$/.exec(trans ?? '');
  if (!m) return null;
  const out: ImageFxUse = { name: m[1], args: [] };
  for (const part of m[2].split(',').map((p) => p.trim()).filter(Boolean)) {
    const i = part.indexOf('=');
    const [k, v] = i < 0 ? ['time', part] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    if (k === 'time') out.time = v;
    else out.args.push([k, v.replace(/^(["'])(.*)\1$/, '$2')]);
  }
  return out;
}
export const formatImageFx = (u: ImageFxUse) =>
  `img_fx.use(${[`"${u.name}"`, ...(u.time ? [u.time] : []), ...u.args.map(([k, v]) => `${k}=${/^-?\d+(\.\d+)?$/.test(v) ? v : `"${v}"`}`)].join(', ')})`;
export const POSITIONS: [string, string][] = [['', '가운데'], ['left', '왼쪽'], ['right', '오른쪽']];

// showpy 화면 효과 칸의 값들
export const FX_BASE: [string, string][] = [
  ['', '그대로'], ['ascii', 'ASCII'], ['retro_term', '레트로 터미널'], ['gameboy', '게임보이'],
  // showpy pygaki 플러그인
  ['glitch', '글리치'], ['boil', '지글거림'], ['halftone', '망점'], ['hologram', '홀로그램'], ['nightvision', '나이트비전'], ['collage', '포토 콜라주'], ['shards', '파편 흩날림'],
  // showpy pygaki 플러그인, 5.7
  ['ripple', '일렁임'], ['waves', '물결'], ['wobble', '일렁거림'], ['filmgrain', '옛날 필름'], ['fisheye', '어안렌즈'],
  ['photocopy', '복사기'], ['relief', '양각'], ['gradmap', '그라데이션 맵'], ['rings', '동심원 어긋남'], ['camcorder', '옛 캠코더'],
  // showpy pygaki 플러그인
  ['macroblock', '블록 깨짐'],
  ['none', '효과 없음'], ['default', '기본으로'],
];

// 글 상자 (showpy, engine/text_box.rpy)
export const BOXES: [string, string][] = [['', '상자 없음'], ['bubble', '말풍선'], ['pill', '둥근 테두리'], ['media', '그림/영상']];
export const isMovieFile = (p?: string) => !!p && /\.(webm|ogv|mp4|mkv|avi|mpe?g)$/i.test(p);
// 투명 영상(왼쪽 색 + 오른쪽 투명도, 렌파이 side_mask): 이름이 mask_로 시작하는 영상 (pygaki 플러그인 stage·글 상자·선택지와 같은 규칙)
export const isMaskName = (p?: string) => isMovieFile(p) && /(^|\/)mask_[^/]*$/i.test(p!);
// 그 영상을 투명 영상으로 쓸지: 적은 값이 있으면 그 값, 없으면 이름으로
export const mediaMasked = (p?: string, mask?: boolean) => isMovieFile(p) && (mask ?? isMaskName(p));
export const TAILS: [string, string][] = [['', '꼬리 기본'], ['bottom', '꼬리 아래'], ['top', '꼬리 위'], ['left', '꼬리 왼쪽'], ['right', '꼬리 오른쪽'], ['none', '꼬리 없음']];
// 상자마다 꼬리 기본 (showpy say_style.box_styles 기본값과 같게)
export const boxTail = (s?: SayStyle) => (s?.box ? s.tail || (s.box === 'bubble' ? 'bottom' : 'none') : 'none');
export const FX_TRANS: [string, string][] = [['', '전환 기본'], ['tv', 'TV'], ['fade', '페이드'], ['none', '바로']];
export const FX_OVERLAY: [string, string][] = [['', '덮개 기본'], ['on', '덮개 켬'], ['off', '덮개 끔']];
export const FX_WARP: [string, string][] = [['', '휘어짐 그대로'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['default', '기본값']];
export const FX_CURSOR: [string, string][] = [['', '커서 그대로'], ['effect', '효과 받음'], ['overlay', '덮개 밑'], ['top', '효과 안 받음'], ['default', '기본으로']];

const warpVal = (v: string) => (v === 'default' ? '"default"' : v);

// 그림/영상의 자리·크기·회전 (pygaki editor에서 받아 적은 값). 대사와 선택지가 같이 씀
export function mediaPlace(x?: number, y?: number, zoom?: number, angle?: number): string[] {
  const a: string[] = [];
  if (x || y) a.push(`media_offset=(${x ?? 0}, ${y ?? 0})`);
  if (zoom && zoom !== 1) a.push(`media_zoom=${zoom}`);
  if (angle) a.push(`media_angle=${angle}`);
  return a;
}

// 글 상자 묶기·네 점 변형·그림 효과 (FEATURE 28). 대사와 선택지가 같이 씀
const pyNum = (n: number) => String(Math.round(n * 10000) / 10000);
const pyTuple = (a: number[]) => `(${a.map(pyNum).join(', ')})`;
export const hasQuad = (q?: number[]) => !!q && q.length === 8 && q.some((n) => Math.abs(n) > 1e-4);
export function mediaGroupArgs(link?: number[], quad?: number[], textQuad?: number[], fx?: string): string[] {
  const a: string[] = [];
  if (link && link.length === 4) a.push(`media_link=${pyTuple(link)}`);
  if (hasQuad(quad)) a.push(`media_quad=${pyTuple(quad!)}`);
  if (hasQuad(textQuad)) a.push(`media_text_quad=${pyTuple(textQuad!)}`);
  const u = parseImageFx(fx);
  if (u) {
    a.push(`media_fx=${pyStr(u.name)}`);
    if (u.time) a.push(`media_fx_time=${u.time}`);
    if (u.args.length) a.push(`media_fx_values={${u.args.map(([k, v]) => `${pyStr(k)}: ${/^-?\d+(\.\d+)?$/.test(v) ? v : pyStr(v)}`).join(', ')}}`);
  }
  return a;
}
// 대사·선택지에 묶기·변형·그림 효과 값이 있는지 (예전 플러그인 알림용)
export const sayHasGroup = (s?: SayStyle) => !!s && s.box === 'media' && !!(s.media_link || hasQuad(s.media_quad) || hasQuad(s.media_text_quad) || s.media_fx);

// 대사 줄의 괄호 안 값: fx="ascii", fx_warp=3...
export function fxArgs(f?: LineFx): string[] {
  if (!f) return [];
  const a: string[] = [];
  if (f.fx) a.push(`fx=${pyStr(f.fx)}`);
  if (f.transition) a.push(`fx_transition=${f.transition === 'none' ? 'None' : pyStr(f.transition)}`);
  if (f.overlay) a.push(`fx_overlay=${f.overlay === 'on' ? 'True' : 'False'}`);
  if (f.warp) a.push(`fx_warp=${warpVal(f.warp)}`);
  if (f.cursor) a.push(`fx_cursor=${pyStr(f.cursor)}`);
  if (f.exclude) a.push(`fx_exclude=(${f.exclude.map((g) => pyStr(g) + ',').join(' ')})`);
  return a;
}

// 대사 등장 효과. 이름과 한글 이름은 셰이더 파일에서 온다 (src/fx/*.glsl, @effect 줄)
// - 렌파이에 들어 있는 효과: src/fx/renpy_textshaders.glsl
// - showpy가 등록하는 효과: showpy/game/ui_kit/engine/text_effects.glsl (빌드할 때 그대로 가져옴). showpy가 없는 게임에서는 내보내지 않는다
// 효과 폴더(showpy ui_kit/effects)의 파일을 다시 읽으면 refreshEffects로 목록을 새로 채운다 (같은 배열을 고쳐 씀)
export const EFFECTS: [string, string][] = [];
// 끈 효과 (ui_kit/effects/effects_off.txt, LINK.md 8-2). 고르는 목록에서만 빠지고, 이미 쓴 줄에는 이름이 그대로 보인다
const EFFECTS_OFF = new Set<string>();
export const effectOff = (name: string) => EFFECTS_OFF.has(name);
// effects_off.txt 읽기: 한 줄에 이름 하나, # 뒤는 설명 (showpy text_effects.rpy _tfx_read_off와 같은 규칙)
export const parseEffectsOff = (text: string) =>
  text.replace(/﻿/g, '').split(/\r?\n/).map((row) => row.split('#')[0].trim()).filter(Boolean);
export function setEffectsOff(names: string[]) {
  EFFECTS_OFF.clear();
  names.forEach((n) => EFFECTS_OFF.add(n));
}
export function refreshEffects() {
  const on = (e: { name: string }) => !EFFECTS_OFF.has(e.name);
  EFFECTS.splice(0, EFFECTS.length, ['', '효과 없음'], ...[...RENPY_SHADERS, ...SHOWPY_SHADERS].filter(on).map((e): [string, string] => [e.name, e.label || e.name]));
  TRANSITIONS.splice(0, TRANSITIONS.length, ...BASE_TRANSITIONS, ...IMAGE_FX.filter(on).map((e): [string, string] => [imageFxCode(e.name), e.label || e.name]));
}
refreshEffects();
// 목록에서 뺀 효과. 예전 대본에 남은 값은 그대로 두고 내보낸다
// - typewriter, slowalpha: 렌파이에 그대로 있어서 showpy 없이도 돎
// - melt, mosh, flipin, led, split,  spin, glow, wipe, inkfill, punch, popin, (효과 폴더 샘플) drip: showpy가 한 글자씩 나오기로 받아 줌 (text_effects.rpy REMOVED_EFFECTS)
const REMOVED_RENPY = ['typewriter', 'slowalpha'];
export const REMOVED_EFFECTS = [...REMOVED_RENPY, 'melt', 'mosh', 'flipin', 'led', 'split', 'spin', 'glow', 'wipe', 'inkfill', 'punch', 'popin', 'drip'];
// 렌파이에 들어 있는 효과. 나머지는 showpy가 있어야 한다
export const RENPY_EFFECTS = [...RENPY_SHADERS.map((e) => e.name), ...REMOVED_RENPY];
// 효과 값의 이름들: "slidein:u__dir=90|shake" → ["slidein", "shake"]
export const effectNames = (e: string) => e.split('|').map((p) => p.split(':')[0].trim()).filter(Boolean);
// 효과 값을 자리(1번, 2번)와 값으로 나눠 읽고 다시 쓴다: "slidein:u__dir=90|shake" ↔ [{slidein, [[u__dir, 90]]}, {shake, []}]
// 이름 없이 순서로 적은 값("scatter:200")은 [['', '200']]으로 그대로 둔다
export interface EffectPart { name: string; args: [string, string][] }
export function parseEffect(e?: string): EffectPart[] {
  return (e ?? '')
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [name, ...rest] = p.split(':');
      return {
        name: name.trim(),
        args: rest.map((a): [string, string] => {
          const i = a.indexOf('=');
          return i < 0 ? ['', a.trim()] : [a.slice(0, i).trim(), a.slice(i + 1).trim()];
        }),
      };
    });
}
export const formatEffect = (parts: EffectPart[]) =>
  parts
    .filter((p) => p.name)
    .map((p) => [p.name, ...p.args.map(([k, v]) => (k ? `${k}=${v}` : v))].join(':'))
    .join('|') || undefined;

// 효과의 고칠 수 있는 값(막대, 색 칸). 효과 파일에 @param이 있으면 그 범위와 이름, 없으면 기본값에서 어림한다
// pair: 기본값이 두 값 "(3.0, 3.0)"(vec2, 렌파이 jitter)이라 막대 하나로 두 값을 같이 고침
// toggle: 0/1 값이라 체크 칸으로 (켜면 1.0, 끄면 값을 지움). r86: 렌파이 8.6부터 되는 값 (8.5 게임에서는 pygaki 플러그인이 뺌)
export interface EffectKnob { key: string; label: string; kind: 'num' | 'color'; min: number; max: number; step: number; def: string; pair?: boolean; toggle?: boolean; r86?: boolean }
// 렌파이 8.6에 더해진 효과 값 (효과 이름 → 값 이름). pygaki 플러그인 text_effects.rpy _JITTER_86과 같음
const R86_KNOBS: Record<string, string[]> = { jitter: ['u__duration', 'u__individual'] };
const TOGGLE_KNOBS = ['u__individual'];
export const R86_TIP = '렌파이 8.6부터 돼요. 렌파이 8.5 게임에서는 pygaki 플러그인이 이 값을 빼고 틀어요';
// 막대에 보일 숫자: "(3.0, 3.0)"이면 앞 값. 못 읽으면 0
export const knobNum = (v: string) => {
  const n = Number(v.replace(/^\s*\(/, '').split(',')[0]);
  return Number.isFinite(n) ? n : 0;
};
// 막대 값을 효과 값 글로: 두 값 막대면 "(n,n)" (렌파이 to_uniform_value가 괄호를 떼고 쉼표로 나눔)
export const knobText = (k: EffectKnob, n: number) => (k.pair ? `(${n},${n})` : String(n));
const KNOB_LABEL: Record<string, string> = {
  duration: '걸리는 시간', color: '색', zoom: '확대', shift: '밀림', angle: '각도', split: '갈라짐', speed: '속도', rotate: '기울기', rate: '빠르기',
  radius: '번짐 크기', distance: '거리', depth: '깊이', band: '띠', amount: '정도', strength: '세기', stagger: '차례 간격', spread: '벌어짐',
  overshoot: '넘침', hold: '계속하기', jitter: '흔들림', dir: '방향(도)', fade: '사라짐', noise: '노이즈', bounce: '튕김', amplitude: '높이',
  wavelength: '물결 길이', trail: '잔상', grain: '결', shake: '흔들림', pad: '여백', round: '둥글기', box: '상자 색', ink: '글자 색', tint: '색조',
  x: '가로', y: '세로', lag: '늦기', height: '높이', block: '칸 크기', line: '줄', scan: '주사선', tear: '찢김', offset: '어긋남', thick: '굵기',
  shade: '그늘', rise: '오름', pop: '튀어나옴', slide: '미끄러짐', span: '범위', mode: '방식', dim: '어둡기', width: '폭', from: '처음 크기',
};
const niceStep = (span: number) => (span >= 50 ? 1 : span >= 5 ? 0.1 : 0.01);
export function effectKnobs(name: string, preview = false): EffectKnob[] {
  const e = shaderEffect(name, preview);
  if (!e) return [];
  const ranges = new Map(e.params.map(([k, lo, hi, label]) => [k, { lo, hi, label }]));
  return e.uniforms.flatMap(([key, def]): EffectKnob[] => {
    const short = key.replace(/^u__/, '');
    const r = ranges.get(key);
    const label = r?.label ?? KNOB_LABEL[short] ?? short;
    if (def.startsWith('#')) return [{ key, label, kind: 'color', min: 0, max: 0, step: 0, def }];
    // 두 값 "(3.0, 3.0)"은 막대 하나로, 그 밖에 숫자로 못 읽는 값은 막대를 안 만듦 (예전에는 NaN 막대)
    const two = /^\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/.exec(def);
    const d = two ? Number(two[1]) : Number(def);
    if (!Number.isFinite(d)) return [];
    let lo = 0;
    let hi = 1;
    if (r) [lo, hi] = [r.lo, r.hi];
    else if (['dir', 'angle'].includes(short)) [lo, hi] = [0, 360];
    else if (short === 'rotate') [lo, hi] = [-180, 180];
    else if (d < 0) [lo, hi] = [d * 3, -d * 3];
    else if (d > 0) hi = d <= 1 ? Math.max(1, d * 2) : d * 3;
    const more = { ...(two ? { pair: true } : {}), ...(TOGGLE_KNOBS.includes(key) ? { toggle: true } : {}), ...(R86_KNOBS[name]?.includes(key) ? { r86: true } : {}) };
    return [{ key, label, kind: 'num', min: lo, max: hi, step: niceStep(hi - lo), def, ...more }];
  });
}

// 렌파이에 원래 있는 효과만 썼는지 (showpy 없이 내보낼 수 있는지)
export const renpyOnlyEffect = (e: string) => effectNames(e).every((n) => RENPY_EFFECTS.includes(n));

// 글자가 하나씩 나올 때만 보이는 효과(@cps). 글자/초를 비워도 효과가 보이게 기본값을 쓴다 (물결, 떨림, 빛 번짐, 일렁임, VHS는 한 번에 나와도 보여서 뺀다)
export const DEFAULT_CPS = 30;
const typed = (n: string) => REMOVED_EFFECTS.includes(n) || [...RENPY_SHADERS, ...SHOWPY_SHADERS].some((e) => e.cps && e.name === n);
// 글의 일부에만 건 효과({shader=이름}글{/shader})의 이름들. text는 텍스트 태그를 켰을 때만 넘긴다
export const tagEffectNames = (text?: string) => (text ? shaderTags(text).flatMap(effectNames) : []);
export const lineCps = (s?: SayStyle, text?: string) =>
  s?.cps ?? ((s?.effect && effectNames(s.effect).some(typed)) || tagEffectNames(text).some(typed) ? DEFAULT_CPS : undefined);

// showpy가 없는 게임에서는 렌파이 원래 이름으로 내보낸다. 그러면 플러그인 없이도 오류가 나지 않는다
const NATIVE: Record<keyof SayStyle, string> = {
  size: 'what_size', font: 'what_font', color: 'what_color', cps: 'what_slow_cps', effect: 'what_textshader',
  sound: '', // 대사 소리는 플러그인의 대사 소리 콜백이 받아서 연결을 켰을 때만
  box: '', tail: '', box_rotate: '', // 글 상자는 showpy가 있어야 해서 원래 이름이 없다 (내보내지 않음)
  media: '', media_fit: '', media_x: '', media_y: '', media_zoom: '', media_angle: '', media_mask: '', media_alpha: '',
  media_link: '', media_quad: '', media_text_quad: '', media_fx: '',
  name_size: 'who_size', name_font: 'who_font', name_color: 'who_color',
  x: 'what_xpos', y: 'what_ypos', name_x: 'namebox_xpos', name_y: 'namebox_ypos',
};

// 대사 줄의 괄호 안 값: size=30, cps=20... 위치는 showpy가 뒤에 덧붙이는 순서와 맞춰 맨 뒤에 둔다
export function sayArgs(s0?: SayStyle, native = false, text?: string, oldGroup = false): string[] {
  const tagged = tagEffectNames(text).length > 0;
  if (!s0 && !tagged) return [];
  const s: SayStyle = s0 ?? {};
  const a: string[] = [];
  const name = (k: keyof SayStyle) => (native ? NATIVE[k] : k);
  const num = (k: keyof SayStyle) => s[k] !== undefined && a.push(`${name(k)}=${s[k]}`);
  const str = (k: keyof SayStyle) => s[k] && !(native && k === 'effect' && !renpyOnlyEffect(String(s[k]))) && a.push(`${name(k)}=${pyStr(String(s[k]))}`);
  num('size');
  str('font');
  str('color');
  const cps = lineCps(s, text);
  if (cps !== undefined) a.push(`${name('cps')}=${cps}`);
  // 대사 소리: 렌파이 원래 이름 cb_typing_sound (pygaki 플러그인 custom_ui의 대사 소리 콜백이 받음). ''이면 이 줄은 끔
  if (!native && s.sound !== undefined) a.push(`cb_typing_sound=${s.sound ? pyStr(s.sound) : 'None'}`);
  const before = a.length;
  str('effect');
  // 글의 일부에만 효과({shader=})를 쓴 줄: 줄에 등장 효과가 없으면 렌파이가 그 줄에서 멈춰서, 한 글자씩 나오기를 넣는다
  if (tagged && a.length === before) a.push(`${name('effect')}="typewriter"`);
  if (!native && s.box === 'media') {
    // 그림/영상 상자 (FEATURE 24): 파일이 없으면 내보내지 않음 (플러그인이 멈추지 않게)
    if (s.media) {
      a.push(`box="media"`, `media=${pyStr(s.media)}`);
      if (s.media_fit === 'image') a.push(`media_fit="image"`);
      a.push(...mediaPlace(s.media_x, s.media_y, s.media_zoom, s.media_angle));
      // 투명 영상 (FEATURE 26): 예전 플러그인(4.14~4.15)도 알게 늘 적는다. 그림이면 적지 않음
      if (isMovieFile(s.media)) {
        if (mediaMasked(s.media, s.media_mask)) a.push('media_mask=True');
        else if (isMaskName(s.media)) a.push('media_mask=False');
      }
      if (s.media_alpha !== undefined && s.media_alpha < 1) a.push(`media_alpha=${s.media_alpha}`);
      if (!oldGroup) a.push(...mediaGroupArgs(s.media_link, s.media_quad, s.media_text_quad, s.media_fx));
      if (s.box_rotate) a.push(`box_rotate=${s.box_rotate}`);
    }
  } else if (!native && s.box) {
    a.push(`box=${pyStr(s.box)}`);
    if (s.tail) a.push(`tail=${s.tail === 'none' ? 'None' : pyStr(s.tail)}`);
    if (s.box_rotate) a.push(`box_rotate=${s.box_rotate}`);
  }
  num('name_size');
  str('name_font');
  str('name_color');
  num('x');
  num('y');
  num('name_x');
  num('name_y');
  return a;
}

// 화면 효과 연출 줄의 명령. 줄이 여러 개면 \n으로 잇는다
function fxCode(f?: LineFx): string | null {
  if (!f) return null;
  const out: string[] = [];
  if (f.fx) {
    const opt: string[] = [];
    if (f.overlay) opt.push(`overlay=${f.overlay === 'on' ? 'True' : 'False'}`);
    if (f.transition) opt.push(`transition=${f.transition === 'none' ? 'None' : pyStr(f.transition)}`);
    if (f.cursor) opt.push(`cursor=${pyStr(f.cursor)}`);
    const tail = opt.join(', ');
    out.push(f.fx === 'default' ? `$ screen_fx.clear(${tail})` : `$ screen_fx.use(${[pyStr(f.fx), tail].filter(Boolean).join(', ')})`);
  } else {
    if (f.overlay) out.push(`$ screen_fx.set_overlay(${f.overlay === 'on' ? 'True' : 'False'})`);
    if (f.cursor) out.push(`$ screen_fx.set_cursor(${pyStr(f.cursor)})`);
  }
  if (f.warp) out.push(`$ screen_fx.set_warp(${warpVal(f.warp)})`);
  return out.length ? out.join('\n') : null;
}

// 이미지 이름 한 칸: 공백 정리
const words = (s?: string) => (s ?? '').trim().replace(/\s+/g, ' ');
const pyStr = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
// 파일 이름만 적으면 game/audio 폴더에서 찾는다
const audioPath = (f: string) => (f.includes('/') ? f : 'audio/' + f);
// 지금 곡 자리 옮기기 (FEATURE 37): renpy.music.seek는 렌파이 8.6부터라 8.5 게임에서는 아무 일도 안 하게
export const seekCode = (n: number) => `$ renpy.music.seek(${secs(n)}) if hasattr(renpy.music, "seek") else None`;

// 멈추기: 페이드아웃이 0이면 바로
const stopCode = (ch: string, fo?: number) => {
  const f = fo ?? DEFAULT_FADEOUT;
  return f > 0 ? `stop ${ch} fadeout ${secs(f)}` : `stop ${ch}`;
};

export function imageName(l: Line) {
  const k = l.kind ?? 'char';
  if (k === 'bg') return words(l.image) ? 'bg ' + words(l.image) : '';
  if (k === 'char') return l.who ? [l.who, words(l.attr)].filter(Boolean).join(' ') : '';
  return words(l.image);
}

// code가 null이면 칸이 덜 채워진 것이고, problem에 이유가 있다
// screens: HUD 줄이 화면 이름을 찾을 목록 (project.screens)
export function stageCode(l: Line, screens?: ScreenDef[]): { code: string | null; problem: string | null } {
  const w = l.trans ? ` with ${l.trans}` : '';
  const need = (what: string) => ({ code: null, problem: what });
  switch (l.type) {
    case 'scene': {
      const n = words(l.image);
      return { code: `scene${n ? ' bg ' + n : ''}${w}`, problem: null };
    }
    case 'show': {
      const n = imageName(l);
      if (!n) return need(l.kind === 'char' || !l.kind ? '보일 캐릭터를 골라 주세요' : '보일 이미지 이름을 적어 주세요');
      const z = l.zorder !== undefined ? ` zorder ${l.zorder}` : '';
      const bh = l.behind?.trim() ? ` behind ${l.behind.trim()}` : '';
      return { code: `show ${n}${l.at ? ' at ' + l.at : ''}${z}${bh}${w}`, problem: null };
    }
    case 'hide': {
      const k = l.kind ?? 'char';
      const tag = k === 'bg' ? 'bg' : k === 'char' ? l.who : words(l.image).split(' ')[0];
      if (!tag) return need(k === 'char' ? '숨길 캐릭터를 골라 주세요' : '숨길 이미지 이름을 적어 주세요');
      return { code: `hide ${tag}${w}`, problem: null };
    }
    case 'music': {
      if (l.stop) return { code: stopCode('music', l.fadeout), problem: null };
      if (l.seek !== undefined) return { code: seekCode(l.seek), problem: null };
      if (!l.file?.trim()) return need('음악 파일 이름을 적어 주세요');
      const fi = l.fadein ? ` fadein ${secs(l.fadein)}` : '';
      const lp = l.loop === true ? ' loop' : l.loop === false ? ' noloop' : '';
      const from = l.from ? `<from ${secs(l.from)}>` : '';
      return { code: `${l.queue ? 'queue' : 'play'} music ${pyStr(from + audioPath(l.file.trim()))}${fi}${lp}`, problem: null };
    }
    case 'sound': {
      const ch = l.channel ?? 'sound';
      if (l.stop) return { code: stopCode(ch, l.fadeout), problem: null };
      if (!l.file?.trim()) return need('효과음 파일 이름을 적어 주세요');
      return { code: `play ${ch} ${pyStr(audioPath(l.file.trim()))}`, problem: null };
    }
    case 'pause':
      return { code: l.secs ? `pause ${secs(l.secs)}` : 'pause', problem: null };
    case 'shake':
      return { code: `with ${shakeCode(l.shake)}`, problem: null };
    case 'hud': {
      // HUD 보이기/숨기기 (FEATURE 18)
      const sc = screens?.find((s) => s.id === l.screen);
      if (!sc) return need(l.stop ? '숨길 HUD를 골라 주세요' : '보일 HUD를 골라 주세요');
      if (sc.kind !== 'hud') return need(`"${sc.title || sc.name}"은 전체 화면이에요. [화면] 탭에서 HUD로 바꿔 주세요`);
      return { code: `${l.stop ? 'hide' : 'show'} screen ${sc.name}`, problem: null };
    }
    case 'fx': {
      const c = fxCode(l.fx);
      return c ? { code: c, problem: null } : need('바꿀 값을 골라 주세요');
    }
  }
  return { code: null, problem: null };
}

// 렌파이 이미지 이름에 쓰면 탈이 나기 쉬운 글자(한글, 공백 외 기호)
export function badImageName(l: Line) {
  if (l.type !== 'scene' && l.type !== 'show' && l.type !== 'hide') return false;
  if (l.type !== 'scene' && (l.kind ?? 'char') === 'char') return l.type === 'show' && !!l.attr && !/^[A-Za-z0-9_ -]*$/.test(l.attr.trim());
  return !/^[A-Za-z0-9_ -]*$/.test(l.image?.trim() ?? '');
}
